/** Утренний сценарий: случайная задержка и причина до офиса */
const MorningCommute = (function () {
    const BASE_WAKE = 7 * 60 + 8;
    const BASE_LEAVE = 8 * 60 + 22;
    const BASE_ELEVATOR = 8 * 60 + 52;

    /** ~100 причин: delayMin/delayMax в минутах относительно обычного утра, weight — частота */
    const EXCUSES = [
        { text: 'Пустая дорога — проехали без пробок', delayMin: -18, delayMax: -6, weight: 2 },
        { text: 'Проснулись на 20 минут раньше будильника', delayMin: -15, delayMax: -5, weight: 2 },
        { text: 'Метро полупустое — приехали быстрее', delayMin: -12, delayMax: -4, weight: 2 },
        { text: 'Такси без очереди у подъезда', delayMin: -10, delayMax: -3, weight: 1 },
        { text: 'Сосед подвёз почти до офиса', delayMin: -14, delayMax: -6, weight: 1 },
        { text: 'Светофоры все зелёные — редкая удача', delayMin: -8, delayMax: -2, weight: 2 },
        { text: 'Вчера приготовили одежду — собрались за 5 минут', delayMin: -10, delayMax: -3, weight: 2 },
        { text: 'Кофе в термосе с вечера — не задержались на кухне', delayMin: -7, delayMax: -2, weight: 1 },
        { text: 'Лифт в подъезде сразу приехал', delayMin: -5, delayMax: -1, weight: 2 },
        { text: 'Обычное утро — всё по расписанию', delayMin: -2, delayMax: 4, weight: 4 },
        { text: 'Чуть дольше выбирали носки', delayMin: 3, delayMax: 8, weight: 3 },
        { text: 'Будильник переставили на «ещё 5 минут»', delayMin: 5, delayMax: 12, weight: 3 },
        { text: 'Очередь в душ — сосед долго мылась', delayMin: 6, delayMax: 14, weight: 2 },
        { text: 'Не могли найти ключи от квартиры', delayMin: 4, delayMax: 11, weight: 2 },
        { text: 'Кофе пролился на рубашку — пришлось переодеваться', delayMin: 8, delayMax: 18, weight: 2 },
        { text: 'Пробка у дома — все выезжают в одно время', delayMin: 10, delayMax: 22, weight: 3 },
        { text: 'Пробка на Садовом кольце', delayMin: 18, delayMax: 45, weight: 3 },
        { text: 'ДТП на магистрали — объезд через пробки', delayMin: 25, delayMax: 55, weight: 2 },
        { text: 'МКАД стоял — три полосы в одну', delayMin: 20, delayMax: 50, weight: 2 },
        { text: 'Ремонт дороги — одна полоса', delayMin: 12, delayMax: 28, weight: 2 },
        { text: 'Пробка из-за фуры без номеров', delayMin: 15, delayMax: 35, weight: 2 },
        { text: 'Светофор на перекрёстке сломался', delayMin: 8, delayMax: 20, weight: 2 },
        { text: 'Платная дорога — очередь на въезд', delayMin: 10, delayMax: 25, weight: 1 },
        { text: 'Каршеринг не завёлся — ждали замену', delayMin: 12, delayMax: 30, weight: 2 },
        { text: 'Колесо спустило — вызвали эвакуатор', delayMin: 25, delayMax: 60, weight: 1 },
        { text: 'Автобус ушёл прямо перед носом', delayMin: 8, delayMax: 18, weight: 3 },
        { text: 'Метро задержали — «техническая пауза»', delayMin: 10, delayMax: 25, weight: 3 },
        { text: 'Эскалатор в метро не работает', delayMin: 5, delayMax: 12, weight: 2 },
        { text: 'Задержка электрички на 20 минут', delayMin: 18, delayMax: 35, weight: 2 },
        { text: 'Трамвай встал посреди пути', delayMin: 12, delayMax: 28, weight: 2 },
        { text: 'Очередь на проходную в БЦ', delayMin: 4, delayMax: 10, weight: 3 },
        { text: 'Охрана проверяет пропуск дольше обычного', delayMin: 5, delayMax: 14, weight: 2 },
        { text: 'Лифт в БЦ застрял между этажами', delayMin: 15, delayMax: 40, weight: 2 },
        { text: 'Один лифт из трёх не работает — очередь', delayMin: 6, delayMax: 16, weight: 3 },
        { text: 'Дождь — такси не берут, ждали 15 минут', delayMin: 12, delayMax: 28, weight: 2 },
        { text: 'Снегопад — дороги не чистят', delayMin: 15, delayMax: 40, weight: 1 },
        { text: 'Гололёд — ехали осторожно', delayMin: 10, delayMax: 22, weight: 2 },
        { text: 'Туман — самолёт задержали, прилетели позже', delayMin: 30, delayMax: 90, weight: 1 },
        { text: 'Ребёнок не мог найти носки — семейная паника', delayMin: 8, delayMax: 18, weight: 2 },
        { text: 'Ребёнок пролил сок на школьную форму', delayMin: 10, delayMax: 22, weight: 2 },
        { text: 'Школьный автобус не приехал — отвозили сами', delayMin: 20, delayMax: 45, weight: 2 },
        { text: 'Родительское собрание затянулось до утра', delayMin: 15, delayMax: 35, weight: 1 },
        { text: 'Ребёнок заболел — вызывали педиатра на дом', delayMin: 25, delayMax: 55, weight: 1 },
        { text: 'Ребёнок в больнице — сопровождали на анализы', delayMin: 35, delayMax: 75, weight: 1 },
        { text: 'Жена/муж заболел — подменяли у кровати', delayMin: 18, delayMax: 40, weight: 2 },
        { text: 'Свёкор приехал без предупреждения', delayMin: 12, delayMax: 28, weight: 1 },
        { text: 'Ссора с соседом из-за парковки', delayMin: 8, delayMax: 18, weight: 1 },
        { text: 'Прорвало трубу у соседей — заливает', delayMin: 20, delayMax: 50, weight: 1 },
        { text: 'Кошка рожает в ванной', delayMin: 40, delayMax: 90, weight: 1 },
        { text: 'Кот заблокировал дверь спальни', delayMin: 5, delayMax: 12, weight: 2 },
        { text: 'Собака съела один ботинок', delayMin: 10, delayMax: 25, weight: 2 },
        { text: 'Попугай разбудил в 6 утра — не выспались', delayMin: 6, delayMax: 15, weight: 1 },
        { text: 'Хомяк сбежал — ловили по квартире', delayMin: 12, delayMax: 30, weight: 1 },
        { text: 'Ветеринар: экстренный приём для кота', delayMin: 30, delayMax: 65, weight: 1 },
        { text: 'Головная боль с утра — долго просыпались', delayMin: 10, delayMax: 22, weight: 2 },
        { text: 'Температура 37.5 — решили всё же ехать', delayMin: 8, delayMax: 18, weight: 2 },
        { text: 'Аллергия — долго искали таблетки', delayMin: 6, delayMax: 14, weight: 2 },
        { text: 'Зубная боль — записались к стоматологу на вечер', delayMin: 5, delayMax: 12, weight: 1 },
        { text: 'Плохо спали — будильник не слышали', delayMin: 15, delayMax: 35, weight: 2 },
        { text: 'Бессонница до 4 утра — встали поздно', delayMin: 20, delayMax: 45, weight: 2 },
        { text: 'Проспали будильник — проснулись в панике', delayMin: 35, delayMax: 70, weight: 2 },
        { text: 'Wi‑Fi упал — не пришло напоминание в календарь', delayMin: 4, delayMax: 10, weight: 2 },
        { text: 'Телефон разрядился — будильник не сработал', delayMin: 25, delayMax: 55, weight: 2 },
        { text: 'Обновление Windows затянулось на перезагрузку', delayMin: 8, delayMax: 20, weight: 2 },
        { text: 'Ноутбук не включался — перезагрузка', delayMin: 6, delayMax: 15, weight: 2 },
        { text: 'Забыли зарядку — возвращались домой', delayMin: 12, delayMax: 28, weight: 2 },
        { text: 'Не работал домофон — ждали соседа', delayMin: 8, delayMax: 20, weight: 2 },
        { text: 'Отключили воду — искали ключи от стояка', delayMin: 10, delayMax: 22, weight: 1 },
        { text: 'Отключили свет — одевались в темноте', delayMin: 7, delayMax: 16, weight: 1 },
        { text: 'Сработала пожарная сигнализация — эвакуация', delayMin: 20, delayMax: 45, weight: 1 },
        { text: 'Лифт в доме не работает — спуск пешком с 14 этажа', delayMin: 10, delayMax: 22, weight: 2 },
        { text: 'Застряли в лифте с соседом и small talk', delayMin: 18, delayMax: 40, weight: 1 },
        { text: 'Сосед сверлит стену с 7 утра — не могли сосредоточиться', delayMin: 5, delayMax: 12, weight: 2 },
        { text: 'Курьер привёз посылку — пришлось принимать', delayMin: 6, delayMax: 14, weight: 2 },
        { text: 'Сломался замок — вызывали мастера', delayMin: 25, delayMax: 55, weight: 1 },
        { text: 'Забыли пропуск — возвращались за ним', delayMin: 10, delayMax: 22, weight: 2 },
        { text: 'Забыли ноутбук — развернулись домой', delayMin: 15, delayMax: 35, weight: 2 },
        { text: 'Забыли обед — не критично, но вернулись', delayMin: 8, delayMax: 18, weight: 2 },
        { text: 'Полили цветы и залили пол — убирали', delayMin: 7, delayMax: 16, weight: 1 },
        { text: 'Стирка протекла — выжимали ковёр', delayMin: 12, delayMax: 28, weight: 1 },
        { text: 'Мама звонила 20 минут — «когда женишься»', delayMin: 15, delayMax: 30, weight: 2 },
        { text: 'Team Lead написал в 7:30 — пришлось ответить', delayMin: 5, delayMax: 12, weight: 2 },
        { text: 'Slack на телефоне — «срочно глянь прод»', delayMin: 4, delayMax: 10, weight: 2 },
        { text: 'GitLab упал ночью — проверяли деплой с телефона', delayMin: 8, delayMax: 18, weight: 1 },
        { text: 'Страйк водителей автобуса', delayMin: 25, delayMax: 60, weight: 1 },
        { text: 'Митинг перенесли на 8:00 — пришлось подключиться из такси', delayMin: 10, delayMax: 25, weight: 1 },
        { text: 'Парад на главной — перекрыли центр', delayMin: 20, delayMax: 50, weight: 1 },
        { text: 'Марафон перекрыл улицу у офиса', delayMin: 15, delayMax: 35, weight: 1 },
        { text: 'Концерт ночью — соседи шумели до 3', delayMin: 12, delayMax: 28, weight: 1 },
        { text: 'Соседская собака лаяла всю ночь', delayMin: 8, delayMax: 18, weight: 2 },
        { text: 'Переезд вчера — коробки ещё не разобраны', delayMin: 10, delayMax: 22, weight: 1 },
        { text: 'Новая квартира — путаетесь в маршруте', delayMin: 12, delayMax: 28, weight: 1 },
        { text: 'Яндекс.Карты повели в объезд через лес', delayMin: 15, delayMax: 35, weight: 1 },
        { text: 'GPS глючил — проехали мимо поворота', delayMin: 8, delayMax: 18, weight: 2 },
        { text: 'Шиномонтаж утром — сезонная смена резины', delayMin: 30, delayMax: 70, weight: 1 },
        { text: 'ТО у машины затянулось', delayMin: 35, delayMax: 80, weight: 1 },
        { text: 'Полиция остановила — проверка документов', delayMin: 12, delayMax: 28, weight: 1 },
        { text: 'Штраф за парковку — оспаривали', delayMin: 10, delayMax: 22, weight: 1 },
        { text: 'Эвакуировали машину со двора', delayMin: 25, delayMax: 55, weight: 1 },
        { text: 'Сосед припёр машину — не могли выехать', delayMin: 15, delayMax: 35, weight: 2 },
        { text: 'Каршеринг закончился посреди магистрали', delayMin: 18, delayMax: 40, weight: 1 },
        { text: 'Самокат сел на полпути', delayMin: 8, delayMax: 18, weight: 1 },
        { text: 'Велосипед пробили — тащили в сервис', delayMin: 20, delayMax: 45, weight: 1 },
        { text: 'Лужа по колено — пришлось переобуваться', delayMin: 6, delayMax: 14, weight: 2 },
        { text: 'Зонт сломался на ветру — промокли', delayMin: 8, delayMax: 18, weight: 1 },
        { text: 'Град — стояли под навесом 15 минут', delayMin: 12, delayMax: 25, weight: 1 },
        { text: 'Жара — кондиционер в машине не работает', delayMin: 5, delayMax: 12, weight: 1 },
        { text: 'Бабушка на переходе — помогали донести сумки', delayMin: 4, delayMax: 10, weight: 2 },
        { text: 'Потеряли AirPods — искали под кроватью', delayMin: 8, delayMax: 18, weight: 1 },
        { text: 'Кофейня на углу — очередь на cappuccino', delayMin: 6, delayMax: 14, weight: 2 },
        { text: 'Встретили бывшего коллегу — 10 минут small talk', delayMin: 8, delayMax: 18, weight: 2 },
        { text: 'HR прислала документы — подписывали по дороге', delayMin: 5, delayMax: 12, weight: 1 },
        { text: 'Банк заблокировал карту — звонили в поддержку', delayMin: 12, delayMax: 28, weight: 1 },
        { text: 'Налоговая — письмо счастья, нервничали', delayMin: 6, delayMax: 14, weight: 1 },
        { text: 'Съёмная квартира — хозяйка приехала без предупреждения', delayMin: 18, delayMax: 40, weight: 1 },
        { text: 'Ремонт у соседей сверху — шум с 7 утра', delayMin: 4, delayMax: 10, weight: 2 },
        { text: 'Плановое отключение газа — ждали inspector', delayMin: 22, delayMax: 50, weight: 1 },
        { text: 'Доставка IKEA — окно 8:00–10:00', delayMin: 15, delayMax: 35, weight: 1 },
        { text: 'Ребёнок забыл рюкзак — возвращались в школу', delayMin: 18, delayMax: 38, weight: 2 },
        { text: 'День рождения супруга — забыли поздравить утром, исправлялись', delayMin: 8, delayMax: 18, weight: 1 },
        { text: 'Сны про прод — проснулись в холодном поту и долго осаживались', delayMin: 7, delayMax: 16, weight: 2 }
    ];

    function mulberry32(seed) {
        return function () {
            seed |= 0;
            seed = (seed + 0x6D2B79F5) | 0;
            let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
            t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }

    function randInt(rng, min, max) {
        return min + Math.floor(rng() * (max - min + 1));
    }

    function formatTime(totalMinutes) {
        let t = totalMinutes;
        while (t < 0) t += 24 * 60;
        const h = Math.floor(t / 60) % 24;
        const m = t % 60;
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    }

    function pickExcuse(rng, targetDelay) {
        const weighted = [];
        EXCUSES.forEach((e, i) => {
            const mid = (e.delayMin + e.delayMax) / 2;
            const dist = Math.abs(mid - targetDelay);
            const fit = Math.max(1, 4 - dist / 12);
            const w = (e.weight || 1) * fit;
            for (let k = 0; k < Math.ceil(w * 2); k++) weighted.push(i);
        });
        const idx = weighted[Math.floor(rng() * weighted.length)] ?? 0;
        const e = EXCUSES[idx];
        const delay = randInt(rng, e.delayMin, e.delayMax);
        return { text: e.text, minutesLate: delay };
    }

    function rollTargetDelay(rng) {
        const roll = rng() * 100;
        if (roll < 55) return randInt(rng, -12, 5);
        if (roll < 72) return randInt(rng, 6, 18);
        if (roll < 85) return randInt(rng, 19, 35);
        if (roll < 94) return randInt(rng, 36, 60);
        return randInt(rng, 61, 105);
    }

    function headlineFor(minutesLate, text) {
        if (minutesLate <= 0) {
            return `✅ ${text}. В офисе чуть раньше обычного.`;
        }
        if (minutesLate <= 10) {
            return `🙂 ${text}. Небольшая задержка (+${minutesLate} мин) — успеете.`;
        }
        if (minutesLate <= 30) {
            return `⏱ ${text}. Задержка +${minutesLate} мин — к daily в 11:30 ещё далеко.`;
        }
        if (minutesLate <= 60) {
            return `⚠️ ${text}. Опоздание на работу +${minutesLate} мин.`;
        }
        return `🚨 ${text}. Серьёзная задержка +${minutesLate} мин — daily под угрозой.`;
    }

    function moodFor(minutesLate) {
        if (minutesLate <= 0) return 'early';
        if (minutesLate <= 10) return 'ok';
        if (minutesLate <= 25) return 'tight';
        if (minutesLate <= 55) return 'late';
        return 'critical';
    }

    function buildScenario(day, rng) {
        const target = rollTargetDelay(rng);
        const picked = pickExcuse(rng, target);
        const minutesLate = picked.minutesLate;
        const elevatorTime = formatTime(BASE_ELEVATOR + minutesLate);
        const leaveTime = formatTime(BASE_LEAVE + Math.max(0, minutesLate - 8));
        const wakeTime = formatTime(BASE_WAKE + Math.max(0, minutesLate - 15));

        return {
            day,
            minutesLate,
            text: picked.text,
            wakeTime,
            leaveTime,
            elevatorTime,
            mood: moodFor(minutesLate),
            headline: headlineFor(minutesLate, picked.text)
        };
    }

    function storageKey(day) {
        return `morning-commute-d${day}`;
    }

    function roll(day) {
        const d = day || 1;
        try {
            const stored = sessionStorage.getItem(storageKey(d));
            if (stored) return JSON.parse(stored);
        } catch (_) { /* noop */ }

        const rng = mulberry32((d * 2654435761) ^ ((Date.now() & 0xffff) + 1));
        const scenario = buildScenario(d, rng);
        try {
            sessionStorage.setItem(storageKey(d), JSON.stringify(scenario));
        } catch (_) { /* noop */ }
        return scenario;
    }

    function clearDay(day) {
        try {
            sessionStorage.removeItem(storageKey(day));
        } catch (_) { /* noop */ }
    }

    function clearAll() {
        try {
            for (let i = sessionStorage.length - 1; i >= 0; i--) {
                const k = sessionStorage.key(i);
                if (k && k.startsWith('morning-commute-d')) sessionStorage.removeItem(k);
            }
        } catch (_) { /* noop */ }
    }

    return { roll, clearDay, clearAll, formatTime };
})();
