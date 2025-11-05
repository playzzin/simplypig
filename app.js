let isShrunk = false;

// --- Global State ---
let notes = [];
let colors = [];
let zIndexCounter = 1;
let currentSort = 'newest'; // 'newest', 'oldest', 'alphabetical'
let currentFilter = 'all';
let searchQuery = '';

// --- Utility Functions ---
const generateId = () => `note_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

function debounce(func, delay) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), delay);
  };
}

function showToast(message, type = 'info') {
  const toastContainer = document.getElementById('toast-container');
  if (!toastContainer) return;

  const toast = document.createElement('div');
  const bgColor = type === 'success' ? 'bg-green-500' : (type === 'error' ? 'bg-red-500' : 'bg-blue-500');
  toast.className = `text-white px-4 py-2 rounded-lg shadow-lg animate-fade-in-out ${bgColor}`;
  toast.textContent = message;

  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 3000);
}

// --- Storage Functions ---
function saveNotes() {
  localStorage.setItem('stickyNotes', JSON.stringify(notes));
}

function loadNotes() {
  const savedNotes = localStorage.getItem('stickyNotes');
  if (savedNotes) {
    notes = JSON.parse(savedNotes);
    if (notes.length > 0) {
      zIndexCounter = Math.max(...notes.map(n => n.zIndex)) + 1;
    }
  }
}

function saveColors() {
  localStorage.setItem('stickyColors', JSON.stringify(colors));
}

function loadColors() {
  const savedColors = localStorage.getItem('stickyColors');
  if (savedColors) {
    colors = JSON.parse(savedColors);
  } else {
    colors = [
      { id: 'color_yellow', hex: '#FDE047', name: '노랑' }, // yellow-300
      { id: 'color_blue', hex: '#BAE6FD', name: '파랑' }, // blue-200
      { id: generateId(), hex: '#D1FAE5', name: '초록' }, // green-200
      { id: generateId(), hex: '#FBCFE8', name: '분홍' }, // pink-200
      { id: generateId(), hex: '#E5E7EB', name: '회색' }, // gray-200
    ];
    saveColors();
  }
}

// --- Rendering Functions ---
function renderNotes() {
  const notesContainer = document.getElementById('notes-container');
  const noteTemplate = document.getElementById('note-template');
  const checklistItemTemplate = document.getElementById('checklist-item-template');

  let notesToRender = [...notes];

  // 1. 색상 필터링
  if (currentFilter !== 'all') {
    notesToRender = notesToRender.filter(note => note.color === currentFilter);
  }

  // 2. 검색 필터링
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    notesToRender = notesToRender.filter(note =>
      note.text.toLowerCase().includes(query) ||
      note.checklist.some(item => item.text.toLowerCase().includes(query))
    );
  }

  // 3. 정렬
  notesToRender.sort((a, b) => {
    if (currentSort === 'newest') {
      return b.createdAt - a.createdAt;
    } else if (currentSort === 'oldest') {
      return a.createdAt - b.createdAt;
    } else if (currentSort === 'alphabetical') {
      return a.text.localeCompare(b.text);
    }
    return 0;
  });

  notesContainer.innerHTML = '';

  if (notesToRender.length === 0) {
    const emptyStateHTML = `
                    <div class="absolute inset-0 flex items-center justify-center text-center text-gray-400 dark:text-gray-500">
                        <div>
                            <svg class="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3h2m-2 3h2m-2 3h2m-2 3h2m-2 3h2"></path></svg>
                            <h3 class="mt-2 text-sm font-medium">메모 없음</h3>
                            <p class="mt-1 text-sm">새 메모를 추가하여 시작하세요.</p>
                        </div>
                    </div>
                `;
    notesContainer.innerHTML = emptyStateHTML;
    return;
  }

  // 4. DOM에 렌더링 (Masonry-like layout)
  const containerWidth = notesContainer.clientWidth;
  const noteWidth = 256; // w-64
  const gap = (currentSort !== 'newest') ? 10 : 20; // Reduce gap by 50% when sorting is active

  let numColumns = Math.floor((containerWidth - gap) / (noteWidth + gap));
  numColumns = Math.max(1, numColumns); // Ensure at least one column
  const columnHeights = Array(numColumns).fill(gap); // Initialize all column heights to the top gap

  notesToRender.forEach((noteData) => {
    const noteEl = createNoteElement(noteData, noteTemplate, checklistItemTemplate);

    // Find the column with the minimum height
    let minHeight = Infinity;
    let minHeightColumnIndex = 0;
    for (let i = 0; i < numColumns; i++) {
      if (columnHeights[i] < minHeight) {
        minHeight = columnHeights[i];
        minHeightColumnIndex = i;
      }
    }

    const xPos = gap + minHeightColumnIndex * (noteWidth + gap);
    const yPos = columnHeights[minHeightColumnIndex];

    noteEl.style.left = `${xPos}px`;
    noteEl.style.top = `${yPos}px`;

    notesContainer.appendChild(noteEl);
    columnHeights[minHeightColumnIndex] += noteEl.offsetHeight + gap;

    noteData.x = xPos;
    noteData.y = yPos;
  });
  saveNotes();
}

function createNoteElement(noteData, noteTemplate, checklistItemTemplate) {
  const noteEl = noteTemplate.content.cloneNode(true).firstElementChild;
  if (noteData.isNew) {
    noteEl.classList.add('note-entering');
    noteEl.addEventListener('animationend', () => {
      noteEl.classList.remove('note-entering');
    });
    delete noteData.isNew;
  }

  noteEl.dataset.id = noteData.id;
  noteEl.style.left = `${noteData.x}px`;
  noteEl.style.top = `${noteData.y}px`;
  noteEl.style.width = `${noteData.width}px`;
  noteEl.style.height = `${noteData.height}px`;
  noteEl.style.zIndex = noteData.zIndex;
  noteEl.style.backgroundColor = noteData.color;

  const noteContent = noteEl.querySelector('.note-content');
  const checklistContainer = noteEl.querySelector('.note-checklist-container');
  const colorPalette = noteEl.querySelector('.note-color-palette');

  noteContent.value = noteData.text;
  noteContent.addEventListener('input', debounce((e) => {
    noteData.text = e.target.value;
    saveNotes();
  }, 300));

  noteData.checklist.forEach(itemData => {
    const checklistItemEl = createChecklistItemElement(itemData, noteData, checklistItemTemplate);
    checklistContainer.appendChild(checklistItemEl);
  });

  renderNoteColorPalette(colorPalette, noteData);
  attachNoteInteractionEvents(noteEl, noteData);

  return noteEl;
}

function createChecklistItemElement(itemData, noteData, checklistItemTemplate) {
  const itemEl = checklistItemTemplate.content.cloneNode(true).firstElementChild;
  const checkbox = itemEl.querySelector('.note-checklist-item-check');
  const textInput = itemEl.querySelector('.note-checklist-item-text');
  const deleteBtn = itemEl.querySelector('.note-checklist-item-delete');

  textInput.value = itemData.text;
  checkbox.checked = itemData.done;
  if (itemData.done) {
    textInput.classList.add('line-through', 'text-gray-400', 'dark:text-gray-500');
  }

  checkbox.addEventListener('change', () => {
    itemData.done = checkbox.checked;
    textInput.classList.toggle('line-through', itemData.done);
    textInput.classList.toggle('text-gray-400', itemData.done);
    textInput.classList.toggle('dark:text-gray-500', itemData.done);
    saveNotes();
  });

  textInput.addEventListener('input', debounce((e) => {
    itemData.text = e.target.value;
    saveNotes();
  }, 300));

  textInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      textInput.blur();
    }
  });

  deleteBtn.addEventListener('click', () => {
    noteData.checklist = noteData.checklist.filter(item => item.id !== itemData.id);
    saveNotes();
    itemEl.remove();
  });

  return itemEl;
}

function renderColorFilters() {
  const colorFilterContainer = document.getElementById('color-filter-container');
  const existingButtons = colorFilterContainer.querySelectorAll('.color-filter-btn:not([data-color="all"])');
  existingButtons.forEach(btn => btn.remove());

  colors.forEach(color => {
    const btn = document.createElement('button');
    btn.className = 'color-filter-btn w-8 h-8 rounded-full border-2 border-white dark:border-gray-800 shadow-sm transition-transform hover:scale-110';
    btn.style.backgroundColor = color.hex;
    btn.dataset.color = color.hex;
    btn.title = color.name;
    btn.addEventListener('click', () => {
      currentFilter = color.hex;
      updateActiveFilterButton();
      renderNotes();
    });
    colorFilterContainer.appendChild(btn);
  });

  updateActiveFilterButton();
}

function updateActiveFilterButton() {
  const colorFilterContainer = document.getElementById('color-filter-container');
  colorFilterContainer.querySelectorAll('.color-filter-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.color === currentFilter);
  });
}

function renderNoteColorPalette(paletteElement, noteData) {
  paletteElement.innerHTML = '';
  colors.forEach(color => {
    const colorOption = document.createElement('button');
    colorOption.className = 'w-6 h-6 rounded-full border border-black/20 shadow-sm';
    colorOption.style.backgroundColor = color.hex;
    colorOption.addEventListener('click', (e) => {
      e.stopPropagation();
      noteData.color = color.hex;
      saveNotes();

      const noteEl = paletteElement.closest('.note');
      noteEl.style.backgroundColor = color.hex;
      const noteColorBtn = noteEl.querySelector('.note-color-btn');
      if (noteColorBtn) {
        noteColorBtn.style.backgroundColor = color.hex;
        noteColorBtn.innerHTML = `<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M4 2a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V4a2 2 0 00-2-2H4zm0 2h12v12H4V4z" clip-rule="evenodd"></path><path d="M6 6a2 2 0 100 4 2 2 0 000-4zm0 6a2 2 0 100 4 2 2 0 000-4zm6-6a2 2 0 100 4 2 2 0 000-4zm0 6a2 2 0 100 4 2 2 0 000-4z"></path></svg>`;
      }

      paletteElement.classList.add('hidden');
    });
    paletteElement.appendChild(colorOption);
  });
}

function renderColorList() {
  const colorListContainer = document.getElementById('color-list-container');
  colorListContainer.innerHTML = '';
  colors.forEach(color => {
    const item = document.createElement('div');
    item.className = 'flex items-center justify-between p-2 rounded-lg bg-gray-100 dark:bg-gray-700';
    item.innerHTML = `
                    <div class="flex items-center gap-3">
                        <div class="w-6 h-6 rounded-full border border-black/20" style="background-color: ${color.hex};"></div>
                        <span class="font-medium">${color.name}</span>
                        <span class="text-sm text-gray-500 dark:text-gray-400">${color.hex}</span>
                    </div>
                    <div class="flex items-center gap-2">
                      <button class="edit-color-btn text-gray-400 hover:text-blue-500" data-id="${color.id}" title="색상 편집">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5h2m-1 0v14m-7-7h14"/></svg>
                      </button>
                      <button class="delete-color-btn text-gray-400 hover:text-red-500" data-id="${color.id}" title="색상 삭제">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                      </button>
                    </div>
                `;

    item.querySelector('.delete-color-btn').addEventListener('click', () => {
      colors = colors.filter(c => c.id !== color.id);
      saveColors();
      renderColorList();
      renderColorFilters();
      notes.forEach(note => {
        if (note.color === color.hex) {
          note.color = colors[0]?.hex || '#FDE047';
        }
      });
      saveNotes();
      renderNotes();
      showToast('색상이 삭제되었습니다.', 'info');
    });

    item.querySelector('.edit-color-btn').addEventListener('click', () => {
      // Build inline editor
      const editor = document.createElement('div');
      editor.className = 'mt-2 p-2 rounded-lg bg-white dark:bg-gray-600 flex items-center gap-2';
      editor.innerHTML = `
        <input type="color" class="edit-color-hex w-10 h-10 p-0 border-none rounded" value="${color.hex}">
        <input type="text" class="edit-color-name flex-grow px-2 py-1 rounded border border-gray-300 dark:border-gray-500 bg-white dark:bg-gray-700" value="${color.name}" placeholder="이름">
        <button class="save-edit-btn bg-blue-600 hover:bg-blue-700 text-white text-sm px-3 py-1 rounded">저장</button>
        <button class="cancel-edit-btn bg-gray-300 hover:bg-gray-400 text-gray-800 text-sm px-3 py-1 rounded">취소</button>
      `;
      // Avoid adding multiple editors
      if (!item.querySelector('.save-edit-btn')) {
        item.appendChild(editor);
      }

      editor.querySelector('.cancel-edit-btn').addEventListener('click', () => {
        editor.remove();
      });

      editor.querySelector('.save-edit-btn').addEventListener('click', () => {
        const newHex = editor.querySelector('.edit-color-hex').value;
        const newName = editor.querySelector('.edit-color-name').value.trim() || newHex;
        if (newHex.toLowerCase() !== color.hex.toLowerCase() && colors.some(c => c.hex.toLowerCase() === newHex.toLowerCase())) {
          alert('이미 존재하는 색상입니다.');
          return;
        }
        const oldHex = color.hex;
        color.hex = newHex;
        color.name = newName;
        saveColors();
        // Update notes using old hex to new hex
        notes.forEach(n => {
          if (n.color && n.color.toLowerCase() === oldHex.toLowerCase()) {
            n.color = newHex;
          }
        });
        saveNotes();
        renderColorList();
        renderColorFilters();
        renderNotes();
        showToast('색상이 업데이트되었습니다.', 'success');
      });
    });

    colorListContainer.appendChild(item);
  });
}

// --- Interaction Functions ---
let activeNote = null;
let action = null;
let startX, startY, startLeft, startTop, startWidth, startHeight;

const onDragStart = (e) => {
  if (e.target.closest('textarea, input, button, .resize-handle')) return;

  e.preventDefault();
  activeNote = e.currentTarget;
  action = 'drag';

  const touch = e.touches ? e.touches[0] : e;
  startX = touch.clientX;
  startY = touch.clientY;
  startLeft = activeNote.offsetLeft;
  startTop = activeNote.offsetTop;

  const noteData = notes.find(n => n.id === activeNote.dataset.id);
  if (noteData) {
    noteData.zIndex = ++zIndexCounter;
    activeNote.style.zIndex = noteData.zIndex;
    saveNotes();
  }

  activeNote.classList.add('dragging', 'shadow-2xl');
  document.addEventListener('mousemove', onDragMove, { passive: false });
  document.addEventListener('mouseup', onDragEnd);
  document.addEventListener('touchmove', onDragMove, { passive: false });
  document.addEventListener('touchend', onDragEnd);
};

const onResizeStart = (e) => {
  e.preventDefault();
  e.stopPropagation();
  activeNote = e.currentTarget.closest('.note');
  action = 'resize';

  const touch = e.touches ? e.touches[0] : e;
  startX = touch.clientX;
  startY = touch.clientY;
  startWidth = activeNote.offsetWidth;
  startHeight = activeNote.offsetHeight;

  activeNote.classList.add('dragging');
  document.addEventListener('mousemove', onDragMove, { passive: false });
  document.addEventListener('mouseup', onDragEnd);
  document.addEventListener('touchmove', onDragMove, { passive: false });
  document.addEventListener('touchend', onDragEnd);
};

const onDragMove = (e) => {
  if (!activeNote) return;

  e.preventDefault();
  const touch = e.touches ? e.touches[0] : e;
  const dx = touch.clientX - startX;
  const dy = touch.clientY - startY;

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

const onDragEnd = () => {
  if (!activeNote) return;

  const noteData = notes.find(n => n.id === activeNote.dataset.id);
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
  activeNote = null;
  action = null;

  document.removeEventListener('mousemove', onDragMove);
  document.removeEventListener('mouseup', onDragEnd);
  document.removeEventListener('touchmove', onDragMove);
  document.removeEventListener('touchend', onDragEnd);
};

function attachToolbarEvents() {
  const addNoteBtn = document.getElementById('add-note-btn');
  const searchInput = document.getElementById('search-input');
  const sortBtn = document.getElementById('sort-btn');
  const sortLabel = document.getElementById('sort-label');
  const toggleSizeBtn = document.getElementById('toggle-size-btn'); // New button
  const toggleSizeLabel = document.getElementById('toggle-size-label'); // New label
  const manageColorsBtn = document.getElementById('manage-colors-btn');
  const colorModal = document.getElementById('color-modal');
  const closeColorModalBtn = document.getElementById('close-color-modal');
  const colorPickerInput = document.getElementById('color-picker-input');
  const colorNameInput = document.getElementById('color-name-input');
  const addColorBtn = document.getElementById('add-color-btn');

  addNoteBtn.addEventListener('click', () => {
    const offset = (notes.length % 10) * 20;
    const newNoteData = {
      id: generateId(),
      text: '',
      checklist: [],
      x: 50 + offset,
      y: 100 + offset,
      width: 256,
      height: 256,
      color: currentFilter !== 'all' ? currentFilter : (colors[0]?.hex || '#FDE047'),
      zIndex: ++zIndexCounter,
      createdAt: Date.now(),
      isNew: true
    };
    notes.push(newNoteData);
    saveNotes();
    renderNotes();
    showToast('새 메모가 추가되었습니다.', 'success');

    const newNoteElement = document.querySelector(`[data-id="${newNoteData.id}"]`);
    if (newNoteElement) {
      newNoteElement.querySelector('.note-content').focus();
    }
  });

  searchInput.addEventListener('input', debounce(() => {
    searchQuery = searchInput.value;
    renderNotes();
  }, 300));

  sortBtn.addEventListener('click', () => {
    if (currentSort === 'newest') {
      currentSort = 'oldest';
      sortLabel.textContent = '오래된 순';
    } else if (currentSort === 'oldest') {
      currentSort = 'alphabetical';
      sortLabel.textContent = '가나다 순';
    } else {
      currentSort = 'newest';
      sortLabel.textContent = '최근 순';
    }
    renderNotes();
  });

  // Toggle Size Button Event Listener
  toggleSizeBtn.addEventListener('click', () => {
    isShrunk = !isShrunk;
    notes.forEach(note => {
      if (isShrunk) {
        // Store original size before shrinking
        note.originalWidth = note.width;
        note.originalHeight = note.height;
        note.width = 200; // Minimum width
        note.height = 200; // Minimum height
      } else {
        // Restore original size
        note.width = note.originalWidth || 256; // Default if original not found
        note.height = note.originalHeight || 256; // Default if original not found
      }
    });
    saveNotes();
    renderNotes();
    toggleSizeLabel.textContent = isShrunk ? '확대' : '축소';
    showToast(isShrunk ? '모든 메모가 축소되었습니다.' : '모든 메모가 원래 크기로 돌아왔습니다.', 'info');
  });

  document.querySelector('[data-color="all"]').addEventListener('click', () => {
    currentFilter = 'all';
    updateActiveFilterButton();
    renderNotes();
  });

  manageColorsBtn.addEventListener('click', () => {
    renderColorList();
    colorModal.classList.remove('hidden');
  });
  closeColorModalBtn.addEventListener('click', () => colorModal.classList.add('hidden'));
  colorModal.addEventListener('click', (e) => {
    if (e.target === colorModal) colorModal.classList.add('hidden');
  });

  addColorBtn.addEventListener('click', () => {
    const hex = colorPickerInput.value;
    const name = colorNameInput.value.trim() || hex;

    if (!colors.some(c => c.hex === hex)) {
      colors.push({ id: generateId(), hex, name });
      saveColors();
      renderColorList();
      renderColorFilters();
      colorNameInput.value = '';
      showToast('새로운 색상이 추가되었습니다.', 'success');
    } else {
      alert('이미 존재하는 색상입니다.');
    }
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.color-palette-wrapper')) {
      document.querySelectorAll('.note-color-palette').forEach(p => p.classList.add('hidden'));
    }
  });
}

function attachNoteInteractionEvents(noteEl, noteData) {
  const resizeHandle = noteEl.querySelector('.resize-handle');
  const dragHandle = noteEl.querySelector('.note-drag-handle');
  const deleteBtn = noteEl.querySelector('.note-delete-btn');
  const frontBtn = noteEl.querySelector('.note-front-btn');
  const backBtn = noteEl.querySelector('.note-back-btn');
  const colorBtn = noteEl.querySelector('.note-color-btn');
  const colorPalette = noteEl.querySelector('.note-color-palette');
  const addChecklistBtn = noteEl.querySelector('.note-add-checklist-btn');

  dragHandle.addEventListener('mousedown', onDragStart);
  dragHandle.addEventListener('touchstart', onDragStart);
  noteEl.addEventListener('mousedown', onDragStart);
  noteEl.addEventListener('touchstart', onDragStart);
  resizeHandle.addEventListener('mousedown', onResizeStart);
  resizeHandle.addEventListener('touchstart', onResizeStart);

  deleteBtn.addEventListener('click', () => {
    if (confirm('정말로 이 메모를 삭제하시겠습니까?')) {
      notes = notes.filter(n => n.id !== noteData.id);
      saveNotes();
      renderNotes();
      showToast('메모가 삭제되었습니다.', 'info');
    }
  });

  frontBtn.addEventListener('click', () => {
    noteData.zIndex = ++zIndexCounter;
    noteEl.style.zIndex = noteData.zIndex;
    saveNotes();
  });

  backBtn.addEventListener('click', () => {
    noteData.zIndex = 0;
    noteEl.style.zIndex = noteData.zIndex;
    saveNotes();
  });

  colorBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    document.querySelectorAll('.note-color-palette').forEach(p => {
      if (p !== colorPalette) p.classList.add('hidden');
    });
    colorPalette.classList.toggle('hidden');
  });

  addChecklistBtn.addEventListener('click', () => {
    const newItemData = { id: generateId(), text: '', done: false };
    noteData.checklist.push(newItemData);
    saveNotes();
    const checklistContainer = noteEl.querySelector('.note-checklist-container');
    const checklistItemTemplate = document.getElementById('checklist-item-template');
    const newItemEl = createChecklistItemElement(newItemData, noteData, checklistItemTemplate);
    checklistContainer.appendChild(newItemEl);
    newItemEl.querySelector('.note-checklist-item-text').focus();
  });
}

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
  loadColors();
  loadNotes();
  renderColorFilters();
  renderNotes();
  attachToolbarEvents();
});
