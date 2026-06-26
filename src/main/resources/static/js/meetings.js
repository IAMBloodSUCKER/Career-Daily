/** Видеомитинги: напоминание как в Outlook + вход по клику */
let meetingActive = false;
let meetingLineIndex = 0;
let meetingTypingTimer = null;
let meetingShownIds = new Set();
let meetingReminderNotified = new Set();

const MEETING_TYPING_MS = 42;
const MEETING_LINE_PAUSE_MS = 1400;

function canShowMeetingReminder() {
    if (!workspace?.atDesk || !workspace?.pendingMeeting || meetingActive) return false;
    if (workspace.meetingMissedToday) return false;
    if (document.getElementById('arrival-screen') && !document.getElementById('arrival-screen').classList.contains('hidden')) {
        return false;
    }
    return true;
}

function updateMeetingReminder() {
    const bar = document.getElementById('meeting-reminder-bar');
    if (!bar) return;

    const meeting = workspace?.pendingMeeting;
    if (!canShowMeetingReminder()) {
        bar.classList.add('hidden');
        bar.innerHTML = '';
        return;
    }

    const statusLabel = typeof t === 'function' ? t('meeting.statusNow') : 'Идёт сейчас';
    const joinLabel = typeof t === 'function' ? t('meeting.join') : 'Присоединиться';

    bar.classList.remove('hidden');
    bar.innerHTML = `
        <div class="meeting-reminder-icon">📅</div>
        <div class="meeting-reminder-text">
            <strong>${meeting.title}</strong>
            <span class="meeting-reminder-status">${statusLabel}</span>
            <span class="meeting-reminder-meta">${meeting.subtitle || ''}</span>
        </div>
        <button type="button" class="meeting-reminder-join">${joinLabel}</button>`;
    bar.querySelector('.meeting-reminder-join').onclick = () => startMeeting(meeting);
}

function scheduleMeetingIfPending() {
    updateMeetingReminder();
    if (!workspace?.pendingMeeting || meetingActive || workspace.meetingMissedToday) return;
    if (!workspace?.atDesk) return;

    const id = workspace.pendingMeeting.id;
    if (meetingReminderNotified.has(id)) return;

    const notifyOnce = () => {
        if (!workspace?.pendingMeeting || workspace.pendingMeeting.id !== id) return;
        if (meetingReminderNotified.has(id)) return;
        meetingReminderNotified.add(id);

        const title = workspace.pendingMeeting.title;
        const body = typeof t === 'function'
            ? t('notify.meeting.joinHint')
            : 'Идёт сейчас — нажмите, чтобы присоединиться';
        pushNotification(
            '📅 Outlook',
            title,
            body,
            'outlook',
            () => startMeeting(workspace.pendingMeeting)
        );
        updateMeetingReminder();
    };

    if (typeof Tutorial !== 'undefined' && Tutorial.isActive?.()) {
        const waitId = setInterval(() => {
            if (!Tutorial.isActive?.()) {
                clearInterval(waitId);
                if (canShowMeetingReminder()) notifyOnce();
            }
        }, 800);
        return;
    }

    notifyOnce();
}

function startMeeting(meeting) {
    if (!meeting || meetingActive) return;
    meetingActive = true;
    meetingLineIndex = 0;
    window._meetingPlayerResponse = null;
    meetingShownIds.add(meeting.id);
    updateMeetingReminder();

    const overlay = document.getElementById('meeting-overlay');
    overlay.classList.remove('hidden');
    document.getElementById('meeting-title').textContent = meeting.title;
    document.getElementById('meeting-subtitle').textContent = meeting.subtitle || '';
    document.getElementById('meeting-options').innerHTML = '';
    document.getElementById('meeting-options').classList.add('hidden');
    document.getElementById('meeting-speech').textContent = '';
    document.getElementById('meeting-speaker-name').textContent = 'Подключение…';

    buildMeetingGrid(meeting);
    playMeetingLine(meeting, 0);
}

function buildMeetingGrid(meeting) {
    const grid = document.getElementById('meeting-grid');
    grid.innerHTML = '';

    const speakers = new Map();
    speakers.set('player', {
        id: 'player',
        name: workspace.player.name,
        avatar: '🧑‍💻',
        role: workspace.player.careerTitle
    });
    (workspace.contacts || []).forEach(c => {
        speakers.set(c.id, { id: c.id, name: c.name, avatar: c.avatar, role: c.role });
    });
    meeting.lines.forEach(line => {
        if (!speakers.has(line.speakerId)) {
            speakers.set(line.speakerId, {
                id: line.speakerId,
                name: line.speakerName,
                avatar: line.avatar,
                role: line.role
            });
        }
    });

    speakers.forEach(s => {
        const tile = document.createElement('div');
        tile.className = 'meeting-tile';
        tile.dataset.speakerId = s.id;
        tile.innerHTML = `
            <div class="meeting-avatar">${s.avatar}</div>
            <div class="meeting-tile-name">${s.name.split(' ')[0]}</div>
            <div class="meeting-tile-role">${s.role || ''}</div>
            <div class="meeting-mic">🎤</div>`;
        grid.appendChild(tile);
    });
}

function setActiveSpeaker(speakerId) {
    document.querySelectorAll('.meeting-tile').forEach(t => {
        t.classList.toggle('speaking', t.dataset.speakerId === speakerId);
    });
    const line = getSpeakerInfo(speakerId);
    document.getElementById('meeting-speaker-name').textContent = line?.name || '';
}

function getSpeakerInfo(speakerId) {
    if (speakerId === 'player') {
        return { name: workspace.player.name, avatar: '🧑‍💻' };
    }
    return workspace.contacts.find(c => c.id === speakerId);
}

function playMeetingLine(meeting, index) {
    if (meetingTypingTimer) {
        clearInterval(meetingTypingTimer);
        meetingTypingTimer = null;
    }

    if (index >= meeting.lines.length) {
        finishMeeting(meeting, null);
        return;
    }

    meetingLineIndex = index;
    const line = meeting.lines[index];
    setActiveSpeaker(line.speakerId);

    if (line.playerTurn) {
        showMeetingTyping('');
        showPlayerMeetingOptions(meeting, line, index);
        return;
    }

    document.getElementById('meeting-options').classList.add('hidden');
    typeMeetingText(line.text, () => {
        const pause = MEETING_LINE_PAUSE_MS + line.text.length * 14;
        setTimeout(() => playMeetingLine(meeting, index + 1), pause);
    });
}

function typeMeetingText(fullText, onDone) {
    const el = document.getElementById('meeting-speech');
    el.textContent = '';
    let i = 0;
    meetingTypingTimer = setInterval(() => {
        if (i >= fullText.length) {
            clearInterval(meetingTypingTimer);
            meetingTypingTimer = null;
            if (onDone) onDone();
            return;
        }
        el.textContent += fullText.charAt(i);
        i++;
    }, MEETING_TYPING_MS);
}

function showMeetingTyping(text) {
    document.getElementById('meeting-speech').textContent = text;
}

function showPlayerMeetingOptions(meeting, line, index) {
    const opts = document.getElementById('meeting-options');
    opts.innerHTML = '<p class="meeting-your-turn">🎤 Ваша очередь — выберите ответ:</p>';
    opts.classList.remove('hidden');
    showMeetingTyping('');

    line.options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'meeting-option-btn';
        btn.textContent = opt.text;
        btn.onclick = () => {
            opts.classList.add('hidden');
            typeMeetingText(opt.text, () => {
                setTimeout(() => playMeetingLine(meeting, index + 1), 1600);
            });
            window._meetingPlayerResponse = opt.id;
        };
        opts.appendChild(btn);
    });
}

async function finishMeeting(meeting, responseId) {
    if (!meeting) return;
    const respId = responseId || window._meetingPlayerResponse || null;
    window._meetingPlayerResponse = null;

    document.getElementById('meeting-speech').textContent = 'Митинг завершён. Отключение…';
    document.querySelectorAll('.meeting-tile').forEach(t => t.classList.remove('speaking'));

    await delay(2200);

    const resp = await api('/meeting/complete', {
        method: 'POST',
        body: JSON.stringify({ meetingId: meeting.id, responseId: respId })
    });
    ws(resp);

    document.getElementById('meeting-overlay').classList.add('hidden');
    meetingActive = false;
    updateMeetingReminder();

    if (workspace?.pendingMeeting) {
        setTimeout(() => scheduleMeetingIfPending(), 3000);
    }
}

function skipMeeting() {
    if (!meetingActive || !workspace?.pendingMeeting) return;
    finishMeeting(workspace.pendingMeeting, 'standup-late');
}
