async function adminApi(path, options = {}) {
    const res = await fetch('/api/admin' + path, {
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
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
        tbody.innerHTML = '<tr><td colspan="6" class="admin-empty">Пока никого</td></tr>';
        return;
    }
    tbody.innerHTML = users.map(u => `
        <tr>
            <td>${u.id}</td>
            <td>${u.username}${u.admin ? ' <span class="admin-badge">admin</span>' : ''}</td>
            <td>${u.email}</td>
            <td>${u.displayName}</td>
            <td>${u.hasSave ? (u.saveSummary || 'есть') : '—'}</td>
            <td>${u.admin ? '' : `<button type="button" class="btn btn-secondary btn-sm admin-del" data-id="${u.id}">Удалить</button>`}</td>
        </tr>`).join('');

    tbody.querySelectorAll('.admin-del').forEach(btn => {
        btn.onclick = async () => {
            if (!confirm('Удалить пользователя #' + btn.dataset.id + '?')) return;
            await adminApi('/users/' + btn.dataset.id, { method: 'DELETE' });
            await load();
        };
    });
}

async function load() {
    const [stats, users] = await Promise.all([
        adminApi('/stats'),
        adminApi('/users')
    ]);
    renderStats(stats);
    renderUsers(users);
}

document.getElementById('admin-logout').onclick = async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' });
    window.location.href = '/login.html';
};

(async () => {
    const me = await fetch('/api/auth/me', { credentials: 'same-origin' });
    if (!me.ok) {
        window.location.href = '/login.html?next=' + encodeURIComponent('/admin.html');
        return;
    }
    const user = await me.json();
    if (!user.admin) {
        window.location.href = '/play.html';
        return;
    }
    await load();
})().catch(e => alert(e.message));
