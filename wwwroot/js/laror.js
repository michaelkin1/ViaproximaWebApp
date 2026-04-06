// laror.js
(() => {
    const tabBtns   = document.querySelectorAll(".laror-tab-btn");
    const tabPanels = document.querySelectorAll(".laror-tab-content");

    if (!tabBtns.length) return;

    tabBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            const target = btn.dataset.tab;

            tabBtns.forEach(b => b.classList.toggle("laror-tab-btn--active", b === btn));
            tabPanels.forEach(p => {
                p.style.display = p.id === `tab-${target}` ? "" : "none";
            });

            if (btn.dataset.bg) {
                document.body.style.backgroundImage = btn.dataset.bg;
            }
        });
    });
})();
