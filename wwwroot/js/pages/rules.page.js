(() => {
    const tabBtns    = document.querySelectorAll('.tab-btn');
    const tabPanels  = document.querySelectorAll('.tab-content');
    const loreSubBar = document.getElementById('loreSubBar');
    const loreBtns   = document.querySelectorAll('.lore-sub-btn');
    const lorePanels = document.querySelectorAll('.lore-panel');
    const cardTitle  = document.getElementById('cardTitle');

    const titleMap = { spelarbok: 'Rules', poangkostnader: 'Poängkostnader', laror: 'Läror' };
    const loreBgMap = {
        roda:    "url('/Images/Lores/RedFS.png')",
        grona:   "url('/Images/Lores/GreenPA.png')",
        gula:    "url('/Images/Lores/YellowLH.png')",
        lila:    "url('/Images/Lores/PurpleNL.png')",
        orangea: "url('/Images/Lores/OrangeSS.png')",
        blaa:    "url('/Images/Lores/BlueWW.png')",
    };

    let lastLore = loreBtns.length ? loreBtns[0].dataset.lore : null;
    let activeMain = 'spelarbok';

    function setBodyBg(key) {
        document.body.style.backgroundImage = loreBgMap[key] || '';
        document.body.style.backgroundSize = 'cover';
        document.body.style.backgroundPosition = 'center';
        document.body.style.backgroundAttachment = 'fixed';
        document.body.classList.add('lore-bg-active');
    }

    function clearBodyBg() {
        document.body.style.backgroundImage = '';
        document.body.classList.remove('lore-bg-active');
    }

    function activateLore(key) {
        lastLore = key;
        loreBtns.forEach(b => b.classList.toggle('lore-sub-btn--active', b.dataset.lore === key));
        lorePanels.forEach(p => { p.style.display = p.id === `lore-${key}` ? '' : 'none'; });
        if (activeMain === 'laror') setBodyBg(key);
    }

    function activateTab(key) {
        activeMain = key;
        tabBtns.forEach(b => b.classList.toggle('tab-btn--active', b.dataset.tab === key));
        tabPanels.forEach(p => { p.style.display = p.id === `tab-${key}` ? '' : 'none'; });
        if (loreSubBar) loreSubBar.style.display = key === 'laror' ? '' : 'none';
        if (cardTitle) cardTitle.textContent = titleMap[key] ?? 'Rules';
        if (key === 'laror' && lastLore) {
            activateLore(lastLore);
        } else {
            clearBodyBg();
        }
    }

    tabBtns.forEach(btn => btn.addEventListener('click', () => activateTab(btn.dataset.tab)));
    loreBtns.forEach(btn => btn.addEventListener('click', () => activateLore(btn.dataset.lore)));

    if (lastLore) activateLore(lastLore);
})();
