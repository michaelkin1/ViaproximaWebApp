// api/characters.api.js
(() => {
    // robust: funkar även om vp.ns.js av någon anledning inte körts
    window.VP = window.VP || {};
    VP.api = VP.api || {};
    VP.shared = VP.shared || {};

    async function getCharacter(id) {
        return VP.shared.requestJson(`/api/characters/${id}`);
    }

    async function createCharacter(payload) {
        return VP.shared.requestJson("/api/characters", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
    }

    async function updateCharacter(id, payload) {
        return VP.shared.requestJson(`/api/characters/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
    }

    VP.api.characters = { getCharacter, createCharacter, updateCharacter };
})();
