# Viaproxima Web – Character Sheet (ASP.NET Core)

A small ASP.NET Core **Razor Pages** app for my tabletop RPG project **Viaproxima**. Built as a learning/portfolio project focusing on practical web development: UI → JS interactions → APIs → DB persistence.

## What it does
- **Character Sheet**: edit stats (Name, Race, XP, core attributes) and **Save** to a database.
- **Character List**: shows saved characters as `ID: Name (Race)` and opens a sheet in a new tab.
- **Inventory Grid**: grid size is calculated from rules (Strength + Bärförmåga). Add/edit items via a modal:
  - Primary/Secondary type, size (1x1–3x2), magic toggle, durability (for certain types), description
  - Visual icon picker from local SVG icons

## Tech highlights
- **ASP.NET Core Razor Pages** for UI
- **Minimal APIs** (`Program.cs`) for JSON endpoints
- **EF Core + SQLite** (`app.db`) with migrations for schema changes
- **Vanilla JS** (`wwwroot/js/characterSheet.js`) for dialog logic, grid rendering, API calls
- Icons auto-discovered from folder structure under **`wwwroot/Icons`**

## Key flows
- UI events → JS `fetch()` → Minimal API → EF Core → SQLite → UI updates (no full reload)
- Inventory rendering uses two layers: slot grid + item overlay (CSS grid spans)

## Repo structure
Pages/ (Razor UI + PageModels)
Data/ (EF Core models + DbContext)
wwwroot/js + wwwroot/css + wwwroot/Icons
Program.cs (Minimal APIs)
Migrations/ + app.db


## Next planned steps
- Improved placement checks for multi-cell items + drag & drop
- Better tooltips/edit/delete UX, item naming
- Authentication/authorization for hosted version
- Prompt creator using JSON files
  And more!
