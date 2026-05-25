(() => {
    const tabBtns   = document.querySelectorAll('.tab-btn');
    const tabPanels = document.querySelectorAll('.tab-content');
    const cardTitle = document.getElementById('cardTitle');

    const titleMap = {
        spelarbok:      'Rules',
        poangkostnader: 'Poångkostnader',
        adveniriska:    'De fyra Adveniriska lärdomarna',
        livstrid:       'Liv & Strid'
    };

    function resetLyadskapare() {
        const ov = document.getElementById('lyadskapare-overview');
        const sw = document.getElementById('lyadskapare-sub-panels');
        if (ov) ov.style.display = '';
        if (sw) sw.style.display = 'none';
        document.querySelectorAll('#lyadskapare-sub-panels > div').forEach(p => { p.style.display = 'none'; });
        document.querySelectorAll('[data-lyads]').forEach(b => b.classList.remove('active'));
    }

    function activateLyadsSubtab(key) {
        const sw  = document.getElementById('lyadskapare-sub-panels');
        const ov  = document.getElementById('lyadskapare-overview');
        if (ov) ov.style.display = 'none';
        if (sw) sw.style.display = '';
        document.querySelectorAll('#lyadskapare-sub-panels > div').forEach(p => { p.style.display = 'none'; });
        const panel = document.getElementById('lyadskapare-' + key);
        if (panel) panel.style.display = '';
        document.querySelectorAll('[data-lyads]').forEach(b => b.classList.toggle('active', b.dataset.lyads === key));
    }

    function activateTab(key) {
        tabBtns.forEach(b => b.classList.toggle('tab-btn--active', b.dataset.tab === key));
        tabPanels.forEach(p => { p.style.display = p.id === `tab-${key}` ? '' : 'none'; });
        if (cardTitle) cardTitle.textContent = titleMap[key] ?? 'Rules';
        resetLyadskapare();
    }

    tabBtns.forEach(btn => btn.addEventListener('click', () => activateTab(btn.dataset.tab)));

    const lyadsAdvBtn = document.querySelector('[data-adv="lyadskapare"]');
    if (lyadsAdvBtn) lyadsAdvBtn.addEventListener('click', resetLyadskapare);

    document.querySelectorAll('[data-lyads]').forEach(btn => btn.addEventListener('click', () => activateLyadsSubtab(btn.dataset.lyads)));
    document.querySelectorAll('.lyads-inriktning-link').forEach(a => a.addEventListener('click', e => { e.preventDefault(); activateLyadsSubtab(a.dataset.inriktning); }));
})();
