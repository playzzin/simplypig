// 에러 처리와 로깅
export class EventError extends Error {
  constructor(message, type) {
    super(message);
    this.name = 'EventError';
    this.type = type;
  }
}

export class EventErrorHandler {
  constructor() {
    this.errors = [];
    this.maxErrors = 100;
  }

  handleError(error, context = {}) {
    const errorInfo = {
      timestamp: Date.now(),
      error: error instanceof Error ? error : new Error(error),
      context
    };
    
    this.errors.push(errorInfo);
    
    // 오래된 에러 로그 제거
    if (this.errors.length > this.maxErrors) {
      this.errors.shift();
    }
    
    // 콘솔에 에러 출력 (개발 환경에서만)
    if (process.env.NODE_ENV === 'development') {
      console.error('Event Error:', error, context);
    }
    
    return errorInfo;
  }

  getErrors() {
    return [...this.errors];
  }

  clearErrors() {
    this.errors = [];
  }
}