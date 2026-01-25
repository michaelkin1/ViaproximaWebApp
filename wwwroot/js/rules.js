// ===== Backend: rules (bärkraft + grid size) =====
window.refreshInventoryRules = async function refreshRules() {
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
// ===== Backend: rules control HP from stats =====
window.refreshHealthPointRules = async function refreshHealthPointRules() {
    const talighet = Number(talighetInput?.value) || 0;
    const fysisk = Number(fysiskInput?.value) || 0;

