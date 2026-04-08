// shared/http.js
(() => {
    async function requestJson(url, options = {}) {
        const method = (options.method || "GET").toUpperCase();

        // Inject CSRF token for mutating requests
        if (method !== "GET" && method !== "HEAD") {
            const token = await VP.shared.getCsrfToken?.();
            if (token) {
                options.headers = options.headers || {};
                options.headers["X-XSRF-TOKEN"] = token;
            }
        }

        const res = await fetch(url, options);

        // Redirect to login on 401
        if (res.status === 401) {
            window.location.href = "/Login";
            throw new Error("Unauthorized");
        }

        const contentType = res.headers.get("content-type") || "";
        let data = null;
        let text = null;

        if (contentType.includes("application/json")) {
            try { data = await res.json(); } catch { /* ignore */ }
        } else {
            try { text = await res.text(); } catch { /* ignore */ }
        }

        if (!res.ok) {
            const err = new Error(`HTTP ${res.status}`);
            err.status = res.status;
            err.data = data;
            err.text = text;
            throw err;
        }

        return data;
    }

    VP.shared.requestJson = requestJson;
})();
