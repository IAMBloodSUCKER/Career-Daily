/** Пошаговое обучение при первом запуске */
const TUTORIAL_STORAGE_KEY = 'devsimulator_tutorial_v1';

const OFFICE_STEPS = [
    {
        title: 'Офис — визуальная новелла',
        text: 'Полноэкранные кадры офиса. Нажимаете стрелку — сцена приближается и меняется.',
        target: null,
        screen: 'arrival'
    },
    {
        title: 'Стрелки на краях',
        text: 'Стрелки на краях — переход в соседнюю локацию. Подпись подскажет: «Кухня», «Open-space», «Назад»…',
        target: '#fp-nav-arrows',
        screen: 'arrival'
    },
    {
        title: 'Точки на сцене',
        text: 'Белые кружки — интерактив: кофе, коллега, монитор. Наведите — увидите подпись.',
        target: '#fp-hotspots',
        screen: 'arrival'
    },
    {
        title: 'Миникарта',
        text: 'Справа сверху — маршрут. Можно вернуться на пройденные точки.',
        target: '#fp-minimap',
        screen: 'arrival'
    },
    {
        title: 'Таймер',
        text: 'Успейте дойти до стола и включить DevOS до истечения времени.',
        target: '.fp-timer-wrap',
        screen: 'arrival'
    },
    {
        title: 'Маршрут',
        text: 'Лифт → вход (опционально кухня справа) → open-space → ряд → стол → ПК → DevOS.',
        target: '#fp-narrative',
        screen: 'arrival'
    }
];

const DESKTOP_STEPS = [
    {
        title: 'Рабочий стол DevOS',
        text: 'Вы за компьютером. Это главный экран игры — здесь Slack, IDE, JIRA и остальные инструменты.',
        target: '#workspace-desktop',
        screen: 'game'
    },
    {
        title: 'Шапка',
        text: 'Имя, уровень, проект, текущее время и канал Slack. Кнопка «Меню» — выход в главное меню игры.',
        target: '.top-bar',
        screen: 'game'
    },
    {
        title: 'Показатели слева',
        text: 'Опыт, зарплата, стресс, здоровье, энергия и навыки. Ниже — предупреждения HR (5 = увольнение).',
        target: '.stats-panel',
        screen: 'game'
    },
    {
        title: 'Активная задача',
        text: 'Здесь текущий шаг по задаче: что делать дальше — Slack, код, JIRA и т.д.',
        target: '#tutorial-active-task',
        screen: 'game'
    },
    {
        title: 'Иконки приложений',
        text: 'Кликайте иконки слева на рабочем столе или открывайте окна из панели задач внизу.',
        target: '.desktop-sidebar',
        screen: 'game'
    },
    {
        title: 'Панель DevOS',
        text: 'Кнопка ⊞ DevOS — меню всех приложений. Справа — часы, проект, телефон и кофе.',
        target: '.taskbar',
        screen: 'game'
    },
    {
        title: 'Задачи справа',
        text: 'Список задач на сегодня, перерывы и кнопка «Закончить день» — завершение смены и зарплата.',
        target: '.actions-panel',
        screen: 'game'
    },
    {
        title: 'Уведомления',
        text: 'Всплывающие сообщения справа внизу на столе — Slack, почта, инциденты. Кликайте, чтобы открыть приложение.',
        target: '#notification-stack',
        screen: 'game'
    },
    {
        title: 'Готово!',
        text: 'Типичный цикл: Slack → IntelliJ → JIRA. Удачного первого дня!',
        target: null,
        screen: 'game'
    }
];

let tutorialActive = false;
let tutorialSteps = [];
let tutorialIndex = 0;
let tutorialPhase = null;
let tutorialResizeObserver = null;

function isTutorialDone() {
    return !!localStorage.getItem(TUTORIAL_STORAGE_KEY);
}

function skipTutorial() {
    localStorage.setItem(TUTORIAL_STORAGE_KEY, 'skipped');
    endTutorial();
}

function completeTutorial() {
    localStorage.setItem(TUTORIAL_STORAGE_KEY, 'done');
    endTutorial();
}

function shouldShowTutorial() {
    return !isTutorialDone();
}

function startTutorial(phase) {
    if (!shouldShowTutorial()) return;
    tutorialPhase = phase;
    tutorialSteps = phase === 'office' ? OFFICE_STEPS : DESKTOP_STEPS;
    tutorialIndex = 0;
    tutorialActive = true;

    const overlay = document.getElementById('tutorial-overlay');
    overlay?.classList.remove('hidden');
    document.body.classList.add('tutorial-active');

    renderTutorialStep();
    bindTutorialResize();
}

function endTutorial() {
    tutorialActive = false;
    tutorialSteps = [];
    tutorialIndex = 0;
    tutorialPhase = null;

    document.getElementById('tutorial-overlay')?.classList.add('hidden');
    document.body.classList.remove('tutorial-active');
    unbindTutorialResize();
}

function bindTutorialResize() {
    if (tutorialResizeObserver) return;
    tutorialResizeObserver = () => {
        if (tutorialActive) renderTutorialStep(false);
    };
    window.addEventListener('resize', tutorialResizeObserver);
    window.addEventListener('scroll', tutorialResizeObserver, true);
}

function unbindTutorialResize() {
    if (!tutorialResizeObserver) return;
    window.removeEventListener('resize', tutorialResizeObserver);
    window.removeEventListener('scroll', tutorialResizeObserver, true);
    tutorialResizeObserver = null;
}

function renderTutorialStep(animate = true) {
    const step = tutorialSteps[tutorialIndex];
    if (!step) return;

    const spotlight = document.getElementById('tutorial-spotlight');
    const card = document.getElementById('tutorial-card');
    const titleEl = document.getElementById('tutorial-title');
    const textEl = document.getElementById('tutorial-text');
    const stepEl = document.getElementById('tutorial-step-label');
    const nextBtn = document.getElementById('tutorial-next');

    titleEl.textContent = step.title;
    textEl.textContent = step.text;
    stepEl.textContent = `${tutorialIndex + 1} / ${tutorialSteps.length}`;

    const isLast = tutorialIndex === tutorialSteps.length - 1;
    nextBtn.textContent = isLast ? 'Понятно ✓' : 'Далее →';

    if (!animate) spotlight.style.transition = 'none';
    positionTutorialSpotlight(step.target);
    positionTutorialCard(step.target, card);
    if (!animate) {
        requestAnimationFrame(() => {
            spotlight.style.transition = '';
        });
    }
}

function positionTutorialSpotlight(selector) {
    const spotlight = document.getElementById('tutorial-spotlight');
    if (!spotlight) return;

    if (!selector) {
        spotlight.classList.add('hidden');
        return;
    }

    const el = document.querySelector(selector);
    if (!el || !isElementVisible(el)) {
        spotlight.classList.add('hidden');
        return;
    }

    const pad = 10;
    const rect = el.getBoundingClientRect();
    spotlight.classList.remove('hidden');
    spotlight.style.top = `${Math.max(8, rect.top - pad)}px`;
    spotlight.style.left = `${Math.max(8, rect.left - pad)}px`;
    spotlight.style.width = `${rect.width + pad * 2}px`;
    spotlight.style.height = `${rect.height + pad * 2}px`;
}

function positionTutorialCard(selector, card) {
    if (!card) return;

    if (!selector) {
        card.classList.add('tutorial-card-centered');
        card.style.top = '';
        card.style.left = '';
        card.style.transform = '';
        return;
    }

    const el = document.querySelector(selector);
    card.classList.remove('tutorial-card-centered');

    if (!el || !isElementVisible(el)) {
        card.classList.add('tutorial-card-centered');
        return;
    }

    const rect = el.getBoundingClientRect();
    const cardRect = card.getBoundingClientRect();
    const margin = 16;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let top = rect.bottom + margin;
    if (top + cardRect.height > vh - margin) {
        top = rect.top - cardRect.height - margin;
    }
    if (top < margin) top = margin;

    let left = rect.left + rect.width / 2 - cardRect.width / 2;
    left = Math.max(margin, Math.min(left, vw - cardRect.width - margin));

    card.style.top = `${top}px`;
    card.style.left = `${left}px`;
    card.style.transform = 'none';
}

function isElementVisible(el) {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
}

function tutorialNext() {
    if (!tutorialActive) return;

    if (tutorialIndex >= tutorialSteps.length - 1) {
        if (tutorialPhase === 'desktop') {
            completeTutorial();
        } else {
            endTutorial();
        }
        return;
    }

    tutorialIndex++;
    renderTutorialStep();
}

function maybeStartOfficeTutorial() {
    if (!shouldShowTutorial()) return;
    const arrival = document.getElementById('arrival-screen');
    if (!arrival || arrival.classList.contains('hidden')) return;
    setTimeout(() => startTutorial('office'), 500);
}

function maybeStartDesktopTutorial() {
    if (!shouldShowTutorial()) return;
    const game = document.getElementById('game-screen');
    if (!game || game.classList.contains('hidden')) return;
    setTimeout(() => startTutorial('desktop'), 700);
}

document.getElementById('tutorial-next')?.addEventListener('click', tutorialNext);
document.getElementById('tutorial-skip')?.addEventListener('click', skipTutorial);

document.addEventListener('keydown', e => {
    if (!tutorialActive) return;
    if (e.key === 'Escape') {
        e.preventDefault();
        skipTutorial();
    } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        tutorialNext();
    }
});

window.Tutorial = {
    shouldShowTutorial,
    maybeStartOfficeTutorial,
    maybeStartDesktopTutorial,
    skipTutorial,
    isActive: () => tutorialActive
};
