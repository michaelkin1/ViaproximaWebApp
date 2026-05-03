# Handlargenerator — Revised Development Plan v2

Read this file to understand the full scope. Execute one task at a time when instructed.

Each task is self-contained. Do not proceed to the next task unless instructed.

Do not overwrite original files. Always output to a new file or alongside originals unless the task explicitly says to update an existing project guidance file.

---

## GLOBAL EXECUTION RULES FOR CLAUDE CODE

- Read only the files listed at the top of each task unless blocked.
- Do not execute multiple tasks in one session unless explicitly instructed.
- Do not overwrite original files. Save new versions alongside originals.
- After each task, report:
  1. What was changed.
  2. Any assumptions made.
  3. Any issues found.
  4. Any files created or updated.
  5. Whether `CLAUDE.md` was updated.
- If a task is ambiguous, state the ambiguity and the assumption made before proceeding.
- At the end of every task, update `CLAUDE.md` with any relevant implementation notes, conventions, new files, placeholders, or changed behavior.
- If no `CLAUDE.md` exists, create one.
- If `CLAUDE.md` already exists, append or update a clearly marked section instead of duplicating stale notes.

---

# TASK 1 — Widget: `item_count` variable + randomizer

## Files to read first

- The existing widget source file.
- The existing prompt assembler source file, only if the widget calls into a separate assembler.
- `CLAUDE.md`, if present.

## What to do

### 1a. Item count

Implement or verify a tracked/reactive variable:

```js
item_count = sum of all per-type Antal inputs
```

Rules:

- `item_count` must update live on every `Antal` change.
- The `"Totalt: X / 12"` counter must be backed by this variable.
- If the total counter is currently display-only, refactor it into tracked state.
- `"Generera prompt"` button must be disabled when `item_count < 1`.
- On `"Generera prompt"` click, pass `item_count` to the prompt assembler.
- The assembler must substitute `{{ITEM_COUNT}}` in the template with the actual count.

### 1b. Randomizer UI

Add:

- Number input: `"Antal föremål att slumpa"`
  - default: `8`
  - min: `1`
  - max: `12`
- Button: `"Slumpa layout"`
- Helper text near the button:

```txt
Slumpa följer regler för kategorimax. Manuella val har inga sådana begränsningar.
```

On click:

- Run `randomizeLayout(total, guild)`.
- Fill all per-type `Antal` inputs with the result.
- Set all categories not returned by the randomizer to `0`.
- User can manually edit any `Antal` after randomizing.
- Manual edits must not be constrained by randomizer category caps.

### 1c. Randomizer logic

Write a pure function:

```js
randomizeLayout(total_items, guild)
```

It returns:

```js
{ category_id: count }
```

The `guild` argument may exist for future extension, but do not apply guild-specific guarantees in this task.

Randomizer-only rules:

- Max 5 categories selected.
- Max 5 items per category.
- Minimum 1 item if `total_items >= 1`.
- Maximum total should respect UI max 12.
- `SHAMAN_INGREDIENT` must be included in the randomizer pool.
- All categories have equal probability.
- Do not exclude `SHAMAN_INGREDIENT`.
- Do not implement guild guarantees.
- Do not bias by guild.

Edge cases:

- `total = 1`: one category, 1 item.
- `total = 2`: two categories, 1 each.
- `total >= 11`: must use 3+ categories if needed to respect the 5-per-category cap.
- If all selected categories hit cap and items remain: add another category if under the 5-category max.

Algorithm:

```txt
1. Determine target category count:
   - max_categories = min(5, total_items)
   - minimum selected categories = 1, but 2 if total_items >= 2
   - Pick a random integer between minimum and max_categories.
2. Uniformly pick that many categories from the full category pool.
   - Include SHAMAN_INGREDIENT.
3. Give each selected category 1 item.
   - remaining = total_items - selected_count.
4. Distribute remaining:
   - Uniformly pick from selected categories.
   - If chosen category is at cap 5: skip and re-pick.
   - If all selected categories are at cap and selected_count < 5:
     - add a new category from the remaining pool
     - set count to 1
     - remaining -= 1
     - continue
   - Else:
     - add 1 to chosen category
     - remaining -= 1
5. Return the dict.
```

### 1d. Remove guild guarantees

Do not add `GUILD_GUARANTEES`.

If a `GUILD_GUARANTEES` constant already exists from earlier work:

- Remove it if it is unused.
- If removal would break imports, remove the import and any references.
- Do not enforce any guild-specific randomizer guarantees.

Reason:

- Randomizer only needs to follow generic min/max/edge rules.
- Manual user edits after randomizing are allowed and unconstrained.
- Guild-specific constraints are unnecessary.

### 1e. Pre-flight check

Before making any changes, check whether the assembler currently filters `OUTPUT_TYPE_RULES` to only inject rule blocks for item types present in the layout.

Report:

- Yes/no.
- File path.
- Function or code area.
- Brief explanation of how the filtering currently works, or why it does not.

Do not fix unrelated assembler behavior in this task unless needed for `{{ITEM_COUNT}}`.

### 1f. Update `CLAUDE.md`

Update `CLAUDE.md` with:

- `item_count` behavior.
- Randomizer behavior.
- The fact that `SHAMAN_INGREDIENT` is included in randomizer pool.
- The fact that guild guarantees are intentionally not implemented.
- Any relevant source file paths.

## Output

Save updated widget as a new file alongside the original.

Report:

1. Whether `item_count` needed refactoring or was already tracked.
2. Whether `OUTPUT_TYPE_RULES` filtering exists.
3. Confirmation that `SHAMAN_INGREDIENT` is not excluded.
4. Confirmation that no guild guarantees were added.
5. Whether `CLAUDE.md` was updated.

---

# TASK 2 — Prompt template: content changes

## Files to read first

- `PromptTemplate.md`
- `ViaproximaItemRules.json`
- `world_context.txt`
- `ViaproximaFunctionalTags.json` from `wwwroot/merchant rules` or the current merchant-rules folder.
- The prompt assembler source file, only to identify placeholders and injected data shape.
- `CLAUDE.md`, if present.

## What to do

Produce:

```txt
PromptTemplate_v2_5.md
```

Do not overwrite the original.

Apply changes in this order.

---

## 2a. Remove price and cost

Remove from schema:

```json
"price": "Cuppar | Ferrar | Aurar"
```

Remove from schema:

```json
"cost": "string — ..."
```

Delete all mentions of:

- `Cuppar`
- `Ferrar`
- `Aurar`

If the currency line is hardcoded in `{{WORLD_CONTEXT}}`, delete it from injected world context or add this comment near the placeholder:

```md
# ASSEMBLER: strip currency line from WORLD_CONTEXT before injecting
```

The output schema must not contain price, cost, or currency fields.

---

## 2b. Fix item count references

Replace every hardcoded `"12"` that refers to generated item count with:

```md
{{ITEM_COUNT}}
```

Confirm the PARAMETERS block contains:

```md
Item count: **{{ITEM_COUNT}}**
```

Do not replace unrelated references to 12 if they are not about item count.

---

## 2c. Add `GUILD_MECHANIC_SIGNATURE` placeholder

In the GUILD section, add:

```md
{{GUILD_MECHANIC_SIGNATURE}}
```

Place it after the Functions line and before:

```md
Guild defines item function...
```

The assembler injects one active guild mechanic block from `ViaproximaGuildMechanicSignatures.json`.

Add clear instruction that guild mechanic identity must appear in the `effect` field for at least half the items.

Recommended wording:

```md
For each item, choose one mechanic pattern from the active guild signature unless the slot strongly suggests otherwise. The chosen pattern must appear in the effect field as an actual trigger, condition, consequence, choice, state change, or rule interaction. Do not satisfy the guild signature through name, description, image prompt, symbols, or aesthetic only. At least half of all items must clearly express the active guild mechanic signature in effect.
```

---

## 2d. Add RACE block

Insert after the GUILD section:

```md
## RACE

**{{RACE_NAME}}**

{{RACE_ONE_LINE}}
{{RACE_BODY_FEATURES}}

Race shapes appearance only. It does not affect item function or theme.
```

The assembler injects race reminders from `ViaproximaRaceReminders.json`.

---

## 2e. Update ITEM LAYOUT slot descriptions

Replace:

```md
Tag: directional cue shaping tone and function. Not a mechanical constraint.
Inspiration: one creative reference — draw on its logic and tone, never copy it, create something unique to Viaproxima.
Twist: one unexpected constraint or property that pushes the item beyond its default shape.
```

With:

```md
Tag: points at a functional space or tension. Guild mechanic signature supplies the direction — the tag stops the slot defaulting to the guild's most obvious expression.
Inspiration: extract the underlying principle and hold it in mind while designing. Discard the surface entirely — no imagery, named concepts, characters, or object forms from the source may appear in the item.
Twist: design the item around the twist first. The twist is the item's core nature, not an added modifier.

Two slots may share an inspiration tag; treat each as a separate interpretation through its own type and twist.
```

---

## 2f. Replace ITEM RULES section

Replace everything from `## ITEM RULES` through the end of the creativity check with the block below.

Keep:

```md
{{OUTPUT_TYPE_RULES}}
```

because it is still filled by the assembler.

```md
## ITEM RULES

{{OUTPUT_TYPE_RULES}}

---

## TYPE DISAMBIGUATION — READ BEFORE CHOOSING TYPE_ID

A KRISTALLSEJDARE / SHAMAN / LYÅDSKAPARE / ORAKEL item modifies the practitioner's own mechanics: CV, KV, spell dice, mana pool, trance time, offering requirements, miscast risk, ritual speed, lore access. If a non-practitioner picks it up, it does nothing useful.

An ADVENIRE item takes flavor from a lore tradition (colored crystal, blessed bone, locked tone, divine mark) but its effect is self-contained and works for anyone. It does not touch CV, KV, trance, or negotiation mechanics.

MISC is for anything that doesn't fit a rule-backed category. Last resort, not default.

Religion belongs to ORAKEL only. KRISTALLSEJDARE, SHAMAN, and LYÅDSKAPARE carry no gods, prayers, offerings, or sacred rituals.

Test before writing the effect:
1. Effect only works if bearer is a practitioner? → lore item.
2. Bearer needs no lore knowledge and the item just does the thing? → ADVENIRE (set lore_origin).
3. No lore flavor, doesn't fit weapon/armor/shield/pet? → MISC.

Examples:
- "Staff giving +1 CV on red-lore spells" → KRISTALLSEJDARE.
- "Red crystal projecting 3m of flame once per day" → ADVENIRE (lore_origin: KRISTALLSEJDARE).
- "Idol storing a divine blessing for later release" → ORAKEL (oracle must have negotiated it).
- "Blessed bone amulet making anyone harder to trick" → ADVENIRE (lore_origin: ORAKEL).

---

## SHAMAN vs SHAMAN_INGREDIENT

SHAMAN_INGREDIENT — consumable with a die value (D3–D60). Used in a ritual, contributes its die and is destroyed. Primary function: "adds Dx to KV". Always includes: ingredient_type, rarity, die_value, consumed_on_use: true.

SHAMAN (focus item) — a tool the shaman keeps. Shapes the ritual: reduces KV requirement, stabilizes miscasts, extends targets. Not consumed.

If the effect is "reroll a KV die" or "lower KV requirement": SHAMAN item, not an ingredient.

SHAMAN_INGREDIENT is valid in standard merchant layouts and may appear in item layouts.

---

## WEAPON PROFILE — MANDATORY FOR MELEE, RANGED, AMMO

Effect field for any MELEE or RANGED item must begin with:
"En/Ett [adjective] [material] [subtype] som gör [damage level] skada och väger [AxB] rutor. Därtill [effect]. Däremot [drawback if warranted]."

Examples:
- "En tung benklubba som gör Mellan skada och väger 2x1 rutor. Därtill..."
- "En smal näverbåge som gör Låg till Mellan skada och väger 2x2 rutor. Därtill..."

AMMO describes how it modifies the weapon's damage or function and how many uses it provides.

If a weapon item lacks damage level, weight, or subtype: reject it and change type_id to what it actually is.

---

## DRAWBACKS

Optional. Skip if item is already balanced by frequency or limitation.

TIER A (preferred — gives GM material):
- Visible mark or physical change on bearer others can see.
- Public knowledge — other characters know the bearer used it.
- Permanent cosmetic or social consequence.
- Grows more demanding or conspicuous with repeated use.

TIER B (acceptable):
- Limited frequency (once per day/week/moon).
- Requires specific condition to reactivate.
- Consumes something bearer must replenish.

TIER C (avoid):
- Triggered by talking about the item.
- Delayed effect at unknown future time.
- Information visible to everyone except the bearer.
- Slow debilitating effects over many sessions.
- Drawbacks the GM must secretly track.

No Tier A or B available? Write none. Clean limitation with no drawback beats Tier C.

---

## POWER LEVELS

Every item must feel worth owning.

Common: no magic, clear tactical or practical niche. Right tool for a specific situation. If a player shrugs, redesign.
Unique: distinctive effect beyond generic gear. Not necessarily magical. Does something no ordinary version of itself can do.
Magical: real magical effect tied to Advenire or one of the four lores. Carry a limitation or drawback derived from the item's own nature — ask what this specific item would cost given what it is. Generic costs (fatigue, short duration, rare materials) are lazy. Creates a decision at the table, not a stat boost.

In a typical 10-item layout: ~2-3 Common, ~5-6 Unique, ~1-2 Magical. Scale proportionally. If everything is Magical, rebalance.

---

## STONE AGE HARD EXCLUSIONS

Never include: keys, locks, metal tools, books, paper, coins, glass, clockwork, gunpowder, refined metal. Metal exists only as a rare near-mythical material, never mundane equipment.

---

## FINAL PASS — REJECT AND REDESIGN

Before finalizing each item:
1. Would a player spend limited resources on this? If only when GM forces it: redesign.
2. Can a player describe what it does in one sentence without reading the description? If not: simplify.
3. Is guild identity in the effect field, or only in name and description? If only flavor: redesign effect.
4. Does this overlap with another item's core function in this list? If yes: redesign.
5. Is the drawback Tier C? If yes: remove or replace.

Do not emit an item that fails any of these checks.
```

---

## 2g. Update OUTPUT SCHEMA

In the item object:

Remove:

- `price`
- `cost`

Add after `"tag"`:

```json
"ingredient_type": "Fungi | Animal parts | Essence | Minerals | Plants — only if type_id is SHAMAN_INGREDIENT, omit otherwise",
"rarity": "Common | Uncommon | Rare | Mythic — only if type_id is SHAMAN_INGREDIENT, omit otherwise",
"die_value": "string — only if type_id is SHAMAN_INGREDIENT, e.g. D8, D12, D20 — omit otherwise"
```

Update drawback field:

```json
"drawback": "string — optional, Tier A or Tier B only"
```

Update image prompt field:

```json
"image_prompt": "string — begin exactly with: In a black-and-white, highly detailed Viaproxima-style fantasy illustration (refined DeviantArt linework, smooth shading, intricate textures and atmospheric depth) — describe the merchant as a {{RACE_NAME}} (see race block above for body features) at their stall or market, guild theme clearly visible, 2-3 visually striking items present, stone age throughout, no modern materials."
```

---

## 2h. Replace affinities block

Replace:

```md
After generating all {{ITEM_COUNT}} items, assign affinities.
For each item consider which other guilds would naturally sell or use it.
Guild reference: {{GUILD_REFERENCE}}
Add matching guild IDs to affinities. Leave empty if strongly specific to {{GUILD_NAME}}.
```

With:

```md
After generating all {{ITEM_COUNT}} items, assign affinities.

ADVEOKATERNA — magic, oath, witness, record
MORTOKATERNA — restraint, pursuit, finality
ZOOKATERNA — animals, travel, spectacle, circus
FLOROKATERNA — plants, alchemy, remedy, harm, nature
EKOKATERNA — contracts, risk, value, debt, exchange
KARTOKATERNA — maps, terrain, distance, routes, navigation
FABROKATERNA — textile, identity, status, ornament
MATROKATERNA — tools, repair, durability, practical craft

For each item list 0–3 guild IDs whose merchants would naturally sell or use it. Leave empty if tightly specific to {{GUILD_NAME}}.
```

Remove `{{GUILD_REFERENCE}}` placeholder entirely.

---

## 2i. Add HARD RULES block

Insert just before `## OUTPUT SCHEMA`:

```md
## HARD RULES
- All output Swedish except image_prompt (English).
- Damage levels: Låg/Mellan/Hög/Extrem. Never numbers.
- Damage scale: Låg=D4, Mellan=D4+4, Hög=D4+8, Extrem=D4+12. Spans: Låg–Mellan=2D4, Låg–Hög=3D4, Mellan–Hög=2D4+4, Mellan–Extrem=2D4+8.
- MELEE subtype: Hackvapen | Trubbvapen | Repvapen | Stickvapen.
- RANGED subtype: Kastvapen | Pilbågar | Slungor | Blåsvapen.
- Heavy SHIELD (3x2) must mention shield bash in effect: on successful block of +2 HV or more, push target back, brief stun (loses next reaction).
- PET effect field: "Evolution 1 — [name]: [effect]. Evolution 2 — [name]: [effect]."
- HV bonuses ±1 to ±2. ±3 only for rare Magical items with a drawback. Never exceed ±3.
- CV/KV effects tilt the math, never replace the base mechanic.
- No price or currency fields in output.
- SHAMAN_INGREDIENT is valid in standard merchant layouts.
- Generate exactly {{ITEM_COUNT}} items in slot order. Count before returning.
```

---

## 2j. Functional tags compatibility check

Because `ViaproximaFunctionalTags.json` has received an overhaul, do not assume the old 72-tag / 11-category structure.

Claude Code must:

1. Read the current `ViaproximaFunctionalTags.json` in `wwwroot/merchant rules` or the actual merchant-rules folder.
2. Inspect its current structure.
3. Check how the widget and assembler currently read functional tags.
4. Verify that the current code still matches the JSON structure.
5. Report any mismatch between code expectations and actual JSON shape.
6. Do not rewrite the functional tags file in Task 2.
7. If minor code changes are needed so the assembler/widget can read the updated functional tag structure, make those changes only if they are directly required for template compatibility.

Examples of things to check:

- Does the code expect categories as arrays?
- Does the JSON now use nested objects?
- Are tag IDs still named consistently?
- Does the code expect `label`, `name`, `description`, or `note`?
- Does the prompt assembler include enough tag information for the template?
- Does the UI still populate tag choices correctly?

---

## 2k. Update `CLAUDE.md`

Update `CLAUDE.md` with:

- New template file name.
- New placeholders.
- Removed placeholders.
- No price/cost/currency rule.
- `SHAMAN_INGREDIENT` validity in standard layouts.
- Functional tags compatibility findings.
- Any updated code paths for functional tag loading.

## Output

Save as:

```txt
PromptTemplate_v2_5.md
```

Report any placeholder that exists in v2.5 but not in v2.4.

New placeholders introduced in v2.5:

- `{{GUILD_MECHANIC_SIGNATURE}}`
- `{{RACE_ONE_LINE}}`
- `{{RACE_BODY_FEATURES}}`

Removed placeholders:

- `{{GUILD_REFERENCE}}`

Also report:

- Whether the current functional tags JSON structure matches the code.
- Any code changes made because of functional tag structure changes.
- Whether `CLAUDE.md` was updated.

---

# TASK 3 — Prompt template: compression

## Files to read first

- `PromptTemplate_v2_5.md`
- `ViaproximaItemRules.json`
- Prompt assembler source file, if it injects `{{OUTPUT_TYPE_RULES}}`
- `CLAUDE.md`, if present.

## What to do

Produce:

```txt
PromptTemplate_v2_5_compressed.md
```

Apply compression to:

- `OUTPUT_TYPE_RULES` content.
- The template itself.

Nothing may be lost.

Readability must be preserved for:

- slot list
- OUTPUT SCHEMA
- HARD RULES

All other sections may be dense prose.

---

## 3a. Compress type rule blocks

The assembler injects type rules via:

```md
{{OUTPUT_TYPE_RULES}}
```

The injected content currently uses JSON object format. Convert each type block to dense prose.

Update the assembler's injection logic to use the compressed format.

Target format per type:

```md
MELEE (Närstridsvapen). Hit: (Accuracy+Strike)/2. Requires damage level/span, grid weight AxB. Subtype required: Hackvapen (edged/cleaves) | Trubbvapen (blunt/stuns) | Repvapen (flexible/hard to block) | Stickvapen (piercing/reach). Profile format defined in WEAPON PROFILE block.
```

```md
RANGED (Avståndsvapen). Hit: Skytte. Requires damage level/span, grid weight AxB. Note if ammo required — weapon unusable without it. Subtype required: Kastvapen (thrown, dual melee use) | Pilbågar (arrows, high range) | Slungor (stone/bone projectiles) | Blåsvapen (darts/thorns, silent, often poisoned). Profile format defined in WEAPON PROFILE block.
```

```md
AMMO (Ammunition). Requires consumption rule (uses or single-use). Modifies weapon damage or function situationally. Cannot permanently alter weapon base profile.
```

```md
ARMOR (Rustning). Block: 1D6 on hit, 5-6 succeeds, damage reduced one level. Durability loss: LOW -1, MID -2, HIGH -3, EXTREME destroys. Light: blocks LOW, Dur 6, 2x1, bast/leather/thin wood/plant fiber. Medium: blocks LOW+MID, Dur 9, 2x2, hardened hide/bone plates/thick wood. Heavy: blocks LOW+MID+HIGH, Dur 12, 3x2, fossil shell/stone plates/solid wood. Cannot block EXTREME or damage above design level.
```

```md
SHIELD (Sköld). Small: +1 HV, Dur 6, 2x1. Medium: +2 HV, Dur 9, 2x2, difficult with two-handed weapons. Heavy: +2 HV, Dur 12, 3x2, reduced mobility, allows shield bash. Shield bash rule defined in HARD RULES.
```

```md
KRISTALLSEJDARE (Kristallsejdarföremål). Focus items for crystal mages. Usually incorporate colored crystals. Effects: CV bonuses, extra spell dice, mana pool storage, miscast dampening, lore strengthening, lore borrowing, spell binding, spell storage. Cost tied to lore's emotional character. No religion.
```

```md
SHAMAN (Shamanföremål). Ritual tools — bone, roots, dried animal parts, stone, bark, fungus. Effects: KV modifications, ritual stabilization, ritual type strengthening, place-binding, ingredient finding, count as ingredient type, extend targets, remember rituals. Cost tied to natural use condition.
```

```md
SHAMAN_INGREDIENT (Shamaningrediens). Consumable ritual cards. Valid in standard merchant layouts. Contributes die value to KV, then destroyed. ingredient_type: Fungi (visions/poison/dreams/divination) | Animal parts (enhancement/senses/blood) | Essence (elemental/attunement/sensing) | Minerals (protection/sealing/focus) | Plants (healing/purification/growth/dampening). Rarity/die: Common D3-D6, Uncommon D8-D10, Rare D12-D20, Mythic D30-D60. Rare/Mythic may add one situational effect beyond KV.
```

```md
LYÅDSKAPARE (Lyådskaparföremål). Sound mage items — instruments, trance tools, sound-manipulation objects. Effects: instrument protection/strengthening/melody storage, trance shortening/stabilization, range/target extension, unusual media transmission (stone/water/bone), morale strengthening, tone storage, trance entry easing, disrupting other sound mages. Cost tied to sound — item may not fall silent, or binds bearer to a direction.
```

```md
ORAKEL (Orakelföremål). Sacred relics — inscribed stones, fossils, sacred bones, offering vessels. Effects: improved negotiation position, reduced offering requirement, softened poor outcome consequences, stored blessing, clearer signs/omens, strengthened god inclination, protection against divine wrath. Cost tied to divine — must return to sacred place or loses power if oracle breaks their god's code.
```

```md
ADVENIRE (Advenireföremål). Shaped by Advenire contact through one lore tradition. No lore knowledge needed — effect belongs to item. Specify lore_origin: KRISTALLSEJDARE | SHAMAN | LYÅDSKAPARE | ORAKEL. Inherits that tradition's flavor. KRISTALLSEJDARE-origin color/emotion: Red/Wrath (fire/explosive), Green/Shame (plants/ensnaring), Yellow/Joy (light/healing), Purple/Pride (lightning/necromancy), Orange/Love (stone/sheltering), Blue/Sorrow (water/melancholic).
```

```md
PETS (Tamdjur). All animals are hybrids of two real animals. Sizes: Pocket (mouse), Foot (cat/dog), Ride (horse), Trample (hippo/elephant). Max 2 evolutions at purchase. Evolution format defined in HARD RULES. Pets do not replace player character core roles.
```

```md
MISC (Övrigt). Jewelry, clothing, tools, contracts, maps, organic objects, relics, carrying equipment, instruments without lore connection, anything else. Describe what the item is in the type field. No mechanical restrictions beyond global rules. Last resort, not default.
```

---

## 3b. Additional compression

- Remove any duplicate instance of `"Race defines only the merchant's appearance — never the items"` because that rule now lives in the RACE block.
- Flatten nested bullet lists to single-level or comma-separated prose.
- Trim schema field comments to minimum.

Examples:

```json
"name": "string — Swedish compound, function/consequence based"
```

```json
"description": "string — 1-3 sentences, physical form first, guild identity unmistakable"
```

```json
"effect": "string — concrete, mechanical, explicit trigger and outcome. MELEE/RANGED: must begin with weapon profile recipe."
```

```json
"limitation": "string — optional, only if inseparable from function"
```

```json
"drawback": "string — optional, Tier A or Tier B only"
```

---

## 3c. Rule-preservation check

After compression, confirm every rule below is still present:

- Swedish-only output except image_prompt.
- Damage level names and dice values.
- MELEE/RANGED subtype requirement.
- Weapon profile mandatory format.
- No religion in KRISTALLSEJDARE/SHAMAN/LYÅDSKAPARE.
- ADVENIRE vs lore item disambiguation with examples.
- SHAMAN vs SHAMAN_INGREDIENT distinction.
- SHAMAN_INGREDIENT valid in standard merchant layouts.
- Heavy shield bash requirement.
- PET evolution format.
- HV bounds.
- CV/KV tilt-not-replace.
- Drawback tiers A/B/C.
- Power level definitions with distribution target.
- Stone age forbidden list.
- Final pass rejection rules.
- Guild mechanic signature placeholder.
- Guild mechanic must appear in effect field for at least half the items.
- Race block placeholders.
- Affinity reference static block.
- SHAMAN_INGREDIENT conditional schema fields.
- No price/cost fields.
- `{{ITEM_COUNT}}` instruction.

Report any missing rule.

Do not ship if anything is missing.

---

## 3d. Update `CLAUDE.md`

Update `CLAUDE.md` with:

- Compressed template file name.
- Compressed `OUTPUT_TYPE_RULES` injection format.
- Any assembler changes.
- Rule-preservation checklist result.

## Output

Save as:

```txt
PromptTemplate_v2_5_compressed.md
```

Report:

- Approximate token count versus `PromptTemplate.md`.
- Any missing rule.
- Whether `CLAUDE.md` was updated.

---

# TASK 4 — New data files

## Files to read first

- `ViaproximaGuildsLore.json`
- `ViaproximaRaces.json`
- Existing guild/race docs if they are already part of the merchant rules folder.
- `CLAUDE.md`, if present.

## What to do

Create two new JSON files.

---

## 4a. `ViaproximaGuildMechanicSignatures.json`

The assembler injects the active guild's `prompt_block` as:

```md
{{GUILD_MECHANIC_SIGNATURE}}
```

Make sure each guild block matches the established guild identity:

- ADVEOKATERNA are not only legal/judicial. They are also the magic-law guild. Their mechanics should include magical witnessing, oath magic, binding, verification, records, and formalized magical consequences.
- MORTOKATERNA are pursuit, restraint, punishment, execution, finality, enforcement.
- ZOOKATERNA are animal handlers, travelers, performers, and circus-like road people. Their mechanics should include travel, spectacle, signal, gathering, animal partnership, and movement.
- FLOROKATERNA are plant alchemists, healers, poisoners, nature workers, and druid-like practitioners. Their mechanics should include plant growth, decay, infusions, spores, roots, remedies, toxins, and living matter.
- EKOKATERNA are contracts, gambling, value, exchange, debt, risk, and monetary or quasi-monetary logic. Avoid actual coin/currency fields in output, but their item mechanics may involve value, debt, stake, bargain, and exchange.
- KARTOKATERNA are cartographers, route-finders, terrain readers, navigators, and geographic hunters. Their mechanics should include navigation, routes, distance, terrain, direction, return, and place-history.
- FABROKATERNA are textile, status, identity, ornament, role, display, and social legibility.
- MATROKATERNA are rough practical makers, tools, repair, durability, reinforcement, load-bearing, and craft.

Use this JSON structure:

```json
{
  "version": "1.0",
  "description": "Per-guild mechanic fingerprints injected as {{GUILD_MECHANIC_SIGNATURE}}.",
  "guilds": {
    "MORTOKATERNA": {
      "prompt_block": "..."
    }
  }
}
```

Use these prompt blocks unless the existing lore files strongly contradict them.

### MORTOKATERNA

```md
## MORTOKATERNA MECHANIC SIGNATURE
A Mortokaterna item's mechanic should express one of:
- Pursuit — tracks, follows, marks, or makes escape harder.
- Restraint — binds, holds, slows, pins, prevents departure.
- Toll — a cost accumulates while a debt, crime, wound, or sentence remains unresolved.
- Closing — brings an open matter to a final state: capture, verdict, ending, execution, silence.
- Presence-as-enforcement — the item's existence changes behavior nearby because people know consequence is coming.
At least half the items must express one of these in the effect field, not only in name or description.
```

### ADVEOKATERNA

```md
## ADVEOKATERNA MECHANIC SIGNATURE
An Adveokaterna item's mechanic should express one of:
- Magical witnessing — the item observes, records, testifies, remembers, or reacts to a magically significant act.
- Oath-binding — a spoken commitment, ritual phrase, mark, or formal act activates or locks a state.
- Consequence — an action in the past triggers an effect now, especially oath-breaking, falsehood, misuse of magic, or violated terms.
- Formal magic — effect requires procedure: declaration, named parties, witness, seal, inscription, repeated wording, or ritual order.
- Verification — the item confirms, denies, reveals, or challenges a claim, identity, magical trace, or stated truth.
At least half the items must express one of these in the effect field. The guild is legal, but also explicitly magical.
```

### ZOOKATERNA

```md
## ZOOKATERNA MECHANIC SIGNATURE
A Zookaterna item's mechanic should express one of:
- Travel — enables, accelerates, redirects, protects, or complicates movement on the road.
- Assembly/dispersal — gathers, scatters, summons, herds, queues, or directs groups.
- Animal-as-partner — a creature acts, carries, warns, performs, witnesses, or works alongside the bearer.
- Portable spectacle — designed for performance, display, distraction, staged danger, or use while traveling.
- Signal — calls, warns, commands, or communicates across distance, especially with animals or crowds.
At least half the items must express one of these in the effect field. The guild should feel like animals plus traveling circus, not just generic beast handling.
```

### FLOROKATERNA

```md
## FLOROKATERNA MECHANIC SIGNATURE
A Florokaterna item's mechanic should express one of:
- Growth or decay — something living increases, weakens, blooms, rots, scars, heals, or changes over time.
- Infusion — one substance changes the nature of another: salve, sap, smoke, tea, poultice, venom, spore, or dye.
- Spore/root logic — spreads, anchors, takes hold, returns after removal, grows through cracks, or connects hidden things.
- Care-dependent — responds mechanically to watering, neglect, feeding, pruning, sunlight, darkness, blood, ash, or song.
- Remedy-or-harm threshold — the same substance heals, reveals, poisons, numbs, maddens, or strengthens depending on dose or condition.
At least half the items must express one of these in the effect field. The guild should feel like plant alchemy, nature craft, healing, poison, and druidic manipulation of living matter.
```

### EKOKATERNA

```md
## EKOKATERNA MECHANIC SIGNATURE
An Ekokaterna item's mechanic should express one of:
- Trade-off — using it costs, risks, transfers, sacrifices, or exposes something else.
- Calculated value — effect scales with what is staked, offered, promised, owed, risked, or exchanged.
- Leverage — small input produces disproportionate outcome because timing, information, or pressure is exploited.
- Odds-shifting — changes probability, rerolls, margins, risk, or consequence without fully determining the result.
- Contract/debt — creates, marks, transfers, reveals, enforces, or settles an obligation.
At least half the items must express one of these in the effect field. The guild should feel like contracts, betting, value, risk, debt, and exchange. Do not reintroduce price or currency fields.
```

### KARTOKATERNA

```md
## KARTOKATERNA MECHANIC SIGNATURE
A Kartokaterna item's mechanic should express one of:
- Navigation — orients, guides, triangulates, points, marks a route, or prevents getting lost.
- Distance — measures, crosses, shortens, lengthens, communicates across, or compares spaces.
- Terrain — interacts with the specific nature of a place: swamp, cliff, cave, coast, forest, ruin, snow, road, river.
- Return — remembers where the bearer came from, how to get back, or what path has already been taken.
- History-with-place — the item has been somewhere, touched a landmark, mapped a route, or learned a terrain, and that gives it function.
At least half the items must express one of these in the effect field. The guild should feel like cartography, navigation, geography, and route mastery.
```

### FABROKATERNA

```md
## FABROKATERNA MECHANIC SIGNATURE
A Fabrokaterna item's mechanic should express one of:
- Legibility — makes something about the bearer readable to others: role, mood, allegiance, debt, danger, grief, oath, or status.
- Signaling — announces status, affiliation, rank, threat, permission, shame, protection, or claim at a glance.
- Identity rewrite — changes how others categorize the bearer, willingly or unwillingly.
- Garment-as-claim — wearing it asserts a right, role, relationship, protection, or obligation.
- Status-change — shifts the bearer's social position as a mechanical effect.
At least half the items must express one of these in the effect field.
```

### MATROKATERNA

```md
## MATROKATERNA MECHANIC SIGNATURE
A Matrokatena item's mechanic should express one of:
- Repair — restores function to something damaged, jammed, cracked, dulled, torn, spoiled, or broken.
- Reinforcement — makes something more resistant to failure under load, impact, weather, time, or misuse.
- Modularity — combines with, detaches from, adapts, reconfigures, or temporarily replaces part of another tool.
- Load-bearing — holds, carries, braces, drags, anchors, supports, or distributes weight over time.
- The thing that holds — functions specifically when other options have failed, broken, slipped, or become unreliable.
At least half the items must express one of these in the effect field.
```

Important: fix typo if noticed. The heading and text should use `MATROKATERNA`, not `Matrokatena`.

---

## 4b. `ViaproximaRaceReminders.json`

The assembler injects:

```md
{{RACE_ONE_LINE}}
{{RACE_BODY_FEATURES}}
```

Use this JSON structure:

```json
{
  "version": "1.0",
  "description": "Per-race reminder text injected into the RACE block as {{RACE_ONE_LINE}} and {{RACE_BODY_FEATURES}}.",
  "races": {
    "VIVEER": {
      "one_line": "...",
      "body_features": "..."
    }
  }
}
```

Race guidance:

- VIVEER: humanlike, tribal/ritual, varied.
- FAAMER: anthropomorphic mammal hybrids. May compare to a real mammal species that fits the generated merchant.
- VOLAMER: anthropomorphic bird hybrids. May compare to a real bird species that fits the generated merchant.
- FLEGAMER: anthropomorphic amphibian/reptile hybrids. May compare to a real amphibian or reptile species that fits the generated merchant.
- KALLUER: anthropomorphic arthropods. May compare to a real insect, arachnid, crustacean, or similar arthropod that fits the generated merchant.
- CRESEER: elemental/nature humanoids. Not only forest or dryad-like. Can be wood, stone, moss, fungus, crystal, fire, lightning, ash, water, ice, mineral, root, or mixed elemental matter.
- SKOTONER: weird, malformed, monstrous, uncanny, eldritch/horror-leaning. Not merely zombie or undead.
- VETTUER: animated meaningful object given purpose by magic. Object-logic anatomy.

Use these race blocks unless the existing race file strongly contradicts them.

### VIVEER

```txt
The most humanoid race — varied in size, build, skin markings, eye color, and tribal expression.

Ritual markings on skin or clothing, layered fiber garments, bone or carved-wood ornamentation. Balanced humanoid silhouette, earthy materials, expressive posture. May look almost human, but should still feel rooted in Viaproxima's stone-age ritual culture.
```

### FAAMER

```txt
Anthropomorphic mammal hybrids — fur, claws, tails, horns, tusks, hooves, muzzles, or heavy animal posture depending on species.

May be compared to a real mammal that fits the merchant: wolf, bear, fox, goat, deer, boar, otter, cat, dog, hare, bison, or similar. Dense fur or hide, visible claws or hooves, animal head structure, strong physical silhouette. Clothing and gear should adapt to the animal body.
```

### VOLAMER

```txt
Anthropomorphic bird hybrids — feathered, light-framed, beaked or beak-jawed, sometimes crested, plumed, long-necked, or taloned.

May be compared to a real bird that fits the merchant: raven, owl, hawk, gull, crane, dodo, parrot, vulture, heron, duck, or similar. Feathers cover much of the body, with bird-like feet, partial wings or wing-like arms, ornamental plumage, and a light or angular frame.
```

### FLEGAMER

```txt
Anthropomorphic amphibian and reptile hybrids — smooth, scaled, damp, cold-skinned, large-eyed, quiet, watchful, or slow-moving.

May be compared to a real amphibian or reptile that fits the merchant: frog, toad, salamander, axolotl, newt, turtle, lizard, gecko, snake, crocodile, or similar. Smooth or fine-scaled skin, large eyes, webbed or clawed hands and feet, shell or tail where appropriate. Ornamentation often uses shells, reeds, wetland fiber, bone, or polished stone.
```

### KALLUER

```txt
Anthropomorphic arthropods — insects, crustaceans, arachnids, myriapods, or mixed chitinous forms with segmented bodies and hard plating.

May be compared to a real arthropod that fits the merchant: beetle, scarab, crab, lobster, mantis, moth, spider, scorpion, ant, wasp, shrimp, centipede, or similar. Chitinous exoskeleton, mandibles, compound-eye facets, antennae, claws, pincers, extra arms, or segmented limbs. Silhouette should feel structural and non-mammalian.
```

### CRESEER

```txt
Elemental nature humanoids — bodies formed from living or nonliving natural matter. Not only forest spirits or dryads.

Body may be composed of wood, bark, root, moss, fungus, stone, crystal, clay, ash, fire, lightning-scored mineral, water, ice, sand, bone-like coral, or mixed elemental matter. Irregular asymmetrical anatomy, visible material transitions, rough surfaces, growths, cracks, glowing seams, embers, mineral veins, wet surfaces, or storm-like marks depending on element.
```

### SKOTONER

```txt
Malformed, uncanny, monstrous humanoids with a strange horror cast — not simply undead and not only sickly.

Asymmetrical bodies, extra eyes, wrong joints, stretched mouths, exposed cords, worm-like growths, mask-like faces, patchy fur or skin, lesions, fused features, impossible proportions, or eldritch details. They can be grotesque, eerie, or absurdly unsettling while still being people. Gear is rough, dark, scavenged, fiber-bound, bone-pinned, or hide-wrapped.
```

### VETTUER

```txt
An animated object given purpose by magic — not an animal hybrid. An object that became a person-like being.

Origin form remains visible: a loom-vettu has thread hair and frame limbs, a tool-vettu has handle-grip hands, a shield-vettu has a broad torso, a cart-vettu has wheel or axle logic, a vessel-vettu has hollow-body structure. Object-logic anatomy, worn surfaces, functional components as body parts. Not soft, mammalian, or organic unless the original object was organic material.
```

---

## 4c. Validate JSON

After creating both files:

- Confirm they parse as valid JSON.
- Confirm every required guild key exists.
- Confirm every required race key exists.
- Confirm no accidental typo in guild IDs.
- Confirm `MATROKATERNA` spelling.
- Confirm all prompt blocks are strings, not arrays.

---

## 4d. Update assembler if needed

If the assembler already supports external data injection:

- Add loading for `ViaproximaGuildMechanicSignatures.json`.
- Add loading for `ViaproximaRaceReminders.json`.
- Inject:
  - `{{GUILD_MECHANIC_SIGNATURE}}`
  - `{{RACE_ONE_LINE}}`
  - `{{RACE_BODY_FEATURES}}`

If assembler update belongs in another task based on current structure, report that instead of forcing it.

---

## 4e. Update `CLAUDE.md`

Update `CLAUDE.md` with:

- New files.
- Injection placeholders.
- Guild mechanic purpose.
- Race reminder purpose.
- The fact that race affects merchant appearance only, not item function.
- Any assembler changes or required future assembler work.

## Output

Save both files:

```txt
ViaproximaGuildMechanicSignatures.json
ViaproximaRaceReminders.json
```

Confirm:

- Valid JSON.
- All guilds present.
- All races present.
- `CLAUDE.md` updated.

---

# TASK 5 — Update `ViaproximaItemRules.json`

## Files to read first

- `ViaproximaItemRules.json`
- `CLAUDE.md`, if present.

## What to do

One content change only.

In the `SHAMAN_INGREDIENT` type rule, update the `note` field.

Current:

```json
"Rare and Mythic ingredients may carry an additional situational effect beyond their KV contribution. Generated in separate ingredient layouts, never in standard merchant layouts."
```

Updated:

```json
"Rare and Mythic ingredients may carry an additional situational effect beyond their KV contribution."
```

Remove the exclusion sentence.

Reason:

- `SHAMAN_INGREDIENT` is now valid in standard merchant layouts.
- This must not conflict with Task 1. Task 1 randomizer must include `SHAMAN_INGREDIENT`.

Save as:

```txt
ViaproximaItemRules_v2_5.json
```

Do not overwrite the original.

## 5a. Consistency check

After saving:

- Confirm `SHAMAN_INGREDIENT` is not described as excluded from standard merchant layouts anywhere in `ViaproximaItemRules_v2_5.json`.
- If the widget or assembler has comments saying `SHAMAN_INGREDIENT` is excluded, report them.
- Do not make broad code changes in Task 5 unless needed to avoid direct contradiction.

## 5b. Update `CLAUDE.md`

Update `CLAUDE.md` with:

- New item rules file name.
- `SHAMAN_INGREDIENT` is valid in standard layouts.
- Rare/Mythic note update.
- Any remaining references found that still imply exclusion.

## Output

Report:

- File saved.
- JSON validity.
- Confirmation that exclusion sentence was removed.
- Whether any remaining contradiction was found.
- Whether `CLAUDE.md` was updated.

---

# TASK 6 — Validate functional tags overhaul against code

## Files to read first

- Current `ViaproximaFunctionalTags.json` in `wwwroot/merchant rules` or the current merchant-rules folder.
- Widget source file.
- Prompt assembler source file.
- Any source file that loads or maps functional tags.
- `CLAUDE.md`, if present.

## Current state

The functional tags JSON has already been overhauled manually.

Do not create a new functional tags JSON file in this task.

This task is no longer about expanding tags. It is about validating that the current code still matches the updated JSON structure.

## What to do

### 6a. Inspect current JSON structure

Read the current functional tags file and identify:

- Top-level keys.
- Version field, if any.
- Metadata fields, if any.
- Category structure.
- Tag object structure.
- Required fields used by the UI or assembler.
- Whether tags are arrays or keyed objects.
- Whether categories are arrays or keyed objects.
- Whether fields are named `id`, `name`, `label`, `description`, `note`, `category`, or something else.

### 6b. Inspect code expectations

Find all code paths that read functional tags.

Check whether the code assumes:

- Old category names.
- Old total count.
- Old array structure.
- Specific field names.
- Specific file path.
- Tag IDs with a certain prefix or numbering scheme.
- Tags have `note`.
- Tags have `description`.
- Tags are grouped by category.
- UI expects dropdown labels from a specific property.
- Assembler expects prompt text from a specific property.

### 6c. Compare JSON vs code

Report whether the new functional tag file matches code expectations.

Classify findings:

- OK: code and JSON match.
- Minor mismatch: can be fixed without changing behavior.
- Major mismatch: requires user decision or broader refactor.

### 6d. Fix only direct compatibility issues

If there are clear direct compatibility issues, update code so it can read the current functional tag file.

Do not rewrite the functional tags JSON unless it is invalid JSON and the user explicitly asks to fix it.

Acceptable code fixes:

- Adjust field access from `description` to `note` if the new file clearly uses `note`.
- Support both arrays and keyed objects if simple.
- Support both `name` and `label` if simple.
- Update file path if the code points to an old location.
- Update prompt assembler mapping if it omits needed tag text.

Do not:

- Generate new tags.
- Rename all tags.
- Restructure the JSON.
- Enforce old category count.
- Enforce old total count.
- Assume the target is 150 tags.
- Create `ViaproximaFunctionalTags_v3_0.json`.

### 6e. Validate JSON

Confirm current functional tags file is valid JSON.

If invalid:

- Report the parse error.
- Do not silently rewrite the file.
- Suggest the smallest correction.

### 6f. Update `CLAUDE.md`

Update `CLAUDE.md` with:

- Current functional tag file path.
- Current detected structure.
- Code expectations.
- Any compatibility fixes made.
- Any remaining mismatches.
- Explicit note that functional tags are already overhauled and should not be regenerated by this plan.

## Output

Report:

1. Valid JSON yes/no.
2. Detected structure.
3. Whether widget code matches.
4. Whether assembler code matches.
5. Any code changes made.
6. Any unresolved mismatch.
7. Whether `CLAUDE.md` was updated.

---

# OVERALL PLACEHOLDER CHANGES

New placeholders introduced:

```md
{{GUILD_MECHANIC_SIGNATURE}}
{{RACE_ONE_LINE}}
{{RACE_BODY_FEATURES}}
```

Existing placeholder still used:

```md
{{ITEM_COUNT}}
{{OUTPUT_TYPE_RULES}}
```

Removed placeholder:

```md
{{GUILD_REFERENCE}}
```

Potential assembler responsibilities:

- Inject item count.
- Inject active guild mechanic signature.
- Inject race reminder fields.
- Inject only relevant output type rules if filtering exists.
- Inject functional tag data according to the current overhauled JSON structure.
- Strip or avoid currency references from world context if needed.

---

# CONSISTENCY RULES ACROSS TASKS

These must stay consistent across all tasks:

- `SHAMAN_INGREDIENT` is valid in standard merchant layouts.
- `SHAMAN_INGREDIENT` is included in randomizer pool.
- No guild guarantees are used in randomizer logic.
- Manual layout edits are unconstrained.
- No price/cost/currency fields in output.
- Guild identity must affect item mechanics, especially the `effect` field.
- Race affects merchant appearance only, not item function.
- Functional tags file has already been overhauled and should be validated against code, not regenerated.
- `CLAUDE.md` must be updated after every task.
