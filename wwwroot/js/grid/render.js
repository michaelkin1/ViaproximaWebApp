// grid/render.js
(() => {
    const SLOT = 64; // matchar CSS

    function setGridTemplate(slotsGrid, itemsGrid, cols, rows) {
        const template = `repeat(${cols}, ${SLOT}px)`;
        slotsGrid.style.gridTemplateColumns = template;
        itemsGrid.style.gridTemplateColumns = template;
        slotsGrid.style.gridAutoRows = `${SLOT}px`;
        itemsGrid.style.gridAutoRows = `${SLOT}px`;
    }

    function renderSlots(slotsGrid, itemsGrid, state, cols, rows) {
        slotsGrid.innerHTML = "";

        if (!cols || !rows) {
            state.currentCols = 0;
            state.currentRows = 0;

            const msg = document.createElement("p");
            msg.className = "no-inventory";
            msg.textContent = "Ingen inventarie (Bärkraft under 4).";
            slotsGrid.appendChild(msg);

            itemsGrid.innerHTML = "";
            return;
        }

        state.currentCols = cols;
        state.currentRows = rows;

        setGridTemplate(slotsGrid, itemsGrid, cols, rows);

        const total = cols * rows;
        for (let i = 0; i < total; i++) {
            const slot = document.createElement("div");
            slot.className = "slot";
            slotsGrid.appendChild(slot);
        }
    }

    function buildTooltip(it) {
        const lines = [];
        if (it.name && it.name.trim()) lines.push(it.name.trim());

        const magic = it.isMagic ? " • Magisk" : "";
        lines.push(`Storlek: ${it.size ?? "1x1"}${magic}`);

        if (it.durability != null) lines.push(`Hållbarhet: ${it.durability}`);

        if (it.description && it.description.trim()) {
            lines.push("");
            lines.push(it.description.trim());
        }

        return lines.join("\n");
    }

    function itemIconUrl(it) {
        if (!it.iconPrimary || !it.iconFile) return "";
        if (!it.iconSecondary || it.iconSecondary === "_root") {
            return `/Icons/${it.iconPrimary}/${it.iconFile}`;
        }
        return `/Icons/${it.iconPrimary}/${it.iconSecondary}/${it.iconFile}`;
    }

    function renderItems(itemsGrid, state, items, onDblClick) {
        itemsGrid.innerHTML = "";
        if (!state.currentCols || !state.currentRows) return;

        for (const it of items) {
            const { rows, cols } = VP.grid.placement.parseSize(it.size);

            const div = document.createElement("div");
            div.className = "inv-item";
            div.dataset.itemId = it.id;
            div.title = buildTooltip(it);

            div.style.gridColumn = `${it.x + 1} / span ${cols}`;
            div.style.gridRow = `${it.y + 1} / span ${rows}`;

            const img = document.createElement("img");
            img.src = itemIconUrl(it);
            img.alt = (it.name && it.name.trim()) ? it.name.trim() : (it.iconFile || "item");
            div.appendChild(img);

            div.addEventListener("dblclick", () => onDblClick(it.id));

            if (it.name && it.name.trim()) {
                const tag = document.createElement("div");
                tag.className = "inv-item-name";
                tag.textContent = it.name.trim();
                div.appendChild(tag);
            }

            itemsGrid.appendChild(div);
        }
    }

    VP.grid.render = { renderSlots, renderItems, itemIconUrl };
})();
