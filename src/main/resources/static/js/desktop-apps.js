/** Реестр приложений рабочего стола и их UI */
const DESKTOP_APPS = [
    { id: 'meet', label: 'Meet', emoji: '📹', loadMs: 1200, loadText: 'Google Meet — connecting…' },
    { id: 'slack', label: 'Slack', emoji: '💬', loadMs: 1400, loadText: 'Подключение к workspace…', badge: 'slack-badge' },
    { id: 'ide', label: 'IntelliJ', emoji: '💻', loadMs: 2800, loadText: 'IntelliJ — индексация проекта…' },
    { id: 'jira', label: 'JIRA', emoji: '📋', loadMs: 1600, loadText: 'Загрузка backlog…' },
    { id: 'github', label: 'GitHub', emoji: '🐙', loadMs: 2000, loadText: 'Fetching pull requests…' },
    { id: 'confluence', label: 'Confluence', emoji: '📘', loadMs: 1200, loadText: 'Loading wiki…' },
    { id: 'portal', label: 'Портал', emoji: '🏢', loadMs: 900, loadText: 'Employee portal — SSO…' },
    { id: 'postman', label: 'Postman', emoji: '🚀', loadMs: 1100, loadText: 'Syncing collections…' },
    { id: 'swagger', label: 'Swagger UI', emoji: '📜', loadMs: 900, loadText: 'Loading OpenAPI spec…' },
    { id: 'kafka', label: 'Kafka', emoji: '📨', loadMs: 1800, loadText: 'Подключение к кластеру…' },
    { id: 'rabbitmq', label: 'RabbitMQ', emoji: '🐰', loadMs: 1400, loadText: 'Management UI — connecting…' },
    { id: 'bus', label: 'ESB / Шина', emoji: '🔀', loadMs: 1500, loadText: 'Загрузка маршрутов…' },
    { id: 'grafana', label: 'Grafana', emoji: '📊', loadMs: 1700, loadText: 'Loading dashboards…' },
    { id: 'prometheus', label: 'Prometheus', emoji: '🔥', loadMs: 1600, loadText: 'Connecting to prometheus.prod:9090…' },
    { id: 'sentry', label: 'Sentry', emoji: '🐛', loadMs: 1300, loadText: 'Loading issues…' },
    { id: 'elastic', label: 'Elasticsearch', emoji: '🔍', loadMs: 1600, loadText: 'Connecting to cluster…' },
    { id: 'opensearch', label: 'OpenSearch', emoji: '🔎', loadMs: 1600, loadText: 'OpenSearch Dashboards…' },
    { id: 'docker', label: 'Docker', emoji: '🐳', loadMs: 1300, loadText: 'Docker Desktop starting…' },
    { id: 'kubernetes', label: 'Kubernetes', emoji: '☸️', loadMs: 2000, loadText: 'kubectl config use-context…' },
    { id: 'redis', label: 'Redis Insight', emoji: '🟥', loadMs: 900, loadText: 'Redis Insight — connecting…' },
    { id: 'postgres', label: 'pgAdmin', emoji: '🐘', loadMs: 1400, loadText: 'pgAdmin 4 — connect…' },
    { id: 'dbeaver', label: 'DBeaver', emoji: '🦫', loadMs: 2000, loadText: 'DBeaver CE — loading JDBC drivers…' },
    { id: 'mongodb', label: 'Compass', emoji: '🍃', loadMs: 1500, loadText: 'MongoDB Compass connecting…' },
    { id: 'cassandra', label: 'Cassandra', emoji: '🔮', loadMs: 1600, loadText: 'DataStax Studio — CQL…' },
    { id: 'couchbase', label: 'Couchbase', emoji: '🛋', loadMs: 1400, loadText: 'Couchbase Web Console…' },
    { id: 'dynamodb', label: 'DynamoDB', emoji: '⚡', loadMs: 1300, loadText: 'AWS DynamoDB Console…' },
    { id: 'clickhouse', label: 'ClickHouse', emoji: '📈', loadMs: 1200, loadText: 'ClickHouse Play…' },
    { id: 'neo4j', label: 'Neo4j', emoji: '⬡', loadMs: 1400, loadText: 'Neo4j Browser…' },
    { id: 'jenkins', label: 'Jenkins', emoji: '🤖', loadMs: 1500, loadText: 'Loading build queue…' },
    { id: 'gitlab', label: 'GitLab CI', emoji: '🦊', loadMs: 1800, loadText: 'Loading pipelines…' },
    { id: 'helm', label: 'Helm', emoji: '⎈', loadMs: 1200, loadText: 'helm list -A…' },
    { id: 'terraform', label: 'Terraform', emoji: '🏗', loadMs: 2000, loadText: 'terraform init…' },
    { id: 'nginx', label: 'Nginx', emoji: '🌐', loadMs: 800, loadText: 'nginx -t…' },
    { id: 'vault', label: 'Vault', emoji: '🔐', loadMs: 1500, loadText: 'Authenticating to Vault…' },
    { id: 'rdp', label: 'Remote Desktop', emoji: '🖥', loadMs: 2200, loadText: 'Connecting via jump host…' },
    { id: 'vpn', label: 'VPN', emoji: '🔒', loadMs: 1600, loadText: 'WireGuard handshake…' },
    { id: 'terminal', label: 'Terminal', emoji: '⌨️', loadMs: 800, loadText: 'Starting shell…' },
    { id: 'kitty', label: 'Kitty', emoji: '🐱', loadMs: 700, loadText: 'kitty — GPU terminal…' },
    { id: 'word', label: 'Word', emoji: '📝', loadMs: 1000, loadText: 'Microsoft Word…' },
    { id: 'excel', label: 'Excel', emoji: '📗', loadMs: 1000, loadText: 'Microsoft Excel…' },
    { id: 'email', label: 'Outlook', emoji: '📧', loadMs: 1500, loadText: 'Syncing inbox…' }
];

const PINNED_DESKTOP = ['slack', 'ide', 'jira', 'portal', 'meet', 'email', 'terminal', 'docker'];
const TASKBAR_PINNED = ['slack', 'ide', 'jira', 'meet'];

const START_MENU_GROUPS = [
    { title: 'Работа', ids: ['portal', 'slack', 'ide', 'jira', 'github', 'confluence', 'meet', 'postman', 'swagger'] },
    { title: 'DevOps', ids: ['docker', 'kubernetes', 'jenkins', 'gitlab', 'helm', 'terraform', 'nginx', 'rdp', 'vpn'] },
    { title: 'Messaging', ids: ['kafka', 'rabbitmq', 'bus'] },
    { title: 'SQL & IDE', ids: ['dbeaver', 'postgres'] },
    { title: 'NoSQL & Cache', ids: ['mongodb', 'cassandra', 'couchbase', 'dynamodb', 'clickhouse', 'neo4j', 'redis'] },
    { title: 'Мониторинг', ids: ['prometheus', 'grafana', 'sentry', 'elastic', 'opensearch'] },
    { title: 'Терминалы', ids: ['kitty', 'terminal', 'vault'] },
    { title: 'Офис', ids: ['word', 'excel', 'email'] }
];

function getDesktopApp(id) {
    return DESKTOP_APPS.find(a => a.id === id);
}

function buildDesktopIcons(onOpen) {
    const container = document.getElementById('desktop-icons');
    if (!container) return;
    container.innerHTML = '';
    PINNED_DESKTOP.forEach(id => {
        const app = getDesktopApp(id);
        if (!app) return;
        container.appendChild(createAppIconButton(app, onOpen));
    });
}

function buildTaskbarPinned(onOpen) {
    const container = document.getElementById('taskbar-pinned');
    if (!container) return;
    container.innerHTML = '';
    TASKBAR_PINNED.forEach(id => {
        const app = getDesktopApp(id);
        if (!app) return;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'taskbar-app-btn';
        btn.dataset.app = app.id;
        btn.title = app.label;
        btn.innerHTML = `<span class="taskbar-app-emoji">${app.emoji}</span>`;
        if (app.badge) {
            btn.innerHTML += `<span id="tb-${app.badge}" class="taskbar-badge hidden">0</span>`;
        }
        btn.onclick = () => {
            if (typeof focusOrOpenApp === 'function') {
                focusOrOpenApp(app.id, onOpen);
            } else {
                onOpen(app.id);
            }
        };
        container.appendChild(btn);
    });
}

function buildStartMenu(onOpen) {
    const container = document.getElementById('start-menu-apps');
    if (!container) return;
    container.innerHTML = '';
    START_MENU_GROUPS.forEach(group => {
        const section = document.createElement('div');
        section.className = 'start-menu-section';
        section.dataset.group = group.title;
        const title = document.createElement('h3');
        title.className = 'start-menu-section-title';
        title.textContent = group.title;
        section.appendChild(title);
        const grid = document.createElement('div');
        grid.className = 'start-menu-grid';
        group.ids.forEach(id => {
            const app = getDesktopApp(id);
            if (!app) return;
            grid.appendChild(createStartMenuTile(app, onOpen));
        });
        section.appendChild(grid);
        container.appendChild(section);
    });
}

function createAppIconButton(app, onOpen) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'app-icon';
    btn.dataset.app = app.id;
    btn.title = app.label;
    btn.innerHTML = `<span class="app-emoji">${app.emoji}</span><span class="app-label">${app.label}</span>`;
    if (app.badge) {
        btn.innerHTML += `<span id="${app.badge}" class="badge hidden">0</span>`;
    }
    btn.onclick = () => onOpen(app.id);
    return btn;
}

function createStartMenuTile(app, onOpen) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'start-menu-tile';
    btn.dataset.app = app.id;
    btn.dataset.label = app.label.toLowerCase();
    btn.innerHTML = `<span class="start-tile-emoji">${app.emoji}</span><span class="start-tile-label">${app.label}</span>`;
    btn.onclick = () => {
        closeStartMenu();
        onOpen(app.id);
    };
    return btn;
}

function filterStartMenu(query) {
    const q = (query || '').trim().toLowerCase();
    document.querySelectorAll('.start-menu-tile').forEach(tile => {
        const label = tile.dataset.label || '';
        const appId = tile.dataset.app || '';
        const match = !q || label.includes(q) || appId.includes(q);
        tile.classList.toggle('hidden', !match);
    });
    document.querySelectorAll('.start-menu-section').forEach(section => {
        const visible = section.querySelectorAll('.start-menu-tile:not(.hidden)').length;
        section.classList.toggle('hidden', q.length > 0 && visible === 0);
    });
}

function toggleStartMenu() {
    const menu = document.getElementById('start-menu');
    if (!menu) return;
    menu.classList.toggle('hidden');
    if (!menu.classList.contains('hidden')) {
        const search = document.getElementById('start-search');
        if (search) {
            search.value = '';
            filterStartMenu('');
            search.focus();
        }
    }
}

function closeStartMenu() {
    document.getElementById('start-menu')?.classList.add('hidden');
}

function syncTaskbarActive(focusedId, openIds) {
    const open = openIds || (typeof openWindows !== 'undefined' ? [...openWindows.keys()] : []);
    document.querySelectorAll('.taskbar-app-btn').forEach(btn => {
        const app = btn.dataset.app;
        btn.classList.toggle('active', !!focusedId && app === focusedId);
        btn.classList.toggle('open', open.includes(app));
    });
}

function focusOrOpenApp(appId, onOpen) {
    if (typeof openWindows !== 'undefined' && openWindows.has(appId)) {
        const state = openWindows.get(appId);
        if (state.minimized) {
            state.minimized = false;
            state.el.classList.remove('minimized');
        }
        if (typeof focusWindow === 'function') focusWindow(appId);
    } else if (onOpen) {
        onOpen(appId);
    }
}

const PROJECT_WALLPAPERS = {
    E_COMMERCE: { label: 'ShopFlow · E-commerce', accent: '🛒' },
    FINTECH: { label: 'PaySecure · FinTech', accent: '💳' },
    STARTUP: { label: 'QuickLaunch · Startup', accent: '🚀' },
    ENTERPRISE: { label: 'MegaCore · Enterprise', accent: '🏢' },
    EDTECH: { label: 'LearnHub · EdTech', accent: '📚' }
};

const WALLPAPER_COUNT = 10;
const WALLPAPER_ROTATION_KEY = 'devdaily-wallpaper-rotation';

function nextWallpaperIndex() {
    const idx = parseInt(localStorage.getItem(WALLPAPER_ROTATION_KEY) || '0', 10) % WALLPAPER_COUNT;
    localStorage.setItem(WALLPAPER_ROTATION_KEY, String((idx + 1) % WALLPAPER_COUNT));
    return idx;
}

function applyDesktopWallpaper(projectType, emoji, company) {
    const wp = document.getElementById('desktop-wallpaper');
    const wm = document.getElementById('desktop-watermark');
    const desktop = document.getElementById('workspace-desktop');
    if (!wp) return;

    const type = projectType || 'E_COMMERCE';
    const raw = workspace?.wallpaperIndex ?? 0;
    const idx = ((raw % WALLPAPER_COUNT) + WALLPAPER_COUNT) % WALLPAPER_COUNT;
    wp.className = 'desktop-wallpaper wallpaper-' + idx;
    wp.style.background = '';
    if (desktop) desktop.dataset.project = type;

    const meta = PROJECT_WALLPAPERS[type] || PROJECT_WALLPAPERS.E_COMMERCE;
    if (wm) {
        wm.textContent = emoji || meta.accent;
        wm.title = company || meta.label;
    }
}

function getTrashItems() {
    const key = 'devdaily-trash-' + (workspace?.player?.day || 1);
    try {
        const saved = sessionStorage.getItem(key);
        if (saved) return JSON.parse(saved);
    } catch (_) { /* ignore */ }
    return [
        { id: 't1', name: 'old_checkout_v1.sql', deletedAt: 'вчера', hint: 'Legacy миграция' },
        { id: 't2', name: 'debug_heapdump.hprof', deletedAt: '3 дня назад', hint: '2.1 GB — не восстанавливать' },
        { id: 't3', name: 'draft_standup_notes.txt', deletedAt: 'сегодня', hint: 'Черновик daily' }
    ];
}

function saveTrashItems(items) {
    const key = 'devdaily-trash-' + (workspace?.player?.day || 1);
    sessionStorage.setItem(key, JSON.stringify(items));
}

function renderRecycleBin(container) {
    const items = getTrashItems();
    container.innerHTML = appShell('🗑 Корзина', `${items.length} объект(ов) · DevOS`, '');
    const body = container.querySelector('.app-body');

    if (!items.length) {
        body.innerHTML = '<p class="hint-text">Корзина пуста</p>';
    } else {
        items.forEach(item => {
            const row = document.createElement('div');
            row.className = 'recycle-item';
            row.innerHTML = `<span class="recycle-icon">📄</span>
                <div class="recycle-info"><strong>${item.name}</strong>
                <small>Удалено: ${item.deletedAt}${item.hint ? ' · ' + item.hint : ''}</small></div>`;
            body.appendChild(row);
        });
    }

    addLimitedActions(container, [
        { text: '♻ Восстановить draft_standup_notes.txt', disabled: !items.find(i => i.name.includes('standup')),
            action: () => {
                pushNotification('🗑 Корзина', 'Восстановлено', 'draft_standup_notes.txt → Рабочий стол', 'slack');
                openAppWindow('word');
            }},
        { text: '🗑 Очистить корзину', disabled: !items.length, action: () => {
            saveTrashItems([]);
            renderRecycleBin(container);
            pushNotification('🗑 Корзина', 'Очищено', 'Все элементы удалены безвозвратно', 'slack');
        }},
        { text: '🚫 Удалить heapdump навсегда', action: () => {
            const next = items.filter(i => !i.name.includes('heapdump'));
            saveTrashItems(next);
            renderRecycleBin(container);
        }}
    ]);
}

function updateRecycleBadge() {
    const btn = document.getElementById('desktop-recycle');
    if (!btn) return;
    const count = getTrashItems().length;
    let badge = btn.querySelector('.recycle-badge');
    if (count > 0) {
        if (!badge) {
            badge = document.createElement('span');
            badge.className = 'badge recycle-badge';
            btn.appendChild(badge);
        }
        badge.textContent = count;
        badge.classList.remove('hidden');
    } else if (badge) {
        badge.classList.add('hidden');
    }
}

function appShell(title, meta, bodyHtml) {
    return `<h3 class="app-section-title">${title}</h3>
        ${meta ? `<p class="app-meta">${meta}</p>` : ''}
        <div class="app-body">${bodyHtml}</div>`;
}

function mountBrandedApp(container, brandClass, toolbarHtml, mainHtml) {
    container.innerHTML = '';
    const root = document.createElement('div');
    root.className = 'brand-app ' + brandClass;
    root.innerHTML = `<header class="brand-toolbar">${toolbarHtml}</header><div class="brand-main">${mainHtml}</div>`;
    container.appendChild(root);
    return root;
}

function addLimitedActions(container, actions) {
    const wrap = document.createElement('div');
    wrap.className = 'limited-actions';
    actions.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'limited-btn';
        btn.textContent = opt.text;
        btn.disabled = !!opt.disabled;
        if (!opt.disabled && opt.action) btn.onclick = opt.action;
        wrap.appendChild(btn);
    });
    container.appendChild(wrap);
}

function taskActive(ticketId) {
    return workspace?.tasks?.some(t => t.ticketId === ticketId && !t.completed);
}

function taskByTag(tag) {
    return workspace?.tasks?.find(t => t.scenarioTag === tag && !t.completed);
}

function taskActiveByTag(tag) {
    return !!taskByTag(tag);
}

function taskActiveAnyTag(...tags) {
    return tags.some(taskActiveByTag);
}

function getActiveJavaBug() {
    return workspace?.tasks?.find(t => t.scenarioTag?.startsWith('JAVA_') && t.code && !t.completed);
}

function hasActiveJavaBug() {
    return !!getActiveJavaBug();
}

function getActiveIncidentTask(...tags) {
    return workspace?.tasks?.find(t => tags.includes(t.scenarioTag) && !t.completed);
}

function getTaskByTicket(ticketId) {
    return workspace?.tasks?.find(t => t.ticketId === ticketId);
}

/** Фокус задачи + IntelliJ. Возвращает false, если задачи нет или у неё нет кода. */
async function focusTaskByTicket(ticketId, openIde = true) {
    if (!ticketId) return false;
    const task = getTaskByTicket(ticketId);
    if (!task?.code) return false;
    const resp = await api('/task/focus', { method: 'POST', body: JSON.stringify({ taskId: task.id }) });
    ws(resp);
    if (openIde) openAppWindow('ide');
    return resp.success !== false;
}

async function focusActiveJavaBug() {
    const t = getActiveJavaBug();
    return t ? focusTaskByTicket(t.ticketId) : false;
}

async function focusJira142IfActive() {
    return focusActiveJavaBug();
}

async function focusCheckoutErrorTask() {
    if (taskActiveByTag('RACE_CONDITION')) return focusTaskByTicket(taskByTag('RACE_CONDITION').ticketId);
    const javaBug = getActiveJavaBug();
    if (javaBug) return focusTaskByTicket(javaBug.ticketId);
    if (taskActiveByTag('MEMORY_LEAK')) return focusTaskByTicket(taskByTag('MEMORY_LEAK').ticketId);
    if (taskActiveByTag('KAFKA_CONSUMER')) return focusTaskByTicket(taskByTag('KAFKA_CONSUMER').ticketId);
    return false;
}

function resolveCheckoutIncidentTicket() {
    const t = getActiveIncidentTask('RACE_CONDITION', 'MEMORY_LEAK', 'KAFKA_CONSUMER')
        || getActiveJavaBug();
    return t?.ticketId || null;
}

/** Подсказка об инциденте без автo-открытия IDE (Swagger, Postman). */
function hintCheckoutIncident(appLabel) {
    const ticket = resolveCheckoutIncidentTicket();
    if (!ticket) return;
    pushNotification(appLabel, '500 /checkout',
        `${ticket} — нажмите, чтобы открыть fix в IntelliJ`, 'warning',
        () => focusTaskByTicket(ticket));
}

function hintDbInvestigation(appLabel) {
    const bug = getActiveJavaBug();
    if (!bug) {
        pushNotification(appLabel, 'Query', 'Данные получены', 'slack');
        return;
    }
    pushNotification(appLabel, 'customerId NULL',
        `${bug.ticketId} — нажмите, чтобы открыть fix в IntelliJ`, 'warning',
        () => focusTaskByTicket(bug.ticketId));
}

async function focusActiveCodeTask() {
    const tags = ['RACE_CONDITION', 'MEMORY_LEAK', 'KAFKA_CONSUMER', 'TRANSACTIONAL_TRAP'];
    for (const tag of tags) {
        const t = taskByTag(tag);
        if (t?.code) {
            const ok = await focusTaskByTicket(t.ticketId);
            if (ok) return true;
        }
    }
    const javaBug = getActiveJavaBug();
    if (javaBug) return focusTaskByTicket(javaBug.ticketId);
    return false;
}

function notifyOpsRequest(app, title, body) {
    pushNotification(app, title, body, 'slack');
}

function getK8sPodFullName(shortName) {
    const map = {
        'checkout-api': 'checkout-api-7d4f9b6c4-xk2mj',
        'payment-svc': 'payment-svc-6c2a1b8f5-h7dnp',
        'integration-tests': 'integration-tests-job-8f3k2',
        'kafka': 'kafka-0'
    };
    return map[shortName] || shortName;
}

function getKubectlGetPodsOutput() {
    const hasOom = taskActiveByTag('MEMORY_LEAK');
    const hasInc501 = taskActiveByTag('RACE_CONDITION');
    const hasKafka = taskActiveByTag('KAFKA_CONSUMER');
    const checkoutStatus = hasOom ? 'OOMKilled' : 'Running';
    const checkoutReady = hasOom ? '0/1' : '1/1';
    const paymentStatus = hasInc501 ? 'CrashLoopBackOff' : 'Running';
    const paymentReady = hasInc501 ? '0/1' : '1/1';
    const jobStatus = hasKafka ? 'Error' : 'Completed';
    const jobReady = hasKafka ? '0/1' : '0/1';
    return [
        'NAME                                   READY   STATUS             RESTARTS   AGE     IP            NODE',
        `checkout-api-7d4f9b6c4-xk2mj           ${checkoutReady}     ${checkoutStatus.padEnd(18)} ${String(hasOom ? 3 : 0).padStart(3)}      2d1h    10.42.1.15    worker-03`,
        `payment-svc-6c2a1b8f5-h7dnp            ${paymentReady}     ${paymentStatus.padEnd(18)} ${String(hasInc501 ? 5 : 0).padStart(3)}      47m     10.42.1.22    worker-01`,
        'kafka-0                                1/1     Running            0          14d     10.42.2.8     worker-02',
        `integration-tests-job-8f3k2           ${jobReady}     ${jobStatus.padEnd(18)} 0          3m      10.42.1.44    worker-01`
    ].join('\n');
}

function setK8sTerminal(cmd, output, footer, scope) {
    const base = scope || document;
    const el = base.querySelector('#k8s-terminal');
    if (!el) return;
    let text = `$ ${cmd}\n${output}`;
    if (footer) text += `\n\n${footer}`;
    el.textContent = text;
    const cmdEl = base.querySelector('#k8s-cmdline');
    if (cmdEl) cmdEl.textContent = `$ ${cmd}`;
}

function wireK8sApp(root, ctx) {
    const { hasOom, hasInc501, hasKafka } = ctx;
    const term = (cmd, out, foot) => setK8sTerminal(cmd, out, foot, root);
    const status = (text) => {
        const el = root.querySelector('#k8s-status');
        if (el) el.textContent = text;
    };

    root.querySelectorAll('[data-k8s-nav]').forEach(el => {
        el.addEventListener('click', () => {
            root.querySelectorAll('[data-k8s-nav]').forEach(n => n.classList.remove('active'));
            el.classList.add('active');
            const nav = el.dataset.k8sNav;
            if (nav === 'overview') {
                term('kubectl get nodes', 'NAME          STATUS   ROLES           AGE\nworker-01     Ready    worker          120d\nworker-02     Ready    worker          120d\nworker-03     Ready    worker          118d');
                status('Cluster overview · 3 nodes Ready');
            } else if (nav === 'pods') {
                term('kubectl get pods -n checkout -o wide', getKubectlGetPodsOutput());
                status('Workloads → Pods');
            } else if (nav === 'deployments') {
                term('kubectl get deploy -n checkout', 'NAME            READY   UP-TO-DATE   AVAILABLE\ncheckout-api    1/1     1            1\payment-svc     0/1     1            0\nkafka           1/1     1            1');
                status('Workloads → Deployments');
            } else if (nav === 'statefulsets') {
                term('kubectl get sts -n checkout', 'NAME    READY   AGE\nkafka   1/1     14d');
                status('Workloads → StatefulSets');
            } else if (nav === 'jobs') {
                term('kubectl get jobs -n checkout', `NAME                        COMPLETIONS   DURATION   AGE\nintegration-tests-job-8f3k   0/1           3m         3m`);
                status('Workloads → Jobs');
            } else if (nav === 'services') {
                term('kubectl get svc -n checkout', 'NAME            TYPE        CLUSTER-IP     PORT(S)\ncheckout-api    ClusterIP   10.43.12.10    8080/TCP\npayment-svc     ClusterIP   10.43.12.11    8081/TCP');
                status('Network → Services');
            } else if (nav === 'storage') {
                term('kubectl get pvc -n checkout', 'NAME           STATUS   VOLUME          CAPACITY\nkafka-data     Bound    pvc-kafka-01    50Gi');
                status('Storage → PVC');
            } else if (nav === 'config') {
                term('kubectl get cm -n checkout', 'NAME               DATA   AGE\ncheckout-config    4      14d');
                status('Config → ConfigMaps');
            }
        });
    });

    root.querySelectorAll('[data-k8s-action]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (btn.disabled) return;
            const action = btn.dataset.k8sAction;
            if (action === 'get-pods') {
                term('kubectl get pods -n checkout -o wide', getKubectlGetPodsOutput());
                status('Listed pods in checkout');
            } else if (action === 'logs-payment') {
                showK8sPodLogs('payment-svc', root);
                status('Logs payment-svc → см. терминал');
            } else if (action === 'logs-checkout') {
                showK8sPodLogs('checkout-api', root);
                status('Logs checkout-api → см. терминал');
            } else if (action === 'top') {
                term('kubectl top pods -n checkout', getK8sTopPodsText());
                if (hasOom) opsAction('kubernetes', 'oom-status');
                status('Metrics top pods');
            } else if (action === 'describe-payment' && hasInc501) {
                term('kubectl describe pod payment-svc-6c2a1b8f5-h7dnp -n checkout',
                    `Name:             payment-svc-6c2a1b8f5-h7dnp\nNamespace:        checkout\nRestart Count:    5\nEvents:\n  Warning  BackOff  kubelet  Back-off restarting failed container`);
                status('Describe payment-svc pod');
            } else if (action === 'logs-job' && hasKafka) {
                showK8sPodLogs('integration-tests', root);
                status('Logs integration-tests job');
            } else if (action === 'rollout') {
                const deploy = hasOom ? 'checkout-api' : 'payment-svc';
                const podFull = getK8sPodFullName(hasOom ? 'checkout-api' : 'payment-svc');
                const st = hasOom ? 'OOMKilled' : hasInc501 ? 'CrashLoopBackOff' : 'Running';
                const restarts = hasOom ? '4' : hasInc501 ? '6' : '0';
                const output = `deployment.apps/${deploy} restarted\n\n`
                    + getKubectlGetPodsOutput().split('\n').slice(0, 1).join('\n') + '\n'
                    + `${podFull}            0/1     ${st.padEnd(18)} ${restarts.padStart(3)}      12s     10.42.1.22    worker-01`;
                const warn = hasOom
                    ? 'Warning: pod OOMKilled again — fix heap leak before next deploy'
                    : hasInc501
                        ? 'Warning: pod still CrashLoopBackOff — restart не устраняет race condition'
                        : null;
                term(`kubectl rollout restart deployment/${deploy} -n checkout`, output, warn);
                pushNotification('kubectl', 'rollout restart', `deployment/${deploy} restarted`, hasOom || hasInc501 ? 'warning' : 'slack');
                status(`Rollout restart ${deploy}`);
            } else if (action === 'heap-dump' && hasOom) {
                term('kubectl exec checkout-api-7d4f9b6c4-xk2mj -n checkout -- jcmd 1 GC.heap_dump /tmp/heap.hprof',
                    'Heap dump file created /tmp/heap.hprof (412 MB)\nCopied to s3://checkout-dumps/heap-20260625.hprof');
                opsAction('kubernetes', 'heap-dump');
                status('Heap dump captured');
            } else if (action === 'oom-events' && hasOom) {
                term('kubectl get events -n checkout --field-selector reason=OOMKilling',
                    'LAST SEEN   TYPE      REASON       OBJECT                          MESSAGE\n'
                    + '2m          Warning   OOMKilling   pod/checkout-api-7d4f9b6c4-xk2mj   Memory cgroup out of memory');
                opsAction('kubernetes', 'oom-status');
                status('OOM events listed');
            } else if (action === 'grafana') {
                openAppWindow('grafana');
            }
        });
    });
}

function getK8sAlertBanner() {
    if (taskActiveByTag('MEMORY_LEAK')) return 'SEV-1: OOMKilled checkout-api — heap leak в UserCacheService';
    if (taskActiveByTag('RACE_CONDITION')) return 'SEV-1: 500 on /checkout — race condition в PaymentService';
    if (hasActiveJavaBug()) return 'SEV-1: 500 on /checkout — NPE in OrderService';
    if (taskActiveByTag('KAFKA_CONSUMER')) return 'SEV-2: integration tests — consumer lag / 504 upstream';
    return '';
}

function resolveTicketForPod(podName) {
    switch (podName) {
        case 'checkout-api':
            if (taskActiveByTag('MEMORY_LEAK')) return taskByTag('MEMORY_LEAK')?.ticketId;
            if (hasActiveJavaBug()) return getActiveJavaBug()?.ticketId;
            return null;
        case 'payment-svc':
            return taskActiveByTag('RACE_CONDITION') ? taskByTag('RACE_CONDITION')?.ticketId : null;
        case 'integration-tests':
            return taskActiveByTag('KAFKA_CONSUMER') ? taskByTag('KAFKA_CONSUMER')?.ticketId : null;
        default:
            return null;
    }
}

function getPodLogs(podName) {
    const hasOom = taskActiveByTag('MEMORY_LEAK');
    const hasInc501 = taskActiveByTag('RACE_CONDITION');
    const hasKafka = taskActiveByTag('KAFKA_CONSUMER');
    const hasJira142 = hasActiveJavaBug();

    switch (podName) {
        case 'checkout-api':
            if (hasOom) {
                return 'java.lang.OutOfMemoryError: Java heap space\n'
                    + ' at UserCacheService.getUser(UserCacheService.java:12)\n'
                    + 'Container killed: OOMKilled (exit 137)';
            }
            if (hasJira142) {
                return 'NullPointerException at OrderService.processPayment:42\n'
                    + '  customer.getEmail() — customer is null';
            }
            return 'Started CheckoutApplication in 4.2s\nActuator health: UP';
        case 'payment-svc':
            if (hasInc501) {
                return 'ERROR RaceConditionTest.testConcurrentUpdates\n'
                    + '  expected balance 1000 but was 847\n'
                    + '  at PaymentService.process(PaymentService.java:8)';
            }
            return 'Started PaymentServiceApplication in 4.1s\nActuator health: UP';
        case 'integration-tests':
            if (hasKafka) {
                return 'KafkaConsumerIT.testOrderFlow FAILED\n'
                    + '  payment-gateway: 504 Gateway Timeout\n'
                    + '  consumer lag still growing';
            }
            return 'BUILD SUCCESS — all integration tests passed';
        default:
            return '--- no logs ---';
    }
}

/** Подсказка после логов K8s/Docker — IDE только по клику на уведомление. */
function hintK8sLogs(appLabel, podName, ticket) {
    if (!ticket) return;
    pushNotification(appLabel, podName,
        `${ticket} — инцидент в логах. Нажмите, чтобы открыть fix в IntelliJ`, 'warning',
        () => focusTaskByTicket(ticket));
}

async function showK8sPodLogs(podName, scope) {
    const base = scope || document;
    const podFull = getK8sPodFullName(podName);
    const cmd = `kubectl logs ${podFull} -n checkout --tail=80`;
    setK8sTerminal(cmd, getPodLogs(podName), null, base);

    const ticket = resolveTicketForPod(podName);
    if (ticket) {
        await focusTaskByTicket(ticket, false);
        hintK8sLogs('☸ kubectl', podName, ticket);
    }
}

function getK8sTopPodsText() {
    const hasOom = taskActiveByTag('MEMORY_LEAK');
    const hasInc501 = taskActiveByTag('RACE_CONDITION');
    return [
        'NAME                                   CPU(cores)   MEMORY(bytes)',
        `checkout-api-7d4f9b6c4-xk2mj           45m          ${hasOom ? '1980Mi' : '512Mi'}`,
        `payment-svc-6c2a1b8f5-h7dnp            ${hasInc501 ? '890m' : '120m'}         ${hasInc501 ? '1242Mi' : '384Mi'}`,
        'kafka-0                                210m         768Mi'
    ].join('\n');
}

async function opsAction(appId, actionId) {
    const resp = await api('/ops/action', {
        method: 'POST',
        body: JSON.stringify({ appId, actionId })
    });
    ws(resp);
}

function renderMetricChart(values, alertFrom, label, unit) {
    const max = Math.max(...values, 1);
    const w = 280;
    const h = 72;
    const pts = values.map((v, i) => {
        const x = (i / (values.length - 1)) * w;
        const y = h - (v / max) * (h - 8) - 4;
        return `${x},${y}`;
    }).join(' ');
    const alertY = alertFrom != null ? h - (alertFrom / max) * (h - 8) - 4 : null;
    return `<div class="metric-chart-wrap">
        <div class="metric-chart-label">${label} ${unit ? `<span>${unit}</span>` : ''}</div>
        <svg class="metric-chart" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">
            ${alertY != null ? `<line x1="0" y1="${alertY}" x2="${w}" y2="${alertY}" class="chart-alert-line"/>` : ''}
            <polyline points="${pts}" class="chart-line ${values[values.length - 1] > (alertFrom || max) ? 'alert' : ''}"/>
        </svg></div>`;
}

function renderGrafanaStatPanel(title, value, unit, alert, subtitle, panelId) {
    const clickCls = panelId ? ' gf-panel--clickable' : '';
    const clickData = panelId ? ` data-gf-panel="${panelId}"` : '';
    return `<div class="gf-panel gf-panel--stat${alert ? ' gf-panel--alert' : ''}${clickCls}"${clickData}>
        <div class="gf-panel-header"><span class="gf-panel-title">${title}</span><span class="gf-panel-menu" title="View">⋮</span></div>
        <div class="gf-panel-body gf-stat-body">
            <div class="gf-stat-value${alert ? ' gf-stat-value--alert' : ''}">${value}${unit ? `<span class="gf-stat-unit">${unit}</span>` : ''}</div>
            ${subtitle ? `<div class="gf-stat-sub">${subtitle}</div>` : ''}
        </div>
    </div>`;
}

function wireGrafanaApp(root, ctx) {
    const setStatus = (text) => {
        const el = root.querySelector('#gf-status');
        if (el) el.textContent = text;
    };

    root.querySelectorAll('[data-gf-nav]').forEach(el => {
        el.addEventListener('click', () => {
            root.querySelectorAll('[data-gf-nav]').forEach(n => n.classList.remove('active'));
            el.classList.add('active');
            const nav = el.dataset.gfNav;
            if (nav === 'explore') {
                setStatus('Explore → Prometheus');
                openAppWindow('prometheus');
            } else if (nav === 'alerting') {
                setStatus(ctx.hasAlert ? `${ctx.firingAlerts} alerts firing` : 'No alerts');
                if (ctx.hasAlert) {
                    pushNotification('Grafana', 'Alerting', `${ctx.firingAlerts} rules firing`, 'warning');
                }
            } else if (nav === 'connections') {
                setStatus('Datasources: prometheus-prod ✓ · loki-prod ✓');
            } else if (nav === 'admin') {
                setStatus('Admin — read-only mode (simulation)');
            } else if (nav === 'home') {
                setStatus('Home — dashboards folder');
            } else {
                setStatus('Dashboard: Checkout / PROD');
            }
        });
    });

    root.querySelectorAll('[data-gf-toolbar]').forEach(btn => {
        btn.addEventListener('click', () => {
            const action = btn.dataset.gfToolbar;
            if (action === 'refresh') {
                setStatus(`Dashboard refreshed · ${new Date().toLocaleTimeString()} · every 30s`);
            } else if (action === 'range') {
                setStatus('Time range: Last 6 hours (UTC)');
            } else if (action === 'share') {
                setStatus('Link copied: /d/checkout-prod/overview');
            } else if (action === 'star') {
                setStatus('Dashboard starred ⭐');
                btn.textContent = '★';
            }
        });
    });

    root.querySelectorAll('[data-gf-panel]').forEach(panel => {
        panel.addEventListener('click', () => {
            const id = panel.dataset.gfPanel;
            if (id === 'heap' && ctx.hasOom) {
                setStatus('Analyzing JVM heap chart…');
                opsAction('grafana', 'heap-chart');
            } else if (id === 'integration' && (ctx.hasKafka || ctx.hasObs)) {
                setStatus('Opening integration metrics…');
                opsAction('grafana', ctx.hasObs ? 'integration-dashboard' : 'integration-metrics');
            } else if (id === 'errors') {
                setStatus('Drill-down → Prometheus');
                openAppWindow('prometheus');
            } else if (id === 'kafka') {
                setStatus('Drill-down → Kafka consumer lag');
                openAppWindow('kafka');
            } else if (id === 'checkout') {
                setStatus('Drill-down → POST /api/checkout');
                openAppWindow('postman');
            }
        });
    });

    root.querySelectorAll('[data-gf-action]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (btn.disabled) return;
            const action = btn.dataset.gfAction;
            if (action === 'heap') {
                setStatus('Task: analyze heap chart');
                opsAction('grafana', 'heap-chart');
            } else if (action === 'integration') {
                setStatus('Task: integration metrics');
                opsAction('grafana', ctx.hasObs ? 'integration-dashboard' : 'integration-metrics');
            } else if (action === 'prometheus') openAppWindow('prometheus');
            else if (action === 'silence' && ctx.hasAlert) {
                setStatus('Silence created for 1h');
                pushNotification('Grafana', 'Alertmanager', 'Silence на 1h (simulation)', 'slack');
            } else if (action === 'jira' && ctx.hasAlert) openAppWindow('jira');
            else if (action === 'logs') openAppWindow('opensearch');
        });
    });
}

function renderGrafanaGraphSvg(values, alertFrom, alert) {
    const max = Math.max(...values, alertFrom || 0, 1);
    const w = 480;
    const h = 130;
    const coords = values.map((v, i) => {
        const x = (i / Math.max(values.length - 1, 1)) * w;
        const y = h - 16 - (v / max) * (h - 28);
        return { x, y };
    });
    const linePts = coords.map(p => `${p.x},${p.y}`).join(' ');
    const areaPts = `0,${h} ${linePts} ${w},${h}`;
    const alertY = alertFrom != null ? h - 16 - (alertFrom / max) * (h - 28) : null;
    const gridLines = [0.25, 0.5, 0.75].map(r => {
        const y = 16 + (h - 28) * r;
        return `<line x1="0" y1="${y}" x2="${w}" y2="${y}" class="gf-grid-line"/>`;
    }).join('');
    return `<svg class="gf-chart" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">
        ${gridLines}
        ${alertY != null ? `<line x1="0" y1="${alertY}" x2="${w}" y2="${alertY}" class="gf-threshold"/>` : ''}
        <polygon points="${areaPts}" class="gf-area${alert ? ' gf-area--alert' : ''}"/>
        <polyline points="${linePts}" class="gf-line${alert ? ' gf-line--alert' : ''}"/>
    </svg>`;
}

function renderGrafanaGraphPanel(title, values, alertFrom, unit, alert) {
    return `<div class="gf-panel gf-panel--graph${alert ? ' gf-panel--alert' : ''}">
        <div class="gf-panel-header"><span class="gf-panel-title">${title}</span><span class="gf-panel-unit">${unit || ''}</span><span class="gf-panel-menu">⋮</span></div>
        <div class="gf-panel-body">${renderGrafanaGraphSvg(values, alertFrom, alert)}</div>
    </div>`;
}

const EMAIL_CATEGORY_META = {
    hr: { icon: '👔', label: 'HR' },
    jira: { icon: '📋', label: 'JIRA' },
    gitlab: { icon: '🦊', label: 'GitLab' },
    github: { icon: '🐙', label: 'GitHub' },
    recruiter: { icon: '💼', label: 'Recruiter' },
    spam: { icon: '🗑', label: 'Spam' },
    scam: { icon: '⚠️', label: 'Phishing' },
    incident: { icon: '🔥', label: 'Incident' },
    general: { icon: '📧', label: 'Inbox' }
};

function renderExtraApp(appId, container) {
    const fn = EXTRA_APP_RENDERERS[appId];
    if (!fn) return false;
    fn(container);
    return true;
}

const EXTRA_APP_RENDERERS = {
    github: renderGitHubApp,
    confluence: renderConfluenceApp,
    portal: renderPortalApp,
    terminal: renderTerminalApp,
    email: renderEmailApp,
    kafka: renderKafkaApp,
    grafana: renderGrafanaApp,
    docker: renderDockerApp,
    kubernetes: renderK8sApp,
    postman: renderPostmanApp,
    word: renderWordApp,
    excel: renderExcelApp,
    bus: renderBusApp,
    elastic: renderElasticApp,
    opensearch: renderOpenSearchApp,
    redis: renderRedisApp,
    postgres: renderPostgresApp,
    dbeaver: renderDBeaverApp,
    mongodb: renderMongoDbApp,
    cassandra: renderCassandraApp,
    couchbase: renderCouchbaseApp,
    dynamodb: renderDynamoDbApp,
    clickhouse: renderClickHouseApp,
    neo4j: renderNeo4jApp,
    jenkins: renderJenkinsApp,
    meet: renderMeetApp,
    prometheus: renderPrometheusApp,
    kitty: renderKittyApp,
    rdp: renderRdpApp,
    vault: renderVaultApp,
    nginx: renderNginxApp,
    rabbitmq: renderRabbitmqApp,
    sentry: renderSentryApp,
    swagger: renderSwaggerApp,
    gitlab: renderGitlabApp,
    helm: renderHelmApp,
    terraform: renderTerraformApp,
    vpn: renderVpnApp
};

function renderGitHubApp(container) {
    const myTasks = (workspace.tasks || []).filter(t => !t.completed && t.code && t.type !== 'CODE_REVIEW');
    const reviewTasks = (workspace.tasks || []).filter(t => !t.completed && t.type === 'CODE_REVIEW');
    const focused = (workspace.tasks || []).find(t => t.focused);
    const selected = focused?.code && focused.type !== 'CODE_REVIEW' ? focused : myTasks[0];

    const prStatusLabel = status => ({
        NONE: '—',
        OPEN: 'OPEN',
        REVIEW_REQUESTED: 'REVIEW REQUESTED',
        CHANGES_REQUESTED: 'CHANGES REQUESTED',
        APPROVED: 'APPROVED',
        MERGED: 'MERGED'
    }[status] || status || '—');

    const prStatusClass = status => {
        if (status === 'MERGED' || status === 'APPROVED') return 'pr-ok';
        if (status === 'CHANGES_REQUESTED') return 'pr-warn';
        if (status === 'REVIEW_REQUESTED') return 'pr-pending';
        return '';
    };

    let bodyHtml = '';
    if (!myTasks.length && !reviewTasks.length) {
        bodyHtml = '<p class="hint-text">Нет открытых PR</p>';
    } else {
        if (myTasks.length) {
            bodyHtml += '<p class="app-meta">Мои Pull Requests</p>';
            myTasks.forEach(task => {
                const prNum = task.pullRequestNumber || 0;
                const prStatus = task.pullRequestStatus || 'NONE';
                const sel = selected?.id === task.id ? ' tool-row--active' : '';
                const label = prNum ? `PR #${prNum}` : task.ticketId;
                bodyHtml += `<div class="tool-row${sel}" data-ticket="${task.ticketId}">
                    <strong>${label}</strong> — ${task.title}
                    <span class="tool-tag ${prStatusClass(prStatus)}">${prStatusLabel(prStatus)}</span>
                </div>`;
            });
        }
        if (reviewTasks.length) {
            bodyHtml += '<p class="app-meta" style="margin-top:12px">Входящие review</p>';
            reviewTasks.forEach(task => {
                bodyHtml += `<div class="tool-row" data-ticket="${task.ticketId}">
                    <strong>${task.ticketId}</strong> — ${task.title}
                    <span class="tool-tag pr-pending">IN PROGRESS</span>
                </div>`;
            });
        }
        if (selected) {
            const prNum = selected.pullRequestNumber || 0;
            const prStatus = selected.pullRequestStatus || 'NONE';
            const reviewer = selected.reviewerContactId || 'alex';
            bodyHtml += `<pre id="github-pr-log" class="tool-log">${
                prNum ? `PR #${prNum} · ${prStatusLabel(prStatus)}` : 'Ветка запушена — создайте PR'
            }${prStatus === 'REVIEW_REQUESTED' ? `\nОжидает review от @${reviewer}` : ''}${
                prStatus === 'APPROVED' ? '\n✅ Approved → IntelliJ: вкладка Git → git checkout main → git merge' : ''
            }${prStatus === 'CHANGES_REQUESTED' ? '\n⚠ Нужны правки → IntelliJ → Commit → Push' : ''}</pre>`;
        }
    }

    container.innerHTML = appShell('🐙 GitHub', workspace.projectCompany + ' / backend', bodyHtml);
    container.querySelectorAll('.tool-row[data-ticket]').forEach(row => {
        row.onclick = async () => {
            const ok = await focusTaskByTicket(row.dataset.ticket, false);
            if (ok) renderGitHubApp(container);
            else pushNotification('🐙 GitHub', row.dataset.ticket, 'Задача недоступна', 'warning');
        };
    });

    const actions = [];
    if (selected) {
        const pushDone = selected.objectives?.some(o => o.type === 'GIT_PUSH' && o.completed);
        const prNum = selected.pullRequestNumber || 0;
        const prStatus = selected.pullRequestStatus || 'NONE';
        const hasPrFlow = selected.objectives?.some(o => o.type === 'CREATE_PR');

        if (hasPrFlow) {
            actions.push({
                text: '➕ New Pull Request',
                disabled: !pushDone || prNum > 0,
                action: async () => {
                    const resp = await api('/code/pr/create', { method: 'POST', body: JSON.stringify({ taskId: selected.id }) });
                    ws(resp);
                    if (resp.message) pushNotification('🐙 GitHub', 'PR created', resp.message, 'slack');
                    renderGitHubApp(container);
                }
            });
            actions.push({
                text: '👤 Request review',
                disabled: prNum === 0 || !['OPEN', 'CHANGES_REQUESTED'].includes(prStatus),
                action: async () => {
                    const resp = await api('/code/pr/request-review', { method: 'POST', body: JSON.stringify({ taskId: selected.id }) });
                    ws(resp);
                    if (resp.message) pushNotification('🐙 GitHub', 'Review requested', resp.message, 'slack');
                    renderGitHubApp(container);
                }
            });
            actions.push({
                text: '🔄 Check review status',
                disabled: prStatus !== 'REVIEW_REQUESTED',
                action: async () => {
                    const resp = await api('/code/pr/check-review', { method: 'POST', body: JSON.stringify({ taskId: selected.id }) });
                    ws(resp);
                    if (resp.message) {
                        pushNotification('🐙 GitHub', 'Review', resp.message, resp.success === false ? 'warning' : 'slack');
                        const updated = workspace.tasks?.find(t => t.id === selected.id);
                        if (updated?.pullRequestStatus === 'APPROVED') {
                            setTimeout(() => pushNotification('💻 IntelliJ', 'Git merge',
                                'Вкладка Git → git checkout main → git merge ' + taskGitBranch(updated),
                                'slack', () => openAppWindow('ide')), 600);
                        }
                    }
                    renderGitHubApp(container);
                }
            });
            if (prStatus === 'CHANGES_REQUESTED') {
                actions.push({
                    text: '💻 Open in IntelliJ',
                    action: async () => {
                        await focusTaskByTicket(selected.ticketId);
                    }
                });
            }
        }
    }
    actions.push({
        text: '🔄 Sync fork',
        action: () => pushNotification('🐙 GitHub', 'Sync', 'main ← origin/main (up to date)', 'slack')
    });
    addLimitedActions(container, actions);
}

function renderConfluenceApp(container) {
    container.innerHTML = appShell(
        `📘 ${workspace.projectProduct}`,
        `${workspace.projectCompany} · ${workspace.yourRole} · read-only`,
        `<p>${workspace.projectDescription || ''}</p>
         <h4>Архитектура</h4><p>${workspace.architecture || ''}</p>
         ${typeof renderArchitectureDiagrams === 'function' && workspace.projectType
            ? renderArchitectureDiagrams(workspace.projectType) : ''}
         <div class="tech-stack">${(workspace.techStack || []).map(t => `<span class="tech-tag">${t}</span>`).join('')}</div>`
    );
    addLimitedActions(container, [
        { text: '📝 Запросить edit-доступ', action: () => {
            notifyOpsRequest('📘 Confluence', 'Access request', 'Запрос edit-доступа отправлен в IT (Anna)');
        }},
        { text: '🔍 Onboarding Guide', action: () => pushNotification('📘 Confluence', '12 results', 'Getting Started — Checkout Team', 'slack') },
        { text: '🏢 Корпоративный портал', action: () => openAppWindow('portal') },
        { text: '🚫 Create page', disabled: true }
    ]);
}

function portalLabel(key, fallback) {
    if (typeof t !== 'function') return fallback;
    const v = t(key);
    return v === key ? fallback : v;
}

function renderPortalApp(container) {
    const p = workspace.player;
    const team = workspace.team || [];
    let activeTab = 'about';

    const root = mountBrandedApp(
        container,
        'brand-portal',
        `<span class="portal-toolbar-logo">${workspace.projectEmoji || '🏢'}</span>
         <div class="portal-toolbar-text">
            <strong>${workspace.projectCompany}</strong>
            <span class="portal-toolbar-sub">${portalLabel('portal.toolbar', 'Корпоративный портал')}</span>
         </div>
         <span class="portal-toolbar-user">${p.name} · ${workspace.yourRole || p.careerTitle}</span>`,
        `<nav class="portal-nav" id="portal-nav"></nav>
         <div class="portal-content" id="portal-content"></div>`
    );

    const nav = root.querySelector('#portal-nav');
    const content = root.querySelector('#portal-content');

    const tabs = [
        { id: 'about', icon: '🏢', label: portalLabel('portal.tab.about', 'О компании') },
        { id: 'news', icon: '📰', label: portalLabel('portal.tab.news', 'Новости') },
        { id: 'team', icon: '👥', label: portalLabel('portal.tab.team', 'Команда') },
        { id: 'pay', icon: '💰', label: portalLabel('portal.tab.pay', 'Зарплата') },
        { id: 'hr', icon: '📋', label: portalLabel('portal.tab.hr', 'HR и политики') }
    ];

    let portalNewsData = null;
    let portalNewsLoading = false;

    async function loadPortalNews(force) {
        if (!force && portalNewsData) return portalNewsData;
        portalNewsLoading = true;
        try {
            const lang = typeof getLang === 'function' ? getLang() : 'ru';
            portalNewsData = await api('/portal/news?lang=' + encodeURIComponent(lang));
        } catch (e) {
            console.warn('portal news', e);
            portalNewsData = { internal: [], external: [], offline: true, disclaimer: '' };
        } finally {
            portalNewsLoading = false;
        }
        return portalNewsData;
    }

    function formatNewsWhen(publishedAt, internal) {
        if (internal || publishedAt === 'today') {
            return portalLabel('portal.news.today', 'сегодня');
        }
        if (!publishedAt) return '';
        const d = new Date(publishedAt);
        if (Number.isNaN(d.getTime())) return '';
        const diffMin = Math.floor((Date.now() - d.getTime()) / 60000);
        if (diffMin < 60) {
            return typeof t === 'function' ? t('portal.news.minutesAgo', { n: Math.max(1, diffMin) }) : `${diffMin} мин назад`;
        }
        const diffH = Math.floor(diffMin / 60);
        if (diffH < 48) {
            return typeof t === 'function' ? t('portal.news.hoursAgo', { n: diffH }) : `${diffH} ч назад`;
        }
        return d.toLocaleDateString(typeof getLang === 'function' && getLang() === 'en' ? 'en' : 'ru-RU');
    }

    function renderNewsCard(item) {
        const when = formatNewsWhen(item.publishedAt, item.internal);
        const title = typeof escapeHtml === 'function' ? escapeHtml(item.title) : item.title;
        const source = typeof escapeHtml === 'function' ? escapeHtml(item.source || '') : (item.source || '');
        const body = item.url
            ? `<a href="${item.url}" target="_blank" rel="noopener noreferrer" class="portal-news-link">${title}</a>`
            : `<span class="portal-news-title">${title}</span>`;
        return `<article class="portal-news-card${item.internal ? ' internal' : ''}">
            <div class="portal-news-meta">
                <span class="portal-news-source">${source}</span>
                ${when ? `<span class="portal-news-when">${when}</span>` : ''}
            </div>
            ${body}
        </article>`;
    }

    function renderNewsHtml(data) {
        const internal = data?.internal || [];
        const external = data?.external || [];
        const offlineBadge = data?.offline
            ? `<p class="portal-news-offline">${portalLabel('portal.news.offline', 'Показан кэш / офлайн-дайджест')}</p>`
            : '';
        const disclaimer = data?.disclaimer
            ? `<p class="portal-news-disclaimer">${data.disclaimer}</p>` : '';
        return `
            ${offlineBadge}
            <section class="portal-news-section">
                <h3 class="portal-news-heading">${portalLabel('portal.news.internal', 'Внутри компании')}</h3>
                <div class="portal-news-list">
                    ${internal.length ? internal.map(renderNewsCard).join('') 
                        : `<p class="portal-muted">${portalLabel('portal.news.emptyInternal', 'Нет объявлений')}</p>`}
                </div>
            </section>
            <section class="portal-news-section">
                <h3 class="portal-news-heading">${portalLabel('portal.news.external', 'IT-индустрия')}</h3>
                <div class="portal-news-list">
                    ${external.length ? external.map(renderNewsCard).join('')
                        : `<p class="portal-muted">${portalLabel('portal.news.emptyExternal', 'Лента загружается…')}</p>`}
                </div>
            </section>
            ${disclaimer}`;
    }

    function renderNewsLoading() {
        return `<p class="portal-news-loading">${portalLabel('portal.news.loading', 'Загрузка ленты…')}</p>`;
    }

    function renderAbout() {
        return `
            <section class="portal-hero">
                <div class="portal-hero-badge">${workspace.projectEmoji || '🏢'}</div>
                <div>
                    <h2 class="portal-hero-title">${workspace.projectProduct}</h2>
                    <p class="portal-hero-tagline">${workspace.projectTagline || ''}</p>
                </div>
            </section>
            <div class="portal-cards">
                <article class="portal-card">
                    <h3>${portalLabel('portal.about.product', 'Продукт')}</h3>
                    <p>${workspace.projectDescription || ''}</p>
                </article>
                <article class="portal-card">
                    <h3>${portalLabel('portal.about.role', 'Ваша роль')}</h3>
                    <p>${workspace.yourRole || p.careerTitle}</p>
                    <p class="portal-muted">${portalLabel('portal.about.channel', 'Канал')}: ${workspace.slackChannel}</p>
                </article>
                <article class="portal-card">
                    <h3>${portalLabel('portal.about.stack', 'Стек команды')}</h3>
                    <div class="tech-stack">${(workspace.techStack || []).map(t => `<span class="tech-tag">${t}</span>`).join('')}</div>
                </article>
                <article class="portal-card portal-card-wide">
                    <h3>${portalLabel('portal.about.arch', 'Архитектура')}</h3>
                    <p>${workspace.architecture || ''}</p>
                    ${typeof renderArchitectureDiagrams === 'function' && workspace.projectType
                        ? `<div class="portal-diagram">${renderArchitectureDiagrams(workspace.projectType)}</div>` : ''}
                </article>
            </div>`;
    }

    function renderTeam() {
        if (!team.length) {
            return `<p class="portal-muted">${portalLabel('portal.team.empty', 'Нет данных о команде')}</p>`;
        }
        return `<div class="portal-team-grid">
            ${team.map(m => `
                <article class="portal-team-card">
                    <div class="portal-team-avatar">${m.avatar || '👤'}</div>
                    <div class="portal-team-body">
                        <h4>${m.name}</h4>
                        <p class="portal-team-role">${m.role}</p>
                        <p class="portal-team-bio">${m.bio || ''}</p>
                        <button type="button" class="portal-link-btn" data-slack="${m.id}">
                            💬 ${portalLabel('portal.team.slack', 'Написать в Slack')}
                        </button>
                    </div>
                </article>
            `).join('')}
        </div>`;
    }

    function renderPay() {
        const daily = workspace.estimatedDailyPay ?? 0;
        const monthly = workspace.estimatedMonthlyGross ?? 0;
        const balance = p.money ?? 0;
        return `
            <div class="portal-pay-header">
                <div class="portal-pay-stat portal-pay-stat-main">
                    <span class="portal-pay-label">${portalLabel('portal.pay.monthly', 'Оклад (gross / мес)')}</span>
                    <span class="portal-pay-value">$${monthly.toLocaleString()}</span>
                    <span class="portal-pay-hint">${workspace.payGrade || ''}</span>
                </div>
                <div class="portal-pay-stat">
                    <span class="portal-pay-label">${portalLabel('portal.pay.daily', 'За продуктивный день')}</span>
                    <span class="portal-pay-value">$${daily}</span>
                    <span class="portal-pay-hint">${portalLabel('portal.pay.dailyHint', 'при закрытии задач')}</span>
                </div>
                <div class="portal-pay-stat">
                    <span class="portal-pay-label">${portalLabel('portal.pay.balance', 'Баланс')}</span>
                    <span class="portal-pay-value">$${balance}</span>
                    <span class="portal-pay-hint">${portalLabel('portal.pay.day', 'игровой день')} ${p.day}</span>
                </div>
            </div>
            <div class="portal-cards">
                <article class="portal-card">
                    <h3>${portalLabel('portal.pay.review', 'Performance review')}</h3>
                    <p>${portalLabel('portal.pay.nextReview', 'Следующий пересмотр')}: <strong>${workspace.nextSalaryReview || '—'}</strong></p>
                    <ul class="portal-list">
                        <li>Java skill: ${p.javaSkill}/100</li>
                        <li>Code quality: ${p.codeQuality}/100</li>
                        <li>Коллеги: ${p.colleagueRating}/10</li>
                        <li>Уровень: ${p.level} (${p.exp}/${p.expToNextLevel} XP)</li>
                    </ul>
                </article>
                <article class="portal-card">
                    <h3>${portalLabel('portal.pay.benefits', 'Бенефиты')}</h3>
                    <ul class="portal-list portal-benefits">
                        <li>🏥 ${portalLabel('portal.benefit.health', 'ДМС после испытательного срока')}</li>
                        <li>🏠 ${portalLabel('portal.benefit.remote', 'Гибрид 2/3 — офис / удалёнка')}</li>
                        <li>📚 ${portalLabel('portal.benefit.learning', 'Бюджет на обучение $500/год')}</li>
                        <li>☕ ${portalLabel('portal.benefit.snacks', 'Кухня и кофе в офисе')}</li>
                        <li>🎮 ${portalLabel('portal.benefit.team', 'Team building 2× в год')}</li>
                    </ul>
                </article>
                <article class="portal-card portal-card-wide">
                    <h3>${portalLabel('portal.pay.how', 'Как начисляется зарплата')}</h3>
                    <p>${portalLabel('portal.pay.howText', 'В конце игрового дня вы получаете выплату за закрытые задачи. Чем больше задач закрыто — тем выше бонус. Незакрытые задачи снижают итог и добавляют стресс.')}</p>
                </article>
            </div>`;
    }

    function renderHr() {
        const warnings = p.warnings ?? 0;
        const hrList = (p.hrWarnings || []).slice(-5).reverse();
        return `
            <div class="portal-cards">
                <article class="portal-card">
                    <h3>${portalLabel('portal.hr.profile', 'Кадровый профиль')}</h3>
                    <dl class="portal-dl">
                        <dt>${portalLabel('portal.hr.name', 'ФИО')}</dt><dd>${p.name}</dd>
                        <dt>${portalLabel('portal.hr.title', 'Должность')}</dt><dd>${p.careerTitle}</dd>
                        <dt>${portalLabel('portal.hr.education', 'Образование')}</dt><dd>${p.education || '—'}</dd>
                        <dt>${portalLabel('portal.hr.exp', 'Опыт')}</dt><dd>${p.experienceYears} ${portalLabel('portal.hr.years', 'лет')}</dd>
                        <dt>${portalLabel('portal.hr.mode', 'Режим')}</dt><dd>${workspace.mode}</dd>
                    </dl>
                </article>
                <article class="portal-card">
                    <h3>${portalLabel('portal.hr.discipline', 'Дисциплина')}</h3>
                    <p>${portalLabel('portal.hr.warnings', 'Предупреждения')}: <strong class="${warnings >= 3 ? 'portal-warn' : ''}">${warnings}</strong></p>
                    <p class="portal-muted">${portalLabel('portal.hr.rating', 'Рейтинг у коллег')}: ${p.colleagueRating}/10</p>
                    <p class="portal-muted">${portalLabel('portal.hr.stress', 'Стресс')}: ${p.stress}% · ${portalLabel('portal.hr.health', 'Здоровье')}: ${p.health}%</p>
                    ${hrList.length ? `<ul class="portal-list portal-warnings-list">
                        ${hrList.map(w => `<li><span class="portal-warn-date">${w.day ? portalLabel('portal.hr.day', 'День') + ' ' + w.day : ''}</span> ${w.reason || ''}</li>`).join('')}
                    </ul>` : `<p class="portal-muted">${portalLabel('portal.hr.clean', 'Нарушений нет 👍')}</p>`}
                </article>
                <article class="portal-card portal-card-wide">
                    <h3>${portalLabel('portal.hr.policies', 'Политики')}</h3>
                    <ul class="portal-list">
                        <li>⏱ ${portalLabel('portal.policy.day', '1 игровой день = 8 часов (09:00–17:00)')}</li>
                        <li>🛡 ${portalLabel('portal.policy.probation', 'Испытательный срок — 3 дня в учебном режиме')}</li>
                        <li>📅 ${portalLabel('portal.policy.vacation', 'Отпуск — 28 календарных дней (после 6 мес.)')}</li>
                        <li>🏃 ${portalLabel('portal.policy.sick', 'Sick leave — по согласованию с TL')}</li>
                    </ul>
                </article>
            </div>`;
    }

    function paint() {
        nav.innerHTML = tabs.map(tab => `
            <button type="button" class="portal-nav-btn${activeTab === tab.id ? ' active' : ''}" data-tab="${tab.id}">
                <span>${tab.icon}</span> ${tab.label}
            </button>
        `).join('');

        if (activeTab === 'about') content.innerHTML = renderAbout();
        else if (activeTab === 'news') {
            content.innerHTML = renderNewsLoading();
            loadPortalNews(false).then(data => {
                if (activeTab === 'news') content.innerHTML = renderNewsHtml(data);
            });
        }
        else if (activeTab === 'team') content.innerHTML = renderTeam();
        else if (activeTab === 'pay') content.innerHTML = renderPay();
        else content.innerHTML = renderHr();

        nav.querySelectorAll('.portal-nav-btn').forEach(btn => {
            btn.onclick = () => {
                activeTab = btn.dataset.tab;
                paint();
            };
        });

        content.querySelectorAll('[data-slack]').forEach(btn => {
            btn.onclick = () => {
                slackView = 'dm';
                selectedContact = btn.dataset.slack;
                openAppWindow('slack');
            };
        });
    }

    paint();

    addLimitedActions(container, [
        { text: '🔄 ' + portalLabel('portal.news.refresh', 'Обновить новости'), action: () => {
            portalNewsData = null;
            if (activeTab === 'news') {
                content.innerHTML = renderNewsLoading();
                loadPortalNews(true).then(data => {
                    if (activeTab === 'news') content.innerHTML = renderNewsHtml(data);
                });
            } else {
                activeTab = 'news';
                paint();
            }
        }},
        { text: '📘 Confluence / Wiki', action: () => openAppWindow('confluence') },
        { text: '💬 Slack', action: () => openAppWindow('slack') },
        { text: '📧 Outlook', action: () => openAppWindow('email') }
    ]);
}

function renderTerminalApp(container) {
    const output = document.createElement('pre');
    output.className = 'terminal-output';
    output.id = 'term-out';
    output.textContent = [...(workspace.console || []), '$ _'].join('\n');
    container.appendChild(output);

    const input = document.createElement('input');
    input.className = 'chat-input';
    input.placeholder = 'help | docker ps | kubectl get pods | mvn test | …';
    input.style.fontFamily = 'Consolas, monospace';
    input.style.marginTop = '8px';
    input.style.width = '100%';

    const CMDS = {
        help: () => 'docker ps | kubectl get pods | mvn test | mongosh | cqlsh\nsql: DBeaver · pgAdmin · ClickHouse',
        ls: () => 'src/  pom.xml  docker-compose.yml  k8s/  helm/',
        'docker ps': () => 'checkout-api   Up 2h   8080/tcp\npayment-svc    Up 2h   8081/tcp\nkafka-broker   Up 3d   9092/tcp',
        'kubectl get pods': () => 'checkout-api-7d4f9b   1/1 Running\npayment-svc-6c2a1   0/1 CrashLoopBackOff',
        'mvn test': () => taskActiveByTag('RACE_CONDITION')
            ? 'BUILD FAILURE — RaceConditionTest expected 1000 but was 847'
            : hasActiveJavaBug()
                ? 'BUILD FAILURE — NullPointerException OrderService'
                : 'BUILD SUCCESS — all tests passed',
        'git status': () => 'On branch feature/JIRA-142\nmodified: OrderService.java',
        'kafka-topics': () => 'orders.created  payments.settled  notifications.email',
        'curl logs': () => 'GET /checkout → 500 Internal Server Error',
        promql: () => 'ALERTS{severity="critical"} → 3 firing\nhttp_requests_total{status="500"} ↑ 200/min',
        'ssh bastion': () => 'Connected to jump-host.prod via WireGuard\nLast login: today 09:12',
        'nginx -t': () => 'nginx: configuration file OK\nupstream payment-svc: 502 Bad Gateway',
        'vault status': () => 'Sealed: false · Version: 1.15\nPolicy: checkout-readonly (no secrets)',
        mongosh: () => 'checkout> db.orders.findOne({orderId:142})\n{ orderId: 142, customerId: null }  ← NPE risk',
        cqlsh: () => 'checkout_keyspace> SELECT * FROM orders_by_customer WHERE customer_id=142;\n1 rows returned',
        'helm list': () => 'checkout-api   deployed  v2.4.1\npayment-svc    failed    v1.8.0',
        clear: () => { output.textContent = '$ _'; return null; },
        deploy: () => 'ERROR: RBAC — contact DevOps (Дмитрий)'
    };

    input.onkeydown = e => {
        if (e.key !== 'Enter') return;
        const cmd = input.value.trim();
        input.value = '';
        if (!cmd) return;
        const key = Object.keys(CMDS).find(k => cmd.toLowerCase() === k || cmd.toLowerCase().startsWith(k));
        const result = key ? CMDS[key]() : ('command not found: ' + cmd + ' (type help)');
        if (result === null) return;
        const prev = output.textContent.replace(/\n\$ _\s*$/, '');
        output.textContent = prev + '\n$ ' + cmd + '\n' + result + '\n$ _';
        if (cmd.includes('mvn test')) focusActiveCodeTask();
        if (cmd.includes('500')) openAppWindow('grafana');
        if (cmd.includes('promql') || cmd.includes('ALERT')) openAppWindow('prometheus');
        if (cmd.includes('ssh')) openAppWindow('rdp');
        if (cmd.includes('502')) openAppWindow('nginx');
        if (cmd.includes('mongosh') || cmd.includes('customerId: null')) openAppWindow('mongodb');
        if (cmd.includes('cqlsh')) openAppWindow('cassandra');
    };
    container.appendChild(input);
}

function renderEmailApp(container) {
    const emails = workspace.emails || [];
    let selectedId = container.dataset.selectedEmail || emails.find(e => !e.read)?.id || emails[0]?.id;
    const selected = emails.find(e => e.id === selectedId);

    container.innerHTML = appShell('📧 Outlook', 'Inbox · синхронизация с JIRA / GitLab / GitHub', `
        <div class="outlook-layout">
            <div class="outlook-list" id="outlook-list"></div>
            <div class="outlook-reading" id="outlook-reading"></div>
        </div>`);

    const listEl = container.querySelector('#outlook-list');
    emails.forEach(em => {
        const meta = EMAIL_CATEGORY_META[em.category] || EMAIL_CATEGORY_META.general;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'outlook-item' + (em.id === selectedId ? ' active' : '') + (em.read ? '' : ' unread');
        btn.innerHTML = `<span class="outlook-cat">${meta.icon}</span>
            <div><strong>${em.from}</strong><br><small>${em.subject}</small></div>`;
        btn.onclick = async () => {
            container.dataset.selectedEmail = em.id;
            if (!em.read) {
                const resp = await api('/email/read', { method: 'POST', body: JSON.stringify({ emailId: em.id }) });
                ws(resp);
            }
            renderEmailApp(container);
        };
        listEl.appendChild(btn);
    });

    const readEl = container.querySelector('#outlook-reading');
    if (!selected) {
        readEl.innerHTML = '<p class="hint-text">Нет писем</p>';
        return;
    }
    const cat = EMAIL_CATEGORY_META[selected.category] || EMAIL_CATEGORY_META.general;
    readEl.innerHTML = `<div class="outlook-read-header">
        <span class="outlook-badge">${cat.label}</span>
        <h4>${selected.subject}</h4>
        <p class="outlook-from">От: ${selected.from}</p></div>
        <pre class="outlook-body">${selected.body}</pre>`;

    const actions = [];
    if (selected.category === 'scam') {
        actions.push({ text: '🛡 Report phishing → IT', action: async () => {
            ws(await api('/email/action', { method: 'POST', body: JSON.stringify({ emailId: selected.id, actionId: 'report-phishing' }) }));
        }});
    }
    if (selected.category === 'spam') {
        actions.push({ text: '🗑 Mark as spam', action: async () => {
            ws(await api('/email/action', { method: 'POST', body: JSON.stringify({ emailId: selected.id, actionId: 'mark-spam' }) }));
        }});
    }
    if (selected.category === 'recruiter') {
        actions.push({ text: '📧 Reply via corporate HR policy', action: async () => {
            ws(await api('/email/action', { method: 'POST', body: JSON.stringify({ emailId: selected.id, actionId: 'reply-recruiter-polite' }) }));
        }});
    }
    if (selected.category === 'jira') {
        actions.push({ text: '📋 Open JIRA', action: () => openAppWindow('jira') });
    }
    if (selected.category === 'gitlab' || selected.category === 'github') {
        actions.push({ text: '🔧 Open CI pipeline', action: () => openAppWindow(selected.category === 'gitlab' ? 'gitlab' : 'github') });
    }
    if (selected.category === 'incident') {
        actions.push({ text: '📊 Open Grafana', action: () => openAppWindow('grafana') });
        actions.push({ text: '☸ Open K8s', action: () => openAppWindow('kubernetes') });
    }
    actions.push({ text: '📁 Archive', action: async () => {
        ws(await api('/email/action', { method: 'POST', body: JSON.stringify({ emailId: selected.id, actionId: 'archive' }) }));
    }});
    addLimitedActions(readEl, actions);
}

function renderKafkaApp(container) {
    const hasInc501 = taskActiveByTag('RACE_CONDITION');
    const hasKafka = taskActiveByTag('KAFKA_CONSUMER');
    const lag = hasKafka ? 1842 : hasInc501 ? 842 : 0;
    container.innerHTML = appShell('📨 Apache Kafka', 'cluster: prod-kafka-01 · env: production', `
        ${renderMetricChart([120, 180, 340, 520, lag > 500 ? 900 : 80, lag > 500 ? 1400 : 40, lag], 500, 'Consumer lag', 'msgs')}
        <table class="tool-table"><tr><th>Topic</th><th>Partitions</th><th>Lag</th><th>Status</th></tr>
        <tr><td>orders.created</td><td>12</td><td class="${lag > 500 ? 'text-danger' : ''}">${lag || 0}</td>
            <td>${lag > 500 ? '🔴 STALL' : '🟢 OK'}</td></tr>
        <tr><td>payments.settled</td><td>6</td><td>0</td><td>🟢 OK</td></tr>
        <tr><td>orders.dlq</td><td>3</td><td>${hasKafka ? 47 : 0}</td><td>${hasKafka ? '🟡 DLQ' : '—'}</td></tr>
        </table>
        <div id="kafka-log" class="tool-log">${hasKafka
            ? 'checkout-service: payment-gateway 504 — offset not committed'
            : 'Consumer group checkout-service connected.'}</div>`);
    addLimitedActions(container, [
        { text: '📊 Check consumer lag (задача)', disabled: !hasKafka, action: () => opsAction('kafka', 'consumer-lag') },
        { text: '📤 Publish test event', action: () => {
            document.getElementById('kafka-log').textContent = 'Produced test event → partition 3';
        }},
        { text: '🔍 View DLQ', action: () => {
            document.getElementById('kafka-log').textContent = 'DLQ: PaymentFailed — retry exhausted (504 upstream)';
            openAppWindow('grafana');
        }},
        { text: '⚙ Reset offsets', disabled: !hasKafka, action: () => pushNotification('📨 Kafka', 'Blocked', 'Используйте retry/DLQ, не reset!', 'danger') }
    ]);
}

function renderGrafanaApp(container) {
    const hasInc501 = taskActiveByTag('RACE_CONDITION');
    const hasOom = taskActiveByTag('MEMORY_LEAK');
    const hasKafka = taskActiveByTag('KAFKA_CONSUMER');
    const hasObs = taskActiveAnyTag('METRICS_SLA', 'SQL_SLOW_QUERY');
    const hasAlert = hasInc501 || hasOom || hasKafka || hasObs;
    const heapValues = hasOom ? [512, 620, 780, 920, 1100, 1280, 1450, 1580] : [256, 260, 258, 262, 255, 261, 259, 257];
    const errValues = hasInc501 ? [0.1, 0.2, 1.2, 4.8, 8.2, 10.1, 12.4, 12.4]
        : hasKafka ? [0.1, 0.3, 1.1, 2.4, 3.8, 4.2, 4.0, 4.2]
        : [0.01, 0.02, 0.01, 0.02, 0.01, 0.02, 0.01, 0.02];
    const errRate = hasInc501 ? 12.4 : hasKafka ? 4.2 : hasObs ? 2.1 : 0.02;
    const err5xx = hasInc501 ? 200 : hasKafka ? 48 : 0;
    const latency = hasInc501 ? '2.8s' : hasObs ? '890ms' : '120ms';
    const kafkaLag = hasKafka ? '1842' : hasInc501 ? '842' : '0';
    const firingAlerts = (hasInc501 ? 2 : 0) + (hasOom ? 1 : 0) + (hasKafka ? 1 : 0) + (hasObs ? 1 : 0);

    const root = mountBrandedApp(container, 'brand-grafana', `
        <button type="button" class="gf-hamburger" aria-label="Menu">☰</button>
        <span class="gf-logo">Grafana</span>
        <nav class="gf-breadcrumb">
            <span>Home</span><span class="gf-bc-sep">›</span>
            <span>Dashboards</span><span class="gf-bc-sep">›</span>
            <span class="gf-bc-active">Checkout / PROD</span>
        </nav>
        <span class="brand-spacer"></span>
        <button type="button" class="gf-toolbar-btn" data-gf-toolbar="range">Last 6 hours ▾</button>
        <button type="button" class="gf-toolbar-btn" data-gf-toolbar="refresh">↻ 30s ▾</button>
        <button type="button" class="gf-toolbar-btn" data-gf-toolbar="share">Share</button>
        <button type="button" class="gf-toolbar-btn gf-star" data-gf-toolbar="star">☆</button>`,
        `<div class="gf-layout">
            <aside class="gf-sidebar">
                <div class="gf-nav-item" data-gf-nav="home" title="Home"><span class="gf-nav-icon">🏠</span><span>Home</span></div>
                <div class="gf-nav-item active" data-gf-nav="dashboards" title="Dashboards"><span class="gf-nav-icon">▦</span><span>Dashboards</span></div>
                <div class="gf-nav-item" data-gf-nav="explore" title="Explore"><span class="gf-nav-icon">🔍</span><span>Explore</span></div>
                <div class="gf-nav-item${firingAlerts ? ' gf-nav-item--alert' : ''}" data-gf-nav="alerting" title="Alerting">
                    <span class="gf-nav-icon">🔔</span><span>Alerting</span>
                    ${firingAlerts ? `<span class="gf-nav-badge">${firingAlerts}</span>` : ''}
                </div>
                <div class="gf-nav-item" data-gf-nav="connections" title="Connections"><span class="gf-nav-icon">⎔</span><span>Connections</span></div>
                <div class="gf-nav-item" data-gf-nav="admin" title="Administration"><span class="gf-nav-icon">⚙</span><span>Admin</span></div>
            </aside>
            <section class="gf-main">
                ${hasAlert ? `<div class="gf-alert-banner">⚠ SEV-1 — метрики в красной зоне · datasource: prometheus-prod · refresh 30s</div>` : ''}
                <div class="gf-action-bar">
                    <button type="button" class="gf-action-btn" data-gf-action="heap" ${hasOom ? '' : 'disabled'}>📈 Analyze heap</button>
                    <button type="button" class="gf-action-btn" data-gf-action="integration" ${hasKafka || hasObs ? '' : 'disabled'}>🌐 Integration metrics</button>
                    <button type="button" class="gf-action-btn" data-gf-action="prometheus">🔥 Prometheus</button>
                    <button type="button" class="gf-action-btn" data-gf-action="silence" ${hasAlert ? '' : 'disabled'}>🔕 Silence 1h</button>
                    <button type="button" class="gf-action-btn" data-gf-action="jira" ${hasAlert ? '' : 'disabled'}>📋 JIRA</button>
                    <button type="button" class="gf-action-btn" data-gf-action="logs">🔎 Logs</button>
                </div>
                <div class="gf-dashboard">
                    ${renderGrafanaStatPanel('Error rate', errRate, '%', errRate > 1, 'http_requests_total{status=~"5.."}', 'errors')}
                    ${renderGrafanaStatPanel('5xx /checkout', err5xx, '/min', err5xx > 10, 'POST /api/checkout', 'checkout')}
                    ${renderGrafanaStatPanel('Latency p99', latency, '', hasInc501 || hasObs, 'checkout-api', hasInc501 || hasObs ? 'integration' : '')}
                    ${renderGrafanaStatPanel('Kafka consumer lag', kafkaLag, 'msgs', Number(kafkaLag) > 500, 'orders.created', Number(kafkaLag) > 0 ? 'kafka' : '')}
                    <div class="gf-panel gf-panel--graph gf-span-2 gf-panel--tall gf-panel--clickable${errRate > 1 ? ' gf-panel--alert' : ''}" data-gf-panel="errors">
                        <div class="gf-panel-header"><span class="gf-panel-title">HTTP error rate</span><span class="gf-panel-unit">%</span><span class="gf-panel-menu">⋮</span></div>
                        <div class="gf-panel-body">${renderGrafanaGraphSvg(errValues, 1, errRate > 1)}</div>
                    </div>
                    <div class="gf-panel gf-panel--graph gf-span-2 gf-panel--tall gf-panel--clickable${hasOom ? ' gf-panel--alert' : ''}" data-gf-panel="heap">
                        <div class="gf-panel-header"><span class="gf-panel-title">JVM Heap (checkout-api)</span><span class="gf-panel-unit">MiB</span><span class="gf-panel-menu">⋮</span></div>
                        <div class="gf-panel-body">${renderGrafanaGraphSvg(heapValues, hasOom ? 1024 : null, hasOom)}</div>
                    </div>
                    ${hasObs || hasKafka ? `<div class="gf-panel gf-panel--graph gf-span-2 gf-panel--tall gf-panel--clickable gf-panel--alert" data-gf-panel="integration">
                        <div class="gf-panel-header"><span class="gf-panel-title">payment-gateway latency</span><span class="gf-panel-unit">ms</span><span class="gf-panel-menu">⋮</span></div>
                        <div class="gf-panel-body">${renderGrafanaGraphSvg([120, 130, 450, 890, 720, 504, 890], 500, true)}</div>
                    </div>` : ''}
                </div>
                <div class="gf-status" id="gf-status">Dashboard loaded · click panel to drill-down</div>
            </section>
        </div>`);

    wireGrafanaApp(root, { hasOom, hasKafka, hasObs, hasAlert, hasInc501, firingAlerts });
}

function renderK8sApp(container) {
    const hasOom = taskActiveByTag('MEMORY_LEAK');
    const hasInc501 = taskActiveByTag('RACE_CONDITION');
    const hasKafka = taskActiveByTag('KAFKA_CONSUMER');
    const alert = getK8sAlertBanner();
    const initialCmd = 'kubectl get pods -n checkout -o wide';
    const initialOut = getKubectlGetPodsOutput();

    const root = mountBrandedApp(container, 'brand-k8s', `
        <span class="brand-logo k8s-logo">☸</span>
        <span class="k8s-title">kubectl</span>
        <span class="brand-chip k8s-ctx">context: prod-cluster</span>
        <span class="brand-chip k8s-ns">namespace: checkout</span>
        <span class="brand-spacer"></span>
        <span class="brand-chip ok">v1.29.2</span>`,
        `<div class="k8s-layout">
            <aside class="k8s-nav">
                <div class="k8s-nav-head">Cluster</div>
                <div class="k8s-nav-item" data-k8s-nav="overview">Overview</div>
                <div class="k8s-nav-item" data-k8s-nav="pods">Workloads</div>
                <div class="k8s-nav-item indent active" data-k8s-nav="pods">Pods</div>
                <div class="k8s-nav-item indent" data-k8s-nav="deployments">Deployments</div>
                <div class="k8s-nav-item indent" data-k8s-nav="statefulsets">StatefulSets</div>
                <div class="k8s-nav-item indent" data-k8s-nav="jobs">Jobs</div>
                <div class="k8s-nav-item" data-k8s-nav="services">Network</div>
                <div class="k8s-nav-item indent" data-k8s-nav="services">Services</div>
                <div class="k8s-nav-item" data-k8s-nav="storage">Storage</div>
                <div class="k8s-nav-item" data-k8s-nav="config">Config</div>
            </aside>
            <section class="k8s-main">
                ${alert ? `<div class="k8s-event-banner">${alert}</div>` : ''}
                <div class="k8s-action-bar">
                    <button type="button" class="k8s-action-btn" data-k8s-action="get-pods">get pods</button>
                    <button type="button" class="k8s-action-btn" data-k8s-action="logs-payment">logs payment-svc</button>
                    <button type="button" class="k8s-action-btn" data-k8s-action="logs-checkout">logs checkout-api</button>
                    <button type="button" class="k8s-action-btn" data-k8s-action="top">top pods</button>
                    <button type="button" class="k8s-action-btn" data-k8s-action="describe-payment" ${hasInc501 ? '' : 'disabled'}>describe payment</button>
                    <button type="button" class="k8s-action-btn" data-k8s-action="logs-job" ${hasKafka ? '' : 'disabled'}>logs job</button>
                    <button type="button" class="k8s-action-btn" data-k8s-action="rollout">rollout restart</button>
                    <button type="button" class="k8s-action-btn" data-k8s-action="heap-dump" ${hasOom ? '' : 'disabled'}>heap dump</button>
                    <button type="button" class="k8s-action-btn" data-k8s-action="oom-events" ${hasOom ? '' : 'disabled'}>OOM events</button>
                    <button type="button" class="k8s-action-btn" data-k8s-action="grafana">Grafana</button>
                </div>
                <div class="k8s-cmdline" id="k8s-cmdline">$ ${initialCmd}</div>
                <pre class="k8s-terminal" id="k8s-terminal">${initialOut}</pre>
                ${hasOom ? '<p class="k8s-hint">Events: OOMKilled — Last State: Terminated, Exit Code 137. Heap dump до restart.</p>' : ''}
                <div class="k8s-status" id="k8s-status">namespace checkout · context prod-cluster</div>
            </section>
        </div>`);

    wireK8sApp(root, { hasOom, hasInc501, hasKafka });
}

async function showDockerLogs(containerName) {
    const logEl = document.getElementById('docker-log');
    if (logEl) {
        logEl.textContent = `$ docker logs ${containerName} --tail 80\n\n${getPodLogs(containerName)}`;
    }
    const ticket = resolveTicketForPod(containerName);
    if (ticket) {
        await focusTaskByTicket(ticket, false);
        hintK8sLogs('🐳 Docker', containerName, ticket);
    } else {
        pushNotification('🐳 Docker', 'Logs', `${containerName}: критических ошибок нет`, 'slack');
    }
}

function runDockerComposeUp() {
    const logEl = document.getElementById('docker-log');
    if (!logEl) return;
    const hasOom = taskActiveByTag('MEMORY_LEAK');
    const hasInc501 = taskActiveByTag('RACE_CONDITION');
    const lines = [
        '$ docker compose up -d',
        '[+] Running 4/4',
        ' ✔ Network checkout_default    Created',
        ' ✔ Container redis-cache       Started',
        ' ✔ Container kafka-broker      Started',
        ' ✔ Container checkout-api      Started',
        ' ✔ Container payment-svc       Started',
        ''
    ];
    if (hasOom) {
        lines.push('checkout-api  | java.lang.OutOfMemoryError: Java heap space');
        lines.push('checkout-api  | Exited (137) OOMKilled');
        pushNotification('🐳 Docker', 'Compose', 'checkout-api снова упал с OOM — нужен фикс в коде', 'warning');
    } else if (hasInc501) {
        lines.push('payment-svc  | ERROR OrderService.processPayment — NullPointerException');
        lines.push('payment-svc  | Restarting (1)…');
        pushNotification('🐳 Docker', 'Compose', 'Стек поднят, но payment-svc падает — исправьте баг в IDE', 'warning');
    } else {
        lines.push('All services healthy.');
        pushNotification('🐳 Docker', 'Compose', 'Все контейнеры запущены', 'slack');
    }
    logEl.textContent = lines.join('\n');
}

function renderDockerApp(container) {
    const hasOom = taskActiveByTag('MEMORY_LEAK');
    const hasInc501 = taskActiveByTag('RACE_CONDITION');
    const checkoutStatus = hasOom ? 'Exited (137)' : 'Running';
    const paymentStatus = hasInc501 ? 'Restarting' : 'Running';
    const initialLog = hasOom
        ? '$ docker ps --format "table {{.Names}}\\t{{.Status}}"\ncheckout-api   Exited (137) OOMKilled'
        : hasInc501
            ? '$ docker ps\npayment-svc   Restarting (1)'
            : '$ docker ps\nNAME           STATUS\nReady — select container';

    const root = mountBrandedApp(container, 'brand-docker', `
        <span class="brand-logo docker-logo">🐳</span>
        <span class="docker-title">Docker Desktop</span>
        <span class="brand-chip ok">Engine running</span>
        <span class="brand-spacer"></span>
        <span class="brand-chip">4 containers</span>`,
        `<div class="docker-layout">
            <aside class="docker-nav">
                <div class="docker-nav-item active">Containers</div>
                <div class="docker-nav-item">Images</div>
                <div class="docker-nav-item">Volumes</div>
            </aside>
            <section class="docker-main">
                <table class="docker-table">
                    <thead><tr><th></th><th>Name</th><th>Status</th><th>Port</th></tr></thead>
                    <tbody>
                        <tr><td>🟢</td><td>checkout-api</td><td class="${hasOom ? 'err' : 'ok'}">${checkoutStatus}</td><td>8080</td></tr>
                        <tr><td>🟢</td><td>payment-svc</td><td class="${hasInc501 ? 'warn' : 'ok'}">${paymentStatus}</td><td>8081</td></tr>
                        <tr><td>🟢</td><td>kafka-broker</td><td class="ok">Running</td><td>9092</td></tr>
                        <tr><td>🟢</td><td>redis-cache</td><td class="ok">Running</td><td>6379</td></tr>
                    </tbody>
                </table>
                <pre id="docker-log" class="docker-terminal">${initialLog}</pre>
            </section>
        </div>`);

    addLimitedActions(root, [
        { text: 'logs checkout-api', action: () => showDockerLogs('checkout-api') },
        { text: 'logs payment-svc', action: () => showDockerLogs('payment-svc') },
        { text: 'restart payment-svc', action: async () => {
            const logEl = document.getElementById('docker-log');
            if (logEl) logEl.textContent = '$ docker restart payment-svc\npayment-svc\nRestarting… Done.';
            if (taskActiveByTag('RACE_CONDITION')) {
                pushNotification('🐳 Docker', 'Restart', 'Race condition не исправлен — тесты снова упадут', 'warning');
            }
        }},
        { text: 'docker compose up', action: () => runDockerComposeUp() }
    ]);
}

function renderPostmanApp(container) {
    container.innerHTML = appShell('🚀 Postman', 'Collection: Checkout API v2', `
        <div class="postman-req selected" data-req="orders">
            <strong>GET</strong> /api/orders</div>
        <div class="postman-req" data-req="checkout">
            <strong>POST</strong> /api/checkout</div>
        <div class="postman-req" data-req="health">
            <strong>GET</strong> /actuator/health</div>
        <pre id="postman-resp" class="tool-log">Select request → Send</pre>`);
    container.querySelectorAll('.postman-req').forEach(el => {
        el.onclick = () => {
            container.querySelectorAll('.postman-req').forEach(r => r.classList.remove('selected'));
            el.classList.add('selected');
        };
    });
    addLimitedActions(container, [
        { text: '▶ Send', action: async () => {
            const sel = container.querySelector('.postman-req.selected')?.dataset.req || 'orders';
            const checkoutErr = taskActiveByTag('RACE_CONDITION')
                ? '500 Internal Server Error\nRaceCondition in PaymentService — balance mismatch'
                : '500 Internal Server Error\nNullPointerException: getEmail()';
            const resp = {
                orders: '200 OK\n[{"id":1,"total":99.0},{"id":2,"total":null}]  ← NPE risk',
                checkout: checkoutErr,
                health: '200 OK\n{"status":"UP","checkout":"DOWN"}'
            };
            document.getElementById('postman-resp').textContent = resp[sel] || '404';
            if (sel === 'checkout') hintCheckoutIncident('🚀 Postman');
        }},
        { text: '💻 Open fix in IntelliJ', disabled: !resolveCheckoutIncidentTicket(), action: () => focusCheckoutErrorTask() },
        { text: '💾 Save to collection', action: () => pushNotification('🚀 Postman', 'Saved', 'Request saved locally', 'slack') }
    ]);
}

function renderWordApp(container) {
    const key = 'devdaily-standup-' + (workspace?.player?.day || 1);
    const saved = sessionStorage.getItem(key) || `Daily standup — ${workspace?.timeLabel || '09:00'}\n\nВчера:\n- \n\nСегодня:\n- JIRA-142\n\nБлокеры:\n- `;
    container.innerHTML = appShell('📝 Microsoft Word', 'Standup Notes.docx', '');
    const ta = document.createElement('textarea');
    ta.className = 'word-editor';
    ta.value = saved;
    ta.oninput = () => sessionStorage.setItem(key, ta.value);
    container.querySelector('.app-body').appendChild(ta);
    addLimitedActions(container, [
        { text: '💾 Save', action: () => { sessionStorage.setItem(key, ta.value); pushNotification('📝 Word', 'Saved', 'Standup Notes.docx', 'slack'); }},
        { text: '📤 Share in Slack', action: () => {
            notifyOpsRequest('📝 Word', 'Shared in #standup', 'Standup notes отправлены в канал (simulation)');
        }}
    ]);
}

function renderExcelApp(container) {
    const rows = (workspace.tasks || [])
        .filter(t => !t.completed)
        .slice(0, 6)
        .map(t => `<tr><td>${t.ticketId}</td><td>${t.jiraStatus || 'Open'}</td><td>${t.storyPoints || '—'}</td><td>${workspace.player.name}</td></tr>`)
        .join('');
    const root = mountBrandedApp(container, 'brand-excel', `
        <span class="brand-logo excel-logo">📗 Microsoft Excel</span>
        <span class="brand-sub">Sprint Tracker · ${workspace.projectCompany || 'Team'}</span>
        <span class="brand-spacer"></span>
        <span class="brand-chip">Sprint 24</span>`,
        `<div class="excel-sheet">
            <table class="excel-table" id="excel-table">
                <tr><th>Ticket</th><th>Status</th><th>SP</th><th>Owner</th></tr>
                ${rows || `<tr><td>JIRA-142</td><td>In Progress</td><td>3</td><td>${workspace.player.name}</td></tr>
                <tr><td>PR-247</td><td>Review</td><td>2</td><td>Алексей</td></tr>
                <tr><td>INC-501</td><td>Open</td><td>5</td><td>—</td></tr>`}
            </table>
            <div class="excel-metrics" id="excel-metrics">
                <span>Velocity: <strong id="excel-velocity">—</strong></span>
                <span>Committed: <strong id="excel-committed">10 SP</strong></span>
                <span>Done: <strong id="excel-done">0 SP</strong></span>
            </div>
            <pre class="excel-status" id="excel-status">Ready · Sheet1</pre>
        </div>`);
    const setStatus = (text) => {
        const el = root.querySelector('#excel-status');
        if (el) el.textContent = text;
    };
    addLimitedActions(root, [
        { text: '📊 Recalculate velocity', action: () => {
            const tbl = root.querySelector('#excel-table');
            let sum = 0;
            tbl?.querySelectorAll('tr').forEach((row, i) => {
                if (i === 0) return;
                const sp = parseInt(row.cells[2]?.textContent, 10);
                if (!isNaN(sp)) sum += sp;
            });
            const vel = Math.max(10, Math.round(sum * 0.85));
            const velEl = root.querySelector('#excel-velocity');
            if (velEl) velEl.textContent = vel + ' SP / sprint';
            setStatus(`Velocity recalculated · team avg ${vel} SP · ${new Date().toLocaleTimeString()}`);
        }},
        { text: '📋 Export CSV', action: () => {
            const lines = [];
            root.querySelectorAll('#excel-table tr').forEach(tr => {
                lines.push([...tr.cells].map(c => c.textContent).join(','));
            });
            setStatus('Exported sprint-24.csv · ' + (lines.length - 1) + ' rows · Downloads/sprint-24.csv');
        }},
        { text: '➕ Add row', action: () => {
            const tbl = root.querySelector('#excel-table');
            tbl?.insertRow().insertAdjacentHTML('beforeend', '<td>NEW-001</td><td>Backlog</td><td>1</td><td>You</td>');
            setStatus('Row added · don\'t forget to save');
        }},
        { text: '📋 Open JIRA', action: () => openAppWindow('jira') }
    ]);
}

function renderBusApp(container) {
    container.innerHTML = appShell('🔀 Enterprise Service Bus', 'RabbitMQ + legacy ESB bridge', `
        <table class="tool-table"><tr><th>Route</th><th>Queue</th><th>Msgs</th><th>Status</th></tr>
        <tr><td>OrderCreated → Billing</td><td>billing.orders</td><td>1240</td><td>🟢</td></tr>
        <tr><td>Payment → Notification</td><td>notify.email</td><td>89</td><td>🟢</td></tr>
        <tr><td>Legacy SOAP bridge</td><td>esb.deadletter</td><td>2</td><td>🔴</td></tr>
        </table>
        <pre id="bus-log" class="tool-log">ESB monitoring active</pre>`);
    addLimitedActions(container, [
        { text: '🔄 Replay dead-letter (2)', action: () => {
            document.getElementById('bus-log').textContent = 'Replayed 2 msgs → billing.orders — 1 failed (NPE)';
            openAppWindow('kafka');
        }},
        { text: '📡 Trace message flow', action: () => {
            document.getElementById('bus-log').textContent = 'OrderCreated → ESB → Kafka → payment-svc → 500 ERROR';
            openAppWindow('grafana');
        }},
        { text: '⏸ Pause route', disabled: true }
    ]);
}

function renderElasticApp(container) {
    container.innerHTML = appShell('🔍 Elasticsearch', 'index: logs-checkout-* · last 24h', `
        <input id="es-query" class="chat-input" placeholder="NullPointerException OR checkout 500" style="width:100%;margin-bottom:8px">
        <pre id="es-results" class="tool-log">Enter query → Search</pre>`);
    addLimitedActions(container, [
        { text: '🔍 Search', action: async () => {
            const q = document.getElementById('es-query').value || 'NullPointerException';
            document.getElementById('es-results').textContent =
                `[10:14:02] ERROR checkout-api — ${q}\n  at OrderService.processPayment(42)\n  customer=null\n[10:14:03] 500 POST /checkout`;
            await focusJira142IfActive();
        }},
        { text: '📊 Create index pattern', action: () => pushNotification('🔍 Elasticsearch', 'Index', 'logs-checkout-* created', 'slack') }
    ]);
}

function renderOpenSearchApp(container) {
    const hasKafka = taskActiveByTag('KAFKA_CONSUMER');
    const hasObs = taskActiveAnyTag('METRICS_SLA', 'SQL_SLOW_QUERY');
    container.innerHTML = appShell('🔎 OpenSearch Dashboards', 'Discover · logs-prod-* · Kibana-style', `
        ${hasKafka || hasObs ? renderMetricChart([200, 180, 220, 504, 504, 480, 504], 400, 'payment-gateway HTTP status', 'ms') : ''}
        <div class="tool-row ok">🟢 cluster status: green</div>
        <div class="tool-row">📄 ${hasKafka ? '48,291' : '12,842'} hits (last 15 min)</div>
        <pre id="os-results" class="tool-log">${hasKafka
            ? 'payment-gateway | ERROR | 504 Gateway Timeout\npayment-gateway | ERROR | 504 upstream\nkafka-consumer | WARN | offset stall 1842'
            : 'payment-svc | ERROR | NPE getEmail()\ncheckout-api | WARN | retry attempt 3/3'}</pre>`);
    addLimitedActions(container, [
        { text: '🔍 Integration 504 errors', disabled: !hasKafka, action: () => opsAction('opensearch', 'integration-errors') },
        { text: '🔄 Refresh Discover', action: () => {
            document.getElementById('os-results').textContent += '\n+ new ERROR batch detected';
        }},
        { text: '📈 Open Grafana', action: () => openAppWindow('grafana') }
    ]);
}

function renderRedisApp(container) {
    const root = mountBrandedApp(container, 'brand-redis', `
        <span class="brand-logo redis-logo">Redis Insight</span>
        <span class="brand-sub">master.redis.prod:6379 · DB 0</span>
        <span class="brand-spacer"></span>
        <span class="brand-chip ok">Connected</span>`,
        `<div class="brand-split">
            <aside class="brand-sidebar redis-sidebar">
                <div class="brand-tree-item active">🔑 All Keys</div>
                <div class="brand-tree-item">session:user:*</div>
                <div class="brand-tree-item">cart:pending:*</div>
                <div class="brand-tree-item">rate:checkout</div>
            </aside>
            <section class="brand-panel">
                <div class="brand-cli-bar">
                    <code>GET cart:pending:999</code>
                    <button type="button" class="brand-mini-btn redis-run-btn">▶</button>
                </div>
                <pre class="tool-log brand-output redis-out">(nil)</pre>
            </section>
        </div>`);
    const out = root.querySelector('.redis-out');
    root.querySelector('.redis-run-btn')?.addEventListener('click', async () => {
        out.textContent = '(nil) — cart expired, possible NPE on checkout';
        await focusJira142IfActive();
    });
    addLimitedActions(root, [
        { text: 'PING', action: () => { out.textContent = 'PONG · latency 0.8ms'; }},
        { text: 'INFO memory', action: () => {
            out.textContent = 'used_memory: 512MB\nmaxmemory: 2GB\nevicted_keys: 0';
        }},
        { text: 'FLUSHDB', disabled: true }
    ]);
}

function renderPostgresApp(container) {
    const root = mountBrandedApp(container, 'brand-pgadmin', `
        <span class="brand-logo pg-logo">pgAdmin 4</span>
        <span class="brand-sub">checkout@db.prod:5432</span>
        <span class="brand-spacer"></span>
        <button type="button" class="brand-link-btn pg-dbeaver-btn">↗ DBeaver</button>`,
        `<div class="brand-split">
            <aside class="brand-sidebar pg-sidebar">
                <div class="brand-tree-item">🐘 checkout (prod)</div>
                <div class="brand-tree-item indent">Schemas</div>
                <div class="brand-tree-item indent2 active">public.orders</div>
                <div class="brand-tree-item indent2">public.customers</div>
            </aside>
            <section class="brand-panel">
                <div class="brand-tab active">Query Tool</div>
                <textarea class="sql-editor brand-sql pg-sql" rows="5">SELECT id, customer_id, total FROM orders WHERE id = 142;</textarea>
                <pre class="tool-log brand-output pg-out">Execute query →</pre>
            </section>
        </div>`);
    const out = root.querySelector('.pg-out');
    root.querySelector('.pg-dbeaver-btn')?.addEventListener('click', () => openAppWindow('dbeaver'));
    addLimitedActions(root, [
        { text: '▶ Execute (read-only)', action: () => {
            out.textContent = 'id | customer_id | total\n142 | NULL        | 99.00\n\n⚠ customer_id IS NULL — NPE in app layer';
            hintDbInvestigation('🐘 pgAdmin');
        }},
        { text: 'EXPLAIN ANALYZE', action: () => {
            out.textContent = 'Seq Scan on orders — cost 842ms (slow!)';
        }},
        { text: 'INSERT/UPDATE', disabled: true }
    ]);
}

function renderDBeaverApp(container) {
    const root = mountBrandedApp(container, 'brand-dbeaver', `
        <span class="brand-logo dbeaver-logo">🦫 DBeaver</span>
        <nav class="brand-menu"><span>File</span><span>Database</span><span>SQL Editor</span><span>Window</span></nav>
        <span class="brand-spacer"></span>
        <span class="brand-chip">CE 24.0</span>`,
        `<div class="brand-split">
            <aside class="brand-sidebar dbeaver-sidebar">
                <div class="brand-tree-head">Database Navigator</div>
                <div class="brand-tree-item active">▾ checkout-prod</div>
                <div class="brand-tree-item indent">🐘 PostgreSQL · db.prod</div>
                <div class="brand-tree-item indent2">public.orders</div>
                <div class="brand-tree-item">▾ analytics</div>
                <div class="brand-tree-item indent">🍃 MongoDB · mongo.prod</div>
                <div class="brand-tree-item indent2">orders</div>
                <div class="brand-tree-item">🔮 Cassandra · cdc.prod</div>
                <div class="brand-tree-item">🟥 Redis · cache.prod</div>
            </aside>
            <section class="brand-panel dbeaver-editor">
                <div class="brand-tabs">
                    <span class="brand-tab active">Script-1.sql</span>
                    <span class="brand-tab">Script-2.sql</span>
                </div>
                <textarea class="sql-editor brand-sql dbeaver-sql" rows="6">-- checkout-prod
SELECT o.id, o.customer_id, c.email
FROM orders o
LEFT JOIN customers c ON c.id = o.customer_id
WHERE o.id = 142;</textarea>
                <div class="brand-results-head">Results · Grid
                    <button type="button" class="brand-mini-btn dbeaver-run-btn">▶ Execute (F5)</button>
                </div>
                <pre class="tool-log brand-output dbeaver-out">F5 — Execute SQL Statement</pre>
            </section>
        </div>`);
    const out = root.querySelector('.dbeaver-out');
    const runQuery = async () => {
        out.textContent = 'id | customer_id | email\n142 | NULL        | NULL\n\n⚠ LEFT JOIN miss — NPE in OrderService.getEmail()';
        hintDbInvestigation('🦫 DBeaver');
    };
    root.querySelector('.dbeaver-run-btn')?.addEventListener('click', runQuery);
    addLimitedActions(root, [
        { text: '▶ Execute SQL (F5)', action: runQuery },
        { text: '💻 Open fix in IntelliJ', disabled: !hasActiveJavaBug(), action: () => focusActiveJavaBug() },
        { text: '🍃 Open MongoDB connection', action: () => openAppWindow('mongodb') },
        { text: '🔮 Open Cassandra', action: () => openAppWindow('cassandra') },
        { text: '🐘 Open pgAdmin', action: () => openAppWindow('postgres') }
    ]);
}

function renderMongoDbApp(container) {
    const root = mountBrandedApp(container, 'brand-compass', `
        <span class="brand-logo compass-logo">🍃 MongoDB Compass</span>
        <span class="brand-sub">mongodb+srv://checkout-prod</span>
        <span class="brand-spacer"></span>
        <span class="brand-chip ok">Primary</span>`,
        `<div class="brand-split">
            <aside class="brand-sidebar compass-sidebar">
                <div class="brand-tree-head">checkout</div>
                <div class="brand-tree-item active">orders</div>
                <div class="brand-tree-item">customers</div>
                <div class="brand-tree-item">carts</div>
                <div class="brand-tree-item">audit_log</div>
            </aside>
            <section class="brand-panel">
                <div class="brand-filter-bar">
                    <input class="brand-input mongo-filter" value='{ "orderId": 142 }' placeholder="Filter">
                    <button type="button" class="brand-mini-btn mongo-find-btn">Find</button>
                </div>
                <pre class="mongo-json brand-output mongo-out">{
  "_id": { "$oid": "665a1f2e3b4c5d6e7f890142" },
  "orderId": 142,
  "customerId": null,
  "total": 99.00,
  "status": "PENDING",
  "items": [{ "sku": "SKU-42", "qty": 1 }]
}</pre>
            </section>
        </div>`);
    const out = root.querySelector('.mongo-out');
    const runFind = () => {
        out.textContent = `{
  "_id": { "$oid": "665a1f2e3b4c5d6e7f890142" },
  "orderId": 142,
  "customerId": null,
  "total": 99.00,
  "status": "PENDING"
}`;
        hintDbInvestigation('🍃 Compass');
    };
    root.querySelector('.mongo-find-btn')?.addEventListener('click', runFind);
    addLimitedActions(root, [
        { text: '📊 Schema · Analyze', action: () => pushNotification('🍃 Compass', 'Schema', 'customerId null in 0.3% docs', 'warning') },
        { text: '💻 Open fix in IntelliJ', disabled: !hasActiveJavaBug(), action: () => focusActiveJavaBug() },
        { text: '🦫 Open in DBeaver', action: () => openAppWindow('dbeaver') },
        { text: '✏ Update document', disabled: true }
    ]);
}

function renderCassandraApp(container) {
    const root = mountBrandedApp(container, 'brand-cassandra', `
        <span class="brand-logo cass-logo">DataStax Studio</span>
        <span class="brand-sub">checkout_keyspace · datacenter1</span>
        <span class="brand-spacer"></span>
        <span class="brand-chip">CQLSH</span>`,
        `<div class="brand-split">
            <aside class="brand-sidebar cass-sidebar">
                <div class="brand-tree-head">Keyspaces</div>
                <div class="brand-tree-item active">checkout_keyspace</div>
                <div class="brand-tree-item indent">orders_by_customer</div>
                <div class="brand-tree-item indent">order_events</div>
                <div class="brand-tree-item">system</div>
            </aside>
            <section class="brand-panel cass-panel">
                <div class="brand-filter-bar">
                    <button type="button" class="brand-mini-btn cass-run-btn">▶ Execute CQL</button>
                </div>
                <textarea class="sql-editor brand-sql cass-cql" rows="4">SELECT * FROM checkout_keyspace.orders_by_customer
WHERE customer_id = 142 LIMIT 10;</textarea>
                <pre class="tool-log brand-output cass-out">cqlsh&gt; </pre>
            </section>
        </div>`);
    const out = root.querySelector('.cass-out');
    const runCql = () => {
        out.textContent = ' customer_id | order_id | total | status\n-------------+----------+-------+---------\n         142 |      142 | 99.00 | PENDING\n\n(1 rows)\n⚠ customer profile missing';
        hintDbInvestigation('🔮 Cassandra');
    };
    root.querySelector('.cass-run-btn')?.addEventListener('click', runCql);
    addLimitedActions(root, [
        { text: '▶ Execute CQL', action: runCql },
        { text: '💻 Open fix in IntelliJ', disabled: !hasActiveJavaBug(), action: () => focusActiveJavaBug() },
        { text: 'DESCRIBE TABLE', action: () => {
            out.textContent = 'CREATE TABLE orders_by_customer (\n  customer_id uuid,\n  order_id bigint,\n  total decimal,\n  PRIMARY KEY (customer_id, order_id)\n);';
        }},
        { text: '🍃 Compare MongoDB', action: () => openAppWindow('mongodb') }
    ]);
}

function renderCouchbaseApp(container) {
    const root = mountBrandedApp(container, 'brand-couchbase', `
        <span class="brand-logo cb-logo">Couchbase Server</span>
        <span class="brand-sub">cluster-checkout · v7.2</span>
        <span class="brand-spacer"></span>
        <span class="brand-chip ok">Healthy</span>`,
        `<div class="brand-split">
            <aside class="brand-sidebar cb-sidebar">
                <div class="brand-tree-head">Buckets</div>
                <div class="brand-tree-item active">checkout</div>
                <div class="brand-tree-item">sessions</div>
                <div class="brand-tree-item">catalog</div>
            </aside>
            <section class="brand-panel">
                <div class="brand-filter-bar">
                    <span class="brand-label">N1QL</span>
                    <input class="brand-input cb-query" value="SELECT * FROM checkout WHERE META().id = 'order:142'">
                </div>
                <pre class="tool-log brand-output cb-out">Execute query →</pre>
            </section>
        </div>`);
    const out = root.querySelector('.cb-out');
    addLimitedActions(root, [
        { text: '▶ Run N1QL', action: () => {
            out.textContent = '{ "order:142": { "customerId": null, "total": 99.0 } }\n⚠ customerId missing — sync issue with PostgreSQL';
            hintDbInvestigation('🛋 Couchbase');
        }},
        { text: '📊 Bucket stats', action: () => {
            out.textContent = 'checkout: 1.2M docs · 4.8 GB\nops/sec: 842\nmemory used: 62%';
        }},
        { text: 'Rebalance', disabled: true }
    ]);
}

function renderDynamoDbApp(container) {
    const root = mountBrandedApp(container, 'brand-dynamodb', `
        <span class="brand-logo aws-logo">Amazon DynamoDB</span>
        <span class="brand-sub">eu-central-1 · checkout-prod</span>
        <span class="brand-spacer"></span>
        <span class="brand-chip">Tables (3)</span>`,
        `<div class="brand-aws-nav">
            <span class="active">Tables</span><span>Explore items</span><span>Metrics</span>
        </div>
        <table class="tool-table aws-table">
            <tr><th>Table name</th><th>Status</th><th>Items</th><th>Size</th></tr>
            <tr class="selected"><td>Orders</td><td>Active</td><td>842,120</td><td>12 GB</td></tr>
            <tr><td>Customers</td><td>Active</td><td>120,440</td><td>2.1 GB</td></tr>
            <tr><td>Carts</td><td>Active</td><td>45,002</td><td>890 MB</td></tr>
        </table>
        <pre class="tool-log brand-output dynamo-out">Select table → Explore items</pre>`);
    const out = root.querySelector('.dynamo-out');
    addLimitedActions(root, [
        { text: '🔍 GetItem orderId=142', action: () => {
            out.textContent = '{ "orderId": { "N": "142" }, "customerId": { "NULL": true }, "total": { "N": "99.00" } }\n⚠ customerId NULL — GSI lookup will fail';
            hintDbInvestigation('⚡ DynamoDB');
        }},
        { text: '📊 CloudWatch metrics', action: () => openAppWindow('prometheus') },
        { text: 'Create table', disabled: true }
    ]);
}

function renderClickHouseApp(container) {
    const root = mountBrandedApp(container, 'brand-clickhouse', `
        <span class="brand-logo ch-logo">ClickHouse Play</span>
        <span class="brand-sub">analytics.ch.prod:8123</span>
        <span class="brand-spacer"></span>
        <span class="brand-chip">default</span>`,
        `<textarea class="sql-editor brand-sql ch-sql" rows="5">SELECT order_id, customer_id, total, event_time
FROM checkout.events
WHERE order_id = 142
ORDER BY event_time DESC
LIMIT 20;</textarea>
        <pre class="tool-log brand-output ch-out">Run query (Ctrl+Enter)</pre>`);
    const out = root.querySelector('.ch-out');
    addLimitedActions(root, [
        { text: '▶ Run', action: () => {
            out.textContent = 'order_id | customer_id | total | event_time\n142 | \\N | 99.00 | 2026-06-25 10:14:02\n\n2 rows · 18ms · 4.2M rows scanned';
            hintDbInvestigation('📈 ClickHouse');
        }},
        { text: 'SHOW TABLES', action: () => {
            out.textContent = 'checkout.events\ncheckout.orders_mv\ncheckout.customer_dim';
        }},
        { text: '🦫 DBeaver JDBC', action: () => openAppWindow('dbeaver') }
    ]);
}

function renderNeo4jApp(container) {
    const root = mountBrandedApp(container, 'brand-neo4j', `
        <span class="brand-logo neo-logo">Neo4j Browser</span>
        <span class="brand-sub">bolt://neo4j.prod:7687 · checkout</span>
        <span class="brand-spacer"></span>
        <span class="brand-chip ok">Connected</span>`,
        `<div class="neo-cypher-bar">
            <span class="neo-prompt">neo4j$</span>
            <input class="brand-input neo-input" value="MATCH (o:Order {id: 142})-[:PLACED_BY]->(c:Customer) RETURN o, c">
        </div>
        <div class="neo-graph-preview">
            <div class="neo-node order">Order #142</div>
            <div class="neo-edge broken">PLACED_BY ✕</div>
            <div class="neo-node missing">Customer ?</div>
        </div>
        <pre class="tool-log brand-output neo-out">Run Cypher →</pre>`);
    const out = root.querySelector('.neo-out');
    addLimitedActions(root, [
        { text: '▶ Run Cypher', action: () => {
            out.textContent = 'No results — PLACED_BY missing for Order 142\n⚠ Orphan order node';
            hintDbInvestigation('⬡ Neo4j');
        }},
        { text: ':play checkout-graph', action: () => {
            out.textContent = 'Loaded: Checkout domain model\nNodes: Order, Customer, Product, Payment';
        }},
        { text: '🍃 Compare MongoDB', action: () => openAppWindow('mongodb') }
    ]);
}

function renderJenkinsApp(container) {
    const kafkaFail = taskActiveByTag('KAFKA_CONSUMER');
    const jiraFail = hasActiveJavaBug();
    const failed = kafkaFail || jiraFail;
    const failMsg = kafkaFail
        ? 'Tests failed: KafkaConsumerIT.testOrderFlow — 504 payment-gateway'
        : 'Tests failed: OrderServiceTest.testNullCustomer';
    container.innerHTML = appShell('🤖 Jenkins CI/CD', 'Job: checkout-backend / main', `
        <table class="tool-table"><tr><th>Build</th><th>Status</th><th>Time</th></tr>
        <tr><td>#248 main</td><td>${failed ? '🔴 FAILURE' : '🟢 SUCCESS'}</td><td>4m 12s</td></tr>
        <tr><td>#247 PR-247</td><td>🟡 UNSTABLE</td><td>3m 45s</td></tr>
        <tr><td>#246 main</td><td>🟢 SUCCESS</td><td>4m 01s</td></tr>
        </table>
        <pre id="jenkins-log" class="tool-log">${failed ? failMsg : 'All tests passed'}</pre>`);
    addLimitedActions(container, [
        { text: '▶ Rebuild #248', disabled: !failed, action: async () => {
            document.getElementById('jenkins-log').textContent = 'Building…\n' + failMsg;
            if (kafkaFail) await focusTaskByTicket(taskByTag('KAFKA_CONSUMER')?.ticketId);
            else if (jiraFail) await focusActiveJavaBug();
        }},
        { text: '📜 Console output', action: () => {
            const errLine = kafkaFail
                ? '[ERROR] KafkaConsumerIT — 504 payment-gateway upstream'
                : jiraFail
                    ? '[ERROR] NullPointerException at OrderService.processPayment:42'
                    : '[INFO] All tests passed';
            document.getElementById('jenkins-log').textContent += '\n' + errLine;
        }},
        { text: '🚀 Deploy to staging', disabled: true }
    ]);
}

function renderMeetApp(container) {
    container.innerHTML = appShell('📹 Google Meet', workspace.projectCompany, '');
    const body = container.querySelector('.app-body');
    if (workspace.meetingMissedToday) {
        body.innerHTML = `<p class="hint-text">❌ Вы пропустили Daily Standup из-за опоздания.</p>
            <p class="tool-log">Запись встречи недоступна. Team Lead отметил отсутствие.</p>`;
        return;
    }
    if (workspace.pendingMeeting) {
        const statusLabel = typeof t === 'function' ? t('meeting.statusNow') : 'Идёт сейчас';
        const joinLabel = typeof t === 'function' ? t('meeting.joinOnline') : 'Присоединиться к собранию онлайн';
        body.innerHTML = `<div class="outlook-meeting-card">
            <div class="outlook-meeting-status">${statusLabel}</div>
            <h3>${workspace.pendingMeeting.title}</h3>
            <p class="app-meta">${workspace.pendingMeeting.subtitle}</p>
            <p>Участников: ${(workspace.contacts?.length || 0) + 1}</p>
            <button type="button" class="outlook-meeting-join">${joinLabel}</button>
        </div>`;
        body.querySelector('.outlook-meeting-join').onclick = () => {
            closeApp();
            startMeeting(workspace.pendingMeeting);
        };
        addLimitedActions(container, [
            { text: '🔇 Пока не могу', action: () => pushNotification('📅 Outlook', 'Напоминание', 'Team Lead ждёт на daily', 'outlook') }
        ]);
    } else {
        body.innerHTML = '<p class="hint-text">Нет запланированных встреч. Следующий daily — завтра 09:00.</p>';
    }
}

function renderPrometheusApp(container) {
    const hasInc = taskActiveByTag('RACE_CONDITION');
    const hasObs = taskActiveAnyTag('METRICS_SLA', 'SQL_SLOW_QUERY');
    container.innerHTML = appShell('🔥 Prometheus', 'prometheus.prod:9090 · scrape: checkout namespace', `
        <div class="grafana-panels">
            <div class="grafana-panel ${hasInc ? 'alert' : 'ok'}"><span>Alerts firing</span><strong>${hasInc ? '3' : hasObs ? '1' : '0'}</strong></div>
            <div class="grafana-panel ${hasObs ? 'alert' : 'ok'}"><span>partner-api up</span><strong>${hasObs ? '0' : '1'}</strong></div>
            <div class="grafana-panel ok"><span>Scrape interval</span><strong>15s</strong></div>
            <div class="grafana-panel ${hasInc ? 'alert' : 'ok'}"><span>5xx rate</span><strong>${hasInc ? '12.4/s' : '0.01/s'}</strong></div>
        </div>
        <pre id="prom-log" class="tool-log">up{job="partner-api"}</pre>`);
    addLimitedActions(container, [
        { text: '▶ up{job="partner-api"}', disabled: !hasObs, action: async () => {
            document.getElementById('prom-log').textContent = '→ 0 (1 target down)\npartner-api:9100 — connection refused';
            await opsAction('prometheus', 'partner-up');
        }},
        { text: '▶ Error rate query', action: () => {
            document.getElementById('prom-log').textContent = hasInc
                ? '→ 12.4 req/s — FIRING'
                : '→ 0.01 req/s — OK';
        }},
        { text: '📊 Grafana', action: () => openAppWindow('grafana') }
    ]);
}

function renderKittyApp(container) {
    container.innerHTML = appShell('🐱 Kitty', 'GPU terminal · 3 SSH sessions', '');
    const tabs = document.createElement('div');
    tabs.className = 'kitty-tabs';
    const sessions = [
        { id: 'local', label: 'local', text: '$ mvn spring-boot:run\nStarted CheckoutApplication in 4.2s\nTomcat started on port 8080' },
        { id: 'bastion', label: 'bastion.prod', text: 'ssh dmitry@jump-host.prod\nWelcome to Ubuntu 22.04 (jump host)\n$ kubectl get pods -n checkout' },
        { id: 'db', label: 'db-replica', text: 'ssh readonly@pg-replica.prod\nPostgreSQL 15.2 — read-only\n$ \\dt orders' }
    ];
    let active = 'local';
    sessions.forEach(s => {
        const tab = document.createElement('button');
        tab.type = 'button';
        tab.className = 'kitty-tab' + (s.id === active ? ' active' : '');
        tab.textContent = s.label;
        tab.onclick = () => {
            active = s.id;
            tabs.querySelectorAll('.kitty-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            out.textContent = sessions.find(x => x.id === active).text + '\n$ _';
        };
        tabs.appendChild(tab);
    });
    const out = document.createElement('pre');
    out.className = 'terminal-output kitty-output';
    out.textContent = sessions[0].text + '\n$ _';
    const body = container.querySelector('.app-body');
    body.appendChild(tabs);
    body.appendChild(out);
    addLimitedActions(container, [
        { text: '➕ New SSH tab', action: () => pushNotification('🐱 Kitty', 'Tab', 'vpn → bastion.prod (connected)', 'slack') },
        { text: '🖥 Open Remote Desktop', action: () => openAppWindow('rdp') },
        { text: 'kubectl logs payment-svc', action: async () => {
            out.textContent = getPodLogs('payment-svc') + '\n$ _';
            const ticket = resolveTicketForPod('payment-svc');
            if (ticket) {
                await focusTaskByTicket(ticket, false);
                hintK8sLogs('🐱 Kitty', 'payment-svc', ticket);
            }
        }}
    ]);
}

function renderRdpApp(container) {
    container.innerHTML = appShell('🖥 Remote Desktop', 'Jump hosts · xrdp · corporate VPN required', `
        <table class="tool-table"><tr><th>Host</th><th>Role</th><th>Status</th></tr>
        <tr><td>jump-host.prod</td><td>Bastion / kubectl</td><td>🟢 online</td></tr>
        <tr><td>win-legacy-esb</td><td>Legacy ESB admin</td><td>🟡 maintenance</td></tr>
        <tr><td>grafana-bastion</td><td>Read-only dashboards</td><td>🟢 online</td></tr>
        <tr><td>db-admin-replica</td><td>PostgreSQL (RO)</td><td>🔴 VPN required</td></tr>
        </table>
        <pre id="rdp-log" class="tool-log">Select host → Connect</pre>`);
    addLimitedActions(container, [
        { text: '🔗 Connect jump-host.prod', action: () => {
            document.getElementById('rdp-log').textContent = 'WireGuard OK → SSH jump-host.prod\nAuthorized keys accepted\n$ kubectl get pods -n checkout';
            openAppWindow('kitty');
        }},
        { text: '🔒 Connect db-admin (needs VPN)', action: () => {
            document.getElementById('rdp-log').textContent = 'ERROR: VPN disconnected — open VPN app first';
            openAppWindow('vpn');
        }},
        { text: '🪟 win-legacy-esb (RDP)', disabled: true }
    ]);
}

function renderVaultApp(container) {
    container.innerHTML = appShell('🔐 HashiCorp Vault', 'vault.prod · namespace: checkout · policy: dev-readonly', `
        <table class="tool-table"><tr><th>Path</th><th>Keys</th><th>Access</th></tr>
        <tr><td>secret/checkout/db</td><td>username, password, jdbc</td><td>🔒 DevOps only</td></tr>
        <tr><td>secret/checkout/kafka</td><td>sasl_user, sasl_pass</td><td>🔒 DevOps only</td></tr>
        <tr><td>secret/checkout/api-keys</td><td>stripe, sendgrid</td><td>👁 read (masked)</td></tr>
        <tr><td>secret/shared/vpn</td><td>wireguard_config</td><td>🔒 IT only</td></tr>
        </table>
        <pre id="vault-log" class="tool-log">vault status: unsealed · token TTL: 7h</pre>`);
    addLimitedActions(container, [
        { text: '👁 Read api-keys (masked)', action: () => {
            document.getElementById('vault-log').textContent = 'stripe: sk_live_****7x2Q\nsendgrid: SG.****9kLm\n⚠ Rotate keys quarterly';
        }},
        { text: '📝 Request db credentials', action: () => {
            document.getElementById('vault-log').textContent = 'Ticket DEVOPS-442 создан: доступ secret/checkout/db\nСтатус: pending approval (Дмитрий)';
            notifyOpsRequest('🔐 Vault', 'Access request', 'DEVOPS-442 — запрос credentials (без Slack-сообщения)');
        }},
        { text: '🔓 Unseal / write', disabled: true }
    ]);
}

function renderNginxApp(container) {
    const hasInc = taskActiveByTag('RACE_CONDITION');
    container.innerHTML = appShell('🌐 Nginx', 'reverse-proxy.prod · /etc/nginx/conf.d/checkout.conf', `
        <table class="tool-table"><tr><th>Upstream</th><th>Status</th><th>5xx (1h)</th></tr>
        <tr><td>checkout-api:8080</td><td>🟢 healthy</td><td>${hasInc ? '842' : '2'}</td></tr>
        <tr><td>payment-svc:8081</td><td class="${hasInc ? 'text-danger' : ''}">${hasInc ? '🔴 down' : '🟢 healthy'}</td><td>${hasInc ? '1204' : '0'}</td></tr>
        <tr><td>static-cdn</td><td>🟢 healthy</td><td>0</td></tr>
        </table>
        <pre id="nginx-log" class="tool-log">access.log tail:\nPOST /api/checkout → ${hasInc ? '502' : '200'} (${hasInc ? 'upstream timed out' : '12ms'})</pre>`);
    addLimitedActions(container, [
        { text: '✓ nginx -t (test config)', action: () => {
            document.getElementById('nginx-log').textContent = 'nginx: configuration file /etc/nginx/nginx.conf syntax is ok\nnginx: configuration test is successful';
        }},
        { text: '🔄 Reload nginx', disabled: true },
        { text: '📊 Open Prometheus', action: () => openAppWindow('prometheus') }
    ]);
}

function renderRabbitmqApp(container) {
    container.innerHTML = appShell('🐰 RabbitMQ', 'rabbitmq.prod:15672 · vhost: /checkout', `
        <table class="tool-table"><tr><th>Queue</th><th>Messages</th><th>Consumers</th></tr>
        <tr><td>billing.orders</td><td>1240</td><td>3</td></tr>
        <tr><td>notify.email</td><td>89</td><td>2</td></tr>
        <tr><td>esb.deadletter</td><td class="text-danger">2</td><td>0</td></tr>
        <tr><td>checkout.retry</td><td>15</td><td>1</td></tr>
        </table>
        <pre id="rmq-log" class="tool-log">Connections: 12 · Channels: 48</pre>`);
    addLimitedActions(container, [
        { text: '🔄 Purge dead-letter (DevOps)', disabled: true },
        { text: '🔀 Open ESB bridge', action: () => openAppWindow('bus') },
        { text: '📨 Compare with Kafka', action: () => openAppWindow('kafka') }
    ]);
}

function renderSentryApp(container) {
    const hasBug = hasActiveJavaBug();
    container.innerHTML = appShell('🐛 Sentry', 'project: checkout-backend · env: production', `
        <div class="tool-row ${hasBug ? '' : 'ok'}">${hasBug ? '🔴' : '🟢'} Unresolved issues: ${hasBug ? '3' : '0'}</div>
        <div class="tool-row">NullPointerException in OrderService.processPayment</div>
        <div class="tool-row">IllegalStateException: cart session expired (Redis)</div>
        <div class="tool-row">TimeoutException: payment-svc upstream</div>
        <pre id="sentry-log" class="tool-log">Last event: 2 min ago · 847 users affected</pre>`);
    addLimitedActions(container, [
        { text: '🔍 Open stack trace', action: async () => {
            const hasInc501 = taskActiveByTag('RACE_CONDITION');
            document.getElementById('sentry-log').textContent = hasInc501
                ? 'PaymentService.process:8\nRaceCondition — balance 847 != 1000\n→ Assign to: ' + workspace.player.name
                : 'OrderService.processPayment:42\ncustomer.getEmail() — customer is null\n→ Assign to: ' + workspace.player.name;
            await focusCheckoutErrorTask();
        }},
        { text: '🔗 Create JIRA from issue', action: () => openAppWindow('jira') },
        { text: '✅ Resolve all', disabled: !hasBug }
    ]);
}

function getSwaggerCheckoutError() {
    if (taskActiveByTag('RACE_CONDITION')) {
        return '500 Internal Server Error\n{\n  "error": "RaceCondition",\n  "service": "PaymentService"\n}';
    }
    if (taskActiveByTag('MEMORY_LEAK')) {
        return '503 Service Unavailable\n{\n  "error": "OutOfMemoryError",\n  "service": "checkout-api"\n}';
    }
    if (taskActiveByTag('KAFKA_CONSUMER')) {
        return '504 Gateway Timeout\n{\n  "error": "UpstreamTimeout",\n  "service": "payment-gateway"\n}';
    }
    return '500 Internal Server Error\n{\n  "error": "NullPointerException",\n  "path": "customer.email"\n}';
}

const SWAGGER_ENDPOINTS = [
    {
        id: 'orders',
        method: 'GET',
        path: '/api/orders',
        summary: 'List orders',
        desc: 'Returns paginated orders for the current merchant.',
        hasBody: false
    },
    {
        id: 'checkout',
        method: 'POST',
        path: '/api/checkout',
        summary: 'Create checkout session',
        desc: 'Starts payment flow. Requires customerId in body.',
        hasBody: true,
        defaultBody: '{\n  "customerId": null,\n  "cartId": "cart-142",\n  "amount": 99.0\n}'
    },
    {
        id: 'orderById',
        method: 'GET',
        path: '/api/orders/{id}',
        summary: 'Get order by id',
        desc: 'Path parameter id — order identifier.',
        hasBody: false,
        paramLabel: 'id',
        defaultParam: '142'
    },
    {
        id: 'health',
        method: 'GET',
        path: '/actuator/health',
        summary: 'Health check',
        desc: 'Spring Boot Actuator — service readiness.',
        hasBody: false
    },
    {
        id: 'webhook',
        method: 'POST',
        path: '/api/payments/webhook',
        summary: 'Payment webhook',
        desc: 'Stripe-style callback (simulation).',
        hasBody: true,
        defaultBody: '{\n  "event": "payment_intent.succeeded",\n  "orderId": 142\n}'
    }
];

function executeSwaggerRequest(endpointId, container) {
    const op = container.querySelector(`.swagger-op[data-id="${endpointId}"]`);
    const respEl = op?.querySelector('.swagger-resp');
    if (!respEl) return;

    let body = '';
    if (endpointId === 'checkout') {
        body = getSwaggerCheckoutError();
        hintCheckoutIncident('📜 Swagger');
    } else if (endpointId === 'orders') {
        body = '200 OK\n[\n  {"id": 1, "total": 99.0},\n  {"id": 2, "total": null}  ← NPE risk\n]';
    } else if (endpointId === 'orderById') {
        const id = op.querySelector('.swagger-param')?.value || '142';
        body = id === '142'
            ? `200 OK\n{\n  "id": 142,\n  "customer": null,\n  "total": 99.0\n}`
            : `404 Not Found\n{\n  "error": "Order not found",\n  "id": "${id}"\n}`;
    } else if (endpointId === 'health') {
        const down = taskActiveByTag('RACE_CONDITION') || taskActiveByTag('MEMORY_LEAK') || hasActiveJavaBug();
        body = down
            ? '200 OK\n{\n  "status": "UP",\n  "components": {\n    "checkout": "DOWN",\n    "payment": "DOWN"\n  }\n}'
            : '200 OK\n{\n  "status": "UP",\n  "components": {\n    "checkout": "UP",\n    "payment": "UP"\n  }\n}';
    } else if (endpointId === 'webhook') {
        body = '200 OK\n{\n  "received": true,\n  "orderId": 142\n}';
    } else {
        body = '404 Not Found';
    }

    respEl.textContent = body;
    respEl.classList.remove('empty');
}

function renderSwaggerApp(container) {
    const opsHtml = SWAGGER_ENDPOINTS.map(ep => `
        <div class="swagger-op" data-id="${ep.id}">
            <button type="button" class="swagger-op-header" aria-expanded="false">
                <span class="swagger-method ${ep.method.toLowerCase()}">${ep.method}</span>
                <span class="swagger-path">${ep.path}</span>
                <span class="swagger-summary">${ep.summary}</span>
            </button>
            <div class="swagger-op-panel">
                <p class="swagger-desc">${ep.desc}</p>
                ${ep.paramLabel ? `
                    <label class="swagger-field-label">${ep.paramLabel}</label>
                    <input type="text" class="swagger-param" value="${ep.defaultParam || ''}" disabled>` : ''}
                ${ep.hasBody ? `
                    <label class="swagger-field-label">Request body</label>
                    <textarea class="swagger-body-input" rows="5" disabled>${ep.defaultBody || ''}</textarea>` : ''}
                <div class="swagger-op-actions">
                    <button type="button" class="swagger-try-btn">Try it out</button>
                    <button type="button" class="swagger-exec-btn" disabled>Execute</button>
                </div>
                <pre class="swagger-resp tool-log empty">Response will appear here</pre>
            </div>
        </div>`).join('');

    container.innerHTML = appShell('📜 Swagger UI', 'OpenAPI 3.0 · Checkout API v2.1', `
        <div class="swagger-ui">${opsHtml}</div>`);

    container.querySelectorAll('.swagger-op').forEach(op => {
        const id = op.dataset.id;
        const header = op.querySelector('.swagger-op-header');
        const tryBtn = op.querySelector('.swagger-try-btn');
        const execBtn = op.querySelector('.swagger-exec-btn');
        const bodyInput = op.querySelector('.swagger-body-input');
        const paramInput = op.querySelector('.swagger-param');

        header.onclick = () => {
            const wasOpen = op.classList.contains('open');
            container.querySelectorAll('.swagger-op').forEach(o => {
                o.classList.remove('open');
                o.querySelector('.swagger-op-header')?.setAttribute('aria-expanded', 'false');
            });
            if (!wasOpen) {
                op.classList.add('open');
                header.setAttribute('aria-expanded', 'true');
            }
        };

        tryBtn.onclick = e => {
            e.stopPropagation();
            const active = tryBtn.classList.toggle('active');
            execBtn.disabled = !active;
            if (bodyInput) bodyInput.disabled = !active;
            if (paramInput) paramInput.disabled = !active;
            if (!active) {
                execBtn.disabled = true;
            }
        };

        execBtn.onclick = e => {
            e.stopPropagation();
            if (execBtn.disabled) return;
            executeSwaggerRequest(id, container);
        };
    });

    addLimitedActions(container, [
        { text: '💻 Open fix in IntelliJ', disabled: !resolveCheckoutIncidentTicket(), action: () => focusCheckoutErrorTask() },
        { text: '🚀 Open in Postman', action: () => openAppWindow('postman') },
        { text: '📋 Export OpenAPI YAML', action: () => pushNotification('📜 Swagger', 'Exported', 'openapi-checkout-v2.yaml', 'slack') }
    ]);
}

function renderGitlabApp(container) {
    const kafkaFail = taskActiveByTag('KAFKA_CONSUMER');
    const jiraFail = hasActiveJavaBug();
    const failed = kafkaFail || jiraFail;
    const failLog = kafkaFail
        ? 'Job integration-test: KafkaConsumerIT FAILED — 504 payment-gateway'
        : 'Job test: OrderServiceTest FAILED — NullPointerException';
    const myPr = (workspace.tasks || []).find(t => t.focused && t.pullRequestNumber);
    const mrLine = myPr
        ? `#${myPr.pullRequestNumber} ${myPr.ticketId} · ${myPr.pullRequestStatus || 'OPEN'}`
        : '#891 MR !247 · running';
    container.innerHTML = appShell('🦊 GitLab CI/CD', workspace.projectCompany + ' / checkout-backend', `
        <table class="tool-table"><tr><th>Pipeline</th><th>Stage</th><th>Status</th></tr>
        <tr><td>#892 main</td><td>test → build → deploy</td><td>${failed ? '🔴 failed' : '🟢 passed'}</td></tr>
        <tr><td>${mrLine}</td><td>test → review</td><td>${
            myPr?.pullRequestStatus === 'MERGED' ? '🟢 passed' : '🟡 running'
        }</td></tr>
        <tr><td>#890 main</td><td>test → build → deploy</td><td>🟢 passed</td></tr>
        </table>
        <pre id="gitlab-log" class="tool-log">${failed ? failLog : 'All jobs passed · deployed to staging'}</pre>`);
    addLimitedActions(container, [
        { text: '▶ Retry pipeline #892', disabled: !failed, action: async () => {
            document.getElementById('gitlab-log').textContent = 'Retrying… ' + failLog;
            if (kafkaFail) await focusTaskByTicket(taskByTag('KAFKA_CONSUMER')?.ticketId);
            else if (jiraFail) await focusActiveJavaBug();
        }},
        { text: '🤖 Open Jenkins (legacy)', action: () => openAppWindow('jenkins') },
        { text: '☸ Open Kubernetes', action: () => openAppWindow('kubernetes') },
        { text: '🚀 Deploy prod', disabled: true }
    ]);
}

function renderHelmApp(container) {
    container.innerHTML = appShell('⎈ Helm', 'namespace: checkout · cluster: prod', `
        <table class="tool-table"><tr><th>Release</th><th>Chart</th><th>Status</th><th>Revision</th></tr>
        <tr><td>checkout-api</td><td>checkout-2.4.1</td><td>🟢 deployed</td><td>14</td></tr>
        <tr><td>payment-svc</td><td>payment-1.8.0</td><td>🔴 failed</td><td>9</td></tr>
        <tr><td>kafka</td><td>bitnami/kafka</td><td>🟢 deployed</td><td>3</td></tr>
        <tr><td>redis</td><td>bitnami/redis</td><td>🟢 deployed</td><td>2</td></tr>
        </table>
        <pre id="helm-log" class="tool-log">helm list -n checkout</pre>`);
    addLimitedActions(container, [
        { text: '🔄 helm rollback payment-svc', action: () => {
            document.getElementById('helm-log').textContent = 'Rollback to revision 8… Done.\npayment-svc — deployed';
            pushNotification('⎈ Helm', 'Rollback', 'payment-svc → revision 8 (без фикса бага не поможет)', 'warning');
        }},
        { text: '☸ Open Kubernetes', action: () => openAppWindow('kubernetes') },
        { text: '🏗 helm upgrade (prod)', disabled: true }
    ]);
}

function renderTerraformApp(container) {
    container.innerHTML = appShell('🏗 Terraform', 'state: s3://tf-state-prod/checkout · workspace: prod', `
        <pre id="tf-log" class="tool-log">terraform plan — last run: yesterday

No changes. Infrastructure is up-to-date.

Managed resources: 47
  aws_eks_cluster.checkout
  aws_rds_instance.checkout-db
  aws_s3_bucket.logs
  ...</pre>`);
    addLimitedActions(container, [
        { text: '📋 terraform plan', action: () => {
            document.getElementById('tf-log').textContent = 'Plan: 0 to add, 0 to change, 0 to destroy.\n⚠ Manual change detected: security group sg-042 (DevOps)';
        }},
        { text: '☸ View K8s resources', action: () => openAppWindow('kubernetes') },
        { text: '🚀 terraform apply', disabled: true }
    ]);
}

function renderVpnApp(container) {
    const connected = true;
    container.innerHTML = appShell('🔒 WireGuard VPN', 'Corporate VPN · profile: checkout-dev', `
        <div class="tool-row ${connected ? 'ok' : ''}">${connected ? '🟢 Connected' : '🔴 Disconnected'} — ${connected ? '10.42.0.18' : '—'}</div>
        <div class="tool-row">Endpoint: vpn.corp.internal:51820</div>
        <div class="tool-row">Allowed: 10.0.0.0/8, jump-host.prod, prometheus.prod</div>
        <pre id="vpn-log" class="tool-log">Latest handshake: 45s ago · transfer: 128 MB</pre>`);
    addLimitedActions(container, [
        { text: '🔌 Disconnect', action: () => {
            document.getElementById('vpn-log').textContent = 'Disconnected. Internal resources unavailable.';
            pushNotification('🔒 VPN', 'Disconnected', 'RDP and Vault недоступны', 'warning');
        }},
        { text: '🖥 Open Remote Desktop', action: () => openAppWindow('rdp') },
        { text: '🔐 Open Vault', action: () => openAppWindow('vault') }
    ]);
}
