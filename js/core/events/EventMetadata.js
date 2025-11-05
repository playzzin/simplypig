// 이벤트 메타데이터 관리
export class EventMetadata {
  constructor() {
    this._eventMeta = new Map();
    this._defaultMaxListeners = 10;
  }

  update(event) {
    if (!this._eventMeta.has(event)) {
      this._eventMeta.set(event, {
        maxListeners: this._defaultMaxListeners,
        warningIssued: false,
        listenerCount: 0,
        lastEmitted: null,
        totalEmissions: 0
      });
    }
    return this._eventMeta.get(event);
  }

  increment(event) {
    const meta = this.update(event);
    meta.listenerCount++;
    return meta;
  }

  decrement(event) {
    const meta = this._eventMeta.get(event);
    if (meta) {
      meta.listenerCount--;
      meta.warningIssued = false;
    }
    return meta;
  }

  setMaxListeners(count, event) {
    if (event) {
      const meta = this.update(event);
      meta.maxListeners = count;
      meta.warningIssued = false;
    } else {
      this._defaultMaxListeners = count;
      this._eventMeta.forEach(meta => {
        meta.maxListeners = count;
        meta.warningIssued = false;
      });
    }
  }

  getMetrics(event) {
    const meta = this._eventMeta.get(event);
    if (!meta) return null;

    return {
      listenerCount: meta.listenerCount,
      totalEmissions: meta.totalEmissions,
      lastEmitted: meta.lastEmitted,
      maxListeners: meta.maxListeners
    };
  }

  cleanup() {
    for (const [event, meta] of this._eventMeta.entries()) {
      if (meta.listenerCount === 0) {
        this._eventMeta.delete(event);
      }
    }
  }
}