// pages/rules.page.js
(() => {
    const tabBtns   = document.querySelectorAll(".tab-btn");
    const tabPanels = document.querySelectorAll(".tab-content");

    if (!tabBtns.length) return;

    tabBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            const target = btn.dataset.tab;

            tabBtns.forEach(b => b.classList.toggle("tab-btn--active", b === btn));
            tabPanels.forEach(p => {
                p.style.display = p.id === `tab-${target}` ? "" : "none";
            });
        });
    });
})();
