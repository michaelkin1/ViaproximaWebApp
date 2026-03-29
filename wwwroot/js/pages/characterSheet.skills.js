// pages/characterSheet.skills.js
(() => {
    // ---- Dummy data (replace with API calls when backend is ready) ----
    const lardomarData = [
        { id: 1, name: "Eldmagi", level: 3, description: "Behärskande av eldbaserade besvärjelser och kontroll av lågor." },
        { id: 2, name: "Läkekonst", level: 2, description: "" },
    ];
    const evolutionerData = [
        { id: 1, name: "Drakblod", level: 1, description: "Motståndskraft mot eld och extrem hetta." },
    ];
    let nextId = 100;

    // ---- DOM refs ----
    const lardomarRows    = document.getElementById("lardomarRows");
    const evolutionerRows = document.getElementById("evolutionerRows");
    const addLardomBtn    = document.getElementById("addLardomBtn");
    const addEvolutionBtn = document.getElementById("addEvolutionBtn");
    const rowDescDialog   = document.getElementById("rowDescDialog");
    const rowDescInput    = document.getElementById("rowDescInput");
    const rowDescSaveBtn  = document.getElementById("rowDescSaveBtn");
    const rowDescCancelBtn = document.getElementById("rowDescCancelBtn");

    if (!lardomarRows || !evolutionerRows || !rowDescDialog) return;

    // ---- Description dialog ----
    let descCtx = null; // { item, btn }

    function descTooltip(item) {
        return (item.description && item.description.trim())
            ? item.description.trim()
            : "Ingen beskrivning";
    }

    function openDescDialog(item, btn) {
        descCtx = { item, btn };
        rowDescInput.value = item.description || "";
        rowDescDialog.showModal();
    }

    rowDescSaveBtn.addEventListener("click", () => {
        if (!descCtx) return;
        descCtx.item.description = rowDescInput.value;
        descCtx.btn.title = descTooltip(descCtx.item);
        rowDescDialog.close();
        descCtx = null;
    });

    rowDescCancelBtn.addEventListener("click", () => {
        rowDescDialog.close();
        descCtx = null;
    });

    // ---- Row builder ----
    function buildRow(item, dataArr, container) {
        const row = document.createElement("div");
        row.className = "skill-row";

        const nameInput = document.createElement("input");
        nameInput.type = "text";
        nameInput.className = "skill-name-input";
        nameInput.placeholder = "Namn...";
        nameInput.value = item.name;
        nameInput.addEventListener("input", () => { item.name = nameInput.value; });

        const levelInput = document.createElement("input");
        levelInput.type = "number";
        levelInput.className = "skill-level-input";
        levelInput.min = "0";
        levelInput.value = item.level;
        levelInput.addEventListener("input", () => { item.level = Number(levelInput.value) || 0; });

        const descBtn = document.createElement("button");
        descBtn.type = "button";
        descBtn.className = "btn-small skill-desc-btn";
        descBtn.textContent = "Beskr.";
        descBtn.title = descTooltip(item);
        descBtn.addEventListener("click", () => openDescDialog(item, descBtn));

        const removeBtn = document.createElement("button");
        removeBtn.type = "button";
        removeBtn.className = "btn-small skill-remove-btn";
        removeBtn.textContent = "×";
        removeBtn.title = "Ta bort";
        removeBtn.addEventListener("click", () => {
            const idx = dataArr.indexOf(item);
            if (idx !== -1) dataArr.splice(idx, 1);
            container.removeChild(row);
        });

        row.append(nameInput, levelInput, descBtn, removeBtn);
        return row;
    }

    function renderAll(dataArr, container) {
        container.innerHTML = "";
        for (const item of dataArr) {
            container.appendChild(buildRow(item, dataArr, container));
        }
    }

    // ---- Add buttons ----
    addLardomBtn.addEventListener("click", () => {
        const item = { id: nextId++, name: "", level: 1, description: "" };
        lardomarData.push(item);
        lardomarRows.appendChild(buildRow(item, lardomarData, lardomarRows));
    });

    addEvolutionBtn.addEventListener("click", () => {
        const item = { id: nextId++, name: "", level: 1, description: "" };
        evolutionerData.push(item);
        evolutionerRows.appendChild(buildRow(item, evolutionerData, evolutionerRows));
    });

    // ---- Init ----
    renderAll(lardomarData, lardomarRows);
    renderAll(evolutionerData, evolutionerRows);
})();
