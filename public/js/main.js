import { noteStore } from './state.js';
import { loadNotes, loadColors } from './storage.js';
import { initializeRenderer } from './render.js';
import { initializeInteractions } from './interaction.js';
import { showToast } from './utils.js';
import { generateId } from './utils/noteUtils.js';

class App {
  constructor() {
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    try {
      await this.loadInitialData();
      this.setupRendering();
      this.setupInteractions();
      this.setupErrorHandling();
      
      this.initialized = true;
      console.log('Sticky app initialized', {
        notesCount: noteStore.state.notes.length,
        colorsCount: noteStore.state.colors.length
      });
      showToast('앱이 초기화되었습니다.', 'info');
    } catch (error) {
      console.error('App initialization failed:', error);
      showToast('앱 초기화에 실패했습니다.', 'error');
    }
  }

  async loadInitialData() {
    // 색상 데이터 로드
    const loadedColors = await loadColors();
    const defaultColors = [
      { id: 'color_yellow', hex: '#FDE047', name: '노랑' },
      { id: 'color_blue', hex: '#BAE6FD', name: '파랑' },
      { id: generateId(), hex: '#D1FAE5', name: '초록' },
      { id: generateId(), hex: '#FBCFE8', name: '분홍' },
      { id: generateId(), hex: '#E5E7EB', name: '회색' }
    ];

    noteStore.setState({
      colors: Array.isArray(loadedColors) && loadedColors.length ? loadedColors : defaultColors
    });

    // 노트 데이터 로드
    const loadedNotes = await loadNotes();
    const notes = Array.isArray(loadedNotes) ? loadedNotes : [];
    const maxZIndex = Math.max(1, ...notes.map(n => n.zIndex || 0));

    noteStore.setState({
      notes,
      zIndexCounter: maxZIndex + 1
    });
  }

  setupRendering() {
    initializeRenderer();
  }

  setupInteractions() {
    initializeInteractions();
  }

  setupErrorHandling() {
    window.onerror = (message, source, lineno, colno, error) => {
      console.error('Global error:', { message, source, lineno, colno, error });
      showToast('오류가 발생했습니다.', 'error');
    };

    window.onunhandledrejection = (event) => {
      console.error('Unhandled promise rejection:', event.reason);
      showToast('비동기 작업 중 오류가 발생했습니다.', 'error');
    };
  }
}

// 앱 초기화
const app = new App();
document.addEventListener('DOMContentLoaded', () => app.initialize());
