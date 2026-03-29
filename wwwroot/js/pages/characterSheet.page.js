// pages/characterSheet.page.js
(() => {
    function el(id) { return document.getElementById(id); }

    // DOM refs
    const nameInput = el("nameInput");
    const raceInput = el("raceInput");
    const xpInput = el("xpInput");
    const strengthInput = el("strengthInput");
    const barformagaInput = el("barformagaInput");
    const talighetInput = el("talighetInput");
    const fysiskInput = el("fysiskInput");
    const saveBtn = el("saveBtn");
    const saveStatus = el("saveStatus");

    const barkraftValue = el("barkraftValue");
    const hpHeadMax = el("hpHeadMax");
    const hpTorsoMax = el("hpTorsoMax");
    const hpArmsMax = el("hpArmsMax");
    const hpLegsMax = el("hpLegsMax");
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

    async function refreshHp() {
        try {
            const talighet = Number(talighetInput?.value) || 0;
            const fysisk = Number(fysiskInput?.value) || 0;

            const data = await VP.api.rules.getHpRules(talighet, fysisk);

            const max = data?.hpMax ?? 0;
            if (hpHeadMax) hpHeadMax.textContent = max;
            if (hpTorsoMax) hpTorsoMax.textContent = max;
            if (hpArmsMax) hpArmsMax.textContent = max;
            if (hpLegsMax) hpLegsMax.textContent = max;
        } catch (err) {
            console.error("HP rules error", err);
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

    async function loadPortrait(id) {
        const img   = el("portraitImg");
        const empty = el("portraitEmpty");
        const err   = el("portraitError");
        if (!img || !empty) return;
        try {
            const data = await VP.shared.requestJson(`/api/characters/${id}/portrait`);
            if (data?.url) {
                await new Promise((resolve) => {
                    const tempImg = new Image();
                    tempImg.onload = () => {
                        if (tempImg.naturalWidth > 2000 || tempImg.naturalHeight > 2000) {
                            if (err) { err.textContent = "Bilden är för stor — max 2000x2000px"; err.style.display = "block"; }
                            resolve();
                            return;
                        }
                        img.src = data.url;
                        img.style.display = "block";
                        empty.style.display = "none";
                        resolve();
                    };
                    tempImg.onerror = resolve;
                    tempImg.src = data.url;
                });
            }
        } catch { /* 404 = no portrait yet, keep empty state */ }
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
            if (talighetInput) talighetInput.value = c.talighet ?? 0;
            if (fysiskInput) fysiskInput.value = c.fysisk ?? 0;

            await refreshRules();
            await refreshHp();
            await reloadItems();
            await loadPortrait(id);
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
    if (talighetInput) talighetInput.addEventListener("input", refreshHp);
    if (fysiskInput) fysiskInput.addEventListener("input", refreshHp);
    saveBtn.addEventListener("click", saveCharacter);

    // ---- Portrait ----
    // Portraits are stored at wwwroot/portraits/{characterId}.{ext} — filesystem only, no DB.
    // Future: add Character.PortraitFile column + one migration to persist the path in the DB,
    //         then read c.portraitFile from getCharacter() instead of a separate GET call.
    const portraitArea      = el("portraitArea");
    const portraitImg       = el("portraitImg");
    const portraitEmpty     = el("portraitEmpty");
    const portraitFileInput = el("portraitFileInput");
    const portraitError     = el("portraitError");

    if (portraitArea && portraitFileInput && portraitImg && portraitEmpty) {
        // Double-click when a portrait is shown → re-open file picker to replace it
        portraitArea.addEventListener("click", () => portraitFileInput.click());

        portraitFileInput.addEventListener("change", () => {
            const file = portraitFileInput.files?.[0];
            if (!file) return;

            // Immediate local preview — no waiting for upload
            const reader = new FileReader();
            reader.onload = (e) => {
                const tempImg = new Image();
                tempImg.onload = () => {
                    if (tempImg.naturalWidth > 2000 || tempImg.naturalHeight > 2000) {
                        if (portraitError) { portraitError.textContent = "Bilden är för stor — max 2000x2000px"; portraitError.style.display = "block"; }
                        return;
                    }
                    if (portraitError) portraitError.style.display = "none";
                    portraitImg.src = e.target.result;
                    portraitImg.style.display = "block";
                    portraitEmpty.style.display = "none";

                    // Persist to disk in the background
                    if (state.characterId) {
                        const form = new FormData();
                        form.append("file", file);
                        fetch(`/api/characters/${state.characterId}/portrait`, { method: "POST", body: form })
                            .catch(err => console.error("[Portrait] upload failed", err));
                    }
                };
                tempImg.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });
    }

    // Init
    (async () => {
        console.log("[CharacterSheet] loaded (modular)");
        await dialog.wire();
        await refreshRules();
        await refreshHp();
        if (state.characterId) await loadCharacter(state.characterId);
    })();
})();
