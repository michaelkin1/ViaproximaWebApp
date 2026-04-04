VP.pets = VP.pets || {};

(() => {
    const PET_COLS = 4;
    const PET_ROWS = 2;

    function createController(dom) {
        let nextId = 1;

        const state = {
            pets: [],
            currentCols: PET_COLS,
            currentRows: PET_ROWS,
        };

        function toRenderItem(p) {
            return {
                id: p.id,
                x: p.x,
                y: p.y,
                size: p.size,
                name: p.name,
                typeKey: p.typeKey,
                iconUrl: p.iconFile ? `/IconsPets/Pets/${p.iconFile}` : "",
                iconFile: p.iconFile,
                isMagic: false,
                description: p.description,
            };
        }

        function renderGrid() {
            VP.grid.render.renderSlots(dom.slotsGrid, dom.itemsGrid, state, PET_COLS, PET_ROWS);
            VP.grid.render.renderItems(dom.itemsGrid, state, state.pets.map(toRenderItem), openEdit);
        }

        function initTypeSelect() {
            dom.typeSelect.innerHTML =
                `<option value="">– Välj typ –</option>
                 <option value="Fickdjur">Fickdjur</option>
                 <option value="Fotdjur">Fotdjur</option>
                 <option value="Klampdjur">Klampdjur</option>
                 <option value="Riddjur">Riddjur</option>`;
        }

        async function renderIconPicker() {
            dom.iconGrid.innerHTML = "";
            dom.iconFileInput.value = "";
            dom.iconPreview.style.display = "none";
            dom.iconPreview.src = "";

            const { icons } = await VP.api.petsIcons.getIcons();

            if (!icons.length) {
                const msg = document.createElement("div");
                msg.className = "hint";
                msg.textContent = "Inga ikoner ännu — lägg till filer i wwwroot/IconsPets/Pets/";
                dom.iconGrid.appendChild(msg);
                return;
            }

            for (const icon of icons) {
                const btn = document.createElement("button");
                btn.type = "button";
                btn.className = "icon-tile";
                btn.title = icon.file;

                const img = document.createElement("img");
                img.src = icon.url;
                img.alt = icon.file;
                btn.appendChild(img);

                btn.addEventListener("click", () => {
                    dom.iconFileInput.value = icon.file;
                    dom.iconPreview.src = icon.url;
                    dom.iconPreview.style.display = "block";
                    dom.iconGrid.querySelectorAll(".icon-tile.is-selected")
                        .forEach(x => x.classList.remove("is-selected"));
                    btn.classList.add("is-selected");
                });

                dom.iconGrid.appendChild(btn);
            }
        }

        function resetFormSync() {
            dom.idInput.value = "";
            dom.nameInput.value = "";
            dom.sizeSelect.value = "1x1";
            dom.descInput.value = "";
            dom.iconFileInput.value = "";
            dom.iconPreview.style.display = "none";
            dom.iconPreview.src = "";
            dom.iconGrid.innerHTML = "";
            dom.deleteBtn.style.display = "none";
        }

        async function openCreate() {
            resetFormSync();
            initTypeSelect();
            dom.dialog.showModal();
            await renderIconPicker();
        }

        async function openEdit(petId) {
            const pet = state.pets.find(p => p.id === petId);
            if (!pet) return;

            resetFormSync();
            initTypeSelect();
            dom.nameInput.value = pet.name ?? "";
            dom.sizeSelect.value = pet.size ?? "1x1";
            dom.descInput.value = pet.description ?? "";
            dom.idInput.value = String(pet.id);
            dom.deleteBtn.style.display = "";
            dom.typeSelect.value = pet.typeKey ?? "";
            dom.dialog.showModal();

            await renderIconPicker();

            if (pet.iconFile) {
                dom.iconFileInput.value = pet.iconFile;
                const url = `/IconsPets/Pets/${pet.iconFile}`;
                dom.iconPreview.src = url;
                dom.iconPreview.style.display = "block";
                dom.iconGrid.querySelectorAll(".icon-tile").forEach(btn => {
                    if (btn.title === pet.iconFile) btn.classList.add("is-selected");
                });
            }
        }

        function save() {
            const typeKey     = dom.typeSelect.value;
            const size        = dom.sizeSelect.value || "1x1";
            const name        = (dom.nameInput.value || "").trim();
            const iconFile    = dom.iconFileInput.value;
            const description = dom.descInput.value || "";
            const editingId   = dom.idInput.value ? Number(dom.idInput.value) : null;

            if (!typeKey) return alert("Välj djurtyp.");

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
            dom.cancelBtn.addEventListener("click", () => dom.dialog.close());
            dom.saveBtn.addEventListener("click", save);
            dom.deleteBtn.addEventListener("click", deleteCurrent);
        }

        return { wire, renderGrid };
    }

    VP.pets = VP.pets || {};
    VP.pets.createController = createController;

    (() => {
        function el(id) { return document.getElementById(id); }

        const dom = {
            addBtn:        el("addPetBtn"),
            dialog:        el("petDialog"),
            idInput:       el("petIdInput"),
            nameInput:     el("petNameInput"),
            typeSelect:    el("petTypeSelect"),
            sizeSelect:    el("petSizeSelect"),
            iconGrid:      el("petIconGrid"),
            iconFileInput: el("petIconFileInput"),
            iconPreview:   el("petIconPreview"),
            descInput:     el("petDescInput"),
            saveBtn:       el("petSaveBtn"),
            cancelBtn:     el("petCancelBtn"),
            deleteBtn:     el("petDeleteBtn"),
            slotsGrid:     el("petSlots"),
            itemsGrid:     el("petItems"),
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
