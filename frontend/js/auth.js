const params = new URLSearchParams(window.location.search);
const nextUrl = params.get('next') || '/play.html';
const initialTab = params.get('tab') === 'register' ? 'register' : 'login';
const AUTH_API = window.__AUTH_API__ || '/api/auth';

const tabLogin = document.getElementById('tab-login');
const tabRegister = document.getElementById('tab-register');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const captchaWrap = document.getElementById('reg-captcha-wrap');

let captchaState = { provider: 'pending', captchaId: null, siteKey: null, question: null, kind: null };
let captchaLoadPromise = null;
let legalConfig = {
    policyVersion: '2026-06-26',
    termsVersion: '2026-06-26'
};

function showCaptchaLoading() {
    if (!captchaWrap) return;
    captchaWrap.classList.remove('hidden');
    captchaWrap.innerHTML = `
        <label class="field-label">Проверка</label>
        <p class="auth-hint captcha-loading">Загрузка задачи…</p>`;
}

function showCaptchaLoadError(message) {
    if (!captchaWrap) return;
    captchaWrap.classList.remove('hidden');
    captchaWrap.innerHTML = `
        <label class="field-label">Проверка <span class="field-required">*</span></label>
        <div class="char-error-item captcha-load-error">⚠ ${message}</div>
        <button type="button" id="captcha-retry" class="btn btn-secondary captcha-retry-btn">Повторить</button>`;
    document.getElementById('captcha-retry')?.addEventListener('click', e => {
        e.preventDefault();
        loadCaptchaConfig(true);
    });
}

function showTab(tab) {
    const isLogin = tab === 'login';
    const isRegister = tab === 'register';
    tabLogin.classList.toggle('active', isLogin);
    tabRegister.classList.toggle('active', isRegister);
    loginForm.classList.toggle('hidden', !isLogin);
    registerForm.classList.toggle('hidden', !isRegister);
    hideError('auth-error');
    hideError('reg-error');
    if (isRegister) {
        loadCaptchaConfig();
        loadLegalConfig();
    }
}

function showError(id, message, options = {}) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.remove('hidden');
    let html = `<div class="char-error-item">⚠ ${message}</div>`;
    if (options.loginHint) {
        html += `<div class="char-error-item auth-error-action">
            <button type="button" class="btn btn-secondary auth-switch-login-btn">Войти с этим логином</button>
        </div>`;
    }
    el.innerHTML = html;
    el.querySelector('.auth-switch-login-btn')?.addEventListener('click', () => {
        showTab('login');
        const loginInput = document.getElementById('login-input');
        const username = document.getElementById('reg-username')?.value.trim();
        if (loginInput && username) loginInput.value = username;
        document.getElementById('login-password')?.focus();
    });
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function isUsernameTakenMessage(message) {
    return typeof message === 'string' && message.includes('занят');
}

function hideError(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.add('hidden');
    el.innerHTML = '';
}

function storeAuthResponse(data) {
    if (data?.token) setAuthToken(data.token);
}

async function loadLegalConfig() {
    try {
        const res = await fetch(AUTH_API + '/legal-config');
        if (!res.ok) return;
        legalConfig = await res.json();
    } catch {
        /* fallback defaults */
    }
}

function renderLegacyMathCaptcha(cfg, onRefresh) {
    captchaState.kind = 'math';
    captchaWrap.innerHTML = `
        <label class="field-label">Проверка <span class="field-required">*</span></label>
        <div class="captcha-math-row">
            <span class="captcha-math-q" id="captcha-question">${cfg.question || '…'}</span>
            <input id="reg-captcha-answer" type="text" class="text-input captcha-math-input"
                   inputmode="numeric" autocomplete="off" required placeholder="Ответ">
            <button type="button" id="captcha-refresh" class="captcha-refresh-btn" title="Другая задача">↻</button>
        </div>`;
    document.getElementById('captcha-refresh')?.addEventListener('click', e => {
        e.preventDefault();
        onRefresh();
    });
}

function ensureYandexCaptchaScript() {
    if (document.getElementById('smart-captcha-script')) return;
    const script = document.createElement('script');
    script.id = 'smart-captcha-script';
    script.src = 'https://smartcaptcha.yandexcloud.net/captcha.js';
    script.defer = true;
    document.head.appendChild(script);
}

function renderCaptcha(cfg) {
    captchaState = {
        provider: cfg.provider || 'none',
        captchaId: cfg.captchaId || null,
        siteKey: cfg.siteKey || null,
        question: cfg.question || null,
        kind: cfg.kind || null
    };
    if (!captchaWrap) return;

    captchaWrap.innerHTML = '';
    if (window.CaptchaWidgets) CaptchaWidgets.reset();

    if (captchaState.provider === 'none') {
        captchaWrap.classList.add('hidden');
        return;
    }

    captchaWrap.classList.remove('hidden');

    if (captchaState.provider === 'internal') {
        const onRefresh = () => loadCaptchaConfig(true);
        if (cfg.kind === 'slider') {
            CaptchaWidgets.renderSlider(captchaWrap, cfg, onRefresh);
            return;
        }
        if (cfg.kind === 'image' && cfg.tiles?.length) {
            CaptchaWidgets.renderImage(captchaWrap, cfg, onRefresh);
            return;
        }
        renderLegacyMathCaptcha(cfg, onRefresh);
        return;
    }

    if (captchaState.provider === 'yandex' && captchaState.siteKey) {
        captchaWrap.innerHTML = `
            <label class="field-label">Проверка <span class="field-required">*</span></label>
            <div id="yandex-smart-captcha" class="smart-captcha" data-sitekey="${captchaState.siteKey}"></div>`;
        ensureYandexCaptchaScript();
    }
}

async function loadCaptchaConfig(force = false) {
    if (force) captchaLoadPromise = null;
    if (captchaLoadPromise && !force) return captchaLoadPromise;

    captchaLoadPromise = (async () => {
        showCaptchaLoading();
        try {
            const res = await fetch(AUTH_API + '/captcha-config');
            if (!res.ok) throw new Error('HTTP ' + res.status);
            const cfg = await res.json();
            if (!cfg || typeof cfg.provider !== 'string') {
                throw new Error('invalid config');
            }
            renderCaptcha(cfg);
            return cfg;
        } catch {
            captchaState = { provider: 'unknown', captchaId: null, siteKey: null, question: null, kind: null };
            showCaptchaLoadError('Не удалось загрузить капчу. Проверьте, что сервер запущен.');
            throw new Error('captcha-load-failed');
        }
    })();

    return captchaLoadPromise;
}

async function ensureCaptchaReady() {
    if (captchaState.provider === 'internal' && captchaState.captchaId) return captchaState;
    if (captchaState.provider === 'yandex' && captchaState.siteKey) return captchaState;
    if (captchaState.provider === 'none') return captchaState;

    await loadCaptchaConfig();
    return captchaState;
}

function captchaPayload() {
    if (captchaState.provider === 'yandex') {
        const token = captchaWrap?.querySelector('[name="smart-token"]')?.value
            || document.querySelector('[name="smart-token"]')?.value;
        return { smartCaptchaToken: token || null };
    }
    if (captchaState.provider === 'internal') {
        let answer = null;
        if (captchaState.kind === 'math') {
            answer = document.getElementById('reg-captcha-answer')?.value.trim() || null;
        } else {
            answer = CaptchaWidgets.getAnswer(captchaState.kind);
        }
        return { captchaId: captchaState.captchaId, captchaAnswer: answer };
    }
    return {};
}

tabLogin.addEventListener('click', () => showTab('login'));
tabRegister.addEventListener('click', () => showTab('register'));
showTab(initialTab);

(async () => {
    const res = await fetch(AUTH_API + '/me', { headers: authHeaders() });
    if (res.ok) window.location.href = nextUrl;
})();

loginForm.addEventListener('submit', async e => {
    e.preventDefault();
    hideError('auth-error');
    try {
        const res = await fetch(AUTH_API + '/login', {
            method: 'POST',
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
        storeAuthResponse(data);
        window.location.href = nextUrl;
    } catch {
        showError('auth-error', 'Ошибка сети');
    }
});

registerForm.addEventListener('submit', async e => {
    e.preventDefault();
    hideError('reg-error');

    const username = document.getElementById('reg-username').value.trim();
    if (username.length < 3) {
        showError('reg-error', 'Логин — минимум 3 символа');
        return;
    }

    if (!document.getElementById('reg-consent').checked) {
        showError('reg-error', 'Необходимо согласие на обработку персональных данных');
        return;
    }
    if (!document.getElementById('reg-terms').checked) {
        showError('reg-error', 'Необходимо принять пользовательское соглашение');
        return;
    }

    try {
        await ensureCaptchaReady();
    } catch {
        showError('reg-error', 'Не удалось загрузить капчу — нажмите «Повторить»');
        return;
    }

    if (captchaState.provider === 'internal' && !captchaPayload().captchaAnswer) {
        const msg = captchaState.kind === 'slider'
            ? 'Перетащите стрелку на нужную метку'
            : captchaState.kind === 'math'
                ? 'Решите задачу капчи'
                : 'Выберите нужные картинки';
        showError('reg-error', msg);
        return;
    }

    if (captchaState.provider === 'yandex') {
        const token = captchaPayload().smartCaptchaToken;
        if (!token) {
            showError('reg-error', 'Подтвердите, что вы не робот');
            return;
        }
    }

    try {
        const res = await fetch(AUTH_API + '/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username,
                displayName: document.getElementById('reg-display').value.trim(),
                password: document.getElementById('reg-password').value,
                personalDataConsent: true,
                termsAccepted: true,
                policyVersion: legalConfig.policyVersion || null,
                termsVersion: legalConfig.termsVersion || null,
                ...captchaPayload()
            })
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
            const msg = data.message || 'Не удалось зарегистрироваться';
            showError('reg-error', msg, { loginHint: isUsernameTakenMessage(msg) });
            if (captchaState.provider !== 'none') loadCaptchaConfig(true);
            return;
        }
        storeAuthResponse(data);
        window.location.href = nextUrl;
    } catch {
        showError('reg-error', 'Ошибка сети');
    }
});
