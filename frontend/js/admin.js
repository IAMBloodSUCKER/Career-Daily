const ADMIN_API = window.__ADMIN_API__ || '/api/admin';

async function adminApi(path, options = {}) {
    const res = await fetch(ADMIN_API + path, {
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        ...options
    });
    if (res.status === 401 || res.status === 403) {
        window.location.href = '/login.html?next=' + encodeURIComponent('/admin.html');
        throw new Error('FORBIDDEN');
    }
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Ошибка');
    }
    if (res.status === 204) return null;
    return res.json();
}

function renderStats(stats) {
    document.getElementById('admin-stats').innerHTML = `
        <article class="admin-stat-card"><span class="admin-stat-num">${stats.userCount}</span><span>пользователей</span></article>
        <article class="admin-stat-card"><span class="admin-stat-num">${stats.saveCount}</span><span>сохранений</span></article>
        <article class="admin-stat-card"><span class="admin-stat-num">${stats.adminCount}</span><span>админов</span></article>`;
}

function renderUsers(users) {
    const tbody = document.getElementById('admin-users');
    if (!users.length) {
        tbody.innerHTML = '<tr><td colspan="7" class="admin-empty">Пока никого</td></tr>';
        return;
    }
    tbody.innerHTML = users.map(u => `
        <tr>
            <td>${u.id}</td>
            <td>${u.username}${u.admin ? ' <span class="admin-badge">admin</span>' : ''}</td>
            <td>${u.phone || '—'}</td>
            <td>${u.email || '—'}</td>
            <td>${u.displayName}</td>
            <td>${u.hasSave ? (u.saveSummary || 'есть') : '—'}</td>
            <td>${u.admin ? '' : `<button type="button" class="btn btn-secondary btn-sm admin-del" data-id="${u.id}">Удалить</button>`}</td>
        </tr>`).join('');

    tbody.querySelectorAll('.admin-del').forEach(btn => {
        btn.onclick = async () => {
            if (!confirm('Удалить пользователя и его сохранение?')) return;
            try {
                await adminApi('/users/' + btn.dataset.id, { method: 'DELETE' });
                await loadAdmin();
            } catch (e) {
                alert(e.message);
            }
        };
    });
}

async function loadAdmin() {
    const [stats, users] = await Promise.all([
        adminApi('/stats'),
        adminApi('/users')
    ]);
    renderStats(stats);
    renderUsers(users);
}

(async () => {
    const AUTH_API = window.__AUTH_API__ || '/api/auth';
    const me = await fetch(AUTH_API + '/me', { headers: authHeaders() });
    if (!me.ok) {
        window.location.href = '/login.html?next=' + encodeURIComponent('/admin.html');
        return;
    }
    const user = await me.json();
    if (!user.admin) {
        window.location.href = '/play.html';
        return;
    }
    try {
        await loadAdmin();
    } catch (e) {
        console.error(e);
    }
})();

document.getElementById('admin-logout')?.addEventListener('click', async () => {
    const AUTH_API = window.__AUTH_API__ || '/api/auth';
    try {
        await fetch(AUTH_API + '/logout', { method: 'POST', headers: authHeaders() });
    } catch { /* ignore */ }
    setAuthToken('');
    window.location.href = '/';
});
