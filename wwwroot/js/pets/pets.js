// pets/pets.js
// Self-contained pet grid controller.
// Uses VP.grid.placement and VP.grid.render; no API calls (local state only for now).
(() => {
    const PET_COLS = 4;
    const PET_ROWS = 2;

    // Hardcoded catalog — populate icons[] when SVGs are dropped into wwwroot/Icons/Pets/{type}/
    const PET_CATALOG = [
        { typeKey: "Fickdjur",  typeLabel: "Fickdjur",  icons: [] },
        { typeKey: "Fotdjur",   typeLabel: "Fotdjur",   icons: [] },
        { typeKey: "Riddjur",   typeLabel: "Riddjur",   icons: [] },
        { typeKey: "Klampdjur", typeLabel: "Klampdjur", icons: [] },
    ];

    function createController(dom) {
        let nextId = 1;

        // State shape matches what VP.grid.render expects
        const state = {
            pets: [],
            currentCols: PET_COLS,
            currentRows: PET_ROWS,
        };

        // Map a pet record to the shape VP.grid.render.renderItems expects
        function toRenderItem(p) {
            return {
                id: p.id,
                x: p.x,
                y: p.y,
                size: p.size,
                name: p.name,
                iconPrimary: "Pets",
                iconSecondary: p.typeKey,
                iconFile: p.iconFile,
                isMagic: false,
                description: p.description,
            };
        }

        function renderGrid() {
            VP.grid.render.renderSlots(dom.slotsGrid, dom.itemsGrid, state, PET_COLS, PET_ROWS);
            VP.grid.render.renderItems(dom.itemsGrid, state, state.pets.map(toRenderItem), openEdit);
        }

        // --- Dialog helpers ---

        function fillTypeSelect() {
            dom.typeSelect.innerHTML = "";
            const ph = document.createElement("option");
            ph.value = "";
            ph.textContent = "– Välj typ –";
            dom.typeSelect.appendChild(ph);
            for (const t of PET_CATALOG) {
                const o = document.createElement("option");
                o.value = t.typeKey;
                o.textContent = t.typeLabel;
                dom.typeSelect.appendChild(o);
            }
        }

        function renderIconPicker(typeKey) {
            dom.iconGrid.innerHTML = "";
            dom.iconFileInput.value = "";
            dom.iconPreview.style.display = "none";
            dom.iconPreview.src = "";

            const cat = PET_CATALOG.find(x => x.typeKey === typeKey);
            const icons = cat?.icons ?? [];

            if (!icons.length) {
                const msg = document.createElement("div");
                msg.className = "hint";
                msg.textContent = typeKey
                    ? `Inga ikoner ännu — lägg till SVG-filer i wwwroot/Icons/Pets/${typeKey}/`
                    : "Välj djurtyp för att se ikoner.";
                dom.iconGrid.appendChild(msg);
                return;
            }

            for (const file of icons) {
                const url = `/Icons/Pets/${typeKey}/${file}`;
                const btn = document.createElement("button");
                btn.type = "button";
                btn.className = "icon-tile";
                btn.title = file;

                const img = document.createElement("img");
                img.src = url;
                img.alt = file;
                btn.appendChild(img);

                btn.addEventListener("click", () => {
                    dom.iconFileInput.value = file;
                    dom.iconPreview.src = url;
                    dom.iconPreview.style.display = "block";
                    dom.iconGrid.querySelectorAll(".icon-tile.is-selected")
                        .forEach(x => x.classList.remove("is-selected"));
                    btn.classList.add("is-selected");
                });

                dom.iconGrid.appendChild(btn);
            }
        }

        function resetForm() {
            dom.idInput.value = "";
            dom.nameInput.value = "";
            dom.sizeSelect.value = "1x1";
            dom.descInput.value = "";
            dom.iconFileInput.value = "";
            dom.iconPreview.style.display = "none";
            dom.iconPreview.src = "";
            dom.iconGrid.innerHTML = "";
            dom.deleteBtn.style.display = "none";
            fillTypeSelect();
        }

        function openCreate() {
            resetForm();
            dom.dialog.showModal();
        }

        function openEdit(petId) {
            const pet = state.pets.find(p => p.id === petId);
            if (!pet) return;

            resetForm();
            dom.nameInput.value = pet.name ?? "";
            dom.typeSelect.value = pet.typeKey ?? "";
            dom.sizeSelect.value = pet.size ?? "1x1";
            dom.descInput.value = pet.description ?? "";

            renderIconPicker(pet.typeKey);

            if (pet.iconFile) {
                dom.iconFileInput.value = pet.iconFile;
                const url = `/Icons/Pets/${pet.typeKey}/${pet.iconFile}`;
                dom.iconPreview.src = url;
                dom.iconPreview.style.display = "block";
            }

            dom.idInput.value = String(pet.id);
            dom.deleteBtn.style.display = "";
            dom.dialog.showModal();
        }

        function save() {
            const typeKey     = dom.typeSelect.value;
            const size        = dom.sizeSelect.value || "1x1";
            const name        = (dom.nameInput.value || "").trim();
            const iconFile    = dom.iconFileInput.value;
            const description = dom.descInput.value || "";
            const editingId   = dom.idInput.value ? Number(dom.idInput.value) : null;

            if (!typeKey) return alert("Välj djurtyp.");

            // Build placement items excluding the pet being edited
            const others = state.pets.filter(p => p.id !== editingId);
            const placementItems = others.map(p => ({ id: p.id, x: p.x, y: p.y, size: p.size }));

            let placement;

            if (editingId == null) {
                placement = VP.grid.placement.findFirstFitColumnWise(size, placementItems, PET_COLS, PET_ROWS);
                if (!placement) return alert("Djuret får inte plats i djurgriden.");
            } else {
                const cur = state.pets.find(p => p.id === editingId);
                if (cur) {
                    const { rows, cols } = VP.grid.placement.parseSize(size);
                    const occ = VP.grid.placement.buildOccupancy(placementItems, PET_COLS, PET_ROWS);
                    const fits = VP.grid.placement.canPlaceAt(occ, cur.x, cur.y, rows, cols, PET_COLS, PET_ROWS);
                    placement = fits
                        ? { x: cur.x, y: cur.y }
                        : VP.grid.placement.findFirstFitColumnWise(size, placementItems, PET_COLS, PET_ROWS);
                    if (!placement) return alert("Djuret får inte plats efter ändring.");
                } else {
                    placement = VP.grid.placement.findFirstFitColumnWise(size, placementItems, PET_COLS, PET_ROWS);
                    if (!placement) return alert("Djuret får inte plats i djurgriden.");
                }
            }

            if (editingId == null) {
                state.pets.push({
                    id: nextId++, typeKey, size, name, iconFile, description,
                    x: placement.x, y: placement.y,
                });
            } else {
                const idx = state.pets.findIndex(p => p.id === editingId);
                if (idx >= 0) {
                    state.pets[idx] = {
                        ...state.pets[idx],
                        typeKey, size, name, iconFile, description,
                        x: placement.x, y: placement.y,
                    };
                }
            }

            dom.dialog.close();
            renderGrid();
        }

        function deleteCurrent() {
            const id = dom.idInput.value ? Number(dom.idInput.value) : null;
            if (!id || !confirm(`Ta bort djur #${id}?`)) return;
            state.pets = state.pets.filter(p => p.id !== id);
            dom.dialog.close();
            renderGrid();
        }

        function wire() {
            dom.addBtn.addEventListener("click", openCreate);
            dom.typeSelect.addEventListener("change", () => renderIconPicker(dom.typeSelect.value));
            dom.cancelBtn.addEventListener("click", () => dom.dialog.close());
            dom.saveBtn.addEventListener("click", save);
            dom.deleteBtn.addEventListener("click", deleteCurrent);
        }

        return { wire, renderGrid };
    }

    VP.pets.createController = createController;

    // Self-init against the page DOM
    (() => {
        function el(id) { return document.getElementById(id); }

        const dom = {
            addBtn:       el("addPetBtn"),
            dialog:       el("petDialog"),
            idInput:      el("petIdInput"),
            nameInput:    el("petNameInput"),
            typeSelect:   el("petTypeSelect"),
            sizeSelect:   el("petSizeSelect"),
            iconGrid:     el("petIconGrid"),
            iconFileInput: el("petIconFileInput"),
            iconPreview:  el("petIconPreview"),
            descInput:    el("petDescInput"),
            saveBtn:      el("petSaveBtn"),
            cancelBtn:    el("petCancelBtn"),
            deleteBtn:    el("petDeleteBtn"),
            slotsGrid:    el("petSlots"),
            itemsGrid:    el("petItems"),
        };

        if (!dom.addBtn || !dom.dialog || !dom.slotsGrid) {
            console.warn("[Pets] key elements missing, skipping init.");
            return;
        }

        const ctrl = createController(dom);
        ctrl.wire();
        ctrl.renderGrid();
    })();
})();
