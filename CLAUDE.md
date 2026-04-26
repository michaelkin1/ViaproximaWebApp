# CLAUDE.md

## Stack
ASP.NET Core Razor Pages · Minimal APIs (Program.cs) · EF Core + SQLite · Plain JS (no framework)

## Commands
```sh
dotnet build
dotnet run
dotnet test
```

## Architecture
UI → JS → Minimal API → EF Core → SQLite
Character Sheet = main integration point.

## Rules
- Reuse existing patterns. No new frameworks, no restructuring, no unnecessary renames.
- Business logic in C# only. JS is UI-only glue—never duplicate logic across layers.
- Inspect first, then propose a plan by file for non-trivial changes.
- After edits: build, summarize changed files, explain why.

## Security
Public-facing app. Protect all write endpoints. Validate all inputs. Secure cookie/auth defaults. No hardcoded secrets.

## Migration Rules (EF Core)
- Never modify existing migrations — always add new ones
- One migration per logical group (see order below)
- Run `dotnet ef database update` and verify after each migration before proceeding
- If a migration fails: `dotnet ef database update [PreviousMigrationName]` to roll back, then fix
- All new columns must be nullable or have a default value to avoid breaking existing rows
- Never store binary image data in the database — store file paths or URLs only

## Implementation Order (remaining features)
1. Stats (remaining of 30), Valuta, Pouch, Anteckningar — new columns on Character
2. HP / damage taken per body part — new columns on Character
3. Lärdomar + Evolutioner — new tables with FK to Character
4. Pets DB persistence — new Pets table with FK to Character, store icon path as string
5. Character image upload — disk storage now, designed for swappable IFileStorage later
6. Pet grid icons — store icon filename/path as string on Pet entity (no binary data)

## Image Storage Strategy
- Current: save uploaded images to wwwroot/uploads/ and store relative path in DB
- Future (hosted): swap to Azure Blob Storage or Cloudflare R2 by implementing IFileStorage
- Never base64-encode images into the database
- Pet/item icons: always stored as file path strings pointing to IconsPets/ or IconsItems/

## Architecture Reminders
- Minimal APIs only — no MVC controllers
- No Blazor, no React — vanilla JS + Razor Pages only
- All JS lives in wwwroot/js/ — modular files per feature
- EF Core + SQLite via app.db — swap to postgres when hosted if needed
- Icon discovery is folder-driven — adding icons requires no code changes
- New pages get their own CSS and JS files in wwwroot/css/ and wwwroot/js/
- No npm, no bundlers, no build step — vanilla JS only, loaded via @section Scripts

## Äventyrsdagbok (Adventure Log)
- Razor Page: `Pages/Aventyrsdagbok/Index.cshtml` (PageModel has `[Authorize]`)
- CSS: `wwwroot/css/aventyrsdagbok.css`
- JS: `wwwroot/js/aventyrsdagbok.js`
- All state is currently in-memory JS only — no DB persistence yet
- Images are stored as `URL.createObjectURL()` object URLs (local/session only) — no upload endpoint yet
- Image links are stored inline in chapter `body_html` as `<span class="img-link" data-src="..." data-filename="...">word</span>`
- `body_html` is the single source of truth for both text content and image link metadata
- Layout uses `position: fixed; top: 56px` to escape the Bootstrap `.container` wrapper and fill the full viewport below the navbar