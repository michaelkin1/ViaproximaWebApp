// karaktarer.page.js — tab manager + group management for merged Karaktärer page
(() => {
    const tabBar          = document.getElementById('charTabBar');
    const tabsContainer   = document.getElementById('charTabsContainer');
    const tabBtnList      = document.getElementById('tabBtnList');
    const newCharBtn      = document.getElementById('newCharBtn');
    const newCharBtnList  = document.getElementById('newCharBtnList');
    const panelList       = document.getElementById('panel-list');
    const panelSheet      = document.getElementById('panel-sheet');

    if (!tabBar || !panelList || !panelSheet) return;

    // openTabs: key → { id (null for new), name, race, fieldState (null = not yet cached), loaded }
    const openTabs = {};
    let activeTabKey = 'list';

    // ---- groups state ----
    let groups = (window._initialGroups || []).slice();

    // ---- storage ----
    function saveToStorage() {
        const ids = Object.values(openTabs)
            .filter(t => t.id)
            .map(t => ({ id: t.id, name: t.name, race: t.race }));
        try { sessionStorage.setItem('vp-open-chars', JSON.stringify(ids)); } catch {}
    }

    // ---- tab DOM ----
    function createTabEl(key, label) {
        const btn = document.createElement('button');
        btn.className = 'char-tab';
        btn.dataset.key = key;

        const nameSpan = document.createElement('span');
        nameSpan.textContent = label;
        nameSpan.className = 'char-tab__label';

        const closeBtn = document.createElement('button');
        closeBtn.type = 'button';
        closeBtn.className = 'char-tab__close';
        closeBtn.textContent = '×';
        closeBtn.title = 'Stäng';
        closeBtn.addEventListener('click', (e) => { e.stopPropagation(); closeTab(key); });

        btn.append(nameSpan, closeBtn);
        btn.addEventListener('click', () => switchToTab(key));
        tabsContainer.appendChild(btn);
        return btn;
    }

    function setActiveTabStyle(key) {
        tabBtnList.classList.toggle('char-tab--active', key === 'list');
        tabsContainer.querySelectorAll('.char-tab').forEach(el => {
            el.classList.toggle('char-tab--active', el.dataset.key === key);
        });
    }

    function updateTabLabel(key, label) {
        const el = tabsContainer.querySelector(`[data-key="${key}"] .char-tab__label`);
        if (el) el.textContent = label;
    }

    // ---- switching ----
    async function switchToTab(key) {
        // Save current sheet state before leaving
        if (activeTabKey !== 'list' && VP.sheet?.getFieldState) {
            const tab = openTabs[activeTabKey];
            if (tab) tab.fieldState = VP.sheet.getFieldState();
        }

        activeTabKey = key;
        setActiveTabStyle(key);

        if (key === 'list') {
            panelSheet.style.display = 'none';
            panelList.style.display = '';
            return;
        }

        panelList.style.display = 'none';
        panelSheet.style.display = '';

        const tab = openTabs[key];
        if (!tab) return;

        if (!tab.loaded) {
            tab.loaded = true;
            if (tab.id) {
                await VP.sheet.load(tab.id);
                await VP.sheet.skills?.reload(tab.id);
                if (VP.pets?.ctrl) { VP.pets.ctrl.setCharacterId(tab.id); await VP.pets.ctrl.loadPets(); }
            } else {
                VP.sheet.clear();
                if (VP.sheet.skills?.reload) await VP.sheet.skills.reload(null);
            }
        } else if (tab.fieldState) {
            if (!tab.id) VP.sheet.clear();
            await VP.sheet.setFieldState(tab.fieldState);
            if (tab.id) {
                await VP.sheet.skills?.reload(tab.id);
                if (VP.pets?.ctrl) { VP.pets.ctrl.setCharacterId(tab.id); await VP.pets.ctrl.loadPets(); }
            }
        }

        // Sync URL
        const url = new URL(window.location.href);
        if (tab.id) { url.searchParams.set('id', tab.id); }
        else { url.searchParams.delete('id'); }
        window.history.replaceState({}, '', url.toString());
    }

    // ---- open / close ----
    function openCharacter(id, name, race) {
        const key = `char-${id}`;
        if (openTabs[key]) { switchToTab(key); return; }

        openTabs[key] = { id: String(id), name, race, fieldState: null, loaded: false };
        createTabEl(key, name || `#${id}`);
        saveToStorage();
        switchToTab(key);
    }

    function openNewCharacter() {
        if (openTabs['new']) { switchToTab('new'); return; }
        openTabs['new'] = { id: null, name: 'Ny karaktär', race: '', fieldState: null, loaded: false };
        createTabEl('new', 'Ny karaktär');
        switchToTab('new');
    }

    function closeTab(key) {
        const tab = openTabs[key];
        if (!tab) return;
        delete openTabs[key];

        const el = tabsContainer.querySelector(`[data-key="${key}"]`);
        if (el) el.remove();
        saveToStorage();

        if (activeTabKey === key) {
            // Fall back to adjacent tab or list
            const remaining = Object.keys(openTabs);
            if (remaining.length) switchToTab(remaining[remaining.length - 1]);
            else switchToTab('list');
        }
    }

    // ---- group management ----

    function refreshAllDropdowns() {
        panelList.querySelectorAll('.kl-group-select').forEach(sel => {
            const row = sel.closest('.kl-row');
            const currentGroupId = row ? row.dataset.groupId : '';
            sel.innerHTML = '<option value="">Main</option>';
            groups.forEach(g => {
                const opt = document.createElement('option');
                opt.value = String(g.id);
                opt.textContent = g.name;
                if (String(g.id) === currentGroupId) opt.selected = true;
                sel.appendChild(opt);
            });
        });
    }

    function moveRowToSection(row, groupId) {
        const sectionId = groupId ? `section-${groupId}` : 'section-main';
        const section = document.getElementById(sectionId);
        if (!section) return;
        row.dataset.groupId = groupId ? String(groupId) : '';
        section.appendChild(row);
    }

    function wireGroupSelect(sel) {
        sel.addEventListener('change', async () => {
            const row = sel.closest('.kl-row');
            if (!row) return;
            const charId = row.dataset.charId;
            const groupId = sel.value ? parseInt(sel.value, 10) : null;
            const prevGroupId = row.dataset.groupId;
            try {
                await VP.shared.requestJson(`/api/characters/${charId}/group`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ groupId }),
                });
                moveRowToSection(row, groupId);
            } catch (err) {
                console.error('Failed to set character group', err);
                sel.value = prevGroupId || '';
            }
        });
    }

    function wireGroupDeleteBtn(btn) {
        btn.addEventListener('click', async () => {
            const groupId = parseInt(btn.dataset.groupId, 10);
            const groupName = btn.dataset.groupName;
            if (!confirm(`Ta bort grupperingen '${groupName}'? Karaktärerna flyttas till Main.`)) return;
            try {
                await VP.shared.requestJson(`/api/groups/${groupId}`, { method: 'DELETE' });
                removeGroupSection(groupId);
            } catch (err) {
                console.error('Failed to delete group', err);
            }
        });
    }

    function addGroupSection(group) {
        const section = document.createElement('div');
        section.className = 'kl-section';
        section.id = `section-${group.id}`;
        section.dataset.sectionGroupId = String(group.id);

        const banner = document.createElement('div');
        banner.className = 'kl-section-banner';

        const nameSpan = document.createElement('span');
        nameSpan.textContent = group.name;

        const deleteBtn = document.createElement('button');
        deleteBtn.type = 'button';
        deleteBtn.className = 'kl-group-delete-btn';
        deleteBtn.dataset.groupId = String(group.id);
        deleteBtn.dataset.groupName = group.name;
        deleteBtn.textContent = '×';
        wireGroupDeleteBtn(deleteBtn);

        banner.append(nameSpan, deleteBtn);
        section.appendChild(banner);

        const charSections = document.getElementById('charSections');
        charSections.appendChild(section);

        groups.push(group);
        refreshAllDropdowns();
    }

    function removeGroupSection(groupId) {
        const section = document.getElementById(`section-${groupId}`);
        const mainSection = document.getElementById('section-main');
        if (section && mainSection) {
            section.querySelectorAll('.kl-row').forEach(row => {
                const sel = row.querySelector('.kl-group-select');
                if (sel) sel.value = '';
                row.dataset.groupId = '';
                mainSection.appendChild(row);
            });
            section.remove();
        }
        groups = groups.filter(g => g.id !== groupId);
        refreshAllDropdowns();
    }

    // ---- init ----
    function init() {
        // Wire list-row clicks
        panelList.querySelectorAll('.kl-row').forEach(row => {
            row.addEventListener('click', () => {
                const id   = row.dataset.charId;
                const name = row.dataset.charName;
                const race = row.dataset.charRace;
                if (id) openCharacter(id, name, race);
            });
        });

        // Wire group selects
        panelList.querySelectorAll('.kl-group-select').forEach(wireGroupSelect);

        // Wire group delete buttons
        panelList.querySelectorAll('.kl-group-delete-btn').forEach(wireGroupDeleteBtn);

        // New group button
        const newGroupBtn = document.getElementById('newGroupBtn');
        if (newGroupBtn) {
            newGroupBtn.addEventListener('click', async () => {
                const name = prompt('Gruppens namn:');
                if (!name?.trim()) return;
                try {
                    const data = await VP.shared.requestJson('/api/groups', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ name: name.trim(), sortOrder: groups.length }),
                    });
                    addGroupSection({ id: data.id, name: data.name, sortOrder: data.sortOrder });
                } catch (err) {
                    console.error('Failed to create group', err);
                }
            });
        }

        // New char buttons
        newCharBtn.addEventListener('click', openNewCharacter);
        if (newCharBtnList) newCharBtnList.addEventListener('click', openNewCharacter);

        // List tab button
        tabBtnList.addEventListener('click', () => switchToTab('list'));

        // Restore from sessionStorage
        let restored = [];
        try { restored = JSON.parse(sessionStorage.getItem('vp-open-chars') || '[]'); } catch {}
        for (const { id, name, race } of restored) {
            const key = `char-${id}`;
            openTabs[key] = { id: String(id), name, race, fieldState: null, loaded: false };
            createTabEl(key, name || `#${id}`);
        }

        // Check URL ?id param
        const urlId = new URL(window.location.href).searchParams.get('id');
        if (urlId) {
            const key = `char-${urlId}`;
            if (!openTabs[key]) {
                const row = panelList.querySelector(`.kl-row[data-char-id="${urlId}"]`);
                const name = row?.dataset.charName || `#${urlId}`;
                const race = row?.dataset.charRace || '';
                openTabs[key] = { id: String(urlId), name, race, fieldState: null, loaded: false };
                createTabEl(key, name);
                saveToStorage();
            }
            switchToTab(key);
        }
    }

    // Listen for new character save → update tab label + key
    document.addEventListener('vp:characterSaved', (e) => {
        const newId = String(e.detail?.id);
        if (!newId || !openTabs['new']) return;

        const name = document.getElementById('nameInput')?.value || `#${newId}`;
        const race = document.getElementById('raceInput')?.value || '';
        const newKey = `char-${newId}`;

        // Rename 'new' tab → proper key
        openTabs[newKey] = { ...openTabs['new'], id: newId, name, race };
        delete openTabs['new'];

        const el = tabsContainer.querySelector('[data-key="new"]');
        if (el) { el.dataset.key = newKey; }
        updateTabLabel(newKey, name);

        if (activeTabKey === 'new') activeTabKey = newKey;
        setActiveTabStyle(activeTabKey);
        saveToStorage();
    });

    init();
})();
