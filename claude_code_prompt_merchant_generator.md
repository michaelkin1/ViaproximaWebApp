# Claude Code – Viaproxima Handlargenerator

## Uppgift
Bygg en Razor Page som genererar handelsprompts för rollspelet Viaproxima.
Sidan läser JSON-datafiler, sätter ihop en systemprompt via klassen `PromptAssembler`,
och presenterar den för användaren att kopiera och klistra in i en LLM (Claude eller ChatGPT).

---

## Projektkontext

- **Stack:** ASP.NET Core Razor Pages
- **JSON-filer** (läs och förstå strukturen i dem):
  - `wwwroot/MerchantRules/viaproxima_raser_skran_design_sv.json` – raser och skrån med estetik/material-bias
  - `wwwroot/MerchantRules/viaproxima_item_rules.json` – typregler per itemkategori (MELEE, ARMOR, SHAMAN osv.)
  - `wwwroot/MerchantRules/viaproxima_item_tags.json` – tagggrupper och selection profiles
  - `wwwroot/MerchantRules/viaproxima_layouts_150.json` – 150 layouts (L001–L150) med itemtyper och antal
  - `wwwroot/MerchantRules/viaproxima_item_creativity.json` – kreativitetslager: flavor seeds per skrå, effektarketyper, balansregler
  - `wwwroot/MerchantRules/viaproxima_merchant_prompt_skeleton.md` – promptskelettet med alla {{PLACEHOLDER}}

---

## Vad du ska bygga

### 1. Modeller – `Models/Merchant/`

Deserialiseringsmodeller för JSON-filerna. Håll dem enkla, matcha JSON-strukturen exakt.
Namnge dem: `RaserSkranData`, `ItemRulesData`, `ItemTagsData`, `LayoutsData`, `CreativityData`.

### 2. `Services/PromptAssembler.cs`

En injicerbar service (`IPromptAssembler`) med en publik metod:

```csharp
string BuildPrompt(PromptParams parameters);
```

`PromptParams` är en enkel record:
```csharp
public record PromptParams(
    string SkråId,
    string RasId,
    int AntalItems,
    string? LärdomFokus  // nullable, valfri
);
```

**PromptAssembler-logik – exakt vad den ska göra:**

1. **Läs skelettet** från `viaproxima_merchant_prompt_skeleton.md` som en råsträng.

2. **Välj layout:**
   - Filtrera layouts där summan av `counts`-värdena är <= `AntalItems`. 
   - Om `AntalItems` är exakt 10 kan alla 150 användas.
   - Välj slumpmässigt en matchande layout.

3. **Slå upp ras** ur `raser`-arrayen på `id == RasId`. Extrahera:
   - `namn` → `{{RAS_NAMN}}`
   - `visuella_taggar` som kommaseparerad sträng → `{{RAS_VISUELLA_TAGGAR}}`
   - `material_bias` som kommaseparerad sträng → `{{RAS_MATERIAL_BIAS}}`
   - `estetisk_bias` som kommaseparerad sträng → `{{RAS_ESTETISK_BIAS}}`

4. **Slå upp skrå** ur `skrån`-arrayen på `id == SkråId`. Extrahera:
   - `namn` → `{{SKRÅ_NAMN}}`
   - `tema_nyckelord` som kommaseparerad sträng → `{{SKRÅ_TEMA_NYCKELORD}}`
   - `estetisk_bias` → `{{SKRÅ_ESTETISK_BIAS}}`
   - `material_bias` → `{{SKRÅ_MATERIAL_BIAS}}`
   - `design_riktning` → `{{SKRÅ_DESIGN_RIKTNING}}`
   - Från `creativity.json`: `flavor_seeds.skrån[SkråId].inspirationskorn` som punktlista → `{{SKRÅ_INSPIRATIONSKORN}}`

5. **Bygg layoutblock** för `{{LAYOUT_COUNTS}}`:
   Formatera som:
   ```
   - Närstridsvapen: 3
   - Rustning: 2
   - Verktyg: 1
   ```
   Använd `enums`-mappningen från `item_rules.json` för svenska typnamn.
   Sätt `{{LAYOUT_ID}}` till layoutens id (t.ex. "L042").

6. **Bygg `{{ENUM_MAPPING}}`** – kompakt lista av svenska namn för de typer som finns i layouten.

7. **Bygg `{{INJICERADE_TYPREGLER}}`:**
   - Iterera över typerna i den valda layoutens `counts`.
   - För varje typ: hämta `must_include` och `constraints` ur `type_rules` i `item_rules.json`.
   - Formatera kompakt, t.ex.:
     ```
     **MELEE:** Skadenivå + vikt + fördel + weapon_profile_format. Ej >EXTREME, ej >±3 HV.
     **ARMOR:** Typ (Lätt/Medeltung/Tung) + hållbarhet + blockeringsnivåer + vikt. Block: 1D6, 5–6 lyckas.
     ```
   - Om layouten innehåller LORE: behåll sektion F i skelettet. Annars: ta bort sektion F.

8. **Fyll i resterande placeholders:**
   - `{{ANTAL_ITEMS}}` → `AntalItems`
   - `{{LÄRDOM_FOKUS}}` → `LärdomFokus ?? "Ingen"`

9. **Returnera** den sammansatta promptsträngen.

---

### 3. `Pages/MerchantGenerator.cshtml` + `MerchantGenerator.cshtml.cs`

**PageModel:**
- Injicera `IPromptAssembler`.
- Properties:
  - `List<SelectListItem> Raser` – populerad från JSON vid `OnGet`
  - `List<SelectListItem> Skrån` – populerad från JSON vid `OnGet`
  - `[BindProperty] string SkråId`
  - `[BindProperty] string RasId`
  - `[BindProperty] int AntalItems` (default 8, range 4–12)
  - `[BindProperty] string? LärdomFokus`
  - `string? GeneradPrompt` – resultatet, null tills formuläret skickats
  - `string? LayoutId` – för att visa vilket layout-ID som valdes

- `OnGet`: läs raser och skrån, bygg dropdowns. Slumpa defaultvärden.
- `OnPost`: anropa `assembler.BuildPrompt(...)`, sätt `GeneradPrompt` och `LayoutId`.

**Razor-sidan (.cshtml):**

Enkel, funktionell layout. Inga externa CSS-ramverk krävs – använd befintlig app-styling om den finns, annars inline-styles räcker.

Innehåll uppifrån och ned:
1. **Rubrik** – "Handlargenerator"
2. **Formulär** med:
   - Dropdown: Skrå (id + namn)
   - Dropdown: Ras (id + namn)
   - Nummer-input: Antal föremål (4–12, default 8)
   - Dropdown: Lärdomsfokus (Ingen / Kristallsejdare / Shaman / Lyådskapare / Orakel)
   - Submit-knapp: "Generera prompt"
3. **Resultatsektion** (visas bara om `GeneradPrompt != null`):
   - Liten etikett: "Layout: {{LayoutId}}"
   - `<textarea readonly>` med hela prompten, tillräckligt stor (minst 40 rader)
   - Knapp: "Kopiera prompt" – kopierar textarea-innehållet via `navigator.clipboard.writeText`

---

### 4. `Program.cs` / registrering

Registrera `PromptAssembler` som `IPromptAssembler` med `builder.Services.AddSingleton`.
JSON-filerna laddas en gång vid startup och cachas i minnet – läs inte från disk vid varje request.

---

## Viktiga designbeslut

- **Ingen LLM-integration på serversidan** – sidan genererar bara prompten. Användaren kopierar och klistrar in själv.
- **Ingen databas** – allt lever i JSON-filerna.
- **PromptAssembler ska vara enhetstestbar** – ta in fildata via konstruktor-injection, inte via `File.ReadAllText` direkt i metoden.
- **Slumpvalet av layout** ska vara reproducerbart om man vill – använd `Random` normalt men gör det lätt att byta ut.
- **Fel-hantering:** Om ett ogiltigt `SkråId` eller `RasId` skickas in, returnera ett tydligt felmeddelande i `GeneradPrompt` istället för att krascha.

---

## Filstruktur att skapa

```
Services/
  IPromptAssembler.cs
  PromptAssembler.cs
Models/
  Merchant/
    RaserSkranData.cs
    ItemRulesData.cs
    LayoutsData.cs
    CreativityData.cs
    PromptParams.cs
Pages/
  MerchantGenerator.cshtml
  MerchantGenerator.cshtml.cs
```

---

## Verifiering när du är klar

1. `dotnet build` ska gå igenom utan fel.
2. Navigera till `/MerchantGenerator` – dropdowns ska vara populerade.
3. Välj valfritt skrå + ras + antal, klicka "Generera prompt".
4. Textarea ska visa en komplett prompt där inga `{{PLACEHOLDER}}`-strängar finns kvar.
5. Kopiera-knappen ska fungera.
