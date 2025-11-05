// 에러 처리 관리
export class ErrorHandler {
  constructor() {
    this._errorHandlers = new Set();
    this._debugMode = false;
  }

  setDebugMode(enabled) {
    this._debugMode = enabled;
  }

  addHandler(handler) {
    this._errorHandlers.add(handler);
    return () => this._errorHandlers.delete(handler);
  }

  handle(event, error, emitter) {
    if (this._errorHandlers.size > 0) {
      this._errorHandlers.forEach(handler => {
        try {
          handler(event, error);
        } catch (e) {
          console.error('Error in error handler:', e);
        }
      });
    } else if (event !== 'error' && emitter) {
      emitter.emit('error', { event, error });
    }

    if (this._debugMode) {
      console.error(`Error in event '${event}':`, error);
      console.trace('Stack trace:');
    }
  }

  cleanup() {
    this._errorHandlers.clear();
  }
}