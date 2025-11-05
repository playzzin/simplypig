import { EventEmitter } from './EventEmitter.js';

export class Store extends EventEmitter {
  constructor(initialState = {}) {
    super();
    this._state = initialState;
    this._prevState = {};
    this._batchUpdates = false;
    this._pendingUpdates = new Map();
    this._updateScheduled = false;
  }

  get state() {
    return this._state;
  }

  // 배치 업데이트 시작
  beginBatch() {
    this._batchUpdates = true;
  }

  // 배치 업데이트 종료 및 변경사항 적용
  commitBatch() {
    this._batchUpdates = false;
    if (this._pendingUpdates.size > 0) {
      this._applyUpdates(Object.fromEntries(this._pendingUpdates));
      this._pendingUpdates.clear();
    }
  }

  // 상태 업데이트를 최적화하여 처리
  setState(updates) {
    if (this._batchUpdates) {
      // 배치 모드에서는 업데이트를 큐에 추가
      Object.entries(updates).forEach(([key, value]) => {
        this._pendingUpdates.set(key, value);
      });
      return;
    }

    this._applyUpdates(updates);
  }

  // 실제 상태 업데이트 수행
  _applyUpdates(updates) {
    const changes = new Map();
    this._prevState = { ...this._state };

    Object.entries(updates).forEach(([key, value]) => {
      if (this._state[key] !== value) {
        changes.set(key, {
          oldValue: this._state[key],
          newValue: value
        });
        this._state[key] = value;
      }
    });

    if (changes.size > 0) {
      // 변경사항이 있을 때만 이벤트 발행
      this._scheduleStateChange(changes);
    }
  }

  // 상태 변경 이벤트 스케줄링
  _scheduleStateChange(changes) {
    if (this._updateScheduled) return;
    this._updateScheduled = true;

    queueMicrotask(() => {
      this._updateScheduled = false;
      this.emit('stateChange', {
        changes: Array.from(changes.entries()),
        prevState: this._prevState,
        currentState: { ...this._state }
      });
    });
  }

  // 특정 상태 키 구독
  subscribe(key, callback) {
    return this.on('stateChange', ({ changes }) => {
      if (changes.has(key)) {
        callback(changes.get(key).newValue, changes.get(key).oldValue);
      }
    });
  }

  // 현재 상태의 불변 복사본 반환
  getState() {
    return { ...this._state };
  }

  // 상태 리셋
  resetState(newState = {}) {
    this._prevState = { ...this._state };
    this._state = newState;
    this.emit('stateReset', {
      prevState: this._prevState,
      currentState: { ...this._state }
    });
  }

  // 특정 상태 키 삭제
  deleteState(key) {
    if (key in this._state) {
      const oldValue = this._state[key];
      delete this._state[key];
      this.emit('stateChange', {
        changes: new Map([[key, { oldValue, newValue: undefined }]]),
        prevState: { ...this._prevState },
        currentState: { ...this._state }
      });
    }
  }
}

// 노트 관련 타입 정의
export const NoteType = {
  TEXT: 'text',
  CHECKLIST: 'checklist'
};

// 정렬 방식 정의
export const SortType = {
  NEWEST: 'newest',
  OLDEST: 'oldest',
  ALPHABETICAL: 'alphabetical'
};

// 기본 상태 정의
export const defaultState = {
  notes: [],
  colors: [],
  zIndexCounter: 1,
  currentSort: SortType.NEWEST,
  currentFilter: 'all',
  searchQuery: '',
  isShrunk: false
};