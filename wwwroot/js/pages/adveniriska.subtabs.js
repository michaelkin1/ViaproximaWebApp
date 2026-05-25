(() => {
    const subBtns     = document.querySelectorAll('.adv-sub-btn');
    const loreBtns    = document.querySelectorAll('.adv-lore-btn');
    const lorePanels  = document.querySelectorAll('[data-lore-panel]');
    const subPanels   = document.querySelectorAll('[data-adv-panel]');
    const loreBar     = document.getElementById('advLoreBar');
    const regelPanel  = document.getElementById('advKristallsejdareRegler');
    const loreBgClasses = ['lore-bg-rod','lore-bg-gron','lore-bg-gul','lore-bg-lila','lore-bg-orange','lore-bg-bla'];

    let activeLore = null;

    function clearLoreBg() {
        document.body.classList.remove(...loreBgClasses);
    }

    function showRegler() {
        activeLore = null;
        loreBtns.forEach(b => b.classList.remove('active'));
        lorePanels.forEach(p => { p.style.display = 'none'; });
        if (regelPanel) regelPanel.style.display = '';
        clearLoreBg();
    }

    function activateLore(key) {
        activeLore = key;
        loreBtns.forEach(b => b.classList.toggle('active', b.dataset.lore === key));
        lorePanels.forEach(p => { p.style.display = p.dataset.lorePanel === key ? '' : 'none'; });
        if (regelPanel) regelPanel.style.display = 'none';
        clearLoreBg();
        document.body.classList.add('lore-bg-' + key);
    }

    function activateSubtab(key) {
        subBtns.forEach(b => b.classList.toggle('active', b.dataset.adv === key));
        if (key === 'kristallsejdare') {
            if (loreBar) loreBar.style.display = '';
            subPanels.forEach(p => { p.style.display = 'none'; });
            showRegler();
        } else {
            if (loreBar) loreBar.style.display = 'none';
            lorePanels.forEach(p => { p.style.display = 'none'; });
            if (regelPanel) regelPanel.style.display = 'none';
            subPanels.forEach(p => { p.style.display = p.dataset.advPanel === key ? '' : 'none'; });
            clearLoreBg();
        }
    }

    subBtns.forEach(btn => btn.addEventListener('click', () => activateSubtab(btn.dataset.adv)));
    loreBtns.forEach(btn => btn.addEventListener('click', () => activateLore(btn.dataset.lore)));

    // Initial state: Kristallsejdare active, regler shown (no lore active)
    if (subBtns.length) activateSubtab('kristallsejdare');
})();
