/** Раскладка значков рабочего стола: drag-and-drop, pin/unpin, файлы и папки */
const DESKTOP_LAYOUT_KEY = 'career-daily-desktop-layout-v7';
const DESKTOP_LAYOUT_MIN_W = 240;
const DESKTOP_LAYOUT_MIN_H = 240;
const DESKTOP_GRID_ORIGIN = 12;
const DESKTOP_GRID_X = 76;
const DESKTOP_GRID_Y = 88;
const DESKTOP_ICON_W = 72;
const DESKTOP_ICON_H = 80;
const DESKTOP_DRAG_THRESHOLD = 5;
const DESKTOP_RECYCLE_ID = '__recycle__';

const DESKTOP_UTIL_APP_IDS = ['vpn'];
const DESKTOP_COMM_APP_IDS = ['slack', 'email', 'meet', 'portal'];
const DESKTOP_DEV_APP_IDS = ['ide', 'jira', 'terminal', 'docker'];
const DEFAULT_DESKTOP_APP_IDS = [...DESKTOP_UTIL_APP_IDS, ...DESKTOP_COMM_APP_IDS, ...DESKTOP_DEV_APP_IDS];

let desktopOnOpen = null;
let desktopDragState = null;
let desktopSuppressClick = false;
let desktopContextMenuEl = null;
let desktopIconsObserver = null;

function desktopLabel(key, fallback) {
    return typeof t === 'function' ? t(key) : fallback;
}

function desktopOrderedAppIds(appIds) {
    const ordered = [
        ...DESKTOP_UTIL_APP_IDS,
        ...DESKTOP_COMM_APP_IDS,
        ...DESKTOP_DEV_APP_IDS
    ];
    const result = [];
    ordered.forEach(id => {
        if (appIds.includes(id)) result.push(id);
    });
    appIds.forEach(id => {
        if (id === DESKTOP_RECYCLE_ID || result.includes(id)) return;
        if (typeof getDesktopApp === 'function' && !getDesktopApp(id)) return;
        result.push(id);
    });
    return result;
}

function getDesktopColumnCount() {
    const { width } = getDesktopLayerBounds();
    return Math.max(2, Math.floor((width - DESKTOP_ICON_W - DESKTOP_GRID_ORIGIN) / DESKTOP_GRID_X) + 1);
}

function getRightDesktopColumn() {
    return getDesktopColumnCount() - 1;
}

function buildLogicalDesktopLayout(appIds) {
    const icons = [];
    const leftCol = 0;
    const rightCol = getRightDesktopColumn();
    let leftRow = 0;
    let rightRow = 0;

    [...DESKTOP_UTIL_APP_IDS, ...DESKTOP_COMM_APP_IDS].forEach(id => {
        if (!appIds.includes(id)) return;
        const pos = desktopGridCell(leftCol, leftRow++);
        icons.push({ id, x: pos.x, y: pos.y });
    });

    desktopOrderedAppIds(appIds).forEach(id => {
        if (id === DESKTOP_RECYCLE_ID) return;
        if (DESKTOP_UTIL_APP_IDS.includes(id) || DESKTOP_COMM_APP_IDS.includes(id) || DESKTOP_DEV_APP_IDS.includes(id)) return;
        const pos = desktopGridCell(leftCol, leftRow++);
        icons.push({ id, x: pos.x, y: pos.y });
    });

    DESKTOP_DEV_APP_IDS.forEach(id => {
        if (!appIds.includes(id)) return;
        const pos = desktopGridCell(rightCol, rightRow++);
        icons.push({ id, x: pos.x, y: pos.y });
    });

    if (appIds.includes(DESKTOP_RECYCLE_ID)) {
        const pos = resolveRecyclePosition();
        icons.push({ id: DESKTOP_RECYCLE_ID, x: pos.x, y: pos.y });
    }

    return icons;
}

function packDesktopLayoutFromIds(ids) {
    const unique = [...new Set((ids || []).filter(id => id && id !== DESKTOP_RECYCLE_ID))];
    unique.push(DESKTOP_RECYCLE_ID);
    return buildLogicalDesktopLayout(unique);
}

function getDefaultDesktopLayout() {
    return buildLogicalDesktopLayout([...DEFAULT_DESKTOP_APP_IDS, DESKTOP_RECYCLE_ID]);
}

function layoutNeedsRepack(layout) {
    if (!Array.isArray(layout) || layout.length < 2) return false;
    const items = layout.filter(item => item && item.id !== DESKTOP_RECYCLE_ID);
    if (items.length < 2) return false;

    const stackedAtOrigin = items.filter(item => item.x <= 4 && item.y <= 4).length;
    if (stackedAtOrigin >= items.length - 1) return true;

    let overlapPairs = 0;
    for (let i = 0; i < items.length; i++) {
        for (let j = i + 1; j < items.length; j++) {
            if (iconsOverlap(items[i].x, items[i].y, items[j].x, items[j].y)) overlapPairs++;
        }
    }
    return overlapPairs >= 2;
}

function normalizeDesktopLayout(raw, repack = false) {
    if (!Array.isArray(raw)) return getDefaultDesktopLayout();
    if (repack) return packDesktopLayoutFromIds(raw.map(i => i.id));

    const valid = raw.filter(item =>
        item && typeof item.id === 'string'
        && typeof item.x === 'number'
        && typeof item.y === 'number'
        && (item.id === DESKTOP_RECYCLE_ID || (typeof getDesktopApp === 'function' && getDesktopApp(item.id)))
    );
    if (!valid.some(i => i.id === DESKTOP_RECYCLE_ID)) {
        const pos = resolveRecyclePosition();
        valid.push({ id: DESKTOP_RECYCLE_ID, x: pos.x, y: pos.y });
    }
    if (!valid.length) return getDefaultDesktopLayout();
    const anchored = applyRecycleAnchor(valid);
    return layoutNeedsRepack(anchored) ? packDesktopLayoutFromIds(anchored.map(i => i.id)) : anchored;
}

function applyRecycleAnchor(layout) {
    const recyclePos = resolveRecyclePosition();
    return layout.map(item =>
        item.id === DESKTOP_RECYCLE_ID ? { id: item.id, x: recyclePos.x, y: recyclePos.y } : item
    );
}

function migrateLayoutFromKey(key) {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    let ids = JSON.parse(raw).map(i => i.id);
    if (key === 'career-daily-desktop-layout-v3' && !ids.includes('vpn')) {
        ids.unshift('vpn');
    }
    const layout = packDesktopLayoutFromIds(ids);
    saveDesktopLayout(layout);
    try { localStorage.removeItem(key); } catch (_) { /* ignore */ }
    return layout;
}

function loadDesktopLayout() {
    if (typeof DesktopFiles !== 'undefined') {
        DesktopFiles.bootstrapAppsIfNeeded(getDefaultDesktopLayout);
        return DesktopFiles.getLayoutForRender().map(item => ({
            id: item.id,
            x: item.x ?? 12,
            y: item.y ?? 12,
            item
        }));
    }
    try {
        const saved = localStorage.getItem(DESKTOP_LAYOUT_KEY);
        if (saved) return normalizeDesktopLayout(JSON.parse(saved));
        for (const key of [
            'career-daily-desktop-layout-v6',
            'career-daily-desktop-layout-v5',
            'career-daily-desktop-layout-v4',
            'career-daily-desktop-layout-v3',
            'career-daily-desktop-layout-v2',
            'career-daily-desktop-layout-v1'
        ]) {
            const migrated = migrateLayoutFromKey(key);
            if (migrated) return migrated;
        }
    } catch (_) { /* ignore */ }
    return getDefaultDesktopLayout();
}

function saveDesktopLayout(layout) {
    if (typeof DesktopFiles !== 'undefined') {
        DesktopFiles.syncAppLayout(layout.map(i => ({ id: i.id, x: i.x, y: i.y })));
        return;
    }
    try {
        localStorage.setItem(DESKTOP_LAYOUT_KEY, JSON.stringify(layout));
    } catch (_) { /* ignore */ }
}

function saveDesktopPositionsFromDom() {
    const layout = getCurrentDesktopLayoutFromDom();
    layout.forEach(entry => {
        const item = typeof DesktopFiles !== 'undefined' ? DesktopFiles.getItem(entry.id) : null;
        if (item && item.type !== 'app') {
            DesktopFiles.updateItemPosition(entry.id, entry.x, entry.y);
        }
    });
    if (typeof DesktopFiles !== 'undefined') {
        DesktopFiles.syncAppLayout(layout.filter(e => {
            const it = DesktopFiles.getItem(e.id);
            return !it || it.type === 'app';
        }).map(e => ({ id: e.id, x: e.x, y: e.y })));
    } else {
        saveDesktopLayout(layout);
    }
}

function getDesktopIconLayer() {
    return document.getElementById('desktop-icon-layer');
}

function getDesktopLayerBounds() {
    const layer = getDesktopIconLayer();
    if (!layer) return { width: 800, height: 500 };
    const width = layer.clientWidth;
    const height = layer.clientHeight;
    if (width < DESKTOP_LAYOUT_MIN_W || height < DESKTOP_LAYOUT_MIN_H) {
        return { width: 800, height: 500 };
    }
    return { width, height };
}

function isDesktopLayerReady() {
    const layer = getDesktopIconLayer();
    if (!layer) return false;
    return layer.clientWidth >= DESKTOP_LAYOUT_MIN_W && layer.clientHeight >= DESKTOP_LAYOUT_MIN_H;
}

function snapDesktopCoord(value, grid) {
    return DESKTOP_GRID_ORIGIN + Math.round((value - DESKTOP_GRID_ORIGIN) / grid) * grid;
}

function snapDesktopPosition(x, y) {
    return clampDesktopPosition(
        snapDesktopCoord(x, DESKTOP_GRID_X),
        snapDesktopCoord(y, DESKTOP_GRID_Y)
    );
}

function desktopGridCell(col, row) {
    return clampDesktopPosition(
        DESKTOP_GRID_ORIGIN + col * DESKTOP_GRID_X,
        DESKTOP_GRID_ORIGIN + row * DESKTOP_GRID_Y
    );
}

function clampDesktopPosition(x, y) {
    const { width, height } = getDesktopLayerBounds();
    const maxX = Math.max(0, width - DESKTOP_ICON_W);
    const maxY = Math.max(0, height - DESKTOP_ICON_H);
    return {
        x: Math.min(maxX, Math.max(0, x)),
        y: Math.min(maxY, Math.max(0, y))
    };
}

function resolveRecyclePosition() {
    const { height } = getDesktopLayerBounds();
    const rightCol = getRightDesktopColumn();
    return clampDesktopPosition(
        DESKTOP_GRID_ORIGIN + rightCol * DESKTOP_GRID_X,
        height - DESKTOP_ICON_H - DESKTOP_GRID_ORIGIN
    );
}

function iconsOverlap(x1, y1, x2, y2) {
    const gap = 6;
    return Math.abs(x1 - x2) < DESKTOP_ICON_W - gap && Math.abs(y1 - y2) < DESKTOP_ICON_H - gap;
}

function isDesktopCellOccupied(x, y, layout, skipId) {
    return layout.some(item => {
        if (item.id === skipId) return false;
        return iconsOverlap(x, y, item.x, item.y);
    });
}

function resolveDropPosition(x, y, layout, skipId, fallback) {
    const clamped = snapDesktopPosition(x, y);
    if (!isDesktopCellOccupied(clamped.x, clamped.y, layout, skipId)) {
        return { x: clamped.x, y: clamped.y, valid: true };
    }
    if (fallback && !isDesktopCellOccupied(fallback.x, fallback.y, layout, skipId)) {
        return { x: fallback.x, y: fallback.y, valid: false };
    }
    const free = findFreeDesktopCell(layout);
    return { x: free.x, y: free.y, valid: false };
}

function findFreeDesktopCell(layout, nearX) {
    const { height } = getDesktopLayerBounds();
    const cols = getDesktopColumnCount();
    const rows = Math.max(1, Math.floor((height - DESKTOP_ICON_H) / DESKTOP_GRID_Y) + 1);
    const nearCol = typeof nearX === 'number'
        ? Math.min(cols - 1, Math.max(0, Math.round((nearX - DESKTOP_GRID_ORIGIN) / DESKTOP_GRID_X)))
        : 0;
    const colOrder = [nearCol];
    for (let c = 0; c < cols; c++) {
        if (c !== nearCol) colOrder.push(c);
    }
    for (const col of colOrder) {
        for (let r = 0; r < rows; r++) {
            const pos = desktopGridCell(col, r);
            if (!isDesktopCellOccupied(pos.x, pos.y, layout, null)) return pos;
        }
    }
    return desktopGridCell(0, 0);
}

function applyIconPosition(btn, x, y) {
    btn.style.left = `${x}px`;
    btn.style.top = `${y}px`;
}

function createRecycleIconButton() {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.id = 'desktop-recycle';
    btn.className = 'desktop-recycle app-icon';
    btn.title = desktopLabel('desktop.recycle', 'Корзина');
    btn.dataset.itemId = DESKTOP_RECYCLE_ID;
    btn.dataset.itemType = 'app';
    btn.dataset.app = DESKTOP_RECYCLE_ID;
    btn.innerHTML = `<span class="app-emoji">🗑</span><span class="app-label">${desktopLabel('desktop.recycle', 'Корзина')}</span>`;
    return btn;
}

function createDesktopItemButton(item) {
    if (item.id === DESKTOP_RECYCLE_ID) return createRecycleIconButton();
    if (item.type === 'app') {
        const app = getDesktopApp(item.id);
        if (!app) return null;
        const btn = createAppIconButton(app, null);
        btn.dataset.itemId = item.id;
        btn.dataset.itemType = 'app';
        return btn;
    }
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'app-icon'
        + (item.type === 'folder' ? ' desktop-folder-icon' : '')
        + (item.type === 'file' ? ' desktop-file-icon' : '');
    btn.dataset.itemId = item.id;
    btn.dataset.itemType = item.type;
    btn.title = DesktopFiles.itemLabel(item);
    btn.innerHTML = `<span class="app-emoji">${DesktopFiles.itemEmoji(item)}</span>`
        + `<span class="app-label">${DesktopFiles.itemLabel(item)}</span>`;
    return btn;
}

function findFolderAtPosition(x, y, layout, skipId) {
    if (typeof DesktopFiles === 'undefined') return null;
    for (const entry of layout) {
        if (entry.id === skipId) continue;
        const item = DesktopFiles.getItem(entry.id);
        if (item?.type !== 'folder') continue;
        if (iconsOverlap(x, y, entry.x, entry.y)) return item;
    }
    return null;
}

function highlightFolderDropTarget(x, y, layout, skipId) {
    const layer = getDesktopIconLayer();
    if (!layer) return null;
    layer.querySelectorAll('.app-icon.folder-drop-target').forEach(el => el.classList.remove('folder-drop-target'));
    const folder = findFolderAtPosition(x, y, layout, skipId);
    if (!folder) return null;
    layer.querySelector(`.app-icon[data-item-id="${folder.id}"]`)?.classList.add('folder-drop-target');
    return folder;
}

function getCurrentDesktopLayoutFromDom() {
    const layer = getDesktopIconLayer();
    if (!layer) return loadDesktopLayout();
    return [...layer.querySelectorAll('.app-icon')].map(btn => {
        const id = btn.dataset.itemId || btn.dataset.app;
        const x = parseInt(btn.style.left, 10) || 0;
        const y = parseInt(btn.style.top, 10) || 0;
        return { id, x, y };
    });
}

function renderDesktopIcons(onOpen) {
    const layer = getDesktopIconLayer();
    if (!layer) return;
    if (onOpen) desktopOnOpen = onOpen;
    if (!isDesktopLayerReady()) {
        scheduleDesktopIconsRender(onOpen);
        return;
    }

    if (typeof DesktopFiles !== 'undefined') {
        DesktopFiles.bootstrapAppsIfNeeded(getDefaultDesktopLayout);
    }
    let layout = loadDesktopLayout();
    if (typeof DesktopFiles === 'undefined') {
        layout = applyRecycleAnchor(layout);
    }

    layer.innerHTML = '';
    layout.forEach(entry => {
        let btn;
        if (typeof DesktopFiles !== 'undefined' && entry.item) {
            btn = createDesktopItemButton(entry.item);
        } else if (entry.id === DESKTOP_RECYCLE_ID) {
            btn = createRecycleIconButton();
        } else {
            const app = getDesktopApp(entry.id);
            if (!app) return;
            btn = createAppIconButton(app, null);
            btn.dataset.itemId = entry.id;
            btn.dataset.itemType = 'app';
        }
        if (!btn) return;
        applyIconPosition(btn, entry.x, entry.y);
        layer.appendChild(btn);
    });

    if (typeof DesktopFiles === 'undefined') {
        saveDesktopLayout(layout);
    }
    layer.dataset.layoutReady = '1';

    if (typeof updateRecycleBadge === 'function') updateRecycleBadge();
}

function scheduleDesktopIconsRender(onOpen) {
    if (onOpen) desktopOnOpen = onOpen;
    const layer = getDesktopIconLayer();
    if (!layer || desktopIconsObserver) return;

    desktopIconsObserver = new ResizeObserver(() => {
        if (!isDesktopLayerReady()) return;
        desktopIconsObserver?.disconnect();
        desktopIconsObserver = null;
        renderDesktopIcons(desktopOnOpen);
    });
    desktopIconsObserver.observe(layer);
}

function ensureDesktopIconsRendered(onOpen) {
    const layer = getDesktopIconLayer();
    if (!layer) return;
    if (onOpen) desktopOnOpen = onOpen;

    const domLayout = layer.querySelector('.app-icon') ? getCurrentDesktopLayoutFromDom() : [];
    const needsRender = !layer.querySelector('.app-icon')
        || layoutNeedsRepack(domLayout)
        || layer.dataset.layoutReady !== '1';

    if (!needsRender && isDesktopLayerReady()) return;
    renderDesktopIcons(desktopOnOpen);
}

function pinAppToDesktop(appId) {
    if (!appId || appId === DESKTOP_RECYCLE_ID || !getDesktopApp(appId)) return;
    if (typeof DesktopFiles !== 'undefined') {
        const state = DesktopFiles.ensureState();
        const existing = state.items.find(i => i.id === appId && !i.parentId);
        if (existing) return;
        const pos = findFreeDesktopCell(DesktopFiles.getLayoutForRender().map(i => ({ id: i.id, x: i.x, y: i.y })));
        state.items.push({ id: appId, type: 'app', parentId: null, x: pos.x, y: pos.y });
        DesktopFiles.saveState(state);
        renderDesktopIcons(desktopOnOpen);
    } else {
        const ids = loadDesktopLayout().map(i => i.id).filter(id => id !== DESKTOP_RECYCLE_ID);
        if (ids.includes(appId)) return;
        ids.push(appId);
        saveDesktopLayout(packDesktopLayoutFromIds([...ids, DESKTOP_RECYCLE_ID]));
        renderDesktopIcons(desktopOnOpen);
    }
    hideDesktopContextMenu();
    if (typeof showToast === 'function') {
        const app = getDesktopApp(appId);
        showToast(`${app?.label || appId} — ${desktopLabel('desktop.pinned', 'на рабочем столе')}`);
    }
}

function unpinAppFromDesktop(appId) {
    if (!appId || appId === DESKTOP_RECYCLE_ID) return;
    if (typeof DesktopFiles !== 'undefined') {
        const state = DesktopFiles.ensureState();
        state.items = state.items.filter(i => !(i.id === appId && i.type === 'app'));
        DesktopFiles.saveState(state);
        renderDesktopIcons(desktopOnOpen);
    } else {
        const ids = loadDesktopLayout().map(i => i.id).filter(id => id !== appId);
        saveDesktopLayout(packDesktopLayoutFromIds(ids));
        renderDesktopIcons(desktopOnOpen);
    }
    hideDesktopContextMenu();
}

function removeDesktopItem(itemId) {
    if (typeof DesktopFiles === 'undefined') return;
    const item = DesktopFiles.getItem(itemId);
    if (!item || item.id === DESKTOP_RECYCLE_ID) return;
    if (item.type === 'app') {
        unpinAppFromDesktop(itemId);
        return;
    }
    DesktopFiles.deleteItem(itemId);
    if (typeof closeApp === 'function') {
        closeApp(DesktopFiles.fileWindowId(itemId));
        closeApp(DesktopFiles.folderWindowId(itemId));
    }
    renderDesktopIcons(desktopOnOpen);
    hideDesktopContextMenu();
}

function promptRenameItem(itemId) {
    const item = DesktopFiles?.getItem(itemId);
    if (!item || item.type === 'app') return;
    hideDesktopContextMenu();
    requestAnimationFrame(() => {
        let anchor = getDesktopIconLayer()?.querySelector(`.app-icon[data-item-id="${itemId}"]`);
        if (!anchor) {
            anchor = document.querySelector(`.folder-grid-item[data-item-id="${itemId}"]`);
        }
        if (anchor) startInlineRename(itemId, anchor);
    });
}

let activeInlineRename = null;

function normalizeRenamedFileName(raw, item) {
    const trimmed = (raw || '').trim();
    if (!trimmed || !item) return null;
    if (item.type !== 'file' || !item.fileKind) return trimmed;
    const extByKind = { txt: '.txt', docx: '.docx', xlsx: '.xlsx' };
    const ext = extByKind[item.fileKind] || '';
    if (!ext) return trimmed;
    if (trimmed.toLowerCase().endsWith(ext.toLowerCase())) return trimmed;
    const base = trimmed.replace(/\.[^.]+$/, '') || trimmed;
    return base + ext;
}

function selectInlineRenameText(input, item) {
    const full = input.value;
    if (item.type === 'file' && item.fileKind) {
        const extByKind = { txt: '.txt', docx: '.docx', xlsx: '.xlsx' };
        const ext = extByKind[item.fileKind] || '';
        if (ext && full.toLowerCase().endsWith(ext.toLowerCase())) {
            input.setSelectionRange(0, full.length - ext.length);
            return;
        }
        const dot = full.lastIndexOf('.');
        if (dot > 0) {
            input.setSelectionRange(0, dot);
            return;
        }
    }
    input.select();
}

function restoreInlineRenameLabel(containerEl, labelClass, name) {
    const input = containerEl.querySelector('.desktop-rename-input');
    if (!input) return;
    const label = document.createElement('span');
    label.className = labelClass;
    label.textContent = name;
    input.replaceWith(label);
    containerEl.classList.remove('is-renaming');
}

function cancelInlineRename() {
    if (!activeInlineRename) return;
    const { containerEl, labelClass, originalName } = activeInlineRename;
    restoreInlineRenameLabel(containerEl, labelClass, originalName);
    activeInlineRename = null;
}

function commitInlineRename() {
    if (!activeInlineRename) return;
    const { itemId, containerEl, labelClass, originalName } = activeInlineRename;
    const input = containerEl.querySelector('.desktop-rename-input');
    activeInlineRename = null;
    if (!input) return;

    const item = DesktopFiles?.getItem(itemId);
    if (!item) {
        restoreInlineRenameLabel(containerEl, labelClass, originalName);
        return;
    }

    const newName = normalizeRenamedFileName(input.value, item);
    if (!newName || newName === item.name) {
        restoreInlineRenameLabel(containerEl, labelClass, item.name);
        return;
    }

    if (DesktopFiles.renameItem(itemId, newName)) {
        renderDesktopIcons(desktopOnOpen);
        if (item.parentId) DesktopFiles.rerenderFolderWindow(item.parentId);
    } else {
        restoreInlineRenameLabel(containerEl, labelClass, item.name);
    }
}

function startInlineRename(itemId, containerEl) {
    if (typeof DesktopFiles === 'undefined') return;
    const item = DesktopFiles.getItem(itemId);
    if (!item || item.type === 'app') return;
    if (activeInlineRename) {
        if (activeInlineRename.containerEl === containerEl) return;
        commitInlineRename();
    }

    const labelClass = containerEl.classList.contains('folder-grid-item') ? 'folder-grid-label' : 'app-label';
    const label = containerEl.querySelector('.' + labelClass);
    if (!label || containerEl.querySelector('.desktop-rename-input')) return;

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'desktop-rename-input';
    input.value = item.name;
    input.spellcheck = false;
    input.setAttribute('aria-label', desktopLabel('desktop.rename', 'Переименовать'));

    label.replaceWith(input);
    containerEl.classList.add('is-renaming');
    activeInlineRename = { itemId, containerEl, labelClass, originalName: item.name };

    requestAnimationFrame(() => {
        input.focus();
        selectInlineRenameText(input, item);
    });

    input.addEventListener('keydown', e => {
        e.stopPropagation();
        if (e.key === 'Enter') {
            e.preventDefault();
            input.blur();
        } else if (e.key === 'Escape') {
            e.preventDefault();
            cancelInlineRename();
        }
    });
    input.addEventListener('mousedown', e => e.stopPropagation());
    input.addEventListener('pointerdown', e => e.stopPropagation());
    input.addEventListener('click', e => e.stopPropagation());
    input.addEventListener('dblclick', e => e.stopPropagation());
    input.addEventListener('blur', () => {
        setTimeout(() => {
            if (activeInlineRename?.containerEl === containerEl) commitInlineRename();
        }, 0);
    });
}

function moveItemToDesktopRoot(itemId) {
    if (typeof DesktopFiles === 'undefined') return;
    const item = DesktopFiles.getItem(itemId);
    const oldParent = item?.parentId;
    const layout = getCurrentDesktopLayoutFromDom();
    const pos = findFreeDesktopCell(layout);
    if (DesktopFiles.moveItem(itemId, null, pos)) {
        renderDesktopIcons(desktopOnOpen);
        if (oldParent) DesktopFiles.rerenderFolderWindow(oldParent);
        if (typeof showToast === 'function') showToast(desktopLabel('desktop.movedToDesktop', 'На рабочем столе'));
    }
    hideDesktopContextMenu();
}

function hideDesktopContextMenu() {
    desktopContextMenuEl?.remove();
    desktopContextMenuEl = null;
}

function showDesktopContextMenu(clientX, clientY, items) {
    hideDesktopContextMenu();
    if (!items?.length) return;
    const menu = document.createElement('div');
    menu.className = 'desktop-context-menu';
    menu.setAttribute('role', 'menu');
    items.forEach(item => {
        if (item.separator) {
            const sep = document.createElement('div');
            sep.className = 'desktop-context-sep';
            menu.appendChild(sep);
            return;
        }
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'desktop-context-item';
        btn.textContent = item.label;
        btn.disabled = !!item.disabled;
        btn.onclick = e => {
            e.stopPropagation();
            hideDesktopContextMenu();
            item.action?.();
        };
        menu.appendChild(btn);
    });
    document.body.appendChild(menu);
    desktopContextMenuEl = menu;

    const rect = menu.getBoundingClientRect();
    const maxX = window.innerWidth - rect.width - 8;
    const maxY = window.innerHeight - rect.height - 8;
    menu.style.left = `${Math.min(clientX, maxX)}px`;
    menu.style.top = `${Math.min(clientY, maxY)}px`;
}

function showAddShortcutMenu(clientX, clientY) {
    const onDesktop = new Set(
        typeof DesktopFiles !== 'undefined'
            ? DesktopFiles.getLayoutForRender().map(i => i.id)
            : loadDesktopLayout().map(i => i.id)
    );
    const apps = (typeof DESKTOP_APPS !== 'undefined' ? DESKTOP_APPS : [])
        .filter(a => !onDesktop.has(a.id))
        .sort((a, b) => a.label.localeCompare(b.label, 'ru'));
    if (!apps.length) {
        if (typeof showToast === 'function') showToast(desktopLabel('desktop.allPinned', 'Все приложения уже на столе'));
        return;
    }
    const items = apps.map(app => ({
        label: `${app.emoji} ${app.label}`,
        action: () => pinAppToDesktop(app.id)
    }));
    showDesktopContextMenu(clientX, clientY, items);
}

function showNewItemMenu(clientX, clientY, parentId, position) {
    if (typeof DesktopFiles === 'undefined') return;
    const pos = position || findFreeDesktopCell(getCurrentDesktopLayoutFromDom());
    showDesktopContextMenu(clientX, clientY, [
        {
            label: desktopLabel('desktop.new.txt', '📄 Текстовый документ'),
            action: () => {
                DesktopFiles.createFile('txt', parentId, parentId ? null : pos);
                if (parentId) DesktopFiles.rerenderFolderWindow(parentId);
                else renderDesktopIcons(desktopOnOpen);
            }
        },
        {
            label: desktopLabel('desktop.new.docx', '📝 Документ Word'),
            action: () => {
                DesktopFiles.createFile('docx', parentId, parentId ? null : pos);
                if (parentId) DesktopFiles.rerenderFolderWindow(parentId);
                else renderDesktopIcons(desktopOnOpen);
            }
        },
        {
            label: desktopLabel('desktop.new.xlsx', '📗 Таблица Excel'),
            action: () => {
                DesktopFiles.createFile('xlsx', parentId, parentId ? null : pos);
                if (parentId) DesktopFiles.rerenderFolderWindow(parentId);
                else renderDesktopIcons(desktopOnOpen);
            }
        },
        { separator: true },
        {
            label: desktopLabel('desktop.new.folder', '📁 Папку'),
            action: () => {
                DesktopFiles.createFolder(parentId, parentId ? null : pos);
                if (parentId) DesktopFiles.rerenderFolderWindow(parentId);
                else renderDesktopIcons(desktopOnOpen);
            }
        }
    ]);
}

function buildMoveToFolderItems(itemId) {
    if (typeof DesktopFiles === 'undefined') return [];
    const folders = DesktopFiles.getRootItems().filter(i => i.type === 'folder' && i.id !== itemId);
    return folders.map(f => ({
        label: `📁 ${f.name}`,
        action: () => {
            if (DesktopFiles.moveItem(itemId, f.id)) {
                renderDesktopIcons(desktopOnOpen);
                if (typeof showToast === 'function') {
                    showToast(desktopLabel('desktop.movedToFolder', 'Перемещено в папку'));
                }
            }
        }
    }));
}

function showDesktopItemContextMenu(clientX, clientY, itemId) {
    if (typeof DesktopFiles === 'undefined') return;
    const item = DesktopFiles.getItem(itemId);
    if (!item) return;
    const items = [];
    if (item.type === 'folder' || item.type === 'file') {
        items.push({
            label: desktopLabel('desktop.open', 'Открыть'),
            action: () => DesktopFiles.openItem(itemId)
        });
    }
    if (item.type === 'app') {
        items.push({
            label: desktopLabel('desktop.unpin', 'Убрать с рабочего стола'),
            action: () => unpinAppFromDesktop(itemId)
        });
    }
    if (item.type === 'file' || item.type === 'folder') {
        items.push({
            label: desktopLabel('desktop.rename', 'Переименовать'),
            action: () => promptRenameItem(itemId)
        });
        const folderTargets = buildMoveToFolderItems(itemId);
        if (folderTargets.length) {
            items.push({ separator: true });
            folderTargets.forEach(f => items.push(f));
        }
        items.push({ separator: true });
        items.push({
            label: desktopLabel('desktop.delete', 'Удалить'),
            action: () => removeDesktopItem(itemId)
        });
    }
    if (items.length) showDesktopContextMenu(clientX, clientY, items);
}

function showFolderItemContextMenu(clientX, clientY, itemId) {
    if (typeof DesktopFiles === 'undefined') return;
    const item = DesktopFiles.getItem(itemId);
    if (!item) return;
    const items = [
        {
            label: desktopLabel('desktop.open', 'Открыть'),
            action: () => DesktopFiles.openItem(itemId)
        },
        {
            label: desktopLabel('desktop.rename', 'Переименовать'),
            action: () => promptRenameItem(itemId)
        },
        {
            label: desktopLabel('desktop.moveOut', 'Вынести на рабочий стол'),
            action: () => moveItemToDesktopRoot(itemId)
        },
        { separator: true },
        {
            label: desktopLabel('desktop.delete', 'Удалить'),
            action: () => {
                const parentId = item.parentId;
                removeDesktopItem(itemId);
                if (parentId) DesktopFiles.rerenderFolderWindow(parentId);
            }
        }
    ];
    showDesktopContextMenu(clientX, clientY, items);
}

function showEmptyDesktopContextMenu(clientX, clientY) {
    const pos = findFreeDesktopCell(getCurrentDesktopLayoutFromDom());
    showDesktopContextMenu(clientX, clientY, [
        {
            label: desktopLabel('desktop.new.txt', '📄 Текстовый документ'),
            action: () => { DesktopFiles.createFile('txt', null, pos); renderDesktopIcons(desktopOnOpen); }
        },
        {
            label: desktopLabel('desktop.new.docx', '📝 Документ Word'),
            action: () => { DesktopFiles.createFile('docx', null, pos); renderDesktopIcons(desktopOnOpen); }
        },
        {
            label: desktopLabel('desktop.new.xlsx', '📗 Таблица Excel'),
            action: () => { DesktopFiles.createFile('xlsx', null, pos); renderDesktopIcons(desktopOnOpen); }
        },
        {
            label: desktopLabel('desktop.new.folder', '📁 Папку'),
            action: () => { DesktopFiles.createFolder(null, pos); renderDesktopIcons(desktopOnOpen); }
        },
        { separator: true },
        {
            label: desktopLabel('desktop.addShortcut', 'Добавить ярлык…'),
            action: () => showAddShortcutMenu(clientX, clientY)
        }
    ]);
}

function openDesktopIcon(itemId) {
    if (desktopSuppressClick) return;
    if (typeof DesktopFiles !== 'undefined') {
        DesktopFiles.openItem(itemId);
        return;
    }
    if (!desktopOnOpen) return;
    if (itemId === DESKTOP_RECYCLE_ID) desktopOnOpen('recycle');
    else desktopOnOpen(itemId);
}

function initDesktopDragDrop() {
    const layer = getDesktopIconLayer();
    if (!layer) return;

    layer.addEventListener('pointerdown', e => {
        if (e.target.closest('.desktop-rename-input')) return;
        const btn = e.target.closest('.app-icon');
        if (!btn || !layer.contains(btn)) return;
        if (btn.classList.contains('is-renaming')) return;
        if (typeof isDevOsLocked === 'function' && isDevOsLocked()) return;

        const rect = btn.getBoundingClientRect();
        desktopDragState = {
            btn,
            appId: btn.dataset.itemId || btn.dataset.app,
            pointerId: e.pointerId,
            startClientX: e.clientX,
            startClientY: e.clientY,
            offsetX: e.clientX - rect.left,
            offsetY: e.clientY - rect.top,
            originX: parseInt(btn.style.left, 10) || 0,
            originY: parseInt(btn.style.top, 10) || 0,
            dragging: false
        };
        btn.setPointerCapture(e.pointerId);
    });

    layer.addEventListener('pointermove', e => {
        if (!desktopDragState || desktopDragState.pointerId !== e.pointerId) return;
        const dx = e.clientX - desktopDragState.startClientX;
        const dy = e.clientY - desktopDragState.startClientY;
        if (!desktopDragState.dragging) {
            if (Math.hypot(dx, dy) < DESKTOP_DRAG_THRESHOLD) return;
            desktopDragState.dragging = true;
            desktopDragState.btn.classList.add('dragging');
        }
        const layerRect = layer.getBoundingClientRect();
        const rawX = e.clientX - layerRect.left - desktopDragState.offsetX;
        const rawY = e.clientY - layerRect.top - desktopDragState.offsetY;
        const snapped = snapDesktopPosition(rawX, rawY);
        const layout = getCurrentDesktopLayoutFromDom();
        const folderTarget = typeof DesktopFiles !== 'undefined'
            ? highlightFolderDropTarget(snapped.x, snapped.y, layout, desktopDragState.appId)
            : null;
        const occupied = !folderTarget && isDesktopCellOccupied(snapped.x, snapped.y, layout, desktopDragState.appId);
        desktopDragState.btn.classList.toggle('invalid-drop', occupied);
        desktopDragState.folderTarget = folderTarget;
        applyIconPosition(desktopDragState.btn, snapped.x, snapped.y);
    });

    layer.addEventListener('pointerup', e => {
        if (!desktopDragState || desktopDragState.pointerId !== e.pointerId) return;
        const { btn, appId, dragging } = desktopDragState;
        try { btn.releasePointerCapture(e.pointerId); } catch (_) { /* ignore */ }

        if (dragging) {
            desktopSuppressClick = true;
            btn.classList.remove('dragging', 'invalid-drop');
            getDesktopIconLayer()?.querySelectorAll('.folder-drop-target').forEach(el => el.classList.remove('folder-drop-target'));
            const x = parseInt(btn.style.left, 10) || 0;
            const y = parseInt(btn.style.top, 10) || 0;
            const layout = getCurrentDesktopLayoutFromDom();
            const itemId = desktopDragState.appId;
            const folderTarget = desktopDragState.folderTarget
                || (typeof DesktopFiles !== 'undefined' ? findFolderAtPosition(x, y, layout, itemId) : null);

            if (folderTarget && typeof DesktopFiles !== 'undefined') {
                const item = DesktopFiles.getItem(itemId);
                if (item && item.type !== 'folder' && DesktopFiles.moveItem(itemId, folderTarget.id)) {
                    renderDesktopIcons(desktopOnOpen);
                    if (typeof showToast === 'function') {
                        showToast(desktopLabel('desktop.movedToFolder', 'Перемещено в папку'));
                    }
                    setTimeout(() => { desktopSuppressClick = false; }, 0);
                    desktopDragState = null;
                    return;
                }
            }

            const drop = resolveDropPosition(
                x, y, layout, itemId,
                { x: desktopDragState.originX, y: desktopDragState.originY }
            );
            applyIconPosition(btn, drop.x, drop.y);
            const idx = layout.findIndex(i => i.id === itemId);
            if (idx >= 0) layout[idx] = { id: itemId, x: drop.x, y: drop.y };
            if (typeof DesktopFiles !== 'undefined') {
                const item = DesktopFiles.getItem(itemId);
                if (item && !item.parentId) {
                    DesktopFiles.updateItemPosition(itemId, drop.x, drop.y);
                }
                DesktopFiles.syncAppLayout(layout.filter(e => {
                    const it = DesktopFiles.getItem(e.id);
                    return !it || it.type === 'app';
                }));
            } else {
                saveDesktopLayout(applyRecycleAnchor(layout));
            }
            if (!drop.valid && typeof showToast === 'function') {
                showToast(desktopLabel('desktop.cannotOverlap', 'Нельзя ставить значок на значок'));
            }
            setTimeout(() => { desktopSuppressClick = false; }, 0);
        } else {
            openDesktopIcon(desktopDragState.appId);
        }
        desktopDragState = null;
    });

    layer.addEventListener('pointercancel', () => {
        if (desktopDragState?.btn) desktopDragState.btn.classList.remove('dragging');
        desktopDragState = null;
    });
}

function initDesktopContextMenus(onOpen) {
    desktopOnOpen = onOpen;
    const layer = getDesktopIconLayer();
    if (!layer) return;

    layer.addEventListener('contextmenu', e => {
        if (typeof isDevOsLocked === 'function' && isDevOsLocked()) return;
        const icon = e.target.closest('.app-icon');
        if (icon && layer.contains(icon)) {
            e.preventDefault();
            const itemId = icon.dataset.itemId || icon.dataset.app;
            if (typeof DesktopFiles !== 'undefined') {
                showDesktopItemContextMenu(e.clientX, e.clientY, itemId);
            } else {
                const appId = icon.dataset.app;
                const items = [];
                if (appId !== DESKTOP_RECYCLE_ID) {
                    items.push({
                        label: desktopLabel('desktop.unpin', 'Убрать с рабочего стола'),
                        action: () => unpinAppFromDesktop(appId)
                    });
                }
                if (items.length) showDesktopContextMenu(e.clientX, e.clientY, items);
            }
            return;
        }
        if (e.target === layer || layer.contains(e.target)) {
            e.preventDefault();
            if (typeof DesktopFiles !== 'undefined') {
                showEmptyDesktopContextMenu(e.clientX, e.clientY);
            } else {
                showDesktopContextMenu(e.clientX, e.clientY, [{
                    label: desktopLabel('desktop.addShortcut', 'Добавить ярлык…'),
                    action: () => showAddShortcutMenu(e.clientX, e.clientY)
                }]);
            }
        }
    });

    document.addEventListener('click', e => {
        if (desktopContextMenuEl && !desktopContextMenuEl.contains(e.target)) {
            hideDesktopContextMenu();
        }
    });

    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') hideDesktopContextMenu();
    });

    window.addEventListener('resize', () => {
        const layout = packDesktopLayoutFromIds(loadDesktopLayout().map(i => i.id));
        saveDesktopLayout(layout);
        renderDesktopIcons(desktopOnOpen);
    });
}
