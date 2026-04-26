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

    // ── UTILS ─────────────────────────────────────────────
    function uid() {
        return Date.now().toString(36) + Math.random().toString(36).slice(2);
    }

    function todayStr() {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }

    function escapeHtml(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function getActiveAdventure() {
        return state.adventures.find(a => a.id === state.activeAdventureId) || null;
    }

    // ── SEED DATA ─────────────────────────────────────────
    function seedData() {
        state.adventures = [
            {
                id: 'adv1',
                title: 'Askens Dal',
                session: 'Session 1–4',
                chapters: [
                    {
                        id: 'ch1',
                        title: 'Ankomsten till byn',
                        date: '2026-03-12',
                        body_html: '<p>Sällskapet anlände till <strong>Grenholm</strong> vid skymningens fall. Byborna stirrade misstänksamt, men krögaren <em>Halvdan den Röde</em> välkomnade dem med ett skummigt ölkrus och ett varnande ord om skogen i norr.</p><p>Natten var orolig. Någon knackade på luckan tre gånger – sedan tystnad.</p>',
                        collapsed: false,
                    },
                    {
                        id: 'ch2',
                        title: 'Skogen talar',
                        date: '2026-03-19',
                        body_html: '<p>Djupt in bland <strong>Silverbjörkarna</strong> fann de runstenen som ingen vågat röra på generationer. Inskriptionen löd: <em>"Den som vaknar elden, bär askan."</em></p>',
                        collapsed: false,
                    },
                ],
            },
            {
                id: 'adv2',
                title: 'Handelsskrånets Hemlighet',
                session: 'Session 5–6',
                chapters: [
                    {
                        id: 'ch3',
                        title: 'Mötet i källaren',
                        date: '2026-04-02',
                        body_html: '<p>Skrånmästare <strong>Aldric Vann</strong> hävdade sin oskuld med en övertygelse som nästan var trovärdig. Men handen skakade när han signerade dokumentet.</p>',
                        collapsed: false,
                    },
                    {
                        id: 'ch4',
                        title: 'Falska räkenskaper',
                        date: '2026-04-09',
                        body_html: '<p>Tre uppsättningar av räkenskapsboken — en för skrånet, en för stadens fogde, och en för <em>den tredje köparen</em> vars namn aldrig nämns högt.</p>',
                        collapsed: true,
                    },
                ],
            },
        ];
    }

    // ── ELEMENTS ──────────────────────────────────────────
    const adventureList         = document.getElementById('adventureList');
    const adventureTitle        = document.getElementById('adventureTitle');
    const adventureSession      = document.getElementById('adventureSession');
    const chaptersArea          = document.getElementById('chaptersArea');
    const emptyState            = document.getElementById('emptyState');
    const newChapterWrap        = document.getElementById('newChapterWrap');
    const newAdventureBtn       = document.getElementById('newAdventureBtn');
    const newAdventureInput     = document.getElementById('newAdventureInput');
    const newAdventureTitleInp  = document.getElementById('newAdventureTitle');
    const createAdventureBtn    = document.getElementById('createAdventureBtn');
    const cancelAdventureBtn    = document.getElementById('cancelAdventureBtn');
    const newChapterBtn         = document.getElementById('newChapterBtn');
    const tbBold                = document.getElementById('tbBold');
    const tbItalic              = document.getElementById('tbItalic');
    const tbFontUp              = document.getElementById('tbFontUp');
    const tbFontDown            = document.getElementById('tbFontDown');
    const tbLinkImage           = document.getElementById('tbLinkImage');
    const imagePanel            = document.getElementById('imagePanel');
    const imageCards            = document.getElementById('imageCards');
    const closePanelBtn         = document.getElementById('closePanelBtn');
    const scopeAdventureBtn     = document.getElementById('scopeAdventure');
    const scopeChapterBtn       = document.getElementById('scopeChapter');
    const imgFileInput          = document.getElementById('imgFileInput');

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
            deleteBtn.addEventListener('click', e => {
                e.stopPropagation();
                deleteAdventure(adv.id, adv.title);
            });

            li.appendChild(nameEl);
            li.appendChild(tagEl);
            li.appendChild(deleteBtn);
            li.addEventListener('click', () => selectAdventure(adv.id));
            adventureList.appendChild(li);
        });
    }

    function selectAdventure(id) {
        state.activeAdventureId = id;
        state.lastFocusedChapterId = null;
        state.lastFocusedEditor = null;

        const adv = getActiveAdventure();
        if (!adv) return;

        adventureTitle.textContent = adv.title;
        adventureSession.textContent = adv.session;
        emptyState.hidden = true;
        newChapterWrap.hidden = false;

        renderAdventureList();
        renderChapters();
        renderImagePanel();
    }

    function createAdventure(title) {
        if (!title.trim()) return;
        const adv = {
            id: uid(),
            title: title.trim(),
            session: 'Session 1',
            chapters: [],
        };
        state.adventures.push(adv);
        renderAdventureList();
        selectAdventure(adv.id);
    }

    function deleteAdventure(id, title) {
        if (!confirm(`Vill du verkligen radera äventyret '${title}'? Detta går inte att ångra.`)) return;
        state.adventures = state.adventures.filter(a => a.id !== id);
        if (state.activeAdventureId === id) {
            state.activeAdventureId = null;
            state.lastFocusedChapterId = null;
            state.lastFocusedEditor = null;
            state.activeImageLinkEl = null;
            adventureTitle.textContent = '—';
            adventureSession.textContent = '';
            emptyState.hidden = false;
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
            if (ch.body_html) body.innerHTML = ch.body_html;
        });
    }

    function buildChapterEl(ch, n) {
        const el = document.createElement('div');
        el.className = 'vp-dagbok__chapter' + (ch.collapsed ? ' collapsed' : '');
        el.dataset.chapterId = ch.id;

        // Header
        const header = document.createElement('div');
        header.className = 'vp-dagbok__chapter-header';

        const badge = document.createElement('span');
        badge.className = 'vp-dagbok__chapter-badge';
        badge.textContent = `Kap. ${n}`;

        const titleInput = document.createElement('input');
        titleInput.type = 'text';
        titleInput.className = 'vp-dagbok__chapter-title-input';
        titleInput.value = ch.title;
        titleInput.addEventListener('click', e => e.stopPropagation());
        titleInput.addEventListener('change', () => { ch.title = titleInput.value; });

        const dateInput = document.createElement('input');
        dateInput.type = 'text';
        dateInput.className = 'vp-dagbok__chapter-date-input';
        dateInput.value = ch.date;
        dateInput.addEventListener('click', e => e.stopPropagation());
        dateInput.addEventListener('change', () => { ch.date = dateInput.value; });

        const chevron = document.createElement('span');
        chevron.className = 'vp-dagbok__chapter-chevron';
        chevron.textContent = '▾';

        const chDeleteBtn = document.createElement('button');
        chDeleteBtn.className = 'vp-dagbok__chapter-delete';
        chDeleteBtn.textContent = '×';
        chDeleteBtn.title = 'Radera kapitel';
        chDeleteBtn.addEventListener('click', e => {
            e.stopPropagation();
            deleteChapter(ch, el);
        });

        header.appendChild(chDeleteBtn);
        header.appendChild(badge);
        header.appendChild(titleInput);
        header.appendChild(dateInput);
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
            ch.body_html = body.innerHTML;
        });

        bodyWrap.appendChild(body);
        el.appendChild(header);
        el.appendChild(bodyWrap);

        return el;
    }

    function toggleChapter(ch, el) {
        ch.collapsed = !ch.collapsed;
        el.classList.toggle('collapsed', ch.collapsed);
    }

    function createChapter() {
        const adv = getActiveAdventure();
        if (!adv) return;
        const ch = {
            id: uid(),
            title: 'Nytt kapitel',
            date: todayStr(),
            body_html: '',
            collapsed: false,
        };
        adv.chapters.push(ch);
        renderChapters();
        // Scroll to and focus new chapter
        chaptersArea.scrollTop = chaptersArea.scrollHeight;
        const newEl = chaptersArea.querySelector(`[data-chapter-id="${ch.id}"]`);
        if (newEl) {
            const chapterEl = newEl.closest('.vp-dagbok__chapter');
            const titleInput = chapterEl && chapterEl.querySelector('.vp-dagbok__chapter-title-input');
            if (titleInput) {
                titleInput.select();
                titleInput.focus();
            }
        }
    }

    function deleteChapter(ch, el) {
        if (!confirm(`Vill du verkligen radera kapitlet '${ch.title}'? Detta går inte att ångra.`)) return;
        const adv = getActiveAdventure();
        if (!adv) return;
        adv.chapters = adv.chapters.filter(c => c.id !== ch.id);
        el.remove();
        if (state.lastFocusedChapterId === ch.id) {
            state.lastFocusedChapterId = null;
            state.lastFocusedEditor = null;
        }
        if (state.activeImageLinkEl && !document.contains(state.activeImageLinkEl)) {
            state.activeImageLinkEl = null;
        }
        renderImagePanel();
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

    imgFileInput.addEventListener('change', function () {
        const file = this.files[0];
        if (!file || !state.savedRange) {
            this.value = '';
            return;
        }

        const objectUrl = URL.createObjectURL(file);
        const filename = file.name;
        const range = state.savedRange;
        const editorEl = editorFromNode(range.commonAncestorContainer);

        // Restore selection so execCommand-based ops still work if needed
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);

        // Wrap the selected range in an img-link span
        const span = document.createElement('span');
        span.className = 'img-link';
        span.dataset.src = objectUrl;
        span.dataset.filename = filename;

        try {
            range.surroundContents(span);
        } catch (_) {
            // Cross-element selection: extract, wrap, re-insert
            const fragment = range.extractContents();
            span.appendChild(fragment);
            range.insertNode(span);
        }

        // Sync body_html
        if (editorEl) {
            const chId = editorEl.dataset.chapterId;
            const adv = getActiveAdventure();
            if (adv) {
                const ch = adv.chapters.find(c => c.id === chId);
                if (ch) ch.body_html = editorEl.innerHTML;
            }
            state.lastFocusedChapterId = chId;
        }

        sel.removeAllRanges();
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
        if (bodyEl) state.lastFocusedChapterId = bodyEl.dataset.chapterId;

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
            chapterId: chapterId || null,
        }));
    }

    function renderImagePanel() {
        imageCards.innerHTML = '';
        const adv = getActiveAdventure();
        if (!adv) return;

        if (state.activePanelScope === 'adventure') {
            adv.chapters.forEach(ch => {
                const links = extractLinksFromHtml(ch.body_html, ch.id);
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
                extractLinksFromHtml(ch.body_html, chId).forEach(link => {
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

        if (state.activeImageLinkEl && state.activeImageLinkEl.dataset.src === link.src) {
            card.classList.add('active');
        }

        const unlinkBtn = document.createElement('button');
        unlinkBtn.className = 'vp-dagbok__image-card-unlink';
        unlinkBtn.textContent = '×';
        unlinkBtn.title = 'Ta bort bildlänk';
        unlinkBtn.addEventListener('click', e => {
            e.stopPropagation();
            unlinkImage(link.src, link.chapterId);
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
        // Use offsetTop arithmetic instead of scrollIntoView
        const cardTop = active.offsetTop;
        imageCards.scrollTop = Math.max(0, cardTop - 16);
    }

    function unlinkImage(src, chapterId) {
        const adv = getActiveAdventure();
        if (!adv) return;
        const ch = adv.chapters.find(c => c.id === chapterId);
        if (!ch) return;

        // Parse body_html, replace the matching span with plain text
        const tmp = document.createElement('div');
        tmp.innerHTML = ch.body_html;
        const span = Array.from(tmp.querySelectorAll('.img-link')).find(el => el.dataset.src === src);
        if (span) span.replaceWith(document.createTextNode(span.textContent));
        ch.body_html = tmp.innerHTML;

        // Update the live editor if this chapter is currently rendered
        const editorEl = chaptersArea.querySelector(`.vp-dagbok__chapter-body[data-chapter-id="${chapterId}"]`);
        if (editorEl) editorEl.innerHTML = ch.body_html;

        // Clear active image link ref if it matched
        if (state.activeImageLinkEl && state.activeImageLinkEl.dataset.src === src) {
            state.activeImageLinkEl = null;
        }
        renderImagePanel();
    }

    // ── NEW ADVENTURE UI ──────────────────────────────────
    newAdventureBtn.addEventListener('click', () => {
        newAdventureBtn.hidden = true;
        newAdventureInput.hidden = false;
        newAdventureTitleInp.value = '';
        newAdventureTitleInp.focus();
    });

    function confirmCreateAdventure() {
        createAdventure(newAdventureTitleInp.value);
        resetNewAdventureUI();
    }

    function resetNewAdventureUI() {
        newAdventureBtn.hidden = false;
        newAdventureInput.hidden = true;
        newAdventureTitleInp.value = '';
    }

    createAdventureBtn.addEventListener('click', confirmCreateAdventure);
    cancelAdventureBtn.addEventListener('click', resetNewAdventureUI);

    newAdventureTitleInp.addEventListener('keydown', e => {
        if (e.key === 'Enter') confirmCreateAdventure();
        if (e.key === 'Escape') resetNewAdventureUI();
    });

    // ── TOOLBAR EVENTS ────────────────────────────────────
    // mousedown + preventDefault so editor doesn't lose focus on button click
    tbBold.addEventListener('mousedown', e => { e.preventDefault(); applyBold(); });
    tbItalic.addEventListener('mousedown', e => { e.preventDefault(); applyItalic(); });
    tbFontUp.addEventListener('mousedown', e => { e.preventDefault(); increaseFontSize(); });
    tbFontDown.addEventListener('mousedown', e => { e.preventDefault(); decreaseFontSize(); });
    tbLinkImage.addEventListener('click', handleLinkImage);

    document.addEventListener('selectionchange', updateToolbarState);

    // ── NEW CHAPTER ───────────────────────────────────────
    newChapterBtn.addEventListener('click', createChapter);

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
    seedData();
    renderAdventureList();
    if (state.adventures.length > 0) selectAdventure(state.adventures[0].id);

})();
