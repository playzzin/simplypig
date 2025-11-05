import { NoteType } from '../core/Store.js';

// ID 생성
export const generateId = () => `note_${Date.now()}_${Math.random().toString(36).substring(2,9)}`;

// 메모 생성
export const createNote = ({ text = '', type = NoteType.TEXT, color, position }) => {
  return {
    id: generateId(),
    text,
    type,
    checklist: [],
    ...position,
    color,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isNew: true
  };
};

// 메모 유효성 검사
export const validateNote = (note) => {
  const required = ['id', 'text', 'type', 'createdAt'];
  const missing = required.filter(prop => !(prop in note));
  
  if (missing.length > 0) {
    throw new Error(`Invalid note: missing ${missing.join(', ')}`);
  }

  if (!note.checklist) note.checklist = [];
  if (typeof note.text !== 'string') note.text = String(note.text);
  if (typeof note.width !== 'number') note.width = 256;
  if (typeof note.height !== 'number') note.height = 256;
  
  return note;
};

// HTML 이스케이프
export const escapeHtml = (unsafe) => {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

// 메모 필터링
export const filterNotes = (notes, { searchQuery, colorFilter }) => {
  let filtered = [...notes];
  
  if (colorFilter && colorFilter !== 'all') {
    filtered = filtered.filter(note => note.color === colorFilter);
  }

  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    filtered = filtered.filter(note =>
      note.text.toLowerCase().includes(query) ||
      note.checklist.some(item => item.text.toLowerCase().includes(query))
    );
  }

  return filtered;
};

// 메모 정렬
export const sortNotes = (notes, sortType) => {
  const sortFns = {
    newest: (a, b) => (b.createdAt || 0) - (a.createdAt || 0),
    oldest: (a, b) => (a.createdAt || 0) - (b.createdAt || 0),
    alphabetical: (a, b) => (a.text || '').localeCompare(b.text || '')
  };

  return [...notes].sort(sortFns[sortType] || sortFns.newest);
};

// 레이아웃 계산
export const calculateLayout = (notes, containerWidth) => {
  const noteWidth = 256;
  const gap = 20;
  const numColumns = Math.max(1, Math.floor((containerWidth - gap) / (noteWidth + gap)));
  const columnHeights = Array(numColumns).fill(gap);
  
  return notes.map(note => {
    let minHeight = Infinity;
    let columnIndex = 0;
    
    for (let i = 0; i < numColumns; i++) {
      if (columnHeights[i] < minHeight) {
        minHeight = columnHeights[i];
        columnIndex = i;
      }
    }
    
    const x = gap + columnIndex * (noteWidth + gap);
    const y = columnHeights[columnIndex];
    
    columnHeights[columnIndex] += (note.height || 256) + gap;
    
    return {
      ...note,
      x,
      y
    };
  });
};