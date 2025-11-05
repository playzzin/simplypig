import { EventStore } from './events/EventStore.js';
import { EventValidator } from './events/EventValidator.js';
import { EventError, EventErrorHandler } from './events/EventError.js';
import { EventMetadata } from './events/EventMetadata.js';
import { ListenerMetadata } from './events/ListenerMetadata.js';

export class EventEmitter {
  constructor() {
    this._store = new EventStore();
    this._validator = new EventValidator();
    this._errorHandler = new EventErrorHandler();
    this._eventMeta = new EventMetadata();
    this._listenerMeta = new ListenerMetadata();
    this._defaultMaxListeners = 10;
    this._debugMode = false;
    this._memoryWarnings = new Set();
    this._lastCleanup = Date.now();
    this._cleanupInterval = 30000; // 30초마다 자동 정리
  }

  // NOTE: After refactor the storage/metadata responsibilities moved to
  // EventStore / EventMetadata / ListenerMetadata. Use their APIs here.

  on(event, listener, options = {}) {
    try {
      this._validator.validateEventParams(event, listener);
      this._checkAndCleanup();

      const target = options.target || this;
      const eventMeta = this._eventMeta.update(event);

      // 리스너 중복 체크
      if (this._store.getListeners(target, event)?.has(listener)) {
        const warning = `Duplicate listener detected for event '${event}'`;
        this._errorHandler.handleError(new EventError(warning, 'duplicate_listener'));
        return () => this.off(event, listener, target);
      }

      // 리스너 수 제한 체크
      if (!eventMeta.warningIssued && eventMeta.listenerCount >= eventMeta.maxListeners) {
        const warning = `MaxListenersExceededWarning: Possible EventEmitter memory leak detected. ${eventMeta.listenerCount} ${event} listeners added.`;
        eventMeta.warningIssued = true;
        this._memoryWarnings.add(warning);
        
        if (this._debugMode) {
          this._errorHandler.handleError(new EventError(warning, 'max_listeners_exceeded'));
        }
      }

      // 리스너 추가
      this._store.addListener(target, event, listener);
      this._eventMeta.increment(event);

      // 메타데이터 관리
      this._listenerMeta.create(listener, event, options);

      // 구독 취소 함수 반환
      return () => {
        this.off(event, listener, target);
        this._listenerMeta.remove(listener, event);
      };

    } catch (error) {
      this._errorHandler.handleError(error);
      throw error;
    }
  }

  once(event, listener, options = {}) {
    return this.on(event, listener, { ...options, once: true });
  }

  off(event, listener, target = this) {
    const listeners = this._store.getListeners(target, event);
    if (!listeners) return false;

    const eventMeta = this._eventMeta.update(event);

    if (listener) {
      const removed = this._store.removeListener(target, event, listener);
      if (removed) this._eventMeta.decrement(event);
      this._listenerMeta.remove(listener, event);
      return removed;
    } else {
      // 이벤트의 모든 리스너 제거
      for (const l of Array.from(listeners)) {
        this._store.removeListener(target, event, l);
        this._listenerMeta.remove(l, event);
      }
      eventMeta.listenerCount = 0;
      eventMeta.warningIssued = false;
      return true;
    }
  }

  emit(event, data, target = this) {
    try {
      this._validator.validateEventType(event);
      
      const listeners = this._store.getListeners(target, event);
      if (!listeners) return false;

      const eventMeta = this._eventMeta.update(event);
      const errors = [];

      // 리스너 정렬 (우선순위 기준)
      const sortedListeners = Array.from(listeners).sort((a, b) => {
        const metaA = this._listenerMeta.get(a) || {};
        const metaB = this._listenerMeta.get(b) || {};
        return (metaB.priority || 0) - (metaA.priority || 0);
      });

      // 리스너 실행
      for (const listener of sortedListeners) {
        const meta = this._listenerMeta.get(listener);
        if (!meta) continue;

        try {
          const context = meta.context || target;
          listener.call(context, data);

          // 메타데이터 갱신
          this._listenerMeta.update(listener, event);

          // once 리스너 처리
          if (meta.once) {
            this.off(event, listener, target);
            this._eventMeta.decrement(event);
          }
        } catch (error) {
          const errorInfo = this._errorHandler.handleError(error, {
            event,
            listener,
            data
          });
          errors.push(errorInfo);
        }
      }

      // 이벤트 메타데이터 업데이트
      eventMeta.lastEmitted = Date.now();
      eventMeta.totalEmissions = (eventMeta.totalEmissions || 0) + 1;

      // 에러 처리
      if (errors.length > 0) {
        // emit error event on the same emitter (avoid infinite loops)
        try { this.emit('error', { event, errors, target }); } catch (e) { /* swallow to avoid recursion */ }
      }

      return true;

    } catch (error) {
      this._errorHandler.handleError(error);
      throw error;
    }
  }

  // 자동 정리 체크
  _checkAndCleanup() {
    const now = Date.now();
    if (now - this._lastCleanup >= this._cleanupInterval) {
      this.cleanup();
      this._lastCleanup = now;
    }
  }

  // 메모리 정리
  cleanup() {
    try {
      // 이벤트 스토어 정리
      this._store.cleanup();

      // 이벤트 메타데이터 정리
      for (const [event, meta] of this._eventMeta.entries()) {
        if (meta.listenerCount === 0) {
          this._eventMeta.delete(event);
        }
      }

      // 경고 메시지 정리
      this._memoryWarnings.clear();

      // 에러 로그 정리
      this._errorHandler.clearErrors();

    } catch (error) {
      this._errorHandler.handleError(error);
      throw error;
    }
  }

  // 설정 메서드
  setMaxListeners(count, event) {
    if (event) {
      const meta = this._updateEventMeta(event);
      meta.maxListeners = count;
      meta.warningIssued = false;
    } else {
      this._defaultMaxListeners = count;
      // 모든 이벤트 메타데이터 업데이트
      for (const meta of this._eventMeta.values()) {
        meta.maxListeners = count;
        meta.warningIssued = false;
      }
    }
  }

  setDebugMode(enabled) {
    this._debugMode = enabled;
  }

  // 진단 메서드
  getListenerCount(event) {
    const meta = this._eventMeta.get(event);
    return meta ? meta.listenerCount : 0;
  }

  getEventMetrics(event) {
    const meta = this._eventMeta.get(event);
    if (!meta) return null;

    return {
      listenerCount: meta.listenerCount,
      totalEmissions: meta.totalEmissions,
      lastEmitted: meta.lastEmitted,
      maxListeners: meta.maxListeners
    };
  }

  getMemoryWarnings() {
    return Array.from(this._memoryWarnings);
  }

  dumpState() {
    return {
      events: Array.from(this._eventMeta.entries()),
      warnings: this.getMemoryWarnings(),
      debugMode: this._debugMode,
      defaultMaxListeners: this._defaultMaxListeners,
      lastCleanup: this._lastCleanup
    };
  }
}