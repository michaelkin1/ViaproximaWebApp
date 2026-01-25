// api/rules.api.js
(() => {
    async function getInventoryGridRules(strength, barformaga) {
        return VP.shared.requestJson("/api/rules/inventory-grid", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ strength, barformaga }),
        });
    }

    VP.api.rules = { getInventoryGridRules };
})();
