// pages/characterSheet.skills.js
(() => {
    let characterId = new URL(window.location.href).searchParams.get("id");

    // ---- DOM refs ----
    const lardomarRows     = document.getElementById("lardomarRows");
    const evolutionerRows  = document.getElementById("evolutionerRows");
    const addLardomBtn     = document.getElementById("addLardomBtn");
    const addEvolutionBtn  = document.getElementById("addEvolutionBtn");
    const rowDescDialog    = document.getElementById("rowDescDialog");
    const rowDescInput     = document.getElementById("rowDescInput");
    const rowDescSaveBtn   = document.getElementById("rowDescSaveBtn");
    const rowDescCancelBtn = document.getElementById("rowDescCancelBtn");

    if (!lardomarRows || !evolutionerRows || !rowDescDialog) return;

    // ---- API helpers ----
    async function api(method, url, body) {
        const opts = { method, headers: { "Content-Type": "application/json" } };
        if (body !== undefined) opts.body = JSON.stringify(body);

        if (method !== "GET") {
            const token = await VP.shared.getCsrfToken?.();
            if (token) opts.headers["X-XSRF-TOKEN"] = token;
        }

        const res = await fetch(url, opts);
        if (res.status === 401) { window.location.href = "/Login"; throw new Error("Unauthorized"); }
        if (!res.ok) throw new Error(`${method} ${url} → ${res.status}`);
        return res.status === 204 ? null : res.json();
    }

    function toItem(dto) {
        return { id: dto.id, name: dto.namn, level: dto.niva, description: dto.beskrivning ?? "" };
    }

    function toDto(item) {
        return { namn: item.name, niva: item.level, beskrivning: item.description };
    }

    // ---- Description dialog ----
    let descCtx = null; // { item, btn, endpoint }

    function descTooltip(item) {
        return (item.description && item.description.trim())
            ? item.description.trim()
            : "Ingen beskrivning";
    }

    function openDescDialog(item, btn, endpoint) {
        descCtx = { item, btn, endpoint };
        rowDescInput.value = item.description || "";
        rowDescDialog.showModal();
    }

    rowDescSaveBtn.addEventListener("click", async () => {
        if (!descCtx) return;
        descCtx.item.description = rowDescInput.value;
        descCtx.btn.title = descTooltip(descCtx.item);
        rowDescDialog.close();
        const { item, endpoint } = descCtx;
        descCtx = null;
        await api("PUT", `${endpoint}/${item.id}`, toDto(item))
            .catch(err => console.error("PUT description failed", err));
    });

    rowDescCancelBtn.addEventListener("click", () => {
        rowDescDialog.close();
        descCtx = null;
    });

    // ---- Row builder ----
    function buildRow(item, endpoint, container) {
        const row = document.createElement("div");
        row.className = "skill-row";

        const nameInput = document.createElement("input");
        nameInput.type = "text";
        nameInput.className = "skill-name-input";
        nameInput.placeholder = "Namn...";
        nameInput.value = item.name;
        nameInput.addEventListener("input", () => { item.name = nameInput.value; });
        nameInput.addEventListener("change", () =>
            api("PUT", `${endpoint}/${item.id}`, toDto(item))
                .catch(err => console.error("PUT name failed", err)));

        const levelInput = document.createElement("input");
        levelInput.type = "number";
        levelInput.className = "skill-level-input";
        levelInput.min = "0";
        levelInput.value = item.level;
        levelInput.addEventListener("input", () => { item.level = Number(levelInput.value) || 0; });
        levelInput.addEventListener("change", () =>
            api("PUT", `${endpoint}/${item.id}`, toDto(item))
                .catch(err => console.error("PUT level failed", err)));

        const descBtn = document.createElement("button");
        descBtn.type = "button";
        descBtn.className = "btn-small skill-desc-btn";
        descBtn.textContent = "Beskr.";
        descBtn.title = descTooltip(item);
        descBtn.addEventListener("click", () => openDescDialog(item, descBtn, endpoint));

        const removeBtn = document.createElement("button");
        removeBtn.type = "button";
        removeBtn.className = "btn-small skill-remove-btn";
        removeBtn.textContent = "×";
        removeBtn.title = "Ta bort";
        removeBtn.addEventListener("click", async () => {
            await api("DELETE", `${endpoint}/${item.id}`)
                .catch(err => console.error("DELETE failed", err));
            container.removeChild(row);
        });

        row.append(nameInput, levelInput, descBtn, removeBtn);
        return row;
    }

    function renderAll(items, endpoint, container) {
        container.innerHTML = "";
        for (const item of items) {
            container.appendChild(buildRow(item, endpoint, container));
        }
    }

    // ---- Add buttons ----
    addLardomBtn.addEventListener("click", async () => {
        const item = { name: "", level: 1, description: "" };
        const result = await api("POST", `/api/characters/${characterId}/lardomar`, toDto(item))
            .catch(err => console.error("POST lärdom failed", err));
        if (!result) return;
        item.id = result.id;
        lardomarRows.appendChild(buildRow(item, "/api/lardomar", lardomarRows));
    });

    addEvolutionBtn.addEventListener("click", async () => {
        const item = { name: "", level: 1, description: "" };
        const result = await api("POST", `/api/characters/${characterId}/evolutioner`, toDto(item))
            .catch(err => console.error("POST evolution failed", err));
        if (!result) return;
        item.id = result.id;
        evolutionerRows.appendChild(buildRow(item, "/api/evolutioner", evolutionerRows));
    });

    // ---- Init (load from API) ----
    async function init() {
        if (!characterId) return;
        const [lardomar, evolutioner] = await Promise.all([
            api("GET", `/api/characters/${characterId}/lardomar`),
            api("GET", `/api/characters/${characterId}/evolutioner`),
        ]).catch(err => { console.error("Load skills failed", err); return [[], []]; });
        renderAll((lardomar || []).map(toItem), "/api/lardomar", lardomarRows);
        renderAll((evolutioner || []).map(toItem), "/api/evolutioner", evolutionerRows);

        // Hide add/edit controls for unauthenticated viewers
        const auth = await VP.shared.getAuthState?.();
        if (!auth?.isAuthenticated) {
            if (addLardomBtn)    addLardomBtn.style.display    = "none";
            if (addEvolutionBtn) addEvolutionBtn.style.display = "none";
            lardomarRows.querySelectorAll(".skill-remove-btn, .skill-desc-btn").forEach(b => b.style.display = "none");
            evolutionerRows.querySelectorAll(".skill-remove-btn, .skill-desc-btn").forEach(b => b.style.display = "none");
        }
    }

    init();

    VP.sheet = VP.sheet || {};
    VP.sheet.skills = {
        reload: async function(newId) {
            characterId = String(newId);
            await init();
        }
    };
})();
