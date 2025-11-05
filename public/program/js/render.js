import { noteStore } from './state.js';
import { calculateLayout, escapeHtml } from './utils/noteUtils.js';

class NoteRenderer {
  constructor() {
    this.container = null;
    this.noteTemplate = null;
    this.checklistTemplate = null;
    this.resizeObserver = null;
    this.pendingRender = null;
  }

  initialize() {
    this.container = document.getElementById('notes-container');
    this.noteTemplate = document.getElementById('note-template');
    this.checklistTemplate = document.getElementById('checklist-item-template');

    if (!this.container || !this.noteTemplate || !this.checklistTemplate) {
      throw new Error('Required DOM elements not found');
    }

    // 컨테이너 크기 변경 감지
    this.resizeObserver = new ResizeObserver(this.debouncedRender.bind(this));
    this.resizeObserver.observe(this.container);

    // 상태 변경 구독
    noteStore.on('stateChange', ({ property }) => {
      if (['notes', 'currentFilter', 'currentSort', 'searchQuery'].includes(property)) {
        this.debouncedRender();
      }
    });
  }

  debouncedRender() {
    if (this.pendingRender) {
      cancelAnimationFrame(this.pendingRender);
    }
    this.pendingRender = requestAnimationFrame(() => this.render());
  }

  render() {
    if (!this.container) return;

    const notes = noteStore.getFilteredAndSortedNotes();
    
    if (notes.length === 0) {
      this.renderEmptyState();
      return;
    }

    const containerWidth = this.container.clientWidth || 800;
    const layoutedNotes = calculateLayout(notes, containerWidth);
    
    const fragment = document.createDocumentFragment();
    const existingNotes = new Set();

    layoutedNotes.forEach(noteData => {
      const existingNote = this.container.querySelector(`[data-id="${noteData.id}"]`);
      if (existingNote) {
        this.updateNoteElement(existingNote, noteData);
        existingNotes.add(noteData.id);
      } else {
        fragment.appendChild(this.createNoteElement(noteData));
        existingNotes.add(noteData.id);
      }
    });

    // 제거된 노트 정리
    this.container.querySelectorAll('.note').forEach(noteEl => {
      if (!existingNotes.has(noteEl.dataset.id)) {
        noteEl.addEventListener('animationend', () => noteEl.remove());
        noteEl.classList.add('note-exit');
      }
    });

    if (fragment.children.length > 0) {
      this.container.appendChild(fragment);
    }
  }

  createNoteElement(noteData) {
    const element = this.noteTemplate.content.cloneNode(true).firstElementChild;
    element.dataset.id = noteData.id;
    
    this.updateNoteElement(element, noteData);
    
    if (noteData.isNew) {
      element.classList.add('note-entering');
      element.addEventListener('animationend', () => {
        element.classList.remove('note-entering');
      }, { once: true });
    }

    return element;
  }

  updateNoteElement(element, noteData) {
    // 위치 및 크기 업데이트
    this.updateNotePosition(element, noteData);
    
    // 컨텐츠 업데이트
    const content = element.querySelector('.note-content');
    if (content && content.value !== noteData.text) {
      content.value = noteData.text || '';
    }

    // 체크리스트 업데이트
    this.updateNoteChecklist(element, noteData);

    // 스타일 업데이트
    element.style.backgroundColor = noteData.color || '';
    element.style.zIndex = noteData.zIndex || 1;
  }

  updateNotePosition(element, { x, y, width, height }) {
    const transform = `translate(${x}px, ${y}px)`;
    if (element.style.transform !== transform) {
      element.style.transform = transform;
    }
    if (element.style.width !== `${width}px`) {
      element.style.width = `${width}px`;
    }
    if (element.style.height !== `${height}px`) {
      element.style.height = `${height}px`;
    }
  }

  updateNoteChecklist(element, noteData) {
    const container = element.querySelector('.note-checklist-container');
    if (!container) return;

    const existingItems = new Map();
    container.querySelectorAll('.checklist-item').forEach(item => {
      existingItems.set(item.dataset.id, item);
    });

    const fragment = document.createDocumentFragment();
    noteData.checklist.forEach(item => {
      const existing = existingItems.get(item.id);
      if (existing) {
        this.updateChecklistItem(existing, item);
        existingItems.delete(item.id);
      } else {
        fragment.appendChild(this.createChecklistItem(item));
      }
    });

    // 제거된 아이템 정리
    existingItems.forEach(item => item.remove());

    if (fragment.children.length > 0) {
      container.appendChild(fragment);
    }
  }

  createChecklistItem(item) {
    const element = this.checklistTemplate.content.cloneNode(true).firstElementChild;
    element.dataset.id = item.id;
    this.updateChecklistItem(element, item);
    return element;
  }

  updateChecklistItem(element, item) {
    const checkbox = element.querySelector('.note-checklist-item-check');
    const input = element.querySelector('.note-checklist-item-text');
    
    if (checkbox) checkbox.checked = !!item.done;
    if (input && input.value !== item.text) {
      input.value = escapeHtml(item.text || '');
    }
  }

  renderEmptyState() {
    this.container.innerHTML = `
      <div class="empty-state" role="status">
        <svg class="empty-state-icon" viewBox="0 0 24 24">
          <path d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3h2m-2 3h2m-2 3h2m-2 3h2m-2 3h2"></path>
        </svg>
        <h3>메모가 없습니다</h3>
        <p>새 메모를 추가하여 시작하세요</p>
      </div>
    `;
  }

  cleanup() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    if (this.pendingRender) {
      cancelAnimationFrame(this.pendingRender);
    }
  }
}

const renderer = new NoteRenderer();
export const initializeRenderer = () => renderer.initialize();
export const renderNotes = () => renderer.render();

export function renderColorFilters() {
  const container = document.getElementById('color-filter-container');
  if (!container) return;
  container.querySelectorAll('.color-filter-btn:not([data-color="all"])').forEach(b => b.remove());
  state.colors.forEach(c => {
    const btn = document.createElement('button');
    btn.className = 'color-filter-btn';
    btn.style.backgroundColor = c.hex;
    btn.dataset.color = c.hex;
    btn.title = c.name;
    btn.addEventListener('click', () => {
      state.currentFilter = c.hex;
      updateActiveFilterButton();
      renderNotes();
    });
    container.appendChild(btn);
  });
  updateActiveFilterButton();
}

export function updateActiveFilterButton() {
  const container = document.getElementById('color-filter-container');
  if (!container) return;
  container.querySelectorAll('.color-filter-btn').forEach(b => b.classList.toggle('active', b.dataset.color === state.currentFilter));
  const allBtn = container.querySelector('[data-color="all"]');
  if (allBtn) allBtn.classList.toggle('active', state.currentFilter === 'all');
}

export function renderColorList() {
  const container = document.getElementById('color-list-container');
  if (!container) return;
  container.innerHTML = '';
  state.colors.forEach(color => {
    const item = document.createElement('div');
    item.className = 'color-item';
    item.innerHTML = `<div class="color-swatch" style="background:${color.hex}"></div><div class="color-name">${color.name}</div><div class="color-hex">${color.hex}</div><div class="color-actions"><button class="delete">삭제</button></div>`;
    item.querySelector('.delete').addEventListener('click', () => {
      state.colors = state.colors.filter(c => c.id !== color.id);
      saveColors();
      // update notes
      state.notes.forEach(n => { if (n.color === color.hex) n.color = state.colors[0]?.hex || '#FDE047'; });
      saveNotes();
      renderColorList(); renderColorFilters(); renderNotes();
      showToast('색상이 삭제되었습니다.', 'info');
    });
    container.appendChild(item);
  });
}
