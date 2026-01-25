// shared/http.js
(() => {
    /**
     * Standardiserat felobjekt för API.
     * status: HTTP statuskod
     * data: parsed JSON om möjligt
     * text: raw text om JSON ej gick
     */
    async function requestJson(url, options = {}) {
        const res = await fetch(url, options);

        // Försök läsa JSON, annars text
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

        return data; // kan vara null om endpoint ej returnerar json
    }

    VP.shared.requestJson = requestJson;
})();
