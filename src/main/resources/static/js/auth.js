const params = new URLSearchParams(window.location.search);
const nextUrl = params.get('next') || '/play.html';
const initialTab = params.get('tab') === 'register' ? 'register' : 'login';

const tabLogin = document.getElementById('tab-login');
const tabRegister = document.getElementById('tab-register');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');

function showTab(tab) {
    const isLogin = tab === 'login';
    tabLogin.classList.toggle('active', isLogin);
    tabRegister.classList.toggle('active', !isLogin);
    loginForm.classList.toggle('hidden', !isLogin);
    registerForm.classList.toggle('hidden', isLogin);
    hideError('auth-error');
    hideError('reg-error');
}

function showError(id, message) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.remove('hidden');
    el.innerHTML = `<div class="char-error-item">⚠ ${message}</div>`;
}

function hideError(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.add('hidden');
    el.innerHTML = '';
}

tabLogin.addEventListener('click', () => showTab('login'));
tabRegister.addEventListener('click', () => showTab('register'));
showTab(initialTab);

(async () => {
    const res = await fetch('/api/auth/me', { credentials: 'same-origin' });
    if (res.ok) window.location.href = nextUrl;

    const setup = await fetch('/api/auth/setup', { credentials: 'same-origin' }).then(r => r.json()).catch(() => ({}));
    if (setup.devLoginEnabled) {
        document.getElementById('dev-login-panel')?.classList.remove('hidden');
        const userEl = document.getElementById('dev-admin-user');
        if (userEl && setup.adminUsername) userEl.textContent = setup.adminUsername;
    }
})();

document.getElementById('dev-login-btn')?.addEventListener('click', async () => {
    hideError('auth-error');
    try {
        const res = await fetch('/api/auth/dev-login', {
            method: 'POST',
            credentials: 'same-origin'
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
            showError('auth-error', data.message || 'Dev login недоступен');
            return;
        }
        window.location.href = nextUrl;
    } catch {
        showError('auth-error', 'Ошибка сети');
    }
});

loginForm.addEventListener('submit', async e => {
    e.preventDefault();
    hideError('auth-error');
    try {
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                login: document.getElementById('login-input').value.trim(),
                password: document.getElementById('login-password').value
            })
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
            showError('auth-error', data.message || 'Неверный логин или пароль');
            return;
        }
        window.location.href = nextUrl;
    } catch {
        showError('auth-error', 'Ошибка сети');
    }
});

registerForm.addEventListener('submit', async e => {
    e.preventDefault();
    hideError('reg-error');
    try {
        const res = await fetch('/api/auth/register', {
            method: 'POST',
            credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: document.getElementById('reg-email').value.trim(),
                username: document.getElementById('reg-username').value.trim(),
                displayName: document.getElementById('reg-display').value.trim(),
                password: document.getElementById('reg-password').value
            })
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
            showError('reg-error', data.message || 'Не удалось зарегистрироваться');
            return;
        }
        window.location.href = nextUrl;
    } catch {
        showError('reg-error', 'Ошибка сети');
    }
});
