import { state, generateId, addNote, toggleShrink, setSearch, updateSort, setFilter } from './state.js';
import { saveNotes, saveColors, loadColors } from './storage.js';
import { renderNotes, renderColorFilters, renderColorList, updateActiveFilterButton } from './render.js';
import { debounce, showToast } from './utils.js';

// 키보드 네비게이션 핸들러
const handleKeyboardNavigation = (e) => {
  const note = e.target.closest('.note');
  if (!note) return;

  // Esc키로 메모 내용 편집 취소
  if (e.key === 'Escape') {
    e.target.blur();
    return;
  }

  // 메모 간 이동
  if (e.altKey) {
    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        focusNearestNote(note, 'left');
        break;
      case 'ArrowRight':
        e.preventDefault();
        focusNearestNote(note, 'right');
        break;
      case 'ArrowUp':
        e.preventDefault();
        focusNearestNote(note, 'up');
        break;
      case 'ArrowDown':
        e.preventDefault();
        focusNearestNote(note, 'down');
        break;
    }
  }

  // 메모 내 요소 간 이동
  if (e.key === 'Tab') {
    const focusableElements = note.querySelectorAll('button, textarea, input');
    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];

    if (e.shiftKey && e.target === firstFocusable) {
      e.preventDefault();
      lastFocusable.focus();
    } else if (!e.shiftKey && e.target === lastFocusable) {
      e.preventDefault();
      firstFocusable.focus();
    }
  }
};

// 가장 가까운 메모로 포커스 이동
const focusNearestNote = (currentNote, direction) => {
  const notes = Array.from(document.querySelectorAll('.note'));
  if (notes.length <= 1) return;

  const currentRect = currentNote.getBoundingClientRect();
  const currentCenter = {
    x: currentRect.left + currentRect.width / 2,
    y: currentRect.top + currentRect.height / 2
  };

  let nearest = null;
  let minDistance = Infinity;

  notes.forEach(note => {
    if (note === currentNote) return;
    const rect = note.getBoundingClientRect();
    const center = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2
    };

    const dx = center.x - currentCenter.x;
    const dy = center.y - currentCenter.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    switch (direction) {
      case 'left':
        if (center.x < currentCenter.x && Math.abs(dy) < rect.height) {
          if (distance < minDistance) {
            minDistance = distance;
            nearest = note;
          }
        }
        break;
      case 'right':
        if (center.x > currentCenter.x && Math.abs(dy) < rect.height) {
          if (distance < minDistance) {
            minDistance = distance;
            nearest = note;
          }
        }
        break;
      case 'up':
        if (center.y < currentCenter.y && Math.abs(dx) < rect.width) {
          if (distance < minDistance) {
            minDistance = distance;
            nearest = note;
          }
        }
        break;
      case 'down':
        if (center.y > currentCenter.y && Math.abs(dx) < rect.width) {
          if (distance < minDistance) {
            minDistance = distance;
            nearest = note;
          }
        }
        break;
    }
  });

  if (nearest) {
    const focusableEl = nearest.querySelector('textarea') || nearest;
    focusableEl.focus();
  }
};

// 메모 관련 키보드 단축키 설정
const setupNoteKeyboardShortcuts = (noteEl) => {
  const handlers = {
    'Delete': (e) => {
      if (e.target.tagName !== 'TEXTAREA' && e.target.tagName !== 'INPUT') {
        const deleteBtn = noteEl.querySelector('.note-delete-btn');
        if (deleteBtn) deleteBtn.click();
      }
    },
    'c': (e) => {
      if (e.ctrlKey && e.target.tagName !== 'TEXTAREA' && e.target.tagName !== 'INPUT') {
        const addChecklistBtn = noteEl.querySelector('.note-add-checklist-btn');
        if (addChecklistBtn) addChecklistBtn.click();
      }
    },
    ' ': (e) => {
      if (e.target.classList.contains('note-checklist-item-check')) {
        e.preventDefault();
        e.target.click();
      }
    }
  };

  noteEl.addEventListener('keydown', (e) => {
    const handler = handlers[e.key];
    if (handler) handler(e);
  });
};

export function attachToolbarEvents() {
  const addNoteBtn = document.getElementById('add-note-btn') || document.getElementById('new-note-btn');
  const searchInput = document.getElementById('search-input');
  const sortBtn = document.getElementById('sort-btn');
  const sortLabel = document.getElementById('sort-label');
  const toggleSizeBtn = document.getElementById('toggle-size-btn');
  const toggleSizeLabel = document.getElementById('toggle-size-label');
  const manageColorsBtn = document.getElementById('manage-colors-btn');
  const colorModal = document.getElementById('color-modal');
  const closeColorModalBtn = document.getElementById('close-color-modal');
  const colorPickerInput = document.getElementById('color-picker-input');
  const colorNameInput = document.getElementById('color-name-input');
  const addColorBtn = document.getElementById('add-color-btn');

  if (addNoteBtn) {
    addNoteBtn.addEventListener('click', () => {
      const offset = (state.notes.length % 10) * 20;
      const newNote = {
        id: generateId(),
        text: '',
        checklist: [],
        x: 50 + offset, y: 100 + offset,
        width: 256, height: 256,
        color: state.currentFilter !== 'all' ? state.currentFilter : (state.colors[0]?.hex || '#FDE047'),
        zIndex: ++state.zIndexCounter,
        createdAt: Date.now(),
        isNew: true
      };
      addNote(newNote);
      saveNotes();
      renderNotes();
      showToast('새 메모 추가', 'success');
    });
  }

  if (searchInput) {
    searchInput.addEventListener('input', debounce(() => {
      setSearch(searchInput.value || '');
      renderNotes();
    }, 250));
  }

  if (sortBtn && sortLabel) {
    sortBtn.addEventListener('click', () => {
      const next = state.currentSort === 'newest' ? 'oldest' : state.currentSort === 'oldest' ? 'alphabetical' : 'newest';
      updateSort(next);
      sortLabel.textContent = next === 'newest' ? '최근 순' : next === 'oldest' ? '오래된 순' : '가나다 순';
      renderNotes();
    });
  }

  if (toggleSizeBtn && toggleSizeLabel) {
    toggleSizeBtn.addEventListener('click', () => {
      const shrunk = toggleShrink();
      state.notes.forEach(n => {
        if (shrunk) { n.originalWidth = n.originalWidth || n.width; n.originalHeight = n.originalHeight || n.height; n.width = 200; n.height = 200; }
        else { n.width = n.originalWidth || 256; n.height = n.originalHeight || 256; }
      });
      saveNotes(); renderNotes();
      toggleSizeLabel.textContent = shrunk ? '확대' : '축소';
      showToast(shrunk ? '모두 축소' : '원상복구', 'info');
    });
  }

  const allColorBtn = document.querySelector('[data-color="all"]');
  if (allColorBtn) {
    allColorBtn.addEventListener('click', () => { setFilter('all'); updateActiveFilterButton(); renderNotes(); });
  }

  if (manageColorsBtn && colorModal) {
    manageColorsBtn.addEventListener('click', () => { renderColorList(); colorModal.classList.remove('hidden'); });
  }
  if (closeColorModalBtn && colorModal) closeColorModalBtn.addEventListener('click', () => colorModal.classList.add('hidden'));
  if (colorModal) colorModal.addEventListener('click', (e) => { if (e.target === colorModal) colorModal.classList.add('hidden'); });

  if (addColorBtn && colorPickerInput && colorNameInput) {
    addColorBtn.addEventListener('click', () => {
      const hex = colorPickerInput.value;
      const name = colorNameInput.value.trim() || hex;
      if (!state.colors.some(c => c.hex.toLowerCase() === hex.toLowerCase())) {
        state.colors.push({ id: generateId(), hex, name });
        saveColors(); renderColorList(); renderColorFilters(); showToast('색상 추가', 'success');
      } else alert('이미 존재');
    });
  }

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.color-palette-wrapper')) {
      document.querySelectorAll('.note-color-palette').forEach(p => p.classList.add('hidden'));
    }
  });
}

// --- Delegated interaction handlers (drag / resize / click) ---
let activeNote = null;
let action = null; // 'drag' | 'resize'
let startX = 0, startY = 0, startLeft = 0, startTop = 0, startWidth = 0, startHeight = 0;

const onDragStart = (el, clientX, clientY) => {
  activeNote = el;
  action = 'drag';
  startX = clientX; startY = clientY;
  startLeft = activeNote.offsetLeft; startTop = activeNote.offsetTop;

  const noteData = state.notes.find(n => n.id === activeNote.dataset.id);
  if (noteData) {
    noteData.zIndex = ++state.zIndexCounter;
    activeNote.style.zIndex = noteData.zIndex;
    saveNotes();
  }
  activeNote.classList.add('dragging', 'shadow-2xl');
};

const onResizeStart = (el, clientX, clientY) => {
  activeNote = el;
  action = 'resize';
  startX = clientX; startY = clientY;
  startWidth = activeNote.offsetWidth; startHeight = activeNote.offsetHeight;
  activeNote.classList.add('dragging');
};

const onPointerMove = (clientX, clientY) => {
  if (!activeNote) return;
  const dx = clientX - startX;
  const dy = clientY - startY;
  if (action === 'drag') {
    const newLeft = startLeft + dx;
    const newTop = startTop + dy;
    activeNote.style.left = `${newLeft}px`;
    activeNote.style.top = `${newTop}px`;
  } else if (action === 'resize') {
    const newWidth = Math.max(200, startWidth + dx);
    const newHeight = Math.max(200, startHeight + dy);
    activeNote.style.width = `${newWidth}px`;
    activeNote.style.height = `${newHeight}px`;
  }
};

const onPointerUp = () => {
  if (!activeNote) return;
  const noteData = state.notes.find(n => n.id === activeNote.dataset.id);
  if (noteData) {
    if (action === 'drag') {
      noteData.x = activeNote.offsetLeft;
      noteData.y = activeNote.offsetTop;
    } else if (action === 'resize') {
      noteData.width = activeNote.offsetWidth;
      noteData.height = activeNote.offsetHeight;
    }
    saveNotes();
  }
  activeNote.classList.remove('dragging', 'shadow-2xl');
  activeNote = null; action = null;
};

// Pointer event bridging
document.addEventListener('mousedown', (e) => {
  const resizeHandle = e.target.closest('.resize-handle');
  const noteEl = e.target.closest('.note');
  if (resizeHandle && noteEl) {
    e.preventDefault();
    onResizeStart(noteEl, e.clientX, e.clientY);
    document.addEventListener('mousemove', onDocMouseMove);
    document.addEventListener('mouseup', onDocMouseUp);
  } else if (noteEl && !e.target.closest('textarea, input, button')) {
    e.preventDefault();
    onDragStart(noteEl, e.clientX, e.clientY);
    document.addEventListener('mousemove', onDocMouseMove);
    document.addEventListener('mouseup', onDocMouseUp);
  }
});

document.addEventListener('touchstart', (e) => {
  const touch = e.touches[0];
  const resizeHandle = e.target.closest('.resize-handle');
  const noteEl = e.target.closest('.note');
  if (resizeHandle && noteEl) {
    e.preventDefault();
    onResizeStart(noteEl, touch.clientX, touch.clientY);
    document.addEventListener('touchmove', onDocTouchMove, {passive:false});
    document.addEventListener('touchend', onDocTouchEnd);
  } else if (noteEl && !e.target.closest('textarea, input, button')) {
    e.preventDefault();
    onDragStart(noteEl, touch.clientX, touch.clientY);
    document.addEventListener('touchmove', onDocTouchMove, {passive:false});
    document.addEventListener('touchend', onDocTouchEnd);
  }
});

function onDocMouseMove(e) { onPointerMove(e.clientX, e.clientY); }
function onDocMouseUp() { onPointerUp(); document.removeEventListener('mousemove', onDocMouseMove); document.removeEventListener('mouseup', onDocMouseUp); }
function onDocTouchMove(e) { e.preventDefault(); const t = e.touches[0]; onPointerMove(t.clientX, t.clientY); }
function onDocTouchEnd() { onPointerUp(); document.removeEventListener('touchmove', onDocTouchMove); document.removeEventListener('touchend', onDocTouchEnd); }

// Delegated click handlers for note controls
document.addEventListener('click', (e) => {
  const deleteBtn = e.target.closest('.note-delete-btn');
  if (deleteBtn) {
    const noteEl = deleteBtn.closest('.note');
    const id = noteEl?.dataset.id;
    if (id && confirm('정말로 이 메모를 삭제하시겠습니까?')) {
      state.notes = state.notes.filter(n => n.id !== id);
      saveNotes();
      renderNotes();
      showToast('메모가 삭제되었습니다.', 'info');
    }
    return;
  }

  const frontBtn = e.target.closest('.note-front-btn');
  if (frontBtn) {
    const noteEl = frontBtn.closest('.note');
    const id = noteEl?.dataset.id; const noteData = state.notes.find(n=>n.id===id);
    if (noteData) { noteData.zIndex = ++state.zIndexCounter; noteEl.style.zIndex = noteData.zIndex; saveNotes(); }
    return;
  }

  const backBtn = e.target.closest('.note-back-btn');
  if (backBtn) {
    const noteEl = backBtn.closest('.note');
    const id = noteEl?.dataset.id; const noteData = state.notes.find(n=>n.id===id);
    if (noteData) { noteData.zIndex = 0; noteEl.style.zIndex = 0; saveNotes(); }
    return;
  }

  const colorBtn = e.target.closest('.note-color-btn');
  if (colorBtn) {
    e.stopPropagation();
    const palette = colorBtn.closest('.note')?.querySelector('.note-color-palette');
    if (!palette) return;
    document.querySelectorAll('.note-color-palette').forEach(p => { if (p!==palette) p.classList.add('hidden'); });
    palette.classList.toggle('hidden');
    return;
  }

  const addChecklistBtn = e.target.closest('.note-add-checklist-btn');
  if (addChecklistBtn) {
    const noteEl = addChecklistBtn.closest('.note');
    const id = noteEl?.dataset.id; const noteData = state.notes.find(n=>n.id===id);
    if (noteData) {
      const newItem = { id: generateId(), text: '', done: false };
      noteData.checklist.push(newItem);
      saveNotes(); renderNotes();
    }
    return;
  }
});

// export placeholder to keep API compatibility if other modules expect it
export function attachNoteInteractionEvents() {
  document.addEventListener('keydown', handleKeyboardNavigation);
  
  const notes = document.querySelectorAll('.note');
  notes.forEach(noteEl => {
    setupNoteKeyboardShortcuts(noteEl);
    
    // ARIA 라이브 리전 설정
    const content = noteEl.querySelector('.note-content');
    if (content) {
      content.setAttribute('aria-live', 'polite');
      content.setAttribute('role', 'textbox');
    }

    // 체크리스트 아이템 접근성
    const checklistItems = noteEl.querySelectorAll('.checklist-item');
    checklistItems.forEach((item, index) => {
      const check = item.querySelector('.note-checklist-item-check');
      const text = item.querySelector('.note-checklist-item-text');
      if (check && text) {
        const id = `checklist-${noteEl.dataset.id}-${index}`;
        check.id = `${id}-check`;
        text.id = `${id}-text`;
        check.setAttribute('aria-labelledby', `${id}-text`);
      }
    });
  });
}
