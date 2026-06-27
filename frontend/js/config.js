/** API base URLs — same-origin when served behind nginx proxy */
window.__API_ORIGIN__ = window.__API_ORIGIN__ || '';
window.__AUTH_API__ = window.__API_ORIGIN__ + '/api/auth';
window.__GAME_API__ = window.__API_ORIGIN__ + '/api/game';
window.__ADMIN_API__ = window.__API_ORIGIN__ + '/api/admin';

const AUTH_TOKEN_KEY = 'career-daily-token';

function getAuthToken() {
    try {
        return sessionStorage.getItem(AUTH_TOKEN_KEY) || '';
    } catch {
        return '';
    }
}

function setAuthToken(token) {
    try {
        if (token) sessionStorage.setItem(AUTH_TOKEN_KEY, token);
        else sessionStorage.removeItem(AUTH_TOKEN_KEY);
    } catch { /* ignore */ }
}

function authHeaders(extra = {}) {
    const headers = { ...extra };
    const token = getAuthToken();
    if (token) headers['Authorization'] = 'Bearer ' + token;
    return headers;
}
