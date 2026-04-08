// shared/auth.js — fetches and caches auth state from /api/auth/me
(() => {
    let authState = null;

    async function getAuthState() {
        if (authState) return authState;
        try {
            const res = await fetch("/api/auth/me");
            authState = await res.json();
        } catch {
            authState = { isAuthenticated: false, username: null, role: null };
        }
        return authState;
    }

    function clearAuthState() {
        authState = null;
    }

    VP.shared.getAuthState = getAuthState;
    VP.shared.clearAuthState = clearAuthState;
})();
