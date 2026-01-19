# Viaproxima.Web — TODO (nära framtid)

## Frontend (UI)

### CharacterSheet (Razor Page)
- [ ] Färdigställ karaktärsblad: **valutor (3)**, **lärdom**, **evolution**, **rykte**, **nackdel**, **Liv/HP**
- [ ] Lägg till **bild** (ImagePath + preview)
- [ ] Lägg till **fritext-ruta** vid inventory (anteckningar/utrustning)
- [ ] Lägg till **extra grids/rutor** (t.ex. kläder + smycken) med återanvändbar grid-renderer
- [ ] Utöka **itemtyper/kategorier** + ikon-katalog för inventory

### CharacterList (Razor Page)
- [ ] Snygga till UI (layout/spacing/typografi)
- [ ] (Valfritt) Sök/filter på namn/ras

### Home (/Index)
- [ ] Lägg till välkomsttext + kort beskrivning av appen
- [ ] Lägg in **spelar-/regelbok (PDF)** (länk eller inbäddning)

### Dev-panel (Razor Page, t.ex. `/DevTools`)
- [ ] Skapa dev-panel med flikar:
  - [ ] **Test-karaktärer** (snabbskapa/öppna)
  - [ ] **Senaste fel** (statuskod + traceId + kort text)
- [ ] Visa endast i Development (och senare bakom admin)

---

## Auth (enkel)
- [ ] Lösenordsinlogg (User/Admin) via config/secret som inte checkas in
- [ ] Behörighet:
  - [ ] **Anon**: läsa
  - [ ] **User**: skapa/uppdatera
  - [ ] **Admin**: radera + Dev-panel
- [ ] UI-meddelanden vid 401/403 (vänliga feltexter)

---

## Kodbas (struktur)
- [ ] Dela upp `characterSheet.js` i flera filer (t.ex. `api`, `grid`, `dialog`, `placement`)
- [ ] Rensa/strukturera CSS:
  - [ ] `site.css` = globalt
  - [ ] `characterSheet.css` = endast sheet-specifikt
- [ ] Lätt dokumentation: uppdatera `README.md` (hur man kör + migrations + huvudflöde)

---

## Backend (API/DB)
- [ ] Lägg till nya fält i `Character` + migration (valutor, HP, lärdom, evolution, rykte, nackdel, imagePath)
- [ ] Grundvalidering i API (t.ex. tomt namn, negativa valutor/HP)
- [ ] Standardiserade fel-svar (400/401/403/409) så UI kan visa tydliga meddelanden

---

## Test & CI (minsta pro-nivå)
- [ ] Test för item-grid/placement (unit test för `findFirstFit...` + edge cases)
- [ ] GitHub Actions:
  - [ ] `dotnet build`
  - [ ] kör tester
  - [ ] (Valfritt) enkel JS-lint

---

## Hosting (lokalt / hemmaserver)
- [ ] Kör appen som bakgrundsprocess/service (t.ex. via Windows Task Scheduler eller service)
- [ ] Bestäm åtkomst:
  - [ ] Endast LAN (vänner hemma) eller även extern åtkomst
- [ ] Konfig:
  - [ ] fast port + brandväggsregel
  - [ ] (om extern) router port-forward + DNS-lösning
- [ ] Separera dev/prod-lägen (DevTools endast i dev)

