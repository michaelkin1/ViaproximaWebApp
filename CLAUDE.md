# CLAUDE.md

## Project
ASP.NET Core Razor Pages + Minimal APIs in `Program.cs` + EF Core SQLite (`app.db`) + vanilla JS. No frameworks, no bundlers, no npm.

Run:
```sh
dotnet build
dotnet run
dotnet test
```
On Windows, do not pipe `dotnet` through `2>&1`; it can hang.

## Working Rules
- Reuse existing patterns. Avoid broad rewrites, unnecessary renames or new abstractions.
- Inspect relevant files before non-trivial edits and propose a file-by-file plan.
- Keep business logic in C#. JS is UI glue and must not duplicate backend rules.
- All API calls from JS go through `VP.shared.requestJson()` so CSRF and auth behavior stay intact.
- After edits, run build/tests when practical and summarize changed files + why.

## Security / Auth
Public-facing app. Every write endpoint must use `.RequireAuthorization("CanWrite")` unless there is a very explicit existing exception.

Auth setup:
- Cookie auth, roles `Writer` and `Admin` stored in `User.Role`.
- Policy `CanWrite` = Writer or Admin.
- `/api/*` unauthenticated requests return 401 JSON; non-API redirects to `/Login`.
- No hardcoded secrets. `appsettings.Secrets.json` is gitignored.
- Admin seeder runs only with `--seed-admin` and zero existing users.

CSRF:
- Header is `X-XSRF-TOKEN`, not `X-CSRF-TOKEN`.
- `GET /antiforgery/token` returns `{ token }`.
- `VP.shared.requestJson()` injects CSRF for POST/PUT/DELETE.
- Only these endpoints intentionally disable antiforgery:
  - `POST /api/auth/login`
  - `POST /api/chapters/{id}/images`

Rate limiting:
- `LoginLimit`: 5/min fixed window, no queue. Applies only to `POST /api/auth/login`.

Middleware order matters:
`UseStaticFiles → UseRouting → UseRateLimiter → UseForwardedHeaders → UseAuthentication → UseAuthorization → UseAntiforgery`.
`UseForwardedHeaders` is required behind Cloudflare Tunnel.

## EF Core / Data Rules
- Never edit existing migrations. Add a new migration per logical group.
- Run `dotnet ef database update` after migration changes.
- New columns must be nullable or have defaults.
- Project entities to anonymous DTOs before returning JSON. Do not return EF navigation graphs, they cause object-cycle 500s.
- `db.Database.Migrate()` runs on boot.

Important entities:
- `User`: `Id`, `Username` unique, `PasswordHash`, `Role`.
- `Character`: global, no owner. Contains stats, currency, HP, notes, nullable `GroupId`.
- `CharacterGroup`: deleting a group nulls member `GroupId`; never cascade-delete characters.
- `InventoryItem`: has `Cols`, `Rows`, optional `Weight` and legacy `Size` string.
- `Pet`, `Lardom`, `Evolution`: FK to `Character`.
- `Adventure`: user-owned via `UserId` username string, not FK.
- `Chapter`: FK to `Adventure`, has many `ImageLink`.
- `ImageLink`: `ImagePath` is authoritative.

Ownership:
- Adventures, chapters and adventure images must verify `User.Identity.Name == Adventure.UserId`; otherwise 403.
- Characters and groups are global. Writes only require `CanWrite`.

## File / Image Storage
Never store binary image data or base64 in DB. Store relative paths only.

Paths:
- Portraits: `wwwroot/portraits/{characterId}.{ext}`, overwrite previous portrait.
- Adventure images: `wwwroot/AdventureImages/{adventureId}/{guid:N}_{originalFileName}`.
- Pet/item icons: path strings under `IconsPets/` or `IconsItems/`. Folder-driven discovery.

Rules:
- Allowed portrait extensions: `.png`, `.jpg`, `.jpeg`, `.webp`.
- Adventure chapter images also allow `.gif`.
- Frontend caps portraits at 2000×2000 px.
- Physical file lifecycle follows DB lifecycle: capture paths before `SaveChangesAsync`, then delete files.
- File cleanup failures must be caught/logged and must not fail the API response.
- Future hosted storage should use `IFileStorage` for Azure Blob / Cloudflare R2.

## Frontend Architecture
Global namespace: `window.VP` in `wwwroot/js/shared/vp.ns.js`.

Main modules:
```txt
VP.shared    requestJson, getCsrfToken, getAuthState, UI helpers
VP.api       characters, items, pets, icons, rules
VP.grid      render, placement
VP.inventory createDialogController
VP.pets      createController
VP.sheet     load, clear, field state, skills
VP.pages     page controllers
```

Script order:
`vp.ns.js → shared/* → api/* → grid/* → inventory/* → pages/<page>.page.js`.

Patterns:
- IIFE per file. Attach to `VP`. Avoid random globals.
- Controllers are factories. Pass DOM in; factories should not query the whole document.
- Session caches exist for CSRF, auth state, icon catalog and pet icons. No invalidation.
- New pages: `wwwroot/css/pages/<page>.css` + `wwwroot/js/pages/<page>.page.js`, loaded with `@section Scripts`.

## Character Sheet Gotchas
The character sheet uses one shared `#panel-sheet` across tabs. State must be explicitly cleared on tab switches.

Do not break these rules:
- `VP.sheet.clear()` is the central reset orchestrator.
- New submodules must add their clear-on-null behavior to `clear()`.
- Never `if (!characterId) return` before clearing UI. Clear first, then return.
- Use `characterId = newId ? String(newId) : null`; never allow truthy `"null"`.
- Clearing `state.itemsCache = []` does not clear the grid. Call `VP.grid.render.renderSlots(...)`.
- On return to a blank tab, call `VP.sheet.clear()` before restoring field state.

Submodules include stats, HP/damage, currency, notes/pouch, portrait upload, inventory, pets and skills.

## Adventure Log Gotchas
Files: `Pages/Aventyrsdagbok/Index.cshtml`, `wwwroot/css/aventyrsdagbok.css`, `wwwroot/js/aventyrsdagbok.js`, `Data/Adventure.cs`, `Data/Chapter.cs`, `Data/ImageLink.cs`.

Cloudflare Tunnel kills SSE. Do not introduce SSE. Use 5s polling:
- `startPolling(adventureId)` after chapter load.
- `stopPolling()` before switching adventure and on `beforeunload`.
- Poll failures stay silent.
- Never overwrite the editor where `document.activeElement === editor`.
- Skip identical incoming content.

Autosave:
- 10s debounce per chapter.
- Immediate save on collapse/expand and adventure switch.

Image-linked words:
```html
<span class="img-link" data-src="..." data-image-id="..." data-filename="...">word</span>
```
Do not revert the caret fixes:
- After inserting an img-link span, insert a real space text node after it and move caret into that node.
- `setStartAfter(span)` alone is unreliable.
- Keydown guard must intercept Space, Enter and Shift+Enter when inside `.img-link`.
- Call `closest()` on `parentElement`, not text nodes.
- Strip zero-width spaces (`U+200B`) before persisting `editor.innerHTML`.

## Main APIs
All writes require `CanWrite`. Adventure APIs also enforce ownership.

```txt
Auth:       POST /api/auth/login, POST /api/auth/logout, GET /api/auth/me, GET /antiforgery/token
Characters: GET/POST /api/characters, GET/PUT/DELETE /api/characters/{id}, POST /api/characters/{id}/portrait, PUT /api/characters/{id}/group
Groups:     GET/POST /api/groups, DELETE /api/groups/{id}
Items:      GET /api/characters/{id}/items, POST/PUT/DELETE /api/items[/{id}]
Pets:       GET /api/characters/{id}/pets, POST/PUT/DELETE /api/pets[/{id}]
Lärdomar:   GET /api/characters/{id}/lardomar, POST/PUT/DELETE /api/lardomar[/{id}]
Evolutioner:GET /api/characters/{id}/evolutioner, POST/PUT/DELETE /api/evolutioner[/{id}]
Adventures: GET/POST /api/adventures, DELETE /api/adventures/{id}
Chapters:   GET/POST /api/adventures/{id}/chapters, PUT/DELETE /api/chapters/{id}, POST /api/chapters/{id}/images
Images:     DELETE /api/images/{id}
Rules/icons: GET /api/icons/catalog, /api/pets/icons, /api/rules/inventory, /api/rules/hp
```

## Pages / Styling
Layout is `_Layout.cshtml`; navbar lives there.

Important pages:
- `CharacterList`: characters + groups. Main group first. Group delete nulls character `GroupId`.
- `CharacterSheet`: redirected via `/CharacterList?id={id}`.
- `Aventyrsdagbok/Index`: `[Authorize]`, thin model.
- `Rules`: thin shell with partials from `Pages/Shared/_Rules*.cshtml`.
- `MerchantGenerator`: public, uses `IPromptAssembler`, validates 1–12 items.

Styling rules:
- Use existing CSS variables from `vp.theme.css`.
- Use `.btn-gold`, `.btn-gold--group`, `.btn-small`, `.btn-delete` instead of inventing button colors.
- Use `.kl-section-banner` for section headers.
- Form fields use `.item-field` wrapper + nested input/select/textarea.
- Vanilla CSS only. No Tailwind, SCSS or new design system.

## Rules Page
Files: `Pages/Rules.cshtml`, `wwwroot/js/pages/rules.page.js`, `wwwroot/css/pages/floraFauna.css`.

Rules:
- `Rules.cshtml` should stay thin: tab bar, wrapper divs and partial calls.
- Tabs use `.tab-btn` with `data-tab`; JS finds all `.tab-btn` across both tab rows.
- Add new tabs by adding button + panel + partial + `titleMap` entry in `rules.page.js`.
- Shared content classes live in `floraFauna.css`: `.sh-panel`, `.sh-section-title`, `.sh-prose`, `.sh-table`, `.sh-list`, `.sh-wide-table-wrap`, `.sh-formula`, `.sh-quote`.

## vp-tome — Designsystem

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

### Tab-struktur — Adveniriska lärdomarna

```
Rules-sidan
  → egenskaper
  → spelarbok
  → poangkostnader
  → adveniriska (De fyra Adveniriska lärdomarna)
      → kristallsejdare  →  rod / gron / gul / lila / orange / bla
      → shamaner
      → lyadskapare (placeholder)
      → orakel (placeholder)
  → livstrid
```

Gamla tab-nycklar `laror`, `shamaner`, `shaman20`, `kristallsejdare` på huvudnivå finns inte längre. Kristallsejdare har ingen separat "Översikt"-panel — lore-subtab-raden visas direkt med Röd Vrede förvald.

Lägg till nya tabs: button + panel + partial + `titleMap`-rad i `rules.page.js`.

### Innehållskällor (magisystemet)
- Kristallsejdarläror: `NewStyle/viaproxima_kristallsejdare_lores_5_nivaer_strukturerad.md`
- Shamanregler: `NewStyle/shamaner_blackjack_regler.md` + `NewStyle/shaman_keywords_styrkenivaer.md`
- Lore-labels: "Läran om Röd Vrede", "Läran om Grön Skam", "Läran om Gul Lycka", "Läran om Lila Stolthet", "Läran om Orange Kärlek", "Läran om Blå Sorg"

### Migrerade sidor
- `Pages/Index.cshtml` — klar
- `Pages/Shared/_RulesLivStrid.cshtml` — klar (kanonisk referens)

### Framtida migrering
- `Pages/FloraFauna.cshtml` och dess partials — använd `vp-tome` utan lore-klass

Säg "migrera [SIDNAMN] till tome-stilen" för att instruera Claude Code.

### Partial Views (Adveniriska-systemet)
| Partial | Innehåll |
|---|---|
| `_RulesAdveniriska.cshtml` | Subtab-skelett + lore-bar, subtab-JS |
| `_LoreRod.cshtml` | Röd Vrede — eld och rök |
| `_LoreGron.cshtml` | Grön Skam — växter och djur |
| `_LoreGul.cshtml` | Gul Lycka — ljus och helande |
| `_LoreLila.cshtml` | Lila Stolthet — blixt och nekromanti |
| `_LoreOrange.cshtml` | Orange Kärlek — sten och sand |
| `_LoreBla.cshtml` | Blå Sorg — vatten och vind |
| `_RulesShamanerNy.cshtml` | Shamanregler (blackjack-system) |

## Merchant Generator / Prompt Pipeline
`MerchantGenerator` uses `IPromptAssembler` singleton. Active pipeline:
- Template: `wwwroot/MerchantRules/PromptTemplate_v2_7.md`
- Item rules: `wwwroot/MerchantRules/ViaproximaItemRules_v2_6.json`
- World context: `wwwroot/MerchantRules/world_context_v2_6.txt`
- Archetypes: `ViaproximaArchetypes_v1.json`
- Lärdom rules: `Adveniriska_Lardomar_Rules_v1.json`
- Guild signatures: `ViaproximaGuildMechanicSignatures.json`
- Race reminders: `ViaproximaRaceReminders.json`

Do not resurrect retired tag/twist systems from `outdated_files/`.

PromptAssembler behavior:
- Injects compressed output type rules only for selected item types.
- Assigns an `archetype:` per slot from compatible unused archetypes.
- Assigns `assigned_mechanic:` only for KRISTALLSEJDARE, SHAMAN, LYÅDSKAPARE and ORAKEL.
- Injects guild mechanic signature and race appearance reminders.
- `SHAMAN_INGREDIENT` uses v2.6 dice/trait system: Common 1D6, Uncommon 2D6, Rare 3D6, Mythic 4D6. Traits: Fungi/Drömrök, Animal parts/Blodskraft, Essence/Resonans, Minerals/Stadga, Plants/Återväxt. Mythic doubles its trait, max one doubled Mythic per ritual.

Merchant randomizer:
- `item_count` is outer-scoped and updated by `updateTotal()`.
- Total must be 1–12.
- `randomizeLayout(totalItems, guild)` returns `{ category_id: count }`.
- Max 5 categories, max 5 items/category.
- `SHAMAN_INGREDIENT` is included in the standard pool.
- Guild guarantees are not implemented.

Merchant JSON viewer:
- Fully client-side in `#mg-sub-output`.
- Accepts top-level merchant object or nested `{ "merchant": ... }`.
- Accepts `items` or `varor`; accepts `affinities` or `tags`.
- Viewer CSS uses `mv-*` classes in `merchant-generator.css`.

## Known Design Constraints
- No SSE because Cloudflare Tunnel cancels streams. Use polling.
- No binary/base64 images in DB.
- No direct `fetch` for JSON APIs from frontend code.
- No new UI palette unless absolutely necessary.
- No full page reloads for normal Character Sheet interactions.
- Avoid changing old prompt template files unless the active file is intentionally being changed.
