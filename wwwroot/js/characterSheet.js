(function () {
    const barkraftInput = document.getElementById("barkraftInput");
    const grid = document.getElementById("inventoryGrid");

    if (!barkraftInput || !grid) {
        return;
    }

    // Map Bärkraft → { cols, rows } according to your table
    function getGridForBarkraft(barkraft) {
        const b = Number(barkraft) || 0;

        if (b < 4) return null;                      // no grid

        if (b < 6) return { cols: 3, rows: 2 };      // 4
        if (b < 8) return { cols: 4, rows: 2 };      // 6
        if (b < 10) return { cols: 4, rows: 3 };     // 8
        if (b < 12) return { cols: 5, rows: 3 };     // 10
        if (b < 14) return { cols: 5, rows: 4 };     // 12
        if (b < 16) return { cols: 6, rows: 4 };     // 14
        if (b < 18) return { cols: 6, rows: 5 };     // 16
        if (b < 20) return { cols: 6, rows: 6 };     // 18

        return { cols: 7, rows: 7 };                 // 20 and above
    }

    function renderGrid() {
        const barkraft = barkraftInput.value;
        const gridConfig = getGridForBarkraft(barkraft);

        // Clear existing
        grid.innerHTML = "";

        if (!gridConfig) {
            // No inventory for Bärkraft < 4
            const msg = document.createElement("p");
            msg.className = "no-inventory";
            msg.textContent = "Ingen inventarie (Bärkraft under 4).";
            grid.appendChild(msg);
            grid.style.gridTemplateColumns = "none";
            return;
        }

        const { cols, rows } = gridConfig;
        const totalSlots = cols * rows;

        // Set grid columns dynamically
        grid.style.gridTemplateColumns = `repeat(${cols}, 64px)`;

        for (let i = 0; i < totalSlots; i++) {
            const slot = document.createElement("div");
            slot.className = "slot";
            slot.textContent = "+";
            grid.appendChild(slot);
        }
    }

    barkraftInput.addEventListener("input", renderGrid);

    // Initial render
    renderGrid();
})();
