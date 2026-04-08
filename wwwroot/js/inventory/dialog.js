// inventory/dialog.js
(() => {
    function createDialogController(dom, state, actions) {
        // dom = alla dialog-element
        // state = { itemsCache, currentCols, currentRows, characterId }
        // actions = { reloadItems, openEditItemHook }

        let iconCatalog = null;

        function clearSelect(selectEl, placeholderText) {
            selectEl.innerHTML = "";
            const opt = document.createElement("option");
            opt.value = "";
            opt.textContent = placeholderText;
            selectEl.appendChild(opt);
        }

        async function loadIconCatalog() {
            iconCatalog = iconCatalog || await VP.api.icons.getIconCatalog();
            return iconCatalog;
        }

        function fillPrimary() {
            clearSelect(dom.primarySelect, "– Välj –");
            for (const p of (iconCatalog?.primaries ?? [])) {
                const opt = document.createElement("option");
                opt.value = p.primaryKey;
                opt.textContent = p.primaryLabel;
                dom.primarySelect.appendChild(opt);
            }
        }

        function fillSecondary(primaryKey) {
            clearSelect(dom.secondarySelect, "– Välj –");
            const p = (iconCatalog?.primaries ?? []).find(x => x.primaryKey === primaryKey);
            const secs = p?.secondaries ?? [];

            for (const s of secs) {
                const opt = document.createElement("option");
                opt.value = s.secondaryKey;
                opt.textContent = s.secondaryLabel;
                dom.secondarySelect.appendChild(opt);
            }
            dom.secondarySelect.disabled = !primaryKey;
        }

        function getIconUrl(iconObj) {
            return iconObj.normalUrl || iconObj.magicUrl || "";
        }

        function getFileNameFromUrl(u) {
            if (!u) return "";
            const ix = u.lastIndexOf("/");
            return ix >= 0 ? u.substring(ix + 1) : u;
        }

        function updateDurabilityVisibility(primaryKey) {
            const show = (primaryKey === "Armour" || primaryKey === "Shields");
            if (dom.durabilityWrap) dom.durabilityWrap.style.display = show ? "" : "none";
            if (!show && dom.durabilityInput) dom.durabilityInput.value = "";
        }

        function renderIconPicker(primaryKey, secondaryKey) {
            dom.iconGrid.innerHTML = "";
            dom.iconFileInput.value = "";
            dom.iconPreview.style.display = "none";
            dom.iconPreview.src = "";

            const p = (iconCatalog?.primaries ?? []).find(x => x.primaryKey === primaryKey);
            const s = (p?.secondaries ?? []).find(x => x.secondaryKey === secondaryKey);
            const icons = s?.icons ?? [];

            if (!icons.length) {
                const msg = document.createElement("div");
                msg.className = "hint";
                msg.textContent = "Inga ikoner hittades för vald typ/subtyp.";
                dom.iconGrid.appendChild(msg);
                return;
            }

            for (const iconObj of icons) {
                const url = getIconUrl(iconObj);
                if (!url) continue;

                const btn = document.createElement("button");
                btn.type = "button";
                btn.className = "icon-tile";
                btn.title = iconObj.baseName;

                const img = document.createElement("img");
                img.dataset.originalSrc = url;
                img.alt = iconObj.baseName;

                if (dom.magicCheck.checked && url.endsWith(".svg")) {
                    VP.grid.render.tintSvgToMagic(url).then(tintedUrl => {
                        img.src = tintedUrl;
                    });
                } else {
                    img.src = url;
                }
                btn.appendChild(img);

                btn.addEventListener("click", async () => {
                    dom.iconFileInput.value = getFileNameFromUrl(url);
                    dom.iconPreview.dataset.originalSrc = url;
                    dom.iconPreview.style.display = "block";

                    if (dom.magicCheck.checked && url.endsWith(".svg")) {
                        const tintedUrl = await VP.grid.render.tintSvgToMagic(url);
                        dom.iconPreview.src = tintedUrl;
                    } else {
                        dom.iconPreview.src = url;
                    }

                    dom.iconGrid.querySelectorAll(".icon-tile.is-selected")
                        .forEach(x => x.classList.remove("is-selected"));
                    btn.classList.add("is-selected");
                });

                dom.iconGrid.appendChild(btn);
            }
        }

        function resetForm() {
            dom.itemIdInput.value = "";
            dom.itemNameInput.value = "";
            clearSelect(dom.primarySelect, "– Välj –");
            clearSelect(dom.secondarySelect, "– Välj –");
            dom.secondarySelect.disabled = true;

            dom.sizeSelect.value = "1x1";
            dom.magicCheck.checked = false;

            if (dom.durabilityInput) dom.durabilityInput.value = "";
            dom.descriptionInput.value = "";

            dom.iconFileInput.value = "";
            dom.iconPreview.style.display = "none";
            dom.iconPreview.src = "";
            dom.iconGrid.innerHTML = "";

            updateDurabilityVisibility("");
            if (dom.itemDeleteBtn) dom.itemDeleteBtn.style.display = "none";
        }

        function openCreate() {
            resetForm();
            dom.itemDialog.showModal();
        }

        async function openEdit(itemId) {
            const it = state.itemsCache.find(x => x.id === itemId);
            if (!it) return;

            resetForm();
            await loadIconCatalog();
            fillPrimary();

            dom.primarySelect.value = it.iconPrimary || "";
            fillSecondary(dom.primarySelect.value);

            dom.secondarySelect.value = it.iconSecondary || "";
            dom.secondarySelect.disabled = false;

            dom.sizeSelect.value = it.size || "1x1";
            dom.magicCheck.checked = !!it.isMagic;

            updateDurabilityVisibility(dom.primarySelect.value);
            if (dom.durabilityInput) dom.durabilityInput.value = (it.durability ?? "");

            dom.descriptionInput.value = it.description ?? "";
            dom.itemNameInput.value = it.name ?? "";

            renderIconPicker(dom.primarySelect.value, dom.secondarySelect.value);

            if (it.iconFile) {
                const normalFile = it.iconFile.replace(/_magic(\.[^.]+)$/i, "$1");
                dom.iconFileInput.value = normalFile;
                const previewSrc = VP.grid.render.itemIconUrl({ ...it, iconFile: normalFile });
                dom.iconPreview.dataset.originalSrc = previewSrc;
                dom.iconPreview.style.display = "block";

                if (it.isMagic && previewSrc.endsWith(".svg")) {
                    VP.grid.render.tintSvgToMagic(previewSrc).then(tintedUrl => {
                        dom.iconPreview.src = tintedUrl;
                    });
                } else {
                    dom.iconPreview.src = previewSrc;
                }
            }

            dom.itemIdInput.value = String(it.id);
            if (dom.itemDeleteBtn) dom.itemDeleteBtn.style.display = "";

            dom.itemDialog.showModal();
        }

        async function save() {
            if (!state.characterId) return alert("Spara karaktären först (så den får ett ID).");
            if (!state.currentCols || !state.currentRows) return alert("Ingen inventarie (Bärkraft för låg).");

            const primaryKey = dom.primarySelect.value;
            const secondaryKey = dom.secondarySelect.value;
            const size = dom.sizeSelect.value || "1x1";
            const isMagic = !!dom.magicCheck.checked;
            const iconFile = dom.iconFileInput.value;

            if (!primaryKey) return alert("Välj Föremålstyp");
            if (!secondaryKey) return alert("Välj Subtyp");
            if (!iconFile) return alert("Välj en ikon");

            const editingId = dom.itemIdInput.value ? Number(dom.itemIdInput.value) : null;

            let placement = null;

            if (editingId == null) {
                placement = VP.grid.placement.findFirstFitColumnWise(
                    size, state.itemsCache, state.currentCols, state.currentRows
                );
                if (!placement) return alert("Föremålet får inte plats i inventariet.");
            } else {
                const it = state.itemsCache.find(x => x.id === editingId);
                if (it) {
                    const { rows, cols } = VP.grid.placement.parseSize(size);
                    const occ = VP.grid.placement.buildOccupancy(
                        state.itemsCache, state.currentCols, state.currentRows, editingId
                    );
                    const ok = VP.grid.placement.canPlaceAt(
                        occ, it.x, it.y, rows, cols, state.currentCols, state.currentRows
                    );
                    placement = ok
                        ? { x: it.x, y: it.y }
                        : VP.grid.placement.findFirstFitColumnWise(size, state.itemsCache, state.currentCols, state.currentRows, editingId);

                    if (!placement) return alert("Efter ändring får föremålet inte plats i inventariet.");
                }
            }

            const dto = {
                characterId: Number(state.characterId),
                name: (dom.itemNameInput.value || "").trim(),
                iconPrimary: primaryKey,
                iconSecondary: secondaryKey,
                iconFile,
                isMagic,
                size,
                durability: dom.durabilityInput?.value ? Number(dom.durabilityInput.value) : null,
                description: dom.descriptionInput.value || "",
                x: placement.x,
                y: placement.y
            };

            if (editingId == null) await VP.api.items.createItem(state.characterId, dto);
            else await VP.api.items.updateItem(editingId, dto);

            dom.itemDialog.close();
            await actions.reloadItems();
        }

        async function removeCurrent() {
            const id = dom.itemIdInput.value ? Number(dom.itemIdInput.value) : null;
            if (!id) return;

            if (!confirm(`Delete item #${id}?`)) return;

            await VP.api.items.deleteItem(id);
            dom.itemDialog.close();
            await actions.reloadItems();
        }

        // Wiring (events)
        async function wire() {
            await loadIconCatalog();

            dom.addItemBtn.addEventListener("click", async () => {
                openCreate();
                await loadIconCatalog();
                fillPrimary();
                dom.secondarySelect.disabled = true;
                clearSelect(dom.secondarySelect, "– Välj –");
            });

            dom.primarySelect.addEventListener("change", () => {
                const pk = dom.primarySelect.value;
                fillSecondary(pk);
                updateDurabilityVisibility(pk);
                dom.iconGrid.innerHTML = "";
                dom.iconFileInput.value = "";
                dom.iconPreview.style.display = "none";
            });

            dom.secondarySelect.addEventListener("change", () => {
                const pk = dom.primarySelect.value;
                const sk = dom.secondarySelect.value;
                if (pk && sk) renderIconPicker(pk, sk);
            });

            dom.magicCheck.addEventListener("change", async () => {
                const pickerImgs = dom.iconGrid.querySelectorAll("img");
                if (dom.magicCheck.checked) {
                    for (const img of pickerImgs) {
                        const originalSrc = img.dataset.originalSrc || img.src;
                        if (originalSrc.endsWith(".svg")) {
                            const tintedUrl = await VP.grid.render.tintSvgToMagic(originalSrc);
                            img.src = tintedUrl;
                        }
                    }
                    const previewOriginal = dom.iconPreview.dataset.originalSrc || dom.iconPreview.src;
                    if (previewOriginal && previewOriginal.endsWith(".svg")) {
                        const tintedUrl = await VP.grid.render.tintSvgToMagic(previewOriginal);
                        dom.iconPreview.src = tintedUrl;
                    }
                } else {
                    for (const img of pickerImgs) {
                        const originalSrc = img.dataset.originalSrc || img.src;
                        img.src = originalSrc;
                    }
                    const previewOriginal = dom.iconPreview.dataset.originalSrc || dom.iconPreview.src;
                    if (previewOriginal) {
                        dom.iconPreview.src = previewOriginal;
                    }
                }
            });

            dom.itemCancelBtn.addEventListener("click", () => dom.itemDialog.close());
            dom.itemSaveBtn.addEventListener("click", save);
            dom.itemDeleteBtn.addEventListener("click", removeCurrent);
        }

        return { wire, openEdit };
    }

    VP.inventory.createDialogController = createDialogController;
})();
