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
