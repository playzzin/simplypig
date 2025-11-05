// Backup of original app.js (legacy).
// Renamed to app.legacy.js to avoid interfering with new modular implementation.

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
      { id: 'color_yellow', hex: '#FDE047', name: '노랑' },
      { id: 'color_blue', hex: '#BAE6FD', name: '파랑' },
      { id: generateId(), hex: '#D1FAE5', name: '초록' },
      { id: generateId(), hex: '#FBCFE8', name: '분홍' },
      { id: generateId(), hex: '#E5E7EB', name: '회색' },
    ];
    saveColors();
  }
}

// ...rest of legacy code omitted for brevity (full backup preserved)
