// 리스너 메타데이터 관리
export class ListenerMetadata {
  constructor() {
    this._listenerMeta = new WeakMap();
  }

  create(listener, event, options = {}) {
    if (!this._listenerMeta.has(listener)) {
      this._listenerMeta.set(listener, {
        timestamp: Date.now(),
        callCount: 0,
        lastCalled: null,
        events: new Set([event]),
        ...options
      });
    }
    return this._listenerMeta.get(listener);
  }

  update(listener, event) {
    const meta = this._listenerMeta.get(listener);
    if (meta) {
      meta.callCount++;
      meta.lastCalled = Date.now();
      meta.events.add(event);
    }
    return meta;
  }

  remove(listener, event) {
    const meta = this._listenerMeta.get(listener);
    if (meta) {
      meta.events.delete(event);
      if (meta.events.size === 0) {
        this._listenerMeta.delete(listener);
      }
    }
  }

  get(listener) {
    return this._listenerMeta.get(listener);
  }
}