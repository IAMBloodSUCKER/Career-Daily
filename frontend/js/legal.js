/**
 * Подставляет реквизиты оператора из GET /api/auth/legal-config в legal.html.
 */
(function () {
    const AUTH_API = window.__AUTH_API__ || '/api/auth';

    function formatPolicyDate(iso) {
        if (!iso) return '';
        const parts = iso.split('-');
        if (parts.length === 3) {
            return `${parts[2]}.${parts[1]}.${parts[0]}`;
        }
        return iso;
    }

    function applyConfig(cfg) {
        document.querySelectorAll('[data-legal]').forEach(el => {
            const key = el.dataset.legal;
            if (key && cfg[key] != null && cfg[key] !== '') {
                el.textContent = cfg[key];
            }
        });

        document.querySelectorAll('[data-legal-mailto]').forEach(el => {
            const key = el.dataset.legalMailto;
            const email = cfg[key];
            if (email) {
                el.href = 'mailto:' + email;
                if (!el.textContent.trim() || el.textContent.includes('@example.com')) {
                    el.textContent = email;
                }
            }
        });

        document.querySelectorAll('[data-legal-href]').forEach(el => {
            const key = el.dataset.legalHref;
            const url = cfg[key];
            if (url) el.href = url;
        });

        const policyDate = formatPolicyDate(cfg.policyVersion);
        document.querySelectorAll('[data-legal-date="policyVersion"]').forEach(el => {
            el.textContent = policyDate;
        });
        document.querySelectorAll('[data-legal-date="termsVersion"]').forEach(el => {
            el.textContent = formatPolicyDate(cfg.termsVersion);
        });

        document.title = document.title.replace('{{SERVICE}}', 'Java Dev Daily');
    }

    async function init() {
        try {
            const res = await fetch(AUTH_API + '/legal-config');
            if (!res.ok) return;
            const cfg = await res.json();
            applyConfig(cfg);
        } catch {
            /* статический fallback в HTML */
        }

        const hash = window.location.hash || '#privacy';
        document.querySelectorAll('.legal-nav a').forEach(link => {
            link.classList.toggle('active', link.getAttribute('href') === hash);
        });
    }

    document.addEventListener('DOMContentLoaded', init);
})();
