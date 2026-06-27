/** Блокирует мигающий текстовый курсор на статичных элементах игрового UI */
(function initUiNoTextCaret() {
    const UI_TEXT_INPUT = [
        'input', 'textarea', '[contenteditable="true"]',
        '.phone-chat-input', '.phone-chat-compose', '.phone-nav-bar', '.phone-nav-back',
        '[data-phone-nav]', '.chat-input', '.slack-compose-input',
        '.desktop-rename-input',
        '.code-editor', '.ij-editor', '.sql-editor', '.swagger-body-input',
        '.sheet-cell-input', '.excel-formula-input', '.notepad-editor', '.word-editor', '.start-search'
    ].join(', ');
    const UI_NO_CARET_ROOT = [
        '#game-screen', '#phone-overlay', '#prelude-screen', '#arrival-screen',
        '#tutorial-overlay', '#break-overlay', '#meeting-overlay', '#wake-screen',
        '#menu-screen', '#onboarding-screen'
    ].join(', ');

    const UI_INTERACTIVE = [
        'button', 'a', 'label', 'select', '.app-icon', '.task-card', '.rest-card',
        '.taskbar-app-btn', '.taskbar-start-btn', '.folder-grid-item', '.app-titlebar',
        '.desktop-icon-layer', '.slack-rail-btn', '.reply-option-btn', '.win-btn',
        '.win-resize-handle', '.app-resize-layer', '.win-resize-e', '.win-resize-s', '.win-resize-se',
        '.rest-card', '.meeting-option', '.break-choice-btn', '.tutorial-card'
    ].join(', ');

    function isEditableTarget(el) {
        return el instanceof Element && !!el.closest(UI_TEXT_INPUT);
    }

    function isInteractiveTarget(el) {
        return el instanceof Element && !!el.closest(UI_INTERACTIVE);
    }

    function isNoCaretRoot(el) {
        return el instanceof Element && !!el.closest(UI_NO_CARET_ROOT);
    }

    function blurIfNeeded() {
        const active = document.activeElement;
        if (active instanceof HTMLElement && !isEditableTarget(active)) {
            active.blur();
        }
    }

    function isWindowChromeTarget(el) {
        return el instanceof Element && !!el.closest('.app-titlebar, .app-resize-layer, .win-resize-handle');
    }

    function preventUiTextCaret(e) {
        if (e.type === 'mousedown' && e.button !== 0) return;
        if (isEditableTarget(e.target)) return;
        if (isInteractiveTarget(e.target)) return;
        if (isWindowChromeTarget(e.target)) return;
        if (!isNoCaretRoot(e.target)) return;
        e.preventDefault();
        blurIfNeeded();
    }

    function preventUiTextSelect(e) {
        if (isEditableTarget(e.target)) return;
        if (!isNoCaretRoot(e.target)) return;
        e.preventDefault();
    }

    document.addEventListener('mousedown', preventUiTextCaret, true);
    document.addEventListener('pointerdown', preventUiTextCaret, true);
    document.addEventListener('selectstart', preventUiTextSelect, true);
})();

function isDevOsLocked() {
    return devOsLocked;
}

function isVpnConnected() {
    return vpnConnected;
}

function formatDevOsLockDate() {
    const lang = typeof getLang === 'function' && getLang() === 'en' ? 'en-US' : 'ru-RU';
    return new Date().toLocaleDateString(lang, { weekday: 'long', day: 'numeric', month: 'long' });
}

const DEVOS_DEFAULT_PASSWORD = 'Welcome1!';

function playerInitials(name) {
    if (!name) return '👨‍💻';
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return parts[0].slice(0, 2).toUpperCase();
}

function updateDevOsLockUi() {
    const el = document.getElementById('devos-lock');
    if (!el) return;
    const show = devOsLocked && workspace?.atDesk;
    el.classList.toggle('hidden', !show);
    if (!show) return;

    const timeEl = document.getElementById('devos-lock-time');
    const dateEl = document.getElementById('devos-lock-date');
    const userEl = document.getElementById('devos-lock-username');
    const avatarEl = document.getElementById('devos-lock-avatar');
    const pwEl = document.getElementById('devos-lock-password');
    const timeMatch = workspace?.timeLabel?.match(/\d{1,2}:\d{2}/);
    if (timeEl) timeEl.textContent = timeMatch ? timeMatch[0] : '09:00';
    if (dateEl) dateEl.textContent = formatDevOsLockDate();
    const displayName = workspace?.player?.name?.trim() || '';
    if (userEl) userEl.textContent = displayName || (typeof t === 'function' ? t('devos.lock.defaultUser') : 'Developer');
    if (avatarEl) {
        avatarEl.textContent = displayName ? playerInitials(displayName) : '👨‍💻';
    }
    if (pwEl) pwEl.value = DEVOS_DEFAULT_PASSWORD;
    document.getElementById('devos-lock-panel')?.classList.remove('hidden');
    document.getElementById('devos-boot')?.classList.add('hidden');
}

function scheduleDeskStartup(fn) {
    pendingDeskStartup = fn;
    if (!devOsLocked && vpnConnected) runPendingDeskStartup();
}

function runPendingDeskStartup() {
    const fn = pendingDeskStartup;
    pendingDeskStartup = null;
    if (fn) fn();
}

function showVpnPrompt() {
    if (vpnConnected || devOsLocked || !workspace?.atDesk) return;
    const title = typeof t === 'function' ? t('notify.vpn.title') : 'Подключите Cisco AnyConnect';
    const body = typeof t === 'function'
        ? t('notify.vpn.body')
        : 'Без VPN нет доступа к Slack, JIRA и почте';
    pushNotification('🔒 Cisco AnyConnect', title, body, 'warning', () => openAppWindow('vpn'));
}

function connectCorporateVpn() {
    if (vpnConnected) return;
    vpnConnected = true;
    if (openWindows.has('vpn')) renderAppInWindow('vpn');
    const title = typeof t === 'function' ? t('notify.vpn.ready.title') : 'VPN подключён';
    const body = typeof t === 'function'
        ? t('notify.vpn.ready.body')
        : 'Доступы готовы: Slack, JIRA, почта и внутренние сервисы';
    pushNotification('🔒 Cisco AnyConnect', title, body, 'slack');
    runPendingDeskStartup();
    if (typeof updateMeetingReminder === 'function') updateMeetingReminder();
}

function disconnectCorporateVpn() {
    if (!vpnConnected) return;
    vpnConnected = false;
    if (openWindows.has('vpn')) renderAppInWindow('vpn');
}

window.isVpnConnected = isVpnConnected;
window.connectCorporateVpn = connectCorporateVpn;
window.disconnectCorporateVpn = disconnectCorporateVpn;
window.showVpnPrompt = showVpnPrompt;

let devOsSigningIn = false;

function lockDevOs() {
    devOsLocked = true;
    devOsSigningIn = false;
    vpnConnected = false;
    closeAllApps();
    closeStartMenu();
    updateDevOsLockUi();
}

function unlockDevOs() {
    if (!devOsLocked) return;
    devOsLocked = false;
    devOsSigningIn = false;
    updateDevOsLockUi();
    if (typeof OfficeAudio !== 'undefined') OfficeAudio?.playBootReady?.();
    if (vpnConnected) {
        runPendingDeskStartup();
    } else {
        showVpnPrompt();
    }
    if (typeof updateMeetingReminder === 'function') updateMeetingReminder();
    if (typeof ensureDesktopIconsRendered === 'function') ensureDesktopIconsRendered();
}

function beginDevOsSignIn(e) {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    if (!devOsLocked || devOsSigningIn) return;
    devOsSigningIn = true;
    document.getElementById('devos-lock-panel')?.classList.add('hidden');
    document.getElementById('devos-boot')?.classList.remove('hidden');
    const delay = 1600 + Math.random() * 400;
    setTimeout(() => unlockDevOs(), delay);
}

function bindDevOsLockUi() {
    const lock = document.getElementById('devos-lock');
    const form = document.getElementById('devos-signin-form');
    const btn = document.getElementById('devos-unlock-btn');
    if (!lock || lock.dataset.bound) return;
    lock.dataset.bound = '1';
    form?.addEventListener('submit', beginDevOsSignIn);
    btn?.addEventListener('click', e => e.stopPropagation());
}

const API = window.__GAME_API__ || '/api/game';

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
let devOsLocked = false;
let vpnConnected = false;
let pendingDeskStartup = null;
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
    if (typeof DesktopFiles !== 'undefined') {
        const meta = DesktopFiles.getWindowMeta(app);
        if (meta) return meta.emoji + ' ' + meta.label;
    }
    const deskMeta = getDesktopApp(app);
    if (deskMeta) return deskMeta.emoji + ' ' + deskMeta.label;
    return { contacts: '📱 Контакты', recycle: '🗑 Корзина' }[app] || app;
}

const CAREER_PRESETS = [
    { id: 'explorer', years: 0, age: 32, stack: [], mode: 'EXPLORER', education: 'CAREER_CHANGE' },
    { id: 'intern', years: 0, age: 20, stack: ['Java Core'], mode: 'LEARNING' },
    { id: 'junior', years: 1, age: 22, stack: ['Java Core', 'Git', 'JUnit'], mode: 'LEARNING' },
    { id: 'middle', years: 4, age: 28, stack: ['Java Core', 'Spring Boot', 'SQL', 'Git', 'Hibernate/JPA'], mode: 'RELAXED' },
    { id: 'senior', years: 7, age: 32, stack: ['Java Core', 'Spring Boot', 'SQL', 'Git', 'Kafka', 'Docker', 'Microservices'], mode: 'REALISTIC' }
];

function applyCareerPreset(presetId, options = {}) {
    const preset = CAREER_PRESETS.find(p => p.id === presetId);
    if (!preset) return;
    selectedCareer = presetId;
    document.getElementById('player-exp').value = preset.years;
    document.getElementById('player-age').value = preset.age;
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
    if (preset.education) {
        const eduEl = document.getElementById('player-education');
        if (eduEl) eduEl.value = preset.education;
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
    refreshEducationOptions();
    refreshStackLimit();
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

function maxStackForExperience(exp) {
    if (exp === 0) return 3;
    if (exp <= 2) return 5;
    if (exp <= 5) return 7;
    return charOptions?.maxStackSkills ?? 8;
}

function refreshStackLimit() {
    const explorer = selectedMode === 'EXPLORER';
    const exp = parseInt(document.getElementById('player-exp')?.value, 10) || 0;
    const limit = maxStackForExperience(exp);
    const checked = document.querySelectorAll('#stack-list input:checked').length;
    document.querySelectorAll('#stack-list input').forEach(cb => {
        const chip = cb.closest('.stack-chip');
        if (explorer) {
            cb.checked = false;
            chip?.classList.remove('selected', 'stack-chip-disabled');
            cb.disabled = true;
            return;
        }
        cb.disabled = false;
        if (!cb.checked && checked >= limit) {
            chip?.classList.add('stack-chip-disabled');
            cb.disabled = true;
        } else {
            chip?.classList.remove('stack-chip-disabled');
            cb.disabled = false;
        }
    });
    const hint = document.getElementById('stack-hint');
    if (hint) {
        if (explorer) {
            const key = 'menu.stackHintExplorer';
            const text = t(key);
            hint.textContent = text !== key ? text : 'Стек не нужен — вы знакомитесь с процессом, а не с кодом.';
        } else {
            const key = 'menu.stackHint';
            const base = t(key);
            hint.textContent = base !== key
                ? base.replace('{max}', limit).replace('{count}', checked)
                : `Выбрано ${checked} из ${limit}. Каждый навык +3 к Java и качеству кода при старте.`;
        }
    }
}

function isEducationAllowed(eduId, age, exp) {
    const meta = charOptions?.educationLevels?.find(e => e.id === eduId);
    if (!meta) return true;
    if (selectedMode === 'EXPLORER') {
        const maxExp = meta.maxExp ?? 99;
        return age >= 18 && age <= 65 && exp <= maxExp;
    }
    const minAge = meta.minAge ?? 0;
    const maxAge = meta.maxAge ?? 99;
    const maxExp = meta.maxExp ?? 99;
    return age >= minAge && age <= maxAge && exp <= maxExp;
}

function pickBestEducation(age, exp) {
    const priority = exp >= 6
        ? ['UNIVERSITY', 'SELF_TAUGHT', 'BOOTCAMP', 'CAREER_CHANGE']
        : exp >= 3
            ? ['BOOTCAMP', 'UNIVERSITY', 'SELF_TAUGHT', 'CAREER_CHANGE']
            : null;
    if (priority) {
        const hit = priority.find(id => isEducationAllowed(id, age, exp));
        if (hit) return hit;
    }
    const fb = charOptions?.educationLevels?.find(e => isEducationAllowed(e.id, age, exp));
    return fb?.id ?? null;
}

function setEducationValue(edu, eduId) {
    if (!edu || !eduId) return;
    let matched = false;
    for (const opt of edu.options) {
        const on = opt.value === eduId;
        opt.selected = on;
        if (on) matched = true;
    }
    if (matched) edu.value = eduId;
}

function refreshEducationOptions() {
    const edu = document.getElementById('player-education');
    if (!edu || !charOptions?.educationLevels?.length) return;
    const age = parseInt(document.getElementById('player-age').value, 10) || 0;
    const exp = parseInt(document.getElementById('player-exp').value, 10) || 0;

    if (!isEducationAllowed(edu.value, age, exp)) {
        setEducationValue(edu, pickBestEducation(age, exp));
    }

    [...edu.options].forEach(opt => {
        const ok = isEducationAllowed(opt.value, age, exp);
        opt.disabled = !ok;
        opt.title = ok ? '' : 'Не подходит при текущем возрасте и опыте';
    });

    const selected = edu.options[edu.selectedIndex];
    if (!selected || selected.disabled || !isEducationAllowed(edu.value, age, exp)) {
        setEducationValue(edu, pickBestEducation(age, exp));
    }
}

let characterValidationBound = false;

function bindCharacterFieldValidation() {
    if (characterValidationBound) return;
    characterValidationBound = true;
    const onChange = () => {
        refreshEducationOptions();
        refreshStackLimit();
        document.getElementById('char-preview')?.classList.add('hidden');
        document.getElementById('char-errors')?.classList.add('hidden');
    };
    document.getElementById('player-age')?.addEventListener('input', onChange);
    document.getElementById('player-age')?.addEventListener('change', onChange);
    document.getElementById('player-exp')?.addEventListener('input', onChange);
    document.getElementById('player-exp')?.addEventListener('change', onChange);
}

async function fetchPreviewTeam(projectId) {
    previewTeam = await api('/team/preview?projectType=' + encodeURIComponent(projectId));
    return previewTeam;
}

// ===== API =====

async function api(path, options = {}) {
    const res = await fetch(API + path, {
        headers: authHeaders({ 'Content-Type': 'application/json' }),
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
        stackSkills: selectedMode === 'EXPLORER' ? [] : stack,
        mode: selectedMode
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
            · Старт ${formatMoney(data.previewMoney)}
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

function refreshMoneyDisplays() {
    if (!workspace?.player) return;
    const moneyEl = document.getElementById('val-money');
    if (moneyEl) moneyEl.textContent = formatMoney(workspace.player.money);
    if (typeof openWindows !== 'undefined' && openWindows.has('portal')) {
        renderAppInWindow('portal');
    }
    const preview = document.getElementById('char-preview');
    if (preview && !preview.classList.contains('hidden') && typeof validateCharacter === 'function') {
        validateCharacter().catch(() => {});
    }
}

window.onLangChange = refreshMoneyDisplays;
window.refreshMoneyDisplays = refreshMoneyDisplays;

function ws(data) {
    workspace = data.workspace || data;
    if (workspace) workspace._dayEndNotified = false;
    if (data.console && workspace) workspace.console = data.console;
    renderAll({ refreshApps: 'smart', refreshPhone: true });
    if (data.message) {
        const msg = typeof localizeMoneyInText === 'function'
            ? localizeMoneyInText(data.message)
            : data.message;
        appendEvent(msg);
        if (!data.message.includes('Прочитано')) {
            showToast(msg);
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
    if (typeof tickMeetingReminders === 'function') tickMeetingReminders();
}

function attachStatePoll() {
    if (statePollTimer || !workspace?.atDesk || workspace?.gameOver) return;
    statePollTimer = setInterval(async () => {
        if (!workspace?.atDesk) return;
        try {
            const beforeIds = new Set((workspace.messages || []).map(m => m.id));
            const ws = await api('/state');
            workspace = ws;
            const hasNew = (workspace.messages || []).some(m => !m.fromPlayer && !beforeIds.has(m.id));
            renderAll({ refreshApps: 'chat', refreshPhone: true });
            if (hasNew) startMessageDrip();
        } catch (_) { /* session idle */ }
    }, 30000);
}

function startRealClock() {
    clearRealClock();
    updateRealClockDisplay();
    if (!workspace?.atDesk || !workspace.dayStartedAtEpochMs) return;
    realClockTimer = setInterval(updateRealClockDisplay, 1000);
    attachStatePoll();
}

function ensureRealClockRunning() {
    if (!workspace?.atDesk || !workspace.dayStartedAtEpochMs) return;
    if (!realClockTimer) {
        updateRealClockDisplay();
        realClockTimer = setInterval(updateRealClockDisplay, 1000);
    }
    attachStatePoll();
}

function startStatePoll() {
    attachStatePoll();
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
    if (typeof PhoneApp !== 'undefined' && PhoneApp.isOpen?.()) PhoneApp.close();
    ['menu-screen', 'onboarding-screen', 'prelude-screen', 'arrival-screen', 'wake-screen', 'game-screen']
        .forEach(id => document.getElementById(id)?.classList.add('hidden'));
}

function isOfficeWalkActive() {
    const arrival = document.getElementById('arrival-screen');
    return !!(arrival && !arrival.classList.contains('hidden'));
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
    renderAll({ refreshApps: 'chat', refreshPhone: true, slackSidebar: false });
    showToast('Сообщение отправлено');

    const delay = randomReplyDelayMs(contactId);
    const t = setTimeout(() => {
        typingContacts.delete(contactId);
        newNpcIds.forEach(id => {
            hiddenChatMessageIds.delete(id);
            deliveredMessageIds.add(id);
        });
        renderAll({ refreshApps: 'chat', refreshPhone: true, slackSidebar: true });
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
    if (payload.text && typeof ChatTextAnalyzer !== 'undefined' && ChatTextAnalyzer.isInappropriate(payload.text)) {
        const kind = ChatTextAnalyzer.classify(payload.text);
        const hint = kind === 'RESIGNATION'
            ? 'Тему увольнения лучше обсудить с HR лично.'
            : 'Корпоративный чат мониторит HR — возможны предупреждение и стресс.';
        pushNotification('⚠ HR', 'Деловой тон', hint, 'warning');
    }
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
                    selectSlackContact(msg.contactId);
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
    edu.value = 'STUDENT';
    refreshEducationOptions();

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
            const limit = maxStackForExperience(parseInt(document.getElementById('player-exp').value, 10) || 0);
            if (cb.checked && document.querySelectorAll('#stack-list input:checked').length > limit) {
                cb.checked = false;
                return;
            }
            if (cb.checked) selectedStack.add(skill);
            else selectedStack.delete(skill);
            label.classList.toggle('selected', cb.checked);
            refreshStackLimit();
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
        refreshEducationOptions();
    });

    bindCharacterFieldValidation();
    refreshStackLimit();

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
            refreshStackLimit();
            refreshEducationOptions();
            if (typeof validateCharacter === 'function') validateCharacter().catch(() => {});
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
    refreshStackLimit();
    if (typeof MeetingVoice !== 'undefined') MeetingVoice.updateToggleUi();
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
    if (typeof MeetingVoice !== 'undefined') MeetingVoice.stop();
    document.getElementById('gameover-modal')?.classList.add('hidden');
    document.getElementById('meeting-overlay')?.classList.add('hidden');
    closeAllApps();
    closeStartMenu();

    hideAllScreens();

    if (ws.gameOver) {
        document.getElementById('game-screen').classList.remove('hidden');
        renderAll({ refreshApps: 'all', refreshPhone: true });
        showGameOver(ws.gameOverReason);
        return;
    }

    if (ws.atDesk === false) {
        appendEvent('Продолжение — доберитесь до рабочего места.');
        showArrivalScene({ prelude: false });
        return;
    }

    document.getElementById('game-screen').classList.remove('hidden');
    lockDevOs();
    startRealClock();
    renderAll({ refreshApps: 'all', refreshPhone: true });
    (ws.messages || []).forEach(m => deliveredMessageIds.add(m.id));
    scheduleDeskStartup(() => {
        startMessageDrip();
        scheduleMeetingIfPending();
        scheduleDeadlineWarnings();
        pushNotification('🖥 DevOS', 'С возвращением', `День ${ws.player.day}, ${ws.timeLabel}`, 'slack');
    });
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
    const backBtn = document.getElementById('ob-back-btn');
    backBtn.classList.remove('hidden');
    backBtn.textContent = onboardingStep === 1
        ? (typeof t === 'function' ? t('ob.backToMenu') : '← К персонажу')
        : (typeof t === 'function' ? t('ob.back') : '← Назад');
    document.getElementById('ob-next-btn').classList.toggle('hidden', onboardingStep === 4);
    document.getElementById('start-btn').classList.toggle('hidden', onboardingStep !== 4);

    if (onboardingStep === 2 || onboardingStep === 4) {
        document.querySelector('.onboarding-card')?.classList.add('wide');
    } else {
        document.querySelector('.onboarding-card')?.classList.remove('wide');
    }

    if (onboardingStep === 2) {
        renderProjectList();
    }
    if (onboardingStep === 3) renderTeamIntro();
    if (onboardingStep === 4) renderProjectOverview();
}

function onboardingBack() {
    if (onboardingStep <= 1) {
        document.getElementById('onboarding-screen').classList.add('hidden');
        document.getElementById('menu-screen').classList.remove('hidden');
        onboardingStep = 1;
        return;
    }
    onboardingStep--;
    renderOnboarding();
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
            <div><strong>Ваша роль:</strong> ${formatYourRole(p.yourRole, getCharacterForm().experienceYears)}</div>
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

function formatYourRole(baseRole, experienceYears) {
    if (!baseRole) return '';
    const exp = experienceYears ?? 0;
    const split = baseRole.indexOf(' в ');
    const suffix = split >= 0 ? baseRole.substring(split) : '';
    const javaDev = baseRole.includes('Java Developer');
    const grade = exp <= 0 ? 'Стажёр' : exp <= 2 ? 'Junior' : exp <= 5 ? 'Middle' : 'Senior';
    if (javaDev) return `${grade} Java Developer${suffix}`;
    if (baseRole.includes('Developer')) return `${grade} Developer${suffix}`;
    return grade + suffix;
}

function renderProjectOverview() {
    if (!selectedProject) return;
    const p = selectedProject;
    const form = getCharacterForm();
    document.getElementById('ob-project-title').textContent = p.emoji + ' ' + p.productName;
    document.getElementById('ob-project-tagline').textContent = p.tagline;
    document.getElementById('ob-project-desc').textContent = p.description;
    document.getElementById('ob-your-role').textContent = formatYourRole(p.yourRole, form.experienceYears);
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
    devOsLocked = false;
    vpnConnected = false;
    pendingDeskStartup = null;
    closeAllApps();
    closeStartMenu();
    meetingActive = false;
    if (typeof MeetingVoice !== 'undefined') MeetingVoice.stop();
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

function renderAll(options) {
    if (!workspace) return;

    let refreshApps = 'none';
    let refreshPhone = false;
    let slackSidebar = true;
    if (options === true) {
        refreshApps = 'all';
        refreshPhone = true;
    } else if (options && typeof options === 'object') {
        refreshApps = options.refreshApps ?? 'none';
        refreshPhone = options.refreshPhone ?? false;
        if (options.slackSidebar === false) slackSidebar = false;
    }

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
    document.getElementById('val-money').textContent = formatMoney(p.money);
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

    ensureRealClockRunning();

    const warnEl = document.getElementById('val-warnings');
    const warnCount = p.warnings || 0;
    if (warnEl) {
        warnEl.textContent = warnCount + ' / 5';
        warnEl.className = 'warnings-value' + (warnCount >= 4 ? ' critical' : warnCount >= 2 ? ' elevated' : '');
    }
    renderWarningsList(p);

    const deskLock = document.getElementById('desk-lock');
    if (deskLock) deskLock.classList.toggle('hidden', workspace.atDesk !== false);
    updateDevOsLockUi();
    if (!workspace.atDesk && typeof PhoneApp !== 'undefined' && PhoneApp.isOpen?.()
        && !PhoneApp.isOfficeWalkMode?.()) {
        PhoneApp.close();
    }

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
    PhoneApp?.updateBadge?.();
    if (refreshPhone && PhoneApp?.isOpen?.()) PhoneApp.render();

    renderObjectives();
    renderTaskList();
    renderRestList();

    if (refreshApps === 'all') {
        openWindows.forEach((_, appId) => renderAppInWindow(appId));
    } else if (refreshApps === 'chat' || refreshApps === 'smart') {
        openWindows.forEach((state, appId) => {
            if (appId === 'slack' || appId === 'contacts') {
                patchSlackWindow(state.contentEl, appId, { sidebar: slackSidebar });
            } else if (refreshApps === 'smart' && appId === 'jira') {
                renderAppInWindow(appId);
            }
        });
    } else if (openApp && !openWindows.size) {
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

function contactPlayerHasSpoken(contactId) {
    return workspace?.messages?.some(m => m.fromPlayer && m.contactId === contactId);
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

function contactById(contactId) {
    if (!contactId || !workspace?.contacts) return null;
    return workspace.contacts.find(c => c.id === contactId) || null;
}

function getTeamLeadContact() {
    const pending = workspace?.pendingWorkloadContactId;
    if (pending) {
        const c = contactById(pending);
        if (c) return c;
    }
    return workspace?.contacts?.find(c => /team lead|тимлид/i.test(c.role || ''))
        || workspace?.contacts?.[0]
        || null;
}

function getOpenWorkTasks() {
    return (workspace?.tasks || []).filter(t =>
        !t.completed && t.type !== 'MEETING' && t.scenarioTag !== 'DAILY_STANDUP'
    );
}

function hasOpenWorkTasks() {
    return getOpenWorkTasks().length > 0;
}

function isTeamLeadContact(contactId) {
    const lead = getTeamLeadContact();
    return lead != null && lead.id === contactId;
}

function formatObjectiveLabel(obj) {
    if (!obj) return '';
    const contact = obj.contactId ? contactById(obj.contactId) : null;
    const name = contact?.name;
    if (name) {
        switch (obj.type) {
            case 'REPLY_MESSAGE':
                if (obj.contactId === 'dmitry' && obj.label?.includes('DBA')) {
                    return 'Slack → Dmitry (DBA): кнопка с результатом SQL';
                }
                return `Slack → ${name.split(/\s+/)[0]}: ответить`;
            case 'READ_MESSAGE':
                return `Slack → ${name.split(/\s+/)[0]}: прочитать ТЗ`;
            case 'REQUEST_REVIEW':
                return `Запросить code review у ${name}`;
            default:
                break;
        }
    }
    if (obj.type === 'CHECK_METRICS' && obj.contactId === 'postgresql' && obj.messageId
        && typeof SQL_PG_ACTION_META !== 'undefined') {
        const meta = SQL_PG_ACTION_META[obj.messageId];
        if (meta) return `pgAdmin 🐘: «${meta.button.replace(/^📊\\s*/, '')}» (кнопка внизу)`;
    }
    if (obj.type === 'CLOSE_JIRA') {
        return obj.label || 'JIRA: закрыть задачу';
    }
    return obj.label;
}

function renderObjectives() {
    const el = document.getElementById('objectives-list');
    const task = getFocusedTask();
    if (!task) {
        if (workspace?.mode === 'EXPLORER' && !hasOpenWorkTasks()) {
            const lead = getTeamLeadContact();
            const leadName = lead?.name || 'тимлиду';
            const hint = typeof t === 'function'
                ? t('task.explorer.idleHint', { name: leadName })
                : `Нет задач? Напишите ${leadName} в Slack — выдадут следующую.`;
            el.innerHTML = `<p class="hint-text">${hint}</p>`;
            if (lead) {
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'btn btn-secondary btn-sm';
                btn.textContent = typeof t === 'function'
                    ? t('task.explorer.openLeadChat', { name: lead.name.split(/\s+/)[0] })
                    : `Чат с ${lead.name.split(/\s+/)[0]}`;
                btn.onclick = () => {
                    selectSlackContact(lead.id);
                    openAppWindow('slack');
                };
                el.appendChild(btn);
            }
            return;
        }
        el.innerHTML = '<p class="hint-text">Выберите задачу в JIRA или прочитайте Slack</p>';
        return;
    }
    el.innerHTML = `<p class="task-focus-title">${task.ticketId}: ${task.title}</p>`;
    if (task.scenarioTag === 'SQL_ANALYTICS' && typeof getSqlWorkflowGuide === 'function') {
        const guide = getSqlWorkflowGuide(task);
        if (guide) {
            const hint = document.createElement('p');
            hint.className = 'objective-sql-hint';
            hint.textContent = '1) Slack (ТЗ) → 2) pgAdmin (кнопка внизу) → 3) Slack Dmitry → 4) JIRA Done';
            el.appendChild(hint);
            const pendingPg = (task.objectives || []).find(o =>
                !o.completed && o.type === 'CHECK_METRICS' && o.contactId === 'postgresql');
            if (pendingPg) {
                const pgBtn = document.createElement('button');
                pgBtn.type = 'button';
                pgBtn.className = 'btn btn-secondary btn-sm objective-action-btn';
                pgBtn.textContent = `🐘 pgAdmin: ${(guide.pgButton || '').replace(/^📊\\s*/, '')}`;
                pgBtn.onclick = () => openAppWindow('postgres');
                el.appendChild(pgBtn);
            }
            const pendingReply = (task.objectives || []).find(o =>
                !o.completed && o.type === 'REPLY_MESSAGE' && o.contactId === 'dmitry');
            if (pendingReply && guide.slackReply) {
                const slackBtn = document.createElement('button');
                slackBtn.type = 'button';
                slackBtn.className = 'btn btn-secondary btn-sm objective-action-btn';
                slackBtn.textContent = '💬 Slack → Dmitry';
                slackBtn.onclick = () => {
                    selectSlackContact('dmitry');
                    openAppWindow('slack');
                };
                el.appendChild(slackBtn);
            }
        }
    }
    task.objectives.forEach(obj => {
        const div = document.createElement('div');
        div.className = 'objective-item' + (obj.completed ? ' done' : '');
        div.textContent = (obj.completed ? '✅ ' : '⬜ ') + formatObjectiveLabel(obj);
        el.appendChild(div);
    });
}

function renderTaskList() {
    const list = document.getElementById('task-list');
    list.innerHTML = '';
    const openWork = getOpenWorkTasks();
    openWork.forEach(task => {
        const btn = document.createElement('button');
        btn.className = 'task-card' + (task.focused ? ' focused' : '');
        btn.textContent = task.ticketId + ' · ' + task.title;
        btn.onclick = async () => {
            ws(await api('/task/focus', { method: 'POST', body: JSON.stringify({ taskId: task.id }) }));
            openAppWindow('jira');
        };
        list.appendChild(btn);
    });
    workspace.tasks.filter(t => !t.completed && (t.type === 'MEETING' || t.scenarioTag === 'DAILY_STANDUP')).forEach(task => {
        const btn = document.createElement('button');
        btn.className = 'task-card' + (task.focused ? ' focused' : '');
        btn.textContent = task.ticketId + ' · ' + task.title;
        btn.onclick = async () => {
            ws(await api('/task/focus', { method: 'POST', body: JSON.stringify({ taskId: task.id }) }));
            if (typeof scheduleMeetingIfPending === 'function') scheduleMeetingIfPending();
        };
        list.appendChild(btn);
    });
    if (openWork.length === 0 && !workspace.tasks.some(t => !t.completed)) {
        if (workspace.mode === 'EXPLORER') {
            const lead = getTeamLeadContact();
            const leadName = lead?.name || 'тимлиду';
            const done = document.createElement('p');
            done.className = 'hint-label';
            done.textContent = '✅ Задачи на сегодня закрыты';
            list.appendChild(done);
            const hint = document.createElement('p');
            hint.className = 'hint-text explorer-idle-hint';
            hint.textContent = typeof t === 'function'
                ? t('task.explorer.idleHint', { name: leadName })
                : `Нужно ещё? Напишите ${leadName} в Slack — выдадут следующую задачу.`;
            list.appendChild(hint);
            if (lead) {
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'btn btn-secondary btn-sm';
                btn.textContent = typeof t === 'function'
                    ? t('task.explorer.openLeadChat', { name: lead.name.split(/\s+/)[0] })
                    : `Открыть чат с ${lead.name.split(/\s+/)[0]}`;
                btn.onclick = () => {
                    selectSlackContact(lead.id);
                    openAppWindow('slack');
                };
                list.appendChild(btn);
            }
        } else {
            list.innerHTML = '<p class="hint-label">✅ Все задачи закрыты</p>';
        }
    } else if (openWork.length === 0 && workspace.mode === 'EXPLORER') {
        const lead = getTeamLeadContact();
        const leadName = lead?.name || 'тимлиду';
        const hint = document.createElement('p');
        hint.className = 'hint-text explorer-idle-hint';
        hint.textContent = typeof t === 'function'
            ? t('task.explorer.idleHint', { name: leadName })
            : `Нужно ещё? Напишите ${leadName} в Slack — выдадут следующую задачу.`;
        list.appendChild(hint);
    }
}

function restActionHint(actionId, fallbackDesc) {
    if (typeof t === 'function') {
        const key = `rest.${actionId}.hint`;
        const text = t(key);
        if (text !== key) return text;
    }
    return fallbackDesc || '';
}

function renderRestList() {
    const list = document.getElementById('rest-list');
    list.innerHTML = '';
    const sectionHint = document.getElementById('rest-section-hint');
    if (sectionHint && typeof t === 'function') {
        const hint = t('rest.sectionHint');
        if (hint !== 'rest.sectionHint') sectionHint.textContent = hint;
    }
    workspace.restActions.forEach(a => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'rest-card';
        const title = document.createElement('span');
        title.className = 'rest-card-title';
        title.textContent = a.title + ' (' + a.durationHours + 'ч)';
        const desc = document.createElement('span');
        desc.className = 'rest-card-hint';
        desc.textContent = restActionHint(a.id, a.description);
        btn.title = desc.textContent;
        btn.appendChild(title);
        btn.appendChild(desc);
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
let windowResizeState = null;

function pinWindowGeometry(winEl) {
    const container = document.getElementById('desktop-windows');
    if (!container) return null;
    const cr = container.getBoundingClientRect();
    const wr = winEl.getBoundingClientRect();
    winEl.classList.add('app-window--sized');
    winEl.style.left = (wr.left - cr.left) + 'px';
    winEl.style.top = (wr.top - cr.top) + 'px';
    winEl.style.width = wr.width + 'px';
    winEl.style.height = wr.height + 'px';
    return { container, cr };
}

function applyWindowResize(e) {
    if (!windowResizeState) return;
    const { el, containerRect, startX, startY, startW, startH, axis } = windowResizeState;
    const minW = 280;
    const minH = 180;
    const left = parseFloat(el.style.left) || 0;
    const top = parseFloat(el.style.top) || 0;
    let w = startW;
    let h = startH;

    if (axis === 'e' || axis === 'se') {
        w = startW + (e.clientX - startX);
    }
    if (axis === 's' || axis === 'se') {
        h = startH + (e.clientY - startY);
    }

    w = Math.max(minW, Math.min(w, containerRect.width - left - 8));
    h = Math.max(minH, Math.min(h, containerRect.height - top - 8));
    el.style.width = w + 'px';
    el.style.height = h + 'px';
}

function endWindowResize() {
    if (!windowResizeState) return;
    windowResizeState.el.classList.remove('app-window--resizing');
    windowResizeState = null;
    document.body.style.removeProperty('cursor');
    document.body.style.removeProperty('user-select');
}

function beginWindowResize(winEl, e, axis) {
    const pinned = pinWindowGeometry(winEl);
    if (!pinned) return;

    const wr = winEl.getBoundingClientRect();
    windowResizeState = {
        el: winEl,
        containerRect: pinned.cr,
        startX: e.clientX,
        startY: e.clientY,
        startW: wr.width,
        startH: wr.height,
        axis,
        pointerId: e.pointerId
    };
    winEl.classList.add('app-window--resizing');
    document.body.style.userSelect = 'none';
    document.body.style.cursor = axis === 'e' ? 'ew-resize' : axis === 's' ? 'ns-resize' : 'nwse-resize';
}

function attachWindowResize(winEl) {
    const layer = document.createElement('div');
    layer.className = 'app-resize-layer';
    layer.innerHTML = `
        <div class="win-resize-handle win-resize-e" data-axis="e" title="Изменить ширину"></div>
        <div class="win-resize-handle win-resize-s" data-axis="s" title="Изменить высоту"></div>
        <div class="win-resize-handle win-resize-se" data-axis="se" title="Изменить размер"></div>`;
    winEl.appendChild(layer);

    layer.querySelectorAll('.win-resize-handle').forEach(handle => {
        handle.addEventListener('pointerdown', e => {
            if (e.button !== 0) return;
            e.preventDefault();
            e.stopPropagation();
            try {
                handle.setPointerCapture(e.pointerId);
            } catch (_) { /* noop */ }
            beginWindowResize(winEl, e, handle.dataset.axis || 'se');
        });
    });
}

function attachWindowDrag(titlebar, winEl, appId) {
    titlebar.addEventListener('mousedown', e => {
        if (e.button !== 0) return;
        if (e.target.closest('.app-titlebar-controls')) return;

        e.preventDefault();
        focusWindow(appId);

        const pinned = pinWindowGeometry(winEl);
        if (!pinned) return;
        const winRect = winEl.getBoundingClientRect();

        windowDragState = {
            el: winEl,
            container: pinned.container,
            offsetX: e.clientX - winRect.left,
            offsetY: e.clientY - winRect.top
        };
        winEl.classList.add('dragging');
    });
}

document.addEventListener('mousemove', e => {
    if (!windowResizeState && !windowDragState) return;
    if (windowResizeState) {
        applyWindowResize(e);
        return;
    }
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
}, { passive: true });

document.addEventListener('pointermove', e => {
    if (!windowResizeState || e.pointerId !== windowResizeState.pointerId) return;
    applyWindowResize(e);
}, { passive: true });

document.addEventListener('mouseup', () => {
    endWindowResize();
    if (!windowDragState) return;
    windowDragState.el.classList.remove('dragging');
    windowDragState = null;
});

document.addEventListener('pointerup', e => {
    if (windowResizeState && e.pointerId === windowResizeState.pointerId) {
        endWindowResize();
    }
});

function createAppWindowElement(appId) {
    const idx = openWindows.size % WINDOW_CASCADE.length;
    const pos = WINDOW_CASCADE[idx];
    const meta = getDesktopApp(appId) || (typeof DesktopFiles !== 'undefined' ? DesktopFiles.getWindowMeta(appId) : null);
    const title = getAppTitle(appId).replace(/^[^\s]+\s/, '');

    const win = document.createElement('div');
    win.className = 'app-window';
    win.dataset.app = appId;
    win.style.top = pos.top + '%';
    win.style.left = pos.left + '%';

    win.innerHTML = `
        <div class="app-titlebar">
            <div class="app-titlebar-left">
                <span class="app-title-icon">${meta?.emoji || (appId === 'contacts' ? '📱' : appId === 'recycle' ? '🗑' : appId.startsWith('__folder__') ? '📁' : appId.startsWith('__file__') ? '📄' : '📦')}</span>
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
    attachWindowResize(win);
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
    if (app === 'contacts') {
        if (typeof PhoneApp !== 'undefined') PhoneApp.open();
        else showToast('Телефон не загрузился — обновите страницу (Ctrl+F5)');
        return;
    }
    if (!workspace?.atDesk) {
        pushNotification('🔒 DevOS', 'Доступ заблокирован', 'Сначала подойдите к рабочему месту', 'warning');
        return;
    }
    if (devOsLocked) {
        pushNotification('🖥 DevOS', 'Компьютер выключен', 'Сначала включите компьютер', 'warning');
        updateDevOsLockUi();
        return;
    }
    const isLocalDesktopWindow = app.startsWith('__file__') || app.startsWith('__folder__');
    if (!vpnConnected && !isLocalDesktopWindow && typeof requiresCorporateVpn === 'function' && requiresCorporateVpn(app)) {
        const msg = typeof t === 'function' ? t('notify.vpn.blocked') : 'Этот сервис доступен только через Cisco AnyConnect';
        pushNotification('🔒 Cisco AnyConnect', typeof t === 'function' ? t('notify.vpn.blockedTitle') : 'Нужен VPN', msg, 'warning', () => openAppWindow('vpn'));
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

    const meta = getDesktopApp(app) || (typeof DesktopFiles !== 'undefined' ? DesktopFiles.getWindowMeta(app) : null);
    state.contentEl.classList.add('hidden');
    state.loaderEl.classList.remove('hidden');
    state.loaderTextEl.textContent =
        meta?.loadText || (app === 'contacts' ? 'Загрузка контактов…' : app === 'recycle' ? 'Открываю корзину…' : 'Загрузка…');

    await delay(meta?.loadMs || (app === 'recycle' ? 400 : app.startsWith('__file__') || app.startsWith('__folder__') ? 280 : 1000));

    state.loaderEl.classList.add('hidden');
    state.contentEl.classList.remove('hidden');

    if (app === 'slack' || app === 'contacts') {
        slackView = 'dm';
        if (!selectedContact) {
            const firstUnread = workspace.contacts.find(c => c.unread > 0);
            selectedContact = firstUnread?.id || workspace.contacts[0]?.id;
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
    if (app === 'contacts') return;
    if (app === 'slack') renderSlack(container, app);
    else if (app === 'ide') renderIDE(container);
    else if (app === 'jira') renderJira(container);
    else if (app === 'recycle') renderRecycleBin(container);
    else if (typeof DesktopFiles !== 'undefined') {
        const parsed = DesktopFiles.parseWindowId(app);
        if (parsed?.kind === 'file') DesktopFiles.renderFileWindow(parsed.id, container);
        else if (parsed?.kind === 'folder') DesktopFiles.renderFolderWindow(parsed.id, container);
        else if (renderExtraApp(app, container)) { /* handled */ }
    }
    else if (renderExtraApp(app, container)) { /* handled */ }
}

function rerenderSlackApp(appId = 'slack') {
    if (openWindows.has(appId)) renderAppInWindow(appId);
    const twin = appId === 'slack' ? 'contacts' : appId === 'contacts' ? 'slack' : null;
    if (twin && openWindows.has(twin)) renderAppInWindow(twin);
}

function selectSlackContact(contactId, appId = 'slack') {
    if (!contactId) return;
    slackView = 'dm';
    selectedContact = contactId;
    rerenderSlackApp(appId);
}

function slackTotalUnread() {
    return (workspace?.contacts || []).reduce((s, c) => s + (c.unread || 0), 0);
}

function buildSlackRail(appId) {
    const totalUnread = slackTotalUnread();
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
        btn.dataset.railId = item.id;
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
    return rail;
}

function buildSlackSidebar(appId) {
    const totalUnread = slackTotalUnread();
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
        btn.onclick = async (e) => {
            e.currentTarget.blur();
            slackView = 'dm';
            selectedContact = c.id;
            try {
                await markContactRead(c.id);
            } catch (_) { /* noop */ }
            rerenderSlackApp(appId);
        };
        sidebar.appendChild(btn);
    });
    return sidebar;
}

function updateSlackRailUnread(rail) {
    if (!rail) return;
    const totalUnread = slackTotalUnread();
    const dmsBtn = rail.querySelector('[data-rail-id="dms"]');
    if (!dmsBtn) return;
    dmsBtn.querySelector('.slack-rail-unread')?.remove();
    if (totalUnread > 0) {
        const pill = document.createElement('span');
        pill.className = 'slack-rail-unread';
        pill.textContent = totalUnread > 9 ? '9+' : String(totalUnread);
        dmsBtn.appendChild(pill);
    }
}

function patchSlackMain(main, appId) {
    if (!main) return;
    const scrollTop = main.querySelector('.slack-messages')?.scrollTop ?? 0;
    const input = main.querySelector('.slack-compose-input');
    const inputVal = input?.value ?? '';
    const focusInput = input && document.activeElement === input;

    main.innerHTML = '';
    if (slackView === 'channel') {
        renderSlackChannelMain(main, appId);
    } else {
        if (!selectedContact) {
            selectedContact = workspace.contacts.find(c => c.unread > 0)?.id || workspace.contacts[0]?.id;
        }
        renderSlackDmMain(main, appId, selectedContact);
    }

    const msgEl = main.querySelector('.slack-messages');
    if (msgEl) msgEl.scrollTop = scrollTop;
    const newInput = main.querySelector('.slack-compose-input');
    if (newInput && inputVal) newInput.value = inputVal;
    if (focusInput && newInput) newInput.focus();
}

function patchSlackWindow(container, appId, { sidebar = true } = {}) {
    const app = container.querySelector('.slack-app');
    if (!app) {
        renderSlack(container, appId);
        return;
    }
    patchSlackMain(app.querySelector('.slack-main'), appId);
    if (sidebar) {
        const oldSidebar = app.querySelector('.slack-sidebar');
        if (oldSidebar) oldSidebar.replaceWith(buildSlackSidebar(appId));
    }
    updateSlackRailUnread(app.querySelector('.slack-rail'));
}

function renderSlack(container, appId) {
    container.innerHTML = '';
    const app = document.createElement('div');
    app.className = 'slack-app';
    const rail = buildSlackRail(appId);
    const sidebar = buildSlackSidebar(appId);
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
            row.className = 'slack-msg' + (m.fromPlayer ? ' slack-msg--mine' : '') + (isUnread ? ' slack-msg--unread' : '')
                + (typeof ChatTextAnalyzer !== 'undefined' ? ChatTextAnalyzer.messageClass(m.text, m.fromPlayer) : '');
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
                    selectSlackContact(m.contactId, appId);
                    markContactRead(m.contactId).catch(() => {});
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
        row.className = 'slack-msg' + (m.fromPlayer ? ' slack-msg--mine' : '') + (isUnread ? ' slack-msg--unread' : '')
            + (typeof ChatTextAnalyzer !== 'undefined' ? ChatTextAnalyzer.messageClass(m.text, m.fromPlayer) : '');
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
    } else if (workspace.mode === 'EXPLORER' && isTeamLeadContact(contactId) && !hasOpenWorkTasks()) {
        const hint = document.createElement('p');
        hint.className = 'reply-hint';
        hint.textContent = typeof t === 'function' ? t('task.explorer.askLeadHint') : '💡 Нет задач? Спросите у тимлида:';
        replies.appendChild(hint);
        [
            { id: 'explorer-ask-work', text: typeof t === 'function' ? t('task.explorer.askWork') : 'Готов взять ещё задачу' },
            { id: 'explorer-ask-work-alt', text: typeof t === 'function' ? t('task.explorer.askWhatNext') : 'Чем заняться дальше?' }
        ].forEach(opt => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'reply-btn reply-btn-casual';
            btn.textContent = opt.text;
            btn.onclick = () => sendChatMessage({ contactId, replyOptionId: opt.id });
            btn.disabled = chatBusy;
            replies.appendChild(btn);
        });
    } else if (!contactHasActiveTasks(contactId) && !contactPlayerHasSpoken(contactId)) {
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
    } else if (!contactHasActiveTasks(contactId) && contactPlayerHasSpoken(contactId)) {
        if (chatBusy) {
            const hint = document.createElement('p');
            hint.className = 'reply-hint';
            hint.textContent = '⏳ ' + getContactName(contactId) + ' печатает ответ…';
            replies.appendChild(hint);
        }
    } else {
        const hint = document.createElement('p');
        hint.className = 'reply-hint';
        const active = getTaskForContact(contactId);
        hint.textContent = active
            ? `📋 Быстрые ответы по ${active.ticketId} — или напишите своё`
            : '💬 Напишите сообщение — коллега ответит через несколько секунд';
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
    if (chatBusy) {
        input.placeholder = `${getContactName(contactId)} печатает…`;
    }
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

const JAVA_KEYWORDS = new Set([
    'abstract', 'assert', 'boolean', 'break', 'byte', 'case', 'catch', 'char', 'class', 'const', 'continue',
    'default', 'do', 'double', 'else', 'enum', 'extends', 'final', 'finally', 'float', 'for', 'goto', 'if',
    'implements', 'import', 'instanceof', 'int', 'interface', 'long', 'native', 'new', 'null', 'package',
    'private', 'protected', 'public', 'return', 'short', 'static', 'strictfp', 'super', 'switch', 'synchronized',
    'this', 'throw', 'throws', 'transient', 'try', 'true', 'false', 'void', 'volatile', 'while', 'var', 'record'
]);

function escapeHtmlText(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function highlightJava(code) {
    let html = '';
    let i = 0;
    while (i < code.length) {
        if (code.startsWith('/*', i)) {
            let end = code.indexOf('*/', i + 2);
            end = end === -1 ? code.length : end + 2;
            html += `<span class="ij-hl-comment">${escapeHtmlText(code.slice(i, end))}</span>`;
            i = end;
            continue;
        }
        if (code.startsWith('//', i)) {
            let end = code.indexOf('\n', i);
            end = end === -1 ? code.length : end;
            html += `<span class="ij-hl-comment">${escapeHtmlText(code.slice(i, end))}</span>`;
            i = end;
            continue;
        }
        const ch = code[i];
        if (ch === '"') {
            let j = i + 1;
            while (j < code.length) {
                if (code[j] === '\\') { j += 2; continue; }
                if (code[j] === '"') { j++; break; }
                j++;
            }
            html += `<span class="ij-hl-string">${escapeHtmlText(code.slice(i, j))}</span>`;
            i = j;
            continue;
        }
        if (ch === "'") {
            let j = i + 1;
            while (j < code.length && code[j] !== "'") {
                if (code[j] === '\\') j++;
                j++;
            }
            if (j < code.length) j++;
            html += `<span class="ij-hl-string">${escapeHtmlText(code.slice(i, j))}</span>`;
            i = j;
            continue;
        }
        if (ch === '@') {
            let j = i + 1;
            while (j < code.length && /[\w.]/.test(code[j])) j++;
            html += `<span class="ij-hl-annotation">${escapeHtmlText(code.slice(i, j))}</span>`;
            i = j;
            continue;
        }
        const word = code.slice(i).match(/^[\w$]+/);
        if (word) {
            const w = word[0];
            let j = i + w.length;
            while (j < code.length && /\s/.test(code[j])) j++;
            const isCall = code[j] === '(';
            if (/^(\d|0x)/.test(w)) {
                html += `<span class="ij-hl-number">${escapeHtmlText(w)}</span>`;
            } else if (JAVA_KEYWORDS.has(w)) {
                html += `<span class="ij-hl-keyword">${escapeHtmlText(w)}</span>`;
            } else if (isCall) {
                html += `<span class="ij-hl-method">${escapeHtmlText(w)}</span>`;
            } else if (/^[A-Z]/.test(w)) {
                html += `<span class="ij-hl-type">${escapeHtmlText(w)}</span>`;
            } else {
                html += escapeHtmlText(w);
            }
            i += w.length;
            continue;
        }
        html += escapeHtmlText(ch);
        i++;
    }
    return html;
}

function syncIdeEditorHighlight(editor, highlightEl) {
    if (!editor || !highlightEl) return;
    highlightEl.innerHTML = highlightJava(editor.value) + '\n';
    highlightEl.scrollTop = editor.scrollTop;
    highlightEl.scrollLeft = editor.scrollLeft;
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

function scrollIdeEditorToLine(editor, line, highlightEl) {
    if (!editor || !line || line < 1) return;
    const lines = editor.value.split('\n');
    const idx = Math.min(line - 1, lines.length - 1);
    let pos = 0;
    for (let i = 0; i < idx; i++) pos += lines[i].length + 1;
    editor.focus();
    editor.setSelectionRange(pos, pos + (lines[idx]?.length || 0));
    const lineHeight = parseFloat(getComputedStyle(editor).lineHeight) || 20;
    editor.scrollTop = Math.max(0, idx * lineHeight - editor.clientHeight / 3);
    syncIdeEditorHighlight(editor, highlightEl);
}

function isNoCodeMode() {
    return workspace?.noCodeMode === true || workspace?.modeId === 'EXPLORER';
}

function findGuidedObjective(task, stepId) {
    if (!task?.objectives) return null;
    return task.objectives.find(o =>
        o.type === 'GUIDED_STEP' && !o.completed && (!stepId || o.stepId === stepId));
}

async function completeGuidedStep(taskId, stepId) {
    const resp = await api('/guided/complete', {
        method: 'POST',
        body: JSON.stringify({ taskId, stepId })
    });
    ws(resp);
    if (resp.message) showToast(resp.message);
    return resp;
}

function renderGuidedIDE(container, task) {
    container.innerHTML = '';
    const app = document.createElement('div');
    app.className = 'ij-app ij-app--guided';

    const menubar = document.createElement('div');
    menubar.className = 'ij-menubar';
    menubar.innerHTML = '<span>File</span><span>View</span><span>Help</span>';

    const body = document.createElement('div');
    body.className = 'ij-body';

    const editorArea = document.createElement('div');
    editorArea.className = 'ij-editor-area';

    const banner = document.createElement('div');
    banner.className = 'ij-guided-banner';
    banner.textContent = typeof t === 'function'
        ? t('explorer.ide.banner')
        : 'Режим «Знакомство» — код писать не нужно. Читайте и следуйте чеклисту слева.';

    const tabs = document.createElement('div');
    tabs.className = 'ij-tabs';
    tabs.innerHTML = `<span class="ij-tab active">${task.code?.fileName || 'Гид'}</span><span class="ij-tab muted">${task.ticketId}</span>`;

    const brief = document.createElement('pre');
    brief.className = 'ij-guided-brief';
    brief.textContent = task.code?.currentCode || task.code?.starterCode || task.description || '';

    const actions = document.createElement('div');
    actions.className = 'ij-guided-actions';
    const briefStep = findGuidedObjective(task, 'step-read-brief');
    if (briefStep) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn btn-primary';
        btn.textContent = typeof t === 'function' ? t('explorer.ide.understood') : '✓ Понятно — дальше';
        btn.onclick = async () => {
            await completeGuidedStep(task.id, 'step-read-brief');
            renderIDE(container);
        };
        actions.appendChild(btn);
    } else {
        const done = document.createElement('p');
        done.className = 'ij-guided-done';
        done.textContent = typeof t === 'function' ? t('explorer.ide.nextHint') : 'Дальше — ответ в Slack и закрытие JIRA.';
        actions.appendChild(done);
    }

    editorArea.append(banner, tabs, brief, actions);
    body.appendChild(editorArea);
    app.append(menubar, body);
    container.appendChild(app);
}

function renderIDE(container) {
    const task = getFocusedTask();
    if (isNoCodeMode()) {
        if (task?.code) {
            renderGuidedIDE(container, task);
        } else {
            container.innerHTML = '';
            const app = document.createElement('div');
            app.className = 'ij-app ij-app--guided';
            app.innerHTML = `<div class="ij-menubar"><span>File</span><span>View</span><span>Help</span></div>
                <div class="ij-body"><div class="ij-editor-area">
                <div class="ij-guided-banner">${typeof t === 'function' ? t('explorer.ide.banner') : 'Режим «Знакомство» — прочитайте краткое описание задачи'}</div>
                <p class="ij-empty ij-hint" style="padding:12px">Откройте задачу в JIRA и возьмите её в работу, или прочитайте Slack</p>
                </div></div>`;
            container.appendChild(app);
        }
        return;
    }
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

    const editorStack = document.createElement('div');
    editorStack.className = 'ij-editor-stack';

    const highlightEl = document.createElement('pre');
    highlightEl.className = 'ij-highlight';
    highlightEl.setAttribute('aria-hidden', 'true');

    const editor = document.createElement('textarea');
    editor.className = 'code-editor ij-editor';
    editor.spellcheck = false;
    editor.value = task.code.currentCode || task.code.starterCode;
    editor.oninput = () => {
        syncIdeEditorHighlight(editor, highlightEl);
        syncIdeLineNumbers(editor, lineNumsEl, ideTestFailure?.line);
        api('/code/save', { method: 'POST', body: JSON.stringify({ taskId: task.id, code: editor.value }) });
    };
    editor.onscroll = () => {
        syncIdeEditorHighlight(editor, highlightEl);
        syncIdeLineNumbers(editor, lineNumsEl, ideTestFailure?.line);
    };

    editorStack.append(highlightEl, editor);
    editorWrap.append(lineNumsEl, editorStack);
    syncIdeEditorHighlight(editor, highlightEl);
    syncIdeLineNumbers(editor, lineNumsEl, ideTestFailure?.line);
    if (ideTestFailure?.line) {
        requestAnimationFrame(() => scrollIdeEditorToLine(editor, ideTestFailure.line, highlightEl));
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

function normalizeJiraStatusUi(status) {
    const s = (status || 'TO DO').toUpperCase().replace(/_/g, ' ').trim();
    if (s === 'DONE' || s === 'CLOSED') return 'DONE';
    if (s.includes('PROGRESS')) return 'IN PROGRESS';
    if (s === 'OPEN' || s === 'TO DO' || s === 'TODO') return 'TO DO';
    return s;
}

function createJiraStatusSelect(task) {
    const select = document.createElement('select');
    select.className = 'jira-status-select';
    select.title = 'Сменить статус';
    [['TO DO', 'To Do'], ['IN PROGRESS', 'In Progress'], ['DONE', 'Done']].forEach(([value, label]) => {
        const opt = document.createElement('option');
        opt.value = value;
        opt.textContent = label;
        select.appendChild(opt);
    });
    select.value = normalizeJiraStatusUi(task.jiraStatus);
    select.addEventListener('click', e => e.stopPropagation());
    select.addEventListener('mousedown', e => e.stopPropagation());
    select.onchange = async () => {
        const prev = normalizeJiraStatusUi(task.jiraStatus);
        const next = select.value;
        if (next === prev) return;
        const resp = await api('/jira/transition', {
            method: 'POST',
            body: JSON.stringify({ taskId: task.id, status: next })
        });
        if (!resp.success) {
            select.value = prev;
            if (resp.message) showToast(resp.message);
        }
        ws(resp);
        if (resp.success && next === 'IN PROGRESS') openAppWindow('ide');
    };
    return select;
}

function jiraTypeIcon(task) {
    switch (task.scenarioTag) {
        case 'SQL_ANALYTICS':
        case 'SQL_SLOW_QUERY':
            return '📊';
        case 'TROUBLESHOOT_DIAG':
            return '🔍';
        case 'RELEASE_DEPLOY':
            return '🚀';
        case 'JAVA_QUIZ':
        case 'ALGORITHM_BASICS':
            return '📚';
        default:
            break;
    }
    if (task.type === 'PRODUCTION_BUG') return '🔥';
    if (task.type === 'BUG_FIX') return '🐛';
    if (task.type === 'CODE_REVIEW') return '🔍';
    return '📋';
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
        const typeIcon = jiraTypeIcon(task);

        const typeTd = document.createElement('td');
        typeTd.className = 'jira-type';
        typeTd.textContent = typeIcon;
        tr.appendChild(typeTd);

        const keyTd = document.createElement('td');
        keyTd.className = 'jira-key';
        keyTd.textContent = task.ticketId;
        tr.appendChild(keyTd);

        const summaryTd = document.createElement('td');
        summaryTd.className = 'jira-summary';
        summaryTd.textContent = task.title;
        tr.appendChild(summaryTd);

        const statusTd = document.createElement('td');
        statusTd.className = 'jira-status-cell';
        statusTd.appendChild(createJiraStatusSelect(task));
        tr.appendChild(statusTd);

        const actionsTd = document.createElement('td');
        actionsTd.className = 'jira-row-actions';
        const ideBtn = document.createElement('button');
        ideBtn.type = 'button';
        ideBtn.className = 'jira-mini-btn jira-mini-btn--ghost';
        ideBtn.textContent = 'IDE';
        ideBtn.title = 'Открыть в IntelliJ';
        ideBtn.onclick = async (e) => {
            e.stopPropagation();
            const resp = await api('/task/focus', { method: 'POST', body: JSON.stringify({ taskId: task.id }) });
            ws(resp);
            if (resp.success) openAppWindow('ide');
        };
        actionsTd.appendChild(ideBtn);
        tr.appendChild(actionsTd);

        tr.onclick = e => {
            if (e.target.closest('button, select, option')) return;
            tr.classList.toggle('expanded');
        };
        tbody.appendChild(tr);

        const detail = document.createElement('tr');
        detail.className = 'jira-detail-row';
        const sqlGuide = task.scenarioTag === 'SQL_ANALYTICS' && typeof getSqlWorkflowGuide === 'function'
            ? getSqlWorkflowGuide(task) : null;
        const sqlGuideHtml = sqlGuide ? `<div class="jira-sql-guide">
            <p class="jira-sql-guide-title">Как выполнить ${escapeHtml(task.ticketId)}</p>
            <ol class="jira-sql-steps">
                <li>Slack 💬 — прочитать ТЗ от тимлида</li>
                <li>pgAdmin 🐘 — кнопка <strong>«${escapeHtml((sqlGuide.pgButton || '').replace(/^📊\\s*/, ''))}»</strong> внизу окна</li>
                <li>Slack 💬 → Dmitry — ${escapeHtml(sqlGuide.slackReply || 'отправить результат')}</li>
                <li>JIRA — «→ Done»</li>
            </ol>
            <div class="jira-sql-quick">
                <button type="button" class="btn btn-secondary btn-sm jira-open-pg">🐘 pgAdmin</button>
                <button type="button" class="btn btn-secondary btn-sm jira-open-slack">💬 Slack → Dmitry</button>
            </div>
        </div>` : '';
        detail.innerHTML = `<td colspan="5"><div class="jira-detail">
            <p class="jira-desc">${escapeHtml(task.description)}</p>
            ${sqlGuideHtml}
            ${task.objectives.map(o => `<div class="jira-obj${o.completed ? ' done' : ''}">${o.completed ? '✅' : '⬜'} ${escapeHtml(formatObjectiveLabel(o))}</div>`).join('')}
            <div class="jira-actions">
                <button type="button" class="btn btn-secondary jira-done-btn">→ Done</button>
            </div></div></td>`;
        detail.querySelector('.jira-open-pg')?.addEventListener('click', e => {
            e.stopPropagation();
            openAppWindow('postgres');
        });
        detail.querySelector('.jira-open-slack')?.addEventListener('click', e => {
            e.stopPropagation();
            selectSlackContact('dmitry');
            openAppWindow('slack');
        });
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

ensureDesktopIconsRendered(openAppWindow);
initDesktopDragDrop();
initDesktopContextMenus(openAppWindow);
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
function openPhoneFromTray() {
    if (typeof PhoneApp === 'undefined') {
        showToast('Телефон не загрузился — обновите страницу (Ctrl+F5)');
        return;
    }
    PhoneApp.toggle();
}

function initPhoneTray() {
    document.getElementById('tb-phone-btn')?.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();
        openPhoneFromTray();
    });
}

document.querySelectorAll('.tray-btn').forEach(el => {
    if (el.id === 'tb-phone-btn' || el.id === 'office-walk-btn') return;
    el.addEventListener('click', e => {
        e.preventDefault();
        openAppWindow(el.dataset.app);
    });
});
initPhoneTray();
document.getElementById('to-onboarding-btn')?.addEventListener('click', goToOnboarding);
document.getElementById('ob-next-btn')?.addEventListener('click', () => { onboardingStep++; renderOnboarding(); });
document.getElementById('ob-back-btn')?.addEventListener('click', onboardingBack);
document.getElementById('start-btn')?.addEventListener('click', startGame);
document.getElementById('resume-game-btn')?.addEventListener('click', () => resumeGame());
document.getElementById('menu-btn')?.addEventListener('click', returnToMenu);
document.getElementById('office-walk-btn')?.addEventListener('click', async () => {
    if (!workspace?.atDesk) return;
    if (typeof PhoneApp !== 'undefined') PhoneApp.close();
    closeAllApps();
    closeStartMenu();
    meetingActive = false;
    if (typeof MeetingVoice !== 'undefined') MeetingVoice.stop();
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
    const AUTH_API = window.__AUTH_API__ || '/api/auth';
    try {
        await fetch(AUTH_API + '/logout', { method: 'POST', headers: authHeaders() });
    } catch { /* ignore */ }
    setAuthToken('');
    window.location.href = '/';
}

document.getElementById('logout-btn')?.addEventListener('click', () => logoutUser().catch(console.error));

(async () => {
    try {
        const AUTH_API = window.__AUTH_API__ || '/api/auth';
        const res = await fetch(AUTH_API + '/me', { headers: authHeaders() });
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
        bindDevOsLockUi();
        await initMenu();
    } catch (e) {
        console.error(e);
    }
})();
