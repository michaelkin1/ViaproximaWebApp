(function () {
    'use strict';

    // ── STATE ─────────────────────────────────────────────
    const state = {
        adventures: [],
        activeAdventureId: null,
        activePanelScope: 'adventure',
        activeImageLinkEl: null,
        lastFocusedChapterId: null,
        lastFocusedEditor: null,
        panelOpen: false,
        savedRange: null,
    };

    // ── XSRF TOKEN ────────────────────────────────────────
    let xsrfToken = null;

    // ── AUTOSAVE TIMERS ───────────────────────────────────
    const autosaveTimers = {};

    // ── UTILS ─────────────────────────────────────────────
    function todayStr() {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }

    function getActiveAdventure() {
        return state.adventures.find(a => a.id === state.activeAdventureId) || null;
    }

    // Strip zero-width spaces used as cursor anchors after img-link insertion
    function stripZwsp(html) {
        return html ? html.replace(/​/g, '') : html;
    }

    // ── API HELPERS ───────────────────────────────────────
    async function fetchXsrfToken() {
        try {
            const resp = await fetch('/antiforgery/token');
            if (resp.ok) {
                const data = await resp.json();
                xsrfToken = data.token;
            }
        } catch (e) {
            console.error('Failed to fetch XSRF token', e);
        }
    }

    async function apiFetch(url, opts = {}) {
        const isGet = !opts.method || opts.method.toUpperCase() === 'GET';
        const headers = {};
        if (!isGet && xsrfToken) headers['X-XSRF-TOKEN'] = xsrfToken;
        if (!isGet && !(opts.body instanceof FormData)) headers['Content-Type'] = 'application/json';
        Object.assign(headers, opts.headers || {});
        const resp = await fetch(url, { ...opts, headers });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        return resp;
    }

    // ── ELEMENTS ──────────────────────────────────────────
    const adventureList        = document.getElementById('adventureList');
    const adventureTitle       = document.getElementById('adventureTitle');
    const adventureSession     = document.getElementById('adventureSession');
    const chaptersArea         = document.getElementById('chaptersArea');
    const emptyState           = document.getElementById('emptyState');
    const newChapterWrap       = document.getElementById('newChapterWrap');
    const newAdventureBtn      = document.getElementById('newAdventureBtn');
    const newAdventureInput    = document.getElementById('newAdventureInput');
    const newAdventureTitleInp = document.getElementById('newAdventureTitle');
    const createAdventureBtn   = document.getElementById('createAdventureBtn');
    const cancelAdventureBtn   = document.getElementById('cancelAdventureBtn');
    const newChapterBtn        = document.getElementById('newChapterBtn');
    const tbBold               = document.getElementById('tbBold');
    const tbItalic             = document.getElementById('tbItalic');
    const tbFontUp             = document.getElementById('tbFontUp');
    const tbFontDown           = document.getElementById('tbFontDown');
    const tbLinkImage          = document.getElementById('tbLinkImage');
    const imagePanel           = document.getElementById('imagePanel');
    const imageCards           = document.getElementById('imageCards');
    const closePanelBtn        = document.getElementById('closePanelBtn');
    const scopeAdventureBtn    = document.getElementById('scopeAdventure');
    const scopeChapterBtn      = document.getElementById('scopeChapter');
    const imgFileInput         = document.getElementById('imgFileInput');

    // ── ADVENTURE LIST ────────────────────────────────────
    function renderAdventureList() {
        adventureList.innerHTML = '';
        state.adventures.forEach(adv => {
            const li = document.createElement('li');
            li.className = 'vp-dagbok__adv-item' + (adv.id === state.activeAdventureId ? ' active' : '');
            li.dataset.id = adv.id;

            const nameEl = document.createElement('span');
            nameEl.className = 'vp-dagbok__adv-name';
            nameEl.textContent = adv.title;

            const tagEl = document.createElement('span');
            tagEl.className = 'vp-dagbok__adv-session-tag';
            tagEl.textContent = adv.session;

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'vp-dagbok__adv-delete';
            deleteBtn.textContent = '×';
            deleteBtn.title = 'Radera äventyr';
            deleteBtn.addEventListener('click', async e => {
                e.stopPropagation();
                await deleteAdventure(adv.id, adv.title);
            });

            li.appendChild(nameEl);
            li.appendChild(tagEl);
            li.appendChild(deleteBtn);
            li.addEventListener('click', () => selectAdventure(adv.id));
            adventureList.appendChild(li);
        });
    }

    async function selectAdventure(id) {
        if (state.activeAdventureId !== null && state.activeAdventureId !== id) {
            await flushPendingSaves();
        }
        state.activeAdventureId = id;
        state.lastFocusedChapterId = null;
        state.lastFocusedEditor = null;

        const adv = getActiveAdventure();
        if (!adv) return;

        adventureTitle.textContent = adv.title;
        adventureSession.textContent = adv.session;
        emptyState.hidden = true;
        newChapterWrap.hidden = false;

        try {
            const resp = await apiFetch(`/api/adventures/${id}/chapters`);
            adv.chapters = await resp.json();
        } catch (e) {
            console.error('Failed to load chapters', e);
            adv.chapters = [];
        }

        renderAdventureList();
        renderChapters();
        renderImagePanel();
    }

    async function createAdventure(title) {
        if (!title.trim()) return;
        try {
            const resp = await apiFetch('/api/adventures', {
                method: 'POST',
                body: JSON.stringify({ title: title.trim(), session: 'Session 1' }),
            });
            const adv = await resp.json();
            adv.chapters = [];
            state.adventures.push(adv);
            renderAdventureList();
            await selectAdventure(adv.id);
        } catch (e) {
            console.error('Failed to create adventure', e);
        }
    }

    async function deleteAdventure(id, title) {
        if (!confirm(`Vill du verkligen radera äventyret '${title}'? Detta går inte att ångra.`)) return;
        try {
            await apiFetch(`/api/adventures/${id}`, { method: 'DELETE' });
        } catch (e) {
            console.error('Failed to delete adventure', e);
            return;
        }
        state.adventures = state.adventures.filter(a => a.id !== id);
        if (state.activeAdventureId === id) {
            state.activeAdventureId = null;
            state.lastFocusedChapterId = null;
            state.lastFocusedEditor = null;
            state.activeImageLinkEl = null;
            adventureTitle.textContent = '—';
            adventureSession.textContent = '';
            emptyState.hidden = false;
            emptyState.textContent = state.adventures.length === 0
                ? 'Inga äventyr ännu — skapa ett i sidopanelen.'
                : 'Välj ett äventyr i sidopanelen.';
            newChapterWrap.hidden = true;
            Array.from(chaptersArea.querySelectorAll('.vp-dagbok__chapter')).forEach(el => el.remove());
            imageCards.innerHTML = '';
        }
        renderAdventureList();
    }

    // ── CHAPTER RENDERING ─────────────────────────────────
    function renderChapters() {
        Array.from(chaptersArea.querySelectorAll('.vp-dagbok__chapter')).forEach(el => el.remove());

        const adv = getActiveAdventure();
        if (!adv) return;

        adv.chapters.forEach((ch, i) => {
            const el = buildChapterEl(ch, i + 1);
            chaptersArea.appendChild(el);
            const body = el.querySelector('.vp-dagbok__chapter-body');
            if (ch.bodyHtml) body.innerHTML = ch.bodyHtml;
        });
    }

    function buildChapterEl(ch, n) {
        const el = document.createElement('div');
        el.className = 'vp-dagbok__chapter' + (ch.collapsed ? ' collapsed' : '');
        el.dataset.chapterId = ch.id;

        // Header
        const header = document.createElement('div');
        header.className = 'vp-dagbok__chapter-header';

        const chDeleteBtn = document.createElement('button');
        chDeleteBtn.className = 'vp-dagbok__chapter-delete';
        chDeleteBtn.textContent = '×';
        chDeleteBtn.title = 'Radera kapitel';
        chDeleteBtn.addEventListener('click', async e => {
            e.stopPropagation();
            await deleteChapter(ch, el);
        });

        const badge = document.createElement('span');
        badge.className = 'vp-dagbok__chapter-badge';
        badge.textContent = `Kap. ${n}`;

        const titleInput = document.createElement('input');
        titleInput.type = 'text';
        titleInput.className = 'vp-dagbok__chapter-title-input';
        titleInput.value = ch.title;
        titleInput.addEventListener('click', e => e.stopPropagation());

        const dateInput = document.createElement('input');
        dateInput.type = 'text';
        dateInput.className = 'vp-dagbok__chapter-date-input';
        dateInput.value = ch.date;
        dateInput.addEventListener('click', e => e.stopPropagation());

        const chevron = document.createElement('span');
        chevron.className = 'vp-dagbok__chapter-chevron';
        chevron.textContent = '▾';

        const savedIndicator = document.createElement('span');
        savedIndicator.className = 'vp-dagbok__chapter-saved';
        savedIndicator.textContent = 'Sparad ✓';
        savedIndicator.style.cssText = 'font-family:var(--font-display);font-size:8px;letter-spacing:0.08em;color:var(--vp-text-muted);opacity:0;transition:opacity 0.4s;flex-shrink:0;';

        header.appendChild(chDeleteBtn);
        header.appendChild(badge);
        header.appendChild(titleInput);
        header.appendChild(dateInput);
        header.appendChild(savedIndicator);
        header.appendChild(chevron);
        header.addEventListener('click', () => toggleChapter(ch, el));

        // Body wrap (for collapse animation)
        const bodyWrap = document.createElement('div');
        bodyWrap.className = 'vp-dagbok__chapter-body-wrap';

        const body = document.createElement('div');
        body.className = 'vp-dagbok__chapter-body';
        body.contentEditable = 'true';
        body.dataset.chapterId = ch.id;
        body.dataset.placeholder = 'Skriv ditt kapitel här…';

        body.addEventListener('focus', () => {
            state.lastFocusedEditor = body;
            state.lastFocusedChapterId = ch.id;
        });

        body.addEventListener('blur', () => {
            ch.bodyHtml = stripZwsp(body.innerHTML);
        });

        body.addEventListener('input', () => {
            ch.bodyHtml = stripZwsp(body.innerHTML);
            scheduleAutosave(ch, body);
        });

        body.addEventListener('keydown', e => {
            if (e.key !== ' ' && e.key !== 'Enter') return;

            const sel = window.getSelection();
            if (!sel || sel.rangeCount === 0) return;
            const anchor = sel.anchorNode;
            if (!anchor) return;

            const anchorEl = anchor.nodeType === Node.TEXT_NODE ? anchor.parentElement : anchor;
            let parentSpan = anchorEl?.closest?.('.img-link');

            // Boundary case: caret at offset 0 of a text node directly after an
            // .img-link span. Visually outside, but Chrome re-adopts typed
            // characters back into the span — treat as "inside" too.
            if (!parentSpan && anchor.nodeType === Node.TEXT_NODE && sel.anchorOffset === 0) {
                const prev = anchor.previousSibling;
                if (prev?.nodeType === Node.ELEMENT_NODE && prev.classList?.contains('img-link')) {
                    parentSpan = prev;
                }
            }
            if (!parentSpan) return;

            e.preventDefault();

            // Place the caret between two ZWSPs in a fresh (or reused) text
            // node after the span. Length >= 2 with caret in the middle keeps
            // the position unambiguously inside the anchor, away from any
            // boundary the browser could re-adopt into the span.
            let anchorText = parentSpan.nextSibling;
            const isZwspAnchor = anchorText
                && anchorText.nodeType === Node.TEXT_NODE
                && anchorText.data.length >= 2
                && anchorText.data.charCodeAt(0) === 0x200B
                && anchorText.data.charCodeAt(1) === 0x200B;
            if (!isZwspAnchor) {
                anchorText = document.createTextNode('​​');
                parentSpan.parentNode.insertBefore(anchorText, parentSpan.nextSibling);
            }

            const r = document.createRange();
            r.setStart(anchorText, 1);
            r.collapse(true);
            sel.removeAllRanges();
            sel.addRange(r);

            if (e.key === ' ') {
                anchorText.insertData(1, ' ');
                const r2 = document.createRange();
                r2.setStart(anchorText, 2);
                r2.collapse(true);
                sel.removeAllRanges();
                sel.addRange(r2);
            } else if (e.shiftKey) {
                document.execCommand('insertLineBreak');
            } else {
                document.execCommand('insertParagraph');
            }

            ch.bodyHtml = stripZwsp(body.innerHTML);
            scheduleAutosave(ch, body);
        });

        titleInput.addEventListener('input', () => {
            ch.title = titleInput.value;
            scheduleAutosave(ch, body);
        });

        dateInput.addEventListener('input', () => {
            ch.date = dateInput.value;
            scheduleAutosave(ch, body);
        });

        bodyWrap.appendChild(body);
        el.appendChild(header);
        el.appendChild(bodyWrap);

        return el;
    }

    function toggleChapter(ch, el) {
        ch.collapsed = !ch.collapsed;
        el.classList.toggle('collapsed', ch.collapsed);
        const body = el.querySelector('.vp-dagbok__chapter-body');
        clearTimeout(autosaveTimers[ch.id]);
        doAutosave(ch, body);
    }

    async function createChapter() {
        const adv = getActiveAdventure();
        if (!adv) return;
        try {
            const resp = await apiFetch(`/api/adventures/${adv.id}/chapters`, {
                method: 'POST',
                body: JSON.stringify({ title: 'Nytt kapitel', date: todayStr() }),
            });
            const ch = await resp.json();
            adv.chapters.push(ch);
            renderChapters();
            chaptersArea.scrollTop = chaptersArea.scrollHeight;
            const bodyEl = chaptersArea.querySelector(`.vp-dagbok__chapter-body[data-chapter-id="${ch.id}"]`);
            if (bodyEl) {
                const chapterEl = bodyEl.closest('.vp-dagbok__chapter');
                const titleInput = chapterEl && chapterEl.querySelector('.vp-dagbok__chapter-title-input');
                if (titleInput) { titleInput.select(); titleInput.focus(); }
            }
        } catch (e) {
            console.error('Failed to create chapter', e);
        }
    }

    async function deleteChapter(ch, el) {
        if (!confirm(`Vill du verkligen radera kapitlet '${ch.title}'? Detta går inte att ångra.`)) return;
        try {
            await apiFetch(`/api/chapters/${ch.id}`, { method: 'DELETE' });
        } catch (e) {
            console.error('Failed to delete chapter', e);
            return;
        }
        const adv = getActiveAdventure();
        if (adv) adv.chapters = adv.chapters.filter(c => c.id !== ch.id);
        el.remove();
        clearTimeout(autosaveTimers[ch.id]);
        delete autosaveTimers[ch.id];
        if (state.lastFocusedChapterId === ch.id) {
            state.lastFocusedChapterId = null;
            state.lastFocusedEditor = null;
        }
        if (state.activeImageLinkEl && !document.contains(state.activeImageLinkEl)) {
            state.activeImageLinkEl = null;
        }
        renderImagePanel();
    }

    // ── AUTOSAVE ──────────────────────────────────────────
    function scheduleAutosave(ch, editorEl) {
        clearTimeout(autosaveTimers[ch.id]);
        autosaveTimers[ch.id] = setTimeout(() => doAutosave(ch, editorEl), 10000);
    }

    async function doAutosave(ch, editorEl) {
        const chEl = chaptersArea.querySelector(`.vp-dagbok__chapter[data-chapter-id="${ch.id}"]`);
        if (chEl) {
            const titleInput = chEl.querySelector('.vp-dagbok__chapter-title-input');
            const dateInput = chEl.querySelector('.vp-dagbok__chapter-date-input');
            const bodyEl = chEl.querySelector('.vp-dagbok__chapter-body');
            if (titleInput) ch.title = titleInput.value;
            if (dateInput) ch.date = dateInput.value;
            if (bodyEl) ch.bodyHtml = stripZwsp(bodyEl.innerHTML);
            ch.collapsed = chEl.classList.contains('collapsed');
        } else if (editorEl && document.contains(editorEl)) {
            ch.bodyHtml = stripZwsp(editorEl.innerHTML);
        }
        console.log('[autosave] PUT /api/chapters/' + ch.id, { bodyHtml: ch.bodyHtml });
        try {
            await apiFetch(`/api/chapters/${ch.id}`, {
                method: 'PUT',
                body: JSON.stringify({
                    title: ch.title,
                    date: ch.date,
                    bodyHtml: ch.bodyHtml,
                    collapsed: ch.collapsed,
                }),
            });
            showSavedIndicator(ch.id);
        } catch (e) {
            console.error('Autosave failed', e);
        }
    }

    async function flushPendingSaves() {
        const promises = [];
        for (const id of Object.keys(autosaveTimers)) {
            clearTimeout(autosaveTimers[id]);
            delete autosaveTimers[id];
            const chId = parseInt(id, 10);
            let ch = null;
            for (const adv of state.adventures) {
                const found = (adv.chapters || []).find(c => c.id === chId);
                if (found) { ch = found; break; }
            }
            if (ch) {
                const editorEl = chaptersArea.querySelector(`.vp-dagbok__chapter-body[data-chapter-id="${chId}"]`);
                promises.push(doAutosave(ch, editorEl));
            }
        }
        await Promise.all(promises);
    }

    function showSavedIndicator(chapterId) {
        const chEl = chaptersArea.querySelector(`.vp-dagbok__chapter[data-chapter-id="${chapterId}"]`);
        if (!chEl) return;
        const indicator = chEl.querySelector('.vp-dagbok__chapter-saved');
        if (!indicator) return;
        indicator.style.opacity = '1';
        clearTimeout(indicator._fadeTimer);
        indicator._fadeTimer = setTimeout(() => { indicator.style.opacity = '0'; }, 2000);
    }

    // ── TOOLBAR ───────────────────────────────────────────
    function refocusEditor() {
        if (state.lastFocusedEditor) state.lastFocusedEditor.focus();
    }

    function applyBold() {
        refocusEditor();
        document.execCommand('bold', false, null);
    }

    function applyItalic() {
        refocusEditor();
        document.execCommand('italic', false, null);
    }

    function getCurrentFontSize() {
        const val = document.queryCommandValue('fontSize');
        const n = parseInt(val, 10);
        return isNaN(n) ? 3 : n;
    }

    function increaseFontSize() {
        refocusEditor();
        const next = Math.min(getCurrentFontSize() + 1, 7);
        document.execCommand('fontSize', false, String(next));
    }

    function decreaseFontSize() {
        refocusEditor();
        const next = Math.max(getCurrentFontSize() - 1, 1);
        document.execCommand('fontSize', false, String(next));
    }

    function updateToolbarState() {
        const sel = window.getSelection();
        const insideEditor = sel && sel.rangeCount > 0 &&
            state.lastFocusedEditor &&
            state.lastFocusedEditor.contains(sel.anchorNode);

        if (insideEditor) {
            tbBold.classList.toggle('active', document.queryCommandState('bold'));
            tbItalic.classList.toggle('active', document.queryCommandState('italic'));
        } else {
            tbBold.classList.remove('active');
            tbItalic.classList.remove('active');
        }
    }

    // ── IMAGE LINKING ─────────────────────────────────────
    function editorFromNode(node) {
        if (!node) return null;
        const el = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
        return el ? el.closest('.vp-dagbok__chapter-body') : null;
    }

    function handleLinkImage() {
        const sel = window.getSelection();
        if (!sel || sel.isCollapsed || sel.rangeCount === 0) return;
        const range = sel.getRangeAt(0);
        if (!editorFromNode(range.commonAncestorContainer)) return;
        state.savedRange = range.cloneRange();
        imgFileInput.click();
    }

    imgFileInput.addEventListener('change', async function () {
        const file = this.files[0];
        if (!file || !state.savedRange) { this.value = ''; return; }

        const range = state.savedRange;
        const editorEl = editorFromNode(range.commonAncestorContainer);
        if (!editorEl) { this.value = ''; state.savedRange = null; return; }

        const chId = parseInt(editorEl.dataset.chapterId, 10);
        const adv = getActiveAdventure();
        const ch = adv?.chapters.find(c => c.id === chId);
        if (!ch) { this.value = ''; state.savedRange = null; return; }

        const formData = new FormData();
        formData.append('file', file);

        let uploadResult;
        try {
            const resp = await apiFetch(`/api/chapters/${chId}/images`, {
                method: 'POST',
                body: formData,
            });
            uploadResult = await resp.json();
        } catch (e) {
            console.error('Image upload failed', e);
            alert('Kunde inte ladda upp bilden. Försök igen.');
            this.value = ''; state.savedRange = null; return;
        }

        // Restore selection and wrap in img-link span
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);

        const span = document.createElement('span');
        span.className = 'img-link';
        span.dataset.src = uploadResult.imagePath;
        span.dataset.filename = uploadResult.fileName;
        span.dataset.imageId = String(uploadResult.id);

        try {
            range.surroundContents(span);
        } catch (_) {
            const fragment = range.extractContents();
            span.appendChild(fragment);
            range.insertNode(span);
        }

        // Place caret between two ZWSPs in a text node after the span. A
        // length-1 anchor leaves the caret at a boundary that Chrome re-adopts
        // into the span on Space / Shift+Enter; placing it in the middle of a
        // 2-char anchor keeps it unambiguously outside. ZWSPs are stripped on
        // save by stripZwsp().
        const afterSpan = document.createTextNode('​​');
        span.parentNode.insertBefore(afterSpan, span.nextSibling);

        const cursorRange = document.createRange();
        cursorRange.setStart(afterSpan, 1);
        cursorRange.collapse(true);
        sel.removeAllRanges();
        sel.addRange(cursorRange);

        // Sync bodyHtml and immediately save
        ch.bodyHtml = stripZwsp(editorEl.innerHTML);
        state.lastFocusedChapterId = chId;
        clearTimeout(autosaveTimers[ch.id]);
        doAutosave(ch, editorEl);

        state.savedRange = null;
        this.value = '';
        renderImagePanel();
    });

    // ── IMG-LINK CLICK (DELEGATED) ────────────────────────
    chaptersArea.addEventListener('click', function (e) {
        const span = e.target.closest('.img-link');
        if (!span) return;

        if (state.activeImageLinkEl) state.activeImageLinkEl.classList.remove('highlighted');
        state.activeImageLinkEl = span;
        span.classList.add('highlighted');

        const bodyEl = span.closest('.vp-dagbok__chapter-body');
        if (bodyEl) state.lastFocusedChapterId = parseInt(bodyEl.dataset.chapterId, 10);

        openImagePanel();
        renderImagePanel();
    });

    // ── IMAGE PANEL ───────────────────────────────────────
    function openImagePanel() {
        imagePanel.hidden = false;
        state.panelOpen = true;
    }

    function closeImagePanel() {
        imagePanel.hidden = true;
        state.panelOpen = false;
    }

    function extractLinksFromHtml(html, chapterId) {
        if (!html) return [];
        const tmp = document.createElement('div');
        tmp.innerHTML = html;
        return Array.from(tmp.querySelectorAll('.img-link')).map(el => ({
            src: el.dataset.src || '',
            filename: el.dataset.filename || '',
            word: el.textContent,
            chapterId: chapterId,
            imageId: el.dataset.imageId ? parseInt(el.dataset.imageId, 10) : null,
        }));
    }

    function renderImagePanel() {
        imageCards.innerHTML = '';
        const adv = getActiveAdventure();
        if (!adv) return;

        if (state.activePanelScope === 'adventure') {
            adv.chapters.forEach(ch => {
                const links = extractLinksFromHtml(ch.bodyHtml, ch.id);
                if (links.length === 0) return;

                const group = document.createElement('div');
                group.className = 'vp-dagbok__chapter-group';

                const label = document.createElement('div');
                label.className = 'vp-dagbok__chapter-group-label';
                label.textContent = ch.title;
                group.appendChild(label);

                links.forEach(link => group.appendChild(buildImageCard(link)));
                imageCards.appendChild(group);
            });
        } else {
            const chId = state.lastFocusedChapterId;
            const ch = adv.chapters.find(c => c.id === chId);
            if (ch) {
                extractLinksFromHtml(ch.bodyHtml, chId).forEach(link => {
                    imageCards.appendChild(buildImageCard(link));
                });
            }
        }

        scrollPanelToActiveCard();
    }

    function buildImageCard(link) {
        const card = document.createElement('div');
        card.className = 'vp-dagbok__image-card';
        card.dataset.src = link.src;
        card.dataset.chapterId = link.chapterId || '';
        if (link.imageId) card.dataset.imageId = String(link.imageId);

        const activeEl = state.activeImageLinkEl;
        const isActive = activeEl && (
            link.imageId
                ? activeEl.dataset.imageId === String(link.imageId)
                : activeEl.dataset.src === link.src
        );
        if (isActive) card.classList.add('active');

        const unlinkBtn = document.createElement('button');
        unlinkBtn.className = 'vp-dagbok__image-card-unlink';
        unlinkBtn.textContent = '×';
        unlinkBtn.title = 'Ta bort bildlänk';
        unlinkBtn.addEventListener('click', e => {
            e.stopPropagation();
            if (link.imageId) unlinkImage(link.imageId, link.chapterId);
        });

        const img = document.createElement('img');
        img.src = link.src;
        img.alt = link.word;
        img.loading = 'lazy';

        const caption = document.createElement('div');
        caption.className = 'vp-dagbok__image-card-caption';

        const term = document.createElement('span');
        term.className = 'vp-dagbok__image-card-term';
        term.textContent = 'TERM';

        const wordEl = document.createElement('span');
        wordEl.className = 'vp-dagbok__image-card-word';
        wordEl.textContent = link.word;

        caption.appendChild(term);
        caption.appendChild(wordEl);
        card.appendChild(unlinkBtn);
        card.appendChild(img);
        card.appendChild(caption);
        return card;
    }

    function scrollPanelToActiveCard() {
        const active = imageCards.querySelector('.vp-dagbok__image-card.active');
        if (!active) return;
        imageCards.scrollTop = Math.max(0, active.offsetTop - 16);
    }

    async function unlinkImage(imageId, chapterId) {
        const adv = getActiveAdventure();
        if (!adv) return;
        const ch = adv.chapters.find(c => c.id === chapterId);
        if (!ch) return;

        try {
            await apiFetch(`/api/images/${imageId}`, { method: 'DELETE' });
        } catch (e) {
            console.error('Unlink failed', e);
            return;
        }

        // Remove span from bodyHtml
        const tmp = document.createElement('div');
        tmp.innerHTML = ch.bodyHtml;
        const span = tmp.querySelector(`.img-link[data-image-id="${imageId}"]`);
        if (span) span.replaceWith(document.createTextNode(span.textContent));
        ch.bodyHtml = stripZwsp(tmp.innerHTML);

        // Update live editor
        const editorEl = chaptersArea.querySelector(`.vp-dagbok__chapter-body[data-chapter-id="${chapterId}"]`);
        if (editorEl) editorEl.innerHTML = ch.bodyHtml;

        if (state.activeImageLinkEl &&
            state.activeImageLinkEl.dataset.imageId === String(imageId)) {
            state.activeImageLinkEl = null;
        }

        // Immediately save the chapter after unlink
        doAutosave(ch, editorEl);
        renderImagePanel();
    }

    // ── NEW ADVENTURE UI ──────────────────────────────────
    newAdventureBtn.addEventListener('click', () => {
        newAdventureBtn.hidden = true;
        newAdventureInput.hidden = false;
        newAdventureTitleInp.value = '';
        newAdventureTitleInp.focus();
    });

    async function confirmCreateAdventure() {
        await createAdventure(newAdventureTitleInp.value);
        resetNewAdventureUI();
    }

    function resetNewAdventureUI() {
        newAdventureBtn.hidden = false;
        newAdventureInput.hidden = true;
        newAdventureTitleInp.value = '';
    }

    createAdventureBtn.addEventListener('click', confirmCreateAdventure);
    cancelAdventureBtn.addEventListener('click', resetNewAdventureUI);

    newAdventureTitleInp.addEventListener('keydown', async e => {
        if (e.key === 'Enter') await confirmCreateAdventure();
        if (e.key === 'Escape') resetNewAdventureUI();
    });

    // ── TOOLBAR EVENTS ────────────────────────────────────
    tbBold.addEventListener('mousedown', e => { e.preventDefault(); applyBold(); });
    tbItalic.addEventListener('mousedown', e => { e.preventDefault(); applyItalic(); });
    tbFontUp.addEventListener('mousedown', e => { e.preventDefault(); increaseFontSize(); });
    tbFontDown.addEventListener('mousedown', e => { e.preventDefault(); decreaseFontSize(); });
    tbLinkImage.addEventListener('click', handleLinkImage);

    document.addEventListener('selectionchange', updateToolbarState);

    // ── NEW CHAPTER ───────────────────────────────────────
    newChapterBtn.addEventListener('click', () => createChapter());

    // ── IMAGE PANEL CONTROLS ──────────────────────────────
    closePanelBtn.addEventListener('click', closeImagePanel);

    scopeAdventureBtn.addEventListener('click', () => {
        state.activePanelScope = 'adventure';
        scopeAdventureBtn.classList.add('active');
        scopeChapterBtn.classList.remove('active');
        renderImagePanel();
    });

    scopeChapterBtn.addEventListener('click', () => {
        state.activePanelScope = 'chapter';
        scopeChapterBtn.classList.add('active');
        scopeAdventureBtn.classList.remove('active');
        renderImagePanel();
    });

    // ── INIT ──────────────────────────────────────────────
    async function loadAdventures() {
        try {
            const resp = await apiFetch('/api/adventures');
            const adventures = await resp.json();
            adventures.forEach(a => { a.chapters = []; });
            state.adventures = adventures;
        } catch (e) {
            console.error('Failed to load adventures', e);
            state.adventures = [];
        }

        renderAdventureList();

        if (state.adventures.length === 0) {
            emptyState.hidden = false;
            emptyState.textContent = 'Inga äventyr ännu — skapa ett i sidopanelen.';
        } else {
            await selectAdventure(state.adventures[0].id);
        }
    }

    async function init() {
        await fetchXsrfToken();
        await loadAdventures();
    }

    init();

})();
