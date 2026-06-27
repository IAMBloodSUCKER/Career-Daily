/** Файлы, папки и окна документов на рабочем столе DevOS */
const DesktopFiles = (() => {
    const STATE_KEY = 'career-daily-desktop-v8';
    const FILE_WIN_PREFIX = '__file__';
    const FOLDER_WIN_PREFIX = '__folder__';

    const FILE_KINDS = {
        txt: { emoji: '📄', ext: '.txt', defaultName: 'Новый текстовый документ' },
        docx: { emoji: '📝', ext: '.docx', defaultName: 'Новый документ Word' },
        xlsx: { emoji: '📗', ext: '.xlsx', defaultName: 'Новая таблица Excel' }
    };

    function dfLabel(key, fallback) {
        return typeof t === 'function' ? t(key) : fallback;
    }

    function newId() {
        return 'dsk-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
    }

    function defaultTxtContent() {
        return dfLabel('desktop.file.defaultTxt', '');
    }

    function defaultDocContent() {
        const day = typeof workspace !== 'undefined' ? workspace?.player?.day : 1;
        const time = typeof workspace !== 'undefined' ? workspace?.timeLabel : '09:00';
        return `Daily standup — ${time}\n\nВчера:\n- \n\nСегодня:\n- \n\nБлокеры:\n- `;
    }

    function defaultSheetData() {
        return emptySheet(8, 25);
    }

    function emptySheet(colCount = 8, rowCount = 25) {
        return {
            colCount,
            rowCount,
            data: Array.from({ length: rowCount }, () => Array.from({ length: colCount }, () => '')),
            activeSheet: 'Sheet1'
        };
    }

    function colToLetter(index) {
        let n = index + 1;
        let s = '';
        while (n > 0) {
            const rem = (n - 1) % 26;
            s = String.fromCharCode(65 + rem) + s;
            n = Math.floor((n - 1) / 26);
        }
        return s;
    }

    function cellRef(row, col) {
        return colToLetter(col) + (row + 1);
    }

    function normalizeSheetData(sheet) {
        if (!sheet) return emptySheet();
        if (Array.isArray(sheet.data)) {
            const colCount = Math.max(sheet.colCount || 0, ...sheet.data.map(r => r.length), 8);
            const rowCount = Math.max(sheet.rowCount || 0, sheet.data.length, 20);
            const data = Array.from({ length: rowCount }, (_, ri) =>
                Array.from({ length: colCount }, (_, ci) => String(sheet.data[ri]?.[ci] ?? '')));
            return { colCount, rowCount, data, activeSheet: sheet.activeSheet || 'Sheet1' };
        }
        if (sheet.headers && Array.isArray(sheet.rows)) {
            const merged = [sheet.headers, ...sheet.rows];
            const colCount = Math.max(8, ...merged.map(r => r.length));
            const rowCount = Math.max(merged.length + 4, 20);
            const data = Array.from({ length: rowCount }, (_, ri) =>
                Array.from({ length: colCount }, (_, ci) => String(merged[ri]?.[ci] ?? '')));
            return { colCount, rowCount, data, activeSheet: 'Sheet1' };
        }
        return emptySheet();
    }

    function parseCellRef(ref) {
        const m = String(ref || '').trim().match(/^([A-Z]+)(\d+)$/i);
        if (!m) return null;
        const letters = m[1].toUpperCase();
        let col = 0;
        for (let i = 0; i < letters.length; i++) {
            col = col * 26 + (letters.charCodeAt(i) - 64);
        }
        return { row: parseInt(m[2], 10) - 1, col: col - 1 };
    }

    function evalSheetFormula(formula, sheet, evalStack = new Set()) {
        const expr = String(formula || '').trim();
        if (!expr.startsWith('=')) return expr;
        const body = expr.slice(1).trim();

        const sumMatch = body.match(/^SUM\s*\(\s*([A-Z]+\d+)\s*:\s*([A-Z]+\d+)\s*\)$/i);
        if (sumMatch) {
            const a = parseCellRef(sumMatch[1]);
            const b = parseCellRef(sumMatch[2]);
            if (!a || !b) return '#REF!';
            const r0 = Math.min(a.row, b.row);
            const r1 = Math.max(a.row, b.row);
            const c0 = Math.min(a.col, b.col);
            const c1 = Math.max(a.col, b.col);
            let sum = 0;
            for (let r = r0; r <= r1; r++) {
                for (let c = c0; c <= c1; c++) {
                    const raw = sheet.data[r]?.[c] ?? '';
                    const v = String(raw).startsWith('=')
                        ? evalSheetFormula(raw, sheet, evalStack)
                        : raw;
                    const n = parseFloat(String(v).replace(',', '.'));
                    if (!isNaN(n)) sum += n;
                }
            }
            return String(sum);
        }

        const replaced = body.replace(/([A-Z]+\d+)/gi, ref => {
            const pos = parseCellRef(ref);
            if (!pos) return '0';
            const key = cellRef(pos.row, pos.col);
            if (evalStack.has(key)) return '0';
            evalStack.add(key);
            const raw = sheet.data[pos.row]?.[pos.col] ?? '';
            const val = String(raw).startsWith('=')
                ? evalSheetFormula(raw, sheet, evalStack)
                : raw;
            evalStack.delete(key);
            const n = parseFloat(String(val).replace(',', '.'));
            return isNaN(n) ? `"${String(val).replace(/"/g, '')}"` : String(n);
        });

        if (/^[0-9+\-*/().\s]+$/.test(replaced)) {
            try {
                // eslint-disable-next-line no-new-func
                const result = Function(`"use strict"; return (${replaced});`)();
                if (typeof result === 'number' && Number.isFinite(result)) {
                    return String(Math.round(result * 1000) / 1000);
                }
            } catch (_) { /* fall through */ }
        }
        return '#ERR!';
    }

    function displayCellValue(raw, sheet) {
        const s = String(raw ?? '');
        if (s.startsWith('=')) return evalSheetFormula(s, sheet);
        return s;
    }

    function migrateFromV7() {
        const legacy = localStorage.getItem('career-daily-desktop-layout-v7');
        if (!legacy) return null;
        try {
            const raw = JSON.parse(legacy);
            if (!Array.isArray(raw)) return null;
            return {
                items: raw.map(entry => ({
                    id: entry.id,
                    type: entry.id === '__recycle__' ? 'app' : 'app',
                    parentId: null,
                    x: entry.x ?? 12,
                    y: entry.y ?? 12
                }))
            };
        } catch (_) {
            return null;
        }
    }

    function loadState() {
        try {
            const saved = localStorage.getItem(STATE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed.items)) return parsed;
            }
        } catch (_) { /* ignore */ }
        const migrated = migrateFromV7();
        if (migrated) {
            saveState(migrated);
            return migrated;
        }
        return null;
    }

    function saveState(state) {
        try {
            localStorage.setItem(STATE_KEY, JSON.stringify(state));
        } catch (_) { /* ignore */ }
    }

    function ensureState() {
        let state = loadState();
        if (!state) {
            state = { items: [] };
        }
        return state;
    }

    function getItem(id) {
        return ensureState().items.find(i => i.id === id) || null;
    }

    function getRootItems() {
        return ensureState().items.filter(i => !i.parentId);
    }

    function getFolderChildren(folderId) {
        return ensureState().items.filter(i => i.parentId === folderId);
    }

    function uniqueName(baseName, parentId) {
        const siblings = parentId
            ? getFolderChildren(parentId)
            : getRootItems();
        const names = new Set(siblings.filter(i => i.type !== 'app').map(i => i.name));
        if (!names.has(baseName)) return baseName;
        let n = 2;
        while (names.has(`${baseName} (${n})`)) n++;
        return `${baseName} (${n})`;
    }

    function createFile(kind, parentId = null, position = null) {
        const meta = FILE_KINDS[kind];
        if (!meta) return null;
        const state = ensureState();
        const name = uniqueName(meta.defaultName + meta.ext, parentId);
        const item = {
            id: newId(),
            type: 'file',
            fileKind: kind,
            name,
            parentId,
            content: kind === 'txt' ? defaultTxtContent() : kind === 'docx' ? defaultDocContent() : '',
            sheet: kind === 'xlsx' ? defaultSheetData() : null
        };
        if (!parentId && position) {
            item.x = position.x;
            item.y = position.y;
        }
        state.items.push(item);
        saveState(state);
        return item;
    }

    function createFolder(parentId = null, position = null) {
        const state = ensureState();
        const base = dfLabel('desktop.folder.defaultName', 'Новая папка');
        const item = {
            id: newId(),
            type: 'folder',
            name: uniqueName(base, parentId),
            parentId
        };
        if (!parentId && position) {
            item.x = position.x;
            item.y = position.y;
        }
        state.items.push(item);
        saveState(state);
        return item;
    }

    function isDescendantFolder(folderId, maybeChildId) {
        let cur = getItem(maybeChildId);
        while (cur?.parentId) {
            if (cur.parentId === folderId) return true;
            cur = getItem(cur.parentId);
        }
        return false;
    }

    function moveItem(itemId, parentId, position) {
        const state = ensureState();
        const item = state.items.find(i => i.id === itemId);
        if (!item) return false;
        if (item.id === '__recycle__') return false;
        if (parentId) {
            const folder = getItem(parentId);
            if (!folder || folder.type !== 'folder') return false;
            if (item.type === 'folder' && (itemId === parentId || isDescendantFolder(itemId, parentId))) {
                return false;
            }
            item.parentId = parentId;
            delete item.x;
            delete item.y;
        } else {
            item.parentId = null;
            if (position) {
                item.x = position.x;
                item.y = position.y;
            }
        }
        saveState(state);
        return true;
    }

    function updateItemPosition(itemId, x, y) {
        const state = ensureState();
        const item = state.items.find(i => i.id === itemId);
        if (!item || item.parentId) return;
        item.x = x;
        item.y = y;
        saveState(state);
    }

    function renameItem(itemId, name) {
        const trimmed = (name || '').trim();
        if (!trimmed) return false;
        const state = ensureState();
        const item = state.items.find(i => i.id === itemId);
        if (!item || item.type === 'app') return false;
        item.name = trimmed;
        saveState(state);
        return true;
    }

    function deleteItem(itemId) {
        const state = ensureState();
        const item = state.items.find(i => i.id === itemId);
        if (!item || item.id === '__recycle__') return false;

        const removeIds = new Set();
        function collect(id) {
            removeIds.add(id);
            state.items.filter(i => i.parentId === id).forEach(c => collect(c.id));
        }
        collect(itemId);
        state.items = state.items.filter(i => !removeIds.has(i.id));
        saveState(state);
        return true;
    }

    function saveFileContent(fileId, patch) {
        const state = ensureState();
        const item = state.items.find(i => i.id === fileId);
        if (!item || item.type !== 'file') return;
        Object.assign(item, patch);
        saveState(state);
    }

    function syncAppLayout(layoutEntries) {
        const state = ensureState();
        const filesAndFolders = state.items.filter(i => i.type !== 'app');
        const appsInFolders = state.items.filter(i => i.type === 'app' && i.parentId);
        const appItems = layoutEntries.map(e => {
            const prev = state.items.find(i => i.id === e.id && i.type === 'app');
            return {
                id: e.id,
                type: 'app',
                parentId: prev?.parentId || null,
                x: e.x,
                y: e.y
            };
        });
        state.items = [...appItems, ...appsInFolders, ...filesAndFolders];
        saveState(state);
        return state.items.filter(i => !i.parentId);
    }

    function bootstrapAppsIfNeeded(defaultLayoutFn) {
        const state = ensureState();
        const hasApps = state.items.some(i => i.type === 'app');
        if (hasApps) return;
        const layout = typeof defaultLayoutFn === 'function' ? defaultLayoutFn() : [];
        layout.forEach(entry => {
            state.items.push({
                id: entry.id,
                type: 'app',
                parentId: null,
                x: entry.x,
                y: entry.y
            });
        });
        saveState(state);
    }

    function getLayoutForRender() {
        const state = ensureState();
        return state.items.filter(i => !i.parentId);
    }

    function itemLabel(item) {
        if (!item) return '';
        if (item.type === 'app') {
            const app = typeof getDesktopApp === 'function' ? getDesktopApp(item.id) : null;
            return app?.label || item.id;
        }
        return item.name || item.id;
    }

    function itemEmoji(item) {
        if (!item) return '📦';
        if (item.type === 'folder') return '📁';
        if (item.type === 'file') return FILE_KINDS[item.fileKind]?.emoji || '📄';
        if (item.id === '__recycle__') return '🗑';
        const app = typeof getDesktopApp === 'function' ? getDesktopApp(item.id) : null;
        return app?.emoji || '📦';
    }

    function fileWindowId(fileId) {
        return FILE_WIN_PREFIX + fileId;
    }

    function folderWindowId(folderId) {
        return FOLDER_WIN_PREFIX + folderId;
    }

    function parseWindowId(winId) {
        if (winId.startsWith(FILE_WIN_PREFIX)) {
            return { kind: 'file', id: winId.slice(FILE_WIN_PREFIX.length) };
        }
        if (winId.startsWith(FOLDER_WIN_PREFIX)) {
            return { kind: 'folder', id: winId.slice(FOLDER_WIN_PREFIX.length) };
        }
        return null;
    }

    function getWindowMeta(winId) {
        const parsed = parseWindowId(winId);
        if (!parsed) return null;
        const item = getItem(parsed.id);
        if (!item) return null;
        return {
            emoji: itemEmoji(item),
            label: itemLabel(item),
            loadMs: 280,
            loadText: parsed.kind === 'folder'
                ? dfLabel('desktop.folder.opening', 'Открываю папку…')
                : dfLabel('desktop.file.opening', 'Открываю документ…')
        };
    }

    function openItem(itemId) {
        const item = getItem(itemId);
        if (!item) {
            if (itemId === '__recycle__' && typeof openAppWindow === 'function') {
                openAppWindow('recycle');
            } else if (typeof getDesktopApp === 'function' && getDesktopApp(itemId) && typeof openAppWindow === 'function') {
                openAppWindow(itemId);
            }
            return;
        }
        if (item.type === 'file' && typeof openAppWindow === 'function') {
            openAppWindow(fileWindowId(itemId));
        } else if (item.type === 'folder' && typeof openAppWindow === 'function') {
            openAppWindow(folderWindowId(itemId));
        } else if (item.type === 'app' && typeof openAppWindow === 'function') {
            openAppWindow(itemId);
        }
    }

    function renderTxtEditor(container, file) {
        container.innerHTML = '';
        const wrap = document.createElement('div');
        wrap.className = 'desktop-file-editor desktop-file-editor--txt';
        const ta = document.createElement('textarea');
        ta.className = 'notepad-editor';
        ta.value = file.content || '';
        ta.spellcheck = false;
        ta.oninput = () => saveFileContent(file.id, { content: ta.value });
        wrap.appendChild(ta);
        container.appendChild(wrap);
    }

    function renderDocEditor(container, file) {
        container.innerHTML = '';
        if (typeof appShell === 'function') {
            container.innerHTML = appShell('📝 Microsoft Word', file.name, '');
            const ta = document.createElement('textarea');
            ta.className = 'word-editor';
            ta.value = file.content || '';
            ta.oninput = () => saveFileContent(file.id, { content: ta.value });
            container.querySelector('.app-body')?.appendChild(ta);
            if (typeof addLimitedActions === 'function') {
                addLimitedActions(container, [{
                    text: '💾 Save',
                    action: () => {
                        saveFileContent(file.id, { content: ta.value });
                        if (typeof showToast === 'function') showToast(dfLabel('desktop.file.saved', 'Сохранено'));
                    }
                }]);
            }
        } else {
            renderTxtEditor(container, file);
        }
    }

    function renderSheetEditor(container, file) {
        container.innerHTML = '';
        let sheet = normalizeSheetData(file.sheet);
        let activeCell = { row: 0, col: 0 };

        const persist = () => saveFileContent(file.id, { sheet });

        const root = typeof mountBrandedApp === 'function'
            ? mountBrandedApp(container, 'brand-excel', `
                <span class="brand-logo excel-logo">📗 Microsoft Excel</span>
                <span class="brand-sub">${file.name}</span>
                <span class="brand-spacer"></span>
                <span class="brand-chip excel-ready-chip">${dfLabel('desktop.excel.ready', 'Готово')}</span>`,
                `<div class="excel-workbook desktop-sheet-editor">
                    <div class="excel-ribbon">
                        <button type="button" class="excel-ribbon-btn" data-excel-cmd="add-row">+ ${dfLabel('desktop.excel.addRow', 'Строка')}</button>
                        <button type="button" class="excel-ribbon-btn" data-excel-cmd="add-col">+ ${dfLabel('desktop.excel.addCol', 'Столбец')}</button>
                        <button type="button" class="excel-ribbon-btn" data-excel-cmd="clear">⌫ ${dfLabel('desktop.excel.clear', 'Очистить')}</button>
                        <button type="button" class="excel-ribbon-btn" data-excel-cmd="sum">Σ ${dfLabel('desktop.excel.sum', 'SUM')}</button>
                    </div>
                    <div class="excel-formula-bar">
                        <span class="excel-cell-ref">A1</span>
                        <input type="text" class="excel-formula-input sheet-cell-input" spellcheck="false"
                            placeholder="${dfLabel('desktop.excel.formulaHint', 'Значение или =SUM(A1:A5), =A1+B1')}" />
                    </div>
                    <div class="excel-grid-wrap">
                        <table class="excel-grid excel-table"></table>
                    </div>
                    <footer class="excel-footer">
                        <span class="excel-tab active">${sheet.activeSheet || 'Sheet1'}</span>
                        <span class="excel-status">${dfLabel('desktop.excel.status', 'Лист1 · введите данные')}</span>
                    </footer>
                </div>`)
            : null;

        if (!root) return;

        const table = root.querySelector('.excel-grid');
        const cellRefEl = root.querySelector('.excel-cell-ref');
        const formulaInput = root.querySelector('.excel-formula-input');
        const statusEl = root.querySelector('.excel-status');
        const readyChip = root.querySelector('.excel-ready-chip');

        const setStatus = (text) => {
            if (statusEl) statusEl.textContent = text;
        };

        const syncFormulaBar = (focusFormula = false) => {
            const { row, col } = activeCell;
            if (cellRefEl) cellRefEl.textContent = cellRef(row, col);
            if (formulaInput) {
                formulaInput.value = sheet.data[row]?.[col] ?? '';
                if (focusFormula) {
                    formulaInput.focus();
                    formulaInput.select();
                }
            }
        };

        const focusCell = (row, col, focusFormula = false) => {
            activeCell = {
                row: Math.max(0, Math.min(row, sheet.rowCount - 1)),
                col: Math.max(0, Math.min(col, sheet.colCount - 1))
            };
            table.querySelectorAll('.excel-cell-selected').forEach(el => el.classList.remove('excel-cell-selected'));
            const td = table.querySelector(`td[data-row="${activeCell.row}"][data-col="${activeCell.col}"]`);
            td?.classList.add('excel-cell-selected');
            syncFormulaBar(focusFormula);
            if (!focusFormula) td?.querySelector('.sheet-cell-input')?.focus();
        };

        const commitFormulaBar = () => {
            if (!formulaInput) return;
            const { row, col } = activeCell;
            if (!sheet.data[row]) sheet.data[row] = [];
            sheet.data[row][col] = formulaInput.value;
            persist();
            const inp = table.querySelector(`td[data-row="${row}"][data-col="${col}"] .sheet-cell-input`);
            if (inp) {
                const raw = sheet.data[row][col];
                inp.value = String(raw).startsWith('=') ? displayCellValue(raw, sheet) : raw;
                inp.dataset.raw = raw;
            }
            if (readyChip) readyChip.textContent = dfLabel('desktop.excel.saved', 'Сохранено');
            setStatus(`${cellRef(row, col)} · ${dfLabel('desktop.excel.statusSaved', 'изменения сохранены')}`);
        };

        const renderGrid = () => {
            table.innerHTML = '';
            const head = document.createElement('thead');
            const hr = document.createElement('tr');
            const corner = document.createElement('th');
            corner.className = 'excel-corner';
            hr.appendChild(corner);
            for (let c = 0; c < sheet.colCount; c++) {
                const th = document.createElement('th');
                th.className = 'excel-col-head';
                th.textContent = colToLetter(c);
                hr.appendChild(th);
            }
            head.appendChild(hr);
            table.appendChild(head);

            const body = document.createElement('tbody');
            for (let r = 0; r < sheet.rowCount; r++) {
                const tr = document.createElement('tr');
                const rowHead = document.createElement('th');
                rowHead.className = 'excel-row-head';
                rowHead.textContent = String(r + 1);
                tr.appendChild(rowHead);

                for (let c = 0; c < sheet.colCount; c++) {
                    const td = document.createElement('td');
                    td.dataset.row = String(r);
                    td.dataset.col = String(c);
                    const raw = sheet.data[r]?.[c] ?? '';
                    const inp = document.createElement('input');
                    inp.type = 'text';
                    inp.className = 'sheet-cell-input excel-cell-input';
                    inp.dataset.raw = raw;
                    inp.value = String(raw).startsWith('=') ? displayCellValue(raw, sheet) : raw;
                    inp.addEventListener('focus', () => {
                        activeCell = { row: r, col: c };
                        table.querySelectorAll('.excel-cell-selected').forEach(el => el.classList.remove('excel-cell-selected'));
                        td.classList.add('excel-cell-selected');
                        const raw = sheet.data[r]?.[c] ?? '';
                        inp.value = raw;
                        if (cellRefEl) cellRefEl.textContent = cellRef(r, c);
                        if (formulaInput) formulaInput.value = raw;
                    });
                    inp.addEventListener('blur', () => {
                        const raw = sheet.data[r]?.[c] ?? '';
                        inp.value = String(raw).startsWith('=') ? displayCellValue(raw, sheet) : raw;
                    });
                    inp.addEventListener('input', () => {
                        if (!sheet.data[r]) sheet.data[r] = [];
                        sheet.data[r][c] = inp.value;
                        inp.dataset.raw = inp.value;
                        if (formulaInput && activeCell.row === r && activeCell.col === c) {
                            formulaInput.value = inp.value;
                        }
                        persist();
                        if (readyChip) readyChip.textContent = dfLabel('desktop.excel.ready', 'Готово');
                    });
                    inp.addEventListener('keydown', e => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            commitFormulaBar();
                            focusCell(r + 1, c);
                        } else if (e.key === 'Tab') {
                            e.preventDefault();
                            commitFormulaBar();
                            focusCell(r, c + (e.shiftKey ? -1 : 1));
                        } else if (e.key === 'Escape') {
                            inp.value = String(raw).startsWith('=') ? displayCellValue(raw, sheet) : raw;
                            inp.blur();
                        }
                    });
                    td.appendChild(inp);
                    tr.appendChild(td);
                }
                body.appendChild(tr);
            }
            table.appendChild(body);
            focusCell(activeCell.row, activeCell.col);
        };

        formulaInput?.addEventListener('keydown', e => {
            if (e.key === 'Enter') {
                e.preventDefault();
                commitFormulaBar();
                focusCell(activeCell.row + 1, activeCell.col);
            } else if (e.key === 'Escape') {
                syncFormulaBar();
            }
        });
        formulaInput?.addEventListener('change', commitFormulaBar);

        root.querySelector('.excel-ribbon')?.addEventListener('click', e => {
            const cmd = e.target.closest('[data-excel-cmd]')?.dataset.excelCmd;
            if (!cmd) return;
            const { row, col } = activeCell;
            if (cmd === 'add-row') {
                sheet.data.splice(row + 1, 0, Array.from({ length: sheet.colCount }, () => ''));
                sheet.rowCount = sheet.data.length;
                renderGrid();
                focusCell(row + 1, col);
                persist();
                setStatus(dfLabel('desktop.excel.rowAdded', 'Строка добавлена'));
            } else if (cmd === 'add-col') {
                sheet.colCount += 1;
                sheet.data.forEach(r => { r.push(''); });
                renderGrid();
                focusCell(row, col);
                persist();
                setStatus(dfLabel('desktop.excel.colAdded', 'Столбец добавлен'));
            } else if (cmd === 'clear') {
                if (!sheet.data[row]) sheet.data[row] = [];
                sheet.data[row][col] = '';
                persist();
                renderGrid();
                setStatus(`${cellRef(row, col)} ${dfLabel('desktop.excel.cleared', 'очищена')}`);
            } else if (cmd === 'sum') {
                const start = Math.max(0, row - 2);
                const range = `${cellRef(start, col)}:${cellRef(row, col)}`;
                if (formulaInput) formulaInput.value = `=SUM(${range})`;
                commitFormulaBar();
                renderGrid();
                setStatus(`=SUM(${range})`);
            }
        });

        renderGrid();
    }

    function renderFileWindow(fileId, container) {
        const file = getItem(fileId);
        if (!file || file.type !== 'file') {
            container.innerHTML = '<p class="hint-label">Файл не найден</p>';
            return;
        }
        if (file.fileKind === 'docx') renderDocEditor(container, file);
        else if (file.fileKind === 'xlsx') renderSheetEditor(container, file);
        else renderTxtEditor(container, file);
    }

    function createFolderGridItem(child, onOpen) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'folder-grid-item';
        btn.dataset.itemId = child.id;
        btn.innerHTML = `<span class="folder-grid-emoji">${itemEmoji(child)}</span><span class="folder-grid-label">${itemLabel(child)}</span>`;
        btn.onclick = () => onOpen(child.id);
        btn.addEventListener('contextmenu', e => {
            e.preventDefault();
            e.stopPropagation();
            if (typeof showFolderItemContextMenu !== 'function') return;
            showFolderItemContextMenu(e.clientX, e.clientY, child.id);
        });
        return btn;
    }

    function renderFolderWindow(folderId, container) {
        const folder = getItem(folderId);
        if (!folder || folder.type !== 'folder') {
            container.innerHTML = '<p class="hint-label">Папка не найдена</p>';
            return;
        }
        container.innerHTML = '';
        const win = document.createElement('div');
        win.className = 'folder-window';
        const toolbar = document.createElement('div');
        toolbar.className = 'folder-window-toolbar';
        toolbar.innerHTML = `<span class="folder-window-path">📁 ${folder.name}</span>`;
        const newBtn = document.createElement('button');
        newBtn.type = 'button';
        newBtn.className = 'btn btn-secondary btn-sm';
        newBtn.textContent = dfLabel('desktop.new', 'Создать') + ' ▾';
        newBtn.onclick = e => {
            e.stopPropagation();
            if (typeof showNewItemMenu !== 'function') return;
            showNewItemMenu(e.clientX, e.clientY, folderId, null);
        };
        toolbar.appendChild(newBtn);
        win.appendChild(toolbar);

        const grid = document.createElement('div');
        grid.className = 'folder-window-grid';
        const children = getFolderChildren(folderId);
        if (!children.length) {
            const empty = document.createElement('p');
            empty.className = 'folder-window-empty';
            empty.textContent = dfLabel('desktop.folder.empty', 'Папка пуста. ПКМ на рабочем столе или «Создать» — добавить файлы.');
            grid.appendChild(empty);
        } else {
            children.forEach(child => grid.appendChild(createFolderGridItem(child, id => openItem(id))));
        }
        win.appendChild(grid);

        grid.addEventListener('contextmenu', e => {
            if (e.target.closest('.folder-grid-item')) return;
            e.preventDefault();
            if (typeof showNewItemMenu === 'function') {
                showNewItemMenu(e.clientX, e.clientY, folderId, null);
            }
        });

        container.appendChild(win);
    }

    function rerenderFolderWindow(folderId) {
        if (!folderId) return;
        const winId = folderWindowId(folderId);
        if (typeof openWindows !== 'undefined' && openWindows.has(winId) && typeof renderAppInWindow === 'function') {
            renderAppInWindow(winId);
        }
        if (typeof renderDesktopIcons === 'function') renderDesktopIcons();
    }

    return {
        FILE_KINDS,
        loadState,
        saveState,
        ensureState,
        getItem,
        getRootItems,
        getFolderChildren,
        getLayoutForRender,
        syncAppLayout,
        bootstrapAppsIfNeeded,
        updateItemPosition,
        createFile,
        createFolder,
        moveItem,
        renameItem,
        deleteItem,
        itemLabel,
        itemEmoji,
        fileWindowId,
        folderWindowId,
        parseWindowId,
        getWindowMeta,
        openItem,
        renderFileWindow,
        renderFolderWindow,
        rerenderFolderWindow
    };
})();
