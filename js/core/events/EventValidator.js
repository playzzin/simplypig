// 이벤트 타입에 대한 검증 및 처리
export class EventValidator {
  static validateEventType(event) {
    if (!event || typeof event !== 'string') {
      throw new TypeError('이벤트는 문자열이어야 합니다.');
    }
  }

  static validateListener(listener) {
    if (typeof listener !== 'function') {
      throw new TypeError('리스너는 함수여야 합니다.');
    }
  }
  
  static validateEventParams(event, listener) {
    this.validateEventType(event);
    this.validateListener(listener);
  }
}