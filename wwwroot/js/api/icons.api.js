// api/icons.api.js
(() => {
    let _cache = null;

    async function getIconCatalog() {
        if (_cache) return _cache;
        _cache = await VP.shared.requestJson("/api/icons/catalog");
        return _cache;
    }

    VP.api.icons = { getIconCatalog };
})();
