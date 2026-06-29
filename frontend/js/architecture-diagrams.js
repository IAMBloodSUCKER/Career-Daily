/** Architecture flow diagrams — orthogonal layout, aligned labels */
(function () {
    const M = `<defs><marker id="arch-arr" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0,0 L7,3.5 L0,7 z" fill="#374151"/></marker></defs>`;
    const BG = '#fafaf8';
    const ST = '#374151';
    const SW = 1.5;
    const CY = 122;
    const ROW_TOP = CY - 36;
    const ROW_BOT = CY + 36;
    const GAP = 12;

    function svg(w, h, body) {
        return `<svg class="arch-sketch-svg" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" shape-rendering="geometricPrecision">${M}<rect width="100%" height="100%" fill="${BG}"/>${body}</svg>`;
    }

    function box(x, y, w, h, text, fill = '#fff') {
        const lines = String(text).split('\n');
        const ty = y + h / 2 - (lines.length - 1) * 7 + 4;
        const tspans = lines.map((l, i) =>
            `<tspan x="${x + w / 2}" dy="${i === 0 ? 0 : 14}">${l}</tspan>`).join('');
        return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" fill="${fill}" stroke="${ST}" stroke-width="${SW}"/>
<text x="${x + w / 2}" y="${ty}" text-anchor="middle" font-size="10.5" font-family="Segoe UI,system-ui,sans-serif" fill="#1e293b">${tspans}</text>`;
    }

    function db(x, y, label, fill = '#dbeafe') {
        const w = 92;
        const h = 52;
        return `<ellipse cx="${x + w / 2}" cy="${y + 9}" rx="${w / 2}" ry="8" fill="${fill}" stroke="${ST}" stroke-width="${SW}"/>
<rect x="${x}" y="${y + 7}" width="${w}" height="${h}" fill="${fill}" stroke="${ST}" stroke-width="${SW}"/>
<ellipse cx="${x + w / 2}" cy="${y + h + 7}" rx="${w / 2}" ry="8" fill="${fill}" stroke="${ST}" stroke-width="${SW}"/>
<text x="${x + w / 2}" y="${y + 34}" text-anchor="middle" font-size="10" font-family="Segoe UI,sans-serif" fill="#1e293b">${label}</text>`;
    }

    function kafka(x, y) {
        return box(x, y, 76, 34, 'kafka', '#fef3c7');
    }

    function badge(x, y, num) {
        return `<circle cx="${x}" cy="${y}" r="8.5" fill="#fff" stroke="${ST}" stroke-width="1.3"/>
<text x="${x}" y="${y + 3.2}" text-anchor="middle" font-size="7.5" font-weight="700" font-family="Segoe UI,sans-serif">(${num})</text>`;
    }

    function lbl(x, y, text, anchor = 'middle') {
        if (!text) return '';
        return `<text x="${x}" y="${y}" text-anchor="${anchor}" font-size="9" fill="#475569" font-family="Consolas,monospace">${text}</text>`;
    }

    /** Label above line, badge between label and line — no overlap */
    function markH(mx, y, label, num) {
        let s = '';
        if (label) s += lbl(mx, y - (num != null ? 26 : 12), label);
        if (num != null) s += badge(mx, y - 11, num);
        return s;
    }

    function markV(x, my, label, num) {
        let s = '';
        if (label) s += lbl(x + (num != null ? 30 : 14), my + 3, label, 'start');
        if (num != null) s += badge(x + 11, my, num);
        return s;
    }

    function hArr(x1, x2, y, label, num) {
        const mx = (x1 + x2) / 2;
        return `<line x1="${x1}" y1="${y}" x2="${x2 - 5}" y2="${y}" stroke="${ST}" stroke-width="${SW}" marker-end="url(#arch-arr)"/>`
            + markH(mx, y, label, num);
    }

    function vArr(x, y1, y2, label, num) {
        const my = (y1 + y2) / 2;
        const dir = y2 > y1 ? 1 : -1;
        return `<line x1="${x}" y1="${y1}" x2="${x}" y2="${y2 - dir * 5}" stroke="${ST}" stroke-width="${SW}" marker-end="url(#arch-arr)"/>`
            + markV(x, my, label, num);
    }

    /** Orthogonal path — annotate on longest segment */
    function route(points, label, num) {
        if (points.length < 2) return '';
        let bestLen = 0;
        let ax = 0;
        let ay = 0;
        let horiz = true;
        for (let i = 1; i < points.length; i++) {
            const a = points[i - 1];
            const b = points[i];
            const len = Math.abs(b.x - a.x) + Math.abs(b.y - a.y);
            if (len > bestLen) {
                bestLen = len;
                ax = (a.x + b.x) / 2;
                ay = (a.y + b.y) / 2;
                horiz = Math.abs(b.x - a.x) >= Math.abs(b.y - a.y);
            }
        }
        const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
        const ann = horiz ? markH(ax, ay, label, num) : markV(ax, ay, label, num);
        return `<path d="${d}" fill="none" stroke="${ST}" stroke-width="${SW}" marker-end="url(#arch-arr)"/>${ann}`;
    }

    const ARCH_DIAGRAMS = {
        E_COMMERCE: [{
            title: 'Checkout flow',
            html: svg(740, 248,
                `${box(20, CY - 18, 68, 36, 'client')}
${box(108, CY - 30, 40, 60, 'LB', '#e2e8f0')}
${box(168, ROW_TOP, 108, 40, 'order-service')}
${box(168, ROW_BOT, 108, 40, 'payment-svc')}
${kafka(300, ROW_TOP + 3)}
${db(420, ROW_TOP - 4, 'PostgreSQL')}
${db(420, ROW_BOT - 4, 'Redis', '#fecaca')}
${hArr(88, 108, CY, 'POST /checkout', 1)}
${hArr(148, 168, ROW_TOP + 20, '', 2)}
${route([{ x: 148, y: CY }, { x: 148 + GAP, y: CY }, { x: 148 + GAP, y: ROW_BOT + 20 }, { x: 168, y: ROW_BOT + 20 }], '', 3)}
${hArr(276, 300, ROW_TOP + 20, 'event', 4)}
${hArr(276, 420, ROW_TOP + 20, 'persist', 5)}
${hArr(276, 420, ROW_BOT + 20, 'cache', 6)}`)
        }],
        FINTECH: [{
            title: 'Payment authorization',
            html: svg(640, 248,
                `${box(20, CY - 18, 72, 36, 'merchant')}
${box(108, CY - 30, 40, 60, 'LB', '#e2e8f0')}
${box(168, CY - 20, 112, 40, 'payment-core')}
${box(300, ROW_TOP, 92, 36, 'fraud-svc', '#fef3c7')}
${box(300, ROW_BOT, 92, 36, 'ledger-svc')}
${db(420, CY - 32, 'Oracle', '#dbeafe')}
${hArr(92, 108, CY, 'auth', 1)}
${hArr(148, 168, CY, '', 2)}
${route([{ x: 280, y: CY - 8 }, { x: 290, y: CY - 8 }, { x: 290, y: ROW_TOP + 18 }, { x: 300, y: ROW_TOP + 18 }], 'score', 3)}
${route([{ x: 280, y: CY + 8 }, { x: 290, y: CY + 8 }, { x: 290, y: ROW_BOT + 18 }, { x: 300, y: ROW_BOT + 18 }], 'post', 4)}
${hArr(392, 420, CY, '', 5)}`)
        }],
        STARTUP: [{
            title: 'Monolith deploy',
            html: svg(720, 200,
                `${box(24, CY - 20, 80, 40, 'client')}
${box(128, CY - 40, 140, 80, 'backend-api\n(monolith)', '#dcfce7')}
${db(296, CY - 28, 'MongoDB', '#bbf7d0')}
${box(408, CY - 20, 100, 40, 'GitHub\nActions', '#e2e8f0')}
${box(532, CY - 20, 80, 40, 'Docker\nVPS')}
${hArr(104, 128, CY, 'REST', 1)}
${hArr(268, 296, CY, '', 2)}
${hArr(384, 408, CY, 'CI', 3)}
${hArr(508, 532, CY, 'deploy', 4)}`)
        }],
        ENTERPRISE: [{
            title: 'Legacy bridge',
            html: svg(680, 220,
                `${box(16, CY - 20, 90, 40, 'new MS')}
${box(126, CY - 20, 80, 40, 'ESB / MQ', '#fef3c7')}
${box(226, CY - 25, 100, 50, 'legacy\nEAR monolith', '#e2e8f0')}
${db(346, CY - 28, 'DB2', '#dbeafe')}
${box(456, CY - 20, 100, 40, 'architect\nreview', '#fce7f3')}
${hArr(106, 126, CY, 'JMS', 1)}
${hArr(206, 226, CY, '', 2)}
${hArr(326, 346, CY, 'JDBC', 3)}
${route([{ x: 106, y: CY + 12 }, { x: 106, y: CY + 48 }, { x: 456, y: CY + 48 }, { x: 456, y: CY + 20 }], 'CR approval', 4)}`)
        }],
        EDTECH: [{
            title: 'Course progress',
            html: svg(720, 200,
                `${box(24, CY - 18, 64, 36, 'student')}
${box(108, CY - 28, 40, 56, 'LB', '#e2e8f0')}
${box(168, CY - 20, 110, 40, 'progress-svc')}
${db(298, CY - 28, 'PostgreSQL')}
${box(406, CY - 20, 90, 40, 'search-svc')}
${db(516, CY - 28, 'OpenSearch', '#fef9c3')}
${hArr(88, 108, CY, 'GET /progress', 1)}
${hArr(148, 168, CY, '', 2)}
${hArr(278, 298, CY, '', 3)}
${hArr(384, 406, CY, 'index', 4)}
${hArr(496, 516, CY, '', 5)}`)
        }],
        MDM: [{
            title: 'Golden record merge',
            html: svg(780, 280,
                `${box(16, 36, 72, 32, 'CRM')}
${box(16, 86, 72, 32, 'ERP')}
${box(16, 136, 72, 32, 'Web')}
${box(112, CY - 22, 90, 44, 'ingestion-api')}
${box(222, CY - 22, 100, 44, 'match-service', '#fef3c7')}
${box(342, CY - 32, 100, 64, 'mdm-core')}
${db(462, CY - 30, 'PostgreSQL')}
${kafka(462, CY + 52)}
${box(572, CY - 20, 90, 40, 'stewardship\nUI')}
${box(572, CY + 42, 90, 40, 'DWH /\nCRM sync')}
${route([{ x: 88, y: 52 }, { x: 102, y: 52 }, { x: 102, y: CY - 8 }, { x: 112, y: CY - 8 }], 'CDC', 1)}
${route([{ x: 88, y: 102 }, { x: 102, y: 102 }, { x: 102, y: CY + 4 }, { x: 112, y: CY + 4 }], '', 2)}
${route([{ x: 88, y: 152 }, { x: 102, y: 152 }, { x: 102, y: CY + 16 }, { x: 112, y: CY + 16 }], '', 3)}
${hArr(202, 222, CY, 'match', 4)}
${hArr(322, 342, CY, 'merge', 5)}
${hArr(442, 462, CY, 'save', 6)}
${route([{ x: 392, y: CY + 16 }, { x: 392, y: CY + 70 }, { x: 462, y: CY + 70 }], 'event', 7)}
${hArr(554, 572, CY + 62, 'poll', 8)}`)
        }],
        SOCIAL_PLATFORM: [{
            title: 'Save article',
            html: svg(860, 280,
                `${box(16, CY - 18, 60, 36, 'client')}
${box(96, CY - 30, 40, 60, 'LB', '#e2e8f0')}
${box(156, ROW_TOP, 96, 36, 'auth-svc')}
${db(156, ROW_TOP - 72, 'PostgreSQL', '#dbeafe')}
${box(156, ROW_BOT, 104, 40, 'article-svc')}
${db(280, ROW_BOT - 4, 'Cassandra', '#bbf7d0')}
${kafka(392, ROW_BOT + 3)}
${box(488, ROW_TOP, 96, 40, 'search-svc')}
${db(604, ROW_TOP - 4, 'OpenSearch', '#fef9c3')}
${box(488, ROW_BOT, 96, 40, 'feed-svc')}
${box(604, ROW_BOT, 96, 40, 'followers-svc')}
${db(720, ROW_TOP - 4, 'Neo4j', '#fecaca')}
${db(720, ROW_BOT - 4, 'PostgreSQL', '#dbeafe')}
${hArr(76, 96, CY, 'POST /article', 1)}
${hArr(136, 156, ROW_BOT + 20, '', 2)}
${hArr(260, 280, ROW_BOT + 20, 'save', 3)}
${hArr(376, 392, ROW_BOT + 20, 'produce', 4)}
${route([{ x: 136, y: ROW_BOT + 20 }, { x: 136, y: ROW_TOP + 18 }, { x: 156, y: ROW_TOP + 18 }], 'token', null)}
${route([{ x: 468, y: ROW_BOT + 20 }, { x: 478, y: ROW_BOT + 20 }, { x: 478, y: ROW_TOP + 20 }, { x: 488, y: ROW_TOP + 20 }], 'poll', 5)}
${hArr(584, 604, ROW_TOP + 20, 'index', 6)}
${route([{ x: 488, y: ROW_BOT + 20 }, { x: 488, y: ROW_BOT + 52 }, { x: 604, y: ROW_BOT + 52 }, { x: 604, y: ROW_BOT + 20 }], 'poll', 7)}
${hArr(700, 720, ROW_BOT + 20, 'followers', 8)}
${hArr(700, 720, ROW_TOP + 20, 'feed', 9)}`)
        }, {
            title: 'Get comments',
            html: svg(520, 228,
                `${box(20, CY - 18, 60, 36, 'client')}
${box(96, CY - 30, 40, 60, 'LB', '#e2e8f0')}
${box(156, CY - 20, 112, 40, 'comment-svc')}
${box(156, ROW_TOP, 112, 36, 'article-svc', '#e2e8f0')}
${db(288, CY - 32, 'MongoDB', '#bbf7d0')}
${hArr(80, 96, CY, 'GET …/comment', 1)}
${hArr(136, 156, CY, '', 2)}
${vArr(212, ROW_TOP + 36, CY - 20, 'check exists', 3)}
${hArr(268, 288, CY, 'get', 4)}`)
        }],
        OPEN_BANKING: [{
            title: 'Payment initiation (PIS)',
            html: svg(720, 248,
                `${box(20, CY - 18, 68, 36, 'TPP app')}
${box(108, CY - 30, 40, 60, 'API GW', '#e2e8f0')}
${box(168, ROW_TOP, 104, 36, 'consent-svc', '#fef3c7')}
${box(168, ROW_BOT, 104, 40, 'payment-svc')}
${box(292, CY - 8, 112, 40, 'bank-connector')}
${box(424, CY - 20, 92, 40, 'Bank API')}
${db(536, CY - 32, 'audit log', '#e2e8f0')}
${hArr(88, 108, CY, 'PIS', 1)}
${route([{ x: 148, y: CY - 6 }, { x: 148 + GAP, y: CY - 6 }, { x: 148 + GAP, y: ROW_TOP + 18 }, { x: 168, y: ROW_TOP + 18 }], 'consent', 2)}
${route([{ x: 148, y: CY + 6 }, { x: 148 + GAP, y: CY + 6 }, { x: 148 + GAP, y: ROW_BOT + 20 }, { x: 168, y: ROW_BOT + 20 }], '', 3)}
${route([{ x: 272, y: ROW_BOT + 20 }, { x: 282, y: ROW_BOT + 20 }, { x: 282, y: CY }, { x: 292, y: CY }], 'mTLS', 4)}
${hArr(404, 424, CY, '', 5)}
${route([{ x: 404, y: ROW_BOT + 40 }, { x: 404, y: CY + 52 }, { x: 536, y: CY + 52 }, { x: 536, y: CY + 34 }], 'audit', 6)}`)
        }],
        SUPPLY_CHAIN: [{
            title: 'Reserve inventory',
            html: svg(720, 248,
                `${box(20, CY - 18, 72, 36, 'shop')}
${box(108, CY - 30, 40, 60, 'LB', '#e2e8f0')}
${box(168, CY - 20, 92, 40, 'oms-svc')}
${box(280, CY - 20, 112, 40, 'inventory-svc')}
${db(420, ROW_TOP - 4, 'Redis lock', '#fecaca')}
${db(420, ROW_BOT - 4, 'PostgreSQL', '#dbeafe')}
${box(536, CY - 20, 100, 40, 'WMS adapter')}
${hArr(92, 108, CY, 'order', 1)}
${hArr(148, 168, CY, '', 2)}
${hArr(260, 280, CY, 'reserve', 3)}
${hArr(392, 420, ROW_TOP + 20, 'lock', 4)}
${hArr(392, 420, ROW_BOT + 20, 'persist', 5)}
${hArr(512, 536, CY, 'allocate', 6)}`)
        }],
        HEALTHCARE: [{
            title: 'FHIR Encounter create',
            html: svg(620, 248,
                `${box(20, CY - 18, 72, 36, 'portal')}
${box(108, CY - 30, 40, 60, 'FHIR GW', '#e2e8f0')}
${box(168, CY - 20, 112, 40, 'encounter-svc')}
${box(168, ROW_TOP, 112, 36, 'patient-svc')}
${db(300, CY - 32, 'PostgreSQL', '#dbeafe')}
${kafka(300, ROW_BOT + 6)}
${box(396, ROW_BOT, 104, 40, 'audit-svc')}
${hArr(92, 108, CY, 'POST Enc', 1)}
${hArr(148, 168, CY, '', 2)}
${vArr(224, ROW_TOP + 36, CY - 20, 'validate', 3)}
${hArr(280, 300, CY, 'save', 4)}
${route([{ x: 224, y: CY + 20 }, { x: 224, y: ROW_BOT + 24 }, { x: 300, y: ROW_BOT + 24 }], 'event', 5)}
${hArr(368, 396, ROW_BOT + 20, 'PHI audit', 6)}`)
        }],
        INSURTECH: [{
            title: 'Submit claim (FNOL)',
            html: svg(580, 248,
                `${box(20, CY - 18, 68, 36, 'mobile')}
${box(108, CY - 30, 40, 60, 'LB', '#e2e8f0')}
${box(168, CY - 20, 104, 40, 'claim-svc')}
${box(292, ROW_TOP, 92, 36, 'policy-svc')}
${box(292, ROW_BOT, 92, 36, 'fraud-rules', '#fef3c7')}
${db(404, ROW_TOP - 4, 'MongoDB', '#bbf7d0')}
${box(404, ROW_BOT, 92, 40, 'S3 docs')}
${hArr(88, 108, CY, 'FNOL', 1)}
${hArr(148, 168, CY, '', 2)}
${route([{ x: 272, y: CY - 8 }, { x: 282, y: CY - 8 }, { x: 282, y: ROW_TOP + 18 }, { x: 292, y: ROW_TOP + 18 }], 'verify', 3)}
${route([{ x: 272, y: CY + 8 }, { x: 282, y: CY + 8 }, { x: 282, y: ROW_BOT + 18 }, { x: 292, y: ROW_BOT + 18 }], 'score', 4)}
${hArr(384, 404, ROW_TOP + 20, 'save', 5)}
${route([{ x: 220, y: CY + 20 }, { x: 220, y: ROW_BOT + 20 }, { x: 404, y: ROW_BOT + 20 }], 'upload', 6)}`)
        }],
        IOT_PLATFORM: [{
            title: 'Telemetry ingest',
            html: svg(740, 248,
                `${box(20, CY - 18, 72, 36, 'device')}
${box(108, CY - 20, 104, 40, 'mqtt-gateway')}
${box(232, CY - 20, 104, 40, 'ingest-svc')}
${kafka(356, CY - 15)}
${box(452, CY - 20, 112, 40, 'stream\nprocessor')}
${db(584, ROW_TOP - 4, 'TimescaleDB', '#dbeafe')}
${box(584, ROW_BOT, 92, 40, 'alert-svc', '#fecaca')}
${hArr(92, 108, CY, 'MQTT', 1)}
${hArr(212, 232, CY, '', 2)}
${hArr(336, 356, CY, 'publish', 3)}
${hArr(432, 452, CY, 'consume', 4)}
${hArr(564, 584, ROW_TOP + 20, 'write', 5)}
${route([{ x: 564, y: CY + 20 }, { x: 564, y: ROW_BOT + 20 }, { x: 584, y: ROW_BOT + 20 }], 'threshold', 6)}`)
        }],
        LOGISTICS: [{
            title: 'Route calculation',
            html: svg(840, 260,
                `${box(20, CY - 18, 84, 36, 'dispatcher')}
${box(120, CY - 30, 40, 60, 'LB', '#e2e8f0')}
${box(180, CY - 20, 92, 40, 'tms-api')}
${box(292, CY - 20, 104, 40, 'route-svc')}
${box(292, ROW_BOT, 104, 40, 'geo-svc', '#dcfce7')}
${db(416, ROW_TOP - 4, 'Neo4j', '#fecaca')}
${db(416, ROW_BOT - 4, 'PostGIS', '#dbeafe')}
${kafka(528, CY - 15)}
${box(624, CY - 20, 92, 40, 'driver app')}
${hArr(104, 120, CY, 'plan', 1)}
${hArr(160, 180, CY, '', 2)}
${hArr(272, 292, CY, '', 3)}
${vArr(344, CY + 20, ROW_BOT, 'coords', 4)}
${hArr(396, 416, ROW_TOP + 20, 'graph', 5)}
${hArr(396, 416, ROW_BOT + 20, 'roads', 6)}
${hArr(604, 624, CY, 'notify', 7)}`)
        }],
        GOVTECH: [{
            title: 'Citizen application',
            html: svg(720, 260,
                `${box(20, CY - 18, 76, 36, 'citizen')}
${box(112, CY - 30, 40, 60, 'portal', '#e2e8f0')}
${box(172, CY - 20, 104, 40, 'case-svc')}
${box(296, CY - 20, 92, 40, 'ESB', '#fef3c7')}
${box(408, CY - 28, 112, 56, 'legacy\nmainframe', '#e2e8f0')}
${db(540, CY - 32, 'PostgreSQL', '#dbeafe')}
${box(540, ROW_BOT, 92, 40, 'MinIO\ndocs')}
${hArr(96, 112, CY, 'apply', 1)}
${hArr(152, 172, CY, '', 2)}
${hArr(276, 296, CY, 'route', 3)}
${hArr(388, 408, CY, 'MQ', 4)}
${route([{ x: 224, y: CY + 20 }, { x: 224, y: CY + 52 }, { x: 540, y: CY + 52 }, { x: 540, y: CY + 34 }], 'store', 5)}
${route([{ x: 224, y: CY + 32 }, { x: 224, y: ROW_BOT + 20 }, { x: 540, y: ROW_BOT + 20 }], 'scan', 6)}`)
        }],
        MEDIA_STREAMING: [{
            title: 'Video upload pipeline',
            html: svg(900, 260,
                `${box(20, CY - 18, 76, 36, 'creator')}
${box(112, CY - 30, 40, 60, 'LB', '#e2e8f0')}
${box(172, CY - 20, 104, 40, 'upload-api')}
${box(296, CY - 20, 120, 40, 'transcode\norchestrator')}
${box(436, ROW_TOP, 84, 36, 'worker')}
${box(436, ROW_BOT, 84, 36, 'worker')}
${box(540, CY - 20, 72, 40, 'S3')}
${db(632, ROW_TOP - 4, 'Cassandra', '#bbf7d0')}
${kafka(632, ROW_BOT + 6)}
${box(728, ROW_BOT, 72, 40, 'reco')}
${hArr(96, 112, CY, 'chunk', 1)}
${hArr(152, 172, CY, '', 2)}
${hArr(276, 296, CY, 'job', 3)}
${route([{ x: 416, y: CY - 8 }, { x: 426, y: CY - 8 }, { x: 426, y: ROW_TOP + 18 }, { x: 436, y: ROW_TOP + 18 }], '', 4)}
${route([{ x: 416, y: CY + 8 }, { x: 426, y: CY + 8 }, { x: 426, y: ROW_BOT + 18 }, { x: 436, y: ROW_BOT + 18 }], '', 4)}
${hArr(520, 540, CY, 'store', 5)}
${route([{ x: 356, y: CY + 20 }, { x: 356, y: ROW_TOP + 20 }, { x: 632, y: ROW_TOP + 20 }], 'meta', 6)}
${hArr(704, 728, ROW_BOT + 20, 'event', 7)}`)
        }]
    };

    const ZOOM_MIN = 0.5;
    const ZOOM_MAX = 4;
    const ZOOM_STEP = 0.25;
    const ZOOM_DEFAULT = 1;
    const ZOOM_LIGHTBOX_DEFAULT = 1.5;

    function archZoomLabel(key) {
        if (typeof t === 'function') return t('arch.zoom.' + key);
        const ru = {
            in: 'Увеличить', out: 'Уменьшить', reset: 'Сбросить', expand: 'Увеличить',
            label: 'Масштаб схемы', hint: 'Двойной клик или «Увеличить» — на весь экран. Колесо мыши — масштаб.'
        };
        const en = {
            in: 'Zoom in', out: 'Zoom out', reset: 'Reset', expand: 'Enlarge',
            label: 'Diagram scale', hint: 'Double-click or Enlarge for fullscreen. Mouse wheel to zoom.'
        };
        const lang = typeof getLang === 'function' ? getLang() : 'ru';
        return (lang === 'en' ? en : ru)[key] || key;
    }

    function archDiagramZoomHost(block) {
        if (!block) return null;
        if (block.classList.contains('arch-diagram-canvas')
                || block.classList.contains('arch-diagram-lightbox-body')) {
            return block;
        }
        return block.querySelector('.arch-diagram-canvas') || block;
    }

    function applyArchZoom(block, scale) {
        const host = archDiagramZoomHost(block);
        if (!host) return ZOOM_DEFAULT;
        const level = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, scale));
        const svgEl = host.querySelector('.arch-sketch-svg');
        if (!svgEl) return level;
        host.dataset.zoom = String(level);
        const outer = host.closest('.arch-diagram-block');
        if (outer) outer.dataset.zoom = String(level);
        const inLightbox = !!host.closest('#arch-diagram-lightbox');
        const baseWidth = inLightbox ? 720 : 520;
        const baseHeight = inLightbox ? 420 : 220;
        svgEl.style.minWidth = `${baseWidth * level}px`;
        svgEl.style.maxHeight = inLightbox ? 'none' : `${baseHeight * level}px`;
        if (inLightbox) {
            svgEl.style.height = `${baseHeight * level}px`;
        } else {
            svgEl.style.height = '';
        }
        const pct = Math.round(level * 100) + '%';
        const labelRoot = outer || host.closest('#arch-diagram-lightbox') || host;
        labelRoot.querySelectorAll('.arch-zoom-level').forEach(el => { el.textContent = pct; });
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
        const zoom = parseFloat(block.dataset.zoom) || ZOOM_LIGHTBOX_DEFAULT;
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
        let zoom = parseFloat(archDiagramZoomHost(block)?.dataset.zoom) || ZOOM_DEFAULT;

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

    function archZoomHostFromEventTarget(target) {
        const viewport = target.closest('.arch-diagram-viewport');
        if (viewport) {
            return viewport.closest('.arch-diagram-block')?.querySelector('.arch-diagram-canvas');
        }
        const body = target.closest('.arch-diagram-lightbox-body');
        if (body) return body;
        return null;
    }

    function handleArchDiagramWheel(e) {
        const host = archZoomHostFromEventTarget(e.target);
        if (!host) return;
        e.preventDefault();
        const zoom = (parseFloat(host.dataset.zoom) || ZOOM_DEFAULT)
            + (e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP);
        applyArchZoom(host, zoom);
    }

    function handleArchDiagramDblClick(e) {
        const viewport = e.target.closest('.arch-diagram-viewport');
        if (!viewport || e.target.closest('.arch-zoom-btn')) return;
        const block = viewport.closest('.arch-diagram-block');
        if (block) openArchLightbox(block);
    }

    function initArchitectureDiagramControls() {
        if (window._archDiagramControlsReady) return;
        window._archDiagramControlsReady = true;
        document.addEventListener('click', handleArchDiagramAction);
        document.addEventListener('dblclick', handleArchDiagramDblClick);
        document.addEventListener('wheel', handleArchDiagramWheel, { passive: false });
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
      <button type="button" class="arch-zoom-btn arch-zoom-btn--expand" data-arch-action="expand" title="${archZoomLabel('expand')}">⤢ ${archZoomLabel('expand')}</button>
    </div>
  </div>
  <p class="arch-diagram-hint">${archZoomLabel('hint')}</p>
  <div class="arch-diagram-viewport" title="${archZoomLabel('hint')}">
    <div class="arch-diagram-canvas" data-zoom="${ZOOM_DEFAULT}">${f.html}</div>
  </div>
</div>`).join('');
    }

    window.renderArchitectureDiagrams = renderArchitectureDiagrams;
    window.ARCH_DIAGRAM_PROJECTS = Object.keys(ARCH_DIAGRAMS);
})();
