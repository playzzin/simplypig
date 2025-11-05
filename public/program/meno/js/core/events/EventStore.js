// 이벤트 스토어 관리
export class EventStore {
  constructor() {
    this._hasWeakRef = typeof WeakRef !== 'undefined';
    this._events = this._hasWeakRef ? new WeakMap() : new Map();
  }

  getListeners(target, event) {
    const targetEvents = this._events.get(target);
    if (!targetEvents) return null;
    return targetEvents.get(event);
  }

  addListener(target, event, listener) {
    if (!this._events.has(target)) {
      this._events.set(target, new Map());
    }
    const targetEvents = this._events.get(target);
    
    if (!targetEvents.has(event)) {
      targetEvents.set(event, new Set());
    }
    
    targetEvents.get(event).add(listener);
  }

  removeListener(target, event, listener) {
    const targetEvents = this._events.get(target);
    if (!targetEvents) return false;

    const listeners = targetEvents.get(event);
    if (!listeners) return false;

    const removed = listeners.delete(listener);
    
    // 정리
    if (listeners.size === 0) {
      targetEvents.delete(event);
    }
    if (targetEvents.size === 0) {
      this._events.delete(target);
    }

    return removed;
  }

  cleanup() {
    if (!this._hasWeakRef) {
      for (const [target, events] of this._events) {
        if (events.size === 0) {
          this._events.delete(target);
        }
      }
    }
  }
}