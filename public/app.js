// Tailwind Dashboard interactions

document.addEventListener('DOMContentLoaded', function() {
  // DOM 요소 선택
  const leftSidebar = document.getElementById('left-sidebar');
  const rightSidebar = document.getElementById('right-sidebar');
  const mainContainer = document.getElementById('main-container');
  const mainHeader = document.getElementById('main-header');
  const mainFooter = document.getElementById('main-footer');

  const hamburgerBtn = document.getElementById('hamburger-btn');
  const settingsBtn = document.getElementById('settings-btn');
  const closeSettingsBtn = document.getElementById('close-settings-btn');
  const overlay = document.getElementById('overlay');
  const themeSelect = document.getElementById('theme');

  const sidebarLogoFull = document.querySelector('.sidebar-logo-full');
  const sidebarLogoIcon = document.querySelector('.sidebar-logo-icon');
  // 메뉴 텍스트 전부 선택 (단일/트리/로고 텍스트/아이콘 텍스트 포함)
  const menuTexts = document.querySelectorAll('.menu-text');
  const menuItems = document.querySelectorAll('.menu-item');
  const treeMenuItems = document.querySelectorAll('[data-menu-item="tree"] > a');

  const PREF_SIDEBAR = 'pref:sidebar-collapsed';
  const PREF_THEME = 'pref:theme';

  let isSidebarCollapsed = (localStorage.getItem(PREF_SIDEBAR) === '1');

  // 모든 트리뷰 서브메뉴 닫기 헬퍼
  function closeAllSubmenus() {
    document.querySelectorAll('[data-menu-item="tree"] ul').forEach(ul => ul.classList.add('hidden'));
    document.querySelectorAll('[data-menu-item="tree"] > a svg:last-child').forEach(svg => svg.classList.remove('rotate-180'));
    treeMenuItems.forEach(trigger => trigger.setAttribute('aria-expanded', 'false'));
  }

  // 사이드바 접기/펼치기 헬퍼 (강화 버전)
  function collapseSidebar(){
    document.body.classList.add('sidebar-collapsed');
    isSidebarCollapsed = true;
    hamburgerBtn.setAttribute('aria-expanded', 'false');
    localStorage.setItem(PREF_SIDEBAR, '1');
    closeAllSubmenus();
  }

  function expandSidebar(){
    document.body.classList.remove('sidebar-collapsed');
    isSidebarCollapsed = false;
    hamburgerBtn.setAttribute('aria-expanded', 'true');
    localStorage.setItem(PREF_SIDEBAR, '0');
    closeAllSubmenus();
  }

  // 초기 사이드바 상태 반영
  if (isSidebarCollapsed) collapseSidebar();
  else expandSidebar();

  // --- 1. 왼쪽 사이드바 (메인) 토글 로직 ---
  function toggleLeftSidebar() {
    if (isSidebarCollapsed) expandSidebar();
    else collapseSidebar();
  }

  // 햄버거 버튼 클릭 시
  hamburgerBtn.addEventListener('click', toggleLeftSidebar);

  // 좌측 상단 로고 영역 클릭으로도 토글 (펼침/접힘 로고 모두)
  // 로고 내부 앵커에도 직접 바인딩해 기본 이동을 막고 토글만 수행
  const logoFullAnchor = sidebarLogoFull && sidebarLogoFull.querySelector('a');
  const logoIconAnchor = sidebarLogoIcon && sidebarLogoIcon.querySelector('a');
  if (logoFullAnchor) {
    logoFullAnchor.addEventListener('click', (e)=>{ e.preventDefault(); e.stopPropagation(); toggleLeftSidebar(); });
  }
  if (logoIconAnchor) {
    logoIconAnchor.addEventListener('click', (e)=>{ e.preventDefault(); e.stopPropagation(); toggleLeftSidebar(); });
  }

  // 요구사항: 사이드바가 접혔을 때 메뉴 클릭 시 펼쳐짐
  menuItems.forEach(item => {
    item.addEventListener('click', () => {
      if (isSidebarCollapsed) {
        toggleLeftSidebar();
      }
    });
  });

  // --- 2. 왼쪽 사이드바 (트리뷰) 로직 ---
  treeMenuItems.forEach(trigger => {
    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      const submenu = trigger.nextElementSibling;
      const arrowIcon = trigger.querySelector('svg:last-child');

      if (isSidebarCollapsed) {
        // 사이드바가 접힌 상태라면 펼치고 해당 서브메뉴를 열어준다
        toggleLeftSidebar();
        setTimeout(() => {
          const parentLi = trigger.parentElement;
          parentLi.parentElement.querySelectorAll('ul').forEach(u => u.classList.add('hidden'));
          parentLi.parentElement.querySelectorAll('[data-menu-item="tree"] > a svg:last-child').forEach(svg => svg.classList.remove('rotate-180'));

          submenu.classList.remove('hidden');
          arrowIcon.classList.add('rotate-180');
          trigger.setAttribute('aria-expanded', 'true');
        }, 160);
      } else {
        const willOpen = submenu.classList.contains('hidden');
        // 같은 레벨 하나만 오픈
        const parentLi = trigger.parentElement;
        const container = parentLi.parentElement;
        container.querySelectorAll('ul').forEach(u => u.classList.add('hidden'));
        container.querySelectorAll('[data-menu-item="tree"] > a svg:last-child').forEach(svg => svg.classList.remove('rotate-180'));

        if (willOpen) {
          submenu.classList.remove('hidden');
          arrowIcon.classList.add('rotate-180');
          trigger.setAttribute('aria-expanded', 'true');
        } else {
          // 이미 열려있던 항목을 클릭하면 닫기만 한다
          submenu.classList.add('hidden');
          arrowIcon.classList.remove('rotate-180');
          trigger.setAttribute('aria-expanded', 'false');
        }
      }
    });
  });

  // --- 3. 오른쪽 사이드바 (설정) 토글 로직 ---
  function openRightSidebar() {
    rightSidebar.classList.remove('translate-x-full');
    rightSidebar.setAttribute('aria-hidden', 'false');
    settingsBtn.setAttribute('aria-expanded', 'true');
    overlay.classList.remove('hidden');
  }
  function closeRightSidebar() {
    rightSidebar.classList.add('translate-x-full');
    rightSidebar.setAttribute('aria-hidden', 'true');
    settingsBtn.setAttribute('aria-expanded', 'false');
    overlay.classList.add('hidden');
    settingsBtn.focus();
  }

  settingsBtn.addEventListener('click', () => {
    if (rightSidebar.classList.contains('translate-x-full')) openRightSidebar();
    else closeRightSidebar();
  });
  closeSettingsBtn.addEventListener('click', closeRightSidebar);
  overlay.addEventListener('click', closeRightSidebar);
  document.addEventListener('keydown', (e)=>{
    if (e.key === 'Escape' && !rightSidebar.classList.contains('translate-x-full')) {
      closeRightSidebar();
    }
  });

  // --- 4. 테마 설정 (시스템/라이트/다크) ---
  function applyTheme(mode){
    const html = document.documentElement;
    if (mode === 'system'){
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      html.classList.toggle('dark', prefersDark);
    } else if (mode === 'dark') {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
  }

  function initTheme(){
    const saved = localStorage.getItem(PREF_THEME) || 'dark';
    themeSelect.value = saved;
    applyTheme(saved);
    // 시스템 변경 감지
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', ()=>{
      const current = localStorage.getItem(PREF_THEME) || 'dark';
      if (current === 'system') applyTheme('system');
    });
  }
  themeSelect.addEventListener('change', ()=>{
    const val = themeSelect.value;
    localStorage.setItem(PREF_THEME, val);
    applyTheme(val);
  });

  initTheme();

  // --- 5. 콘텐츠 프레임 로더 ---
  const contentFrame = document.getElementById('content-frame');
  function collapseLeftSidebarIfOpen(){
    if (!isSidebarCollapsed) toggleLeftSidebar();
  }
  function loadIntoFrame(src){
    if (!contentFrame) return;
    contentFrame.setAttribute('src', src);
  }
  document.querySelectorAll('a[data-src]').forEach(a => {
    a.addEventListener('click', (e)=>{
      e.preventDefault();
      const src = a.getAttribute('data-src');
      if (src) loadIntoFrame(src);
      // 내비게이션 시에도 사이드바 접기
      collapseLeftSidebarIfOpen();
    });
  });

  // --- 6. 콘텐츠 영역 클릭 시 왼쪽 사이드바 접기 ---
  const contentArea = document.getElementById('content-area');
  if (contentArea) {
    contentArea.addEventListener('click', ()=>{ collapseLeftSidebarIfOpen(); }, true);
  }
  // 메인 컨테이너 전체 클릭에도 적용 (여유 방어)
  const mainContainerEl = document.getElementById('main-container');
  if (mainContainerEl) {
    mainContainerEl.addEventListener('click', (e)=>{
      // 좌측 사이드바 내부 클릭은 제외
      if (e.target && document.getElementById('left-sidebar')?.contains(e.target)) return;
      collapseLeftSidebarIfOpen();
    }, true);
  }

  // iframe 내부 클릭도 감지하여 사이드바 접기 (동일 출처일 때만)
  function bindIframeCollapseOnClick(){
    if (!contentFrame) return;
    try {
      const doc = contentFrame.contentWindow && contentFrame.contentWindow.document;
      if (!doc) return;
      const handler = ()=> collapseLeftSidebarIfOpen();
      doc.addEventListener('click', handler, true);
      // 일부 브라우저에서 클릭 버블이 막히는 경우 mousedown도 청취
      contentFrame.contentWindow.addEventListener('mousedown', handler, true);
    } catch(err) {
      // cross-origin 등 접근 불가 시 무시
    }
  }
  if (contentFrame) {
    contentFrame.addEventListener('load', bindIframeCollapseOnClick);
    // 초기 바인딩 시도 (이미 로드되어 있을 수 있음)
    bindIframeCollapseOnClick();
  }
});
