// shared/ui.js
(() => {
    function setText(el, msg) {
        if (el) el.textContent = msg ?? "";
    }

    // Minimal “friendly” feltext baserat på statuskod
    function describeHttpError(err) {
        const s = err?.status;
        if (s === 401) return "Du måste logga in för att göra detta.";
        if (s === 403) return "Du saknar behörighet för detta.";
        if (s === 404) return "Hittade inte det du sökte.";
        if (s === 409) return "Konflikt: gräns/regel uppfylld (t.ex. max antal).";
        if (s === 400) return "Ogiltig indata. Kontrollera fälten och försök igen.";
        return "Något gick fel. Försök igen.";
    }

    VP.shared.ui = {
        setText,
        describeHttpError,
    };
})();
