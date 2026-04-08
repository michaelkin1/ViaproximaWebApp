// shared/csrf.js — fetches and caches the antiforgery token for the current session
(() => {
    let cachedToken = null;

    async function getCsrfToken() {
        if (cachedToken) return cachedToken;
        try {
            const res = await fetch("/antiforgery/token");
            if (!res.ok) return null; // not authenticated
            const data = await res.json();
            cachedToken = data.token;
            return cachedToken;
        } catch {
            return null;
        }
    }

    function clearCsrfToken() {
        cachedToken = null;
    }

    VP.shared.getCsrfToken = getCsrfToken;
    VP.shared.clearCsrfToken = clearCsrfToken;
})();
