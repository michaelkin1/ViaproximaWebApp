// api/pets.icons.api.js
VP.api = VP.api || {};
VP.api.petsIcons = (() => {
    let _cache = null;

    async function getIcons() {
        if (_cache) return _cache;
        _cache = await VP.shared.requestJson("/api/pets/icons");
        return _cache;
    }

    return { getIcons };
})();
