// grid/render.js
(() => {
    const SLOT = 64; // matchar CSS
    const MAGIC_COLOR = "#ff69b4";
    const blobUrlMap = new Map(); // maps original src -> blob URL

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

        if (it.typeKey && it.typeKey.trim()) lines.push(`Tamdjurstyp: ${it.typeKey.trim()}`);

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
        if (it.iconUrl) return it.iconUrl;
        if (!it.iconPrimary || !it.iconFile) return "";
        const file = it.iconFile.replace(/_magic(\.[^.]+)$/i, "$1");
        if (!it.iconSecondary || it.iconSecondary === "_root") {
            return `/IconsItems/${it.iconPrimary}/${file}`;
        }
        return `/IconsItems/${it.iconPrimary}/${it.iconSecondary}/${file}`;
    }

    async function tintSvgToMagic(originalSrc) {
        if (!originalSrc || !originalSrc.endsWith(".svg")) return originalSrc;
        if (blobUrlMap.has(originalSrc)) return blobUrlMap.get(originalSrc);

        try {
            const response = await fetch(originalSrc);
            let svgText = await response.text();

            svgText = svgText.replace(/fill="white"/gi, `fill="${MAGIC_COLOR}"`);
            svgText = svgText.replace(/fill="#fff"/gi, `fill="${MAGIC_COLOR}"`);
            svgText = svgText.replace(/fill="#ffffff"/gi, `fill="${MAGIC_COLOR}"`);

            const blob = new Blob([svgText], { type: "image/svg+xml" });
            const blobUrl = URL.createObjectURL(blob);
            blobUrlMap.set(originalSrc, blobUrl);
            return blobUrl;
        } catch (err) {
            console.error("Failed to tint SVG:", originalSrc, err);
            return originalSrc;
        }
    }

    function revokeMagicTint(originalSrc) {
        if (blobUrlMap.has(originalSrc)) {
            URL.revokeObjectURL(blobUrlMap.get(originalSrc));
            blobUrlMap.delete(originalSrc);
        }
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
            const originalSrc = itemIconUrl(it);
            img.dataset.originalSrc = originalSrc;
            img.alt = (it.name && it.name.trim()) ? it.name.trim() : (it.iconFile || "item");

            if (it.isMagic && originalSrc.endsWith(".svg")) {
                tintSvgToMagic(originalSrc).then(tintedSrc => {
                    img.src = tintedSrc;
                });
            } else {
                img.src = originalSrc;
            }
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

    VP.grid.render = { renderSlots, renderItems, itemIconUrl, tintSvgToMagic, revokeMagicTint };
})();
