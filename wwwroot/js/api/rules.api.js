// api/rules.api.js
(() => {
    async function getInventoryGridRules(strength, barformaga) {
        return VP.shared.requestJson("/api/rules/inventory-grid", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ strength, barformaga }),
        });
    }

    async function getHpRules(talighet, fysisk) {
        return VP.shared.requestJson("/api/rules/hp", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ talighet, fysisk }),
        });
    }

    VP.api.rules = { getInventoryGridRules, getHpRules };
})();
