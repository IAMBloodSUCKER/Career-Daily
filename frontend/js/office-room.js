/** Офис в формате визуальной новеллы: тап → приближение → новый кадр */
let fpRoom = 'elevator';
let fpRoomActions = [];
let fpArrivalType = 'ON_TIME';
let fpWakeArrival = false;
let fpWalkExtraMinutes = 0;
let morningCommuteScenario = null;
let fpMoving = false;
let fpGameTime = '08:55';
let fpDoneHotspots = new Set();

/** Сколько игровых минут «съедает» действие в офисе до стола */
const FP_ACTION_MINUTES = {
    coffee: 1,
    greet: 1,
    kitchen_chat: 3,
    slow: 2
};

function parseFpTime(str) {
    const m = String(str || '08:55').match(/(\d{1,2}):(\d{2})/);
    if (!m) return { hour: 8, minute: 55 };
    return { hour: parseInt(m[1], 10), minute: parseInt(m[2], 10) };
}

function formatFpTime(hour, minute) {
    let total = hour * 60 + minute;
    if (total < 0) total = 0;
    const h = Math.floor(total / 60) % 24;
    const m = total % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function fpTimeToMinutes(str) {
    const t = parseFpTime(str);
    return t.hour * 60 + t.minute;
}

function laterFpTime(a, b) {
    return fpTimeToMinutes(a) >= fpTimeToMinutes(b) ? a : b;
}

function advanceFpGameTime(minutes) {
    const t = parseFpTime(fpGameTime);
    fpGameTime = formatFpTime(t.hour, t.minute + minutes);
    const el = document.getElementById('fp-time');
    if (el) {
        el.textContent = fpGameTime;
        el.classList.remove('fp-time-tick');
        void el.offsetWidth;
        el.classList.add('fp-time-tick');
    }
    return fpGameTime;
}

function fpMinutesLabel(minutes) {
    const n = Math.abs(minutes);
    const mod10 = n % 10;
    const mod100 = n % 100;
    if (mod10 === 1 && mod100 !== 11) return `${n} минута`;
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return `${n} минуты`;
    return `${n} минут`;
}

function fpActionNarrative(action, before, after, minutes) {
    const tick = `⏱ ${before} → ${after} (+${fpMinutesLabel(minutes)})`;
    switch (action) {
        case 'coffee':
            return `☕ Americano. Бодрость +. ${tick}`;
        case 'greet':
            return `«Привет! Первый день?» ${tick}. Daily в 11:30 — успеете.`;
        case 'kitchen_chat':
            return `💬 Поболтали у кофемашины про релиз. ${tick}. Ещё +12 мин — к 9:00 лучше не тянуть.`;
        case 'slow':
            return `👜 Расставили вещи у стола. ${tick}. Daily в 11:30 — времени ещё полно.`;
        default:
            return tick;
    }
}

const VN_ORIGIN = {
    forward: { x: 50, y: 62 },
    back: { x: 50, y: 38 },
    left: { x: 28, y: 50 },
    right: { x: 72, y: 50 },
    sit: { x: 50, y: 42 }
};

const VN_ARROW_LABELS = {
    forward: 'Дальше',
    back: 'Назад',
    left: 'Слева',
    right: 'Справа'
};

/** Подписи на стрелках — куда ведёт переход */
const EXIT_DEST_LABELS = {
    kitchen: 'Кухня',
    openspace: 'Open-space',
    elevator: 'Лифт',
    entrance: 'Вход',
    desk_row: 'К ряду столов',
    seated: 'Мой стол'
};

const VN_ARROW_ICONS = {
    forward: '↓',
    back: '↑',
    left: '←',
    right: '→'
};

/** Сколько реального времени на дорогу до стола (сек), прежде чем сработает «проспал». */
const ARRIVAL_BUDGET_SEC = { day1: 300, default: 180 };

const FP_ROOMS = {
    elevator: {
        name: 'Лифт · 3 этаж',
        time: '08:55',
        intro: 'Вы на 3-м этаже. Стрелка внизу — в open-space. Успейте устроиться до начала рабочего дня.',
        exits: { forward: 'entrance' },
        hotspots: [
            { id: 'mirror', x: 35, y: 48, label: 'Зеркало', type: 'inspect',
                text: '«3 этаж · Engineering». Вы выглядите готовым к багам.' }
        ]
    },
    entrance: {
        name: 'Open-space · вход',
        time: '08:56',
        intro: 'Зона отдыха у окна слева. Справа — проход на кухню, впереди через стекло — open-space.',
        exits: { back: 'elevator', right: 'kitchen', forward: 'openspace' },
        hotspots: [
            { id: 'colleague', x: 48, y: 52, label: 'Коллега', type: 'action', action: 'greet',
                text: '«Привет! Первый день? Удачи на daily.»' },
            { id: 'poster', x: 86, y: 36, label: 'Доска спринта', type: 'inspect',
                visual: 'sprint-board',
                text: 'Sprint 42 · JIRA-142 In Progress · Daily 11:30.' }
        ]
    },
    kitchen: {
        name: 'Кухня',
        time: '08:58',
        intro: 'Офисная кухня. Кофемашина, столики. Дверь назад — в зону отдыха у входа.',
        exits: { back: 'entrance', forward: 'openspace' },
        hotspots: [
            { id: 'coffee', x: 32, y: 55, label: 'Кофе', type: 'action', action: 'coffee',
                text: 'Кофемашина — минута на americano.' },
            { id: 'kitchen-chat', x: 62, y: 58, label: 'Поболтать', type: 'action', action: 'kitchen_chat',
                text: 'Коллеги у кофемашины — можно поболтать, но время идёт.' }
        ]
    },
    openspace: {
        name: 'Open-space',
        time: '08:58',
        intro: 'Ряды столов. Кто-то на митинге в наушниках, на мониторах — JIRA.',
        exits: { back: 'entrance', forward: 'desk_row' },
        hotspots: [
            { id: 'meet-guy', x: 72, y: 48, label: 'На митинге', type: 'inspect',
                text: 'Коллега в Meet: «…deploy в пятницу…»' },
            { id: 'jira-desk', x: 14, y: 38, label: 'Доска / JIRA', type: 'inspect',
                visual: 'sprint-board',
                text: 'На whiteboard — Sprint, диаграммы. На мониторе соседа — JIRA-142, High priority.' }
        ]
    },
    desk_row: {
        name: 'Ваш ряд',
        time: '08:59',
        intro: 'Третий ряд столов. Впереди — ваше место.',
        exits: { back: 'openspace', forward: 'seated' },
        hotspots: [
            { id: 'sticker', x: 55, y: 50, label: 'JIRA-142', type: 'inspect',
                text: 'Жёлтый стикер: «JIRA-142 — fix NPE».' }
        ]
    },
    seated: {
        name: 'За компьютером',
        time: '09:00',
        intro: 'Вы за своим столом. Нажмите на экран — включить DevOS. Телефон и вещи — по желанию.',
        exits: { back: 'desk_row' },
        hotspots: [
            { id: 'power', x: 50, y: 42, label: 'Включить DevOS', type: 'boot' },
            { id: 'phone', x: 84, y: 34, label: 'Телефон', type: 'phone',
                text: 'Slack: «Stand-up в 11:30». Мария: «JIRA-142 срочно 🙏».' },
            { id: 'bag', x: 18, y: 68, label: 'Вещи', type: 'action', action: 'slow',
                text: 'Расставили кружку и блокнот — можно включать DevOS.' }
        ]
    }
};

const FP_MAP_ORDER = ['elevator', 'entrance', 'kitchen', 'openspace', 'desk_row', 'seated'];

const FP_SCENE_VER = 'v=4';
const FP_SCENE_EXT = 'png';

function sceneImagePath(roomId) {
    const scene = document.getElementById('fp-scene');
    if (scene?.classList.contains('fp-monitor-on') && roomId === 'seated') {
        return `/img/office/monitor.${FP_SCENE_EXT}?${FP_SCENE_VER}`;
    }
    return `/img/office/${roomId}.${FP_SCENE_EXT}?${FP_SCENE_VER}`;
}

function updateSceneImage(roomId) {
    const scene = document.getElementById('fp-scene');
    const img = document.getElementById('fp-scene-img');
    const path = sceneImagePath(roomId);
    if (scene) {
        scene.style.backgroundImage = `url('${path}')`;
    }
    if (img && img.getAttribute('src') !== path) {
        img.src = path;
        img.style.display = '';
    }
    OfficeAudio?.playRoom?.(roomId);
}

let officeAudioUnlocked = false;

function unlockOfficeAudio() {
    officeAudioUnlocked = true;
    return OfficeAudio?.unlock?.();
}

function bindOfficeAudioUi() {
    const btn = document.getElementById('fp-audio-btn');
    if (!btn || btn.dataset.bound) return;
    btn.dataset.bound = '1';
    btn.addEventListener('click', async e => {
        e.stopPropagation();
        await unlockOfficeAudio();
        const muted = await OfficeAudio.toggleMute();
        btn.classList.toggle('muted', muted);
        btn.textContent = muted ? '🔇' : '🔊';
        btn.title = muted ? 'Включить звук офиса' : 'Выключить звук офиса';
        if (!muted) OfficeAudio?.playRoom?.(fpRoom, { force: true });
    });
}

function showFpControls() {
    document.getElementById('fp-nav-arrows')?.classList.remove('hidden');
    document.getElementById('fp-hotspots')?.classList.remove('hidden');
    document.getElementById('fp-curtain')?.classList.remove('active');
}

function resetFpMotionState() {
    fpMoving = false;
    showFpControls();
}

function resetFpWorld() {
    fpMoving = false;
    cleanupElevatorRide();
    fpRoom = 'elevator';
    fpDoneHotspots.clear();
    const scene = document.getElementById('fp-scene');
    const stage = document.getElementById('fp-stage');
    if (scene) {
        scene.dataset.room = 'elevator';
        scene.classList.remove('fp-monitor-on');
    }
    updateSceneImage('elevator');
    const elevRide = document.getElementById('fp-elevator-ride');
    if (elevRide) {
        elevRide.classList.add('hidden');
        elevRide.classList.remove('fp-elevator-fadeout', 'fp-elevator-doors-closed');
        elevRide.setAttribute('aria-hidden', 'true');
    }
    document.getElementById('fp-elevator-cabin')?.classList.remove('fp-elevator-riding');
    stage?.classList.remove('vn-zoom-out', 'vn-enter');
    stage?.style.removeProperty('transform-origin');
    hideInspectVisual();
    showFpControls();
}

function vnTransition(roomId, dir) {
    if (fpMoving || roomId === fpRoom) return Promise.resolve();

    unlockOfficeAudio();
    const fromRoom = fpRoom;
    OfficeAudio?.playMove?.(fromRoom, roomId, dir);
    fpMoving = true;
    const stage = document.getElementById('fp-stage');
    const curtain = document.getElementById('fp-curtain');
    const arrows = document.getElementById('fp-nav-arrows');
    const hotspots = document.getElementById('fp-hotspots');

    arrows?.classList.add('hidden');
    hotspots?.classList.add('hidden');

    const origin = VN_ORIGIN[dir] || VN_ORIGIN.forward;
    if (stage) {
        stage.style.transformOrigin = `${origin.x}% ${origin.y}%`;
        stage.classList.remove('vn-enter');
        stage.classList.add('vn-zoom-out');
    }

    document.getElementById('fp-narrative').textContent = '…';

    return new Promise(resolve => {
        setTimeout(() => {
            curtain?.classList.add('active');
            setTimeout(() => {
                try {
                    enterRoom(roomId, false);
                    stage?.classList.remove('vn-zoom-out');
                    stage?.classList.add('vn-enter');
                } finally {
                    curtain?.classList.remove('active');
                    setTimeout(() => {
                        stage?.classList.remove('vn-enter');
                        resetFpMotionState();
                        updateFpBackButton();
                        resolve();
                    }, 550);
                }
            }, 160);
        }, 720);
    });
}

function travelTo(roomId, dir = 'forward') {
    return vnTransition(roomId, dir);
}

function fpElevatorLabel(key) {
    const fallbacks = {
        'elevator.ride.call': 'Вы в лифте на 1-м этаже. Нажмите кнопку ниже, чтобы поехать на 3-й этаж (Engineering).',
        'elevator.ride.cta': '▲ 3 этаж — поехать',
        'elevator.ride.hint': 'Клавиши 3 или Enter — тоже сработают',
        'elevator.ride.departing': 'Отправляемся…',
        'elevator.ride.closing': 'Двери закрываются…',
        'elevator.ride.going': '⬆ Едем на 3 этаж · Engineering',
        'elevator.ride.arrived': '3 этаж — двери открываются',
        'elevator.ride.skip': 'Enter или клик по экрану — пропустить',
        'elevator.ride.exit': '3 этаж · Engineering. Двери открыты — выходите в open-space.',
        'elevator.ride.exitCta': '↓ Выйти из лифта',
        'elevator.ride.exitHint': 'Enter или клик по проходу — выйти'
    };
    if (typeof t === 'function') {
        const v = t(key);
        if (v && v !== key) return v;
    }
    return fallbacks[key] || key;
}

let elevatorRideCleanup = null;
let elevatorCallHandler = null;
let elevatorExitHandler = null;
let elevatorHintRestore = null;
let elevatorRideTimers = [];
let elevatorExitPhaseActive = false;

function setElevatorHudMode(active, phase) {
    const hud = document.querySelector('.fp-hud');
    const wrap = document.querySelector('.fp-stage-wrap');
    hud?.classList.toggle('fp-hud-elevator', active);
    wrap?.classList.toggle('fp-elevator-active', active);
    hud?.classList.toggle('fp-hud-elevator-waiting', active && phase === 'waiting');
    hud?.classList.toggle('fp-hud-elevator-riding', active && phase === 'riding');
    hud?.classList.toggle('fp-hud-elevator-exit', active && phase === 'exit');
}

function setElevatorHint(text) {
    const hintEl = document.getElementById('fp-hint');
    if (!hintEl) return;
    if (elevatorHintRestore == null) elevatorHintRestore = hintEl.textContent;
    hintEl.textContent = text;
    hintEl.classList.add('fp-hint-elevator');
}

function renderElevatorHudAction(label, onClick) {
    const choices = document.getElementById('fp-choices');
    if (!choices) return;
    choices.innerHTML = '';
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.id = 'fp-elevator-hud-btn';
    btn.className = 'fp-choice-btn fp-elevator-hud-btn';
    btn.textContent = label;
    btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick();
    });
    choices.appendChild(btn);
}

function clearElevatorHudAction() {
    const choices = document.getElementById('fp-choices');
    if (choices?.querySelector('#fp-elevator-hud-btn')) choices.innerHTML = '';
}

function detachElevatorExitHandlers() {
    if (!elevatorExitHandler) return;
    const { overlay, portal, onKey } = elevatorExitHandler;
    portal?.removeEventListener('click', elevatorExitHandler.onPortal);
    overlay?.removeEventListener('click', elevatorExitHandler.onOverlay);
    if (onKey) document.removeEventListener('keydown', onKey);
    elevatorExitHandler = null;
}

function detachElevatorCallHandlers() {
    if (!elevatorCallHandler) return;
    const { overlay, btn, cta, onKey } = elevatorCallHandler;
    overlay?.removeEventListener('click', elevatorCallHandler.onOverlay);
    btn?.removeEventListener('click', elevatorCallHandler.onBtn);
    cta?.removeEventListener('click', elevatorCallHandler.onCta);
    if (onKey) document.removeEventListener('keydown', onKey);
    elevatorCallHandler = null;
}

function restoreElevatorUiHint() {
    const hintEl = document.getElementById('fp-hint');
    if (hintEl && elevatorHintRestore != null) {
        hintEl.textContent = elevatorHintRestore;
        elevatorHintRestore = null;
    }
    hintEl?.classList.remove('fp-hint-elevator');
    clearElevatorHudAction();
    setElevatorHudMode(false);
    document.getElementById('fp-elevator-cta')?.classList.add('hidden');
    document.getElementById('fp-elevator-ride')?.classList.remove('fp-elevator-exit');
    document.getElementById('fp-elevator-exit-view')?.setAttribute('aria-hidden', 'true');
}

function cleanupElevatorRide() {
    detachElevatorCallHandlers();
    detachElevatorExitHandlers();
    elevatorRideTimers.forEach(id => clearTimeout(id));
    elevatorRideTimers = [];
    elevatorExitPhaseActive = false;
    restoreElevatorUiHint();
    if (elevatorRideCleanup) {
        elevatorRideCleanup = null;
    }
    OfficeAudio?.stopElevatorRideHum?.();
    document.getElementById('fp-elevator-cabin')?.classList.remove('fp-elevator-doors-closed');
    document.getElementById('fp-elevator-ride')?.classList.remove('fp-elevator-exit');
}

/** Ждём, пока игрок нажмёт кнопку в HUD */
function showElevatorCallPanel(onDone) {
    cleanupElevatorRide();

    const overlay = document.getElementById('fp-elevator-ride');
    const cabin = document.getElementById('fp-elevator-cabin');
    const floorEl = document.getElementById('fp-elevator-floor');
    const statusEl = document.getElementById('fp-elevator-status');
    const skipEl = document.getElementById('fp-elevator-skip');
    const callBtn = document.querySelector('.fp-elevator-btn--call[data-floor="3"]');
    const ctaBtn = document.getElementById('fp-elevator-cta');

    fpMoving = true;
    document.getElementById('fp-nav-arrows')?.classList.add('hidden');
    document.getElementById('fp-hotspots')?.classList.add('hidden');

    const callText = fpElevatorLabel('elevator.ride.call');
    const ctaText = fpElevatorLabel('elevator.ride.cta');
    const hintText = fpElevatorLabel('elevator.ride.hint');

    document.getElementById('fp-narrative').textContent = callText;
    document.getElementById('fp-location').textContent = 'Лифт · 1 этаж';
    setElevatorHint(hintText);
    setElevatorHudMode(true, 'waiting');
    renderElevatorHudAction(ctaText, () => startRide());

    if (overlay && cabin) {
        overlay.classList.remove('hidden', 'fp-elevator-fadeout', 'fp-elevator-doors-closed');
        overlay.classList.add('fp-elevator-waiting');
        overlay.setAttribute('aria-hidden', 'false');
        cabin.classList.remove('fp-elevator-riding', 'fp-elevator-doors-closed');
    }
    if (floorEl) floorEl.textContent = '1';
    if (statusEl) statusEl.textContent = callText;
    if (skipEl) skipEl.textContent = '';
    if (ctaBtn) ctaBtn.classList.add('hidden');
    if (callBtn) {
        callBtn.disabled = false;
        callBtn.classList.remove('fp-elevator-btn--lit');
    }

    unlockOfficeAudio();

    let started = false;
    function startRide() {
        if (started) return;
        started = true;
        detachElevatorCallHandlers();
        clearElevatorHudAction();
        setElevatorHudMode(true, 'riding');
        if (callBtn) {
            callBtn.classList.add('fp-elevator-btn--lit');
            callBtn.disabled = true;
        }
        OfficeAudio?.playElevatorButtonPress?.();
        if (statusEl) statusEl.textContent = fpElevatorLabel('elevator.ride.departing');
        document.getElementById('fp-narrative').textContent = fpElevatorLabel('elevator.ride.departing');
        setTimeout(() => playElevatorRide(onDone), 420);
    }

    const onBtn = (e) => {
        e.preventDefault();
        e.stopPropagation();
        startRide();
    };
    const onOverlay = (e) => {
        if (e.target.closest('.fp-elevator-btn--call') || e.target.closest('#fp-elevator-cta')) return;
        e.stopPropagation();
    };
    const onKey = (e) => {
        if (e.key === '3' || e.key === 'Enter') {
            e.preventDefault();
            startRide();
        }
    };

    callBtn?.addEventListener('click', onBtn);
    overlay?.addEventListener('click', onOverlay);
    document.addEventListener('keydown', onKey);
    elevatorCallHandler = { overlay, btn: callBtn, cta: ctaBtn, onBtn, onCta: onBtn, onOverlay, onKey, startRide };
}

function finishElevatorOverlay(onDone) {
    const overlay = document.getElementById('fp-elevator-ride');
    const cabin = document.getElementById('fp-elevator-cabin');
    elevatorRideTimers.forEach(id => clearTimeout(id));
    elevatorRideTimers = [];
    elevatorExitPhaseActive = false;
    detachElevatorExitHandlers();
    OfficeAudio?.stopElevatorRideHum?.();
    cabin?.classList.remove('fp-elevator-riding', 'fp-elevator-doors-closed');
    overlay?.classList.add('fp-elevator-fadeout');
    overlay?.classList.remove('fp-elevator-exit');
    setTimeout(() => {
        overlay?.classList.add('hidden');
        overlay?.classList.remove('fp-elevator-fadeout', 'fp-elevator-doors-closed', 'fp-elevator-waiting', 'fp-elevator-exit');
        overlay?.setAttribute('aria-hidden', 'true');
        restoreElevatorUiHint();
        fpMoving = false;
        elevatorRideCleanup = null;
        onDone?.();
    }, 420);
}

/** Двери открыты — ждём, пока игрок выйдет */
function showElevatorExitPhase(onDone) {
    if (elevatorExitPhaseActive) return;
    elevatorExitPhaseActive = true;

    const overlay = document.getElementById('fp-elevator-ride');
    const cabin = document.getElementById('fp-elevator-cabin');
    const floorEl = document.getElementById('fp-elevator-floor');
    const statusEl = document.getElementById('fp-elevator-status');
    const skipEl = document.getElementById('fp-elevator-skip');
    const exitView = document.getElementById('fp-elevator-exit-view');
    const portal = document.getElementById('fp-elevator-exit-portal');
    const narrEl = document.getElementById('fp-narrative');
    const locEl = document.getElementById('fp-location');

    detachElevatorCallHandlers();
    if (elevatorRideCleanup?.onSkip) {
        overlay?.removeEventListener('click', elevatorRideCleanup.onSkip);
        document.removeEventListener('keydown', elevatorRideCleanup.onKeySkip);
    }
    elevatorRideCleanup = null;

    if (floorEl) floorEl.textContent = '3';
    overlay?.classList.remove('fp-elevator-waiting', 'fp-elevator-doors-closed');
    cabin?.classList.remove('fp-elevator-riding', 'fp-elevator-doors-closed');
    overlay?.classList.add('fp-elevator-exit');
    exitView?.setAttribute('aria-hidden', 'false');

    const exitText = fpElevatorLabel('elevator.ride.exit');
    const exitCta = fpElevatorLabel('elevator.ride.exitCta');
    const exitHint = fpElevatorLabel('elevator.ride.exitHint');
    const portalLabel = exitCta.replace(/^↓\s*/, '');

    if (narrEl) narrEl.textContent = exitText;
    if (locEl) locEl.textContent = 'Лифт · 3 этаж';
    if (statusEl) statusEl.textContent = exitText;
    if (skipEl) skipEl.textContent = '';
    if (portal) {
        const labelEl = portal.querySelector('.fp-elevator-exit-portal-label');
        if (labelEl) labelEl.textContent = portalLabel;
    }

    setElevatorHudMode(true, 'exit');
    setElevatorHint(exitHint);
    renderElevatorHudAction(exitCta, () => leaveElevator());

    let left = false;
    function leaveElevator() {
        if (left) return;
        left = true;
        finishElevatorOverlay(onDone);
    }

    const onPortal = (e) => {
        e.preventDefault();
        e.stopPropagation();
        OfficeAudio?.playElevatorDoorsOpen?.();
        leaveElevator();
    };
    const onOverlayExit = (e) => {
        if (!e.target.closest('.fp-elevator-exit-portal') && !e.target.closest('.fp-elevator-exit-view')) return;
        if (e.target.closest('.fp-elevator-exit-portal')) return;
        if (e.target.closest('.fp-elevator-exit-blur')) onPortal(e);
    };
    const onKey = (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            leaveElevator();
        }
    };

    portal?.addEventListener('click', onPortal);
    exitView?.addEventListener('click', onPortal);
    document.addEventListener('keydown', onKey);
    elevatorExitHandler = { overlay, portal, onPortal, onOverlay: onOverlayExit, onKey };
    elevatorRideCleanup = leaveElevator;
}

/** Анимация после нажатия: двери → 1→2→3 → открытие → выход */
function playElevatorRide(onDone) {

    const overlay = document.getElementById('fp-elevator-ride');
    const cabin = document.getElementById('fp-elevator-cabin');
    const floorEl = document.getElementById('fp-elevator-floor');
    const statusEl = document.getElementById('fp-elevator-status');
    const skipEl = document.getElementById('fp-elevator-skip');
    const narrEl = document.getElementById('fp-narrative');
    const locEl = document.getElementById('fp-location');

    fpMoving = true;
    document.getElementById('fp-nav-arrows')?.classList.add('hidden');
    document.getElementById('fp-hotspots')?.classList.add('hidden');
    setElevatorHudMode(true, 'riding');
    clearElevatorHudAction();

    const closingText = fpElevatorLabel('elevator.ride.closing');
    const goingText = fpElevatorLabel('elevator.ride.going');
    const arrivedText = fpElevatorLabel('elevator.ride.arrived');
    const skipText = fpElevatorLabel('elevator.ride.skip');

    if (narrEl) narrEl.textContent = closingText;
    if (locEl) locEl.textContent = 'Лифт · едем на 3 этаж';
    setElevatorHint(skipText);

    const timers = [];
    elevatorRideTimers = timers;
    let exitStarted = false;

    const setFloor = (n) => {
        if (!floorEl) return;
        floorEl.textContent = String(n);
        floorEl.classList.remove('fp-floor-tick');
        void floorEl.offsetWidth;
        floorEl.classList.add('fp-floor-tick');
        OfficeAudio?.playElevatorFloorDing?.(n);
    };

    const jumpToExit = () => {
        if (exitStarted) return;
        exitStarted = true;
        timers.forEach(id => clearTimeout(id));
        overlay?.removeEventListener('click', onSkip);
        document.removeEventListener('keydown', onKeySkip);
        OfficeAudio?.stopElevatorRideHum?.();
        if (floorEl) floorEl.textContent = '3';
        overlay?.classList.remove('fp-elevator-doors-closed');
        cabin?.classList.remove('fp-elevator-riding', 'fp-elevator-doors-closed');
        OfficeAudio?.playElevatorDoorsOpen?.();
        showElevatorExitPhase(onDone);
    };

    const onSkip = () => jumpToExit();
    const onKeySkip = (e) => {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') {
            e.preventDefault();
            jumpToExit();
        }
    };

    elevatorRideCleanup = { onSkip, onKeySkip, abort: jumpToExit };

    if (overlay) {
        overlay.classList.remove('fp-elevator-waiting');
        overlay.addEventListener('click', onSkip);
    }
    document.addEventListener('keydown', onKeySkip);
    if (skipEl) skipEl.textContent = skipText;
    if (floorEl) floorEl.textContent = '1';
    if (statusEl) statusEl.textContent = closingText;

    timers.push(setTimeout(() => {
        overlay?.classList.add('fp-elevator-doors-closed');
        cabin?.classList.add('fp-elevator-doors-closed');
        OfficeAudio?.playElevatorDoorsClose?.();
        if (statusEl) statusEl.textContent = goingText;
        if (narrEl) narrEl.textContent = goingText;
    }, 500));

    timers.push(setTimeout(() => {
        cabin?.classList.add('fp-elevator-riding');
        OfficeAudio?.playElevatorRideHum?.();
    }, 1300));

    timers.push(setTimeout(() => setFloor(2), 2100));

    timers.push(setTimeout(() => {
        setFloor(3);
        cabin?.classList.remove('fp-elevator-riding');
        OfficeAudio?.stopElevatorRideHum?.();
    }, 3200));

    timers.push(setTimeout(() => {
        overlay?.classList.remove('fp-elevator-doors-closed');
        cabin?.classList.remove('fp-elevator-doors-closed');
        OfficeAudio?.playElevatorDoorsOpen?.();
        if (statusEl) statusEl.textContent = arrivedText;
        if (narrEl) narrEl.textContent = arrivedText;
    }, 3800));

    timers.push(setTimeout(() => showElevatorExitPhase(onDone), 4700));
}

function startOfficeRoom() {
    fpRoom = 'elevator';
    fpRoomActions = [];
    fpArrivalType = 'ON_TIME';
    fpWakeArrival = false;
    fpWalkExtraMinutes = 0;
    fpDoneHotspots.clear();
    resetFpWorld();
    bindOfficeAudioUi();

    hideAllScreens();
    document.getElementById('arrival-screen').classList.remove('hidden');
    document.getElementById('wake-screen').classList.add('hidden');

    const day = workspace?.player?.day || 1;
    morningCommuteScenario = ensureMorningCommute();
    fpGameTime = morningCommuteScenario?.elevatorTime || '08:55';
    arrivalSecondsLeft = day === 1 ? ARRIVAL_BUDGET_SEC.day1 : ARRIVAL_BUDGET_SEC.default;
    const maxSec = arrivalSecondsLeft;
    let arrivalWarned = false;

    stopArrivalTimer();
    document.getElementById('arrival-timer-bar').style.width = '100%';

    arrivalTimerId = setInterval(() => {
        if (document.body.classList.contains('tutorial-active')) return;
        const inspectOpen = document.getElementById('fp-inspect-overlay')
            && !document.getElementById('fp-inspect-overlay').classList.contains('hidden');
        if (inspectOpen) return;

        arrivalSecondsLeft -= 0.1;
        document.getElementById('arrival-timer-bar').style.width =
            Math.max(0, (arrivalSecondsLeft / maxSec) * 100) + '%';

        if (!arrivalWarned && arrivalSecondsLeft <= maxSec * 0.25) {
            arrivalWarned = true;
            const narr = document.getElementById('fp-narrative');
            if (narr) {
                narr.textContent = typeof t === 'function'
                    ? t('arrival.timerWarning')
                    : '⏰ Мало времени! Дойдите до стола и включите DevOS до начала дня.';
            }
        }

        if (arrivalSecondsLeft <= 0) {
            stopArrivalTimer();
            showWakeScene();
        }
    }, 100);

    showElevatorCallPanel(() => {
        enterRoom('elevator', true);
        const narr = document.getElementById('fp-narrative');
        if (narr && morningCommuteScenario?.headline) {
            narr.textContent = morningCommuteScenario.headline;
        }
        Tutorial?.maybeStartOfficeTutorial();
    });
}

function enterRoom(roomId, instant) {
    const room = FP_ROOMS[roomId];
    if (!room) return;

    fpRoom = roomId;
    if (room.time) {
        fpGameTime = laterFpTime(fpGameTime, room.time);
    }

    const scene = document.getElementById('fp-scene');
    if (scene) scene.dataset.room = roomId;
    updateSceneImage(roomId);

    document.getElementById('fp-time').textContent = fpGameTime;
    document.getElementById('fp-location').textContent = room.name;
    document.getElementById('fp-narrative').textContent = room.intro || '';

    renderHotspots(room);
    renderNavArrows(room);
    renderMinimap(roomId);
    updateFpBackButton();

    if (instant) {
        const stage = document.getElementById('fp-stage');
        stage?.classList.add('vn-enter');
        requestAnimationFrame(() => stage?.classList.remove('vn-enter'));
    }
}

function getBackRoomId() {
    return FP_ROOMS[fpRoom]?.exits?.back || null;
}

function stepBack() {
    if (fpMoving) return;
    unlockOfficeAudio();
    const target = getBackRoomId();
    if (target) travelTo(target, 'back');
}

function updateFpBackButton() {
    const btn = document.getElementById('fp-back-btn');
    if (!btn) return;
    const canBack = !!getBackRoomId();
    btn.classList.toggle('hidden', !canBack);
    btn.disabled = fpMoving;
}

function renderNavArrows(room) {
    const el = document.getElementById('fp-nav-arrows');
    if (!el) return;
    el.innerHTML = '';
    el.classList.toggle('hidden', fpMoving);

    Object.entries(room.exits || {}).forEach(([dir, targetId]) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `vn-arrow vn-arrow-${dir}`;
        btn.innerHTML =
            `<span class="vn-arrow-icon">${VN_ARROW_ICONS[dir] || '•'}</span>`
            + `<span class="vn-arrow-label">${room.exitLabels?.[dir] || EXIT_DEST_LABELS[targetId] || VN_ARROW_LABELS[dir] || dir}</span>`;
        btn.onclick = () => {
            unlockOfficeAudio();
            OfficeAudio?.playUi?.('arrow');
            travelTo(targetId, dir);
        };
        el.appendChild(btn);
    });
}

function renderHotspots(room) {
    const layer = document.getElementById('fp-hotspots');
    if (!layer) return;
    layer.innerHTML = '';

    (room.hotspots || []).forEach(sp => {
        const btn = document.createElement('button');
        btn.type = 'button';
        const doneKey = `${fpRoom}:${sp.id}`;
        const done = fpDoneHotspots.has(doneKey);
        btn.className = 'fp-hotspot'
            + (sp.type === 'action' ? ' fp-hotspot-action' : '')
            + (sp.type === 'sit' ? ' fp-hotspot-sit' : '')
            + (sp.type === 'boot' ? ' fp-hotspot-boot' : '')
            + (done ? ' fp-hotspot-done' : '');
        btn.style.left = sp.x + '%';
        btn.style.top = sp.y + '%';
        btn.dataset.label = sp.label;
        btn.dataset.hotspotId = sp.id;
        btn.setAttribute('aria-label', sp.label);
        btn.disabled = done;
        btn.onclick = () => onHotspot(sp);
        layer.appendChild(btn);
    });
}

function renderMinimap(currentId) {
    const el = document.getElementById('fp-minimap');
    if (!el) return;
    const activeId = currentId;
    el.innerHTML = '';
    FP_MAP_ORDER.forEach((id, i) => {
        const r = FP_ROOMS[id];
        if (!r) return;
        const cls = id === activeId ? 'active' : (isRoomReachable(id) ? 'visited' : '');
        const short = { elevator: 'Л', entrance: 'В', kitchen: 'К', openspace: 'O', desk_row: 'Р', seated: 'С' }[id] || '?';
        const curIdx = FP_MAP_ORDER.indexOf(activeId);
        const canJump = i < curIdx && id !== activeId;

        if (i > 0) {
            const line = document.createElement('span');
            line.className = 'fp-map-line';
            el.appendChild(line);
        }

        const node = document.createElement('button');
        node.type = 'button';
        node.className = 'fp-map-node ' + cls + (canJump ? ' fp-map-jump' : '');
        node.title = canJump ? `Вернуться: ${r.name}` : r.name;
        node.textContent = short;
        node.disabled = !canJump && id !== activeId;
        if (canJump) node.onclick = () => {
            unlockOfficeAudio();
            OfficeAudio?.playUi?.('map');
            travelTo(id, 'back');
        };
        el.appendChild(node);
    });
}

function isRoomReachable(id) {
    const idx = FP_MAP_ORDER.indexOf(id);
    const cur = FP_MAP_ORDER.indexOf(fpRoom);
    return idx >= 0 && cur >= 0 && idx <= cur;
}

function hideInspectVisual() {
    document.getElementById('fp-inspect-overlay')?.classList.add('hidden');
    if (!fpMoving) {
        document.getElementById('fp-hotspots')?.classList.remove('hidden');
    }
}

function escFp(text) {
    if (typeof escapeHtml === 'function') return escapeHtml(text || '');
    return String(text || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function showInspectVisual(sp) {
    const overlay = document.getElementById('fp-inspect-overlay');
    const img = document.getElementById('fp-inspect-img');
    const caption = document.getElementById('fp-inspect-caption');
    if (!overlay || !img || !caption) return;

    document.getElementById('fp-hotspots')?.classList.add('hidden');

    const asset = sp.visual.includes('/') ? sp.visual : `/img/office/${sp.visual}.svg`;
    const cacheBust = asset.includes('sprint-board') ? '?v=2' : '?v=1';
    img.style.display = '';
    img.alt = sp.label || '';
    img.onerror = () => {
        img.style.display = 'none';
    };
    img.onload = () => {
        img.style.display = '';
    };
    img.src = asset + cacheBust;

    if (sp.text && sp.text !== sp.label) {
        caption.innerHTML =
            `<strong>${escFp(sp.label)}</strong><span class="fp-inspect-desc">${escFp(sp.text)}</span>`;
    } else {
        caption.textContent = sp.label || '';
    }
    overlay.classList.remove('hidden');
}

function bindInspectOverlay() {
    document.getElementById('fp-inspect-backdrop')?.addEventListener('click', hideInspectVisual);
}

function onHotspot(sp) {
    if (fpMoving) return;
    unlockOfficeAudio();

    if (sp.type === 'boot') {
        OfficeAudio?.playInteract?.('boot', 'power');
        document.getElementById('fp-narrative').textContent = 'DevOS загружается…';
        document.getElementById('fp-hotspots').innerHTML = '';
        document.getElementById('fp-nav-arrows').innerHTML = '';
        updateFpBackButton();
        document.getElementById('fp-scene')?.classList.add('fp-monitor-on');
        updateSceneImage('seated');
        document.getElementById('fp-choices').innerHTML =
            '<div class="fp-boot-bar"><div id="fp-boot-fill"></div></div>';
        runBootSequence();
        return;
    }

    if (sp.type === 'action') {
        const doneKey = `${fpRoom}:${sp.id}`;
        if (fpDoneHotspots.has(doneKey)) {
            document.getElementById('fp-narrative').textContent = `Уже сделано. Сейчас ${fpGameTime}.`;
            return;
        }

        OfficeAudio?.playInteract?.('action', sp.action || sp.id);
        const before = fpGameTime;
        const minutes = sp.timeMinutes ?? FP_ACTION_MINUTES[sp.action] ?? 1;
        const after = advanceFpGameTime(minutes);

        if (sp.action) fpRoomActions.push(sp.action);
        if (sp.action === 'kitchen_chat') fpWalkExtraMinutes += 12;
        if (sp.arrival) fpArrivalType = sp.arrival;

        fpDoneHotspots.add(doneKey);
        const layer = document.getElementById('fp-hotspots');
        layer?.querySelectorAll('.fp-hotspot').forEach(btn => {
            if (btn.dataset.hotspotId === sp.id) {
                btn.disabled = true;
                btn.classList.add('fp-hotspot-done');
            }
        });

        const narrative = fpActionNarrative(sp.action, before, after, minutes);
        document.getElementById('fp-narrative').textContent = narrative;
        if (typeof showToast === 'function') {
            showToast(`Игровое время: ${before} → ${after}`);
        }
        return;
    }

    if (sp.type === 'phone') {
        OfficeAudio?.playInteract?.('inspect', sp.id);
        if (sp.text) {
            document.getElementById('fp-narrative').textContent = sp.text;
        }
        if (typeof PhoneApp !== 'undefined') {
            PhoneApp.open({ duringOfficeWalk: true, screen: 'messages' });
        }
        return;
    }

    if (sp.type === 'inspect') {
        OfficeAudio?.playInteract?.('inspect', sp.id);
        if (sp.text) {
            document.getElementById('fp-narrative').textContent = sp.text;
        }
        if (sp.visual) {
            showInspectVisual(sp);
        }
        return;
    }
}

function runBootSequence() {
    const fill = document.getElementById('fp-boot-fill');
    if (fill) fill.style.width = '0%';
    let p = 0;
    const bootTimer = setInterval(() => {
        p += 4;
        if (fill) fill.style.width = p + '%';
        if (p >= 100) {
            clearInterval(bootTimer);
            finishOfficeRoom();
        }
    }, 60);
}

async function finishOfficeRoom() {
    stopArrivalTimer();

    await delay(300);

    const body = { roomActions: fpRoomActions.length ? fpRoomActions : undefined };
    const wasWakeArrival = fpWakeArrival;
    if (fpWakeArrival && (fpArrivalType === 'OVERSLEPT' || fpArrivalType === 'LATE')) {
        body.type = fpArrivalType;
    } else {
        body.commuteMinutesLate = Math.max(0,
            (morningCommuteScenario?.minutesLate || 0) + fpWalkExtraMinutes);
        if (morningCommuteScenario?.text) body.excuse = morningCommuteScenario.text;
    }
    fpWakeArrival = false;

    const resp = await api('/desk/arrive', {
        method: 'POST',
        body: JSON.stringify(body)
    });
    ws(resp);

    hideAllScreens();
    document.getElementById('game-screen').classList.remove('hidden');
    resetFpWorld();
    OfficeAudio?.stop?.();
    document.getElementById('fp-choices').innerHTML = '';
    lockDevOs();
    startRealClock();
    renderAll({ refreshApps: 'all', refreshPhone: true });
    Tutorial?.maybeStartDesktopTutorial();

    scheduleDeskStartup(() => {
        startMessageDrip();
        pushNotification('🖥 DevOS', t('notify.devos.title'), t('notify.devos.body'), 'slack');

        if (wasWakeArrival || (workspace?.lateMinutes || 0) > 30) {
            pendingLateReply = true;
            pushNotification('📱 SMS', 'Анна С.', t('notify.late.sms'), 'danger', () => openAppWindow('slack'));
        }

        if (workspace?.pendingMeeting && fpArrivalType === 'ON_TIME') {
            scheduleMeetingIfPending();
        } else if (workspace?.meetingMissedToday) {
            pushNotification('📹 Meet', 'Daily', t('notify.meeting.missed'), 'warning');
        }
    });

    fpRoomActions = [];
}

let preludeSkipHandler = null;
let preludeKeyHandler = null;
let preludeMouseDownHandler = null;
let preludeTimer = null;
const PRELUDE_SLIDE_MS = 15000;

function preludeLabel(key, vars = {}) {
    if (typeof t === 'function') return t(key, vars);
    return key;
}

function formatPreludeDate() {
    const lang = typeof getLang === 'function' && getLang() === 'en' ? 'en-US' : 'ru-RU';
    return new Date().toLocaleDateString(lang, { weekday: 'long', day: 'numeric', month: 'long' });
}

function minutesUntil(timeStr, targetHour = 9, targetMin = 0) {
    const [h, m] = timeStr.split(':').map(Number);
    return Math.max(1, (targetHour * 60 + targetMin) - (h * 60 + m));
}

function buildPreludeSlides() {
    const company = workspace?.projectCompany || 'компании';
    const day = workspace?.player?.day || 1;
    const channel = workspace?.slackChannel || '#team';
    const sc = ensureMorningCommute();

    if (day === 1) {
        const wake = sc?.wakeTime || '07:08';
        const leave = sc?.leaveTime || '08:22';
        const elev = sc?.elevatorTime || '08:52';
        return [
            {
                time: wake,
                line1: preludeLabel('prelude.day1.wake', { company }),
                line2: preludeLabel('prelude.day1.line1'),
                status: preludeLabel('prelude.day1.status', { status: preludeLabel('prelude.status.wake') })
            },
            {
                time: leave,
                line1: sc?.text || preludeLabel('prelude.day1.commute', { min: 18 }),
                line2: sc?.headline || preludeLabel('prelude.day1.line2', { min: minutesUntil('08:22') }),
                status: preludeLabel('prelude.day1.status', { status: preludeLabel('prelude.status.commute') })
            },
            {
                time: elev,
                line1: preludeLabel('prelude.day1.arrive'),
                line2: sc?.minutesLate > 10
                    ? `Лифт · опоздание +${sc.minutesLate} мин`
                    : preludeLabel('prelude.day1.line2', { min: minutesUntil(elev) }),
                status: channel + ' · ' + preludeLabel('prelude.day1.status', { status: preludeLabel('prelude.status.arrive') })
            }
        ];
    }

    const time = sc?.elevatorTime || `08:${String(40 + (day % 15)).padStart(2, '0')}`;
    return [{
        time,
        line1: preludeLabel('prelude.later.line1', { day, company }),
        line2: sc?.headline || preludeLabel('prelude.later.line2', { min: minutesUntil(time) }),
        status: preludeLabel('prelude.later.status')
    }];
}

function stopPrelude() {
    if (preludeTimer) {
        clearTimeout(preludeTimer);
        preludeTimer = null;
    }
    if (preludeSkipHandler) {
        document.getElementById('prelude-screen')?.removeEventListener('click', preludeSkipHandler);
        preludeSkipHandler = null;
    }
    if (preludeKeyHandler) {
        document.removeEventListener('keydown', preludeKeyHandler);
        preludeKeyHandler = null;
    }
    if (preludeMouseDownHandler) {
        document.getElementById('prelude-screen')?.removeEventListener('mousedown', preludeMouseDownHandler);
        preludeMouseDownHandler = null;
    }
}

function renderPreludeSlide(slide, animate) {
    const screen = document.getElementById('prelude-screen');
    const inner = screen?.querySelector('.prelude-inner');
    const dateEl = document.getElementById('prelude-date');
    const timeEl = document.getElementById('prelude-time');
    const line1 = document.getElementById('prelude-line1');
    const line2 = document.getElementById('prelude-line2');
    const status = document.getElementById('prelude-status');
    if (!screen || !timeEl) return;

    if (animate && inner) {
        inner.classList.remove('prelude-animate');
        void inner.offsetWidth;
        inner.classList.add('prelude-animate');
    }
    if (dateEl) dateEl.textContent = formatPreludeDate();
    timeEl.textContent = slide.time;
    if (line1) line1.textContent = slide.line1 || '';
    if (line2) line2.textContent = slide.line2 || '';
    if (status) status.textContent = slide.status || '';
}

function runPrelude(onDone) {
    stopPrelude();
    const slides = buildPreludeSlides();
    let index = 0;

    hideAllScreens();
    document.getElementById('prelude-screen')?.classList.remove('hidden');
    renderPreludeSlide(slides[0], false);

    const finish = () => {
        stopPrelude();
        document.getElementById('prelude-screen')?.classList.add('hidden');
        onDone?.();
    };

    const scheduleAutoAdvance = () => {
        if (preludeTimer) clearTimeout(preludeTimer);
        preludeTimer = setTimeout(advance, PRELUDE_SLIDE_MS);
    };

    const advance = () => {
        index += 1;
        if (index >= slides.length) {
            finish();
            return;
        }
        renderPreludeSlide(slides[index], true);
        scheduleAutoAdvance();
    };

    scheduleAutoAdvance();

    const screen = document.getElementById('prelude-screen');
    preludeMouseDownHandler = e => {
        e.preventDefault();
        if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    };
    preludeSkipHandler = () => advance();
    preludeKeyHandler = e => {
        if (e.key === 'Escape') {
            e.preventDefault();
            finish();
            return;
        }
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            advance();
        }
    };
    screen?.addEventListener('mousedown', preludeMouseDownHandler);
    screen?.addEventListener('click', preludeSkipHandler);
    document.addEventListener('keydown', preludeKeyHandler);
}

function ensureMorningCommute() {
    const day = workspace?.player?.day || 1;
    if (!morningCommuteScenario && typeof MorningCommute !== 'undefined') {
        morningCommuteScenario = MorningCommute.roll(day);
    }
    return morningCommuteScenario;
}

function showArrivalScene(options = {}) {
    ensureMorningCommute();
    if (options.prelude) {
        runPrelude(startOfficeRoom);
    } else {
        startOfficeRoom();
    }
}

/** Вернуться в офис с рабочего стола (продолжение дня, не с лифта). */
function resumeOfficeFromDesk() {
    fpMoving = false;
    fpRoomActions = [];
    fpDoneHotspots.clear();
    if (workspace?.timeLabel) {
        const m = String(workspace.timeLabel).match(/\d{1,2}:\d{2}/);
        if (m) fpGameTime = m[0];
    }
    const stage = document.getElementById('fp-stage');
    const scene = document.getElementById('fp-scene');
    if (scene) {
        scene.classList.remove('fp-monitor-on');
        scene.dataset.room = 'seated';
    }
    stage?.classList.remove('vn-zoom-out', 'vn-enter');
    stage?.style.removeProperty('transform-origin');

    hideAllScreens();
    document.getElementById('arrival-screen').classList.remove('hidden');
    document.getElementById('fp-choices').innerHTML = '';
    document.getElementById('fp-narrative').textContent = FP_ROOMS.seated.intro || '';

    bindOfficeAudioUi();
    unlockOfficeAudio();
    enterRoom('seated', true);
}

async function enterDeskFromWake(arrivalType) {
    stopArrivalTimer();
    fpArrivalType = arrivalType;
    fpWakeArrival = true;
    fpRoomActions = [];

    hideAllScreens();
    document.getElementById('arrival-screen').classList.remove('hidden');

    enterRoom('seated', true);
    document.getElementById('fp-time').textContent = arrivalType === 'OVERSLEPT' ? '11:47' : '10:15';
    document.getElementById('fp-location').textContent = 'За компьютером';
    document.getElementById('fp-narrative').textContent =
        arrivalType === 'OVERSLEPT'
            ? 'Вы еле добрались до стола. Нажмите на экран — включить компьютер.'
            : 'Вы добежали до стола. Нажмите на экран — включить компьютер.';
}

document.addEventListener('keydown', e => {
    if (document.getElementById('arrival-screen')?.classList.contains('hidden')) return;
    if (!document.getElementById('fp-inspect-overlay')?.classList.contains('hidden') && e.key === 'Escape') {
        e.preventDefault();
        hideInspectVisual();
        return;
    }
    if (Tutorial?.isActive?.()) return;
    if (document.getElementById('fp-choices')?.querySelector('#fp-boot-fill')) return;

    if (e.key === 'Backspace' || e.key === 'Escape') {
        e.preventDefault();
        stepBack();
        return;
    }

    const room = FP_ROOMS[fpRoom];
    if (!room?.exits) return;
    const map = {
        ArrowUp: 'back', ArrowDown: 'forward', ArrowLeft: 'left', ArrowRight: 'right',
        w: 'forward', s: 'back', a: 'left', d: 'right'
    };
    const dir = map[e.key];
    if (dir && room.exits[dir]) {
        e.preventDefault();
        travelTo(room.exits[dir], dir);
    }
});

document.getElementById('fp-back-btn')?.addEventListener('click', () => stepBack());
bindInspectOverlay();
