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
Files: `Pages/Aventyrsdagbok/Index.cshtml`, `wwwroot/css/aventyrsdagbok.css`, `wwwroot/js/aventyrsdagbok.js`, `Data/Adventure.cs`, `Data/Chapter.cs`, `Data/ImageLink.cs`

**DB:** Three tables via `AdventureLog` migration. `Adventures.UserId` stores username string (not FK). Cascade delete configured explicitly in `OnModelCreating` for Chapter→Adventure and ImageLink→Chapter.

**API endpoints:**
```
GET/POST   /api/adventures
DELETE     /api/adventures/{id}          → deletes wwwroot/AdventureImages/{id}/
GET/POST   /api/adventures/{id}/chapters
PUT/DELETE /api/chapters/{id}            → DELETE also deletes physical image files
POST       /api/chapters/{id}/images     → multipart; returns { id, imagePath, fileName }
DELETE     /api/images/{id}              → also deletes physical file
```
All endpoints require auth and verify ownership via `chapter → adventure → user`.

**Autosave:** 10s debounce per chapter; resets on every keystroke in body/title; fires immediately on collapse/expand and adventure switch. Shows "Sparad ✓" on success.

**Image-linked words:** Stored as `<span class="img-link" data-src="..." data-image-id="..." data-filename="...">word</span>` inline in `BodyHtml`. `data-image-id` connects DOM spans to `ImageLink` rows for delete. Image URLs are real `/AdventureImages/...` paths — never `createObjectURL()` blobs.

**Critical conventions:**
- Always project EF entities to anonymous objects before returning from endpoints — navigation properties on both sides cause JSON object cycles (HTTP 500). Use `.Select(x => new { x.Id, … })` and omit nav props.
- Physical-file lifecycle must match DB lifecycle: deleting a parent entity must also delete its files on disk.
- During development: wrap new endpoints in `try/catch` returning `Results.Problem(ex.Message)` so 500s surface the actual error.