/** Звуки офиса: амбиент по комнатам + SFX на каждое движение и действие (Web Audio API) */
const OfficeAudio = (() => {
    const VOLUME = 0.58;
    const SFX = 0.82;

    let ctx = null;
    let master = null;
    let sfxBus = null;
    let ambientBus = null;
    let active = [];
    let timers = [];
    let muted = false;
    let unlocked = false;
    let currentRoom = null;
    let lastRoomId = null;

    function ensureCtx() {
        if (!ctx) {
            ctx = new AudioContext();
            master = ctx.createGain();
            master.gain.value = VOLUME;
            ambientBus = ctx.createGain();
            ambientBus.gain.value = 1.0;
            sfxBus = ctx.createGain();
            sfxBus.gain.value = SFX;
            ambientBus.connect(master);
            sfxBus.connect(master);
            master.connect(ctx.destination);
        }
        return ctx;
    }

    function track(node) {
        active.push(node);
        return node;
    }

    function trackTimer(id) {
        timers.push(id);
        return id;
    }

    function schedule(fn, delay) {
        trackTimer(setTimeout(fn, delay));
    }

    function clearAmbient() {
        timers.forEach(clearTimeout);
        timers = [];
        active.forEach(n => {
            try {
                if (n.stop) n.stop();
                n.disconnect?.();
            } catch (_) { /* noop */ }
        });
        active = [];
        currentRoom = null;
    }

    function ambientActive() {
        return unlocked && currentRoom;
    }

    async function resumeCtx() {
        const c = ensureCtx();
        if (c.state === 'suspended') await c.resume();
        return c;
    }

    async function unlock() {
        const c = ensureCtx();
        if (c.state === 'suspended') await c.resume();
        unlocked = true;
        return true;
    }

    function canPlay() {
        return unlocked && !muted;
    }

    function now() {
        return ensureCtx().currentTime;
    }

    function tone(freq, dur, gain, type = 'sine', bus = sfxBus, start = null) {
        if (!canPlay()) return;
        const c = ensureCtx();
        const t = start ?? c.currentTime;
        const osc = c.createOscillator();
        const g = c.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, t);
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(gain, t + 0.008);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        osc.connect(g);
        g.connect(bus);
        osc.start(t);
        osc.stop(t + dur + 0.02);
    }

    function noiseBurst(dur, gain, opts = {}) {
        if (!canPlay()) return;
        const c = ensureCtx();
        const t = c.currentTime;
        const len = Math.max(1, Math.floor(c.sampleRate * dur));
        const buf = c.createBuffer(1, len, c.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < len; i++) {
            const env = 1 - i / len;
            data[i] = (Math.random() * 2 - 1) * env;
        }
        const src = c.createBufferSource();
        src.buffer = buf;
        const filter = c.createBiquadFilter();
        filter.type = opts.filterType || 'lowpass';
        filter.frequency.value = opts.cutoff ?? 900;
        const g = c.createGain();
        g.gain.value = gain;
        src.connect(filter);
        filter.connect(g);
        g.connect(opts.bus || sfxBus);
        src.start(t);
        src.stop(t + dur);
    }

    function addLoopNoise(gain, cutoff, bus = ambientBus) {
        const c = ensureCtx();
        const len = c.sampleRate * 2;
        const buf = c.createBuffer(1, len, c.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
        const src = track(c.createBufferSource());
        src.buffer = buf;
        src.loop = true;
        const filter = track(c.createBiquadFilter());
        filter.type = 'lowpass';
        filter.frequency.value = cutoff;
        const g = track(c.createGain());
        g.gain.value = gain;
        src.connect(filter);
        filter.connect(g);
        g.connect(bus);
        src.start();
    }

    function addLoopHum(freq, gain, type = 'sine', bus = ambientBus) {
        const c = ensureCtx();
        const osc = track(c.createOscillator());
        const g = track(c.createGain());
        osc.type = type;
        osc.frequency.value = freq;
        g.gain.value = gain;
        osc.connect(g);
        g.connect(bus);
        osc.start();
    }

  // ─── SFX: движение ───

    function playWhoosh(dir = 'forward') {
        const c = ensureCtx();
        const t = c.currentTime;
        const len = Math.floor(c.sampleRate * 0.35);
        const buf = c.createBuffer(1, len, c.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
        const src = c.createBufferSource();
        src.buffer = buf;
        const filter = c.createBiquadFilter();
        filter.type = 'bandpass';
        const freq = dir === 'back' ? 280 : dir === 'left' || dir === 'right' ? 420 : 360;
        filter.frequency.setValueAtTime(freq, t);
        filter.frequency.exponentialRampToValueAtTime(freq * 2.2, t + 0.28);
        filter.Q.value = 0.7;
        const g = c.createGain();
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(0.09, t + 0.04);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.32);
        src.connect(filter);
        filter.connect(g);
        g.connect(sfxBus);
        src.start(t);
        src.stop(t + 0.35);
    }

    function playFootsteps(count = 3, soft = false) {
        if (!canPlay()) return;
        const base = soft ? 0.022 : 0.038;
        for (let i = 0; i < count; i++) {
            schedule(() => {
                noiseBurst(0.06 + Math.random() * 0.04, base + Math.random() * 0.012, {
                    cutoff: 180 + Math.random() * 120,
                    filterType: 'lowpass'
                });
                tone(80 + Math.random() * 40, 0.05, 0.012, 'triangle');
            }, i * (soft ? 220 : 180) + Math.random() * 40);
        }
    }

    function playDoorOpen() {
        noiseBurst(0.12, 0.04, { cutoff: 600 });
        tone(220, 0.15, 0.025, 'sawtooth');
        schedule(() => tone(180, 0.2, 0.015, 'sine'), 80);
    }

    function playDoorClose() {
        tone(160, 0.12, 0.02, 'triangle');
        schedule(() => noiseBurst(0.08, 0.035, { cutoff: 500 }), 60);
    }

    function playElevatorDoor() {
        tone(120, 0.25, 0.04, 'square');
        schedule(() => noiseBurst(0.2, 0.05, { cutoff: 400 }), 100);
        schedule(() => playDing(false), 200);
    }

    function playElevatorDoorsClose() {
        if (!canPlay()) return;
        tone(85, 0.4, 0.055, 'square');
        schedule(() => noiseBurst(0.28, 0.07, { cutoff: 280 }), 60);
        schedule(() => noiseBurst(0.12, 0.045, { cutoff: 420 }), 420);
    }

    function playElevatorDoorsOpen() {
        if (!canPlay()) return;
        noiseBurst(0.14, 0.04, { cutoff: 360 });
        schedule(() => tone(110, 0.22, 0.035, 'triangle'), 80);
    }

    function playElevatorFloorDing(floor) {
        if (!canPlay()) return;
        const freqs = { 1: 659.25, 2: 783.99, 3: 987.77 };
        const f = freqs[floor] || 880;
        tone(f, 0.22, 0.048, 'sine');
        schedule(() => tone(f * 1.25, 0.14, 0.022, 'sine'), 70);
    }

    let elevatorHumNodes = [];

    function playElevatorRideHum() {
        if (!canPlay()) return;
        stopElevatorRideHum();
        const c = ensureCtx();
        const t = c.currentTime;
        [48, 72].forEach((freq, i) => {
            const osc = c.createOscillator();
            const g = c.createGain();
            osc.type = i ? 'triangle' : 'sine';
            osc.frequency.value = freq;
            g.gain.setValueAtTime(0, t);
            g.gain.linearRampToValueAtTime(i ? 0.018 : 0.09, t + 0.25);
            osc.connect(g);
            g.connect(ambientBus || master);
            osc.start(t);
            elevatorHumNodes.push({ osc, g });
        });
    }

    function stopElevatorRideHum() {
        elevatorHumNodes.forEach(({ osc, g }) => {
            try {
                const c = ensureCtx();
                const t = c.currentTime;
                g.gain.cancelScheduledValues(t);
                g.gain.setValueAtTime(g.gain.value, t);
                g.gain.linearRampToValueAtTime(0, t + 0.2);
                osc.stop(t + 0.22);
            } catch (_) { /* noop */ }
        });
        elevatorHumNodes = [];
    }

    function playDing(scheduleNext = true) {
        if (!muted && unlocked) {
            [880, 1175].forEach((freq, i) => tone(freq, 0.55, 0.06, 'sine', sfxBus, now() + i * 0.07));
        }
        if (scheduleNext && ambientActive()) {
            schedule(() => playDing(true), 10000 + Math.random() * 12000);
        }
    }

    function playChairSit() {
        noiseBurst(0.15, 0.05, { cutoff: 350 });
        schedule(() => tone(95, 0.2, 0.02, 'sine'), 120);
        schedule(() => playWhoosh('back'), 50);
    }

    function playChairStand() {
        noiseBurst(0.1, 0.035, { cutoff: 280 });
        tone(70, 0.15, 0.018, 'triangle');
    }

    function playMonitorPower() {
        tone(440, 0.08, 0.03, 'square');
        schedule(() => tone(660, 0.12, 0.025, 'sine'), 60);
        schedule(() => tone(880, 0.2, 0.02, 'sine'), 140);
        noiseBurst(0.25, 0.03, { cutoff: 2000 });
    }

    /** Приятный звук включения ПК: гул → арпеджио → мягкий финальный аккорд */
    function playComputerStartup() {
        if (!canPlay()) return;
        const c = ensureCtx();
        const t = c.currentTime;

        noiseBurst(0.04, 0.012, { cutoff: 2400 });

        const hum = c.createOscillator();
        const humG = c.createGain();
        hum.type = 'sine';
        hum.frequency.setValueAtTime(55, t);
        hum.frequency.exponentialRampToValueAtTime(110, t + 0.45);
        humG.gain.setValueAtTime(0, t);
        humG.gain.linearRampToValueAtTime(0.035, t + 0.12);
        humG.gain.exponentialRampToValueAtTime(0.0001, t + 1.1);
        hum.connect(humG);
        humG.connect(sfxBus);
        hum.start(t);
        hum.stop(t + 1.15);

        const notes = [392, 523.25, 659.25, 783.99];
        notes.forEach((freq, i) => {
            const start = t + 0.2 + i * 0.1;
            tone(freq, 0.42, 0.038, 'sine', sfxBus, start);
            tone(freq * 2, 0.18, 0.006, 'sine', sfxBus, start + 0.04);
        });

        schedule(() => {
            tone(1046.5, 0.55, 0.028, 'sine');
            schedule(() => tone(1318.5, 0.45, 0.02, 'triangle'), 90);
        }, 650);

        schedule(() => noiseBurst(1.2, 0.01, { cutoff: 380, filterType: 'lowpass' }), 280);
    }

    /** Короткий chime «система готова» при появлении рабочего стола */
    function playBootReady() {
        if (!canPlay()) return;
        tone(880, 0.12, 0.022, 'sine');
        schedule(() => tone(1174.7, 0.18, 0.026, 'sine'), 100);
        schedule(() => tone(1568, 0.35, 0.018, 'triangle'), 220);
    }

    function playBootHum() {
        addLoopHum(110, 0.02, 'sawtooth', sfxBus);
        schedule(() => tone(220, 0.4, 0.015, 'sine', sfxBus), 200);
    }

    function playCoffeePour() {
        noiseBurst(0.5, 0.04, { cutoff: 1800, filterType: 'bandpass' });
        schedule(() => tone(200, 0.3, 0.015, 'triangle'), 300);
    }

    function playNotification() {
        tone(1046, 0.1, 0.03, 'sine');
        schedule(() => tone(1318, 0.12, 0.025, 'sine'), 90);
    }

    function playInspect() {
        tone(520, 0.08, 0.02, 'sine');
        schedule(() => tone(780, 0.1, 0.015, 'sine'), 70);
    }

    function playChat() {
        noiseBurst(0.2, 0.025, { cutoff: 1200 });
        schedule(() => noiseBurst(0.15, 0.02, { cutoff: 1400 }), 180);
        schedule(() => noiseBurst(0.18, 0.022, { cutoff: 1100 }), 400);
    }

    function playCurtain() {
        noiseBurst(0.18, 0.045, { cutoff: 250 });
    }

    function playRoomArrive(roomId) {
        const chime = {
            elevator: () => tone(330, 0.2, 0.02, 'sine'),
            entrance: () => { playDoorClose(); },
            kitchen: () => tone(392, 0.15, 0.018, 'triangle'),
            openspace: () => noiseBurst(0.1, 0.02, { cutoff: 800 }),
            desk_row: () => tone(440, 0.12, 0.015, 'sine'),
            seated: () => { playNotification(); tone(220, 0.18, 0.02, 'sine'); }
        };
        (chime[roomId] || chime.openspace)();
    }

    const TRANSITION_SFX = {
        'elevator->entrance': () => { playElevatorDoor(); playFootsteps(2); },
        'entrance->elevator': () => { playFootsteps(2); playElevatorDoor(); },
        'entrance->kitchen': () => { playDoorOpen(); playFootsteps(2, true); },
        'kitchen->entrance': () => { playFootsteps(2, true); playDoorClose(); },
        'kitchen->openspace': () => { playFootsteps(3); playWhoosh('forward'); },
        'openspace->kitchen': () => { playWhoosh('back'); playFootsteps(2); },
        'entrance->openspace': () => { playDoorOpen(); playFootsteps(3); playWhoosh('forward'); },
        'openspace->entrance': () => { playWhoosh('back'); playFootsteps(2); },
        'openspace->desk_row': () => { playFootsteps(4); playWhoosh('forward'); },
        'desk_row->openspace': () => { playWhoosh('back'); playFootsteps(3); },
        'desk_row->seated': () => { playFootsteps(2, true); playWhoosh('forward'); playChairSit(); },
        'seated->desk_row': () => { playChairStand(); playFootsteps(2); }
    };

    function playMove(fromRoom, toRoom, dir) {
        if (!canPlay()) return;
        const key = `${fromRoom}->${toRoom}`;
        const specific = TRANSITION_SFX[key];
        if (specific) {
            specific();
        } else {
            playWhoosh(dir);
            playFootsteps(dir === 'forward' ? 3 : 2, dir === 'back');
        }
        schedule(() => playCurtain(), 650);
        schedule(() => playRoomArrive(toRoom), 880);
    }

    function playInteract(type, id) {
        if (!canPlay()) return;
        switch (type) {
            case 'inspect':
                playInspect();
                break;
            case 'action':
                if (id === 'coffee') playCoffeePour();
                else if (id === 'greet' || id === 'kitchen_chat') playChat();
                else playInspect();
                break;
            case 'sit':
                playChairSit();
                break;
            case 'boot':
                playComputerStartup();
                break;
            default:
                playInspect();
        }
    }

    function loopAmbientClicks(minMs, maxMs) {
        if (!ambientActive()) return;
        if (!muted) {
            noiseBurst(0.04, 0.012 + Math.random() * 0.008, { cutoff: 1400, bus: ambientBus });
        }
        schedule(() => loopAmbientClicks(minMs, maxMs), minMs + Math.random() * (maxMs - minMs));
    }

    function loopChatter() {
        if (!ambientActive()) return;
        if (!muted) {
            noiseBurst(0.15 + Math.random() * 0.2, 0.012, { cutoff: 900 + Math.random() * 400, bus: ambientBus });
        }
        schedule(loopChatter, 3000 + Math.random() * 5000);
    }

    function loopCoffeeHiss() {
        if (!ambientActive()) return;
        if (!muted) {
            noiseBurst(0.8, 0.025, { cutoff: 2200, filterType: 'bandpass', bus: ambientBus });
        }
        schedule(loopCoffeeHiss, 6000 + Math.random() * 8000);
    }

    function loopPhoneBuzz() {
        if (!ambientActive()) return;
        if (!muted) {
            tone(180, 0.15, 0.008, 'square', ambientBus);
        }
        schedule(loopPhoneBuzz, 8000 + Math.random() * 15000);
    }

    function startRoomAmbient(roomId) {
        clearAmbient();
        currentRoom = roomId;
        lastRoomId = roomId;
        if (!canPlay()) return;

        switch (roomId) {
            case 'elevator':
                addLoopHum(52, 0.11);
                addLoopHum(104, 0.03);
                addLoopNoise(0.012, 200);
                schedule(() => playDing(true), 5000);
                break;
            case 'entrance':
                addLoopNoise(0.03, 450);
                addLoopHum(160, 0.008, 'triangle');
                loopChatter();
                schedule(() => playFootsteps(1, true), 4000 + Math.random() * 3000);
                break;
            case 'kitchen':
                addLoopNoise(0.028, 380);
                addLoopHum(95, 0.022, 'triangle');
                loopCoffeeHiss();
                loopChatter();
                break;
            case 'openspace':
                addLoopNoise(0.04, 520);
                addLoopHum(140, 0.01, 'triangle');
                loopAmbientClicks(400, 2200);
                loopChatter();
                loopPhoneBuzz();
                break;
            case 'desk_row':
                addLoopNoise(0.032, 480);
                loopAmbientClicks(600, 2800);
                schedule(() => playFootsteps(1, true), 5000 + Math.random() * 4000);
                break;
            case 'seated':
                addLoopNoise(0.012, 320);
                loopAmbientClicks(1200, 4500);
                break;
            default:
                addLoopNoise(0.035, 500);
                loopAmbientClicks(500, 2500);
        }
    }

    return {
        async unlock() {
            await unlock();
            if (currentRoom) startRoomAmbient(currentRoom);
        },

        playRoom(roomId, opts = {}) {
            const force = opts.force === true;
            if (!force && roomId === currentRoom && unlocked && !muted) return;
            startRoomAmbient(roomId);
        },

        playMove(fromRoom, toRoom, dir) {
            playMove(fromRoom, toRoom, dir);
        },

        playInteract(type, id) {
            playInteract(type, id);
        },

        playBootReady() {
            playBootReady();
        },

        playElevatorDoorsClose() {
            playElevatorDoorsClose();
        },

        playElevatorDoorsOpen() {
            playElevatorDoorsOpen();
        },

        playElevatorFloorDing(floor) {
            playElevatorFloorDing(floor);
        },

        playElevatorRideHum() {
            playElevatorRideHum();
        },

        stopElevatorRideHum() {
            stopElevatorRideHum();
        },

        playUi(kind) {
            if (!canPlay()) return;
            if (kind === 'arrow') tone(640, 0.06, 0.018, 'sine');
            else if (kind === 'map') tone(520, 0.08, 0.02, 'triangle');
            else tone(480, 0.05, 0.015, 'sine');
        },

        async setMuted(value) {
            muted = value;
            if (value) {
                if (master) master.gain.value = 0;
                return;
            }
            await resumeCtx();
            if (master) master.gain.value = VOLUME;
            const room = currentRoom || lastRoomId;
            if (unlocked && room) startRoomAmbient(room);
        },

        async toggleMute() {
            await this.setMuted(!muted);
            return muted;
        },

        isMuted() {
            return muted;
        },

        stop() {
            clearAmbient();
            lastRoomId = null;
            if (ctx) {
                ctx.close().catch(() => {});
                ctx = null;
                master = null;
                ambientBus = null;
                sfxBus = null;
            }
            unlocked = false;
        }
    };
})();
