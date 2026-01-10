(() => {
  console.log("[CharacterSheet] loaded");

  const el = (id) => document.getElementById(id);

  // ===== Character fields =====
  const nameInput = el("nameInput");
  const raceInput = el("raceInput");
  const xpInput = el("xpInput");
  const strengthInput = el("strengthInput");
  const barformagaInput = el("barformagaInput");

  const saveBtn = el("saveBtn");
  const saveStatus = el("saveStatus");

  // ===== Inventory header / grid =====
  const barkraftValue = el("barkraftValue");
  const slotsGrid = el("inventorySlots");
  const itemsGrid = el("inventoryItems");

  // If this script is accidentally included on other pages (CharacterList etc)
  if (!nameInput || !saveBtn || !slotsGrid || !itemsGrid) {
    console.warn("[CharacterSheet] key elements missing, aborting.");
    return;
  }

  const url = new URL(window.location.href);
  let characterId = url.searchParams.get("id"); // string or null

  function setStatus(msg) {
    if (saveStatus) saveStatus.textContent = msg;
  }

  // ===== Grid state =====
  let currentCols = 0;
  let currentRows = 0;
  let itemsCache = []; // loaded from DB

  const SLOT = 64; // matches your CSS / var(--slot) visually

  // rows x cols (RADER x KOLUMNER)
  function parseSize(sizeStr) {
    const m = /^(\d+)x(\d+)$/i.exec((sizeStr || "").trim());
    if (!m) return { rows: 1, cols: 1 };
    return { rows: Number(m[1]) || 1, cols: Number(m[2]) || 1 };
  }

  function setGridTemplate(cols, rows) {
    // keep both layers identical
    const template = `repeat(${cols}, ${SLOT}px)`;
    slotsGrid.style.gridTemplateColumns = template;
    itemsGrid.style.gridTemplateColumns = template;

    // ensure row sizing (if you don’t already do this in CSS)
    slotsGrid.style.gridAutoRows = `${SLOT}px`;
    itemsGrid.style.gridAutoRows = `${SLOT}px`;
  }

  function renderSlots(cols, rows) {
    slotsGrid.innerHTML = "";

    if (!cols || !rows) {
      currentCols = 0;
      currentRows = 0;

      const msg = document.createElement("p");
      msg.className = "no-inventory";
      msg.textContent = "Ingen inventarie (Bärkraft under 4).";
      slotsGrid.appendChild(msg);

      itemsGrid.innerHTML = "";
      return;
    }

    currentCols = cols;
    currentRows = rows;

    setGridTemplate(cols, rows);

    const total = cols * rows;
    for (let i = 0; i < total; i++) {
      const slot = document.createElement("div");
      slot.className = "slot";
      slot.textContent = "";
      slotsGrid.appendChild(slot);
    }
  }

  function buildTooltip(it) {
    const parts = [];
    parts.push(`${it.primary || ""} / ${it.secondary || ""}`.trim());
    parts.push(`Storlek: ${it.size || "1x1"}   Magisk: ${it.isMagic ? "Ja" : "Nej"}`);
    if (it.durability != null) parts.push(`Hållbarhet: ${it.durability}`);
    if (it.description) parts.push(it.description);
    return parts.filter(Boolean).join("\n");
  }

  function itemIconUrl(it) {
    // Handles _root folders like Shields
    if (!it.iconPrimary || !it.iconFile) return "";
    if (!it.iconSecondary || it.iconSecondary === "_root") {
      return `/Icons/${it.iconPrimary}/${it.iconFile}`;
    }
    return `/Icons/${it.iconPrimary}/${it.iconSecondary}/${it.iconFile}`;
  }

  function renderItems(items) {
    itemsGrid.innerHTML = "";

    if (!currentCols || !currentRows) return;

    for (const it of items) {
      const { rows, cols } = parseSize(it.size);

      const div = document.createElement("div");
      div.className = "inv-item";
      div.dataset.itemId = it.id;
      div.title = buildTooltip(it);

      // CSS grid positions are 1-based
      div.style.gridColumn = `${it.x + 1} / span ${cols}`;
      div.style.gridRow = `${it.y + 1} / span ${rows}`;

      const img = document.createElement("img");
      img.src = itemIconUrl(it);
      img.alt = it.iconFile || "item";
      div.appendChild(img);

      // dblclick = edit
      div.addEventListener("dblclick", () => openEditItem(it.id));

      itemsGrid.appendChild(div);
    }
  }

  // ===== Placement logic: column-wise scanning =====
  function buildOccupancy(ignoreItemId = null) {
    const occ = Array.from({ length: currentRows }, () => Array(currentCols).fill(false));
    for (const it of itemsCache) {
      if (ignoreItemId != null && it.id === ignoreItemId) continue;

      const { rows, cols } = parseSize(it.size);
      for (let dy = 0; dy < rows; dy++) {
        for (let dx = 0; dx < cols; dx++) {
          const x = it.x + dx;
          const y = it.y + dy;
          if (x >= 0 && x < currentCols && y >= 0 && y < currentRows) {
            occ[y][x] = true;
          }
        }
      }
    }
    return occ;
  }

  function canPlaceAt(occ, x0, y0, itemRows, itemCols) {
    if (x0 < 0 || y0 < 0) return false;
    if (x0 + itemCols > currentCols) return false;
    if (y0 + itemRows > currentRows) return false;

    for (let dy = 0; dy < itemRows; dy++) {
      for (let dx = 0; dx < itemCols; dx++) {
        if (occ[y0 + dy][x0 + dx]) return false;
      }
    }
    return true;
  }

  function findFirstFitColumnWise(sizeStr, ignoreItemId = null) {
    const { rows: itemRows, cols: itemCols } = parseSize(sizeStr);
    const occ = buildOccupancy(ignoreItemId);

    for (let x = 0; x <= currentCols - itemCols; x++) {
      for (let y = 0; y <= currentRows - itemRows; y++) {
        if (canPlaceAt(occ, x, y, itemRows, itemCols)) return { x, y };
      }
    }
    return null;
  }

  // ===== Backend: rules (bärkraft + grid size) =====
  async function refreshRules() {
    const strength = Number(strengthInput?.value) || 0;
    const barformaga = Number(barformagaInput?.value) || 0;

    const res = await fetch("/api/rules/inventory-grid", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ strength, barformaga })
    });

    if (!res.ok) {
      console.error("Rules error", res.status, await res.text());
      setStatus("Rules error");
      return;
    }

    const data = await res.json();
    if (barkraftValue) barkraftValue.textContent = data.barkraft ?? 0;

    renderSlots(data.cols, data.rows);
    renderItems(itemsCache); // IMPORTANT: don’t append into slots
  }

  // ===== Character API =====
  async function loadItemsForCharacter(id) {
    const res = await fetch(`/api/characters/${id}/items`);
    if (!res.ok) {
      console.error("Load items failed", res.status, await res.text());
      return;
    }
    itemsCache = await res.json();
    renderItems(itemsCache);
  }

  async function loadCharacter(id) {
    setStatus("Loading...");
    const res = await fetch(`/api/characters/${id}`);

    if (res.status === 404) { setStatus("No character found."); return; }
    if (!res.ok) { console.error(await res.text()); setStatus("Load failed"); return; }

    const c = await res.json();
    nameInput.value = c.name ?? "";
    raceInput.value = c.race ?? "";
    xpInput.value = c.xp ?? 0;
    strengthInput.value = c.strength ?? 0;
    barformagaInput.value = c.barformaga ?? 0;

    await refreshRules();
    await loadItemsForCharacter(id);

    setStatus(`Loaded #${id}`);
  }

  async function saveCharacter() {
    setStatus("Saving...");

    const payload = {
      name: (nameInput.value || "").trim(),
      race: (raceInput.value || "").trim(),
      xp: Number(xpInput.value) || 0,
      strength: Number(strengthInput.value) || 0,
      barformaga: Number(barformagaInput.value) || 0
    };

    // Create
    if (!characterId) {
      const res = await fetch("/api/characters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        console.error("Save failed", res.status, await res.text());
        setStatus(`Save failed (${res.status})`);
        return;
      }

      const out = await res.json();
      characterId = String(out.id);

      url.searchParams.set("id", characterId);
      window.history.replaceState({}, "", url.toString());

      setStatus(`Saved new (#${characterId})`);
      return;
    }

    // Update
    const res = await fetch(`/api/characters/${characterId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      console.error("Update failed", res.status, await res.text());
      setStatus(`Update failed (${res.status})`);
      return;
    }

    setStatus(`Updated #${characterId}`);
  }

  // ===== Inventory dialog =====
  const addItemBtn = el("addItemBtn");
  const itemDialog = el("itemDialog");

  const itemIdInput = el("itemIdInput");

  const primarySelect = el("primarySelect");
  const secondarySelect = el("secondarySelect");

  const sizeSelect = el("sizeSelect");
  const magicCheck = el("magicCheck");

  const durabilityWrap = el("durabilityWrap");
  const durabilityInput = el("durabilityInput");
  const descriptionInput = el("descriptionInput");

  const iconGrid = el("iconGrid");
  const iconFileInput = el("iconFileInput");
  const iconPreview = el("iconPreview");

  const itemSaveBtn = el("itemSaveBtn");
  const itemCancelBtn = el("itemCancelBtn");

  let iconCatalog = null;

  async function loadIconCatalog() {
    if (iconCatalog) return iconCatalog;
    const res = await fetch("/api/icons/catalog");
    if (!res.ok) throw new Error(await res.text());
    iconCatalog = await res.json();
    return iconCatalog;
  }

  function clearSelect(selectEl, placeholderText) {
    selectEl.innerHTML = "";
    const opt = document.createElement("option");
    opt.value = "";
    opt.textContent = placeholderText;
    selectEl.appendChild(opt);
  }

  function fillPrimary() {
    clearSelect(primarySelect, "– Välj –");
    for (const p of (iconCatalog?.primaries ?? [])) {
      const opt = document.createElement("option");
      opt.value = p.primaryKey;
      opt.textContent = p.primaryLabel;
      primarySelect.appendChild(opt);
    }
  }

  function fillSecondary(primaryKey) {
    clearSelect(secondarySelect, "– Välj –");
    const p = (iconCatalog?.primaries ?? []).find(x => x.primaryKey === primaryKey);
    const secs = p?.secondaries ?? [];

    for (const s of secs) {
      const opt = document.createElement("option");
      opt.value = s.secondaryKey;
      opt.textContent = s.secondaryLabel;
      secondarySelect.appendChild(opt);
    }

    secondarySelect.disabled = !primaryKey;
  }

  function getIconUrl(iconObj) {
    const isMagic = !!magicCheck.checked;
    return isMagic ? (iconObj.magicUrl || iconObj.normalUrl || "") : (iconObj.normalUrl || iconObj.magicUrl || "");
  }

  function getFileNameFromUrl(u) {
    if (!u) return "";
    const ix = u.lastIndexOf("/");
    return ix >= 0 ? u.substring(ix + 1) : u;
  }

  function renderIconPicker(primaryKey, secondaryKey) {
    iconGrid.innerHTML = "";
    iconFileInput.value = "";
    iconPreview.style.display = "none";
    iconPreview.src = "";

    const p = (iconCatalog?.primaries ?? []).find(x => x.primaryKey === primaryKey);
    const s = (p?.secondaries ?? []).find(x => x.secondaryKey === secondaryKey);
    const icons = s?.icons ?? [];

    if (!icons.length) {
      const msg = document.createElement("div");
      msg.className = "hint";
      msg.textContent = "Inga ikoner hittades för vald typ/subtyp.";
      iconGrid.appendChild(msg);
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
      img.src = url;
      img.alt = iconObj.baseName;
      btn.appendChild(img);

      btn.addEventListener("click", () => {
        // store actual filename so backend can rebuild
        iconFileInput.value = getFileNameFromUrl(url);

        iconPreview.src = url;
        iconPreview.style.display = "block";

        iconGrid.querySelectorAll(".icon-tile.is-selected").forEach(x => x.classList.remove("is-selected"));
        btn.classList.add("is-selected");
      });

      iconGrid.appendChild(btn);
    }
  }

  function updateDurabilityVisibility(primaryKey) {
    const show = (primaryKey === "Armour" || primaryKey === "Shields");
    durabilityWrap.style.display = show ? "" : "none";
    if (!show) durabilityInput.value = "";
  }

  function resetItemForm() {
    itemIdInput.value = "";
    clearSelect(primarySelect, "– Välj –");
    clearSelect(secondarySelect, "– Välj –");
    secondarySelect.disabled = true;

    sizeSelect.value = "1x1";
    magicCheck.checked = false;

    durabilityInput.value = "";
    descriptionInput.value = "";

    iconFileInput.value = "";
    iconPreview.style.display = "none";
    iconPreview.src = "";
    iconGrid.innerHTML = "";

    updateDurabilityVisibility("");
  }

  function openCreateItem() {
    resetItemForm();
    itemDialog.showModal();
  }

  async function openEditItem(itemId) {
    const it = itemsCache.find(x => x.id === itemId);
    if (!it) return;

    resetItemForm();

    await loadIconCatalog();
    fillPrimary();

    primarySelect.value = it.iconPrimary || it.primary || "";
    fillSecondary(primarySelect.value);

    secondarySelect.value = it.iconSecondary || it.secondary || "";
    secondarySelect.disabled = false;

    sizeSelect.value = it.size || "1x1";
    magicCheck.checked = !!it.isMagic;

    updateDurabilityVisibility(primarySelect.value);
    durabilityInput.value = it.durability ?? "";

    descriptionInput.value = it.description ?? "";

    // Render icons and try to preselect the current one
    renderIconPicker(primarySelect.value, secondarySelect.value);

    // Try to mark selected (by filename)
    if (it.iconFile) {
      iconFileInput.value = it.iconFile;
      const url = itemIconUrl(it);
      iconPreview.src = url;
      iconPreview.style.display = "block";
    }

    itemIdInput.value = String(it.id);
    itemDialog.showModal();
  }

  async function saveItem() {
    if (!characterId) return alert("Spara karaktären först (så den får ett ID).");
    if (!currentCols || !currentRows) return alert("Ingen inventarie (Bärkraft för låg).");

    const primaryKey = primarySelect.value;
    const secondaryKey = secondarySelect.value;
    const size = sizeSelect.value || "1x1";
    const isMagic = !!magicCheck.checked;
    const iconFile = iconFileInput.value;

    if (!primaryKey) return alert("Välj Föremålstyp");
    if (!secondaryKey) return alert("Välj Subtyp");
    if (!iconFile) return alert("Välj en ikon");

    const editingId = itemIdInput.value ? Number(itemIdInput.value) : null;

    let placement = null;

    if (editingId == null) {
      placement = findFirstFitColumnWise(size);
      if (!placement) return alert("Föremålet får inte plats i inventariet.");
    } else {
      // keep old placement if still valid, otherwise re-place
      const it = itemsCache.find(x => x.id === editingId);
      if (it) {
        const { rows, cols } = parseSize(size);
        const occ = buildOccupancy(editingId);
        const ok = canPlaceAt(occ, it.x, it.y, rows, cols);
        placement = ok ? { x: it.x, y: it.y } : findFirstFitColumnWise(size, editingId);
        if (!placement) return alert("Efter ändring får föremålet inte plats i inventariet.");
      }
    }

    const dto = {
      characterId: Number(characterId),
      primary: primaryKey,
      secondary: secondaryKey,
      iconPrimary: primaryKey,
      iconSecondary: secondaryKey,
      iconFile: iconFile,
      isMagic: isMagic,
      size: size,
      durability: durabilityInput.value ? Number(durabilityInput.value) : null,
      description: descriptionInput.value || "",
      x: placement.x,
      y: placement.y
    };

    const endpoint = editingId == null
      ? `/api/characters/${characterId}/items`
      : `/api/items/${editingId}`;

    const method = editingId == null ? "POST" : "PUT";

    const res = await fetch(endpoint, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dto)
    });

    if (!res.ok) {
      console.error("Save item failed", res.status, await res.text());
      alert(`Save item failed (${res.status})`);
      return;
    }

    itemDialog.close();
    await loadItemsForCharacter(characterId);
    renderItems(itemsCache);
  }

  // Inventory UI wire-up
  if (
    addItemBtn && itemDialog &&
    primarySelect && secondarySelect &&
    iconGrid && iconFileInput && iconPreview &&
    itemSaveBtn && itemCancelBtn &&
    magicCheck && sizeSelect && descriptionInput &&
    durabilityInput // durabilityWrap är optional (se nedan)
  ) {
    addItemBtn.addEventListener("click", async () => {
      try {
        // Reset dialog UI först (så den alltid öppnar “rent”)
        openCreateItem(); // om den sätter showModal, annars se notis nedan

        await loadIconCatalog();

        fillPrimary();

        // startläge: subtyp avstängd tills primary valts
        secondarySelect.disabled = true;
        clearSelect(secondarySelect, "– Välj –");

        // nolla ikonval
        iconGrid.innerHTML = "";
        iconFileInput.value = "";
        iconPreview.style.display = "none";
      } catch (e) {
        console.error(e);
        alert("Kunde inte ladda ikon-katalogen.");
      }
    });

    primarySelect.addEventListener("change", () => {
      const pk = primarySelect.value;

      fillSecondary(pk);

      // slå på/av subtyp beroende på om primary är vald
      secondarySelect.disabled = !pk;

      updateDurabilityVisibility(pk);

      // nolla ikonval när primary byts
      iconGrid.innerHTML = "";
      iconFileInput.value = "";
      iconPreview.style.display = "none";
    });

    secondarySelect.addEventListener("change", () => {
      const pk = primarySelect.value;
      const sk = secondarySelect.value;

      if (pk && sk) {
        renderIconPicker(pk, sk);
      } else {
        iconGrid.innerHTML = "";
        iconFileInput.value = "";
        iconPreview.style.display = "none";
      }
    });

    magicCheck.addEventListener("change", () => {
      const pk = primarySelect.value;
      const sk = secondarySelect.value;
      if (pk && sk) renderIconPicker(pk, sk);
    });

    itemCancelBtn.addEventListener("click", () => itemDialog.close());
    itemSaveBtn.addEventListener("click", saveItem);
  } else {
    console.warn("[Inventory] missing dialog elements", {
      addItemBtn, itemDialog, primarySelect, secondarySelect,
      iconGrid, iconFileInput, iconPreview,
      itemSaveBtn, itemCancelBtn,
      magicCheck, sizeSelect, descriptionInput, durabilityInput
    });
  }

  // ===== Wire character events =====
  strengthInput?.addEventListener("input", refreshRules);
  barformagaInput?.addEventListener("input", refreshRules);
  saveBtn.addEventListener("click", saveCharacter);

  // ===== Initial =====
  (async () => {
    await refreshRules();
    if (characterId) await loadCharacter(characterId);
  })();

})();
