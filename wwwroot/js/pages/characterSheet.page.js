// pages/characterSheet.page.js
(() => {
    function el(id) { return document.getElementById(id); }

    // DOM refs
    const nameInput = el("nameInput");
    const raceInput = el("raceInput");
    const xpInput = el("xpInput");
    const strengthInput = el("strengthInput");
    const barformagaInput = el("barformagaInput");
    const saveBtn = el("saveBtn");
    const saveStatus = el("saveStatus");

    const barkraftValue = el("barkraftValue");
    const slotsGrid = el("inventorySlots");
    const itemsGrid = el("inventoryItems");

    // safety abort
    if (!nameInput || !saveBtn || !slotsGrid || !itemsGrid) {
        console.warn("[CharacterSheet] key elements missing, aborting.");
        return;
    }

    const url = new URL(window.location.href);
    let characterId = url.searchParams.get("id");

    function setStatus(msg) {
        VP.shared.ui.setText(saveStatus, msg);
    }

    // Shared state (used by renderer + dialog controller)
    const state = {
        characterId,
        currentCols: 0,
        currentRows: 0,
        itemsCache: [],
    };

    async function refreshRules() {
        try {
            const strength = Number(strengthInput.value) || 0;
            const barformaga = Number(barformagaInput.value) || 0;

            const data = await VP.api.rules.getInventoryGridRules(strength, barformaga);

            if (barkraftValue) barkraftValue.textContent = data?.barkraft ?? 0;

            VP.grid.render.renderSlots(slotsGrid, itemsGrid, state, data?.cols ?? 0, data?.rows ?? 0);
            VP.grid.render.renderItems(itemsGrid, state, state.itemsCache, (id) => dialog.openEdit(id));
        } catch (err) {
            console.error("Rules error", err);
            setStatus(VP.shared.ui.describeHttpError(err));
        }
    }

    async function reloadItems() {
        if (!state.characterId) return;
        try {
            state.itemsCache = await VP.api.items.getItemsForCharacter(state.characterId);
            VP.grid.render.renderItems(itemsGrid, state, state.itemsCache, (id) => dialog.openEdit(id));
        } catch (err) {
            console.error("Load items failed", err);
            setStatus(VP.shared.ui.describeHttpError(err));
        }
    }

    async function loadCharacter(id) {
        try {
            setStatus("Loading...");
            const c = await VP.api.characters.getCharacter(id);

            nameInput.value = c.name ?? "";
            raceInput.value = c.race ?? "";
            xpInput.value = c.xp ?? 0;
            strengthInput.value = c.strength ?? 0;
            barformagaInput.value = c.barformaga ?? 0;

            await refreshRules();
            await reloadItems();
            setStatus(`Loaded #${id}`);
        } catch (err) {
            console.error("Load failed", err);
            setStatus(VP.shared.ui.describeHttpError(err));
        }
    }

    async function saveCharacter() {
        try {
            setStatus("Saving...");

            const payload = {
                name: (nameInput.value || "").trim(),
                race: (raceInput.value || "").trim(),
                xp: Number(xpInput.value) || 0,
                strength: Number(strengthInput.value) || 0,
                barformaga: Number(barformagaInput.value) || 0
            };

            if (!state.characterId) {
                const out = await VP.api.characters.createCharacter(payload);
                state.characterId = String(out.id);
                characterId = state.characterId;

                url.searchParams.set("id", state.characterId);
                window.history.replaceState({}, "", url.toString());

                setStatus(`Saved new (#${state.characterId})`);
                return;
            }

            await VP.api.characters.updateCharacter(state.characterId, payload);
            setStatus(`Updated #${state.characterId}`);
        } catch (err) {
            console.error("Save/update failed", err);
            setStatus(VP.shared.ui.describeHttpError(err));
        }
    }

    // --- Dialog wiring (pass in dom + state + callbacks) ---
    const dialogDom = {
        addItemBtn: el("addItemBtn"),
        itemDialog: el("itemDialog"),
        itemIdInput: el("itemIdInput"),
        itemNameInput: el("itemNameInput"),
        itemDeleteBtn: el("itemDeleteBtn"),
        primarySelect: el("primarySelect"),
        secondarySelect: el("secondarySelect"),
        sizeSelect: el("sizeSelect"),
        magicCheck: el("magicCheck"),
        durabilityWrap: el("durabilityWrap"),
        durabilityInput: el("durabilityInput"),
        descriptionInput: el("descriptionInput"),
        iconGrid: el("iconGrid"),
        iconFileInput: el("iconFileInput"),
        iconPreview: el("iconPreview"),
        itemSaveBtn: el("itemSaveBtn"),
        itemCancelBtn: el("itemCancelBtn"),
    };

    const dialog = VP.inventory.createDialogController(dialogDom, state, {
        reloadItems,
    });

    // Events
    strengthInput.addEventListener("input", refreshRules);
    barformagaInput.addEventListener("input", refreshRules);
    saveBtn.addEventListener("click", saveCharacter);

    // Init
    (async () => {
        console.log("[CharacterSheet] loaded (modular)");
        await dialog.wire();
        await refreshRules();
        if (state.characterId) await loadCharacter(state.characterId);
    })();
})();
