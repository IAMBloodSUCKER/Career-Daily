const API = '/api/game';

let selectedMode = 'LEARNING';
let selectedProjectId = 'E_COMMERCE';
let selectedProject = null;
let selectedCareer = 'junior';
let previewTeam = null;
let allProjects = [];
let charOptions = null;
let selectedStack = new Set(['Java Core']);
let onboardingStep = 1;
let workspace = null;
let openApp = null;
let openWindows = new Map();
let focusedWindowId = null;
let windowZCounter = 20;
let selectedContact = null;
let slackView = 'dm';
let arrivalTimerId = null;
let arrivalSecondsLeft = 20;
let deliveredMessageIds = new Set();
let messageDripTimers = [];
let chatReplyTimers = [];
let hiddenChatMessageIds = new Set();
let typingContacts = new Set();
let pendingLateReply = null;
let lastWarnCount = 0;
let gameOverShown = false;
const ideGitState = new Map();
let ideActiveTab = 'run';
let ideTestFailure = null;
let realClockTimer = null;
let statePollTimer = null;

function taskGitBranch(task) {
    if (!task?.ticketId) return 'main';
    const prefix = task.type === 'FEATURE' ? 'feature/' : 'fix/';
    return prefix + task.ticketId.toLowerCase().replace(/_/g, '-');
}

function getIdeGitState(taskId) {
    if (!ideGitState.has(taskId)) {
        ideGitState.set(taskId, { onMain: false, log: ['# Git console — git checkout main, затем git merge <ветка>'] });
    }
    return ideGitState.get(taskId);
}

async function runIdeGitCommand(cmd, task, consoleEl, container) {
    const state = getIdeGitState(task.id);
    const branch = taskGitBranch(task);
    const prStatus = task.pullRequestStatus || 'NONE';
    const mergeDone = task.objectives?.some(o => o.type === 'MERGE_PR' && o.completed);
    const normalized = cmd.trim().replace(/\s+/g, ' ');

    const append = line => {
        state.log.push(line);
        consoleEl.textContent = state.log.join('\n');
        consoleEl.scrollTop = consoleEl.scrollHeight;
    };

    append('$ ' + cmd);

    if (normalized === 'help' || normalized === 'git help') {
        append('git checkout main | git merge ' + branch + ' | git status');
        return;
    }
    if (normalized === 'git status') {
        append('On branch ' + (state.onMain ? 'main' : branch));
        if (prStatus === 'APPROVED' && state.onMain) append('PR #' + (task.pullRequestNumber || '?') + ' approved — ready to merge');
        return;
    }
    if (normalized === 'git checkout main' || normalized === 'git checkout master') {
        state.onMain = true;
        append("Switched to branch 'main'");
        return;
    }
    if (normalized.startsWith('git checkout ') && !normalized.includes('main') && !normalized.includes('master')) {
        state.onMain = false;
        append("Switched to branch '" + branch + "'");
        return;
    }
    if (normalized.startsWith('git merge')) {
        if (mergeDone) {
            append('Already up to date — PR уже влит в main');
            return;
        }
        if (!state.onMain) {
            append('fatal: merge on wrong branch — сначала: git checkout main');
            return;
        }
        if (prStatus !== 'APPROVED') {
            append('error: PR не approved — дождитесь review в GitHub');
            return;
        }
        if (!normalized.includes(branch) && normalized !== 'git merge') {
            append('error: ожидается git merge ' + branch);
            return;
        }
        const resp = await api('/code/git/merge', { method: 'POST', body: JSON.stringify({ taskId: task.id }) });
        ws(resp);
        if (resp.console?.length) {
            resp.console.forEach(line => state.log.push(line));
            consoleEl.textContent = state.log.join('\n');
        }
        if (resp.message) showToast(resp.message);
        if (resp.success !== false) pushNotification('🐙 GitHub', 'Merged', resp.message || 'main updated', 'slack');
        renderIDE(container);
        return;
    }
    if (normalized.startsWith('git push')) {
        append(mergeDone ? 'Everything up-to-date' : 'error: сначала git merge ' + branch);
        return;
    }
    append('git: command not found — help | git checkout main | git merge ' + branch);
}

function getAppTitle(app) {
    const meta = getDesktopApp(app);
    if (meta) return meta.emoji + ' ' + meta.label;
    return { contacts: '📱 Контакты', recycle: '🗑 Корзина', coffee: '☕ Кофе' }[app] || app;
}

const CAREER_PRESETS = [
    { id: 'intern', years: 0, age: 20, education: 'STUDENT', stack: ['Java Core'], mode: 'LEARNING' },
    { id: 'junior', years: 1, age: 22, education: 'UNIVERSITY', stack: ['Java Core', 'Git'], mode: 'LEARNING' },
    { id: 'middle', years: 4, age: 28, education: 'UNIVERSITY', stack: ['Java Core', 'Spring Boot', 'SQL', 'Git'], mode: 'RELAXED' },
    { id: 'senior', years: 7, age: 32, education: 'UNIVERSITY', stack: ['Java Core', 'Spring Boot', 'SQL', 'Git', 'Kafka'], mode: 'REALISTIC' }
];

function applyCareerPreset(presetId, options = {}) {
    const preset = CAREER_PRESETS.find(p => p.id === presetId);
    if (!preset) return;
    selectedCareer = presetId;
    document.getElementById('player-exp').value = preset.years;
    document.getElementById('player-age').value = preset.age;
    const edu = document.getElementById('player-education');
    if (edu && [...edu.options].some(o => o.value === preset.education)) {
        edu.value = preset.education;
    }
    selectedStack = new Set(preset.stack);
    document.querySelectorAll('#stack-list input').forEach(cb => {
        const on = selectedStack.has(cb.value);
        cb.checked = on;
        cb.closest('.stack-chip')?.classList.toggle('selected', on);
    });
    if (options.selectMode !== false) {
        selectedMode = preset.mode;
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.classList.toggle('selected', btn.dataset.modeId === selectedMode);
        });
        updateModeDesc();
    }
    document.querySelectorAll('.career-btn').forEach(btn => {
        btn.classList.toggle('selected', btn.dataset.careerId === presetId);
    });
    const hint = document.getElementById('career-hint');
    if (hint) {
        const key = 'career.' + presetId + '.hint';
        const text = t(key);
        hint.textContent = text !== key ? text : '';
    }
    document.getElementById('char-preview')?.classList.add('hidden');
    document.getElementById('char-errors')?.classList.add('hidden');
}

function renderCareerPresets() {
    const wrap = document.getElementById('career-presets');
    if (!wrap) return;
    wrap.innerHTML = '';
    CAREER_PRESETS.forEach(preset => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'career-btn' + (preset.id === selectedCareer ? ' selected' : '');
        btn.dataset.careerId = preset.id;
        const label = t('career.' + preset.id + '.name');
        btn.textContent = label !== 'career.' + preset.id + '.name' ? label : preset.id;
        btn.onclick = () => applyCareerPreset(preset.id);
        wrap.appendChild(btn);
    });
    applyCareerPreset(selectedCareer, { selectMode: false });
}

async function fetchPreviewTeam(projectId) {
    previewTeam = await api('/team/preview?projectType=' + encodeURIComponent(projectId));
    return previewTeam;
}

// ===== API =====

async function api(path, options = {}) {
    const res = await fetch(API + path, {
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        ...options
    });
    if (res.status === 401) {
        window.location.href = '/login.html?next=' + encodeURIComponent('/play.html');
        throw new Error('UNAUTHORIZED');
    }
    if (res.status === 404) throw new Error('NO_GAME');
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Ошибка сервера');
    }
    return res.json();
}

function getCharacterForm() {
    const stack = [...document.querySelectorAll('#stack-list input:checked')].map(cb => cb.value);
    return {
        name: document.getElementById('player-name').value.trim(),
        age: parseInt(document.getElementById('player-age').value, 10) || 0,
        experienceYears: parseInt(document.getElementById('player-exp').value, 10) || 0,
        education: document.getElementById('player-education').value,
        stackSkills: stack
    };
}

function showCharErrors(errors) {
    const el = document.getElementById('char-errors');
    if (!errors.length) {
        el.classList.add('hidden');
        el.innerHTML = '';
        return;
    }
    el.classList.remove('hidden');
    el.innerHTML = errors.map(e => `<div class="char-error-item">⚠ ${e}</div>`).join('');
}

function showCharPreview(data) {
    const el = document.getElementById('char-preview');
    if (!data || !data.valid) {
        el.classList.add('hidden');
        return;
    }
    el.classList.remove('hidden');
    el.innerHTML = `
        <strong>${data.careerTitle}</strong>
        <div class="preview-stats">
            Java ${data.previewJavaSkill} · Soft ${data.previewSoftSkills} · Код ${data.previewCodeQuality}%
            · Старт $${data.previewMoney}
        </div>`;
}

async function validateCharacter() {
    const form = getCharacterForm();
    const result = await api('/character/validate', {
        method: 'POST',
        body: JSON.stringify(form)
    });
    showCharErrors(result.errors || []);
    showCharPreview(result.valid ? result : null);
    return result;
}

function ws(data) {
    workspace = data.workspace || data;
    if (workspace) workspace._dayEndNotified = false;
    if (data.console && workspace) workspace.console = data.console;
    renderAll();
    if (data.message) {
        appendEvent(data.message);
        if (!data.message.includes('Прочитано')) {
            showToast(data.message);
        }
    }
    if (workspace.gameOver) showGameOver(workspace.gameOverReason);
    else scheduleMeetingIfPending();
}

function formatRealTimeRemaining(ms) {
    const min = Math.max(0, Math.ceil(ms / 60000));
    if (min <= 0) return typeof t === 'function' ? t('game.time.done') : '0 мин';
    if (min === 1) return typeof t === 'function' ? t('game.time.oneMinute') : '1 мин';
    return typeof t === 'function' ? t('game.time.minutes', { n: min }) : `${min} мин`;
}

function computeClientClock(ws) {
    if (!ws?.atDesk || !ws.dayStartedAtEpochMs) return null;
    const dur = ws.realDayDurationMs || 3600000;
    const elapsed = Math.min(dur, Date.now() - ws.dayStartedAtEpochMs);
    const progress = elapsed / dur;
    const totalMin = Math.floor(progress * 8 * 60);
    const hour = 9 + Math.floor(totalMin / 60);
    const minute = totalMin % 60;
    const remainingMs = Math.max(0, dur - elapsed);
    return {
        timeLabel: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
        remainingMs,
        dayEnded: remainingMs <= 0
    };
}

function updateRealClockDisplay() {
    if (!workspace) return;
    const clock = computeClientClock(workspace);
    const timeStr = clock ? clock.timeLabel : (workspace.timeLabel || '09:00');
    const gClock = document.getElementById('g-clock');
    const gHours = document.getElementById('g-hours');
    const tbClock = document.getElementById('taskbar-clock');
    const p = workspace.player;
    if (gClock) gClock.textContent = timeStr;
    if (gHours) {
        const rem = clock ? clock.remainingMs : (workspace.realTimeRemainingMs ?? 0);
        gHours.textContent = '⏱ ' + formatRealTimeRemaining(rem);
    }
    if (tbClock && p) {
        tbClock.innerHTML = `<span class="clock-time">${timeStr}</span>`
            + `<span class="clock-date">День ${p.day}</span>`;
    }
    if (clock?.dayEnded && !workspace._dayEndNotified) {
        workspace._dayEndNotified = true;
        const title = typeof t === 'function' ? t('game.dayEndTitle') : 'Рабочий день';
        const body = typeof t === 'function'
            ? t('game.dayEndBody', { time: timeStr })
            : `На часах ${timeStr} — рабочий день окончен. Завершите день справа`;
        pushNotification('⏰ DevOS', title, body, 'warning');
    }
}

function startRealClock() {
    clearRealClock();
    updateRealClockDisplay();
    if (!workspace?.atDesk || !workspace.dayStartedAtEpochMs) return;
    realClockTimer = setInterval(updateRealClockDisplay, 1000);
    startStatePoll();
}

function startStatePoll() {
    clearStatePoll();
    if (!workspace?.atDesk || workspace?.gameOver) return;
    statePollTimer = setInterval(async () => {
        if (!workspace?.atDesk) return;
        try {
            const beforeIds = new Set((workspace.messages || []).map(m => m.id));
            const ws = await api('/state');
            workspace = ws;
            const hasNew = (workspace.messages || []).some(m => !m.fromPlayer && !beforeIds.has(m.id));
            renderAll();
            if (hasNew) startMessageDrip();
        } catch (_) { /* session idle */ }
    }, 30000);
}

function clearStatePoll() {
    if (statePollTimer) {
        clearInterval(statePollTimer);
        statePollTimer = null;
    }
}

function clearRealClock() {
    if (realClockTimer) {
        clearInterval(realClockTimer);
        realClockTimer = null;
    }
    clearStatePoll();
}

function pushNotification(app, title, body, type = 'slack', onClick) {
    const stack = document.getElementById('notification-stack');
    if (!stack) return;
    const el = document.createElement('div');
    el.className = 'os-notification ' + type;
    el.innerHTML = `<div class="os-notif-app">${app}</div>
        <div class="os-notif-title">${title}</div>
        <div class="os-notif-body">${body}</div>`;
    if (onClick) el.onclick = () => { onClick(); el.remove(); };
    stack.appendChild(el);
    setTimeout(() => el.remove(), 6000);
}

function showToast(text) {
    const el = document.getElementById('toast');
    if (!el) return;
    el.textContent = text;
    el.classList.remove('hidden');
    clearTimeout(showToast._timer);
    showToast._timer = setTimeout(() => el.classList.add('hidden'), 3500);
}

function showGameOver(reason) {
    if (gameOverShown) return;
    gameOverShown = true;
    const modal = document.getElementById('gameover-modal');
    if (!modal) return;
    document.getElementById('gameover-reason').textContent = reason || 'Игра окончена';
    const isWin = reason && reason.includes('Middle Developer');
    document.getElementById('gameover-title').textContent = isWin ? '🎉 Победа!' : '💼 Карьера завершена';
    modal.classList.remove('hidden');
    stopArrivalTimer();
    clearMessageDrip();
}

function hideAllScreens() {
    ['menu-screen', 'onboarding-screen', 'prelude-screen', 'arrival-screen', 'wake-screen', 'game-screen']
        .forEach(id => document.getElementById(id)?.classList.add('hidden'));
}

function stopArrivalTimer() {
    if (arrivalTimerId) {
        clearInterval(arrivalTimerId);
        arrivalTimerId = null;
    }
}

function clearMessageDrip() {
    messageDripTimers.forEach(t => clearTimeout(t));
    messageDripTimers = [];
    clearChatReplyTimers();
}

function clearChatReplyTimers() {
    chatReplyTimers.forEach(t => clearTimeout(t));
    chatReplyTimers = [];
    typingContacts.clear();
    hiddenChatMessageIds.clear();
}

function getContactName(contactId) {
    return workspace?.contacts?.find(c => c.id === contactId)?.name || contactId;
}

/** Задержка ответа: база по контакту + случайный разброс, иногда быстро/медленно */
function randomReplyDelayMs(contactId) {
    const base = { anna: 3200, maria: 2400, alex: 5000, igor: 3800, dmitry: 6500 }[contactId] || 4000;
    const roll = Math.random();
    if (roll < 0.1) return Math.round(base * (2 + Math.random() * 1.5));
    if (roll < 0.22) return Math.round(base * (0.35 + Math.random() * 0.35));
    return Math.round(base * (0.65 + Math.random() * 1.1));
}

function applyDelayedNpcReplies(resp, contactId) {
    const beforeIds = new Set((workspace?.messages || []).map(m => m.id));
    const newWs = resp.workspace || resp;
    const newNpcIds = (newWs.messages || [])
        .filter(m => !m.fromPlayer && m.contactId === contactId && !beforeIds.has(m.id))
        .map(m => m.id);

    workspace = newWs;
    if (resp.console) workspace.console = resp.console;

    if (!newNpcIds.length) {
        ws(resp);
        return;
    }

    newNpcIds.forEach(id => hiddenChatMessageIds.add(id));
    typingContacts.add(contactId);
    renderAll();
    showToast('Сообщение отправлено');

    const delay = randomReplyDelayMs(contactId);
    const t = setTimeout(() => {
        typingContacts.delete(contactId);
        newNpcIds.forEach(id => {
            hiddenChatMessageIds.delete(id);
            deliveredMessageIds.add(id);
        });
        renderAll();
        if (resp.message) {
            appendEvent(resp.message);
            showToast(resp.message);
        }
        if (workspace.gameOver) showGameOver(workspace.gameOverReason);
        else scheduleMeetingIfPending();
    }, delay);
    chatReplyTimers.push(t);
}

async function sendChatMessage(payload) {
    const contactId = payload.contactId;
    if (!contactId || typingContacts.has(contactId)) return;
    const resp = await api('/messages/send', {
        method: 'POST',
        body: JSON.stringify(payload)
    });
    applyDelayedNpcReplies(resp, contactId);
}

async function sendDelayedChatResponse(apiCall, contactId) {
    if (typingContacts.has(contactId)) return;
    const beforeIds = new Set((workspace?.messages || []).map(m => m.id));
    const resp = await apiCall();
    const newWs = resp.workspace || resp;
    const hasNewNpc = (newWs.messages || []).some(
        m => !m.fromPlayer && m.contactId === contactId && !beforeIds.has(m.id)
    );
    if (!hasNewNpc) {
        ws(resp);
        return;
    }
    applyDelayedNpcReplies(resp, contactId);
}

function startMessageDrip() {
    clearMessageDrip();
    if (!workspace) return;
    const exp = workspace.player?.experienceYears ?? 1;
    const learning = workspace.mode === 'LEARNING' || exp === 0;
    const baseDelay = learning ? 14000 : exp <= 2 ? 8000 : 4000;
    const stepDelay = learning ? 10000 : exp <= 2 ? 6000 : 3500;
    const incoming = workspace.messages.filter(m => !m.fromPlayer && !deliveredMessageIds.has(m.id));
    incoming.forEach((msg, i) => {
        const delay = baseDelay + i * stepDelay + Math.random() * 2000;
        const t = setTimeout(() => {
            deliveredMessageIds.add(msg.id);
            const contact = workspace.contacts.find(c => c.id === msg.contactId);
            const name = contact ? contact.name : 'Slack';
            pushNotification(
                '💬 Slack',
                name,
                msg.text.length > 80 ? msg.text.substring(0, 80) + '…' : msg.text,
                'slack',
                () => {
                    slackView = 'dm';
                    selectedContact = msg.contactId;
                    openAppWindow('slack');
                }
            );
        }, delay);
        messageDripTimers.push(t);
    });
}

function showWakeScene() {
    hideAllScreens();
    document.getElementById('wake-screen').classList.remove('hidden');
    const time = '11:47';
    document.getElementById('wake-clock').textContent = time;
    const statusTime = document.getElementById('wake-status-time');
    if (statusTime) statusTime.textContent = time;
    const dateEl = document.getElementById('wake-date');
    if (dateEl) {
        const now = new Date();
        dateEl.textContent = now.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' });
    }
    const name = workspace?.player?.name?.split(/\s+/)[0] || 'dev';
    document.getElementById('wake-sms-text').textContent =
        '@' + name + ' Ты где? Daily уже начался. Ответь, как будешь на месте.';
}

async function handleWakeReply(arrivalType, replyType) {
    document.getElementById('wake-screen').classList.add('hidden');
    await enterDeskFromWake(arrivalType);
    if (replyType) {
        await sendDelayedChatResponse(
            () => api('/desk/late-reply', {
                method: 'POST',
                body: JSON.stringify({ replyType })
            }),
            'anna'
        );
    }
    pendingLateReply = false;
}

function delay(ms) {
    return new Promise(r => setTimeout(r, ms));
}

async function markContactRead(contactId) {
    if (!contactId || !workspace) return;
    const hasUnread = workspace.messages.some(m => m.contactId === contactId && !m.fromPlayer && !m.read);
    if (!hasUnread) return;
    const resp = await api('/messages/read-contact', {
        method: 'POST',
        body: JSON.stringify({ contactId })
    });
    ws(resp);
}

async function markChannelRead() {
    if (!workspace) return;
    const hasUnread = workspace.messages.some(m => !m.fromPlayer && !m.read);
    if (!hasUnread) return;
    const resp = await api('/messages/read-channel', { method: 'POST', body: '{}' });
    ws(resp);
}

// ===== МЕНЮ =====

async function initMenu() {
    let modes;
    let projects;
    let options;
    try {
        [modes, projects, options] = await Promise.all([
            api('/modes'), api('/projects'), api('/character/options')
        ]);
    } catch (e) {
        console.error('initMenu', e);
        showCharErrors([t('menu.loadError')]);
        return;
    }
    if (!options?.educationLevels?.length || !options?.stackSkills?.length || !modes?.length) {
        showCharErrors([t('menu.emptyData')]);
        return;
    }
    allProjects = projects;
    charOptions = options;
    selectedProject = projects.find(p => p.id === selectedProjectId) || projects[0];
    selectedProjectId = selectedProject.id;

    const edu = document.getElementById('player-education');
    edu.innerHTML = '';
    options.educationLevels.forEach(e => {
        const opt = document.createElement('option');
        opt.value = e.id;
        opt.textContent = e.label;
        edu.appendChild(opt);
    });
    edu.value = 'UNIVERSITY';

    const stackList = document.getElementById('stack-list');
    stackList.innerHTML = '';
    options.stackSkills.forEach(skill => {
        const label = document.createElement('label');
        label.className = 'stack-chip';
        const checked = selectedStack.has(skill);
        label.innerHTML = `<input type="checkbox" value="${skill}" ${checked ? 'checked' : ''}>
            <span>${skill}</span>`;
        const cb = label.querySelector('input');
        cb.onchange = () => {
            if (cb.checked) selectedStack.add(skill);
            else selectedStack.delete(skill);
            label.classList.toggle('selected', cb.checked);
            document.getElementById('char-preview').classList.add('hidden');
            document.getElementById('char-errors').classList.add('hidden');
        };
        label.classList.toggle('selected', checked);
        stackList.appendChild(label);
    });

    document.getElementById('player-age').min = options.minAge;
    document.getElementById('player-age').max = options.maxAge;
    document.getElementById('player-exp').max = options.maxExperience;
    document.getElementById('player-exp').addEventListener('change', () => {
        const years = parseInt(document.getElementById('player-exp').value, 10) || 0;
        const match = CAREER_PRESETS.find(p => p.years === years);
        if (match) {
            selectedCareer = match.id;
            document.querySelectorAll('.career-btn').forEach(btn => {
                btn.classList.toggle('selected', btn.dataset.careerId === match.id);
            });
            const hint = document.getElementById('career-hint');
            if (hint) {
                const key = 'career.' + match.id + '.hint';
                const text = t(key);
                hint.textContent = text !== key ? text : '';
            }
        }
    });

    renderCareerPresets();

    const list = document.getElementById('mode-list');
    list.innerHTML = '';
    modes.forEach(mode => {
        const btn = document.createElement('button');
        btn.className = 'mode-btn' + (mode.id === selectedMode ? ' selected' : '');
        btn.dataset.modeId = mode.id;
        const label = t('mode.' + mode.id + '.name');
        btn.textContent = label !== 'mode.' + mode.id + '.name' ? label : mode.name;
        btn.onclick = () => {
            selectedMode = mode.id;
            document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            updateModeDesc();
        };
        list.appendChild(btn);
    });
    updateModeDesc();

    await refreshMenuResume();
}

function updateModeDesc() {
    const desc = document.getElementById('mode-desc');
    if (!desc) return;
    const key = 'mode.' + selectedMode + '.desc';
    const translated = t(key);
    desc.textContent = translated !== key ? translated : '';
}

function onLangChange() {
    updateModeDesc();
    renderCareerPresets();
    document.querySelectorAll('.mode-btn').forEach((btn, i) => {
        const modeId = btn.dataset.modeId;
        if (modeId) {
            const label = t('mode.' + modeId + '.name');
            btn.textContent = label !== 'mode.' + modeId + '.name' ? label : btn.textContent;
        }
    });
    refreshMenuResume().catch(() => {});
    applyDomTranslations();
    if (typeof openWindows !== 'undefined' && openWindows.has('portal')) {
        renderAppInWindow('portal');
    }
}

async function refreshMenuResume() {
    const panel = document.getElementById('menu-resume-panel');
    const summary = document.getElementById('menu-resume-summary');
    if (!panel || !summary) return;

    try {
        const ws = await api('/state');
        panel.classList.remove('hidden');
        const p = ws.player;
        const openTasks = (ws.tasks || []).filter(t => !t.completed).length;
        const status = ws.gameOver
            ? (ws.gameOverReason?.includes('Middle Developer')
                ? t('resume.careerDone')
                : t('resume.gameOver'))
            : ws.atDesk === false
                ? t('resume.walkToDesk')
                : t('resume.timeLeft', {
                    time: ws.timeLabel,
                    minutes: Math.max(1, Math.ceil((ws.realTimeRemainingMs || 0) / 60000))
                });
        summary.innerHTML =
            `<strong>${p.name}</strong> · ${ws.projectCompany}<br>`
            + `${t('resume.day', { day: p.day })} · ${ws.mode} · Lv.${p.level}<br>`
            + `${status}${openTasks ? ` · ${t('resume.openTasks', { n: openTasks })}` : ''}`;
        workspace = ws;
    } catch (e) {
        panel.classList.add('hidden');
        summary.textContent = '';
        if (e.message === 'NO_GAME') workspace = null;
    }
}

async function resumeGame() {
    let ws;
    try {
        ws = await api('/state');
    } catch (e) {
        alert(t('alert.noSave'));
        await refreshMenuResume();
        return;
    }

    workspace = ws;
    gameOverShown = false;
    meetingActive = false;
    document.getElementById('gameover-modal')?.classList.add('hidden');
    document.getElementById('meeting-overlay')?.classList.add('hidden');
    closeAllApps();
    closeStartMenu();

    hideAllScreens();

    if (ws.gameOver) {
        document.getElementById('game-screen').classList.remove('hidden');
        renderAll();
        showGameOver(ws.gameOverReason);
        return;
    }

    if (ws.atDesk === false) {
        appendEvent('Продолжение — доберитесь до рабочего места.');
        showArrivalScene({ prelude: false });
        return;
    }

    document.getElementById('game-screen').classList.remove('hidden');
    renderAll();
    (ws.messages || []).forEach(m => deliveredMessageIds.add(m.id));
    startMessageDrip();
    scheduleMeetingIfPending();
    scheduleDeadlineWarnings();
    pushNotification('🖥 DevOS', 'С возвращением', `День ${ws.player.day}, ${ws.timeLabel}`, 'slack');
}

async function hasSavedGame() {
    const panel = document.getElementById('menu-resume-panel');
    return panel && !panel.classList.contains('hidden');
}

async function confirmReplaceSave(message) {
    if (!(await hasSavedGame())) return true;
    return confirm(message || 'Текущий прогресс будет удалён. Продолжить?');
}

async function goToOnboarding() {
    let result;
    try {
        result = await validateCharacter();
    } catch (e) {
        showCharErrors([e.message || 'Не удалось проверить персонажа']);
        return;
    }
    if (!result.valid) return;

    const form = getCharacterForm();
    const eduLabel = charOptions.educationLevels.find(e => e.id === form.education)?.label || '';
    const internNote = form.experienceYears === 0
        ? ' Режим стажёра: только простые задачи, без Git/PR.'
        : '';
    document.getElementById('ob-welcome-text').innerHTML =
        `Привет, <strong>${form.name}</strong>! Вам ${form.age}, опыт — ${form.experienceYears} `
        + `${form.experienceYears === 1 ? 'год' : form.experienceYears < 5 ? 'года' : 'лет'}, `
        + `${eduLabel.toLowerCase()}. Стартовая роль: <strong>${result.careerTitle}</strong>.${internNote} `
        + `Сегодня первый день Java-разработчика — Slack, код, ревью и дедлайны.`;
    onboardingStep = 1;
    renderOnboarding();
    document.getElementById('menu-screen').classList.add('hidden');
    document.getElementById('onboarding-screen').classList.remove('hidden');
}

function renderOnboarding() {
    for (let i = 1; i <= 4; i++) {
        document.getElementById('ob-panel-' + i).classList.toggle('hidden', i !== onboardingStep);
        document.getElementById('ob-step-' + i).classList.toggle('active', i <= onboardingStep);
    }
    document.getElementById('ob-back-btn').classList.toggle('hidden', onboardingStep === 1);
    document.getElementById('ob-next-btn').classList.toggle('hidden', onboardingStep === 4);
    document.getElementById('start-btn').classList.toggle('hidden', onboardingStep !== 4);

    if (onboardingStep === 2) {
        document.querySelector('.onboarding-card')?.classList.add('wide');
        renderProjectList();
    } else {
        document.querySelector('.onboarding-card')?.classList.remove('wide');
    }
    if (onboardingStep === 3) renderTeamIntro();
    if (onboardingStep === 4) renderProjectOverview();
}

function renderProjectList() {
    const list = document.getElementById('project-list');
    const detail = document.getElementById('project-detail');
    list.innerHTML = '';
    allProjects.forEach(p => {
        const card = document.createElement('button');
        card.className = 'project-card' + (p.id === selectedProjectId ? ' selected' : '');
        card.innerHTML = `
            <span class="project-emoji">${p.emoji}</span>
            <div class="project-info">
                <strong>${p.companyName}</strong>
                <span class="project-type">${p.tagline}</span>
            </div>`;
        card.onclick = () => {
            selectedProjectId = p.id;
            selectedProject = p;
            renderProjectList();
        };
        list.appendChild(card);
    });
    renderProjectDetail(selectedProject);
}

function renderProjectDetail(p) {
    const detail = document.getElementById('project-detail');
    if (!detail) return;
    if (!p) {
        detail.innerHTML = '<p class="project-detail-placeholder">Выберите проект из списка</p>';
        return;
    }
    detail.innerHTML = `
        <h3>${p.emoji} ${p.productName}</h3>
        <p class="project-detail-tagline">${p.tagline}</p>
        <div class="project-detail-meta">
            <div><strong>Компания:</strong> ${p.companyName}</div>
            <div><strong>Ваша роль:</strong> ${p.yourRole}</div>
            <div><strong>Slack:</strong> ${p.slackChannel}</div>
        </div>
        <h4>О проекте</h4>
        <p class="project-detail-desc">${p.description}</p>
        <h4>Архитектура</h4>
        <p class="project-detail-arch">${p.architecture}</p>
        ${typeof renderArchitectureDiagrams === 'function' ? renderArchitectureDiagrams(p.id) : ''}
        <h4>Tech Stack</h4>
        <div class="tech-stack">${p.techStack.map(t => `<span class="tech-tag">${t}</span>`).join('')}</div>
        ${p.introSteps?.length ? `
            <h4>Первый день</h4>
            <ul class="project-detail-steps">${p.introSteps.map(s => `<li>${s}</li>`).join('')}</ul>` : ''}`;
}

async function renderTeamIntro() {
    if (!selectedProject) return;
    const list = document.getElementById('team-list');
    const sub = document.getElementById('ob-team-sub');
    list.innerHTML = '<p class="ob-sub">…</p>';
    try {
        previewTeam = await fetchPreviewTeam(selectedProjectId);
    } catch (e) {
        previewTeam = selectedProject.team || [];
    }
    const team = previewTeam || [];
    if (sub) {
        sub.textContent = typeof t === 'function'
            ? t('ob.team.sub', { n: team.length, channel: selectedProject.slackChannel })
            : `Команда из ${team.length} человек — ${selectedProject.slackChannel}`;
    }
    list.innerHTML = '';
    team.forEach(m => {
        const card = document.createElement('div');
        card.className = 'team-card';
        card.innerHTML = `
            <span class="team-avatar">${m.avatar}</span>
            <div>
                <strong>${m.name}</strong> — ${m.role}
                <p class="team-bio">${m.bio || ''}</p>
                ${m.greeting ? `<p class="team-greeting">«${m.greeting}»</p>` : ''}
            </div>`;
        list.appendChild(card);
    });
    const refreshBtn = document.createElement('button');
    refreshBtn.type = 'button';
    refreshBtn.className = 'btn btn-secondary btn-sm team-refresh-btn';
    refreshBtn.textContent = typeof t === 'function' ? t('ob.team.refresh') : 'Другой состав';
    refreshBtn.onclick = () => renderTeamIntro();
    list.appendChild(refreshBtn);
}

function renderProjectOverview() {
    if (!selectedProject) return;
    const p = selectedProject;
    document.getElementById('ob-project-title').textContent = p.emoji + ' ' + p.productName;
    document.getElementById('ob-project-tagline').textContent = p.tagline;
    document.getElementById('ob-project-desc').textContent = p.description;
    document.getElementById('ob-your-role').textContent = p.yourRole;
    document.getElementById('ob-tech-stack').innerHTML =
        p.techStack.map(t => `<span class="tech-tag">${t}</span>`).join('');
    document.getElementById('ob-architecture').textContent = '🏗 ' + p.architecture;
    const diagramEl = document.getElementById('ob-architecture-diagram');
    if (diagramEl && typeof renderArchitectureDiagrams === 'function') {
        diagramEl.innerHTML = renderArchitectureDiagrams(p.id);
    }
    document.getElementById('ob-first-day').textContent =
        '💡 ' + (p.introSteps[2] || p.introSteps[0]);
}

async function startGame() {
    if (!(await confirmReplaceSave('Начать новую игру? Текущий прогресс будет удалён.'))) {
        return;
    }
    const form = getCharacterForm();
    const resp = await api('/start', {
        method: 'POST',
        body: JSON.stringify({
            playerName: form.name,
            mode: selectedMode,
            projectType: selectedProjectId,
            age: form.age,
            experienceYears: form.experienceYears,
            education: form.education,
            stackSkills: form.stackSkills,
            wallpaperIndex: nextWallpaperIndex()
        })
    });
    if (!resp.success) {
        alert(resp.message || 'Не удалось начать игру');
        return;
    }
    workspace = resp.workspace;
    deliveredMessageIds.clear();
    document.getElementById('onboarding-screen').classList.add('hidden');
    clearEventLog();
    appendEvent(resp.message);
    showArrivalScene({ prelude: true });
}

function returnToMenu() {
    closeAllApps();
    closeStartMenu();
    meetingActive = false;
    if (meetingTypingTimer) clearInterval(meetingTypingTimer);
    document.getElementById('meeting-overlay')?.classList.add('hidden');
    clearMessageDrip();
    stopArrivalTimer();
    gameOverShown = false;
    lastWarnCount = workspace?.player?.warnings || 0;
    document.getElementById('gameover-modal')?.classList.add('hidden');
    document.getElementById('char-preview')?.classList.add('hidden');
    document.getElementById('char-errors')?.classList.add('hidden');
    hideAllScreens();
    document.getElementById('menu-screen').classList.remove('hidden');
    refreshMenuResume();
}

// ===== РЕНДЕР =====

function renderAll() {
    if (!workspace) return;
    const p = workspace.player;

    document.getElementById('g-name').textContent = p.name;
    document.getElementById('g-level').textContent = 'Lv.' + p.level;
    document.getElementById('g-project').textContent =
        (workspace.projectEmoji || '') + ' ' + (workspace.projectCompany || '');
    document.getElementById('g-day').textContent = 'День ' + p.day;
    document.getElementById('g-mode').textContent = workspace.mode;
    const careerEl = document.getElementById('g-career');
    if (careerEl) careerEl.textContent = p.careerTitle || '';
    document.getElementById('g-clock').textContent = workspace.timeLabel;
    document.getElementById('g-slack').textContent = workspace.slackChannel || '';
    document.getElementById('g-hours').textContent = '⏱ ' + formatRealTimeRemaining(workspace.realTimeRemainingMs ?? 0);
    const tbClock = document.getElementById('taskbar-clock');
    if (tbClock) {
        tbClock.innerHTML = `<span class="clock-time">${workspace.timeLabel || '09:00'}</span>`
            + `<span class="clock-date">День ${p.day}</span>`;
    }
    const tbProject = document.getElementById('taskbar-project');
    if (tbProject) tbProject.textContent = workspace.projectCompany || '';

    applyDesktopWallpaper(workspace.projectType || selectedProjectId, workspace.projectEmoji, workspace.projectCompany);
    updateRecycleBadge();

    setBar('bar-exp', p.exp / p.expToNextLevel);
    document.getElementById('val-exp').textContent = p.exp + ' / ' + p.expToNextLevel;
    document.getElementById('val-money').textContent = '$' + p.money;
    setBar('bar-stress', p.stress / 100);
    document.getElementById('val-stress').textContent = p.stress + '%';
    setBar('bar-health', p.health / 100);
    document.getElementById('val-health').textContent = p.health + '%';
    setBar('bar-energy', p.energy / 100);
    document.getElementById('val-energy').textContent = p.energy + '%';
    setBar('bar-java', p.javaSkill / 100);
    document.getElementById('val-java').textContent = p.javaSkill + ' / 100';
    setBar('bar-soft', p.softSkills / 100);
    document.getElementById('val-soft').textContent = p.softSkills + ' / 100';
    setBar('bar-code', p.codeQuality / 100);
    document.getElementById('val-code').textContent = p.codeQuality + '%';
    setBar('bar-colleagues', p.colleagueRating / 10);
    const colBar = document.getElementById('bar-colleagues');
    if (colBar) colBar.classList.toggle('low', p.colleagueRating <= 3);
    document.getElementById('val-colleagues').textContent = p.colleagueRating + ' / 10';

    const paceEl = document.getElementById('career-pace-hint');
    if (paceEl) {
        const minDays = workspace.minGameDays || 7;
        const open = workspace.tasks.filter(t => !t.completed).length;
        const weekProgress = typeof t === 'function'
            ? t('game.weekProgress', { day: p.day, total: minDays })
            : `Неделя: день ${p.day}/${minDays}`;
        if (p.experienceYears === 0) {
            paceEl.textContent = `📅 ${weekProgress} · 🌱 стажёр · ${open} задач`;
        } else if (p.experienceYears <= 2) {
            paceEl.textContent = `📅 ${weekProgress} · 📘 junior · ${open} задач`;
        } else {
            paceEl.textContent = `📅 ${weekProgress} · ${open} задач`;
        }
        if (p.level >= 10 && p.day < minDays) {
            paceEl.textContent += typeof t === 'function'
                ? ' · ' + t('game.winAfterWeek', { n: minDays })
                : ` · победа после ${minDays}-го дня`;
        }
    }

    startRealClock();

    const warnEl = document.getElementById('val-warnings');
    const warnCount = p.warnings || 0;
    if (warnEl) {
        warnEl.textContent = warnCount + ' / 5';
        warnEl.className = 'warnings-value' + (warnCount >= 4 ? ' critical' : warnCount >= 2 ? ' elevated' : '');
    }
    renderWarningsList(p);

    const deskLock = document.getElementById('desk-lock');
    if (deskLock) deskLock.classList.toggle('hidden', workspace.atDesk !== false);

    const officeWalkBtn = document.getElementById('office-walk-btn');
    if (officeWalkBtn) officeWalkBtn.classList.toggle('hidden', !workspace.atDesk);

    if (warnCount > lastWarnCount) {
        const latest = (p.hrWarnings || [])[warnCount - 1];
        const reason = latest?.reason || 'Нарушение трудовой дисциплины';
        pushNotification('⚠ HR', 'Дисциплинарное предупреждение',
            reason + ' · ' + warnCount + '/5', 'danger');
        lastWarnCount = warnCount;
    }

    const unread = workspace.contacts.reduce((s, c) => s + c.unread, 0);
    ['slack-badge', 'tb-slack-badge'].forEach(id => {
        const badge = document.getElementById(id);
        if (!badge) return;
        badge.textContent = unread;
        badge.classList.toggle('hidden', unread === 0);
    });

    renderObjectives();
    renderTaskList();
    renderRestList();

    if (openWindows.size) {
        openWindows.forEach((_, appId) => renderAppInWindow(appId));
    } else if (openApp) {
        renderAppInWindow(openApp);
    }

    if (typeof updateMeetingReminder === 'function') updateMeetingReminder();

    if (workspace.gameOver) showGameOver(workspace.gameOverReason);
}

function scheduleDeadlineWarnings() {
    const rem = workspace?.realTimeRemainingMs ?? 0;
    if (!workspace || rem > 10 * 60 * 1000) return;
    const open = workspace.tasks?.filter(t => !t.completed).length || 0;
    if (open > 0) {
        pushNotification('📋 JIRA', 'Дедлайн!', open + ' задач не закрыты до конца дня', 'warning',
            () => openAppWindow('jira'));
    }
}

function setBar(id, ratio) {
    document.getElementById(id).style.width = Math.min(100, Math.max(0, ratio * 100)) + '%';
}

function renderWarningsList(p) {
    const listEl = document.getElementById('warnings-list');
    if (!listEl) return;
    const items = p.hrWarnings || [];
    if (!items.length) {
        listEl.innerHTML = (p.warnings || 0) > 0
            ? '<li class="warnings-empty">Есть предупреждения — начните новую игру для журнала</li>'
            : '<li class="warnings-empty">Пока чисто — так держать ✓</li>';
        return;
    }
    listEl.innerHTML = items.map(w =>
        `<li><span class="warn-day">Д${w.day}</span> ${escapeHtml(w.reason)}</li>`
    ).join('');
}

function escapeHtml(text) {
    const d = document.createElement('div');
    d.textContent = text;
    return d.innerHTML;
}

function getFocusedTask() {
    return workspace.tasks.find(t => t.focused) ||
        workspace.tasks.find(t => t.id === workspace.focusedTaskId) ||
        workspace.tasks.find(t => !t.completed);
}

function getTaskForContact(contactId) {
    if (!workspace?.tasks) return null;

    for (const t of workspace.tasks) {
        if (t.completed) continue;
        const pendingReply = t.objectives?.find(o =>
            o.type === 'REPLY_MESSAGE' && !o.completed && o.contactId === contactId);
        if (pendingReply) return t;
    }
    for (const t of workspace.tasks) {
        if (t.completed) continue;
        const pendingRead = t.objectives?.find(o =>
            o.type === 'READ_MESSAGE' && !o.completed && o.contactId === contactId);
        if (pendingRead) return t;
    }
    return workspace.tasks.find(t =>
        !t.completed && (
            t.primaryContactId === contactId ||
            workspace.messages.some(m => m.contactId === contactId && m.taskId === t.id)
        )
    ) || null;
}

function contactHasActiveTasks(contactId) {
    return workspace?.tasks?.some(t =>
        !t.completed && (
            t.objectives?.some(o => o.contactId === contactId && !o.completed) ||
            workspace.messages.some(m => m.contactId === contactId && m.taskId === t.id)
        )
    );
}

function getTicketForMessage(msg) {
    if (!msg?.taskId) return null;
    return workspace?.tasks?.find(t => t.id === msg.taskId)?.ticketId || null;
}

function hasPendingReply(task, contactId) {
    if (!task || !contactId) return false;
    return task.objectives.some(o =>
        o.type === 'REPLY_MESSAGE' && !o.completed && o.contactId === contactId
    );
}

function getWelcomeReplies(contactId) {
    const replies = {
        anna: [
            { id: 'welcome-thanks', text: 'Спасибо! Рад быть в команде 🙌' },
            { id: 'welcome-ready', text: 'Понял, готов к работе!' }
        ],
        alex: [{ id: 'welcome-ask', text: 'Спасибо! С чего начать?' }],
        maria: [{ id: 'welcome-hi', text: 'Привет! Сейчас посмотрю задачи.' }]
    };
    return replies[contactId] || [{ id: 'welcome-ok', text: 'Понял, спасибо!' }];
}

function renderObjectives() {
    const el = document.getElementById('objectives-list');
    const task = getFocusedTask();
    if (!task) {
        el.innerHTML = '<p class="hint-text">Выберите задачу в JIRA или прочитайте Slack</p>';
        return;
    }
    el.innerHTML = `<p class="task-focus-title">${task.ticketId}: ${task.title}</p>`;
    task.objectives.forEach(obj => {
        const div = document.createElement('div');
        div.className = 'objective-item' + (obj.completed ? ' done' : '');
        div.textContent = (obj.completed ? '✅ ' : '⬜ ') + obj.label;
        el.appendChild(div);
    });
}

function renderTaskList() {
    const list = document.getElementById('task-list');
    list.innerHTML = '';
    workspace.tasks.filter(t => !t.completed).forEach(task => {
        const btn = document.createElement('button');
        btn.className = 'task-card' + (task.focused ? ' focused' : '');
        btn.textContent = task.ticketId + ' · ' + task.title;
        btn.onclick = async () => {
            ws(await api('/task/focus', { method: 'POST', body: JSON.stringify({ taskId: task.id }) }));
            openAppWindow('jira');
        };
        list.appendChild(btn);
    });
    if (!workspace.tasks.some(t => !t.completed)) {
        list.innerHTML = '<p class="hint-label">✅ Все задачи закрыты</p>';
    }
}

function renderRestList() {
    const list = document.getElementById('rest-list');
    list.innerHTML = '';
    workspace.restActions.forEach(a => {
        const btn = document.createElement('button');
        btn.className = 'rest-card';
        btn.textContent = a.title + ' (' + a.durationHours + 'ч)';
        btn.onclick = () => startRestAction(a.id);
        list.appendChild(btn);
    });
}

function startRestAction(actionId) {
    if (typeof showBreakScene === 'function' && BREAK_SCENES[actionId]) {
        showBreakScene(actionId, async dialogueChoice => {
            ws(await api('/rest', {
                method: 'POST',
                body: JSON.stringify({ action: actionId, dialogueChoice: dialogueChoice || undefined })
            }));
        });
    } else {
        api('/rest', { method: 'POST', body: JSON.stringify({ action: actionId }) }).then(ws);
    }
}

// ===== ОКНА ПРИЛОЖЕНИЙ (multi-window) =====

const WINDOW_CASCADE = [
    { top: 6, left: 8 },
    { top: 9, left: 11 },
    { top: 12, left: 14 },
    { top: 15, left: 17 },
    { top: 18, left: 20 }
];

let windowDragState = null;

function attachWindowDrag(titlebar, winEl, appId) {
    titlebar.addEventListener('mousedown', e => {
        if (e.button !== 0) return;
        if (e.target.closest('.app-titlebar-controls')) return;

        e.preventDefault();
        focusWindow(appId);

        const container = document.getElementById('desktop-windows');
        const containerRect = container.getBoundingClientRect();
        const winRect = winEl.getBoundingClientRect();

        winEl.style.left = (winRect.left - containerRect.left) + 'px';
        winEl.style.top = (winRect.top - containerRect.top) + 'px';

        windowDragState = {
            el: winEl,
            container,
            offsetX: e.clientX - winRect.left,
            offsetY: e.clientY - winRect.top
        };
        winEl.classList.add('dragging');
    });
}

document.addEventListener('mousemove', e => {
    if (!windowDragState) return;
    const { el, container, offsetX, offsetY } = windowDragState;
    const cr = container.getBoundingClientRect();
    const wr = el.getBoundingClientRect();

    let left = e.clientX - cr.left - offsetX;
    let top = e.clientY - cr.top - offsetY;
    const maxLeft = Math.max(0, cr.width - wr.width);
    const maxTop = Math.max(0, cr.height - wr.height);
    left = Math.max(0, Math.min(left, maxLeft));
    top = Math.max(0, Math.min(top, maxTop));

    el.style.left = left + 'px';
    el.style.top = top + 'px';
});

document.addEventListener('mouseup', () => {
    if (!windowDragState) return;
    windowDragState.el.classList.remove('dragging');
    windowDragState = null;
});

function createAppWindowElement(appId) {
    const idx = openWindows.size % WINDOW_CASCADE.length;
    const pos = WINDOW_CASCADE[idx];
    const meta = getDesktopApp(appId);
    const title = getAppTitle(appId).replace(/^[^\s]+\s/, '');

    const win = document.createElement('div');
    win.className = 'app-window';
    win.dataset.app = appId;
    win.style.top = pos.top + '%';
    win.style.left = pos.left + '%';

    win.innerHTML = `
        <div class="app-titlebar">
            <div class="app-titlebar-left">
                <span class="app-title-icon">${meta?.emoji || (appId === 'contacts' ? '📱' : appId === 'recycle' ? '🗑' : '📦')}</span>
                <span class="app-title-text">${title}</span>
            </div>
            <div class="app-titlebar-controls">
                <button type="button" class="win-btn win-min" title="Свернуть">─</button>
                <button type="button" class="win-btn win-max" disabled title="Развернуть">□</button>
                <button type="button" class="win-btn win-close" title="Закрыть">✕</button>
            </div>
        </div>
        <div class="app-loader hidden">
            <div class="loader-spinner"></div>
            <span class="app-loader-text">Загрузка…</span>
        </div>
        <div class="app-content"></div>`;

    attachWindowDrag(win.querySelector('.app-titlebar'), win, appId);
    win.querySelector('.win-close').onclick = e => { e.stopPropagation(); closeApp(appId); };
    win.querySelector('.win-min').onclick = e => { e.stopPropagation(); minimizeWindow(appId); };
    win.addEventListener('mousedown', () => focusWindow(appId));

    return win;
}

function focusWindow(appId) {
    if (!openWindows.has(appId)) return;
    focusedWindowId = appId;
    openApp = appId;
    windowZCounter += 1;
    openWindows.forEach((state, id) => {
        const focused = id === appId;
        state.el.classList.toggle('focused', focused);
        state.el.style.zIndex = focused ? windowZCounter : 20 + [...openWindows.keys()].indexOf(id);
        if (focused && state.minimized) {
            state.minimized = false;
            state.el.classList.remove('minimized');
        }
    });
    syncTaskbarActive(appId, [...openWindows.keys()]);
}

function minimizeWindow(appId) {
    const state = openWindows.get(appId);
    if (!state) return;
    state.minimized = true;
    state.el.classList.add('minimized');
    const remaining = [...openWindows.keys()].filter(id => !openWindows.get(id).minimized);
    if (focusedWindowId === appId) {
        focusedWindowId = remaining.length ? remaining[remaining.length - 1] : null;
        openApp = focusedWindowId;
        if (focusedWindowId) focusWindow(focusedWindowId);
        else syncTaskbarActive(null, [...openWindows.keys()]);
    }
}

function closeAllApps() {
    [...openWindows.keys()].forEach(id => closeApp(id));
}

async function openAppWindow(app) {
    if (!workspace?.atDesk) {
        pushNotification('🔒 DevOS', 'Доступ заблокирован', 'Сначала подойдите к рабочему месту', 'warning');
        return;
    }
    closeStartMenu();

    if (openWindows.has(app)) {
        focusWindow(app);
        renderAppInWindow(app);
        return;
    }

    const container = document.getElementById('desktop-windows');
    const winEl = createAppWindowElement(app);
    container.appendChild(winEl);

    const state = {
        el: winEl,
        contentEl: winEl.querySelector('.app-content'),
        loaderEl: winEl.querySelector('.app-loader'),
        loaderTextEl: winEl.querySelector('.app-loader-text'),
        minimized: false
    };
    openWindows.set(app, state);
    focusWindow(app);

    const meta = getDesktopApp(app);
    state.contentEl.classList.add('hidden');
    state.loaderEl.classList.remove('hidden');
    state.loaderTextEl.textContent =
        meta?.loadText || (app === 'contacts' ? 'Загрузка контактов…' : app === 'recycle' ? 'Открываю корзину…' : 'Загрузка…');

    await delay(meta?.loadMs || (app === 'recycle' ? 400 : 1000));

    state.loaderEl.classList.add('hidden');
    state.contentEl.classList.remove('hidden');

    if (app === 'slack' || app === 'contacts') {
        const firstUnread = workspace.contacts.find(c => c.unread > 0);
        if (firstUnread) {
            slackView = 'dm';
            selectedContact = firstUnread.id;
        } else if (!selectedContact) {
            selectedContact = workspace.contacts[0]?.id;
        }
    }
    renderAppInWindow(app);
}

function closeApp(app) {
    const id = app || focusedWindowId;
    if (!id) return;
    const state = openWindows.get(id);
    if (state) {
        state.el.remove();
        openWindows.delete(id);
    }
    if (focusedWindowId === id) {
        const keys = [...openWindows.keys()];
        focusedWindowId = keys.length ? keys[keys.length - 1] : null;
        openApp = focusedWindowId;
        if (focusedWindowId) focusWindow(focusedWindowId);
    }
    syncTaskbarActive(focusedWindowId, [...openWindows.keys()]);
}

function renderAppInWindow(app) {
    const state = openWindows.get(app);
    if (!state) return;
    renderApp(app, state.contentEl);
}

function renderApp(app, container) {
    if (!container) {
        renderAppInWindow(app);
        return;
    }
    container.innerHTML = '';
    if (app === 'slack' || app === 'contacts') renderSlack(container, app);
    else if (app === 'ide') renderIDE(container);
    else if (app === 'jira') renderJira(container);
    else if (app === 'recycle') renderRecycleBin(container);
    else if (renderExtraApp(app, container)) { /* handled */ }
    else if (app === 'coffee') {
        closeApp(app);
        startRestAction('COFFEE');
    }
}

function rerenderSlackApp(appId = 'slack') {
    if (openWindows.has(appId)) renderAppInWindow(appId);
}

function slackTotalUnread() {
    return (workspace?.contacts || []).reduce((s, c) => s + (c.unread || 0), 0);
}

function renderSlack(container, appId) {
    container.innerHTML = '';
    const totalUnread = slackTotalUnread();
    const app = document.createElement('div');
    app.className = 'slack-app';

    const rail = document.createElement('aside');
    rail.className = 'slack-rail';
    [
        { id: 'home', icon: '🏠', title: 'Каналы', onClick: () => { slackView = 'channel'; rerenderSlackApp(appId); } },
        { id: 'dms', icon: '💬', title: 'Личные сообщения', onClick: () => {
            slackView = 'dm';
            if (!selectedContact) {
                selectedContact = workspace.contacts.find(c => c.unread > 0)?.id || workspace.contacts[0]?.id;
            }
            rerenderSlackApp(appId);
        }},
        { id: 'more', icon: '⋯', title: 'Ещё', onClick: () => showToast('Slack: поиск и настройки скоро') }
    ].forEach(item => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'slack-rail-btn'
            + ((item.id === 'home' && slackView === 'channel') || (item.id === 'dms' && slackView === 'dm') ? ' active' : '');
        btn.title = item.title;
        const icon = document.createElement('span');
        icon.textContent = item.icon;
        btn.appendChild(icon);
        if (item.id === 'dms' && totalUnread > 0) {
            const pill = document.createElement('span');
            pill.className = 'slack-rail-unread';
            pill.textContent = totalUnread > 9 ? '9+' : String(totalUnread);
            btn.appendChild(pill);
        }
        btn.onclick = item.onClick;
        rail.appendChild(btn);
    });

    const sidebar = document.createElement('aside');
    sidebar.className = 'slack-sidebar';
    const wsInitial = (workspace.projectCompany || 'WS').slice(0, 2).toUpperCase();
    const channelName = (workspace.slackChannel || '#team').replace(/^#/, '');
    sidebar.innerHTML = `<div class="slack-ws-head"><span class="slack-ws-icon">${wsInitial}</span><span class="slack-ws-name">${workspace.projectCompany || 'Workspace'}</span></div>`;

    if (totalUnread > 0) {
        const unreadBanner = document.createElement('div');
        unreadBanner.className = 'slack-unread-banner';
        const names = workspace.contacts.filter(c => c.unread > 0).map(c => c.name).slice(0, 3).join(', ');
        const extra = workspace.contacts.filter(c => c.unread > 0).length;
        unreadBanner.textContent = extra === 1
            ? `Непрочитанное от ${names}`
            : `Непрочитанные (${totalUnread}): ${names}${extra > 3 ? '…' : ''}`;
        sidebar.appendChild(unreadBanner);
    }

    const channelSection = document.createElement('div');
    channelSection.className = 'slack-sidebar-section';
    channelSection.textContent = 'Channels';
    sidebar.appendChild(channelSection);

    const channelUnread = totalUnread;
    const channelBtn = document.createElement('button');
    channelBtn.type = 'button';
    channelBtn.className = 'slack-channel' + (slackView === 'channel' ? ' active' : '') + (channelUnread > 0 ? ' has-unread' : '');
    channelBtn.innerHTML = `<span class="slack-dm-name"># ${channelName}</span>`;
    if (channelUnread > 0) {
        channelBtn.innerHTML += `<span class="slack-dm-unread">${channelUnread > 9 ? '9+' : channelUnread}</span>`;
    }
    channelBtn.onclick = () => { slackView = 'channel'; rerenderSlackApp(appId); };
    sidebar.appendChild(channelBtn);

    const dmSection = document.createElement('div');
    dmSection.className = 'slack-sidebar-section';
    dmSection.textContent = 'Direct messages';
    sidebar.appendChild(dmSection);

    const sortedContacts = [...workspace.contacts].sort((a, b) => {
        if ((b.unread || 0) !== (a.unread || 0)) return (b.unread || 0) - (a.unread || 0);
        return a.name.localeCompare(b.name, 'ru');
    });

    sortedContacts.forEach(c => {
        const btn = document.createElement('button');
        btn.type = 'button';
        const isActive = slackView === 'dm' && selectedContact === c.id;
        btn.className = 'slack-dm'
            + (isActive ? ' active' : '')
            + (c.unread > 0 ? ' has-unread' : '');
        btn.innerHTML = `<span class="slack-dm-avatar">${c.avatar}</span><span class="slack-dm-name">${c.name}</span>`;
        if (c.unread > 0) {
            btn.innerHTML += `<span class="slack-dm-unread">${c.unread > 9 ? '9+' : c.unread}</span>`;
        }
        btn.onclick = async () => {
            slackView = 'dm';
            selectedContact = c.id;
            try {
                await markContactRead(c.id);
            } catch (_) { /* noop */ }
            rerenderSlackApp(appId);
        };
        sidebar.appendChild(btn);
    });

    const main = document.createElement('main');
    main.className = 'slack-main';

    if (slackView === 'channel') {
        renderSlackChannelMain(main, appId);
    } else {
        if (!selectedContact) {
            selectedContact = workspace.contacts.find(c => c.unread > 0)?.id || workspace.contacts[0]?.id;
        }
        renderSlackDmMain(main, appId, selectedContact);
    }

    app.append(rail, sidebar, main);
    container.appendChild(app);
}

function renderSlackChannelMain(main, appId) {
    const channelName = (workspace.slackChannel || '#team').replace(/^#/, '');
    const topbar = document.createElement('header');
    topbar.className = 'slack-topbar';
    topbar.innerHTML = `<span class="slack-topbar-title"># ${channelName}</span>
        <span class="slack-topbar-meta">${workspace.contacts.length} участников</span>`;

    const messages = document.createElement('div');
    messages.className = 'slack-messages';
    const channelMsgs = workspace.messages
        .filter(m => !hiddenChatMessageIds.has(m.id))
        .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

    if (!channelMsgs.length) {
        messages.innerHTML = '<p class="slack-empty">Канал пуст. Сообщения коллег появятся в течение дня.</p>';
    } else {
        channelMsgs.forEach(m => {
            const row = document.createElement('div');
            const isUnread = !m.fromPlayer && !m.read;
            row.className = 'slack-msg' + (m.fromPlayer ? ' slack-msg--mine' : '') + (isUnread ? ' slack-msg--unread' : '');
            const avatar = m.fromPlayer ? '👨‍💻' : (workspace.contacts.find(c => c.id === m.contactId)?.avatar || '💬');
            const ticket = getTicketForMessage(m);
            row.innerHTML = `<span class="slack-msg-avatar">${avatar}</span>
                <div class="slack-msg-body">
                    <div class="slack-msg-meta">
                        <strong>${m.fromPlayer ? 'Вы' : getContactName(m.contactId)}</strong>
                        ${ticket ? `<span class="chat-task-tag">${ticket}</span>` : ''}
                    </div>
                    <div class="slack-msg-text">${escapeHtml(m.text)}</div>
                </div>`;
            row.style.cursor = m.fromPlayer ? 'default' : 'pointer';
            if (!m.fromPlayer) {
                row.onclick = () => {
                    slackView = 'dm';
                    selectedContact = m.contactId;
                    markContactRead(m.contactId).finally(() => rerenderSlackApp(appId));
                };
            }
            messages.appendChild(row);
        });
    }

    const compose = document.createElement('footer');
    compose.className = 'slack-compose slack-compose-channel';
    compose.innerHTML = '<p class="reply-hint">💡 Ответьте в личных сообщениях — выберите контакт слева или нажмите на сообщение.</p>';

    main.append(topbar, messages, compose);

    if (channelMsgs.some(m => !m.fromPlayer && !m.read)) {
        scheduleSlackMarkChannelRead(appId);
    }
}

function renderSlackDmMain(main, appId, contactId) {
    const contact = workspace.contacts.find(c => c.id === contactId);
    const topbar = document.createElement('header');
    topbar.className = 'slack-topbar';
    topbar.innerHTML = `<span class="slack-topbar-title">${contact?.avatar || '💬'} ${contact?.name || 'Direct message'}</span>
        <span class="slack-topbar-meta">${contact?.role || ''}</span>`;

    const messages = document.createElement('div');
    messages.className = 'slack-messages';
    workspace.messages.filter(m => m.contactId === contactId && !hiddenChatMessageIds.has(m.id)).forEach(m => {
        const row = document.createElement('div');
        const isUnread = !m.fromPlayer && !m.read;
        row.className = 'slack-msg' + (m.fromPlayer ? ' slack-msg--mine' : '') + (isUnread ? ' slack-msg--unread' : '');
        const avatar = m.fromPlayer ? '👨‍💻' : (contact?.avatar || '💬');
        const ticket = getTicketForMessage(m);
        row.innerHTML = `<span class="slack-msg-avatar">${avatar}</span>
            <div class="slack-msg-body">
                <div class="slack-msg-meta">
                    <strong>${m.fromPlayer ? 'Вы' : getContactName(m.contactId)}</strong>
                    ${ticket ? `<span class="chat-task-tag">${ticket}</span>` : ''}
                </div>
                <div class="slack-msg-text">${escapeHtml(m.text)}</div>
            </div>`;
        messages.appendChild(row);
    });

    if (typingContacts.has(contactId)) {
        const typing = document.createElement('div');
        typing.className = 'chat-typing slack-typing';
        typing.innerHTML = `<span class="chat-typing-label">${getContactName(contactId)} печатает</span><span class="chat-typing-dots"><span></span><span></span><span></span></span>`;
        messages.appendChild(typing);
    }

    const contactTask = getTaskForContact(contactId);
    const replies = document.createElement('div');
    replies.className = 'reply-options slack-replies';
    const chatBusy = typingContacts.has(contactId);

    if (contactTask && hasPendingReply(contactTask, contactId) && contactTask.replyOptions.length > 0) {
        const hint = document.createElement('p');
        hint.className = 'reply-hint';
        hint.textContent = '💡 Ответ по задаче ' + contactTask.ticketId + ':';
        replies.appendChild(hint);
        contactTask.replyOptions.forEach(opt => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'reply-btn';
            btn.textContent = opt.text;
            btn.onclick = () => sendChatMessage({ contactId, replyOptionId: opt.id });
            btn.disabled = chatBusy;
            replies.appendChild(btn);
        });
    } else if (workspace.pendingWorkloadContactId === contactId) {
        const hint = document.createElement('p');
        hint.className = 'reply-hint';
        hint.textContent = '💡 Team Lead спрашивает про загрузку:';
        replies.appendChild(hint);
        [
            { id: 'workload-yes', text: 'Да, ещё есть в работе' },
            { id: 'workload-no', text: 'Нет, всё закрыл — можно ещё' }
        ].forEach(opt => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'reply-btn';
            btn.textContent = opt.text;
            btn.onclick = () => sendChatMessage({ contactId, replyOptionId: opt.id });
            btn.disabled = chatBusy;
            replies.appendChild(btn);
        });
    } else if (!contactHasActiveTasks(contactId)) {
        const hint = document.createElement('p');
        hint.className = 'reply-hint';
        hint.textContent = '💬 Быстрые ответы:';
        replies.appendChild(hint);
        getWelcomeReplies(contactId).forEach(opt => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'reply-btn reply-btn-casual';
            btn.textContent = opt.text;
            btn.onclick = () => sendChatMessage({ contactId, text: opt.text });
            btn.disabled = chatBusy;
            replies.appendChild(btn);
        });
    } else {
        const hint = document.createElement('p');
        hint.className = 'reply-hint';
        const active = getTaskForContact(contactId);
        hint.textContent = active
            ? `📋 Сначала шаги ${active.ticketId} — IntelliJ или JIRA`
            : '📋 Ответы появятся после нужного шага';
        replies.appendChild(hint);
    }

    const compose = document.createElement('footer');
    compose.className = 'slack-compose';
    const input = document.createElement('input');
    input.placeholder = `Message ${contact?.name || ''}`;
    input.className = 'chat-input slack-compose-input';
    const sendBtn = document.createElement('button');
    sendBtn.type = 'button';
    sendBtn.className = 'slack-send-btn';
    sendBtn.textContent = '➤';
    sendBtn.onclick = () => {
        if (!input.value.trim() || chatBusy) return;
        sendChatMessage({ contactId, text: input.value.trim() });
        input.value = '';
    };
    sendBtn.disabled = chatBusy;
    input.disabled = chatBusy;
    if (chatBusy) input.placeholder = 'Ожидание ответа…';
    input.onkeydown = e => { if (e.key === 'Enter') sendBtn.click(); };
    compose.append(replies, input, sendBtn);

    main.append(topbar, messages, compose);

    if (contact && contact.unread > 0) {
        scheduleSlackMarkRead(contactId, appId);
    }
}

let slackMarkReadTimer = null;
function scheduleSlackMarkRead(contactId, appId) {
    if (slackMarkReadTimer) clearTimeout(slackMarkReadTimer);
    slackMarkReadTimer = setTimeout(async () => {
        slackMarkReadTimer = null;
        if (selectedContact !== contactId || slackView !== 'dm') return;
        try {
            await markContactRead(contactId);
            rerenderSlackApp(appId);
        } catch (_) { /* noop */ }
    }, 1200);
}

function scheduleSlackMarkChannelRead(appId) {
    if (slackMarkReadTimer) clearTimeout(slackMarkReadTimer);
    slackMarkReadTimer = setTimeout(async () => {
        slackMarkReadTimer = null;
        if (slackView !== 'channel') return;
        try {
            await markChannelRead();
            rerenderSlackApp(appId);
        } catch (_) { /* noop */ }
    }, 1200);
}

function parseIdeTestFailure(lines) {
    if (!lines?.length) return null;
    if (lines.some(l => l.includes('BUILD SUCCESS'))) return null;

    let line = null;
    let test = null;
    let detail = null;

    for (const raw of lines) {
        const l = raw.trim();
        const stack = l.match(/\.java:(\d+)\)/);
        if (stack) line = parseInt(stack[1], 10);
        const err = l.match(/^\[ERROR\]\s+(.+)/);
        if (err) test = err[1];
        const npe = l.match(/NullPointerException:\s+(.+)/);
        if (npe) detail = npe[1];
        const assertErr = l.match(/AssertionError:\s+(.+)/);
        if (assertErr) detail = assertErr[1];
    }

    if (!line && !test) return null;
    return { line, test: test || 'Test failure', detail };
}

function buildIdeLineNumbers(count, failLine) {
    const rows = [];
    for (let i = 1; i <= count; i++) {
        const mark = i === failLine ? ' ij-line-fail' : '';
        rows.push(`<span class="ij-line-num${mark}">${i}</span>`);
    }
    return rows.join('\n');
}

function renderIdeConsole(el, lines) {
    if (!el || !lines?.length) {
        if (el) el.textContent = '';
        return;
    }
    el.innerHTML = lines.map(line => {
        const esc = line.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        if (/^\[ERROR\]|^ERROR |BUILD FAILURE|FAILED/.test(line)) {
            return `<span class="ij-console-err">${esc}</span>`;
        }
        if (/BUILD SUCCESS|Tests run:.*Failures: 0/.test(line)) {
            return `<span class="ij-console-ok">${esc}</span>`;
        }
        if (/^\s+at /.test(line)) {
            return `<span class="ij-console-stack">${esc}</span>`;
        }
        return esc;
    }).join('\n');
}

function syncIdeLineNumbers(editor, lineNumsEl, failLine) {
    if (!editor || !lineNumsEl) return;
    const count = Math.max(1, editor.value.split('\n').length);
    lineNumsEl.innerHTML = buildIdeLineNumbers(count, failLine);
    lineNumsEl.scrollTop = editor.scrollTop;
}

function scrollIdeEditorToLine(editor, line) {
    if (!editor || !line || line < 1) return;
    const lines = editor.value.split('\n');
    const idx = Math.min(line - 1, lines.length - 1);
    let pos = 0;
    for (let i = 0; i < idx; i++) pos += lines[i].length + 1;
    editor.focus();
    editor.setSelectionRange(pos, pos + (lines[idx]?.length || 0));
    const lineHeight = parseFloat(getComputedStyle(editor).lineHeight) || 20;
    editor.scrollTop = Math.max(0, idx * lineHeight - editor.clientHeight / 3);
}

function renderIDE(container) {
    const task = getFocusedTask();
    container.innerHTML = '';
    const app = document.createElement('div');
    app.className = 'ij-app';

    const menubar = document.createElement('div');
    menubar.className = 'ij-menubar';
    menubar.innerHTML = '<span>File</span><span>Edit</span><span>View</span><span>Navigate</span><span>Code</span><span>Refactor</span><span>Run</span><span>Tools</span><span class="ij-menu-git" title="Git Push">Git</span><span>Window</span><span>Help</span>';

    const body = document.createElement('div');
    body.className = 'ij-body';

    const tree = document.createElement('aside');
    tree.className = 'ij-project-tree';
    tree.innerHTML = `<div class="ij-tree-head">Project</div>
        <div class="ij-tree-item open">📁 ${workspace.projectCompany || 'backend'}</div>
        <div class="ij-tree-item indent">📁 src/main/java</div>
        <div class="ij-tree-item indent2">${task?.code?.fileName || '— select task —'}</div>
        <div class="ij-tree-item indent">📁 src/test/java</div>
        <div class="ij-tree-item indent2">${task?.code?.fileName?.replace('.java', 'Test.java') || '—'}</div>`;

    const editorArea = document.createElement('div');
    editorArea.className = 'ij-editor-area';

    if (!task || !task.code) {
        ideTestFailure = null;
        editorArea.innerHTML = '<p class="ij-empty">Откройте задачу в JIRA или прочитайте Slack</p>';
        body.append(tree, editorArea);
        app.append(menubar, body);
        container.appendChild(app);
        return;
    }

    const tabs = document.createElement('div');
    tabs.className = 'ij-tabs';
    tabs.innerHTML = `<span class="ij-tab active">${task.code.fileName}</span><span class="ij-tab muted">${task.ticketId}</span>`;

    const hint = document.createElement('p');
    hint.className = 'ide-hint ij-hint';
    hint.textContent = '💡 ' + task.code.hint;

    const editorWrap = document.createElement('div');
    editorWrap.className = 'ij-code-wrap';

    const lineNumsEl = document.createElement('pre');
    lineNumsEl.className = 'ij-line-nums';
    lineNumsEl.setAttribute('aria-hidden', 'true');

    const editor = document.createElement('textarea');
    editor.className = 'code-editor ij-editor';
    editor.spellcheck = false;
    editor.value = task.code.currentCode || task.code.starterCode;
    editor.oninput = () => {
        syncIdeLineNumbers(editor, lineNumsEl, ideTestFailure?.line);
        api('/code/save', { method: 'POST', body: JSON.stringify({ taskId: task.id, code: editor.value }) });
    };
    editor.onscroll = () => syncIdeLineNumbers(editor, lineNumsEl, ideTestFailure?.line);

    editorWrap.append(lineNumsEl, editor);
    syncIdeLineNumbers(editor, lineNumsEl, ideTestFailure?.line);
    if (ideTestFailure?.line) {
        requestAnimationFrame(() => scrollIdeEditorToLine(editor, ideTestFailure.line));
    }

    const submitDone = task.objectives?.some(o => o.type === 'SUBMIT_FIX' && o.completed);
    const pushDone = task.objectives?.some(o => o.type === 'GIT_PUSH' && o.completed);
    const hasPushStep = task.objectives?.some(o => o.type === 'GIT_PUSH');

    const runBar = document.createElement('div');
    runBar.className = 'ij-run-bar';
    const testBtn = document.createElement('button');
    testBtn.type = 'button';
    testBtn.className = 'ij-run-btn ij-run-btn--test';
    testBtn.textContent = typeof t === 'function' ? t('ide.runTests') : '▶ Run tests';
    testBtn.title = typeof t === 'function' ? t('ide.runTestsHint') : 'mvn test -pl order-service';
    testBtn.onclick = async () => {
        ideActiveTab = 'run';
        const resp = await api('/code/run', { method: 'POST', body: JSON.stringify({ taskId: task.id, code: editor.value }) });
        ideTestFailure = parseIdeTestFailure(resp.console || workspace?.console);
        if (!ideTestFailure) ideTestFailure = null;
        ws(resp);
        renderIDE(container);
        if (resp.message) showToast(resp.message);
    };
    const submitBtn = document.createElement('button');
    submitBtn.type = 'button';
    submitBtn.className = 'ij-run-btn ij-run-btn--primary';
    submitBtn.textContent = '✓ Commit Fix';
    submitBtn.onclick = async () => {
        const resp = await api('/code/submit', { method: 'POST', body: JSON.stringify({ taskId: task.id, code: editor.value }) });
        ws(resp);
        renderIDE(container);
        if (resp.message) showToast(resp.message);
    };
    const pushBtn = document.createElement('button');
    pushBtn.type = 'button';
    pushBtn.className = 'ij-run-btn ij-run-btn--git';
    pushBtn.textContent = pushDone ? '✓ Pushed' : '⬆ Push';
    pushBtn.disabled = !submitDone || pushDone;
    pushBtn.title = !submitDone
        ? 'Сначала Commit Fix'
        : pushDone
            ? 'Ветка уже в origin'
            : 'git push origin fix/' + task.ticketId.toLowerCase();
    pushBtn.onclick = async () => {
        const resp = await api('/code/push', { method: 'POST', body: JSON.stringify({ taskId: task.id }) });
        ws(resp);
        renderIDE(container);
        if (resp.message) showToast(resp.message);
        pushNotification('🐙 GitHub', 'Push', resp.message || 'Ветка запушена', 'slack');
        if (task.objectives?.some(o => o.type === 'CREATE_PR')) {
            setTimeout(() => pushNotification('🐙 GitHub', 'Следующий шаг',
                'Создайте Pull Request в GitHub', 'slack', () => openAppWindow('github')), 800);
        }
    };
    runBar.append(testBtn, submitBtn);
    if (hasPushStep || task.code) {
        runBar.appendChild(pushBtn);
    }

    menubar.querySelector('.ij-menu-git')?.addEventListener('click', () => {
        if (!submitDone) {
            showToast('Сначала Commit Fix');
            return;
        }
        if (!pushDone) {
            pushBtn.click();
            return;
        }
        ideActiveTab = 'git';
        renderIDE(container);
        showToast('Вкладка Git: git checkout main → git merge ' + taskGitBranch(task));
    });

    const consoleWrap = document.createElement('div');
    consoleWrap.className = 'ij-tool-window' + (ideTestFailure ? ' ij-tool-window--fail' : '');
    const tabRunActive = ideActiveTab === 'run' ? ' active' : '';
    const tabGitActive = ideActiveTab === 'git' ? ' active' : '';
    consoleWrap.innerHTML = `<div class="ij-tool-tabs">
        <span class="ij-tool-tab${tabRunActive}" data-tab="run">Run</span>
        <span class="ij-tool-tab${tabGitActive}" data-tab="git">Git</span>
        <span class="ij-tool-tab muted">Terminal</span>
    </div>`;

    if (ideTestFailure && ideActiveTab === 'run') {
        const failBanner = document.createElement('div');
        failBanner.className = 'ij-test-fail-banner';
        const lineInfo = ideTestFailure.line
            ? (typeof t === 'function' ? t('ide.failLine', { n: ideTestFailure.line }) : `строка ${ideTestFailure.line}`)
            : '';
        failBanner.innerHTML = `<strong>✗ ${ideTestFailure.test}</strong>`
            + (ideTestFailure.detail ? `<span>${ideTestFailure.detail}</span>` : '')
            + (lineInfo ? `<span class="ij-test-fail-line">↳ ${lineInfo}</span>` : '');
        consoleWrap.appendChild(failBanner);
    }

    const consoleEl = document.createElement('pre');
    consoleEl.className = 'ide-console ij-console';
    consoleEl.id = 'ide-console';
    if (ideActiveTab === 'git') {
        const gitState = getIdeGitState(task.id);
        if (task.pullRequestStatus === 'APPROVED' && !task.objectives?.some(o => o.type === 'MERGE_PR' && o.completed)) {
            gitState.log = gitState.log.filter(l => !l.startsWith('# PR approved'));
            gitState.log.push('# PR approved — git checkout main → git merge ' + taskGitBranch(task));
        }
        consoleEl.textContent = gitState.log.join('\n');
    } else {
        const lines = workspace.console || [];
        renderIdeConsole(consoleEl, lines);
        ideTestFailure = parseIdeTestFailure(lines);
    }
    consoleWrap.appendChild(consoleEl);

    const gitInput = document.createElement('input');
    gitInput.className = 'ij-git-input';
    gitInput.placeholder = 'git checkout main | git merge ' + taskGitBranch(task);
    gitInput.spellcheck = false;
    gitInput.style.display = ideActiveTab === 'git' ? 'block' : 'none';
    gitInput.onkeydown = async e => {
        if (e.key !== 'Enter') return;
        const cmd = gitInput.value.trim();
        gitInput.value = '';
        if (!cmd) return;
        await runIdeGitCommand(cmd, task, consoleEl, container);
    };
    consoleWrap.appendChild(gitInput);

    consoleWrap.querySelectorAll('.ij-tool-tab[data-tab]').forEach(tab => {
        tab.onclick = () => {
            ideActiveTab = tab.dataset.tab;
            renderIDE(container);
        };
    });

    editorArea.append(tabs, hint, editorWrap, runBar, consoleWrap);
    body.append(tree, editorArea);

    const statusbar = document.createElement('footer');
    statusbar.className = 'ij-statusbar';
    statusbar.innerHTML = `<span>${task.code.fileName}</span><span>UTF-8</span><span>Java 17</span><span>${task.ticketId}</span>`;

    app.append(menubar, body, statusbar);
    container.appendChild(app);
}

function renderConsole(container, lines) {
    const el = container.querySelector('#ide-console');
    if (el && lines) el.textContent = lines.join('\n');
}

function renderJira(container) {
    container.innerHTML = '';
    const app = document.createElement('div');
    app.className = 'jira-app';
    app.innerHTML = `<header class="jira-topnav">
            <span class="jira-logo">◆ Jira Software</span>
            <nav class="jira-breadcrumbs">Projects / <strong>${workspace.projectCompany}</strong> / Backlog</nav>
        </header>
        <div class="jira-toolbar">
            <span class="jira-view-label">Backlog</span>
            <span class="jira-filter-pill">Assignee = ${workspace.player.name}</span>
        </div>`;

    const table = document.createElement('table');
    table.className = 'jira-issue-table';
    table.innerHTML = '<thead><tr><th></th><th>Key</th><th>Summary</th><th>Status</th><th></th></tr></thead>';
    const tbody = document.createElement('tbody');
    const openTasks = workspace.tasks.filter(t => !t.completed);

    openTasks.forEach(task => {
        const tr = document.createElement('tr');
        tr.className = 'jira-row' + (task.focused ? ' focused' : '');
        const typeIcon = task.type === 'PRODUCTION_BUG' ? '🔥' : task.type === 'BUG_FIX' ? '🐛' : task.type === 'CODE_REVIEW' ? '🔍' : '📋';
        tr.innerHTML = `<td class="jira-type">${typeIcon}</td>
            <td class="jira-key">${task.ticketId}</td>
            <td class="jira-summary">${escapeHtml(task.title)}</td>
            <td><span class="jira-status-pill">${task.jiraStatus}</span></td>
            <td class="jira-row-actions"></td>`;
        const actions = tr.querySelector('.jira-row-actions');
        const focusBtn = document.createElement('button');
        focusBtn.className = 'jira-mini-btn';
        focusBtn.textContent = task.focused ? '✓' : 'Open';
        focusBtn.disabled = task.focused;
        focusBtn.onclick = async () => {
            const resp = await api('/task/focus', { method: 'POST', body: JSON.stringify({ taskId: task.id }) });
            ws(resp);
            if (resp.success) openAppWindow('ide');
        };
        actions.appendChild(focusBtn);
        tr.onclick = e => {
            if (e.target.closest('button')) return;
            tr.classList.toggle('expanded');
        };
        tbody.appendChild(tr);

        const detail = document.createElement('tr');
        detail.className = 'jira-detail-row';
        detail.innerHTML = `<td colspan="5"><div class="jira-detail">
            <p class="jira-desc">${escapeHtml(task.description)}</p>
            ${task.objectives.map(o => `<div class="jira-obj${o.completed ? ' done' : ''}">${o.completed ? '✅' : '⬜'} ${escapeHtml(o.label)}</div>`).join('')}
            <div class="jira-actions">
                <button type="button" class="btn btn-secondary jira-done-btn">→ Done</button>
            </div></div></td>`;
        detail.querySelector('.jira-done-btn').onclick = async () => {
            ws(await api('/jira/close', { method: 'POST', body: JSON.stringify({ taskId: task.id }) }));
        };
        tbody.appendChild(detail);
    });

    table.appendChild(tbody);
    app.appendChild(table);
    if (!openTasks.length) {
        app.innerHTML += '<p class="hint-label jira-empty">Backlog пуст 🎉</p>';
    }
    container.appendChild(app);
}

// ===== СОБЫТИЯ =====

function appendEvent(msg) {
    const log = document.getElementById('event-log');
    const e = document.createElement('div');
    e.className = 'event-entry';
    e.textContent = msg;
    log.appendChild(e);
    log.scrollTop = log.scrollHeight;
}

function clearEventLog() {
    document.getElementById('event-log').innerHTML = '';
}

// ===== INIT =====

buildDesktopIcons(openAppWindow);
buildTaskbarPinned(openAppWindow);
buildStartMenu(openAppWindow);
document.getElementById('start-btn-desktop')?.addEventListener('click', e => {
    e.stopPropagation();
    toggleStartMenu();
});
document.getElementById('start-search')?.addEventListener('input', e => filterStartMenu(e.target.value));
document.addEventListener('click', e => {
    const menu = document.getElementById('start-menu');
    const startBtn = document.getElementById('start-btn-desktop');
    if (menu && !menu.classList.contains('hidden')
        && !menu.contains(e.target) && !startBtn?.contains(e.target)) {
        closeStartMenu();
    }
});
document.querySelectorAll('.tray-btn').forEach(el => {
    el.onclick = () => openAppWindow(el.dataset.app);
});
document.getElementById('desktop-recycle')?.addEventListener('click', () => openAppWindow('recycle'));
document.getElementById('to-onboarding-btn')?.addEventListener('click', goToOnboarding);
document.getElementById('ob-next-btn')?.addEventListener('click', () => { onboardingStep++; renderOnboarding(); });
document.getElementById('ob-back-btn')?.addEventListener('click', () => { onboardingStep--; renderOnboarding(); });
document.getElementById('start-btn')?.addEventListener('click', startGame);
document.getElementById('resume-game-btn')?.addEventListener('click', () => resumeGame());
document.getElementById('menu-btn')?.addEventListener('click', returnToMenu);
document.getElementById('office-walk-btn')?.addEventListener('click', async () => {
    if (!workspace?.atDesk) return;
    closeAllApps();
    closeStartMenu();
    meetingActive = false;
    document.getElementById('meeting-overlay')?.classList.add('hidden');
    const resp = await api('/desk/leave', { method: 'POST', body: '{}' });
    ws(resp);
    resumeOfficeFromDesk();
});
document.getElementById('end-day-btn').onclick = async () => {
    ws(await api('/end-day', { method: 'POST', body: '{}' }));
    closeAllApps();
    scheduleDeadlineWarnings();
    if (workspace && !workspace.gameOver) {
        deliveredMessageIds.clear();
        hideAllScreens();
        showArrivalScene({ prelude: true });
    }
};
document.querySelectorAll('.wake-reply').forEach(btn => {
    btn.onclick = () => handleWakeReply(btn.dataset.arrival, btn.dataset.reply);
});
document.getElementById('gameover-menu-btn')?.addEventListener('click', returnToMenu);
document.getElementById('meeting-leave-btn')?.addEventListener('click', () => {
    if (meetingActive) finishMeeting(workspace.pendingMeeting, 'standup-late');
});

async function logoutUser() {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' });
    window.location.href = '/';
}

document.getElementById('logout-btn')?.addEventListener('click', () => logoutUser().catch(console.error));

(async () => {
    try {
        const res = await fetch('/api/auth/me', { credentials: 'same-origin' });
        if (!res.ok) {
            window.location.href = '/login.html?next=' + encodeURIComponent('/play.html');
            return;
        }
        const user = await res.json();
        const label = document.getElementById('menu-user-label');
        if (label) label.textContent = '👤 ' + (user.displayName || user.username);
        if (user.admin) {
            document.getElementById('admin-link')?.classList.remove('hidden');
        }
        initLangSwitch();
        await initMenu();
    } catch (e) {
        console.error(e);
    }
})();
