/** Модальное подтверждение в стиле приложения (вместо window.confirm). */
window.showAppConfirm = function showAppConfirm(options = {}) {
    const modal = document.getElementById('app-confirm-modal');
    const titleEl = document.getElementById('app-confirm-title');
    const messageEl = document.getElementById('app-confirm-message');
    const okBtn = document.getElementById('app-confirm-ok');
    const cancelBtn = document.getElementById('app-confirm-cancel');
    if (!modal || !titleEl || !messageEl || !okBtn || !cancelBtn) {
        return Promise.resolve(window.confirm(options.message || 'Продолжить?'));
    }

    const title = options.title || 'Подтверждение';
    const message = options.message || '';
    const confirmText = options.confirmText || 'Продолжить';
    const cancelText = options.cancelText || 'Отмена';
    const danger = options.danger === true;

    titleEl.textContent = title;
    messageEl.textContent = message;
    okBtn.textContent = confirmText;
    cancelBtn.textContent = cancelText;
    okBtn.classList.toggle('btn-danger', danger);
    okBtn.classList.toggle('btn-primary', !danger);

    modal.classList.remove('hidden');
    cancelBtn.focus();

    return new Promise(resolve => {
        let settled = false;
        const finish = value => {
            if (settled) return;
            settled = true;
            modal.classList.add('hidden');
            okBtn.classList.remove('btn-danger');
            okBtn.classList.add('btn-primary');
            document.removeEventListener('keydown', onKey);
            modal.removeEventListener('click', onBackdrop);
            okBtn.removeEventListener('click', onOk);
            cancelBtn.removeEventListener('click', onCancel);
            resolve(value);
        };

        const onOk = () => finish(true);
        const onCancel = () => finish(false);
        const onKey = e => {
            if (e.key === 'Escape') finish(false);
            if (e.key === 'Enter') finish(true);
        };
        const onBackdrop = e => {
            if (e.target === modal) finish(false);
        };

        okBtn.addEventListener('click', onOk);
        cancelBtn.addEventListener('click', onCancel);
        document.addEventListener('keydown', onKey);
        modal.addEventListener('click', onBackdrop);
    });
};
