// grid/placement.js
(() => {
    function parseSize(sizeStr) {
        const m = /^(\d+)x(\d+)$/i.exec((sizeStr || "").trim());
        if (!m) return { rows: 1, cols: 1 };
        return { rows: Number(m[1]) || 1, cols: Number(m[2]) || 1 };
    }

    function buildOccupancy(items, currentCols, currentRows, ignoreItemId = null) {
        const occ = Array.from({ length: currentRows }, () => Array(currentCols).fill(false));

        for (const it of items) {
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

    function canPlaceAt(occ, x0, y0, itemRows, itemCols, currentCols, currentRows) {
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

    function findFirstFitColumnWise(sizeStr, items, currentCols, currentRows, ignoreItemId = null) {
        const { rows: itemRows, cols: itemCols } = parseSize(sizeStr);
        const occ = buildOccupancy(items, currentCols, currentRows, ignoreItemId);

        for (let x = 0; x <= currentCols - itemCols; x++) {
            for (let y = 0; y <= currentRows - itemRows; y++) {
                if (canPlaceAt(occ, x, y, itemRows, itemCols, currentCols, currentRows)) return { x, y };
            }
        }
        return null;
    }

    VP.grid.placement = { parseSize, buildOccupancy, canPlaceAt, findFirstFitColumnWise };
})();
