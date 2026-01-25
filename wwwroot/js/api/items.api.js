// api/items.api.js
(() => {
    async function getItemsForCharacter(characterId) {
        return VP.shared.requestJson(`/api/characters/${characterId}/items`);
    }

    async function createItem(characterId, dto) {
        return VP.shared.requestJson(`/api/characters/${characterId}/items`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(dto),
        });
    }

    async function updateItem(itemId, dto) {
        return VP.shared.requestJson(`/api/items/${itemId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(dto),
        });
    }

    async function deleteItem(itemId) {
        return VP.shared.requestJson(`/api/items/${itemId}`, { method: "DELETE" });
    }

    VP.api.items = { getItemsForCharacter, createItem, updateItem, deleteItem };
})();
