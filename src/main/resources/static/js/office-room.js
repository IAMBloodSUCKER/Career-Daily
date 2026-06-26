/** Офис в формате визуальной новеллы: тап → приближение → новый кадр */
let fpRoom = 'elevator';
let fpRoomActions = [];
let fpArrivalType = 'ON_TIME';
let fpMoving = false;
let fpGameTime = '08:55';

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
    my_desk: 'Мой стол'
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
        intro: 'Лифт на 3-м этаже. Нажмите стрелку внизу — выйти в open-space. Daily через 5 минут.',
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
                text: 'Sprint 42 · JIRA-142 In Progress · Daily 09:00.' }
        ]
    },
    kitchen: {
        name: 'Кухня',
        time: '08:58',
        intro: 'Офисная кухня. Кофемашина, столики. Дверь назад — в зону отдыха у входа.',
        exits: { back: 'entrance', forward: 'openspace' },
        hotspots: [
            { id: 'coffee', x: 32, y: 55, label: 'Кофе', type: 'action', action: 'coffee',
                text: 'Americano. Бодрость +, но минута уже ушла.' },
            { id: 'kitchen-chat', x: 62, y: 58, label: 'Поболтать', type: 'action', action: 'kitchen_chat',
                text: 'Обсуждаете релиз. Daily уже начинается…', arrival: 'LATE' }
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
        exits: { back: 'openspace', forward: 'my_desk' },
        hotspots: [
            { id: 'sticker', x: 55, y: 50, label: 'JIRA-142', type: 'inspect',
                text: 'Жёлтый стикер: «JIRA-142 — fix NPE».' }
        ]
    },
    my_desk: {
        name: 'Ваш стол',
        time: '08:59',
        intro: 'Ваш рабочий стол. Нажмите на монитор — сесть за компьютер.',
        exits: { back: 'desk_row' },
        hotspots: [
            { id: 'monitor', x: 50, y: 45, label: 'Сесть за ПК', type: 'sit' },
            { id: 'phone', x: 72, y: 62, label: 'Телефон', type: 'inspect',
                text: 'Slack: «Daily через 1 мин». Мария: «JIRA-142 срочно 🙏».' },
            { id: 'bag', x: 28, y: 65, label: 'Вещи', type: 'action', action: 'slow',
                text: 'Расставили кружку. Daily уже начался — пара минут опоздания.', arrival: 'LATE' }
        ]
    },
    seated: {
        name: 'За компьютером',
        time: '09:00',
        intro: 'Монитор перед вами. Нажмите на экран — включить DevOS.',
        exits: { back: 'my_desk' },
        hotspots: [
            { id: 'power', x: 50, y: 48, label: 'Включить DevOS', type: 'boot' }
        ]
    }
};

const FP_MAP_ORDER = ['elevator', 'entrance', 'kitchen', 'openspace', 'desk_row', 'my_desk'];

const FP_SCENE_VER = 'v=3';
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
    if (officeAudioUnlocked) return;
    officeAudioUnlocked = true;
    OfficeAudio?.unlock?.().then(() => OfficeAudio?.playRoom?.(fpRoom));
}

function bindOfficeAudioUi() {
    const btn = document.getElementById('fp-audio-btn');
    if (!btn || btn.dataset.bound) return;
    btn.dataset.bound = '1';
    btn.addEventListener('click', e => {
        e.stopPropagation();
        unlockOfficeAudio();
        const muted = OfficeAudio.toggleMute();
        btn.classList.toggle('muted', muted);
        btn.textContent = muted ? '🔇' : '🔊';
        btn.title = muted ? 'Включить звук офиса' : 'Выключить звук офиса';
    });
}

function resetFpWorld() {
    fpMoving = false;
    fpRoom = 'elevator';
    const scene = document.getElementById('fp-scene');
    const stage = document.getElementById('fp-stage');
    if (scene) {
        scene.dataset.room = 'elevator';
        scene.classList.remove('fp-monitor-on');
    }
    updateSceneImage('elevator');
    stage?.classList.remove('vn-zoom-out', 'vn-enter');
    stage?.style.removeProperty('transform-origin');
    hideInspectVisual();
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
                enterRoom(roomId, false);
                stage?.classList.remove('vn-zoom-out');
                stage?.classList.add('vn-enter');
                curtain?.classList.remove('active');

                setTimeout(() => {
                    stage?.classList.remove('vn-enter');
                    arrows?.classList.remove('hidden');
                    hotspots?.classList.remove('hidden');
                    fpMoving = false;
                    updateFpBackButton();
                    resolve();
                }, 550);
            }, 160);
        }, 720);
    });
}

function travelTo(roomId, dir = 'forward') {
    return vnTransition(roomId, dir);
}

function startOfficeRoom() {
    fpRoom = 'elevator';
    fpRoomActions = [];
    fpArrivalType = 'ON_TIME';
    fpGameTime = '08:55';
    resetFpWorld();
    bindOfficeAudioUi();

    hideAllScreens();
    document.getElementById('arrival-screen').classList.remove('hidden');
    document.getElementById('wake-screen').classList.add('hidden');

    const day = workspace?.player?.day || 1;
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
                narr.textContent = '⏰ Скоро daily! Ускорьтесь — дойдите до стола и включите DevOS.';
            }
        }

        if (arrivalSecondsLeft <= 0) {
            stopArrivalTimer();
            showWakeScene();
        }
    }, 100);

    enterRoom('elevator', true);
    Tutorial?.maybeStartOfficeTutorial();
}

function enterRoom(roomId, instant) {
    const room = FP_ROOMS[roomId];
    if (!room) return;

    fpRoom = roomId;
    fpGameTime = room.time || fpGameTime;

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
    if (fpRoom === 'seated') {
        travelTo('my_desk', 'back');
        return;
    }
    const target = getBackRoomId();
    if (target) travelTo(target, 'back');
}

function updateFpBackButton() {
    const btn = document.getElementById('fp-back-btn');
    if (!btn) return;
    const canBack = !!getBackRoomId() || fpRoom === 'seated';
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
        btn.className = 'fp-hotspot'
            + (sp.type === 'action' ? ' fp-hotspot-action' : '')
            + (sp.type === 'sit' ? ' fp-hotspot-sit' : '')
            + (sp.type === 'boot' ? ' fp-hotspot-boot' : '');
        btn.style.left = sp.x + '%';
        btn.style.top = sp.y + '%';
        btn.dataset.label = sp.label;
        btn.setAttribute('aria-label', sp.label);
        btn.onclick = () => onHotspot(sp);
        layer.appendChild(btn);
    });
}

function renderMinimap(currentId) {
    const el = document.getElementById('fp-minimap');
    if (!el) return;
    const activeId = currentId === 'seated' ? 'my_desk' : currentId;
    el.innerHTML = '';
    FP_MAP_ORDER.forEach((id, i) => {
        const r = FP_ROOMS[id];
        if (!r) return;
        const cls = id === activeId ? 'active' : (isRoomReachable(id) ? 'visited' : '');
        const short = { elevator: 'Л', entrance: 'В', kitchen: 'К', openspace: 'O', desk_row: 'Р', my_desk: 'С' }[id] || '?';
        const curIdx = FP_MAP_ORDER.indexOf(activeId === 'seated' ? 'my_desk' : activeId);
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
    const cur = FP_MAP_ORDER.indexOf(fpRoom === 'seated' ? 'my_desk' : fpRoom);
    return idx >= 0 && cur >= 0 && idx <= cur;
}

function hideInspectVisual() {
    document.getElementById('fp-inspect-overlay')?.classList.add('hidden');
}

function showInspectVisual(sp) {
    const overlay = document.getElementById('fp-inspect-overlay');
    const img = document.getElementById('fp-inspect-img');
    const caption = document.getElementById('fp-inspect-caption');
    if (!overlay || !img || !caption) return;
    const asset = sp.visual.includes('/') ? sp.visual : `/img/office/${sp.visual}.svg`;
    img.src = asset + (asset.includes('?') ? '' : '?v=1');
    img.alt = sp.label || '';
    caption.textContent = sp.label || '';
    overlay.classList.remove('hidden');
}

function bindInspectOverlay() {
    document.getElementById('fp-inspect-backdrop')?.addEventListener('click', hideInspectVisual);
}

function onHotspot(sp) {
    if (fpMoving) return;
    unlockOfficeAudio();

    if (sp.type === 'sit') {
        travelTo('seated', 'sit');
        return;
    }

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
        OfficeAudio?.playInteract?.('action', sp.action || sp.id);
        if (sp.action) fpRoomActions.push(sp.action);
        if (sp.arrival) fpArrivalType = sp.arrival;
        if (sp.action === 'slow' && fpArrivalType === 'ON_TIME') fpArrivalType = 'LATE';
        if (sp.text) document.getElementById('fp-narrative').textContent = sp.text;
        return;
    }

    if (sp.type === 'inspect') {
        OfficeAudio?.playInteract?.('inspect', sp.id);
        if (sp.visual) {
            showInspectVisual(sp);
        }
        if (sp.text) {
            document.getElementById('fp-narrative').textContent = sp.text;
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

    OfficeAudio?.playBootReady?.();
    await delay(400);

    const body = { type: fpArrivalType };
    if (fpRoomActions.length) body.roomActions = fpRoomActions;

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
    Tutorial?.maybeStartDesktopTutorial();

    if (fpArrivalType !== 'ON_TIME') {
        pendingLateReply = true;
        pushNotification('📱 SMS', 'Анна С.', t('notify.late.sms'), 'danger', () => openAppWindow('slack'));
    }

    startMessageDrip();
    pushNotification('🖥 DevOS', t('notify.devos.title'), t('notify.devos.body'), 'slack');

    if (workspace?.pendingMeeting && fpArrivalType === 'ON_TIME') {
        scheduleMeetingIfPending();
    } else if (workspace?.meetingMissedToday) {
        pushNotification('📹 Meet', 'Daily', t('notify.meeting.missed'), 'warning');
    }

    fpRoomActions = [];
}

let preludeSkipHandler = null;
let preludeTimer = null;

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

    if (day === 1) {
        return [
            {
                time: '07:08',
                line1: preludeLabel('prelude.day1.wake', { company }),
                line2: preludeLabel('prelude.day1.line1'),
                status: preludeLabel('prelude.day1.status', { status: preludeLabel('prelude.status.wake') }),
                duration: 3200
            },
            {
                time: '08:22',
                line1: preludeLabel('prelude.day1.commute', { min: 18 }),
                line2: preludeLabel('prelude.day1.line2', { min: minutesUntil('08:22') }),
                status: preludeLabel('prelude.day1.status', { status: preludeLabel('prelude.status.commute') }),
                duration: 3200
            },
            {
                time: '08:52',
                line1: preludeLabel('prelude.day1.arrive'),
                line2: preludeLabel('prelude.day1.line2', { min: minutesUntil('08:52') }),
                status: channel + ' · ' + preludeLabel('prelude.day1.status', { status: preludeLabel('prelude.status.arrive') }),
                duration: 3400
            }
        ];
    }

    const time = `08:${String(40 + (day % 15)).padStart(2, '0')}`;
    return [{
        time,
        line1: preludeLabel('prelude.later.line1', { day, company }),
        line2: preludeLabel('prelude.later.line2', { min: minutesUntil(time) }),
        status: preludeLabel('prelude.later.status'),
        duration: 3600
    }];
}

function stopPrelude() {
    if (preludeTimer) {
        clearTimeout(preludeTimer);
        preludeTimer = null;
    }
    if (preludeSkipHandler) {
        document.removeEventListener('click', preludeSkipHandler);
        document.removeEventListener('keydown', preludeSkipHandler);
        preludeSkipHandler = null;
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

    const next = () => {
        index += 1;
        if (index >= slides.length) {
            finish();
            return;
        }
        renderPreludeSlide(slides[index], true);
        preludeTimer = setTimeout(next, slides[index].duration);
    };

    preludeTimer = setTimeout(next, slides[0].duration);

    preludeSkipHandler = e => {
        if (e.type === 'keydown' && e.key !== 'Enter' && e.key !== ' ' && e.key !== 'Escape') return;
        e.preventDefault();
        finish();
    };
    document.addEventListener('click', preludeSkipHandler);
    document.addEventListener('keydown', preludeSkipHandler);
}

function showArrivalScene(options = {}) {
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
    if (workspace?.timeLabel) {
        const m = String(workspace.timeLabel).match(/\d{1,2}:\d{2}/);
        if (m) fpGameTime = m[0];
    }
    const stage = document.getElementById('fp-stage');
    const scene = document.getElementById('fp-scene');
    if (scene) {
        scene.classList.remove('fp-monitor-on');
        scene.dataset.room = 'my_desk';
    }
    stage?.classList.remove('vn-zoom-out', 'vn-enter');
    stage?.style.removeProperty('transform-origin');

    hideAllScreens();
    document.getElementById('arrival-screen').classList.remove('hidden');
    document.getElementById('fp-choices').innerHTML = '';
    document.getElementById('fp-narrative').textContent = FP_ROOMS.my_desk.intro || '';

    bindOfficeAudioUi();
    unlockOfficeAudio();
    enterRoom('my_desk', true);
}

async function enterDeskFromWake(arrivalType) {
    stopArrivalTimer();
    fpArrivalType = arrivalType;
    fpRoomActions = [];

    hideAllScreens();
    document.getElementById('arrival-screen').classList.remove('hidden');

    const scene = document.getElementById('fp-scene');
    scene.dataset.room = 'seated';
    scene.classList.add('fp-monitor-on');
    updateSceneImage('seated');

    document.getElementById('fp-time').textContent = arrivalType === 'OVERSLEPT' ? '11:47' : '10:15';
    document.getElementById('fp-location').textContent = 'Рабочий стол';
    document.getElementById('fp-narrative').textContent =
        arrivalType === 'OVERSLEPT'
            ? 'Вы еле добрались до стола. Включаете компьютер…'
            : 'Вы добежали до стола. Включаете компьютер…';
    document.getElementById('fp-hotspots').innerHTML = '';
    document.getElementById('fp-nav-arrows').innerHTML = '';
    document.getElementById('fp-choices').innerHTML =
        '<div class="fp-boot-bar"><div id="fp-boot-fill"></div></div>';

    runBootSequence();
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
