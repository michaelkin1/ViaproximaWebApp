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
