// pages/characterSheet.page.js
(() => {
    VP.sheet = VP.sheet || {};

    function el(id) { return document.getElementById(id); }

    // DOM refs
    const nameInput = el("nameInput");
    const raceInput = el("raceInput");
    const xpInput = el("xpInput");
    const strengthInput = el("strengthInput");
    const genomslagInput = el("genomslagInput");
    const barformagaInput = el("barformagaInput");
    const forflyttaInput = el("forflyttaInput");
    const brottasInput = el("brottasInput");
    const skicklighetInput = el("skicklighetInput");
    const skytteInput = el("skytteInput");
    const fingerfardighetInput = el("fingerfardighetInput");
    const traffsakerhetInput = el("traffsakerhetInput");
    const akrobatikInput = el("akrobatikInput");
    const talighetInput = el("talighetInput");
    const mentalInput = el("mentalInput");
    const fysiskInput = el("fysiskInput");
    const blockeraInput = el("blockeraInput");
    const uthallighetInput = el("uthallighetInput");
    const intelligensInput = el("intelligensInput");
    const allmanbildningInput = el("allmanbildningInput");
    const logisktTankandeInput = el("logisktTankandeInput");
    const ogaForDetaljerInput = el("ogaForDetaljerInput");
    const uppfinningsrikedomInput = el("uppfinningsrikedomInput");
    const klokhetInput = el("klokhetInput");
    const snabbtankthetInput = el("snabbtankthetInput");
    const kannaAvFaraInput = el("kannaAvFaraInput");
    const seIgenomLognerInput = el("seIgenomLognerInput");
    const magiskKanslaInput = el("magiskKanslaInput");
    const utstralningInput = el("utstralningInput");
    const ljugaInput = el("ljugaInput");
    const overtalaInput = el("overtalaInput");
    const intryckInput = el("intryckInput");
    const vackaKanslorInput = el("vackaKanslorInput");
    const currencyCuppar = el("currencyCuppar");
    const currencyFerrar = el("currencyFerrar");
    const currencyAurar = el("currencyAurar");
    const hpHeadCurrent = el("hpHeadCurrent");
    const hpTorsoCurrent = el("hpTorsoCurrent");
    const hpArmsCurrent = el("hpArmsCurrent");
    const hpLegsCurrent = el("hpLegsCurrent");
    const notesInput = el("notesInput");
    const pouchNotes = el("pouchNotes");
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

            if (strengthInput)            strengthInput.value            = c.strength ?? 0;
            if (genomslagInput)           genomslagInput.value           = c.genomslag ?? 0;
            if (barformagaInput)          barformagaInput.value          = c.barformaga ?? 0;
            if (forflyttaInput)           forflyttaInput.value           = c.forflytta ?? 0;
            if (brottasInput)             brottasInput.value             = c.brottas ?? 0;

            if (skicklighetInput)         skicklighetInput.value         = c.skicklighet ?? 0;
            if (skytteInput)              skytteInput.value              = c.skytte ?? 0;
            if (fingerfardighetInput)     fingerfardighetInput.value     = c.fingerfardighet ?? 0;
            if (traffsakerhetInput)       traffsakerhetInput.value       = c.traffsakerhet ?? 0;
            if (akrobatikInput)           akrobatikInput.value           = c.akrobatik ?? 0;

            if (talighetInput)            talighetInput.value            = c.talighet ?? 0;
            if (mentalInput)              mentalInput.value              = c.mental ?? 0;
            if (fysiskInput)              fysiskInput.value              = c.fysisk ?? 0;
            if (blockeraInput)            blockeraInput.value            = c.blockera ?? 0;
            if (uthallighetInput)         uthallighetInput.value         = c.uthallighet ?? 0;

            if (intelligensInput)         intelligensInput.value         = c.intelligens ?? 0;
            if (allmanbildningInput)      allmanbildningInput.value      = c.allmanbildning ?? 0;
            if (logisktTankandeInput)     logisktTankandeInput.value     = c.logisktTankande ?? 0;
            if (ogaForDetaljerInput)      ogaForDetaljerInput.value      = c.ogaForDetaljer ?? 0;
            if (uppfinningsrikedomInput)  uppfinningsrikedomInput.value  = c.uppfinningsrikedom ?? 0;

            if (klokhetInput)             klokhetInput.value             = c.klokhet ?? 0;
            if (snabbtankthetInput)       snabbtankthetInput.value       = c.snabbtankthet ?? 0;
            if (kannaAvFaraInput)         kannaAvFaraInput.value         = c.kannaAvFara ?? 0;
            if (seIgenomLognerInput)      seIgenomLognerInput.value      = c.seIgenomLogner ?? 0;
            if (magiskKanslaInput)        magiskKanslaInput.value        = c.magiskKansla ?? 0;

            if (utstralningInput)         utstralningInput.value         = c.utstralning ?? 0;
            if (ljugaInput)               ljugaInput.value               = c.ljuga ?? 0;
            if (overtalaInput)            overtalaInput.value            = c.overtala ?? 0;
            if (intryckInput)             intryckInput.value             = c.intryck ?? 0;
            if (vackaKanslorInput)        vackaKanslorInput.value        = c.vackaKanslor ?? 0;

            if (currencyCuppar)           currencyCuppar.value           = c.cuppar ?? 0;
            if (currencyFerrar)           currencyFerrar.value           = c.ferrar ?? 0;
            if (currencyAurar)            currencyAurar.value            = c.aurar ?? 0;

            if (hpHeadCurrent)            hpHeadCurrent.value            = c.skadaHuvud ?? 0;
            if (hpTorsoCurrent)           hpTorsoCurrent.value           = c.skadaTorso ?? 0;
            if (hpArmsCurrent)            hpArmsCurrent.value            = c.skadaArmar ?? 0;
            if (hpLegsCurrent)            hpLegsCurrent.value            = c.skadaBen ?? 0;

            if (notesInput)               notesInput.value               = c.anteckningar ?? "";
            if (pouchNotes)               pouchNotes.value               = c.pouch ?? "";

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

                strength:           Number(strengthInput?.value)           || 0,
                genomslag:          Number(genomslagInput?.value)          || 0,
                barformaga:         Number(barformagaInput?.value)         || 0,
                forflytta:          Number(forflyttaInput?.value)          || 0,
                brottas:            Number(brottasInput?.value)            || 0,

                skicklighet:        Number(skicklighetInput?.value)        || 0,
                skytte:             Number(skytteInput?.value)             || 0,
                fingerfardighet:    Number(fingerfardighetInput?.value)    || 0,
                traffsakerhet:      Number(traffsakerhetInput?.value)      || 0,
                akrobatik:          Number(akrobatikInput?.value)          || 0,

                talighet:           Number(talighetInput?.value)           || 0,
                mental:             Number(mentalInput?.value)             || 0,
                fysisk:             Number(fysiskInput?.value)             || 0,
                blockera:           Number(blockeraInput?.value)           || 0,
                uthallighet:        Number(uthallighetInput?.value)        || 0,

                intelligens:        Number(intelligensInput?.value)        || 0,
                allmanbildning:     Number(allmanbildningInput?.value)     || 0,
                logisktTankande:    Number(logisktTankandeInput?.value)    || 0,
                ogaForDetaljer:     Number(ogaForDetaljerInput?.value)     || 0,
                uppfinningsrikedom: Number(uppfinningsrikedomInput?.value) || 0,

                klokhet:            Number(klokhetInput?.value)            || 0,
                snabbtankthet:      Number(snabbtankthetInput?.value)      || 0,
                kannaAvFara:        Number(kannaAvFaraInput?.value)        || 0,
                seIgenomLogner:     Number(seIgenomLognerInput?.value)     || 0,
                magiskKansla:       Number(magiskKanslaInput?.value)       || 0,

                utstralning:        Number(utstralningInput?.value)        || 0,
                ljuga:              Number(ljugaInput?.value)              || 0,
                overtala:           Number(overtalaInput?.value)           || 0,
                intryck:            Number(intryckInput?.value)            || 0,
                vackaKanslor:       Number(vackaKanslorInput?.value)       || 0,

                cuppar:             Number(currencyCuppar?.value)          || 0,
                ferrar:             Number(currencyFerrar?.value)          || 0,
                aurar:              Number(currencyAurar?.value)           || 0,

                skadaHuvud:         Number(hpHeadCurrent?.value)          || 0,
                skadaTorso:         Number(hpTorsoCurrent?.value)         || 0,
                skadaArmar:         Number(hpArmsCurrent?.value)          || 0,
                skadaBen:           Number(hpLegsCurrent?.value)          || 0,

                anteckningar:       notesInput?.value ?? "",
                pouch:              pouchNotes?.value ?? "",
            };

            if (!state.characterId) {
                const out = await VP.api.characters.createCharacter(payload);
                state.characterId = String(out.id);
                characterId = state.characterId;

                url.searchParams.set("id", state.characterId);
                window.history.replaceState({}, "", url.toString());

                document.dispatchEvent(new CustomEvent('vp:characterSaved', { detail: { id: state.characterId } }));
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
                tempImg.onload = async () => {
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
                        const token = await VP.shared.getCsrfToken?.();
                        const headers = {};
                        if (token) headers["X-XSRF-TOKEN"] = token;
                        fetch(`/api/characters/${state.characterId}/portrait`, { method: "POST", body: form, headers })
                            .catch(err => console.error("[Portrait] upload failed", err));
                    }
                };
                tempImg.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });
    }

    // VP.sheet public API (used by karaktarer.page.js tab manager)
    VP.sheet.load = async function(id) {
        state.characterId = String(id);
        characterId = state.characterId;
        await loadCharacter(id);
    };

    VP.sheet.clear = function() {
        nameInput.value = ""; raceInput.value = ""; xpInput.value = 0;
        if (strengthInput)           strengthInput.value           = 0;
        if (genomslagInput)          genomslagInput.value          = 0;
        if (barformagaInput)         barformagaInput.value         = 0;
        if (forflyttaInput)          forflyttaInput.value          = 0;
        if (brottasInput)            brottasInput.value            = 0;
        if (skicklighetInput)        skicklighetInput.value        = 0;
        if (skytteInput)             skytteInput.value             = 0;
        if (fingerfardighetInput)    fingerfardighetInput.value    = 0;
        if (traffsakerhetInput)      traffsakerhetInput.value      = 0;
        if (akrobatikInput)          akrobatikInput.value          = 0;
        if (talighetInput)           talighetInput.value           = 0;
        if (mentalInput)             mentalInput.value             = 0;
        if (fysiskInput)             fysiskInput.value             = 0;
        if (blockeraInput)           blockeraInput.value           = 0;
        if (uthallighetInput)        uthallighetInput.value        = 0;
        if (intelligensInput)        intelligensInput.value        = 0;
        if (allmanbildningInput)     allmanbildningInput.value     = 0;
        if (logisktTankandeInput)    logisktTankandeInput.value    = 0;
        if (ogaForDetaljerInput)     ogaForDetaljerInput.value     = 0;
        if (uppfinningsrikedomInput) uppfinningsrikedomInput.value = 0;
        if (klokhetInput)            klokhetInput.value            = 0;
        if (snabbtankthetInput)      snabbtankthetInput.value      = 0;
        if (kannaAvFaraInput)        kannaAvFaraInput.value        = 0;
        if (seIgenomLognerInput)     seIgenomLognerInput.value     = 0;
        if (magiskKanslaInput)       magiskKanslaInput.value       = 0;
        if (utstralningInput)        utstralningInput.value        = 0;
        if (ljugaInput)              ljugaInput.value              = 0;
        if (overtalaInput)           overtalaInput.value           = 0;
        if (intryckInput)            intryckInput.value            = 0;
        if (vackaKanslorInput)       vackaKanslorInput.value       = 0;
        if (currencyCuppar)          currencyCuppar.value          = 0;
        if (currencyFerrar)          currencyFerrar.value          = 0;
        if (currencyAurar)           currencyAurar.value           = 0;
        if (hpHeadCurrent)           hpHeadCurrent.value           = 0;
        if (hpTorsoCurrent)          hpTorsoCurrent.value          = 0;
        if (hpArmsCurrent)           hpArmsCurrent.value           = 0;
        if (hpLegsCurrent)           hpLegsCurrent.value           = 0;
        if (notesInput)              notesInput.value              = "";
        if (pouchNotes)              pouchNotes.value              = "";
        if (hpHeadMax)  hpHeadMax.textContent  = "0";
        if (hpTorsoMax) hpTorsoMax.textContent = "0";
        if (hpArmsMax)  hpArmsMax.textContent  = "0";
        if (hpLegsMax)  hpLegsMax.textContent  = "0";
        state.characterId = null; characterId = null;
        state.itemsCache = [];
        const img = el("portraitImg"); const empty = el("portraitEmpty");
        if (img) { img.src = ""; img.style.display = "none"; }
        if (empty) empty.style.display = "";
    };

    VP.sheet.getFieldState = function() {
        return {
            characterId: state.characterId,
            name: nameInput.value, race: raceInput.value, xp: xpInput.value,
            strength:           strengthInput?.value,
            genomslag:          genomslagInput?.value,
            barformaga:         barformagaInput?.value,
            forflytta:          forflyttaInput?.value,
            brottas:            brottasInput?.value,
            skicklighet:        skicklighetInput?.value,
            skytte:             skytteInput?.value,
            fingerfardighet:    fingerfardighetInput?.value,
            traffsakerhet:      traffsakerhetInput?.value,
            akrobatik:          akrobatikInput?.value,
            talighet:           talighetInput?.value,
            mental:             mentalInput?.value,
            fysisk:             fysiskInput?.value,
            blockera:           blockeraInput?.value,
            uthallighet:        uthallighetInput?.value,
            intelligens:        intelligensInput?.value,
            allmanbildning:     allmanbildningInput?.value,
            logisktTankande:    logisktTankandeInput?.value,
            ogaForDetaljer:     ogaForDetaljerInput?.value,
            uppfinningsrikedom: uppfinningsrikedomInput?.value,
            klokhet:            klokhetInput?.value,
            snabbtankthet:      snabbtankthetInput?.value,
            kannaAvFara:        kannaAvFaraInput?.value,
            seIgenomLogner:     seIgenomLognerInput?.value,
            magiskKansla:       magiskKanslaInput?.value,
            utstralning:        utstralningInput?.value,
            ljuga:              ljugaInput?.value,
            overtala:           overtalaInput?.value,
            intryck:            intryckInput?.value,
            vackaKanslor:       vackaKanslorInput?.value,
            cuppar:             currencyCuppar?.value,
            ferrar:             currencyFerrar?.value,
            aurar:              currencyAurar?.value,
            skadaHuvud:         hpHeadCurrent?.value,
            skadaTorso:         hpTorsoCurrent?.value,
            skadaArmar:         hpArmsCurrent?.value,
            skadaBen:           hpLegsCurrent?.value,
            anteckningar:       notesInput?.value,
            pouch:              pouchNotes?.value,
            itemsCache:         [...state.itemsCache],
            portraitSrc:        el("portraitImg")?.src ?? "",
        };
    };

    VP.sheet.setFieldState = async function(s) {
        state.characterId = s.characterId ?? null;
        characterId = state.characterId;
        nameInput.value = s.name ?? ""; raceInput.value = s.race ?? ""; xpInput.value = s.xp ?? 0;
        if (strengthInput)           strengthInput.value           = s.strength           ?? 0;
        if (genomslagInput)          genomslagInput.value          = s.genomslag          ?? 0;
        if (barformagaInput)         barformagaInput.value         = s.barformaga         ?? 0;
        if (forflyttaInput)          forflyttaInput.value          = s.forflytta          ?? 0;
        if (brottasInput)            brottasInput.value            = s.brottas            ?? 0;
        if (skicklighetInput)        skicklighetInput.value        = s.skicklighet        ?? 0;
        if (skytteInput)             skytteInput.value             = s.skytte             ?? 0;
        if (fingerfardighetInput)    fingerfardighetInput.value    = s.fingerfardighet    ?? 0;
        if (traffsakerhetInput)      traffsakerhetInput.value      = s.traffsakerhet      ?? 0;
        if (akrobatikInput)          akrobatikInput.value          = s.akrobatik          ?? 0;
        if (talighetInput)           talighetInput.value           = s.talighet           ?? 0;
        if (mentalInput)             mentalInput.value             = s.mental             ?? 0;
        if (fysiskInput)             fysiskInput.value             = s.fysisk             ?? 0;
        if (blockeraInput)           blockeraInput.value           = s.blockera           ?? 0;
        if (uthallighetInput)        uthallighetInput.value        = s.uthallighet        ?? 0;
        if (intelligensInput)        intelligensInput.value        = s.intelligens        ?? 0;
        if (allmanbildningInput)     allmanbildningInput.value     = s.allmanbildning     ?? 0;
        if (logisktTankandeInput)    logisktTankandeInput.value    = s.logisktTankande    ?? 0;
        if (ogaForDetaljerInput)     ogaForDetaljerInput.value     = s.ogaForDetaljer     ?? 0;
        if (uppfinningsrikedomInput) uppfinningsrikedomInput.value = s.uppfinningsrikedom ?? 0;
        if (klokhetInput)            klokhetInput.value            = s.klokhet            ?? 0;
        if (snabbtankthetInput)      snabbtankthetInput.value      = s.snabbtankthet      ?? 0;
        if (kannaAvFaraInput)        kannaAvFaraInput.value        = s.kannaAvFara        ?? 0;
        if (seIgenomLognerInput)     seIgenomLognerInput.value     = s.seIgenomLogner     ?? 0;
        if (magiskKanslaInput)       magiskKanslaInput.value       = s.magiskKansla       ?? 0;
        if (utstralningInput)        utstralningInput.value        = s.utstralning        ?? 0;
        if (ljugaInput)              ljugaInput.value              = s.ljuga              ?? 0;
        if (overtalaInput)           overtalaInput.value           = s.overtala           ?? 0;
        if (intryckInput)            intryckInput.value            = s.intryck            ?? 0;
        if (vackaKanslorInput)       vackaKanslorInput.value       = s.vackaKanslor       ?? 0;
        if (currencyCuppar)          currencyCuppar.value          = s.cuppar             ?? 0;
        if (currencyFerrar)          currencyFerrar.value          = s.ferrar             ?? 0;
        if (currencyAurar)           currencyAurar.value           = s.aurar             ?? 0;
        if (hpHeadCurrent)           hpHeadCurrent.value           = s.skadaHuvud         ?? 0;
        if (hpTorsoCurrent)          hpTorsoCurrent.value          = s.skadaTorso         ?? 0;
        if (hpArmsCurrent)           hpArmsCurrent.value           = s.skadaArmar         ?? 0;
        if (hpLegsCurrent)           hpLegsCurrent.value           = s.skadaBen           ?? 0;
        if (notesInput)              notesInput.value              = s.anteckningar       ?? "";
        if (pouchNotes)              pouchNotes.value              = s.pouch              ?? "";
        state.itemsCache = s.itemsCache ?? [];
        const img = el("portraitImg"); const empty = el("portraitEmpty");
        if (img && s.portraitSrc) { img.src = s.portraitSrc; img.style.display = "block"; if (empty) empty.style.display = "none"; }
        else if (img) { img.src = ""; img.style.display = "none"; if (empty) empty.style.display = ""; }
        await refreshRules();
        await refreshHp();
    };

    // Init
    (async () => {
        console.log("[CharacterSheet] loaded (modular)");
        await dialog.wire();
        await refreshRules();
        await refreshHp();
        const isMergedPage = !!document.getElementById('charTabBar');
        if (!isMergedPage && state.characterId) await loadCharacter(state.characterId);

        // Hide write-only controls for unauthenticated viewers
        const auth = await VP.shared.getAuthState?.();
        if (!auth?.isAuthenticated) {
            if (saveBtn)               saveBtn.style.display               = "none";
            if (dialogDom.addItemBtn)  dialogDom.addItemBtn.style.display  = "none";
            if (portraitArea)          portraitArea.style.cursor            = "default";
            if (portraitArea)          portraitArea.onclick                 = null;
        }
    })();
})();
