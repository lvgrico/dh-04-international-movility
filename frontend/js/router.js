/* ── Router ── */
let currentRole = null;
let currentPage = null;

/* Build sidebar nav for the active role */
function buildNav() {
  const role = roles[currentRole];
  const navEl = document.getElementById('sidebar-nav');
  navEl.innerHTML = role.nav.map(item => `
    <button class="nav-item${currentPage === item.id ? ' active' : ''}"
            onclick="goTo('${item.id}')">
      ${icon(item.icon || 'home', 16)}
      <span style="flex:1">${item.label}</span>
      ${item.badge ? `<span class="nav-badge">${item.badge}</span>` : ''}
    </button>`).join('');

  /* User card */
  const uc = document.getElementById('user-card');
  uc.innerHTML = `
    ${avatar(role.avatar, role.color, 32)}
    <div class="user-info">
      <div class="user-name">${role.name}</div>
      <div class="user-role">${role.label}</div>
    </div>`;
}

/* Render the current page content into #app-content */
function renderPage() {
  const fn = pages[currentPage];
  const el = document.getElementById('app-content');
  if (fn) {
    el.innerHTML = fn();
  } else {
    el.innerHTML = `
      <div class="topbar"><span class="topbar-title">Página no encontrada</span></div>
      <div class="page-body"><p style="color:var(--fg-3)">Vista "${currentPage}" no disponible.</p></div>`;
  }
}

/* Navigate to a page id */
function goTo(pageId) {
  currentPage = pageId;
  buildNav();
  renderPage();
  /* Scroll main area to top */
  document.querySelector('.main').scrollTop = 0;
}

/* Enter the app after successful login */
function enterApp(roleKey) {
  currentRole = roleKey;
  /* Pick first nav item as default page */
  currentPage = roles[roleKey].nav[0].id;

  /* Hide login, show app */
  document.getElementById('login-screen').hidden = true;
  document.getElementById('app-shell').hidden    = false;

  buildNav();
  renderPage();
}

/* Logout */
function doLogout() {
  currentRole = null;
  currentPage = null;
  document.getElementById('app-shell').hidden    = true;
  document.getElementById('login-screen').hidden = false;
  /* Clear fields */
  document.getElementById('login-email').value    = '';
  document.getElementById('login-password').value = '';
  document.getElementById('login-error').style.display = 'none';
}

/* Dark-mode toggle */
function toggleTheme() {
  const root = document.documentElement;
  const dark = root.dataset.theme === 'dark';
  root.dataset.theme = dark ? 'light' : 'dark';
}
