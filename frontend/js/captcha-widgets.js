/** Виджеты капчи: сетка картинок и слайдер со стрелкой. */
window.CaptchaWidgets = (() => {
    let imageSelection = new Set();
    let sliderValue = null;

    function reset() {
        imageSelection = new Set();
        sliderValue = null;
    }

    function getAnswer(kind) {
        if (kind === 'image') {
            if (imageSelection.size === 0) return null;
            return [...imageSelection].sort((a, b) => a - b).join(',');
        }
        if (kind === 'slider') {
            return sliderValue === null ? null : String(Math.round(sliderValue));
        }
        return null;
    }

    function bindRefresh(onRefresh) {
        document.getElementById('captcha-refresh')?.addEventListener('click', e => {
            e.preventDefault();
            onRefresh();
        });
    }

    function renderImage(wrap, cfg, onRefresh) {
        reset();
        const tiles = cfg.tiles || [];
        wrap.innerHTML = `
            <label class="field-label">Проверка <span class="field-required">*</span></label>
            <p class="captcha-prompt" id="captcha-question">${cfg.question || ''}</p>
            <div class="captcha-image-grid" id="captcha-image-grid">
                ${tiles.map(t => `
                    <button type="button" class="captcha-tile" data-idx="${t.index}" aria-pressed="false">
                        <span class="captcha-tile-icon">${t.icon}</span>
                    </button>`).join('')}
            </div>
            <div class="captcha-actions">
                <span class="auth-hint captcha-hint">Можно выбрать несколько</span>
                <button type="button" id="captcha-refresh" class="captcha-refresh-btn" title="Другая задача">↻</button>
            </div>`;

        wrap.querySelectorAll('.captcha-tile').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = parseInt(btn.dataset.idx, 10);
                if (imageSelection.has(idx)) {
                    imageSelection.delete(idx);
                    btn.classList.remove('selected');
                    btn.setAttribute('aria-pressed', 'false');
                } else {
                    imageSelection.add(idx);
                    btn.classList.add('selected');
                    btn.setAttribute('aria-pressed', 'true');
                }
            });
        });
        bindRefresh(onRefresh);
    }

    function renderSlider(wrap, cfg, onRefresh) {
        reset();
        const marks = cfg.sliderMarks || ['A', 'B', 'C', 'D', 'E'];
        wrap.innerHTML = `
            <label class="field-label">Проверка <span class="field-required">*</span></label>
            <p class="captcha-prompt" id="captcha-question">${cfg.question || ''}</p>
            <div class="captcha-slider-wrap">
                <div class="captcha-slider-marks">
                    ${marks.map(m => `<span class="captcha-slider-mark">${m}</span>`).join('')}
                </div>
                <div class="captcha-slider-track" id="captcha-slider-track">
                    <div class="captcha-slider-rail"></div>
                    <div class="captcha-slider-thumb" id="captcha-slider-thumb" role="slider"
                         aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" tabindex="0">→</div>
                </div>
            </div>
            <div class="captcha-actions">
                <span class="auth-hint captcha-hint" id="captcha-slider-status">Перетащите стрелку</span>
                <button type="button" id="captcha-refresh" class="captcha-refresh-btn" title="Другая задача">↻</button>
            </div>`;

        bindSliderDrag();
        bindRefresh(onRefresh);
    }

    function bindSliderDrag() {
        const track = document.getElementById('captcha-slider-track');
        const thumb = document.getElementById('captcha-slider-thumb');
        const status = document.getElementById('captcha-slider-status');
        if (!track || !thumb) return;

        let dragging = false;

        const setPosition = clientX => {
            const rect = track.getBoundingClientRect();
            const pad = 18;
            const usable = Math.max(1, rect.width - pad * 2);
            let x = clientX - rect.left - pad;
            x = Math.max(0, Math.min(usable, x));
            const pct = Math.round((x / usable) * 100);
            thumb.style.left = `${pad + x}px`;
            thumb.setAttribute('aria-valuenow', String(pct));
            sliderValue = pct;
            if (status) status.textContent = `Позиция: ${pct}%`;
        };

        const pointerX = e => e.clientX ?? e.touches?.[0]?.clientX;

        const onMove = e => {
            if (!dragging) return;
            setPosition(pointerX(e));
        };

        const stopDrag = () => {
            dragging = false;
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', stopDrag);
            window.removeEventListener('touchmove', onMove);
            window.removeEventListener('touchend', stopDrag);
        };

        const startDrag = e => {
            dragging = true;
            e.preventDefault();
            setPosition(pointerX(e));
            window.addEventListener('mousemove', onMove);
            window.addEventListener('mouseup', stopDrag);
            window.addEventListener('touchmove', onMove, { passive: false });
            window.addEventListener('touchend', stopDrag);
        };

        thumb.addEventListener('mousedown', startDrag);
        thumb.addEventListener('touchstart', startDrag, { passive: false });

        track.addEventListener('click', e => {
            if (e.target === thumb) return;
            setPosition(e.clientX);
        });
    }

    return { reset, getAnswer, renderImage, renderSlider };
})();
