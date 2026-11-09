/* ── Demo credentials ──
   In production these would be replaced by a real auth endpoint.
   Role is determined entirely by the account — no UI switcher. */

const demoCredentials = {
  '20210543@horizon.edu':   { role: 'student',     password: 'demo1234' },
  'l.castillo@horizon.edu': { role: 'adviser',     password: 'demo1234' },
  'p.vargas@horizon.edu':   { role: 'coordinator', password: 'demo1234' },
  'a.mendez@horizon.edu':   { role: 'academic',    password: 'demo1234' },
};

/* Handle login form submit */
function doLogin(e) {
  if (e) e.preventDefault();
  const email    = document.getElementById('login-email').value.trim().toLowerCase();
  const password = document.getElementById('login-password').value;
  const errorEl  = document.getElementById('login-error');

  const match = demoCredentials[email];
  if (!match || match.password !== password) {
    errorEl.textContent = 'Correo o contraseña incorrectos.';
    errorEl.style.display = 'block';
    return;
  }
  errorEl.style.display = 'none';
  enterApp(match.role);
}

/* Quick-login from demo account buttons */
function quickLogin(roleKey) {
  const entry = Object.entries(demoCredentials).find(([, v]) => v.role === roleKey);
  if (!entry) return;
  document.getElementById('login-email').value    = entry[0];
  document.getElementById('login-password').value = entry[1].password;
  doLogin();
}

/* Wire up login form on DOM ready */
document.getElementById('login-form').addEventListener('submit', doLogin);
