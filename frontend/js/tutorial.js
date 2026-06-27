/** Пошаговое обучение: офис/стол — один раз; первая задача — отдельно для каждого грейда */
const TUTORIAL_STORAGE_KEY = 'devsimulator_tutorial_v3';
const TUTORIAL_LEGACY_KEY = 'devsimulator_tutorial_v2';

function tw(key, fallback) {
    if (typeof t !== 'function') return fallback;
    const text = t(key);
    return text !== key ? text : fallback;
}

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
        text: 'Лифт → вход (опционально кухня справа) → open-space → ряд → за стол → включить DevOS.',
        target: '#fp-narrative',
        screen: 'arrival'
    },
    {
        title: 'Включение ПК',
        text: 'У стола — клик по экрану «Включить DevOS». Без этого рабочий стол не откроется.',
        target: '#fp-hotspots',
        screen: 'arrival'
    }
];

const DESKTOP_STEPS = [
    {
        title: 'Включите компьютер',
        text: 'После загрузки DevOS появится экран входа как в Windows — пароль уже введён, нажмите «→». Затем откроются Slack, уведомления и daily.',
        target: '#devos-unlock-btn',
        screen: 'game'
    },
    {
        title: 'Подключите Cisco AnyConnect',
        text: 'Справа внизу появится уведомление — откройте Cisco AnyConnect и нажмите «Подключиться». После этого заработают Slack, JIRA и почта.',
        target: '#notification-stack',
        screen: 'game'
    },
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
        text: 'Кликайте значки на рабочем столе, перетаскивайте их мышью или закрепляйте из меню ⊞ DevOS (ПКМ по приложению). Окна также открываются с панели задач внизу.',
        target: '#desktop-icon-layer',
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
        title: 'Перерывы: спортзал и друзья',
        text: '🏋️ Спортзал (2ч) — днём, когда стресс растёт и хотя бы одна задача закрыта: −стресс, +здоровье. '
            + '🎉 Друзья (3ч) — вечером после работы: отдых и −стресс. Если за день ничего не сделали — коллеги недовольны. '
            + 'Клик → короткая сцена, часы сдвигаются.',
        target: '#rest-list',
        fallback: '#rest-section-hint',
        screen: 'game'
    },
    {
        title: 'Уведомления',
        text: 'Всплывающие сообщения справа внизу на столе — Slack, почта, инциденты. Кликайте, чтобы открыть приложение.',
        target: '#notification-stack',
        screen: 'game'
    },
    {
        title: 'Обзор закончен',
        text: 'Дальше — пошаговый пример на вашей первой задаче: куда нажимать и в каком порядке.',
        target: null,
        screen: 'game'
    }
];

function loadTutorialState() {
    try {
        const raw = localStorage.getItem(TUTORIAL_STORAGE_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            parsed.tasks = parsed.tasks || {};
            return parsed;
        }
    } catch (_) { /* ignore */ }
    const legacy = localStorage.getItem(TUTORIAL_LEGACY_KEY);
    if (legacy === 'skipped') {
        return { skipped: true, intro: true, tasks: {} };
    }
    if (legacy === 'done') {
        return {
            intro: true,
            tasks: { intern: true, junior: true, middle: true, senior: true }
        };
    }
    return { tasks: {} };
}

function saveTutorialState(state) {
    try {
        localStorage.setItem(TUTORIAL_STORAGE_KEY, JSON.stringify(state));
    } catch (_) { /* ignore */ }
}

function getCareerTier() {
    const exp = workspace?.player?.experienceYears ?? 0;
    if (exp <= 0) return 'intern';
    if (exp <= 2) return 'junior';
    if (exp <= 5) return 'middle';
    return 'senior';
}

function careerTierLabel(tier) {
    const fallbacks = {
        intern: '🌱 Стажёр',
        junior: 'Junior',
        middle: 'Middle',
        senior: 'Senior'
    };
    return tw(`career.${tier}.name`, fallbacks[tier] || tier);
}

function taskHasObjective(task, type) {
    return !!(task?.objectives || []).some(o => o.type === type);
}

function findFirstWorkTask() {
    return workspace?.tasks?.find(t =>
        !t.completed && !String(t.ticketId || '').startsWith('MEET') && t.type !== 'MEETING');
}

function buildTaskWalkthroughSteps() {
    const tier = getCareerTier();
    const bugTask = findFirstWorkTask();
    const standup = workspace?.tasks?.find(t =>
        String(t.ticketId || '').startsWith('MEET') || t.type === 'MEETING');
    const meetBar = document.getElementById('meeting-reminder-bar');
    const meetVisible = meetBar && !meetBar.classList.contains('hidden') && isElementVisible(meetBar);

    if (bugTask?.type === 'CODE_REVIEW') {
        return buildCodeReviewWalkthrough(bugTask, standup, meetVisible, tier);
    }
    return buildBugWalkthrough(bugTask, standup, meetVisible, tier);
}

function objectiveLabel(obj) {
    return typeof formatObjectiveLabel === 'function' ? formatObjectiveLabel(obj) : obj.label;
}

function contactLabel(contactId) {
    if (typeof contactById === 'function') {
        return contactById(contactId)?.name || null;
    }
    return workspace?.contacts?.find(c => c.id === contactId)?.name || null;
}

function tierIntroFallback(tier, ticket) {
    switch (tier) {
        case 'intern':
            return `🌱 Стажёр: учебная задача ${ticket}. Без Git и PR — Slack, IntelliJ и JIRA. Идите по чеклисту слева.`;
        case 'junior':
            return `Junior: классический баг ${ticket}. Slack → JIRA → код → ответ QA → Done. Git Push / PR — только если есть в чеклисте.`;
        case 'middle':
            return `Middle: ${ticket} — одна из нескольких задач дня. Баг, затем code review (PR коллег). Не пропускайте Daily в 11:30.`;
        case 'senior':
            return `Senior: плотный день. ${ticket} + ревью + скоро инциденты (Grafana, K8s). Приоритет — daily и prod.`;
        default:
            return `Первая задача ${ticket} — следуйте чеклисту слева.`;
    }
}

function tierCrIntroFallback(tier, ticket) {
    switch (tier) {
        case 'intern':
            return `Code review ${ticket} — на стажировке редко; смотрите diff в IntelliJ, ответьте в Slack, JIRA → Done.`;
        case 'junior':
            return `Junior: ревью ${ticket} — IntelliJ (Run tests) → Slack (LGTM или комментарий) → JIRA.`;
        case 'middle':
            return `Middle: ${ticket} — полноценное ревью. Проверьте стиль, тесты, безопасность по чеклисту.`;
        case 'senior':
            return `Senior: ${ticket} — вы задаёте планку качества. Конструктивный фидбек, не блокируйте без причины.`;
        default:
            return `Code review ${ticket} — по чеклисту слева.`;
    }
}

function buildTierIntroStep(tier, task, isCodeReview) {
    const ticket = task?.ticketId || (isCodeReview ? 'PR-247' : 'JIRA-142');
    const title = tw('walkthrough.tier.title', 'Первая задача · {tier}')
        .replace('{tier}', careerTierLabel(tier));
    const text = isCodeReview
        ? tw(`walkthrough.tier.${tier}.crIntro`, tierCrIntroFallback(tier, ticket))
        : tw(`walkthrough.tier.${tier}.intro`, tierIntroFallback(tier, ticket));
    return {
        title,
        text,
        target: '#objectives-list',
        fallback: '#tutorial-active-task'
    };
}

function buildTierExtraSteps(tier, task) {
    const steps = [];
    if (tier === 'intern') {
        steps.push({
            title: tw('walkthrough.tier.intern.tips.title', 'Стажёр · подсказки'),
            text: tw('walkthrough.tier.intern.tips.text',
                'В учебном режиме HR мягче. Если застряли — используйте кнопки ответа в Slack.'),
            target: '#objectives-list'
        });
    } else if (tier === 'junior') {
        const gitNote = taskHasObjective(task, 'PUSH_CODE') || taskHasObjective(task, 'CREATE_PR')
            ? ' В этой задаче есть Push/PR — сделайте до ответа в Slack.'
            : ' Push и PR появятся в других задачах.';
        steps.push({
            title: tw('walkthrough.tier.junior.tips.title', 'Junior · Git'),
            text: tw('walkthrough.tier.junior.tips.text',
                'Run Tests → Commit Fix → при необходимости Push / Create PR в IntelliJ.' + gitNote),
            target: '.app-icon[data-app="ide"]',
            fallback: '.taskbar-app-btn[data-app="ide"]'
        });
    } else if (tier === 'middle') {
        steps.push({
            title: tw('walkthrough.tier.middle.tips.title', 'Middle · несколько задач'),
            text: tw('walkthrough.tier.middle.tips.text',
                'После бага — code review PR коллеги (IntelliJ → Slack → JIRA). Переключайте фокус задачи справа.'),
            target: '#task-list'
        });
    } else if (tier === 'senior') {
        steps.push({
            title: tw('walkthrough.tier.senior.tips.title', 'Senior · приоритеты'),
            text: tw('walkthrough.tier.senior.tips.text',
                'INC на prod важнее фич. Grafana/Docker/K8s — по чеклисту. Code review не блокирует hotfix.'),
            target: '#objectives-list'
        });
    }
    return steps;
}

function buildIdeFixStep(tier, bugTask) {
    const fallbacks = {
        intern: 'Исправьте код по подсказке → Run Tests → Commit Fix. Git и PR на стажировке не нужны.',
        junior: 'Исправьте NPE → Run Tests → Commit Fix. Если в чеклисте Push / PR — сделайте до Slack.',
        middle: 'Фикс → тесты → commit. Push/PR если в чеклисте. Параллельно может ждать code review.',
        senior: 'Быстрый фикс → тесты → push/PR по чеклисту. День загружен — не затягивайте.'
    };
    return {
        title: tw('walkthrough.ide2.title', 'Шаг 4 · IntelliJ — исправление'),
        text: tw(`walkthrough.ide2.${tier}`, fallbacks[tier] || fallbacks.junior),
        target: '.app-icon[data-app="ide"]',
        fallback: '.taskbar-app-btn[data-app="ide"]'
    };
}

function buildCodeReviewWalkthrough(task, standup, meetVisible, tier) {
    const ticket = task.ticketId || 'PR-247';
    const objectives = task.objectives || [];
    const reviewObj = objectives.find(o => o.type === 'REVIEW_CODE');
    const replyObj = objectives.find(o => o.type === 'REPLY_MESSAGE');
    const jiraObj = objectives.find(o => o.type === 'CLOSE_JIRA');
    const authorName = contactLabel(replyObj?.contactId);
    const checklist = objectives.map(o => objectiveLabel(o)).join('\n• ');

    const steps = [
        buildTierIntroStep(tier, task, true),
        {
            title: tw('walkthrough.intro.title', 'Пример: code review'),
            text: tw('walkthrough.cr.intro',
                `Задача ${ticket} — ревью без правки кода.\n`
                + 'Идите строго по чеклисту слева (сверху вниз):\n• ' + checklist),
            target: '#objectives-list'
        }
    ];

    if (standup && workspace?.pendingMeeting && !workspace?.meetingMissedToday) {
        steps.push({
            title: tw('walkthrough.meet.title', 'Daily Standup (11:30)'),
            text: tw('walkthrough.meet.text',
                'Синяя плашка на столе, Outlook → Календарь или иконка Meet. Нажмите «Присоединиться».'),
            target: meetVisible ? '#meeting-reminder-bar' : '.app-icon[data-app="meet"]',
            fallback: '.app-icon[data-app="meet"]'
        });
    }

    const ideStep = reviewObj ? objectiveLabel(reviewObj) : `Посмотреть ${ticket} в IntelliJ (Run tests)`;
    steps.push(
        {
            title: tw('walkthrough.cr.ide.title', 'Шаг · IntelliJ'),
            text: tw('walkthrough.cr.ide.text',
                `Откройте IntelliJ 💻. ${ideStep}`),
            target: '.app-icon[data-app="ide"]',
            fallback: '.taskbar-app-btn[data-app="ide"]'
        },
        {
            title: tw('walkthrough.cr.slack.title', 'Шаг · Slack'),
            text: authorName
                ? tw('walkthrough.cr.slack.named',
                    `Откройте Slack 💬 → диалог «${authorName}» (как в чеклисте). `
                    + 'Нажмите кнопку ответа из списка, например «LGTM, approve ✅» или конструктивный комментарий.')
                : tw('walkthrough.cr.slack.generic',
                    'Откройте Slack 💬 и ответьте контакту из шага «Ответить … в Slack» в чеклисте слева.'),
            target: '.app-icon[data-app="slack"]',
            fallback: '.taskbar-app-btn[data-app="slack"]'
        },
        {
            title: tw('walkthrough.cr.jira.title', 'Шаг · JIRA'),
            text: jiraObj
                ? `JIRA 📋: ${objectiveLabel(jiraObj)}`
                : tw('walkthrough.cr.jira.fallback',
                    `В JIRA откройте ${ticket} и переведите в Done (не GitHub — только JIRA).`),
            target: '.app-icon[data-app="jira"]',
            fallback: '#task-list'
        }
    );

    steps.push(...buildTierExtraSteps(tier, task));

    steps.push({
        title: tw('walkthrough.end.title', 'Готово!'),
        text: tw('walkthrough.end.text',
            'Повторите цикл для остальных задач. Вечером — «Закончить день» справа внизу.'),
        target: '#end-day-btn',
        fallback: '.actions-panel'
    });
    return steps;
}

function buildBugWalkthrough(bugTask, standup, meetVisible, tier) {
    const ticket = bugTask?.ticketId || 'JIRA-142';
    const readObj = bugTask?.objectives?.find(o => o.type === 'READ_MESSAGE');
    const qaId = readObj?.contactId || 'maria';
    const qaName = contactLabel(qaId) || (readObj ? objectiveLabel(readObj).replace(/^Прочитать сообщение от\s+/i, '').replace(/\s+в Slack$/i, '') : null);

    const steps = [
        buildTierIntroStep(tier, bugTask, false),
        {
            title: tw('walkthrough.tasks.title', 'Задачи на день'),
            text: tw('walkthrough.tasks.text',
                'Справа — все задачи. Сначала Daily Standup, затем баг. Клик по задаче откроет JIRA.'),
            target: '#task-list'
        },
        {
            title: tw('walkthrough.objectives.title', 'Чеклист'),
            text: tw('walkthrough.objectives.text',
                'Слева «Активная задача» — ваш план. Выполняйте пункты сверху вниз, пока не станут ✅.'),
            target: '#objectives-list'
        }
    ];

    if (standup && workspace?.pendingMeeting && !workspace?.meetingMissedToday) {
        steps.push({
            title: tw('walkthrough.meet.title', 'Daily Standup (11:30)'),
            text: tw('walkthrough.meet.text',
                'Синяя плашка на столе, Outlook → Календарь или иконка Meet. Нажмите «Присоединиться» и дождитесь конца митинга.'),
            target: meetVisible ? '#meeting-reminder-bar' : '.app-icon[data-app="meet"]',
            fallback: '.app-icon[data-app="meet"]'
        });
    }

    steps.push(
        {
            title: tw('walkthrough.slack1.title', 'Шаг 1 · Slack'),
            text: qaName
                ? tw('walkthrough.slack1.text',
                    `Откройте Slack 💬 (иконка слева или панель внизу). Прочитайте сообщение от ${qaName} про ${ticket}.`)
                : tw('walkthrough.slack1.generic',
                    `Откройте Slack 💬 и выполните шаг «${readObj ? objectiveLabel(readObj) : 'Прочитать сообщение'}» из чеклиста.`),
            target: '.app-icon[data-app="slack"]',
            fallback: '.taskbar-app-btn[data-app="slack"]'
        },
        {
            title: tw('walkthrough.jira1.title', 'Шаг 2 · JIRA'),
            text: tw('walkthrough.jira1.text',
                `Откройте JIRA 📋. Кликните ${ticket} в списке справа — задача возьмётся в работу.`),
            target: '.app-icon[data-app="jira"]',
            fallback: '.taskbar-app-btn[data-app="jira"]'
        },
        {
            title: tw('walkthrough.ide1.title', 'Шаг 3 · IntelliJ — тесты'),
            text: tw('walkthrough.ide1.text',
                'Откройте IntelliJ 💻. Нажмите Run Tests (▶) — в консоли появится ошибка. Это нормально.'),
            target: '.app-icon[data-app="ide"]',
            fallback: '.taskbar-app-btn[data-app="ide"]'
        },
        buildIdeFixStep(tier, bugTask),
        {
            title: tw('walkthrough.slack2.title', 'Шаг 5 · Ответ в Slack'),
            text: qaName
                ? tw('walkthrough.slack2.text',
                    `Вернитесь в Slack. В диалоге «${qaName}» нажмите кнопку ответа из чеклиста.`)
                : tw('walkthrough.slack2.generic',
                    'Вернитесь в Slack и выполните шаг «Ответить … в Slack» из чеклиста слева.'),
            target: '.taskbar-app-btn[data-app="slack"]',
            fallback: '.app-icon[data-app="slack"]'
        },
        {
            title: tw('walkthrough.jira2.title', 'Шаг 6 · Закрыть в JIRA'),
            text: tw('walkthrough.jira2.text',
                `В JIRA откройте ${ticket} → кнопка Done. Когда все ⬜ стали ✅ — задача закрыта.`),
            target: '.app-icon[data-app="jira"]',
            fallback: '#task-list'
        }
    );

    steps.push(...buildTierExtraSteps(tier, bugTask));

    steps.push({
        title: tw('walkthrough.end.title', 'Готово!'),
        text: tw('walkthrough.end.text',
            'Повторите цикл для остальных задач. Вечером — «Закончить день» справа внизу: зарплата и новый день.'),
        target: '#end-day-btn',
        fallback: '.actions-panel'
    });

    return steps;
}

let tutorialActive = false;
let tutorialSteps = [];
let tutorialIndex = 0;
let tutorialPhase = null;
let tutorialResizeObserver = null;

function isTutorialSkipped() {
    return !!loadTutorialState().skipped;
}

function shouldShowIntroTutorial() {
    return !isTutorialSkipped() && !loadTutorialState().intro;
}

function shouldShowTaskTutorial(tier) {
    if (isTutorialSkipped()) return false;
    const t = tier || getCareerTier();
    return !loadTutorialState().tasks?.[t];
}

function isTutorialDone() {
    return isTutorialSkipped();
}

function skipTutorial() {
    const state = loadTutorialState();
    state.skipped = true;
    state.intro = true;
    saveTutorialState(state);
    endTutorial();
}

function completeTutorial() {
    const state = loadTutorialState();
    if (tutorialPhase === 'task') {
        state.tasks = state.tasks || {};
        state.tasks[getCareerTier()] = true;
    } else {
        state.intro = true;
    }
    saveTutorialState(state);
    endTutorial();
}

function shouldShowTutorial() {
    return shouldShowIntroTutorial();
}

function stepsForPhase(phase) {
    if (phase === 'office') return OFFICE_STEPS;
    if (phase === 'desktop') return DESKTOP_STEPS;
    return buildTaskWalkthroughSteps();
}

function startTutorial(phase) {
    if (phase === 'task') {
        if (!shouldShowTaskTutorial(getCareerTier())) return;
    } else if (!shouldShowIntroTutorial()) {
        return;
    }

    if (phase === 'desktop' || phase === 'task') {
        const state = loadTutorialState();
        state.intro = true;
        saveTutorialState(state);
    }

    tutorialPhase = phase;
    tutorialSteps = stepsForPhase(phase);
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

function resolveTutorialTarget(step) {
    if (!step) return null;
    if (typeof step === 'string') return step;
    const candidates = [step.target, step.fallback].filter(Boolean);
    for (const sel of candidates) {
        const el = document.querySelector(sel);
        if (el && isElementVisible(el)) return sel;
    }
    return step.target || null;
}

function renderTutorialStep(animate = true) {
    if (tutorialPhase === 'task') {
        tutorialSteps = buildTaskWalkthroughSteps();
    }

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
    if (tutorialPhase === 'task' && isLast) {
        nextBtn.textContent = tw('walkthrough.startPlay', 'Понятно, начинаю! ✓');
    } else if (tutorialPhase === 'desktop' && isLast) {
        nextBtn.textContent = tw('walkthrough.toExample', 'К примеру задачи →');
    } else {
        nextBtn.textContent = isLast ? tw('tutorial.nextDone', 'Понятно ✓') : tw('tutorial.next', 'Далее →');
    }

    const target = resolveTutorialTarget(step);

    if (!animate) spotlight.style.transition = 'none';
    positionTutorialSpotlight(target);
    positionTutorialCard(target, card);
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
            if (shouldShowTaskTutorial(getCareerTier())) {
                startTutorial('task');
            } else {
                endTutorial();
            }
            return;
        }
        if (tutorialPhase === 'task') {
            completeTutorial();
            return;
        }
        endTutorial();
        return;
    }

    tutorialIndex++;
    renderTutorialStep();
}

function maybeStartOfficeTutorial() {
    if (!shouldShowIntroTutorial()) return;
    const arrival = document.getElementById('arrival-screen');
    if (!arrival || arrival.classList.contains('hidden')) return;
    setTimeout(() => startTutorial('office'), 500);
}

async function maybeStartDesktopTutorial() {
    const game = document.getElementById('game-screen');
    if (!game || game.classList.contains('hidden')) return;

    const bug = findFirstWorkTask();
    if (bug && workspace?.focusedTaskId !== bug.id && typeof api === 'function') {
        try {
            ws(await api('/task/focus', { method: 'POST', body: JSON.stringify({ taskId: bug.id }) }));
        } catch (_) { /* noop */ }
    }

    if (shouldShowIntroTutorial()) {
        setTimeout(() => startTutorial('desktop'), 700);
    } else {
        maybeStartTaskTutorial();
    }
}

function maybeStartTaskTutorial() {
    if (!shouldShowTaskTutorial(getCareerTier())) return;
    const game = document.getElementById('game-screen');
    if (!game || game.classList.contains('hidden')) return;

    const bug = findFirstWorkTask();
    if (bug && workspace?.focusedTaskId !== bug.id && typeof api === 'function') {
        api('/task/focus', { method: 'POST', body: JSON.stringify({ taskId: bug.id }) })
            .then(ws)
            .catch(() => {})
            .finally(() => setTimeout(() => startTutorial('task'), 700));
        return;
    }
    setTimeout(() => startTutorial('task'), 700);
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
    shouldShowTaskTutorial,
    getCareerTier,
    maybeStartOfficeTutorial,
    maybeStartDesktopTutorial,
    maybeStartTaskTutorial,
    skipTutorial,
    isActive: () => tutorialActive
};
