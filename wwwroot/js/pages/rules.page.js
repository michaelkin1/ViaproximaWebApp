(function () {
    'use strict';

    var titleMap = {
        'spelarbok':      'Spelarbok',
        'livstrid':       'Liv & Strid',
        'kristallsejdare':'Kristallsejdare',
        'lore-rod':       'Röd Vrede',
        'lore-gron':      'Grön Skam',
        'lore-gul':       'Gul Lycka',
        'lore-lila':      'Lila Stolthet',
        'lore-orange':    'Orange Kärlek',
        'lore-bla':       'Blå Sorg',
        'shamaner':       'Shamaner',
        'lyadskapare':    'Lyådskapare',
        'lyad-kontroll':  'Kontroll',
        'lyad-lasning':   'Läsning',
        'lyad-flykt':     'Flykt',
        'orakel':         'Orakel'
    };

    // Keys that are internal subtabs inside the lyadskapare panel
    var lyadsKeys = { 'lyad-kontroll': 'kontroll', 'lyad-lasning': 'lasning', 'lyad-flykt': 'flykt' };

    function getPanelKey(key) {
        return lyadsKeys.hasOwnProperty(key) ? 'lyadskapare' : key;
    }

    function activateLyadsSubtab(subKey) {
        var panel = document.getElementById('panel-lyadskapare');
        if (!panel) return;
        var overview  = panel.querySelector('#lyadskapare-overview');
        var subWrap   = panel.querySelector('#lyadskapare-sub-panels');
        var subPanels = panel.querySelectorAll('#lyadskapare-kontroll, #lyadskapare-lasning, #lyadskapare-flykt');

        if (overview) overview.style.display = 'none';
        if (subWrap)  subWrap.style.display  = '';
        subPanels.forEach(function (p) {
            p.style.display = (p.id === 'lyadskapare-' + subKey) ? '' : 'none';
        });
    }

    function activate(key) {
        var panelKey = getPanelKey(key);

        // Hide all panels
        var content = document.querySelector('.rules-content');
        if (!content) return;
        content.querySelectorAll(':scope > div').forEach(function (p) { p.style.display = 'none'; });

        // Show target panel
        var target = document.getElementById('panel-' + panelKey);
        if (target) target.style.display = '';

        // When navigating to the lyadskapare parent, reset to overview
        if (key === 'lyadskapare') {
            var overview = document.getElementById('lyadskapare-overview');
            var subWrap  = document.getElementById('lyadskapare-sub-panels');
            if (overview) overview.style.display = '';
            if (subWrap)  subWrap.style.display  = 'none';
        }

        // If a lyad subtab key, trigger its internal panel
        if (lyadsKeys.hasOwnProperty(key)) {
            var lyadsInternalKey = lyadsKeys[key];
            var btn = target && target.querySelector('[data-lyads="' + lyadsInternalKey + '"]');
            if (btn) btn.click();
        }

        // Update sidebar active state
        document.querySelectorAll('[data-rules-key]').forEach(function (el) {
            el.classList.remove('is-active');
        });
        var activeRow = document.querySelector('[data-rules-key="' + key + '"]');
        if (activeRow) activeRow.classList.add('is-active');

        // Update card title
        var cardTitle = document.getElementById('cardTitle');
        if (cardTitle && titleMap[key]) cardTitle.textContent = titleMap[key];

        // URL hash (no scroll jump)
        try { history.replaceState(null, '', '#' + key); } catch (e) {}

        buildToc(panelKey);
    }

    function buildToc(panelKey) {
        var toc = document.getElementById('rules-toc');
        if (!toc) return;

        var tocList = toc.querySelector('.vp-toc__list');
        var panel = document.getElementById('panel-' + panelKey);
        var headings = panel ? panel.querySelectorAll('h2[id], h3[id]') : [];

        if (headings.length < 2) {
            toc.classList.add('is-hidden');
            return;
        }

        toc.classList.remove('is-hidden');
        if (tocList) tocList.querySelectorAll('.vp-toc__item').forEach(function (el) { el.remove(); });

        headings.forEach(function (h) {
            var a = document.createElement('a');
            a.className = 'vp-toc__item' + (h.tagName === 'H3' ? ' vp-toc__item--h3' : '');
            a.href = '#' + h.id;
            a.textContent = h.textContent;
            if (tocList) tocList.appendChild(a);
        });

        if (window._rulesObserver) window._rulesObserver.disconnect();
        var items = tocList ? tocList.querySelectorAll('.vp-toc__item') : [];
        window._rulesObserver = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                items.forEach(function (a) { a.classList.remove('is-active'); });
                var match = toc.querySelector('a[href="#' + entry.target.id + '"]');
                if (match) match.classList.add('is-active');
            });
        }, { rootMargin: '-10% 0px -80% 0px' });
        headings.forEach(function (h) { window._rulesObserver.observe(h); });
    }

    function handleAccordionToggle(toggleEl) {
        var accordion = toggleEl.closest('.vp-sidenav__accordion');
        if (!accordion) return;

        var isExpanded = accordion.classList.contains('is-expanded');

        document.querySelectorAll('.vp-sidenav__accordion').forEach(function (a) {
            a.classList.remove('is-expanded');
        });

        if (!isExpanded) {
            accordion.classList.add('is-expanded');
        }

        var key = toggleEl.getAttribute('data-rules-key');
        if (key) activate(key);
    }

    document.addEventListener('DOMContentLoaded', function () {
        document.querySelectorAll('[data-rules-key]').forEach(function (el) {
            el.addEventListener('click', function (e) {
                e.preventDefault();
                if (el.classList.contains('vp-sidenav__accordion-toggle')) {
                    handleAccordionToggle(el);
                } else {
                    activate(el.getAttribute('data-rules-key'));
                }
            });
        });

        // Lyadskapare internal subtab buttons
        document.querySelectorAll('.lyads-subtab-btn').forEach(function (btn) {
            btn.addEventListener('click', function () {
                activateLyadsSubtab(btn.getAttribute('data-lyads'));
            });
        });

        // Overview inriktning links → navigate via sidebar activate
        document.querySelectorAll('.lyads-inriktning-link').forEach(function (link) {
            link.addEventListener('click', function (e) {
                e.preventDefault();
                activate('lyad-' + link.getAttribute('data-inriktning'));
            });
        });

        var hash = location.hash ? location.hash.slice(1) : '';
        var initialKey = (hash && titleMap.hasOwnProperty(hash)) ? hash : 'spelarbok';

        // Expand the right accordion for the initial key
        if (initialKey === 'kristallsejdare' || initialKey.indexOf('lore-') === 0) {
            var ksAcc = document.querySelector('[data-accordion="kristallsejdare"]');
            if (ksAcc) ksAcc.classList.add('is-expanded');
        } else if (initialKey === 'lyadskapare' || initialKey.indexOf('lyad-') === 0) {
            var lyadsAcc = document.querySelector('[data-accordion="lyadskapare"]');
            if (lyadsAcc) lyadsAcc.classList.add('is-expanded');
        }

        activate(initialKey);
    });
}());
