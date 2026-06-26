/** Sketch-style architecture flows (Excalidraw-like) per project */
(function () {
    const M = `<defs><marker id="arch-arr" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="#2d2d2d"/></marker></defs>`;

    function svg(w, h, body) {
        return `<svg class="arch-sketch-svg" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">${M}${body}</svg>`;
    }

    function box(x, y, w, h, text, fill = '#fff') {
        const lines = String(text).split('\n');
        const ty = y + h / 2 - (lines.length - 1) * 7 + 4;
        const tspans = lines.map((l, i) =>
            `<tspan x="${x + w / 2}" dy="${i === 0 ? 0 : 14}">${l}</tspan>`).join('');
        return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="${fill}" stroke="#2d2d2d" stroke-width="1.8"/>
<text x="${x + w / 2}" y="${ty}" text-anchor="middle" font-size="11" font-family="Segoe UI,system-ui,sans-serif">${tspans}</text>`;
    }

    function db(x, y, label, fill = '#dbeafe') {
        return `<ellipse cx="${x + 44}" cy="${y + 12}" rx="44" ry="10" fill="${fill}" stroke="#2d2d2d" stroke-width="1.8"/>
<rect x="${x}" y="${y + 10}" width="88" height="52" fill="${fill}" stroke="#2d2d2d" stroke-width="1.8"/>
<ellipse cx="${x + 44}" cy="${y + 62}" rx="44" ry="10" fill="${fill}" stroke="#2d2d2d" stroke-width="1.8"/>
<text x="${x + 44}" y="${y + 42}" text-anchor="middle" font-size="10" font-family="Segoe UI,sans-serif">${label}</text>`;
    }

    function kafka(x, y) {
        return box(x, y, 72, 36, 'kafka', '#fef3c7');
    }

    function arr(x1, y1, x2, y2, label, num) {
        let s = `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#2d2d2d" stroke-width="1.6" marker-end="url(#arch-arr)"/>`;
        if (num != null) {
            s += `<circle cx="${(x1 + x2) / 2 - 20}" cy="${(y1 + y2) / 2 - 12}" r="10" fill="#fff" stroke="#2d2d2d"/>`;
            s += `<text x="${(x1 + x2) / 2 - 20}" y="${(y1 + y2) / 2 - 8}" text-anchor="middle" font-size="9" font-weight="bold">(${num})</text>`;
        }
        if (label) {
            s += `<text x="${(x1 + x2) / 2}" y="${(y1 + y2) / 2 - 16}" text-anchor="middle" font-size="9" fill="#475569" font-family="Consolas,monospace">${label}</text>`;
        }
        return s;
    }

    const ARCH_DIAGRAMS = {
        E_COMMERCE: [{
            title: 'Checkout flow',
            html: svg(860, 280,
                `<rect width="100%" height="100%" fill="#fafaf8"/>
${box(20, 110, 64, 36, 'client')}
${box(120, 100, 36, 56, 'LB', '#e2e8f0')}
${box(200, 90, 100, 40, 'order-service')}
${box(200, 150, 100, 40, 'payment-svc')}
${kafka(340, 110)}
${db(440, 88, 'PostgreSQL')}
${db(440, 168, 'Redis', '#fecaca')}
${arr(84, 128, 118, 128, 'POST /checkout', 1)}
${arr(156, 110, 198, 110, '', 2)}
${arr(156, 140, 198, 170, '', 3)}
${arr(300, 110, 338, 128, 'event', 4)}
${arr(300, 170, 438, 198, 'cache', 5)}`)
        }],
        FINTECH: [{
            title: 'Payment authorization',
            html: svg(860, 260,
                `<rect width="100%" height="100%" fill="#fafaf8"/>
${box(24, 100, 70, 36, 'merchant')}
${box(130, 90, 40, 56, 'LB')}
${box(210, 100, 110, 40, 'payment-core')}
${box(350, 80, 90, 36, 'fraud-svc', '#fef3c7')}
${box(350, 140, 90, 36, 'ledger-svc')}
${db(480, 90, 'Oracle', '#dbeafe')}
${arr(94, 118, 128, 118, 'auth', 1)}
${arr(170, 118, 208, 118, '', 2)}
${arr(320, 110, 348, 98, 'score', 3)}
${arr(320, 130, 348, 158, 'post', 4)}
${arr(440, 118, 478, 118, '', 5)}`)
        }],
        STARTUP: [{
            title: 'Monolith deploy',
            html: svg(860, 240,
                `<rect width="100%" height="100%" fill="#fafaf8"/>
${box(40, 90, 80, 40, 'client')}
${box(160, 70, 140, 80, 'backend-api\n(monolith)', '#dcfce7')}
${db(340, 85, 'MongoDB', '#bbf7d0')}
${box(460, 90, 100, 40, 'GitHub\nActions', '#e2e8f0')}
${box(600, 90, 80, 40, 'Docker\nVPS')}
${arr(120, 110, 158, 110, 'REST', 1)}
${arr(300, 110, 338, 110, '', 2)}
${arr(440, 110, 458, 110, 'CI', 3)}
${arr(540, 110, 598, 110, 'deploy', 4)}`)
        }],
        ENTERPRISE: [{
            title: 'Legacy bridge',
            html: svg(860, 280,
                `<rect width="100%" height="100%" fill="#fafaf8"/>
${box(20, 100, 90, 40, 'new MS')}
${box(140, 100, 80, 40, 'ESB / MQ', '#fef3c7')}
${box(260, 80, 100, 50, 'legacy\nEAR monolith', '#e2e8f0')}
${db(400, 90, 'DB2', '#dbeafe')}
${box(520, 100, 100, 40, 'architect\nreview', '#fce7f3')}
${arr(110, 120, 138, 120, 'JMS', 1)}
${arr(220, 120, 258, 105, '', 2)}
${arr(360, 120, 398, 120, 'JDBC', 3)}
${arr(110, 130, 518, 120, 'CR approval', 4)}`)
        }],
        EDTECH: [{
            title: 'Course progress',
            html: svg(860, 260,
                `<rect width="100%" height="100%" fill="#fafaf8"/>
${box(30, 100, 64, 36, 'student')}
${box(130, 90, 40, 56, 'LB')}
${box(210, 100, 110, 40, 'progress-svc')}
${db(360, 88, 'PostgreSQL')}
${box(490, 100, 90, 40, 'search-svc')}
${db(610, 88, 'OpenSearch', '#fef9c3')}
${arr(94, 118, 128, 118, 'GET /progress', 1)}
${arr(170, 118, 208, 118, '', 2)}
${arr(320, 118, 358, 118, '', 3)}
${arr(430, 118, 488, 118, 'index', 4)}
${arr(580, 118, 608, 118, '', 5)}`)
        }],
        MDM: [{
            title: 'Golden record merge',
            html: svg(880, 300,
                `<rect width="100%" height="100%" fill="#fafaf8"/>
${box(16, 40, 72, 32, 'CRM')}
${box(16, 90, 72, 32, 'ERP')}
${box(16, 140, 72, 32, 'Web')}
${box(120, 80, 90, 44, 'ingestion-api')}
${box(240, 80, 100, 44, 'match-service', '#fef3c7')}
${box(380, 70, 100, 64, 'mdm-core')}
${db(520, 78, 'PostgreSQL')}
${kafka(520, 180)}
${box(640, 100, 90, 40, 'stewardship\nUI')}
${box(640, 180, 90, 40, 'DWH /\nCRM sync')}
${arr(88, 56, 118, 95, 'CDC', 1)}
${arr(88, 106, 118, 102, '', 2)}
${arr(88, 156, 118, 110, '', 3)}
${arr(210, 102, 238, 102, 'match', 4)}
${arr(340, 102, 378, 102, 'merge', 5)}
${arr(480, 102, 518, 102, 'save', 6)}
${arr(480, 130, 518, 198, 'event', 7)}
${arr(592, 200, 638, 200, 'poll', 8)}`)
        }],
        SOCIAL_PLATFORM: [{
            title: 'Save article',
            html: svg(900, 320,
                `<rect width="100%" height="100%" fill="#fafaf8"/>
${box(10, 120, 56, 36, 'client')}
${box(90, 100, 32, 76, 'LB', '#e2e8f0')}
${box(150, 50, 88, 32, 'auth-svc')}
${db(150, 10, 'PostgreSQL', '#dbeafe')}
${box(150, 130, 100, 40, 'article-svc')}
${db(280, 118, 'Cassandra', '#bbf7d0')}
${kafka(400, 128)}
${box(500, 90, 96, 40, 'search-svc')}
${db(620, 78, 'OpenSearch', '#fef9c3')}
${box(500, 170, 96, 40, 'feed-svc')}
${box(620, 160, 96, 40, 'followers-svc')}
${db(740, 148, 'Neo4j', '#fecaca')}
${db(740, 210, 'PostgreSQL', '#dbeafe')}
<text x="748" y="248" font-size="8" fill="#64748b">user_id, article_id</text>
${arr(66, 138, 88, 138, 'POST /article', 1)}
${arr(122, 138, 148, 150, '', 2)}
${arr(250, 150, 278, 150, 'save', 3)}
${arr(250, 140, 398, 146, 'produce', 4)}
${arr(122, 120, 148, 66, '', null)}
${arr(496, 146, 618, 98, 'poll', 5)}
${arr(580, 110, 618, 110, 'index', 6)}
${arr(496, 190, 618, 180, 'poll', 5)}
${arr(716, 180, 738, 170, 'followers', 6)}
${arr(716, 200, 738, 228, 'feed', 7)}
<text x="260" y="300" font-size="9" fill="#64748b" font-style="italic">Camunda (?) — optional workflow</text>`)
        }, {
            title: 'Get comments',
            html: svg(720, 240,
                `<rect width="100%" height="100%" fill="#fafaf8"/>
${box(24, 90, 56, 36, 'client')}
${box(110, 70, 32, 76, 'LB')}
${box(170, 100, 110, 40, 'comment-svc')}
${box(170, 40, 110, 36, 'article-svc', '#e2e8f0')}
${db(320, 88, 'MongoDB', '#bbf7d0')}
${arr(80, 108, 108, 108, 'GET …/comment', 1)}
${arr(142, 108, 168, 120, '', 2)}
${arr(225, 100, 225, 76, 'check exists', 3)}
${arr(280, 120, 318, 120, 'get', 4)}`)
        }],
        OPEN_BANKING: [{
            title: 'Payment initiation (PIS)',
            html: svg(860, 280,
                `<rect width="100%" height="100%" fill="#fafaf8"/>
${box(20, 100, 64, 36, 'TPP app')}
${box(110, 90, 40, 56, 'API GW')}
${box(180, 60, 100, 36, 'consent-svc', '#fef3c7')}
${box(180, 120, 100, 40, 'payment-svc')}
${box(320, 110, 110, 40, 'bank-connector')}
${box(460, 100, 90, 40, 'Bank API')}
${db(580, 88, 'audit log', '#e2e8f0')}
${arr(84, 118, 108, 118, 'PIS', 1)}
${arr(150, 100, 178, 78, 'consent', 2)}
${arr(150, 130, 178, 140, '', 3)}
${arr(280, 130, 318, 130, 'mTLS', 4)}
${arr(430, 130, 458, 130, '', 5)}
${arr(280, 150, 578, 110, 'audit', 6)}`)
        }],
        SUPPLY_CHAIN: [{
            title: 'Reserve inventory',
            html: svg(860, 260,
                `<rect width="100%" height="100%" fill="#fafaf8"/>
${box(24, 100, 70, 36, 'shop')}
${box(120, 90, 40, 56, 'LB')}
${box(190, 100, 90, 40, 'oms-svc')}
${box(310, 100, 110, 40, 'inventory-svc')}
${db(450, 88, 'Redis lock', '#fecaca')}
${db(450, 168, 'PostgreSQL', '#dbeafe')}
${box(570, 100, 100, 40, 'WMS adapter')}
${arr(94, 118, 118, 118, 'order', 1)}
${arr(160, 118, 188, 118, '', 2)}
${arr(280, 118, 308, 118, 'reserve', 3)}
${arr(420, 118, 448, 118, 'lock', 4)}
${arr(420, 140, 448, 188, 'persist', 5)}
${arr(530, 118, 568, 118, 'allocate', 6)}`)
        }],
        HEALTHCARE: [{
            title: 'FHIR Encounter create',
            html: svg(860, 260,
                `<rect width="100%" height="100%" fill="#fafaf8"/>
${box(24, 100, 70, 36, 'portal')}
${box(120, 90, 40, 56, 'FHIR GW')}
${box(190, 100, 110, 40, 'encounter-svc')}
${box(190, 50, 110, 36, 'patient-svc')}
${db(330, 88, 'PostgreSQL', '#dbeafe')}
${kafka(330, 168)}
${box(450, 160, 100, 40, 'audit-svc')}
${arr(94, 118, 118, 118, 'POST Enc', 1)}
${arr(160, 118, 188, 120, '', 2)}
${arr(245, 100, 245, 86, 'validate', 3)}
${arr(300, 120, 328, 120, 'save', 4)}
${arr(300, 140, 328, 188, 'event', 5)}
${arr(430, 188, 448, 180, 'PHI audit', 6)}`)
        }],
        INSURTECH: [{
            title: 'Submit claim (FNOL)',
            html: svg(860, 280,
                `<rect width="100%" height="100%" fill="#fafaf8"/>
${box(20, 100, 64, 36, 'mobile')}
${box(110, 90, 40, 56, 'LB')}
${box(180, 100, 100, 40, 'claim-svc')}
${box(310, 80, 90, 36, 'policy-svc')}
${box(310, 140, 90, 36, 'fraud-rules', '#fef3c7')}
${db(430, 88, 'MongoDB', '#bbf7d0')}
${box(430, 160, 90, 40, 'S3 docs')}
${arr(84, 118, 108, 118, 'FNOL', 1)}
${arr(150, 118, 178, 118, '', 2)}
${arr(280, 110, 308, 98, 'verify', 3)}
${arr(280, 130, 308, 158, 'score', 4)}
${arr(400, 120, 428, 120, 'save', 5)}
${arr(400, 140, 428, 180, 'upload', 6)}`)
        }],
        IOT_PLATFORM: [{
            title: 'Telemetry ingest',
            html: svg(860, 260,
                `<rect width="100%" height="100%" fill="#fafaf8"/>
${box(20, 100, 70, 36, 'device')}
${box(110, 100, 100, 40, 'mqtt-gateway')}
${box(240, 100, 100, 40, 'ingest-svc')}
${kafka(370, 108)}
${box(470, 80, 110, 40, 'stream\nprocessor')}
${db(610, 78, 'TimescaleDB', '#dbeafe')}
${box(610, 150, 90, 40, 'alert-svc', '#fecaca')}
${arr(90, 118, 108, 118, 'MQTT', 1)}
${arr(210, 118, 238, 118, '', 2)}
${arr(340, 118, 368, 118, 'publish', 3)}
${arr(450, 110, 468, 100, 'consume', 4)}
${arr(580, 100, 608, 100, 'write', 5)}
${arr(580, 120, 608, 170, 'threshold', 6)}`)
        }],
        LOGISTICS: [{
            title: 'Route calculation',
            html: svg(860, 280,
                `<rect width="100%" height="100%" fill="#fafaf8"/>
${box(20, 100, 80, 36, 'dispatcher')}
${box(130, 90, 40, 56, 'LB')}
${box(200, 100, 90, 40, 'tms-api')}
${box(320, 90, 100, 40, 'route-svc')}
${box(320, 150, 100, 40, 'geo-svc', '#dcfce7')}
${db(460, 78, 'Neo4j', '#fecaca')}
${db(460, 168, 'PostGIS', '#dbeafe')}
${kafka(580, 120)}
${box(680, 110, 90, 40, 'driver app')}
${arr(100, 118, 128, 118, 'plan', 1)}
${arr(170, 118, 198, 118, '', 2)}
${arr(290, 118, 318, 110, '', 3)}
${arr(340, 130, 340, 150, 'coords', 4)}
${arr(420, 110, 458, 100, 'graph', 5)}
${arr(420, 160, 458, 188, 'roads', 6)}
${arr(560, 130, 678, 130, 'notify', 7)}`)
        }],
        GOVTECH: [{
            title: 'Citizen application',
            html: svg(860, 280,
                `<rect width="100%" height="100%" fill="#fafaf8"/>
${box(16, 100, 72, 36, 'citizen')}
${box(110, 90, 40, 56, 'portal')}
${box(180, 100, 100, 40, 'case-svc')}
${box(310, 100, 90, 40, 'ESB', '#fef3c7')}
${box(430, 80, 110, 56, 'legacy\nmainframe', '#e2e8f0')}
${db(570, 88, 'PostgreSQL', '#dbeafe')}
${box(570, 160, 90, 40, 'MinIO\ndocs')}
${arr(88, 118, 108, 118, 'apply', 1)}
${arr(150, 118, 178, 118, '', 2)}
${arr(280, 118, 308, 118, 'route', 3)}
${arr(400, 118, 428, 108, 'MQ', 4)}
${arr(280, 130, 568, 110, 'store', 5)}
${arr(280, 150, 568, 180, 'scan', 6)}`)
        }],
        MEDIA_STREAMING: [{
            title: 'Video upload pipeline',
            html: svg(860, 280,
                `<rect width="100%" height="100%" fill="#fafaf8"/>
${box(16, 100, 72, 36, 'creator')}
${box(110, 90, 40, 56, 'LB')}
${box(180, 100, 100, 40, 'upload-api')}
${box(310, 90, 120, 40, 'transcode\norchestrator')}
${box(460, 70, 80, 36, 'worker')}
${box(460, 120, 80, 36, 'worker')}
${box(570, 90, 70, 40, 'S3')}
${db(670, 78, 'Cassandra', '#bbf7d0')}
${kafka(670, 160)}
${box(780, 150, 70, 40, 'reco')}
${arr(88, 118, 108, 118, 'chunk', 1)}
${arr(150, 118, 178, 118, '', 2)}
${arr(280, 118, 308, 110, 'job', 3)}
${arr(430, 100, 458, 88, '', 4)}
${arr(430, 130, 458, 138, '', 4)}
${arr(550, 110, 568, 110, 'store', 5)}
${arr(640, 110, 668, 100, 'meta', 6)}
${arr(740, 180, 778, 170, 'event', 7)}`)
        }]
    };

    const ZOOM_MIN = 0.75;
    const ZOOM_MAX = 3;
    const ZOOM_STEP = 0.25;
    const ZOOM_DEFAULT = 1;

    function archZoomLabel(key) {
        if (typeof t === 'function') return t('arch.zoom.' + key);
        const ru = { in: 'Увеличить', out: 'Уменьшить', reset: 'Сбросить', expand: 'Приблизить', label: 'Масштаб схемы' };
        const en = { in: 'Zoom in', out: 'Zoom out', reset: 'Reset', expand: 'Enlarge', label: 'Diagram scale' };
        const lang = typeof getLang === 'function' ? getLang() : 'ru';
        return (lang === 'en' ? en : ru)[key] || key;
    }

    function applyArchZoom(block, scale) {
        const level = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, scale));
        const svg = block.querySelector('.arch-sketch-svg');
        if (!svg) return level;
        block.dataset.zoom = String(level);
        const inLightbox = !!block.closest('#arch-diagram-lightbox');
        const baseWidth = inLightbox ? 720 : 520;
        const baseHeight = inLightbox ? 360 : 220;
        svg.style.minWidth = `${baseWidth * level}px`;
        svg.style.maxHeight = `${baseHeight * level}px`;
        const pct = Math.round(level * 100) + '%';
        block.querySelectorAll('.arch-zoom-level').forEach(el => { el.textContent = pct; });
        const lb = block.closest('#arch-diagram-lightbox');
        if (lb) {
            const headerLabel = lb.querySelector('.arch-diagram-lightbox-header .arch-zoom-level');
            if (headerLabel) headerLabel.textContent = pct;
        }
        return level;
    }

    function ensureArchLightbox() {
        let lb = document.getElementById('arch-diagram-lightbox');
        if (lb) return lb;
        lb = document.createElement('div');
        lb.id = 'arch-diagram-lightbox';
        lb.className = 'arch-diagram-lightbox hidden';
        lb.innerHTML = `
<div class="arch-diagram-lightbox-backdrop" data-arch-action="close"></div>
<div class="arch-diagram-lightbox-panel" role="dialog" aria-modal="true" aria-labelledby="arch-lightbox-title">
  <div class="arch-diagram-lightbox-header">
    <p class="arch-diagram-lightbox-title" id="arch-lightbox-title"></p>
    <div class="arch-diagram-zoom arch-diagram-zoom--lightbox" role="group">
      <button type="button" class="arch-zoom-btn" data-arch-action="zoom-out" title="">−</button>
      <span class="arch-zoom-level">100%</span>
      <button type="button" class="arch-zoom-btn" data-arch-action="zoom-in" title="">+</button>
      <button type="button" class="arch-zoom-btn arch-zoom-btn--reset" data-arch-action="zoom-reset" title="">↺</button>
    </div>
    <button type="button" class="arch-zoom-btn arch-zoom-btn--close" data-arch-action="close" aria-label="×">×</button>
  </div>
  <div class="arch-diagram-lightbox-body"></div>
</div>`;
        document.body.appendChild(lb);
        return lb;
    }

    function refreshArchLightboxLabels(lb) {
        const zoom = lb.querySelector('.arch-diagram-zoom');
        if (!zoom) return;
        zoom.querySelector('[data-arch-action="zoom-out"]').title = archZoomLabel('out');
        zoom.querySelector('[data-arch-action="zoom-in"]').title = archZoomLabel('in');
        zoom.querySelector('[data-arch-action="zoom-reset"]').title = archZoomLabel('reset');
        zoom.setAttribute('aria-label', archZoomLabel('label'));
    }

    function openArchLightbox(block) {
        const lb = ensureArchLightbox();
        const title = block.querySelector('.arch-diagram-title')?.textContent || '';
        const canvas = block.querySelector('.arch-diagram-canvas');
        if (!canvas) return;
        const body = lb.querySelector('.arch-diagram-lightbox-body');
        body.innerHTML = `<div class="arch-diagram-canvas arch-diagram-canvas--lightbox">${canvas.innerHTML}</div>`;
        lb.querySelector('.arch-diagram-lightbox-title').textContent = title;
        refreshArchLightboxLabels(lb);
        const zoom = parseFloat(block.dataset.zoom) || ZOOM_DEFAULT;
        body.dataset.zoom = String(zoom);
        applyArchZoom(body, zoom);
        lb._archZoomHost = body;
        lb.classList.remove('hidden');
        document.body.classList.add('arch-lightbox-open');
    }

    function closeArchLightbox() {
        const lb = document.getElementById('arch-diagram-lightbox');
        if (!lb) return;
        lb.classList.add('hidden');
        lb.querySelector('.arch-diagram-lightbox-body').innerHTML = '';
        lb._archZoomHost = null;
        document.body.classList.remove('arch-lightbox-open');
    }

    function handleArchDiagramAction(e) {
        const btn = e.target.closest('[data-arch-action], [data-zoom]');
        if (!btn) return;

        const lb = document.getElementById('arch-diagram-lightbox');
        const inLightbox = btn.closest('#arch-diagram-lightbox');
        const block = inLightbox
            ? lb?._archZoomHost
            : btn.closest('.arch-diagram-block');
        if (!block) return;

        const action = btn.dataset.archAction || btn.dataset.zoom;
        let zoom = parseFloat(block.dataset.zoom) || ZOOM_DEFAULT;

        if (action === 'close') {
            closeArchLightbox();
            return;
        }
        if (action === 'expand') {
            if (!inLightbox) openArchLightbox(block.closest('.arch-diagram-block') || block);
            return;
        }
        if (action === 'zoom-in' || action === 'in') zoom += ZOOM_STEP;
        else if (action === 'zoom-out' || action === 'out') zoom -= ZOOM_STEP;
        else if (action === 'zoom-reset' || action === 'reset') zoom = ZOOM_DEFAULT;

        applyArchZoom(block, zoom);
        e.preventDefault();
    }

    function initArchitectureDiagramControls() {
        if (window._archDiagramControlsReady) return;
        window._archDiagramControlsReady = true;
        document.addEventListener('click', handleArchDiagramAction);
        document.addEventListener('keydown', e => {
            if (e.key === 'Escape') closeArchLightbox();
        });
    }

    function renderArchitectureDiagrams(projectId) {
        initArchitectureDiagramControls();
        const flows = ARCH_DIAGRAMS[projectId];
        if (!flows?.length) return '';
        return flows.map(f => `
<div class="arch-diagram-block" data-zoom="${ZOOM_DEFAULT}">
  <div class="arch-diagram-header">
    <p class="arch-diagram-title">${f.title}</p>
    <div class="arch-diagram-zoom" role="group" aria-label="${archZoomLabel('label')}">
      <button type="button" class="arch-zoom-btn" data-zoom="out" title="${archZoomLabel('out')}">−</button>
      <span class="arch-zoom-level">100%</span>
      <button type="button" class="arch-zoom-btn" data-zoom="in" title="${archZoomLabel('in')}">+</button>
      <button type="button" class="arch-zoom-btn arch-zoom-btn--reset" data-zoom="reset" title="${archZoomLabel('reset')}">↺</button>
      <button type="button" class="arch-zoom-btn arch-zoom-btn--expand" data-arch-action="expand" title="${archZoomLabel('expand')}">⤢</button>
    </div>
  </div>
  <div class="arch-diagram-viewport">
    <div class="arch-diagram-canvas">${f.html}</div>
  </div>
</div>`).join('');
    }

    window.renderArchitectureDiagrams = renderArchitectureDiagrams;
    window.ARCH_DIAGRAM_PROJECTS = Object.keys(ARCH_DIAGRAMS);
})();
