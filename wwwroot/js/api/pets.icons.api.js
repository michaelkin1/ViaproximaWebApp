// api/pets.icons.api.js
VP.api = VP.api || {};
VP.api.petsIcons = (() => {
    let _cache = null;
    let _iconsCache = null;

    async function getCatalog() {
        if (_cache) return _cache;
        _cache = await VP.shared.requestJson("/api/pets/icons/catalog");
        return _cache;
    }

    async function getIcons() {
        if (_iconsCache) return _iconsCache;
        _iconsCache = await VP.shared.requestJson("/api/pets/icons");
        return _iconsCache;
    }

    return { getCatalog, getIcons };
})();
