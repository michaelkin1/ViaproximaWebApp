// api/pets.api.js
(() => {
    async function getPetsForCharacter(characterId) {
        return VP.shared.requestJson(`/api/characters/${characterId}/pets`);
    }

    async function createPet(characterId, dto) {
        return VP.shared.requestJson(`/api/characters/${characterId}/pets`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(dto),
        });
    }

    async function updatePet(petId, dto) {
        return VP.shared.requestJson(`/api/pets/${petId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(dto),
        });
    }

    async function deletePet(petId) {
        return VP.shared.requestJson(`/api/pets/${petId}`, { method: "DELETE" });
    }

    VP.api.pets = { getPetsForCharacter, createPet, updatePet, deletePet };
})();
