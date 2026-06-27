const params = new URLSearchParams(window.location.search);
const nextUrl = params.get('next') || '/play.html';
const initialTab = params.get('tab') === 'register' ? 'register' : 'login';
const AUTH_API = window.__AUTH_API__ || '/api/auth';

const BLOCKED_EMAIL_DOMAINS = new Set([
    'gmail.com', 'googlemail.com', 'outlook.com', 'hotmail.com', 'live.com', 'msn.com',
    'yahoo.com', 'ymail.com', 'icloud.com', 'me.com', 'mac.com', 'proton.me', 'protonmail.com'
]);

const RUSSIAN_EMAIL_DOMAINS = new Set([
    'mail.ru', 'inbox.ru', 'bk.ru', 'list.ru', 'internet.ru',
    'yandex.ru', 'ya.ru', 'yandex.com', 'rambler.ru', 'lenta.ru', 'pochta.ru'
]);

const tabLogin = document.getElementById('tab-login');
const tabRegister = document.getElementById('tab-register');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const captchaWrap = document.getElementById('reg-captcha-wrap');
const regPhoneInput = document.getElementById('reg-phone');
const regSendSmsBtn = document.getElementById('reg-send-sms');
const regSmsWrap = document.getElementById('reg-sms-wrap');
const regSmsHint = document.getElementById('reg-sms-hint');
const regSmsCodeInput = document.getElementById('reg-sms-code');

let captchaState = { provider: 'pending', captchaId: null, siteKey: null, question: null };
let captchaLoadPromise = null;
let smsRequired = true;
let smsVerificationId = null;
let smsResendTimer = null;
let smsResendLeft = 0;

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
    tabLogin.classList.toggle('active', isLogin);
    tabRegister.classList.toggle('active', !isLogin);
    loginForm.classList.toggle('hidden', !isLogin);
    registerForm.classList.toggle('hidden', isLogin);
    hideError('auth-error');
    hideError('reg-error');
    if (!isLogin) {
        loadCaptchaConfig();
        loadSmsConfig();
    }
}

function resetSmsVerification() {
    smsVerificationId = null;
    if (regSmsCodeInput) regSmsCodeInput.value = '';
    regSmsWrap?.classList.add('hidden');
    regSmsHint?.classList.add('hidden');
    if (regSmsHint) regSmsHint.textContent = '';
}

function updateSmsSendButton() {
    if (!regSendSmsBtn) return;
    if (!smsRequired) {
        regSendSmsBtn.classList.add('hidden');
        return;
    }
    regSendSmsBtn.classList.remove('hidden');
    if (smsResendLeft > 0) {
        regSendSmsBtn.disabled = true;
        regSendSmsBtn.textContent = `Повтор через ${smsResendLeft} с`;
    } else {
        regSendSmsBtn.disabled = false;
        regSendSmsBtn.textContent = smsVerificationId ? 'Отправить снова' : 'Получить код';
    }
}

function startSmsResendCountdown(seconds) {
    smsResendLeft = seconds;
    updateSmsSendButton();
    if (smsResendTimer) clearInterval(smsResendTimer);
    smsResendTimer = setInterval(() => {
        smsResendLeft -= 1;
        if (smsResendLeft <= 0) {
            smsResendLeft = 0;
            clearInterval(smsResendTimer);
            smsResendTimer = null;
        }
        updateSmsSendButton();
    }, 1000);
}

async function loadSmsConfig() {
    try {
        const res = await fetch(AUTH_API + '/sms-config');
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const cfg = await res.json();
        smsRequired = cfg.required !== false;
    } catch {
        smsRequired = true;
    }
    updateSmsSendButton();
    if (!smsRequired) {
        resetSmsVerification();
    }
}

async function sendSmsCode() {
    hideError('reg-error');
    const phone = normalizePhone(regPhoneInput?.value);
    if (!phone) {
        showError('reg-error', 'Укажите корректный номер телефона +7');
        return;
    }
    regSendSmsBtn.disabled = true;
    regSendSmsBtn.textContent = 'Отправка…';
    try {
        const res = await fetch(AUTH_API + '/phone/send-code', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone })
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
            showError('reg-error', data.message || 'Не удалось отправить SMS');
            updateSmsSendButton();
            return;
        }
        smsVerificationId = data.verificationId;
        regSmsWrap?.classList.remove('hidden');
        regSmsCodeInput?.focus();
        if (regSmsHint) {
            regSmsHint.classList.remove('hidden');
            regSmsHint.textContent = data.devHint
                || `Код отправлен на ${phone}. Действует ${Math.round((data.expiresInSeconds || 600) / 60)} мин.`;
        }
        startSmsResendCountdown(data.resendAfterSeconds || 60);
    } catch {
        showError('reg-error', 'Ошибка сети при отправке SMS');
        updateSmsSendButton();
    }
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

function normalizePhone(raw) {
    const digits = (raw || '').replace(/\D/g, '');
    let d = digits;
    if (d.length === 11 && d.startsWith('8')) d = '7' + d.slice(1);
    if (d.length === 10) d = '7' + d;
    if (d.length !== 11 || !d.startsWith('7')) {
        return null;
    }
    return '+' + d;
}

function validateRussianEmail(email) {
    if (!email) return null;
    const normalized = email.trim().toLowerCase();
    const at = normalized.lastIndexOf('@');
    if (at < 1) return 'Некорректный email';
    const domain = normalized.slice(at + 1);
    if (BLOCKED_EMAIL_DOMAINS.has(domain)) {
        return 'Зарубежная почта недоступна. Используйте .ru / Яндекс / Mail.ru или оставьте поле пустым';
    }
    if (RUSSIAN_EMAIL_DOMAINS.has(domain) || domain.endsWith('.ru') || domain.endsWith('.su')) {
        return null;
    }
    return 'Допустима только российская почта или регистрация только по телефону +7';
}

function storeAuthResponse(data) {
    if (data?.token) setAuthToken(data.token);
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
        question: cfg.question || null
    };
    if (!captchaWrap) return;

    captchaWrap.innerHTML = '';
    if (captchaState.provider === 'none') {
        captchaWrap.classList.add('hidden');
        return;
    }

    captchaWrap.classList.remove('hidden');

    if (captchaState.provider === 'internal') {
        captchaWrap.innerHTML = `
            <label class="field-label">Проверка <span class="field-required">*</span></label>
            <div class="captcha-math-row">
                <span class="captcha-math-q" id="captcha-question">${captchaState.question || '…'}</span>
                <input id="reg-captcha-answer" type="text" class="text-input captcha-math-input"
                       inputmode="numeric" autocomplete="off" required placeholder="Ответ">
                <button type="button" id="captcha-refresh" class="captcha-refresh-btn" title="Другая задача">↻</button>
            </div>`;
        document.getElementById('captcha-refresh')?.addEventListener('click', e => {
            e.preventDefault();
            loadCaptchaConfig();
        });
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
            if (!res.ok) {
                throw new Error('HTTP ' + res.status);
            }
            const cfg = await res.json();
            if (!cfg || typeof cfg.provider !== 'string') {
                throw new Error('invalid config');
            }
            renderCaptcha(cfg);
            return cfg;
        } catch {
            captchaState = { provider: 'unknown', captchaId: null, siteKey: null, question: null };
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
        return {
            captchaId: captchaState.captchaId,
            captchaAnswer: document.getElementById('reg-captcha-answer')?.value.trim() || null
        };
    }
    return {};
}

tabLogin.addEventListener('click', () => showTab('login'));
tabRegister.addEventListener('click', () => showTab('register'));
regSendSmsBtn?.addEventListener('click', sendSmsCode);
regPhoneInput?.addEventListener('input', () => resetSmsVerification());
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

    const phone = normalizePhone(document.getElementById('reg-phone').value);
    if (!phone) {
        showError('reg-error', 'Укажите корректный номер телефона +7');
        return;
    }

    const emailRaw = document.getElementById('reg-email').value.trim();
    const emailErr = validateRussianEmail(emailRaw);
    if (emailErr) {
        showError('reg-error', emailErr);
        return;
    }

    if (!document.getElementById('reg-consent').checked) {
        showError('reg-error', 'Необходимо согласие на обработку персональных данных');
        return;
    }

    try {
        await ensureCaptchaReady();
    } catch {
        showError('reg-error', 'Не удалось загрузить капчу — нажмите «Повторить»');
        return;
    }

    if (captchaState.provider === 'internal' && !document.getElementById('reg-captcha-answer')?.value.trim()) {
        showError('reg-error', 'Решите задачу капчи');
        return;
    }

    if (captchaState.provider === 'yandex') {
        const token = captchaPayload().smartCaptchaToken;
        if (!token) {
            showError('reg-error', 'Подтвердите, что вы не робот');
            return;
        }
    }

    if (smsRequired) {
        if (!smsVerificationId) {
            showError('reg-error', 'Сначала получите SMS-код на телефон');
            return;
        }
        const smsCode = regSmsCodeInput?.value.trim().replace(/\s/g, '');
        if (!smsCode) {
            showError('reg-error', 'Введите код из SMS');
            return;
        }
    }

    try {
        const res = await fetch(AUTH_API + '/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                phone,
                email: emailRaw || null,
                username: document.getElementById('reg-username').value.trim(),
                displayName: document.getElementById('reg-display').value.trim(),
                password: document.getElementById('reg-password').value,
                personalDataConsent: true,
                smsVerificationId: smsRequired ? smsVerificationId : null,
                smsCode: smsRequired ? regSmsCodeInput?.value.trim().replace(/\s/g, '') : null,
                ...captchaPayload()
            })
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
            showError('reg-error', data.message || 'Не удалось зарегистрироваться');
            if (captchaState.provider !== 'none') loadCaptchaConfig();
            return;
        }
        storeAuthResponse(data);
        window.location.href = nextUrl;
    } catch {
        showError('reg-error', 'Ошибка сети');
    }
});
