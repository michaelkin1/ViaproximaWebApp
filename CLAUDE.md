# CLAUDE.md

## Stack
ASP.NET Core Razor Pages · Minimal APIs (`Program.cs`) · EF Core + SQLite (`app.db`) · Vanilla JS, no frameworks/bundlers.

## Commands
```sh
dotnet build
dotnet run
dotnet test
```

## Architecture
UI → JS → Minimal API → EF Core → SQLite. Character Sheet is the main integration point. No full page reloads — UI events `fetch` and patch the DOM.

## Rules
- Reuse existing patterns. No new frameworks, restructuring, or unnecessary renames.
- Business logic in C# only. JS is UI glue — never duplicate logic across layers.
- Inspect before non-trivial changes; propose a plan by file.
- After edits: build, summarize changed files, explain why.
- New pages get their own `wwwroot/css/pages/<page>.css` and `wwwroot/js/pages/<page>.page.js`, loaded via `@section Scripts`. No npm, no bundlers.

## Security
Public-facing app. Every write endpoint must `.RequireAuthorization("CanWrite")`. Validate inputs at boundaries. Cookie/auth defaults are secure (see Auth). No hardcoded secrets — `appsettings.Secrets.json` is gitignored.

## Migration Rules (EF Core)
- Never modify existing migrations — add new ones.
- One migration per logical group.
- Run `dotnet ef database update` and verify before proceeding.
- Roll back with `dotnet ef database update <PreviousMigration>` on failure, then fix.
- New columns must be nullable or have a default — never break existing rows.
- Never store binary image data in DB — file paths/URLs only.

## Image Storage
- Save uploads to `wwwroot/uploads/`, `wwwroot/portraits/`, or `wwwroot/AdventureImages/{adventureId}/`. Store the relative path in DB.
- Portraits → `wwwroot/portraits/{characterId}.{ext}` (overwrites prior file on upload).
- Adventure images → `wwwroot/AdventureImages/{adventureId}/{guid:N}_{originalFileName}`.
- Allowed extensions: portraits `.png .jpg .jpeg .webp`; adventure chapter images additionally `.gif`.
- No server-side request-body cap. Frontend caps portraits at 2000×2000 px.
- Pet/item icons: file path strings under `IconsPets/` or `IconsItems/`. Folder-driven discovery — adding icons requires no code change.
- Future hosted: implement `IFileStorage` to swap to Azure Blob / Cloudflare R2. Never base64.
- **Physical-file lifecycle = DB lifecycle**: capture paths before `SaveChangesAsync`, then delete files. Wrap file I/O in try/catch — file-cleanup failures must not fail the response.

## Auth & Authorization
- Cookie auth: HttpOnly, `SecurePolicy.Always`, `SameSite=Lax`, 8h sliding (`Program.cs:34–42`).
- 401 redirect: `/api/*` returns 401 JSON; non-API returns 303 to `/Login` (`Program.cs:43–52`).
- Roles: `Writer` (default for new users), `Admin`. Stored in `User.Role`.
- Policy `CanWrite` = `Writer` OR `Admin` (`Program.cs:55–59`). Apply to every write endpoint.
- Claims: username on `ClaimTypes.Name`, role on `ClaimTypes.Role`.
- Admin seeder (`Data/AdminSeeder.cs`): runs only with CLI `--seed-admin` AND zero existing users; reads `SeedAdmin:Username/Password` from `appsettings.Secrets.json`.

## CSRF / Antiforgery
- Custom header **`X-XSRF-TOKEN`** (not `X-CSRF-TOKEN`).
- `GET /antiforgery/token` (auth-required) → `{token}`.
- Frontend: `VP.shared.getCsrfToken()` (cached); `VP.shared.requestJson()` injects the header on POST/PUT/DELETE automatically.
- Two endpoints intentionally `.DisableAntiforgery()` — do not copy elsewhere:
  - `POST /api/auth/login` (rate-limit only)
  - `POST /api/chapters/{id}/images` (multipart upload)

## Rate Limiting
`LoginLimit` policy: fixed window, 5/min, no queue. Returns 429 `Too many requests. Try again later.` Applied to `POST /api/auth/login` only (`Program.cs:68–78`).

## Middleware Order (`Program.cs:154–163`)
`UseStaticFiles → UseRouting → UseRateLimiter → UseForwardedHeaders → UseAuthentication → UseAuthorization → UseAntiforgery`. `UseForwardedHeaders` is required because the app runs behind Cloudflare Tunnel.

## Startup Tasks
- `db.Database.Migrate()` runs on boot.
- `appsettings.Secrets.json` loaded `optional: true, reloadOnChange: false`.

## Cloudflare / SSE
App runs behind a Cloudflare Tunnel that **kills SSE streams** ("stream canceled by remote, error code 0"). Do not introduce SSE anywhere. Adventure Log uses 5s polling instead.

## Error Surfacing
- Production: `/Error` page (`Program.cs:149`). No problem-details middleware.
- Development: wrap new endpoints in `try/catch` returning `Results.Problem(ex.Message)` so 500s surface real errors.
- File-deletion try/catches log to `Console.WriteLine` and never fail the response.

## Ownership Model
- **Adventures are user-owned**: `Adventure.UserId` is a username string (not FK). Every adventure/chapter/image endpoint must verify `User.Identity.Name == Adventure.UserId` and 403 on mismatch. Ownership chain: `chapter → adventure → user`.
- **Characters and groups are global** — no `UserId` field. Access gated only by `CanWrite`.

## Implementation Order (remaining)
1. Stats (remaining of 30), Valuta, Pouch, Anteckningar — new columns on Character
2. HP / damage per body part — new columns on Character
3. Lärdomar + Evolutioner — new tables FK to Character
4. Pets DB persistence — new Pets table FK to Character, icon path string
5. Character image upload — disk now, swappable `IFileStorage` later
6. Pet grid icons — file path string on Pet entity

## Data Model
Defined in `Data/`. Cascade delete configured in `ApplicationDbContext.OnModelCreating`.

- **User**: `Id`, `Username` (unique index), `PasswordHash`, `Role` (string, default `"Writer"`).
- **Character**: stats, currency, HP, notes, `GroupId` (`int?`, nullable FK → CharacterGroup; null = Main/ungrouped).
- **CharacterGroup**: `Id`, `Name` (max 100), `SortOrder` (default 0). `OnDelete(Restrict)` — group delete nulls members' `GroupId`, never cascade-deletes characters.
- **InventoryItem**: includes `Cols`, `Rows` (numeric grid dims), `Weight` (optional), plus existing `Size` string.
- **Pet**, **Lardom**, **Evolution**: per-character entities (FK to Character).
- **Adventure**: `Id`, `UserId` (string username, not FK), `Title`, `Session`, `SortOrder`, `CreatedAt` (UTC). Has many `Chapters` (cascade delete).
- **Chapter**: `Id`, `AdventureId`, `Title`, `Date`, `BodyHtml`, `SortOrder`, `Collapsed` (bool). Has many `ImageLinks` (cascade delete).
- **ImageLink**: `Id`, `ChapterId`, `AnchorText`, `ImagePath`, `FileName`. `ImagePath` is the authoritative path field.

**JSON object cycles** (HTTP 500): always project entities to anonymous objects before returning. Two-sided navigation properties cause cycles. Use `.Select(x => new { x.Id, … })` and omit nav props.

## API Endpoints

```
Auth
  POST   /api/auth/login                      [DisableAntiforgery + LoginLimit]
  POST   /api/auth/logout
  GET    /api/auth/me
  GET    /antiforgery/token                   [auth]

Characters
  GET    /api/characters                      (returns GroupId)
  GET    /api/characters/{id:int}
  POST   /api/characters
  PUT    /api/characters/{id:int}
  DELETE /api/characters/{id:int}
  POST   /api/characters/{id:int}/portrait    [multipart]
  PUT    /api/characters/{id:int}/group       body: { groupId } (nullable)

Groups
  GET    /api/groups                          (ordered by SortOrder, then Id)
  POST   /api/groups                          body: { name }
  DELETE /api/groups/{id}                     (nulls GroupId on members, then deletes)

Items / Pets / Lärdomar / Evolutioner
  GET    /api/characters/{id}/items|pets|lardomar|evolutioner
  POST/PUT/DELETE /api/items|pets|lardomar|evolutioner[/{id}]

Adventure Log
  GET/POST   /api/adventures
  DELETE     /api/adventures/{id}             → also deletes wwwroot/AdventureImages/{id}/
  GET/POST   /api/adventures/{id}/chapters
  PUT/DELETE /api/chapters/{id}               → DELETE also deletes physical image files
  POST       /api/chapters/{id}/images        [multipart, DisableAntiforgery]
                                              → returns { id, imagePath, fileName }
  DELETE     /api/images/{id}                 → also deletes physical file

Icons / Rules
  GET /api/icons/catalog
  GET /api/pets/icons
  GET /api/rules/inventory                    (strength/barformaga grid rules)
  GET /api/rules/hp                           (talighet/fysisk HP rules)
```

All write endpoints require `.RequireAuthorization("CanWrite")`. Adventure endpoints additionally enforce ownership.

## Page Inventory
| Page | Auth | Notes |
|---|---|---|
| `Index` | public | landing |
| `Login` | public-only | redirects auth'd users → `/CharacterList` |
| `CharacterList` | implicit | loads characters + groups; `OnPostDeleteAsync` checks role |
| `CharacterSheet` | redirect | → `/CharacterList?id={id}` |
| `Aventyrsdagbok/Index` | `[Authorize]` | thin model |
| `Rules`, `FloraFauna`, `Laror` | public | empty `OnGet` |
| `MerchantGenerator` | public | uses `IPromptAssembler`; validates 1–12 items |

Layout = `_Layout`. Navbar lives there.

## Services
- **`IPromptAssembler`** (singleton) — loads JSON rule files (`ViaproximaRaces`, `ViaproximaGuildsLore`, `ViaproximaItemRules`, `ViaproximaFunctionalTags`, `ViaproximaTwistTags`, per-guild `InspirationTags`, `world_context.txt`, `PromptTemplate.md`). `BuildPrompt(PromptParams)` → `(Prompt, LayoutId)`. Used by `MerchantGenerator` only.

## JS Architecture
Single global namespace `window.VP`, defined in `wwwroot/js/shared/vp.ns.js`:

```
VP.shared    — requestJson, getCsrfToken, getAuthState, ui helpers
VP.api       — characters, items, pets, petsIcons, icons, rules
VP.grid      — render, placement
VP.inventory — createDialogController
VP.pets      — createController, ctrl
VP.sheet     — load, clear, getFieldState, setFieldState, skills
VP.pages     — page-level controllers
```

- **All HTTP through `VP.shared.requestJson(url, options)`** (`shared/http.js`). Direct `fetch` loses CSRF injection and 401 redirect.
- IIFE per file; attach to `VP`; no DOMContentLoaded boilerplate. Files run once on page load.
- Script load order in `@section Scripts`: `vp.ns.js → shared/* → api/* → grid/* → inventory/* → pages/<page>.page.js`.
- Controllers are factories (e.g. `VP.pets.createController(dom, charId)`). DOM is passed in — factories never query the document.

## Frontend Caches (session-scoped, no invalidation)
`getCsrfToken`, `getAuthState`, `VP.api.icons.catalog`, `VP.api.petsIcons`. Magic-tinted SVG blob URLs (`grid/render.js:5`) are never freed — minor leak risk over a long session. New icons added by admin won't appear without page refresh — by design.

## Character Sheet — Shared DOM Panel
- One `#panel-sheet` reused for all character tabs. Every domain must be explicitly reset on tab switch — nothing clears itself.
- `VP.sheet.clear()` is the single orchestrator. When a new sub-module is added, append its clear-on-null call to the end of `clear()`.
- Sub-module null guard: never `if (!characterId) return` — always clear state and re-render before returning. Applies to `loadPets()`, `skills.reload(null)`, and any future module.
- `String(null) === "null"` (truthy). Always use `characterId = newId ? String(newId) : null`.
- Zeroing `state.itemsCache = []` does NOT clear the visual grid — must call `VP.grid.render.renderSlots(slotsGrid, itemsGrid, state, 0, 0)`.
- Tab manager Path 2 (return visit, `tab.fieldState` set): when `!tab.id`, must call `VP.sheet.clear()` before `setFieldState`, otherwise skills/pets are never cleared on return to a blank tab.

**Sub-modules** (each cleared by `clear()`):

| Sub-module | File |
|---|---|
| Stats (~28 attributes) | `pages/characterSheet.page.js:8–48` |
| HP / damage by body part (`skadaHuvud/Torso/Armar/Ben`); max via `VP.api.rules.getHpRules()` | `pages/characterSheet.page.js:99–114` |
| Currency (`cuppar/ferrar/aurar`) | `pages/characterSheet.page.js:200–202` |
| Anteckningar + Pouch | `pages/characterSheet.page.js:48` |
| Portrait upload (max 2000×2000 px; fire-and-forget `fetch().catch()`) | `pages/characterSheet.page.js:127–153, 334–381` |
| Inventory grid (auto-place via `VP.grid.placement.findFirstFitColumnWise`) | `pages/characterSheet.page.js:289–676` + `inventory/dialog.js` |
| Pets | `pets/pets.js` |
| Skills (Lärdom + Evolution) | `pages/characterSheet.skills.js` |

## Adventure Log (Äventyrsdagbok)
**Files**: `Pages/Aventyrsdagbok/Index.cshtml`, `wwwroot/css/aventyrsdagbok.css`, `wwwroot/js/aventyrsdagbok.js`, `Data/Adventure.cs|Chapter.cs|ImageLink.cs`.

**Schema**: three tables via `AdventureLog` migration. Cascade delete: Chapter→Adventure, ImageLink→Chapter. `Adventure.UserId` is a username string, not FK.

**Autosave**: 10s debounce per chapter; resets on every keystroke in body/title; fires immediately on collapse/expand and adventure switch. Shows "Sparad ✓" on success.

**Image-linked words**: stored inline in `BodyHtml` as
`<span class="img-link" data-src="..." data-image-id="..." data-filename="...">word</span>`.
`data-image-id` connects DOM spans to `ImageLink` rows for delete. Image URLs are real `/AdventureImages/...` paths — never `createObjectURL()` blobs.

**contenteditable img-link caret bleeding** — DO NOT REVERT: after `range.insertNode(span)`, the browser keeps inserting typed text inside the span. Fix:
- Insert a real space text node after the span and move caret to position 1 inside it. `setStartAfter(span)` is unreliable.
- A `keydown` guard on each chapter editor must intercept Space, Enter, and Shift+Enter when `selection.anchorNode.parentElement?.closest('.img-link')` is non-null: `preventDefault`, insert a sibling text node after the span, move the caret there before the browser inserts the character.
- `closest` must be called on `parentElement`, not on the text node.
- Strip zero-width spaces (U+200B) from `editor.innerHTML` at every `ch.bodyHtml =` assignment site before persisting to state or DB.

**Live updates — polling** — DO NOT REVERT TO SSE: SSE was rejected by Cloudflare Tunnel ("stream canceled by remote, error code 0"). Use 5s polling in `aventyrsdagbok.js`: `startPolling(adventureId)` / `stopPolling()` / `pollChapters(adventureId)`. `startPolling` is called after chapters load in `selectAdventure`. `stopPolling` is called at the start of `selectAdventure` and on `beforeunload`.
- Poll failures must be silent — never surface to the user.
- Never overwrite an editor where `document.activeElement === editor` — user's in-progress text is protected.
- Skip identical content (same `bodyHtml`, `title`, `date`).

## Character List UI
- Section-based: Main (ungrouped, `GroupId == null`) renders first; custom groups follow ordered by SortOrder, then Id.
- Section headers reuse `.kl-section-banner` — do not introduce a new banner style.
- Custom group headers have a delete button on the far right; Main has none.
- Each row has a themed dropdown to move the character between Main and a group; `PUT` immediately and move the row in the DOM — no full reload.
- Two stacked top buttons: `+ Ny karaktär` (`.btn-gold`) and `+ Ny gruppering` (`.btn-gold--group`).

## Frontend Gotchas
- **JSON object cycles**: project to anonymous objects (see Data Model).
- **Magic icon convention**: backend stores magic variants as separate files. Frontend strips `_magic` via `iconFile.replace(/_magic(\.[^.]+)$/i, "$1")` (`inventory/dialog.js:177`). Naming-only contract.
- **SVG magic tinting**: `VP.grid.render.tintSvgToMagic(url)` checks `url.endsWith(".svg")` and stores `dataset.originalSrc` to avoid double-tinting on toggle.
- **Portrait upload is fire-and-forget** — server failures swallowed.

## UI Quick Reference

### CSS Variables (`wwwroot/css/vp.theme.css`)
| Variable | Value | Use |
|---|---|---|
| `--bg` | `#e9e3d7` | page background |
| `--paper` | `#f6f0e4` | primary panel/sheet |
| `--panel` | `#fdf8ee` | lighter panel |
| `--panel-2` | `#f6edde` | secondary panel |
| `--ink` | `#2b241c` | body text |
| `--muted` | `#6b5b47` | secondary text |
| `--muted-2` | `#8a7a62` | tertiary text |
| `--border` | `#d5c7ad` | standard border |
| `--border-2` | `#c7b89d` | secondary border |
| `--shadow` | `0 4px 16px rgba(0,0,0,.15)` | box shadow |
| `--radius-lg / md / sm` | `8 / 6 / 4 px` | border radii |
| `--slot` | `64px` | inventory cell |
| `--font` | `"Libre Baskerville", "Baskerville", "Garamond", serif` | body |
| `--font-size-body` | `16px` | body |
| `--stat-font-sub / main` | `0.95rem / 1.05rem` | stat boxes |

Adventure Log scopes its own `:root` in `aventyrsdagbok.css` (`--vp-gold #c9b990`, `--vp-gold-dark #a8935e`, `--vp-sidebar-bg #181008`). Do not mix with global vars.

### Fonts
- Body: `Libre Baskerville` (serif fallback chain).
- Display/headings: `Cinzel` (Google Fonts, loaded in `Homepage.css`).
- Tabs/cards alt: `EB Garamond`.
- Base: `html { font-size: 14px }`, scales to 16px at ≥768px.
- Banners/labels: 13px, **uppercase**, letter-spacing 0.05–0.08em.

### Buttons (canonical — derive new themed buttons from these, do not introduce new colors)
| Class | File | Use |
|---|---|---|
| `.btn-gold` | `pages/karaktarer.css:214` | primary; bg `#c9b990`, border `#a8935e`, hover bg `#d4c59e` |
| `.btn-gold--group` | `pages/karaktarer.css:284` | secondary; bg `#b8a472`, border `#8a7548` |
| `.btn-small` | `vp.base.css:1` | compact utility |
| `.btn-delete` | `pages/characterList.css:45` | destructive; low-opacity until hover; `#c0392b` |

### Section Banner
`.kl-section-banner` (`pages/karaktarer.css:240`): bg `#d8c9aa`, border `#c0ae91`, text `#2a1f0e`, uppercase 13px EB Garamond. Same look reused as `.tab-btn--active` (`floraFauna.css`) and `.world-map-banner` (`Homepage.css`).

### Layout Primitives
- Character sheet: `.page > .sheet` (paper bg, shadow, `--radius-lg`). `.sheet-main` 3-col grid `1.2fr 1.6fr 1.6fr`. Right `.inventory-body` is `1fr 300px`.
- Inventory: `.slot` 64×64 px, dashed `#b3a795` border, bg `#f9f5ea`.
- Character list: `.kl-card > .kl-card-header > .kl-row`.
- Skill panel: `.skill-panel > .skill-titlebar > .skill-row`.
- Adventure Log: `.vp-dagbok` fixed below 56px navbar; sidebar 256px, dark.

### Form Inputs
`.item-field` wrapper + nested `input/select/textarea`: border `var(--border-2)`, radius `var(--radius-sm)`, bg `var(--panel)`, padding `0.35rem 0.45rem`. Reuse for new dialogs.

### Naming
BEM-ish kebab + namespace prefix: `kl-*` (character list), `skill-*`, `stat-*`, `inventory-*`, `vp-dagbok__*` (BEM `__`). Modifiers use `--` (e.g. `.btn-gold--group`). No Tailwind, no SCSS — vanilla CSS only.

### Per-Feature Stylesheets
| File | Skins |
|---|---|
| `vp.theme.css` | global tokens |
| `vp.base.css` | `.btn-small`, `.hint` |
| `site.css` | Bootstrap overrides, navbar |
| `pages/karaktarer.css` | character list, tabs, gold buttons, banners |
| `pages/characterList.css` | list card, delete affordance |
| `pages/characterSheet.layout.css` | sheet grid + columns |
| `pages/characterSheet.stats.css` | stat boxes |
| `pages/characterSheet.skills.css` | skill panels |
| `pages/characterSheet.HP.css` | HP display |
| `pages/characterSheet.inventory.css` | inventory grid |
| `pages/floraFauna.css` | tabs + PDF/iframe |
| `pages/laror.css` | lore tabs + iframe |
| `pages/Homepage.css` | hero, world-map banner |
| `pages/login.css` | login screen |
| `aventyrsdagbok.css` | adventure log (own palette) |
| `components/dialog.css` | icon picker grid |

### Animations
Short transitions (`0.05s–0.15s`), no `@keyframes`. Hover patterns: `filter: brightness(0.97)` (buttons), `opacity` (delete), `transform: scale(1.03)` (icon tiles). Match these for new interactive elements.

### New-page checklist
1. Add `wwwroot/css/pages/<page>.css`; pull in `--bg`, `--paper`, `--ink`, `--border`.
2. Add `wwwroot/js/pages/<page>.page.js`; IIFE attaches to `VP.pages.<page>`.
3. Wrap content in `.page > .sheet` (or full-bleed à la adventure log).
4. Use `.btn-gold` / `.btn-gold--group` for actions; `.kl-section-banner` for headers.
5. All API calls via `VP.shared.requestJson()`.
6. Page writes? `[Authorize]` + endpoints `.RequireAuthorization("CanWrite")`.

## Tooling — Windows
- Do not pipe `dotnet` CLI through `2>&1` — causes stdout-buffering hangs on Windows. Run plain.
