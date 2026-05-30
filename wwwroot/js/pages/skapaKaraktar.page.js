(function () {
    'use strict';

    var titleMap = {
        'egenskaper':     'Egenskaper',
        'poangkostnader': 'Poängkostnader'
    };

    function activate(key) {
        var content = document.querySelector('.rules-content');
        if (!content) return;
        content.querySelectorAll(':scope > div').forEach(function (p) { p.style.display = 'none'; });

        var target = document.getElementById('panel-' + key);
        if (target) target.style.display = '';

        document.querySelectorAll('[data-rules-key]').forEach(function (el) {
            el.classList.remove('is-active');
        });
        var activeRow = document.querySelector('[data-rules-key="' + key + '"]');
        if (activeRow) activeRow.classList.add('is-active');

        var cardTitle = document.getElementById('cardTitle');
        if (cardTitle && titleMap[key]) cardTitle.textContent = titleMap[key];

        try { history.replaceState(null, '', '#' + key); } catch (e) {}

        buildToc(key);
    }

    function buildToc(key) {
        var toc = document.getElementById('rules-toc');
        if (!toc) return;

        var tocList = toc.querySelector('.vp-toc__list');
        var panel = document.getElementById('panel-' + key);
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

        if (window._skapaObserver) window._skapaObserver.disconnect();
        var items = tocList ? tocList.querySelectorAll('.vp-toc__item') : [];
        window._skapaObserver = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                items.forEach(function (a) { a.classList.remove('is-active'); });
                var match = toc.querySelector('a[href="#' + entry.target.id + '"]');
                if (match) match.classList.add('is-active');
            });
        }, { rootMargin: '-10% 0px -80% 0px' });
        headings.forEach(function (h) { window._skapaObserver.observe(h); });
    }

    document.addEventListener('DOMContentLoaded', function () {
        document.querySelectorAll('[data-rules-key]').forEach(function (el) {
            el.addEventListener('click', function (e) {
                e.preventDefault();
                activate(el.getAttribute('data-rules-key'));
            });
        });

        var hash = location.hash ? location.hash.slice(1) : '';
        var initialKey = (hash && titleMap.hasOwnProperty(hash)) ? hash : 'egenskaper';
        activate(initialKey);
    });
}());
