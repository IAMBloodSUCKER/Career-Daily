/** Мобильный телефон — оверлей с экраном блокировки, домашним экраном, SMS и чатами */
const PhoneApp = (() => {
    let isOpenState = false;
    let phoneLocked = true;
    let officeWalkMode = false;
    let screen = 'lock'; // lock | home | messages | chat
    let selectedContactId = null;

    function el(id) {
        return document.getElementById(id);
    }

    function phoneLabel(key, fallback) {
        return typeof t === 'function' ? t(key) : fallback;
    }

    function getPhoneTime() {
        if (typeof computeClientClock === 'function' && workspace) {
            const c = computeClientClock(workspace);
            if (c) return c.timeLabel;
        }
        return workspace?.timeLabel || '09:00';
    }

    function applyPhoneWallpaper(wallpaperEl) {
        if (typeof applyGameWallpaper === 'function') {
            applyGameWallpaper(wallpaperEl);
        } else if (wallpaperEl) {
            wallpaperEl.className = 'game-wallpaper wallpaper-0';
        }
    }

    function totalUnread() {
        return (workspace?.contacts || []).reduce((s, c) => s + (c.unread || 0), 0);
    }

    function lastMessageFor(contactId) {
        const msgs = (workspace?.messages || [])
            .filter(m => m.contactId === contactId && !(typeof hiddenChatMessageIds !== 'undefined' && hiddenChatMessageIds.has(m.id)))
            .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
        return msgs[msgs.length - 1] || null;
    }

    function previewText(msg) {
        if (!msg) return 'Нет сообщений';
        const text = msg.text || '';
        return text.length > 42 ? text.slice(0, 42) + '…' : text;
    }

    function updateStatusBar() {
        const timeEl = el('phone-app-time');
        if (timeEl) timeEl.textContent = getPhoneTime();
        const homeTime = el('phone-home-clock');
        if (homeTime) homeTime.textContent = getPhoneTime();
        const lockTime = el('phone-lock-clock');
        if (lockTime) lockTime.textContent = getPhoneTime();
    }

    function updateTrayBadge() {
        const badge = el('tb-phone-badge');
        if (!badge) return;
        const n = totalUnread();
        badge.textContent = n > 9 ? '9+' : String(n);
        badge.classList.toggle('hidden', n === 0);
    }

    function unlockPhone() {
        if (!phoneLocked) return;
        phoneLocked = false;
        screen = 'home';
        render();
    }

    function renderLock(root) {
        const unread = totalUnread();
        root.innerHTML = `
            <div class="game-wallpaper" id="phone-lock-wallpaper"></div>
            <div class="phone-lock-screen" id="phone-lock-tap">
                <div class="phone-lock-time" id="phone-lock-clock">${getPhoneTime()}</div>
                <div class="phone-lock-date">День ${workspace?.player?.day || 1}</div>
                ${unread > 0 ? `<div class="phone-lock-unread">💬 ${unread > 9 ? '9+' : unread} новых</div>` : ''}
                <div class="phone-lock-hint">Нажмите, чтобы разблокировать</div>
            </div>`;
        applyPhoneWallpaper(root.querySelector('#phone-lock-wallpaper'));
        const tap = root.querySelector('#phone-lock-tap');
        tap?.addEventListener('click', e => {
            e.stopPropagation();
            unlockPhone();
        });
    }

    function renderHome(root) {
        const unread = totalUnread();
        root.innerHTML = `
            <div class="phone-home-wallpaper game-wallpaper" id="phone-home-wallpaper"></div>
            <div class="phone-home-clock-block">
                <div class="phone-home-clock" id="phone-home-clock">${getPhoneTime()}</div>
                <div class="phone-home-date">День ${workspace?.player?.day || 1}</div>
            </div>
            <div class="phone-app-grid">
                <button type="button" class="phone-app-tile" data-phone-nav="messages">
                    <span class="phone-app-tile-icon">💬</span>
                    <span class="phone-app-tile-label">Сообщения</span>
                    ${unread > 0 ? `<span class="phone-app-badge">${unread > 9 ? '9+' : unread}</span>` : ''}
                </button>
                <button type="button" class="phone-app-tile phone-app-tile--disabled" disabled title="Скоро">
                    <span class="phone-app-tile-icon">📞</span>
                    <span class="phone-app-tile-label">Звонки</span>
                </button>
                <button type="button" class="phone-app-tile phone-app-tile--disabled" disabled title="Скоро">
                    <span class="phone-app-tile-icon">📷</span>
                    <span class="phone-app-tile-label">Камера</span>
                </button>
                <button type="button" class="phone-app-tile phone-app-tile--disabled" disabled title="Скоро">
                    <span class="phone-app-tile-icon">⚙️</span>
                    <span class="phone-app-tile-label">Настройки</span>
                </button>
            </div>`;
        applyPhoneWallpaper(root.querySelector('#phone-home-wallpaper'));
    }

    function navigatePhone(dest) {
        const root = el('phone-app-body');
        if (dest === 'home') {
            screen = 'home';
            selectedContactId = null;
        } else if (dest === 'messages') {
            screen = 'messages';
            selectedContactId = null;
        }
        if (root) delete root.dataset.chatContact;
        render();
    }

    function handlePhoneNavClick(e) {
        const nav = e.target.closest('[data-phone-nav]');
        if (!nav || nav.disabled) return;
        e.preventDefault();
        e.stopPropagation();
        navigatePhone(nav.dataset.phoneNav);
    }

    function renderMessagesList(root) {
        const contacts = [...(workspace?.contacts || [])].sort((a, b) => {
            if ((b.unread || 0) !== (a.unread || 0)) return (b.unread || 0) - (a.unread || 0);
            const la = lastMessageFor(a.id);
            const lb = lastMessageFor(b.id);
            return (lb?.timestamp || 0) - (la?.timestamp || 0);
        });

        root.innerHTML = `
            <header class="phone-nav-bar">
                <button type="button" class="phone-nav-back" data-phone-nav="home" aria-label="Назад">‹</button>
                <span class="phone-nav-title">Сообщения</span>
                <span class="phone-nav-action"></span>
            </header>
            <div class="phone-messages-list"></div>`;

        const list = root.querySelector('.phone-messages-list');
        if (!contacts.length) {
            list.innerHTML = '<p class="phone-empty">Контактов пока нет</p>';
            return;
        }

        contacts.forEach(c => {
            const last = lastMessageFor(c.id);
            const row = document.createElement('button');
            row.type = 'button';
            row.className = 'phone-msg-row' + (c.unread > 0 ? ' unread' : '');
            row.innerHTML = `
                <span class="phone-msg-avatar">${c.avatar || '💬'}</span>
                <span class="phone-msg-meta">
                    <span class="phone-msg-top">
                        <strong>${escapeHtml(c.name)}</strong>
                        ${c.unread > 0 ? `<span class="phone-msg-unread">${c.unread > 9 ? '9+' : c.unread}</span>` : ''}
                    </span>
                    <span class="phone-msg-preview">${escapeHtml(previewText(last))}</span>
                    <span class="phone-msg-role">${escapeHtml(c.role || '')}</span>
                </span>`;
            row.onclick = async () => {
                selectedContactId = c.id;
                screen = 'chat';
                try { await markContactRead(c.id); } catch (_) { /* noop */ }
                render();
            };
            list.appendChild(row);
        });
    }

    function appendChatReplies(container, contactId) {
        const contactTask = typeof getTaskForContact === 'function' ? getTaskForContact(contactId) : null;
        const chatBusy = typeof typingContacts !== 'undefined' && typingContacts.has(contactId);

        const addHint = text => {
            const hint = document.createElement('p');
            hint.className = 'phone-reply-hint';
            hint.textContent = text;
            container.appendChild(hint);
        };

        const addBtn = (text, onClick, casual = false) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'phone-reply-btn' + (casual ? ' casual' : '');
            btn.textContent = text;
            btn.disabled = chatBusy;
            btn.onclick = onClick;
            container.appendChild(btn);
        };

        if (contactTask && typeof hasPendingReply === 'function' && hasPendingReply(contactTask, contactId) && contactTask.replyOptions?.length) {
            addHint('💡 Ответ по задаче ' + contactTask.ticketId + ':');
            contactTask.replyOptions.forEach(opt => {
                addBtn(opt.text, () => sendChatMessage({ contactId, replyOptionId: opt.id }));
            });
        } else if (workspace?.pendingWorkloadContactId === contactId) {
            addHint('💡 Team Lead спрашивает про загрузку:');
            [
                { id: 'workload-yes', text: 'Да, ещё есть в работе' },
                { id: 'workload-no', text: 'Нет, всё закрыл — можно ещё' }
            ].forEach(opt => addBtn(opt.text, () => sendChatMessage({ contactId, replyOptionId: opt.id })));
        } else if (workspace?.mode === 'EXPLORER' && typeof isTeamLeadContact === 'function' && isTeamLeadContact(contactId) && typeof hasOpenWorkTasks === 'function' && !hasOpenWorkTasks()) {
            addHint(typeof t === 'function' ? t('task.explorer.askLeadHint') : '💡 Нет задач? Спросите у тимлида:');
            [
                { id: 'explorer-ask-work', text: typeof t === 'function' ? t('task.explorer.askWork') : 'Готов взять ещё задачу' },
                { id: 'explorer-ask-work-alt', text: typeof t === 'function' ? t('task.explorer.askWhatNext') : 'Чем заняться дальше?' }
            ].forEach(opt => addBtn(opt.text, () => sendChatMessage({ contactId, replyOptionId: opt.id }), true));
        } else if (typeof contactHasActiveTasks === 'function' && !contactHasActiveTasks(contactId) && typeof contactPlayerHasSpoken === 'function' && !contactPlayerHasSpoken(contactId)) {
            addHint('💬 Быстрые ответы:');
            (typeof getWelcomeReplies === 'function' ? getWelcomeReplies(contactId) : []).forEach(opt => {
                addBtn(opt.text, () => sendChatMessage({ contactId, text: opt.text }), true);
            });
        } else if (typeof contactHasActiveTasks === 'function' && !contactHasActiveTasks(contactId) && typeof contactPlayerHasSpoken === 'function' && contactPlayerHasSpoken(contactId)) {
            if (chatBusy) addHint('⏳ ' + getContactName(contactId) + ' печатает ответ…');
        } else {
            const active = typeof getTaskForContact === 'function' ? getTaskForContact(contactId) : null;
            addHint(active
                ? `📋 Быстрые ответы по ${active.ticketId} — или напишите своё, коллега ответит`
                : '💬 Напишите сообщение — коллега ответит через несколько секунд');
        }
    }

    function fillChatThread(thread, contactId) {
        const msgs = (workspace?.messages || [])
            .filter(m => m.contactId === contactId && !(typeof hiddenChatMessageIds !== 'undefined' && hiddenChatMessageIds.has(m.id)))
            .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

        thread.innerHTML = '';
        if (!msgs.length) {
            thread.innerHTML = '<p class="phone-empty">Напишите первым 👋</p>';
        } else {
            msgs.forEach(m => {
                const bubble = document.createElement('div');
                const mine = !!m.fromPlayer;
                const unread = !mine && !m.read;
                bubble.className = 'phone-bubble' + (mine ? ' mine' : '') + (unread ? ' unread' : '')
                    + (typeof ChatTextAnalyzer !== 'undefined' ? ChatTextAnalyzer.messageClass(m.text, mine) : '');
                const ticket = typeof getTicketForMessage === 'function' ? getTicketForMessage(m) : '';
                bubble.innerHTML = `
                    ${ticket ? `<span class="phone-bubble-tag">${escapeHtml(ticket)}</span>` : ''}
                    <span class="phone-bubble-text">${escapeHtml(m.text)}</span>`;
                thread.appendChild(bubble);
            });
        }

        if (typeof typingContacts !== 'undefined' && typingContacts.has(contactId)) {
            const typing = document.createElement('div');
            typing.className = 'phone-typing';
            typing.innerHTML = `<span>${getContactName(contactId)} печатает</span><span class="chat-typing-dots"><span></span><span></span><span></span></span>`;
            thread.appendChild(typing);
        }

        thread.scrollTop = thread.scrollHeight;
    }

    function syncChatCompose(root, contactId) {
        const chatBusy = typeof typingContacts !== 'undefined' && typingContacts.has(contactId);
        const input = root.querySelector('.phone-chat-input');
        const sendBtn = root.querySelector('.phone-chat-send');
        if (input) {
            input.disabled = false;
            input.placeholder = chatBusy
                ? `${getContactName(contactId)} печатает…`
                : 'Сообщение…';
        }
        if (sendBtn) sendBtn.disabled = chatBusy;
        const repliesEl = root.querySelector('.phone-chat-replies');
        if (repliesEl) {
            repliesEl.innerHTML = '';
            appendChatReplies(repliesEl, contactId);
        }
    }

    function bindChatInput(root, contactId) {
        const input = root.querySelector('.phone-chat-input');
        const sendBtn = root.querySelector('.phone-chat-send');
        if (!input || !sendBtn) return;

        const send = () => {
            const busy = typeof typingContacts !== 'undefined' && typingContacts.has(contactId);
            if (!input.value.trim() || busy) return;
            sendChatMessage({ contactId, text: input.value.trim() });
            input.value = '';
        };
        sendBtn.onclick = send;
        input.onkeydown = e => { if (e.key === 'Enter') send(); };

        root.querySelector('.phone-chat-compose')?.addEventListener('mousedown', e => {
            if (e.target.closest('button, .phone-reply-btn')) return;
            e.stopPropagation();
            if (!input.disabled) input.focus();
        }, true);
    }

    function patchChat(root) {
        const contact = workspace?.contacts?.find(c => c.id === selectedContactId);
        if (!contact) {
            screen = 'messages';
            render();
            return;
        }
        const thread = root.querySelector('.phone-chat-thread');
        if (!thread) {
            renderChat(root);
            return;
        }
        fillChatThread(thread, selectedContactId);
        syncChatCompose(root, selectedContactId);
    }

    function renderChat(root) {
        const contact = workspace?.contacts?.find(c => c.id === selectedContactId);
        if (!contact) {
            screen = 'messages';
            render();
            return;
        }

        root.innerHTML = `
            <header class="phone-nav-bar">
                <button type="button" class="phone-nav-back" data-phone-nav="messages" aria-label="Назад">‹</button>
                <span class="phone-nav-title">${escapeHtml(contact.name)}</span>
                <span class="phone-nav-action">${contact.avatar || '💬'}</span>
            </header>
            <div class="phone-chat-thread"></div>
            <div class="phone-chat-compose">
                <div class="phone-chat-replies"></div>
                <div class="phone-chat-input-row">
                    <input type="text" class="phone-chat-input" placeholder="Сообщение…" autocomplete="off">
                    <button type="button" class="phone-chat-send" aria-label="Отправить">➤</button>
                </div>
            </div>`;

        const thread = root.querySelector('.phone-chat-thread');
        fillChatThread(thread, selectedContactId);

        const repliesEl = root.querySelector('.phone-chat-replies');
        appendChatReplies(repliesEl, selectedContactId);

        bindChatInput(root, selectedContactId);

        const chatBusy = typeof typingContacts !== 'undefined' && typingContacts.has(selectedContactId);
        const input = root.querySelector('.phone-chat-input');
        const sendBtn = root.querySelector('.phone-chat-send');
        if (chatBusy && sendBtn) {
            sendBtn.disabled = true;
        }
        if (chatBusy && input) {
            input.placeholder = `${getContactName(selectedContactId)} печатает…`;
        }

        if (contact.unread > 0) {
            markContactRead(selectedContactId).catch(() => {});
        }
    }

    function render() {
        const root = el('phone-app-body');
        if (!root || !isOpenState) return;
        updateStatusBar();
        const view = phoneLocked ? 'lock' : screen;
        if (view !== 'chat') delete root.dataset.chatContact;

        const sameChat = view === 'chat'
            && selectedContactId
            && root.dataset.chatContact === selectedContactId
            && root.querySelector('.phone-chat-compose');

        if (sameChat) {
            patchChat(root);
            updateTrayBadge();
            return;
        }

        root.className = 'phone-app-body phone-screen-' + view;
        if (phoneLocked || view === 'lock') renderLock(root);
        else if (screen === 'home') renderHome(root);
        else if (screen === 'messages') renderMessagesList(root);
        else if (screen === 'chat') {
            renderChat(root);
            root.dataset.chatContact = selectedContactId || '';
        }
        updateTrayBadge();
    }

    function show() {
        const overlay = el('phone-overlay');
        if (!overlay) {
            if (typeof showToast === 'function') showToast('Телефон недоступен — обновите страницу (Ctrl+F5)');
            return;
        }
        overlay.classList.remove('hidden');
        overlay.classList.add('is-open');
        overlay.setAttribute('aria-hidden', 'false');
        isOpenState = true;
        render();
        document.body.classList.add('phone-open');
    }

    function hide() {
        const overlay = el('phone-overlay');
        overlay?.classList.remove('is-open');
        overlay?.classList.add('hidden');
        overlay?.setAttribute('aria-hidden', 'true');
        isOpenState = false;
        phoneLocked = true;
        officeWalkMode = false;
        screen = 'lock';
        selectedContactId = null;
        document.body.classList.remove('phone-open');
        const root = el('phone-app-body');
        if (root) root.innerHTML = '';
    }

    function openPhone(opts = {}) {
        if (!workspace) {
            if (typeof showToast === 'function') showToast('Сначала начните или продолжите игру');
            return;
        }
        if (workspace.gameOver) return;

        const duringOfficeWalk = !!opts.duringOfficeWalk
            && typeof isOfficeWalkActive === 'function'
            && isOfficeWalkActive();
        officeWalkMode = duringOfficeWalk;

        if (!officeWalkMode) {
            if (typeof isOfficeWalkActive === 'function' && isOfficeWalkActive()) {
                if (typeof showToast === 'function') showToast('Телефон недоступен во время прогулки по офису');
                return;
            }
            if (!workspace.atDesk) {
                if (typeof showToast === 'function') showToast('Подойдите к рабочему столу');
                return;
            }
        }
        if (opts.contactId) {
            selectedContactId = opts.contactId;
            screen = 'chat';
            phoneLocked = false;
        } else if (opts.screen) {
            screen = opts.screen;
            phoneLocked = false;
        } else if (!opts.keepScreen) {
            screen = 'lock';
            phoneLocked = true;
        }
        if (typeof closeApp === 'function') closeApp('contacts');
        if (typeof closeStartMenu === 'function') closeStartMenu();
        show();
    }

    function togglePhone() {
        if (isOpenState) {
            hide();
            return;
        }
        openPhone();
    }

    function preventPhoneTextCaret(e) {
        if (e.target.closest(
            '.phone-chat-input, .phone-chat-compose, .phone-nav-bar, .phone-nav-back,'
            + ' [data-phone-nav], button, a, input, textarea, [contenteditable="true"]'
        )) {
            return;
        }
        e.preventDefault();
        const active = document.activeElement;
        if (active instanceof HTMLElement && !active.matches('.phone-chat-input, input, textarea')) {
            active.blur();
        }
    }

    function bindUi() {
        el('phone-overlay-backdrop')?.addEventListener('click', hide);
        el('phone-device-overlay')?.addEventListener('click', e => e.stopPropagation());
        el('phone-overlay')?.addEventListener('mousedown', preventPhoneTextCaret, true);
        el('phone-device-overlay')?.addEventListener('mousedown', preventPhoneTextCaret, true);
        el('phone-app-body')?.addEventListener('click', handlePhoneNavClick);
        el('phone-home-bar')?.addEventListener('click', e => {
            e.stopPropagation();
            if (phoneLocked) {
                unlockPhone();
                return;
            }
            if (screen === 'home') hide();
            else {
                screen = 'home';
                render();
            }
        });
        document.addEventListener('keydown', e => {
            if (e.key === 'Escape' && isOpenState) hide();
        });
    }

    bindUi();
    hide();

    return {
        open: openPhone,
        toggle: togglePhone,
        close: hide,
        render,
        isOpen: () => isOpenState,
        isOfficeWalkMode: () => officeWalkMode,
        updateBadge: updateTrayBadge
    };
})();
