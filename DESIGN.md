# DESIGN.md — Viaproxima Design System

Read this before touching any `.css` or `.cshtml` file.

---

## Golden rules

- **Additive CSS only.** Append new rules at the bottom of the relevant file. Never modify existing rules.
- **No new frameworks.** Vanilla CSS and JS only.
- **Token-first.** Use the CSS variables below, not hardcoded hex values.
- **One CSS file per page** under `wwwroot/css/pages/<page>.css`. Global tokens live in `wwwroot/css/site.css` or `vp-tome.css`.

---

## CSS tokens

Defined in `wwwroot/css/site.css` (or `vp-tome.css` — check which is loaded first):

| Token | Value | Use |
|---|---|---|
| `--paper` | `#f6f0e4` | Primary parchment background |
| `--paper-2` | `#ede5d4` | Secondary / deeper parchment |
| `--ink` | `#2b241c` | Body text |
| `--muted` | `#6b5b47` | Captions, secondary text |
| `--muted-2` | `#8a7a62` | Labels, table headers |
| `--border` | `#d5c7ad` | Dividers, card borders |
| `--gold` | `#a8935e` | Accent gold — dividers, active states |
| `--gold-soft` | `#c9b990` | Soft gold — hover, subtle highlights |
| `--gold-deep` | `#7a6638` | Dark gold — TOC active, headers |

### Sidebar / leather palette (vp-sidenav only)

| Token | Value | Use |
|---|---|---|
| `--leather-1` | `#54401f` | Sidebar bg top |
| `--leather-2` | `#3e2d14` | Sidebar bg mid |
| `--leather-3` | `#322310` | Sidebar bg bottom |
| `--leather-edge` | `#6b4e2a` | Sidebar border, scrollbar thumb |
| `--cream` | `#fbedc8` | Sidebar text |
| `--cream-soft` | `#ede0bd` | Sidebar secondary text |
| `--cream-mid` | `#f0d999` | Sidebar active item text |

---

## Typography

| Font | Use |
|---|---|
| Cinzel | Headings, group titles, active nav items, stone callouts |
| EB Garamond | Italic eyebrows, taglines, TOC items, sidebar secondary text |
| Libre Baskerville | Body copy inside `.vp-tome` |

Load via Google Fonts (already in layout). Do not add new font imports.

---

## Layout system — the five chrome components

Used on `/Regler` and `/SkapaKaraktar`. Wire these up when building any new three-column page.

### 1. `.vp-dot-rule` — gold filigree divider between navbar and content
```html
<div class="vp-dot-rule">
  <span class="vp-dot-rule__line"></span>
  <span class="vp-dot-rule__glyph">❖ ❖ ❖</span>
  <span class="vp-dot-rule__line"></span>
</div>
```

### 2. `.vp-folio` — semi-transparent parchment frame around all three columns
```html
<div class="vp-folio">
  <span class="vp-folio__tick--tr"></span>
  <span class="vp-folio__tick--bl"></span>
  <div class="vp-folio__grid">
    <!-- sidebar | content | toc -->
  </div>
</div>
```
Grid: `240px 1fr 210px`. Gold corner ticks via `::before`/`::after` + two `<span>` children.

### 3. `.vp-sidenav` — left dark-leather navigation
```html
<aside class="vp-sidenav">
  <div class="vp-sidenav__header">
    <div class="vp-sidenav__eyebrow">— viaproxima —</div>
    <div class="vp-sidenav__title">Regler</div>
  </div>
  <div class="vp-sidenav__group-wrap">
    <div class="vp-sidenav__group">Group title</div>
    <a class="vp-sidenav__item" data-rules-key="key">Item</a>
    <a class="vp-sidenav__item is-active" data-rules-key="key">Active item</a>
  </div>
</aside>
```
Active state: add `is-active` class. Accordion children: wrap in `.vp-sidenav__children`.

### 4. `.vp-tome` — grimoire content panel (do not modify the CSS)
Defined in `wwwroot/css/vp-tome.css` and `wwwroot/css/vp-tome-lore.css`.
See `vp-tome-recipe.md` for full component reference.
**Never** change vp-tome.css or vp-tome-lore.css directly.

### 5. `.vp-toc` — right "På denna sida" anchor TOC
```html
<aside class="vp-toc" id="rules-toc">
  <div class="vp-toc__label">På denna sida</div>
  <ul class="vp-toc__list">
    <li class="vp-toc__item is-active">Active heading</li>
    <li class="vp-toc__item">Other heading</li>
  </ul>
</aside>
```
Built dynamically by `rules.page.js` from `h2[id]` and `h3[id]` in the active panel. Hidden (`.is-hidden`) when fewer than 2 headings found.

---

## vp-tome content component

Det kanoniska sättet att bygga rules-, lore- och referenssidor. Wrap innehåll i `<div class="vp-tome">` — allt annat följer av CSS. Läs aldrig från gamla mallar; läs referensfilerna direkt.

**Referensimplementationer (läs dessa, inte mallkod):**
- `Pages/Shared/_RulesLivStrid.cshtml` — kanonisk baseline: full komponentuppsättning, stone, threshold, lista, tabell, kort
- `Pages/Shared/_RulesOrakel.cshtml` — kompakt struktur: stone med flera rader, lista utan body-kolumn
- `Pages/Index.cshtml` — hero-grid + kortgrid + CTA; visar hur sidspecifik layout läggs ovanpå vp-tome

### CSS-filer

Laddas via `@section Styles` per sida — aldrig i `_Layout.cshtml`.

| Fil | Innehåll |
|---|---|
| `wwwroot/css/vp-tome.css` | Basstil: pergament, typografi, filigree, drop-cap, section, stone, threshold, card, list |
| `wwwroot/css/vp-tome-lore.css` | `vp-tome__stat-table` + färgade pergamenttoner per lore. Ladda när du använder tabeller eller lore-färger. |
| `wwwroot/css/pages/adveniriska.css` | Adveniriska-specifika subtab-stilar och overrides |

### Obligatoriska element

Varje fristående tome-sida (ej subtab/partial) behöver:
1. **SVG sprite + filigree-hörn** — definiera spriten inline en gång, lägg sedan fyra `vp-tome__filigree`-element inuti `.vp-tome`
2. **Head-block** — `vp-tome__head` med eyebrow, title, tagline och divider
3. **Drop-cap på första paragrafen** — `<span class="vp-tome__dropcap">X</span>` som första barn i första `<p>`. Stor rödbrun dekorativ bokstav i Cinzel Decorative. Aldrig utelämna på sidor med löptext.

Subtabs/partials (t.ex. `_RulesOrakel.cshtml`) skippar filigree men behåller head + drop-cap.

### Skelett

```html
@section Styles {
    <link rel="stylesheet" href="~/css/vp.theme.css" asp-append-version="true" />
    <link rel="stylesheet" href="~/css/vp-tome.css" asp-append-version="true" />
    <link rel="stylesheet" href="~/css/pages/<sidan>.css" asp-append-version="true" />
}

<div class="[sida]-wrap">

<svg width="0" height="0" style="position:absolute" aria-hidden="true">
  <symbol id="vp-tome-filigree" viewBox="0 0 70 70">
    <g fill="none" stroke="#a8935e" stroke-width="1.2" stroke-linecap="round">
      <path d="M2 2 L2 36 Q2 18 16 16 Q34 14 36 2" />
      <path d="M10 2 Q14 10 22 10 Q14 14 14 22 Q10 14 2 14" />
      <circle cx="14" cy="14" r="1.6" fill="#a8935e" />
      <path d="M22 2 L22 8" /><path d="M2 22 L8 22" />
      <path d="M28 4 Q30 8 28 12" /><path d="M4 28 Q8 30 12 28" />
    </g>
  </symbol>
</svg>

<div class="vp-tome">
  <svg class="vp-tome__filigree vp-tome__filigree--tl"><use href="#vp-tome-filigree"/></svg>
  <svg class="vp-tome__filigree vp-tome__filigree--tr"><use href="#vp-tome-filigree"/></svg>
  <svg class="vp-tome__filigree vp-tome__filigree--bl"><use href="#vp-tome-filigree"/></svg>
  <svg class="vp-tome__filigree vp-tome__filigree--br"><use href="#vp-tome-filigree"/></svg>

  <header class="vp-tome__head">
    <div class="vp-tome__eyebrow">— Viaproxima · [Undertitel] —</div>
    <h1 class="vp-tome__title">[Titel]</h1>
    <div class="vp-tome__tagline">[Kort beskrivning]</div>
    <div class="vp-tome__divider">
      <span></span><span class="vp-tome__divider-glyph">❖</span><span></span>
    </div>
  </header>

  <p><span class="vp-tome__dropcap">X</span>Första paragrafen börjar här...</p>

  <div class="vp-tome__section">
    <span class="vp-tome__section-mark">❖</span>
    <span class="vp-tome__section-label">Avsnittsnamn</span>
    <span class="vp-tome__section-mark">❖</span>
  </div>

  <!-- mer innehåll -->
</div>
</div>
```

### Komponentkarta

| Innehållstyp | Komponent | Nyckelklasser |
|---|---|---|
| Sidtitel | Head-block | `vp-tome__head`, `__eyebrow`, `__title`, `__tagline`, `__divider` + `__divider-glyph` (❖) |
| Delad titel (Ord & Ord) | Split-variant | `vp-tome__title--split` > spans + `vp-tome__title-amp` |
| Stor första bokstav | Drop-cap | `<span class="vp-tome__dropcap">X</span>` som första barn i första `<p>` |
| Avsnittsdelare | Diamond rule | `vp-tome__section` > `__section-mark` (❖) + `__section-label` |
| Formel / axiom | Stone callout | `vp-tome__stone` > `__stone-inner` > en eller flera `__stone-text` |
| Rankad skala | Threshold ladder | `vp-tome__threshold` > `__threshold-row` > `__threshold-bar` + `__threshold-fill` (width% + tone-färg) |
| Namngivna effekter | Diamond-lista | `vp-tome__list` > `__list-row` > `__list-marker-col` + `__list-name` [+ `__list-body`] |
| Datatabell | Stat-tabell | `vp-tome__stat-table` — kräver `vp-tome-lore.css` |
| Exempel / aside | Kort | `vp-tome__card` > `__card-title` (❦ som glyph) [+ `vp-tome__pair-table`] |
| Löptext | Paragraf | vanlig `<p>` inuti `.vp-tome` |
| Dekorativa hörn | Filigree | SVG sprite + fyra `vp-tome__filigree` (TL/TR/BL/BR) |
| Inramad bild | Image frame | `tome-fig`, `tome-frame`, `tome-pip` ×4, `tome-cap-mark` (❦) — CSS i sidans egna fil, se `Homepage.css` |

### Glyfer

| Glyf | Var | Hur |
|---|---|---|
| ❖ | Section-markeringar, divider-glyph i head | `vp-tome__section-mark`, `vp-tome__divider-glyph` |
| ❦ | Kortrubriker, bildtexter | `vp-tome__card-title-glyph`, `tome-cap-mark` |
| ◆ / diamant | Tone-markers i listor och threshold | `<span class="vp-tome__marker" style="background:var(--tone-N)">` |

Använd alltid dessa befintliga glyfklasser — hårdkoda inte symboler utan wrapper.

### Tonfärger (allvarsgrad — inte lore-färger)

`--tone-1` strå → `--tone-2` bärnsten → `--tone-3` rost → `--tone-4` blod → `--tone-5` obsidian

Används för skadegrader, kostnadstiering, faronivåer. Blanda inte med lore-nyanserna.

### CSS-gotchas i anpassade grids

| Standard i vp-tome.css | Override när… | Fix |
|---|---|---|
| `.vp-tome p { max-width: 64ch }` | `<p>` sitter i en smal gridkolumn | `.ditt-grid p { max-width: none; }` |
| `.vp-tome__card { margin: 22px 0 8px }` | kort är grid-items | `.ditt-grid .vp-tome__card { margin: 0; }` |

### Lore-varianten (Kristallsejdare)

```html
<div class="vp-tome lore-[NYCKEL]">
  <!-- lore-rod / lore-gron / lore-gul / lore-lila / lore-orange / lore-bla -->
  <span class="vp-lore-symbol" aria-hidden="true"></span>
  <h1 class="vp-tome__title">Läran om [NAMN]</h1>
  ...
</div>
```

- `vp-lore-symbol` — alltid som ikonplaceholder (52×52px cirkel, avsedd för AI-genererad SVG). Hårdkoda aldrig färgcirklar utan denna klass.
- `.vp-lore-frame` som wrapper är **INAKTIVERAD** (`background:none` i `adveniriska.css`). Använd den inte.
- Lore-färgton appliceras enbart på `.vp-tome`-diven.

### Innehållskällor (magisystemet)
- Kristallsejdarläror: `NewStyle/viaproxima_kristallsejdare_lores_5_nivaer_strukturerad.md`
- Shamanregler: `NewStyle/shamaner_blackjack_regler.md` + `NewStyle/shaman_keywords_styrkenivaer.md`
- Lore-labels: "Läran om Röd Vrede", "Läran om Grön Skam", "Läran om Gul Lycka", "Läran om Lila Stolthet", "Läran om Orange Kärlek", "Läran om Blå Sorg"

### Active partials and sidebar keys

| Partial | `data-rules-key` | Page |
|---|---|---|
| `_RulesSpelarbok.cshtml` | `spelarbok` | Rules |
| `_RulesLivStrid.cshtml` | `livstrid` | Rules |
| `_RulesForemål.cshtml` | `föremål` | Rules |
| `_KristallsejdareRegler.cshtml` | `kristallsejdare` | Rules |
| `_LoreRod.cshtml` | `lore-rod` | Rules |
| `_LoreGron.cshtml` | `lore-gron` | Rules |
| `_LoreGul.cshtml` | `lore-gul` | Rules |
| `_LoreLila.cshtml` | `lore-lila` | Rules |
| `_LoreOrange.cshtml` | `lore-orange` | Rules |
| `_LoreBla.cshtml` | `lore-bla` | Rules |
| `_RulesShamanerNy.cshtml` | `shamaner` | Rules |
| `_RulesLyadskapare.cshtml` | `lyadskapare` (sub: `lyad-kontroll / lyad-lasning / lyad-flykt`) | Rules |
| `_RulesOrakel.cshtml` | `orakel` | Rules |
| `_RulesEgenskaper.cshtml` | `egenskaper` | SkapaKaraktar |
| `_RulesPoangkostnader.cshtml` | `poangkostnader` | SkapaKaraktar |

Orphaned (not rendered by any active page): `_RulesKristallsejdare.cshtml`, `_RulesLaror.cshtml`, `_RulesShaman2.cshtml`, `_RulesShamaner.cshtml`, `_RulesAdveniriska.cshtml`.

### Framtida migrering
- `Pages/FloraFauna.cshtml` och dess partials — använd `vp-tome` utan lore-klass

Säg "migrera [SIDNAMN] till tome-stilen" för att instruera Claude Code.

---

## Known exceptions

| Exception | Rule |
|---|---|
| Inventory grid | `overflow-x: auto` on the wrapper — do not attempt responsive reflow of the multi-cell span grid |
| vp-tome.css / vp-tome-lore.css | Never modify these files — they are the reference implementation |
| adveniriska.subtabs.js | Orphaned — do not reference or delete |

---

## Page CSS file map

| Page | CSS file | JS file |
|---|---|---|
| Rules | `wwwroot/css/pages/rules-sidebar.css` + `floraFauna.css` | `wwwroot/js/pages/rules.page.js` |
| Skapa karaktär | `wwwroot/css/pages/rules-sidebar.css` (shared) | `wwwroot/js/pages/skapaKaraktar.page.js` |
| Character Sheet | `wwwroot/css/pages/characterSheet.*.css` (5 files) | `wwwroot/js/pages/characterSheet.page.js` + `characterSheet.skills.js` |
| Merchant Generator | `wwwroot/css/pages/merchant-generator.css` | *(no separate page JS)* |
| Adventure Log | `wwwroot/css/aventyrsdagbok.css` | `wwwroot/js/aventyrsdagbok.js` |

*Update this table when new pages are added.*
