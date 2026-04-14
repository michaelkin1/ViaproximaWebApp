# Viaproxima – Handlargenerator
## Promptskelett v1.0
## Instruktion till PromptAssembler:
## Ersätt alla {{PLACEHOLDER}} med data från respektive JSON-fil.
## Sektioner markerade [STATISK] är fasta strängar.
## Sektioner markerade [INJICERAS] byggs dynamiskt av PromptAssembler.
## Håll det injicerade innehållet kompakt – välj ut, komprimera, dumpa inte hela JSON-filer.

---

Du genererar en handlare till stenåldersfantasyvärlden **Viaproxima**.
Följ instruktionerna exakt. Allt utom AI-bildprompten skrivs på svenska.

---

## [STATISK] A. VÄRLDSKONTEXT

Tekniknivå: stenålder. Material: trä, ben, sten, växtfibrer, läder, kristaller, fossiler, skal, harts, kitin.
Metall är extremt sällsynt och ses som magiskt/legendariskt.
Estetik: rå, organisk, hantverksmässig – men magisk.
Magi är nyckfull, personlig och kostsam. Magiska items bär alltid ett pris, synligt eller dolt.

Valuta: Cuppar (vardagligt) → Ferrar (mellannivå) → Aurar (sällsynt, starka magiska items).

---

## [INJICERAS] B. HANDLARENS RAS

Ras: **{{RAS_NAMN}}**
Visuella taggar: {{RAS_VISUELLA_TAGGAR}}
Material-bias: {{RAS_MATERIAL_BIAS}}
Estetisk bias: {{RAS_ESTETISK_BIAS}}

Låt rasen färga handlarens utseende och hur dennes varor ser ut och känns.

---

## [INJICERAS] C. HANDLARENS SKRÅ

Skrå: **{{SKRÅ_NAMN}}**
Tema: {{SKRÅ_TEMA_NYCKELORD}}
Estetisk bias: {{SKRÅ_ESTETISK_BIAS}}
Material-bias: {{SKRÅ_MATERIAL_BIAS}}
Riktning: {{SKRÅ_DESIGN_RIKTNING}}

Skråt styr varulistan mer än rasen. Rasen styr utseende och känsla.

Flavor – vad som är *konstigt och karakteristiskt* med detta skråets items:
{{SKRÅ_INSPIRATIONSKORN}}
Dessa är tänkesätt, inte mallar. Hitta din egen väg i samma anda.

---

## [INJICERAS] D. VARULISTA – LAYOUT OCH ITEMREGLER

### Layouten för denna handlare (slumpad från layouts.json):
Layout-ID: **{{LAYOUT_ID}}**
Generera exakt följande antal items per typ:
{{LAYOUT_COUNTS}}
*(Typnamn på svenska: {{ENUM_MAPPING}})*

### Kortfattade regler per itemtyp som förekommer i layouten:
{{INJICERADE_TYPREGLER}}
*(Endast regler för de typer som faktiskt finns i layouten injiceras här.)*

---

## [STATISK] E. KREATIVITETSINSTRUKTION

**Fördelning:** ~50% av items ska ha tydliga HV/CV/KV-bonusar. ~50% ska ha unika situationella effekter utan siffror.

**Kraftnivåer:**
- Vardagligt: ±1 HV eller enkel praktisk funktion. Nackdel sällan nödvändig.
- Unikt: ±2 HV eller specifik effekt med identitet. Gärna ett villkor eller en lätt nackdel.
- Magiskt: max ±3 HV eller kraftig effekt. Ska nästan alltid ha en kostnad, ett krav eller en begränsning. Magiskt item utan pris är ett designfel.

**Effektarketyper** – välj en per unikt eller magiskt item:
- **Villkorlig:** fungerar bara under ett specifikt villkor, men är exceptionellt när det uppfylls.
- **Dubbelsidig:** fördel och nackdel är oupplösligt sammanlänkade.
- **Narrativ:** berättar något om världen eller sin historia utan att förklara det rakt ut.
- **Situationell:** extremt stark i en specifik scen, nästan värdelöst annars.
- **Kostnad:** kräver ett aktivt val av bäraren för att fungera.

**Innan du skriver ut varje unikt eller magiskt item – kontrollera:**
1. Kan en spelare peka på en konkret scen där detta item är avgörande?
2. Är itemet omöjligt att förväxla med generisk fantasy?
3. Känns nackdelen/kostnaden som en del av identiteten, inte ett påklistrat straff?
Om nej på fler än ett – tänk om.

---

## [STATISK] F. MAGISYSTEM – KORTFATTAT

Använd bara om layouten innehåller LORE-items.

**Kristallsejdare:** Manapool = 2D6/dag. Besvärjelser kostar D6 ur poolen, kräver CV-krav. Exakt två sexor = miscast.
Items får ge: +1 CV, +1 besvärjelsetärning, mildra miscast, förstärka en specifik lära (röd/grön/gul/lila/orange/blå).
Får ej: eliminera miscast, ersätta manapoolen, ge obegränsad lagring.

**Shaman:** Ingredienser (raritet: Vanlig D3/D6 → Ovanlig D8/D10 → Sällsynt D12/D20 → Mytisk D30/D60) summeras till KV.
Ingredienstyper: Svampar (visioner), Djurdelar (förstärkning), Essens (elementritualer), Mineraler (skydd/försegling), Växter (helande/rening).
KV 10–20: enkla omen. KV 21–40: syner/förstärkning. KV 41–60: drömresor/vädermanik. KV 61+: gränser mellan världar.
Items får ge: räknas som specifik ingredienstyp/tärningsvärde, förstärka en ritualtyp, stabilisera vid KV-underskott.
Får ej: eliminera ingredienskrav, garantera framgång.

**Lyådskapare:** Kräver trans (~1 runda, sårbar), ljud som färdas, intakt instrument.
Inriktningar: Kontroll / Läsning / Flykt. Kraft skalas med nivå (5m/5kg → 500m/500kg).
Items får ge: kortare trans, skydda instrument, förstärka räckvidd/mål, låta ljud färdas genom ovanliga medier.
Får ej: ta bort behovet av ljud eller sårbarhet helt.

**Orakel:** Mirakel via rollspelad förhandling med sändebud. Utfall beror på nivå + relation + offer.
Items får ge: bättre förhandlingsposition, minska offerkrav begränsat, mildra dåligt utfall, lagra svag välsignelse.
Får ej: garantera mirakel, eliminera offrets eller relationens betydelse.

---

## [STATISK] G. OUTPUT-FORMAT

### 1. Handlarens grundinfo
- **Namn:**
- **Ras:** {{RAS_NAMN}}
- **Skrå:** {{SKRÅ_NAMN}}
- **Bakgrund** (3–6 meningar): personlighet, hur hen hamnade i skråt, ev. koppling till en av de fyra lärdomarna.
- **Utseende** (2–4 meningar): kropp, kläder, rasdrag, hur skråts symbol och varor syns på hen.

### 2. Varulista
Numrerad lista med exakt **{{ANTAL_ITEMS}} föremål** enligt layouten i sektion D.
För varje föremål:
- **Namn**
- **Typ** (t.ex. Närstridsvapen / Rustning / Tamdjur / Lärdomsitem)
- **Kraftnivå:** Vardagligt / Unikt / Magiskt
- **Beskrivning** (1–3 meningar, skråts ton tydlig)
- **Regelrad** (kortfattad, konkret)

Vapen skrivs enligt: *"En/Ett [adjektiv] [material+vapentyp] som gör [skadenivå] och väger [AxB]. Därtill [effekt]. Däremot [nackdel om rimlig]."*
Skadenivåer: Låg = D4 / Mellan = D4+4 / Hög = D4+8 / Extrem = D4+12. Mellan-nivå = 2D4+X.
Rustning: ange Lätt (6 hp, 2x1) / Medeltung (9 hp, 2x2) / Tung (12 hp, 3x2) + vilka skadenivåer den blockerar.
Sköld: Liten (+1 HV, 6 hp, 2x1) / Medeltung (+2 HV, 9 hp, 2x2) / Tung (+2 HV, 12 hp, 3x2, sköldstöt).
Tamdjur: ange storlek (fickdjur/fotdjur/riddjur/trampdjur), 1–2 evolutioner, konkret användning.

Avsluta listan med en mening om prisnivån på det dyraste magiska föremålet.

### 3. AI-bildprompt (engelska)
Börja exakt med:
*"In a black-and-white, highly detailed Viaproxima-style fantasy illustration (refined DeviantArt linework, smooth shading, intricate textures and atmospheric depth)"*
Beskriv handlaren som an anthropomorphic [race] i/vid sin butik eller marknadsplats.
Skråts tema ska synas tydligt. Nämn 2–3 visuellt intressanta föremål från listan.
Stenålderskänsla genomgående. Inga moderna material.

---

## [INJICERAS] H. INPARAMETRAR (fylls i av PromptAssembler)

- **Skrå:** {{SKRÅ_NAMN}}
- **Ras:** {{RAS_NAMN}}
- **Antal items:** {{ANTAL_ITEMS}}
- **Layout-ID:** {{LAYOUT_ID}}
- **Lärdomsfokus (valfri):** {{LÄRDOM_FOKUS}}
