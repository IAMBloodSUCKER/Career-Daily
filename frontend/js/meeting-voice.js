/** Условные звуки речи на митингах (без озвучки текста — «бульканье», как в симуляторах) */
const MeetingVoice = (() => {
    const STORAGE_KEY = 'devdaily-meeting-voice';
    let enabled = localStorage.getItem(STORAGE_KEY) !== 'false';
    let toggleBtn = null;
    let audioCtx = null;
    let babbleSession = null;

    const DEFAULT_PROFILE = { rate: 1.0, pitch: 1.0 };

    const SPEAKER_PROFILES = {
        player: { rate: 1.06, pitch: 1.1 },
        igor: { rate: 0.92, pitch: 0.78 },
        anna: { rate: 1.0, pitch: 1.15 },
        alex: { rate: 1.0, pitch: 0.86 },
        maria: { rate: 1.06, pitch: 1.17 },
        dmitry: { rate: 1.1, pitch: 0.74 },
        elena: { rate: 1.04, pitch: 1.12 },
        nikita: { rate: 1.07, pitch: 1.05 }
    };

    function isSupported() {
        return typeof (window.AudioContext || window.webkitAudioContext) !== 'undefined';
    }

    function getCtx() {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        return audioCtx;
    }

    function profileFor(speakerId, role) {
        const base = SPEAKER_PROFILES[speakerId] || {};
        const profile = { ...DEFAULT_PROFILE, ...base };
        if (SPEAKER_PROFILES[speakerId] || !role) return profile;

        const r = role.toLowerCase();
        if (/lead|тимлид|team lead/i.test(r)) {
            Object.assign(profile, { rate: 0.91, pitch: 0.8 });
        } else if (/qa|тест|quality/i.test(r)) {
            Object.assign(profile, { rate: 1.04, pitch: 1.14 });
        } else if (/product|pm|продакт|менеджер/i.test(r)) {
            Object.assign(profile, { rate: 0.97, pitch: 0.91 });
        } else if (/senior|сеньор/i.test(r)) {
            Object.assign(profile, { rate: 0.98, pitch: 0.85 });
        } else if (/devops|sre|platform/i.test(r)) {
            Object.assign(profile, { rate: 1.08, pitch: 0.76 });
        } else if (/junior|стажёр|intern|гость/i.test(r)) {
            Object.assign(profile, { rate: 1.07, pitch: 1.1 });
        }
        return profile;
    }

    function playSyllable(ctx, profile) {
        const when = ctx.currentTime;
        const pitchBase = 110 * profile.pitch;
        const freq = pitchBase + (Math.random() - 0.5) * 70;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc.type = Math.random() > 0.35 ? 'triangle' : 'sine';
        osc.frequency.setValueAtTime(freq, when);
        osc.frequency.exponentialRampToValueAtTime(
            Math.max(60, freq * (0.88 + Math.random() * 0.25)), when + 0.07);

        filter.type = 'bandpass';
        filter.frequency.value = 280 + profile.pitch * 120 + Math.random() * 180;
        filter.Q.value = 1.2 + Math.random();

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        const dur = 0.055 + Math.random() * 0.09;
        const vol = 0.14 + Math.random() * 0.08;
        gain.gain.setValueAtTime(0.0001, when);
        gain.gain.exponentialRampToValueAtTime(vol, when + 0.012);
        gain.gain.exponentialRampToValueAtTime(0.0001, when + dur);

        osc.start(when);
        osc.stop(when + dur + 0.03);

        if (Math.random() > 0.55) {
            const noise = ctx.createBufferSource();
            const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.04, ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.35;
            noise.buffer = buffer;
            const nGain = ctx.createGain();
            const nFilter = ctx.createBiquadFilter();
            nFilter.type = 'highpass';
            nFilter.frequency.value = 900;
            noise.connect(nFilter);
            nFilter.connect(nGain);
            nGain.connect(ctx.destination);
            nGain.gain.setValueAtTime(0.0001, when);
            nGain.gain.exponentialRampToValueAtTime(0.05, when + 0.008);
            nGain.gain.exponentialRampToValueAtTime(0.0001, when + 0.035);
            noise.start(when);
            noise.stop(when + 0.05);
        }
    }

    function babbleDuration(text, profile) {
        const len = (text || '').trim().length;
        const base = 900 + len * 32;
        const scaled = base / profile.rate;
        return Math.min(9000, Math.max(1100, scaled));
    }

    function stop(notifyEnd = false) {
        if (babbleSession) {
            babbleSession.cancelled = true;
            if (babbleSession.timer) clearTimeout(babbleSession.timer);
            const onEnd = notifyEnd ? babbleSession.onEnd : null;
            babbleSession = null;
            onEnd?.();
        }
    }

    function unlock() {
        if (!isSupported()) return false;
        const ctx = getCtx();
        if (ctx.state === 'suspended') {
            ctx.resume();
        }
        return true;
    }

    function speak(speakerId, text, opts = {}) {
        if (!enabled || !isSupported() || !text?.trim()) {
            opts.onEnd?.();
            return;
        }

        stop(false);
        const profile = profileFor(speakerId, opts.role);
        const ctx = getCtx();
        const duration = babbleDuration(text, profile);
        const session = { cancelled: false, onEnd: opts.onEnd };
        babbleSession = session;

        const run = () => {
            if (session.cancelled) return;

            let elapsed = 0;
            const gap = () => 55 / profile.rate + Math.random() * 45;

            const tick = () => {
                if (session.cancelled) return;
                if (elapsed >= duration) {
                    if (babbleSession === session) babbleSession = null;
                    opts.onEnd?.();
                    return;
                }
                playSyllable(ctx, profile);
                elapsed += gap();
                session.timer = setTimeout(tick, gap());
            };
            tick();
        };

        if (ctx.state === 'suspended') {
            ctx.resume().then(run).catch(() => {
                opts.onEnd?.();
            });
        } else {
            run();
        }
    }

    function isEnabled() {
        return enabled;
    }

    function setEnabled(on) {
        enabled = !!on;
        localStorage.setItem(STORAGE_KEY, enabled ? 'true' : 'false');
        if (!enabled) stop(true);
        updateToggleUi();
    }

    function toggle() {
        setEnabled(!enabled);
    }

    function updateToggleUi() {
        if (!toggleBtn) return;
        const onKey = 'meeting.voiceOn';
        const offKey = 'meeting.voiceOff';
        const onLabel = typeof t === 'function' ? t(onKey) : 'Звуки речи вкл';
        const offLabel = typeof t === 'function' ? t(offKey) : 'Звуки речи выкл';
        toggleBtn.textContent = enabled ? '🔊' : '🔇';
        toggleBtn.title = enabled ? onLabel : offLabel;
        toggleBtn.setAttribute('aria-label', enabled ? onLabel : offLabel);
        toggleBtn.classList.toggle('meeting-voice-muted', !enabled);
    }

    function bindToggle(btn) {
        toggleBtn = btn;
        if (!btn) return;
        btn.classList.toggle('hidden', !isSupported());
        btn.addEventListener('click', toggle);
        updateToggleUi();
    }

    return {
        isSupported,
        isEnabled,
        speak,
        stop,
        unlock,
        setEnabled,
        toggle,
        bindToggle,
        updateToggleUi
    };
})();
