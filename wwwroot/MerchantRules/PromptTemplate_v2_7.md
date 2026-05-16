GLOBAL RULE: All output except image_prompt must be in Swedish. This includes item names, type names, subtype names, descriptions, effects, limitations, drawbacks, and all other visible text. No exceptions.

# Viaproxima Merchant Prompt Skeleton v2.7
# v2.7 changelog: Archetype system replaces functional tags + twist tags. Lärdom rules pre-assigned by assembler. Drawbacks made optional. God selection rule added. Conciseness rule added. Verb diversity set updated.
# PromptAssembler strips lines beginning with # before sending.
# Replace all {{PLACEHOLDER}} before sending.
# ITEM_COUNT: inject actual item count (UI range 1–12).
# OUTPUT_TYPE_RULES: inject compressed prose blocks for types present in layout only.
# ITEM_SLOTS: inject slot list — type, archetype, inspiration, assigned_mechanic (lärdom types only) per slot.
# GUILD_MECHANIC_SIGNATURE: inject guild prompt_block from ViaproximaGuildMechanicSignatures.json.
# RACE_ONE_LINE / RACE_BODY_FEATURES: inject from ViaproximaRaceReminders.json.
# ASSEMBLER: currency line removed from WORLD_CONTEXT source file — no currency references in output.

---

You are generating a merchant for the stone age fantasy world **Viaproxima**. Output exactly one JSON object. Nothing else — no prose, no explanation, no markdown. Do not repeat item concepts across the {{ITEM_COUNT}} items.

---

## WORLD

{{WORLD_CONTEXT}}

---

## GUILD

**{{GUILD_NAME}}**

Theme: {{GUILD_THEME_KEYWORDS}} · Feeling: {{GUILD_VIBE_FEELING}} · Lore: {{GUILD_LORE}} · Functions: {{GUILD_FUNCTION_SPECTRUM}}

{{GUILD_MECHANIC_SIGNATURE}}

For each item, the guild mechanic signature pattern must appear in the effect field — not only in the name or description. At least half of all items must clearly express the guild's mechanic pattern in the effect.

Guild defines item function, purpose, and theme. Each item must express it differently.

---

## RACE

**{{RACE_NAME}}**

{{RACE_ONE_LINE}}
{{RACE_BODY_FEATURES}}

Race shapes appearance only. It does not affect item function or theme.

---

## ITEM LAYOUT

Generate exactly {{ITEM_COUNT}} items. Each slot defines: type, archetype, inspiration, and sometimes assigned_mechanic.

**Archetype**: creative mechanic seed. It shapes what the item DOES, not what it feels like. Execute the archetype as a concrete table-usable mechanic with a trigger, an outcome, and a frequency. Do not name the archetype in item text. Do not treat it as atmosphere or theme.

**Inspiration**: extract the underlying principle and discard the surface entirely — no imagery, named concepts, characters, or object forms from the source may appear in the item.

**assigned_mechanic**: only appears for KRISTALLSEJDARE, SHAMAN, LYÅDSKAPARE, or ORAKEL slots. It is mandatory — the item must execute that mechanic. Do not choose a different lärdom function.

Priority: type rules → assigned_mechanic if present → guild mechanic signature → archetype → inspiration → material/theme.

{{ITEM_SLOTS}}

---

## ITEM RULES

{{OUTPUT_TYPE_RULES}}

---

## TYPE DISAMBIGUATION — READ BEFORE CHOOSING TYPE_ID

A KRISTALLSEJDARE / SHAMAN / LYÅDSKAPARE / ORAKEL item modifies the practitioner's own mechanics (CV, KV, spell dice, mana pool, trance time, offering requirements, miscast risk, ritual speed, lore access). If a non-practitioner picks it up, it does nothing useful. An ADVENIRE item takes flavor from a lore tradition but its effect is self-contained and works for anyone — it does not touch CV, KV, trance, or negotiation mechanics. MISC is last resort, not default. Religion belongs to ORAKEL only — KRISTALLSEJDARE, SHAMAN, and LYÅDSKAPARE carry no gods, prayers, offerings, or sacred rituals.

Test: (1) Effect only works if bearer is a practitioner? → lore item. (2) Bearer needs no lore knowledge? → ADVENIRE (set lore_origin). (3) No lore flavor, doesn't fit weapon/armor/shield/pet? → MISC.

Examples: "Staff giving +1 CV on red-lore spells" → KRISTALLSEJDARE. "Red crystal projecting 3m of flame once per day" → ADVENIRE (lore_origin: KRISTALLSEJDARE). "Idol storing a divine blessing for later release" → ORAKEL. "Blessed bone amulet making anyone harder to trick" → ADVENIRE (lore_origin: ORAKEL).

---

## GOD SELECTION RULE

Only ORAKEL items may name gods or emissaries directly.

Do not default to the merchant race's patron god. Choose the god based on the item's function, assigned_mechanic, guild, and archetype.

Across one merchant, do not use the same named god more than once unless the assigned_mechanic explicitly requires it.

For ORAKEL items, choose by domain:
- Mitriki — knowledge, memory, truth, heritage
- Folgor — family, protection, instinct, courage
- Sternine — freedom, defiance, independence
- Ebba — sea, movement, change, yielding
- Kung Kallus — earth, fertility, weight, tribe
- Viaträdet — life, connection, balance, roots
- Mortmori — death, impermanence, decay, endings

---

## SHAMAN vs SHAMAN_INGREDIENT

SHAMAN_INGREDIENT — consumable with a die value based on rarity. Used in a ritual, contributes its dice to KV and is destroyed. Die values: Common 1D6, Uncommon 2D6, Rare 3D6, Mythic 4D6. Each ingredient type has a type_trait that activates when used: Fungi (Drömrök — reroll one die, keep new result), Animal parts (Blodskraft — raise one die by +1, max 6), Essence (Resonans — if two dice match, +2 KV), Minerals (Stadga — if ritual fails by ≤4 KV, soften backlash one step), Plants (Återväxt — a rolled 1 counts as 3). Mythic ingredients double their type_trait; only one Mythic trait may be doubled per ritual. SHAMAN_INGREDIENT is valid in standard merchant layouts. SHAMAN_INGREDIENT slots will also receive an archetype — use it to shape the ingredient's preparation, behavior, or activation condition. The archetype does not change the die value or type_trait.

SHAMAN (focus item) — a tool the shaman keeps. Shapes the ritual: reduces KV requirement, stabilizes miscasts, extends targets. Not consumed. If the effect is "reroll a KV die" or "lower KV requirement": SHAMAN item, not an ingredient.

---

## WEAPON PROFILE — MANDATORY FOR MELEE, RANGED, AMMO

Effect field for any MELEE or RANGED item must begin with: "En/Ett [adjective] [material] [subtype] som gör [damage level] skada och väger [AxB] rutor. Därtill [effect]. Däremot [drawback if warranted]." Examples: "En tung benklubba som gör Mellan skada och väger 2x1 rutor. Därtill..." / "En smal näverbåge som gör Låg till Mellan skada och väger 2x2 rutor. Därtill..." AMMO describes how it modifies the weapon's damage or function and how many uses it provides. If a weapon item lacks damage level, weight, or subtype: reject it and change type_id to what it actually is.

---

## EFFECT CLARITY RULE

Every effect field must answer these six questions in order. Not all six need a separate sentence — some can be implied by the trigger — but all six must be answerable from the effect text alone:

1. **Trigger** — what causes the effect to activate?
2. **Actor** — who or what does the thing (bearer, item, target, area)?
3. **Mechanical outcome** — what changes in game terms?
4. **Target** — who or what is affected?
5. **Duration** — how long does it last?
6. **Frequency** — how often can it be used?

**Forbidden core wording** (these describe sensation or abstraction, not game mechanics — rewrite any effect that relies on them as its main clause):
påverkar, vägleder, resonerar, känns, fungerar konstigt, avslöjar (without a mechanic), förändrar (without specifying what), kryper, smitar, renas, sjunger till, minns (without a mechanic), lockar (without a mechanic).

**Bad:** "Föremålet resonerar med bärarens avsikt och vägleder dem mot sanningen."
**Good:** "När bäraren ställer en direkt fråga till ett vittne, får bäraren +1 HV på att avgöra om svaret är sant. Fungerar en gång per scen."

---

## EFFECT LENGTH RULE

description: max 200 characters. One sentence. Physical object and one distinctive detail. No lore summary.

effect: max 400 characters. Three to five lines maximum. If the effect needs more words, the mechanic is too complex — redesign it.

If the effect has more than two conditional clauses: redesign it.

---

## EFFECT VARIETY RULE

Across all {{ITEM_COUNT}} generated items, no more than one-third (rounded down) may resolve to an HV bonus as their primary mechanical payoff. For 6 items: max 2. For 10 items: max 3. For 12 items: max 4.

An "HV-bonus payoff" means the core thing the effect produces is "+X HV on Y action" or "-X HV for target on Z action."

All remaining items must produce one of:
- a persistent object, terrain feature, or barrier players can interact with for a meaningful duration
- a helper creature, swarm, plant, or construct that acts on its own
- a stored effect, charge, voice, memory, weather, or wound for later release
- a redirected or transferred consequence, cost, harm, blame, or attention
- a temporary new rule, exception, or impossible condition active in a defined area or time window
- a usable resource, material, signal, charge, or substance the player gains
- a transformation of an existing object into a new function

HV bonuses may appear as secondary support inside these effects, but must not be the answer to "what does this item do?" If the HV cap has been reached, all remaining slots must use a non-HV payoff regardless of what the archetype suggests.

---

## DRAWBACK RULES

Optional. Omit if the archetype, assigned_mechanic, frequency limit, consumable use, recharge condition, or activation cost already creates tension. A clean limitation is better than a lazy drawback. Only include for Magical power_level items — never for Common or Unique.

**TIER A (preferred — give the GM material, choose from menu, vary across items):**
- the item changes behavior after use — grows, shrinks, darkens, hardens, softens, heats, cools, or smells different in a way others can observe
- material consumption that depletes a finite resource the bearer must replenish
- environmental change at the use site (scorch, frost-print, flattened ground, lingering smell, sound, or residue)
- attention shift that draws creatures, spirits, or rivals toward the bearer or location
- obligation, debt, or owed favor created toward a person, place, or faction
- temporary inability to use related items or perform related actions
- transferred risk that lands on an ally, animal, location, or future scene

**TIER B (acceptable):** visible mark or physical change on bearer that others can see; limited frequency (once per day/week/moon); requires specific condition to reactivate; consumes something bearer must replenish.

**TIER C (avoid — creates bookkeeping or kills play):** triggered by talking about the item; delayed effect at unknown future time; information visible to everyone except the bearer; slow debilitating effects over many sessions; drawbacks the GM must secretly track.

No Tier A or B option available? Write none. Clean limitation beats Tier C.

**Drawback must be expressible in one word or phrase the GM can track** (examples: "changed texture", "known", "consumed reagent", "scorched ground", "owes Mortokat debt", "can't use armor until rested").

**DRAWBACK DIVERSITY RULE:** Across all {{ITEM_COUNT}} items, no single Tier A category may appear more than one-quarter of the total item count rounded up. For 12 items: max 3 per category. For 6 items: max 2 per category.

---

## POWER LEVELS

Every item must feel worth owning. Common: no magic, clear tactical or practical niche — right tool for a specific situation; if a player shrugs, redesign. Unique: distinctive effect beyond generic gear, not necessarily magical, does something no ordinary version of itself can do. Magical: real magical effect tied to Advenire or one of the four lores; carry a limitation or drawback derived from the item's own nature; generic costs (fatigue, short duration, rare materials) are lazy; creates a decision at the table, not a stat boost. In a typical 10-item layout: ~2-3 Common, ~5-6 Unique, ~1-2 Magical. Scale proportionally. If everything is Magical, rebalance.

---

## STONE AGE HARD EXCLUSIONS

Never include: keys, locks, metal tools, books, paper, coins, glass, clockwork, gunpowder, refined metal. Metal exists only as a rare near-mythical material, never mundane equipment.

---

## FINAL PASS — REJECT AND REDESIGN

Before finalizing each item, answer these questions in order:

1. **Gameplay value:** What can the player now do, cause, prevent, prepare, delay, redirect, store, spend, risk, protect, expose, hide, force, transform, or make costly that they could not before? Write the answer in one verb-led sentence. Weak if used as the entire payoff: "+1 HV on next attack," "detect poison in food." These can work as components of a larger effect but must not be the whole thing. Strong: "create a temporary handhold on a smooth surface," "transfer one wound from an ally to an enemy," "make a named object impossible to lift until dawn."

2. **Clarity:** Can a player describe what it does in one sentence without reading the description? If not: simplify the mechanic.

3. **Guild identity:** Is the guild's mechanic signature in the effect field, or only in the name and description? If only flavor: redesign the effect.

4. **Overlap:** Does this share its core function with another item in this list? If yes: redesign.

5. **Drawback:** Is the drawback Tier C, or is it on a non-Magical item? If yes: remove or replace.

6. **Merchant-level diversity:** After all {{ITEM_COUNT}} items are drafted, assign each item's main usefulness one verb from this closed set: *detect, store, redirect, transform, create, restrain, transfer, anchor, shelter, exchange, conceal, expose, prepare, trigger, restore, break, move, protect, lure, misdirect, open, close, gamble, swap, distort*. No verb may appear more than one-quarter of {{ITEM_COUNT}} rounded up. For 12 items: max 3 per verb. For 6 items: max 2. Redesign the lowest-priority items in any over-represented group until compliant. Use only verbs from this list.

Do not emit an item that fails any of these checks.

---

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

---

## OUTPUT SCHEMA

Return exactly this JSON. No other text.

```json
{
  "merchant": {
    "name": "string",
    "race": "{{RACE_NAME}}",
    "guild": "{{GUILD_NAME}}",
    "backstory": "string — 2-3 sentences, gameable, at least one GM hook",
    "appearance": "string — 2-3 sentences, race features + guild identity on body and goods",
    "transport": "string — how the merchant moves their goods",
    "image_prompt": "string — begin exactly with: In a black-and-white, highly detailed Viaproxima-style fantasy illustration (refined DeviantArt linework, smooth shading, intricate textures and atmospheric depth) — describe the merchant as a {{RACE_NAME}} (see race block above for body features) at their stall or market, guild theme clearly visible, 2-3 visually striking items present, stone age throughout, no modern materials."
  },
  "items": [
    {
      "name": "string — Swedish compound, function/consequence based",
      "type": "string — Swedish type name",
      "subtype": "string — required for MELEE and RANGED, omit otherwise",
      "type_id": "MELEE | RANGED | AMMO | ARMOR | SHIELD | KRISTALLSEJDARE | SHAMAN | SHAMAN_INGREDIENT | LYÅDSKAPARE | ORAKEL | ADVENIRE | PETS | MISC",
      "power_level": "Common | Unique | Magical",
      "archetype": "string — assigned archetype keyword",
      "assigned_mechanic": "string — only if type_id is KRISTALLSEJDARE/SHAMAN/LYÅDSKAPARE/ORAKEL; omit otherwise",
      "lore_mechanic_choice": "string — required if type_id is KRISTALLSEJDARE/SHAMAN/LYÅDSKAPARE/ORAKEL; state which assigned_mechanic id and name was executed. Examples: '4 — Dice control (lock/reroll)' or '7 — Ritual trigger on defined outcome' or '3 — Negotiation aid (emissary attitude)'. Omit for all other types.",
      "ingredient_type": "Fungi | Animal parts | Essence | Minerals | Plants — only if SHAMAN_INGREDIENT, omit otherwise",
      "rarity": "Common | Uncommon | Rare | Mythic — only if SHAMAN_INGREDIENT, omit otherwise",
      "die_value": "string — only if SHAMAN_INGREDIENT, e.g. 1D6, 2D6, 3D6, 4D6 — omit otherwise",
      "advenire_lore_origin": "KRISTALLSEJDARE | SHAMAN | LYÅDSKAPARE | ORAKEL — only if ADVENIRE, omit otherwise",
      "description": "string — max 200 characters. One sentence. Physical object and one distinctive detail. No lore summary.",
      "effect": "string — max 400 characters. Answer: trigger, actor, outcome, target, duration, frequency. MELEE/RANGED: must begin with weapon profile recipe.",
      "limitation": "string — optional, only if inseparable from function",
      "drawback": "string — optional, Magical items only, Tier A or Tier B, expressible in one trackable word or phrase.",
      "affinities": ["string — other guild IDs that would naturally sell or use this item"]
    }
  ]
}
```

Items array: exactly {{ITEM_COUNT}} objects, in slot order.

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

---

## PARAMETERS

Race: **{{RACE_NAME}}**
Guild: **{{GUILD_NAME}}**
Layout ID: **{{LAYOUT_ID}}**
Item count: **{{ITEM_COUNT}}**
