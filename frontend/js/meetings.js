/** Видеомитинги: напоминание как в Outlook + вход по клику */
let meetingActive = false;
let meetingLineIndex = 0;
let meetingTypingTimer = null;
let meetingShownIds = new Set();
let meetingReminderNotified = new Set();
let lastStandupStatePollMs = 0;

let meetingVoiceFallbackTimer = null;

function clearMeetingVoiceFallback() {
    if (meetingVoiceFallbackTimer) {
        clearTimeout(meetingVoiceFallbackTimer);
        meetingVoiceFallbackTimer = null;
    }
}

function scheduleMeetingVoiceFallback(onDone, text) {
    clearMeetingVoiceFallback();
    const len = (text || '').length;
    const ms = Math.min(14000, Math.max(3500, 1800 + len * 38));
    meetingVoiceFallbackTimer = setTimeout(() => {
        meetingVoiceFallbackTimer = null;
        onDone();
    }, ms);
}
const MEETING_TYPING_MS = 42;
const MEETING_LINE_PAUSE_MS = 1400;
const STANDUP_START_HOUR = 11;
const STANDUP_START_MINUTE = 30;
const STANDUP_REMINDER_LEAD_MINUTES = 15;

function parseTimeLabelMinutes(label) {
    const m = (label || '09:00').match(/(\d{1,2}):(\d{2})/);
    if (!m) return 9 * 60;
    return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
}

function standupStartMinutes() {
    return STANDUP_START_HOUR * 60 + STANDUP_START_MINUTE;
}

function standupTimeLabel() {
    return `${String(STANDUP_START_HOUR).padStart(2, '0')}:${String(STANDUP_START_MINUTE).padStart(2, '0')}`;
}

function currentGameMinutes() {
    const clock = typeof computeClientClock === 'function' ? computeClientClock(workspace) : null;
    return parseTimeLabelMinutes(clock?.timeLabel || workspace?.timeLabel);
}

function getStandupMeetingId() {
    return `daily-standup-day-${workspace?.player?.day || 1}`;
}

function hasStandupToday() {
    if (!workspace || workspace.meetingMissedToday) return false;
    return (workspace.tasks || []).some(t =>
        !t.completed && (t.id === 'MEET-daily' || t.ticketId?.startsWith('MEET-'))
    );
}

function canReceiveMeetingNotifications() {
    if (!workspace?.atDesk || meetingActive || workspace.meetingMissedToday) return false;
    if (!hasStandupToday()) return false;
    if (typeof isDevOsLocked === 'function' && isDevOsLocked()) return false;
    if (typeof isVpnConnected === 'function' && !isVpnConnected()) return false;
    const arrival = document.getElementById('arrival-screen');
    if (arrival && !arrival.classList.contains('hidden')) return false;
    return true;
}

function isStandupTimeReached() {
    return currentGameMinutes() >= standupStartMinutes();
}

function isStandupAdvanceWindow() {
    const now = currentGameMinutes();
    const start = standupStartMinutes();
    return now >= start - STANDUP_REMINDER_LEAD_MINUTES && now < start;
}

function runWhenMeetingNotifyReady(fn) {
    if (typeof Tutorial !== 'undefined' && Tutorial.isActive?.()) {
        const waitId = setInterval(() => {
            if (!Tutorial.isActive?.()) {
                clearInterval(waitId);
                fn();
            }
        }, 800);
        return;
    }
    fn();
}

function standupMinutesUntil() {
    return Math.max(0, standupStartMinutes() - currentGameMinutes());
}

function notifyStandupAdvance() {
    const key = `advance:${getStandupMeetingId()}`;
    if (meetingReminderNotified.has(key)) return;
    meetingReminderNotified.add(key);

    const mins = standupMinutesUntil();
    const title = typeof t === 'function'
        ? t('notify.meeting.advanceTitle', { n: mins })
        : `Daily Standup через ${mins} мин (игровых)`;
    const body = typeof t === 'function'
        ? t('notify.meeting.advanceBody', { time: standupTimeLabel() })
        : `Начало в ${standupTimeLabel()} — откройте Outlook → Календарь`;
    pushNotification('📅 Outlook', title, body, 'outlook', () => openAppWindow('email'));
}

function notifyStandupJoin() {
    const meeting = workspace?.pendingMeeting;
    if (!meeting) return;
    const key = `join:${meeting.id}`;
    if (meetingReminderNotified.has(key)) return;
    meetingReminderNotified.add(key);

    const title = meeting.title;
    const body = typeof t === 'function'
        ? t('notify.meeting.joinHint')
        : 'Идёт сейчас — нажмите, чтобы присоединиться';
    pushNotification('📅 Outlook', title, body, 'outlook', () => startMeeting(meeting));
    updateMeetingReminder();
}

async function refreshStandupMeetingState() {
    const now = Date.now();
    if (now - lastStandupStatePollMs < 8000) return;
    lastStandupStatePollMs = now;
    try {
        const ws = await api('/state');
        workspace = ws;
        if (typeof renderAll === 'function') renderAll({ refreshApps: 'smart', refreshPhone: true });
    } catch (_) { /* offline */ }
}

function tickMeetingReminders() {
    if (!canReceiveMeetingNotifications()) {
        updateMeetingReminder();
        return;
    }

    const gameMinutes = currentGameMinutes();

    if (isStandupAdvanceWindow()) {
        runWhenMeetingNotifyReady(notifyStandupAdvance);
    }

    if (gameMinutes >= standupStartMinutes()) {
        if (!workspace.pendingMeeting?.id?.startsWith('daily-standup')) {
            refreshStandupMeetingState().then(() => {
                if (canShowMeetingReminder()) runWhenMeetingNotifyReady(notifyStandupJoin);
            });
        } else if (canShowMeetingReminder()) {
            runWhenMeetingNotifyReady(notifyStandupJoin);
        }
    }

    updateMeetingReminder();
}

function canShowMeetingReminder() {
    if (!workspace?.atDesk || !workspace?.pendingMeeting || meetingActive) return false;
    if (!isStandupTimeReached()) return false;
    if (typeof isDevOsLocked === 'function' && isDevOsLocked()) return false;
    if (typeof isVpnConnected === 'function' && !isVpnConnected()) return false;
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
    tickMeetingReminders();
}

function startMeeting(meeting) {
    if (!meeting || meetingActive) return;
    meetingActive = true;
    meetingLineIndex = 0;
    window._meetingPlayerResponse = null;
    meetingShownIds.add(meeting.id);
    updateMeetingReminder();

    if (typeof MeetingVoice !== 'undefined') {
        MeetingVoice.unlock();
        MeetingVoice.updateToggleUi();
    }

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
    if (typeof MeetingVoice !== 'undefined') {
        MeetingVoice.stop(false);
        clearMeetingVoiceFallback();
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

    let typingDone = false;
    let voiceDone = !(typeof MeetingVoice !== 'undefined' && MeetingVoice.isEnabled());

    const advance = () => {
        const pause = MEETING_LINE_PAUSE_MS + line.text.length * 10;
        setTimeout(() => playMeetingLine(meeting, index + 1), pause);
    };

    const tryAdvance = () => {
        if (typingDone && voiceDone) advance();
    };

    if (typeof MeetingVoice !== 'undefined' && MeetingVoice.isEnabled()) {
        const voiceEnded = () => {
            if (voiceDone) return;
            clearMeetingVoiceFallback();
            voiceDone = true;
            tryAdvance();
        };
        scheduleMeetingVoiceFallback(voiceEnded, line.text);
        MeetingVoice.speak(line.speakerId, line.text, {
            role: line.role,
            onEnd: voiceEnded
        });
    }

    typeMeetingText(line.text, () => {
        typingDone = true;
        tryAdvance();
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
            let typingDone = false;
            let voiceDone = !(typeof MeetingVoice !== 'undefined' && MeetingVoice.isEnabled());
            const done = () => {
                if (typingDone && voiceDone) {
                    setTimeout(() => playMeetingLine(meeting, index + 1), 900);
                }
            };
            if (typeof MeetingVoice !== 'undefined' && MeetingVoice.isEnabled()) {
                const voiceEnded = () => {
                    if (voiceDone) return;
                    clearMeetingVoiceFallback();
                    voiceDone = true;
                    done();
                };
                scheduleMeetingVoiceFallback(voiceEnded, opt.text);
                MeetingVoice.speak('player', opt.text, {
                    role: workspace.player.careerTitle,
                    onEnd: voiceEnded
                });
            }
            typeMeetingText(opt.text, () => { typingDone = true; done(); });
            window._meetingPlayerResponse = opt.id;
        };
        opts.appendChild(btn);
    });
}

async function finishMeeting(meeting, responseId) {
    if (!meeting) return;
    const respId = responseId || window._meetingPlayerResponse || null;
    window._meetingPlayerResponse = null;

    if (typeof MeetingVoice !== 'undefined') {
        MeetingVoice.stop(false);
        clearMeetingVoiceFallback();
    }

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
    if (typeof MeetingVoice !== 'undefined') {
        MeetingVoice.stop(false);
        clearMeetingVoiceFallback();
    }
    finishMeeting(workspace.pendingMeeting, 'standup-late');
}

if (typeof MeetingVoice !== 'undefined') {
    MeetingVoice.bindToggle(document.getElementById('meeting-voice-toggle'));
}
