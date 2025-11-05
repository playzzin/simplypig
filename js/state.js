import { Store, defaultState } from './core/Store.js';
import { validateNote, filterNotes, sortNotes } from './utils/noteUtils.js';
import { saveNotes, saveColors } from './storage.js';

class NoteStore extends Store {
  constructor() {
    super(defaultState);
    this.on('stateChange', ({ property }) => {
      if (property === 'notes') saveNotes(this.state.notes);
      if (property === 'colors') saveColors(this.state.colors);
    });
  }

  addNote(note) {
    try {
      const validNote = validateNote(note);
      const notes = [...this.state.notes, validNote];
      this.setState({
        notes,
        zIndexCounter: Math.max(this.state.zIndexCounter, (note.zIndex || 0) + 1)
      });
      return validNote;
    } catch (error) {
      console.error('Failed to add note:', error);
      throw error;
    }
  }

  removeNote(id) {
    const notes = this.state.notes.filter(n => n.id !== id);
    this.setState({ notes });
  }

  updateNote(id, updates) {
    const notes = this.state.notes.map(note => 
      note.id === id ? { ...note, ...updates, updatedAt: Date.now() } : note
    );
    this.setState({ notes });
  }

  updateSort(sortType) {
    this.setState({ currentSort: sortType });
  }

  setFilter(filter) {
    this.setState({ currentFilter: filter });
  }

  setSearch(query) {
    this.setState({ searchQuery: query });
  }

  toggleShrink() {
    const isShrunk = !this.state.isShrunk;
    this.setState({ isShrunk });
    return isShrunk;
  }

  getFilteredAndSortedNotes() {
    const filtered = filterNotes(this.state.notes, {
      searchQuery: this.state.searchQuery,
      colorFilter: this.state.currentFilter
    });
    return sortNotes(filtered, this.state.currentSort);
  }
}

export const noteStore = new NoteStore();
export const { state } = noteStore;
