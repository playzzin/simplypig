// 디바운스 함수 개선
export function debounce(func, delay = 200, { leading = false, trailing = true } = {}) {
  let timeout;
  let lastArgs;
  let lastThis;
  let result;

  const invoke = () => {
    result = func.apply(lastThis, lastArgs);
    lastArgs = lastThis = null;
  };

  const debounced = function (...args) {
    lastArgs = args;
    lastThis = this;

    if (timeout) {
      clearTimeout(timeout);
    } else if (leading) {
      invoke();
    }

    timeout = setTimeout(() => {
      if (trailing && lastArgs) {
        invoke();
      }
      timeout = null;
    }, delay);

    return result;
  };

  debounced.cancel = () => {
    clearTimeout(timeout);
    timeout = lastArgs = lastThis = null;
  };

  return debounced;
}

// 스로틀 함수 추가
export function throttle(func, limit = 200) {
  let inThrottle;
  let lastFunc;
  let lastRan;

  return function (...args) {
    if (!inThrottle) {
      func.apply(this, args);
      lastRan = Date.now();
      inThrottle = true;
    } else {
      clearTimeout(lastFunc);
      lastFunc = setTimeout(() => {
        if (Date.now() - lastRan >= limit) {
          func.apply(this, args);
          lastRan = Date.now();
        }
      }, limit - (Date.now() - lastRan));
    }
  };
}

// 향상된 토스트 알림
export function showToast(options) {
  const defaults = {
    message: '',
    type: 'info',
    duration: 3000,
    position: 'bottom-right',
    action: null,
    onClose: null,
    progressBar: true
  };

  const settings = typeof options === 'string' 
    ? { ...defaults, message: options }
    : { ...defaults, ...options };

  const toastContainer = document.getElementById('toast-container');
  if (!toastContainer) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${settings.type} toast-${settings.position}`;
  
  // HTML 구조 생성
  toast.innerHTML = `
    <div class="toast-content">
      ${getToastIcon(settings.type)}
      <div class="toast-message">${settings.message}</div>
      ${settings.action ? `
        <button class="toast-action">
          ${settings.action.text}
        </button>
      ` : ''}
      <button class="toast-close" aria-label="닫기">×</button>
      ${settings.progressBar ? '<div class="toast-progress"></div>' : ''}
    </div>
  `;

  // 토스트 애니메이션 설정
  toast.style.animation = 'toast-enter 0.3s ease-out';

  // 액션 버튼 이벤트
  if (settings.action) {
    const actionBtn = toast.querySelector('.toast-action');
    actionBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      settings.action.onClick(e);
      removeToast();
    });
  }

  // 닫기 버튼 이벤트
  const closeBtn = toast.querySelector('.toast-close');
  closeBtn.addEventListener('click', removeToast);

  // 프로그레스 바 애니메이션
  if (settings.progressBar) {
    const progress = toast.querySelector('.toast-progress');
    progress.style.animation = `toast-progress ${settings.duration}ms linear`;
  }

  // 토스트 제거 함수
  function removeToast() {
    toast.style.animation = 'toast-exit 0.3s ease-out';
    toast.addEventListener('animationend', () => {
      toast.remove();
      if (settings.onClose) settings.onClose();
    });
  }

  toastContainer.appendChild(toast);
  
  // 자동 제거 타이머
  if (settings.duration > 0) {
    setTimeout(removeToast, settings.duration);
  }

  // 접근성
  toast.setAttribute('role', 'alert');
  toast.setAttribute('aria-live', 'polite');
}

// 토스트 아이콘 선택
function getToastIcon(type) {
  const icons = {
    success: '<svg class="toast-icon" viewBox="0 0 24 24"><path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/></svg>',
    error: '<svg class="toast-icon" viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>',
    warning: '<svg class="toast-icon" viewBox="0 0 24 24"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>',
    info: '<svg class="toast-icon" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>'
  };
  
  return icons[type] || icons.info;
}

// 로딩 상태 관리
export class LoadingManager {
  constructor() {
    this.loadingStates = new Map();
  }

  startLoading(id, message = '로딩 중...') {
    if (this.loadingStates.has(id)) return;

    const loadingEl = document.createElement('div');
    loadingEl.className = 'loading-indicator';
    loadingEl.innerHTML = `
      <div class="loading-spinner"></div>
      <div class="loading-message">${message}</div>
    `;

    document.body.appendChild(loadingEl);
    this.loadingStates.set(id, loadingEl);
  }

  updateLoading(id, message) {
    const loadingEl = this.loadingStates.get(id);
    if (loadingEl) {
      const messageEl = loadingEl.querySelector('.loading-message');
      if (messageEl) messageEl.textContent = message;
    }
  }

  stopLoading(id) {
    const loadingEl = this.loadingStates.get(id);
    if (loadingEl) {
      loadingEl.remove();
      this.loadingStates.delete(id);
    }
  }

  isLoading(id) {
    return this.loadingStates.has(id);
  }
}

// 전역 로딩 관리자 인스턴스
export const loadingManager = new LoadingManager();
