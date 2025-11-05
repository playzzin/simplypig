// DOM 요소 선택
const toggleButton = document.getElementById('sidebar-toggle');
const contentArea = document.getElementById('main-content');
const body = document.body;
const accordionItems = document.querySelectorAll('.has-submenu > a');
const nonAccordionItems = document.querySelectorAll('.menu-list li:not(.has-submenu) > a');
const allMenuLinks = document.querySelectorAll('.menu-list a');
const contentFrame = document.getElementById('content-frame');

function normalizePageHref(href){
  if (!href) return '';
  const trimmed = href.trim();
  return trimmed.startsWith('/') ? trimmed.slice(1) : trimmed;
}

function isPageLink(href){
  return normalizePageHref(href).startsWith('page/');
}

function loadIntoFrame(href){
  if (!contentFrame || !href) return;
  contentFrame.setAttribute('src', normalizePageHref(href));
}

function setSidebarCollapsed(collapsed){
  body.classList.toggle('sidebar-collapsed', collapsed);
  localStorage.setItem(PREF_COLLAPSED, collapsed ? '1' : '0');
  if (collapsed) closeAllSubmenus();
}

function collapseSidebar(){
  if (!body.classList.contains('sidebar-collapsed')){
    setSidebarCollapsed(true);
  } else {
    closeAllSubmenus();
  }
}

function bindIframeCollapse(){
  if (!contentFrame) return;
  try {
    const frameWindow = contentFrame.contentWindow;
    const frameDoc = frameWindow && frameWindow.document;
    if (!frameDoc) return;
    const handler = () => collapseSidebar();
    frameDoc.addEventListener('click', handler, true);
    frameWindow.addEventListener('mousedown', handler, true);
  } catch(_) {}
}

// 로고 클릭 시 iframe 로딩
const logoAnchor = document.querySelector('.sidebar-header a');
if (logoAnchor){
  logoAnchor.addEventListener('click', (e)=>{
    const href = logoAnchor.getAttribute('href');
    if (isPageLink(href)){
      e.preventDefault();
      loadIntoFrame(href);
      collapseSidebar();
    }
  });
}

// 상태 보존 키
const PREF_COLLAPSED = 'sidebar:collapsed';

function closeAllSubmenus() {
  document.querySelectorAll('.menu-item.active').forEach(item => item.classList.remove('active'));
}

// 초기 접힘 상태 복원
if (localStorage.getItem(PREF_COLLAPSED) === '1') {
  setSidebarCollapsed(true);
}

// 토글 버튼
if (toggleButton){
  toggleButton.addEventListener('click', function(e){
    e.preventDefault();
    const collapsed = !body.classList.contains('sidebar-collapsed');
    setSidebarCollapsed(collapsed);
  });
}

// 콘텐츠 영역 클릭 시 접기
if (contentArea){
  contentArea.addEventListener('click', function(){
    collapseSidebar();
  });
}

// 사이드바 외부 클릭 시 열린 서브메뉴 닫기
document.addEventListener('click', (e)=>{
  const sidebar = document.getElementById('sidebar');
  if (sidebar && !sidebar.contains(e.target)) {
    closeAllSubmenus();
  }
});

if (contentFrame){
  contentFrame.addEventListener('load', bindIframeCollapse);
  bindIframeCollapse();
}

// 상위 메뉴 (아코디언)
accordionItems.forEach(item => {
  item.addEventListener('click', function(e){
    e.preventDefault();
    const parentLi = this.parentElement;
    if (body.classList.contains('sidebar-collapsed')){
      // fly-out: 다른 활성 메뉴 닫기 후 토글
      document.querySelectorAll('.menu-item.active').forEach(activeItem => { if (activeItem !== parentLi) activeItem.classList.remove('active'); });
      parentLi.classList.toggle('active');
      return;
    }
    // 펼쳐진 상태: 같은 레벨 하나만 오픈
    document.querySelectorAll('.menu-item.active').forEach(activeItem => { if (activeItem !== parentLi) activeItem.classList.remove('active'); });
    parentLi.classList.toggle('active');
  });
});

// 하위 메뉴 없는 항목
nonAccordionItems.forEach(item => {
  item.addEventListener('click', function(e){
    if (body.classList.contains('sidebar-collapsed')){
      e.preventDefault();
      setSidebarCollapsed(false);
      return;
    }
  });
});

// 활성 링크 관리
allMenuLinks.forEach(link => {
  link.addEventListener('click', function(e){
    const isAccordionToggle = this.parentElement.classList.contains('has-submenu') && this.matches('.has-submenu > a');
    if (!isAccordionToggle){
      const href = this.getAttribute('href');
      if (isPageLink(href)){
        e.preventDefault();
        loadIntoFrame(href);
        collapseSidebar();
      }
      allMenuLinks.forEach(l => l.classList.remove('active-link'));
      this.classList.add('active-link');
    }
  });
});

// 현재 URL 기준으로 활성 링크 표시 및 부모 메뉴 열기
(function markActiveByUrl(){
  const current = location.pathname.replace(/\/+/g, '/');
  let matched = null;
  allMenuLinks.forEach(l => {
    const href = l.getAttribute('href');
    if (!href || href === '#' ) return;
    try {
      const a = document.createElement('a');
      a.href = href;
      const path = a.pathname.replace(/\/+/g, '/');
      if (path === current) matched = l;
    } catch(_) {}
  });
  // URL로 못 찾았으면 iframe src 기준으로 찾기
  if (!matched && contentFrame){
    try {
      const srcUrl = new URL(contentFrame.getAttribute('src'), location.href);
      const srcPath = srcUrl.pathname.replace(/\/+/g, '/');
      allMenuLinks.forEach(l => {
        const href = l.getAttribute('href');
        if (!href || href === '#') return;
        const a = document.createElement('a');
        a.href = normalizePageHref(href);
        const path = a.pathname.replace(/\/+/g, '/');
        if (path === srcPath) matched = l;
      });
    } catch(_) {}
  }
  if (matched){
    allMenuLinks.forEach(l => l.classList.remove('active-link'));
    matched.classList.add('active-link');
    const parentLi = matched.closest('.menu-item');
    if (parentLi && !body.classList.contains('sidebar-collapsed')){
      parentLi.classList.add('active');
    }
  }
})();
