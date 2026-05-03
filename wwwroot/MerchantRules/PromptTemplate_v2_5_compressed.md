GLOBAL RULE: All output except image_prompt must be in Swedish. This includes item names, type names, subtype names, descriptions, effects, limitations, drawbacks, and all other visible text. No exceptions.

# Viaproxima Merchant Prompt Skeleton v2.5c
# PromptAssembler strips lines beginning with # before sending.
# Replace all {{PLACEHOLDER}} before sending.
# ITEM_COUNT: inject actual item count (UI range 1–12).
# OUTPUT_TYPE_RULES: inject compressed prose blocks for types present in layout only.
# ITEM_SLOTS: inject slot list — type, tag, inspiration, twist per slot.
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

For each item, choose one mechanic pattern from the active guild signature unless the slot strongly suggests otherwise. The pattern must appear in the effect field as an actual trigger, condition, consequence, choice, state change, or rule interaction — not only in name, description, image prompt, or aesthetic. At least half of all items must clearly express the active guild mechanic signature in effect. Guild defines item function, purpose, and theme. Each item must express it differently.

---

## RACE

**{{RACE_NAME}}**

{{RACE_ONE_LINE}}
{{RACE_BODY_FEATURES}}

Race shapes appearance only. It does not affect item function or theme.

---

## ITEM LAYOUT

Generate exactly {{ITEM_COUNT}} items. Each slot defines: type, one tag, one inspiration source, and one twist.
Tag: points at a functional space or tension. Guild mechanic signature supplies the direction — the tag stops the slot defaulting to the guild's most obvious expression.
Inspiration: extract the underlying principle and hold it in mind while designing. Discard the surface entirely — no imagery, named concepts, characters, or object forms from the source may appear in the item.
Twist: design the item around the twist first. The twist is the item's core nature, not an added modifier.
Two slots may share an inspiration tag; treat each as a separate interpretation through its own type and twist.

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

## LÄRDOM ITEM PATTERNS — READ BEFORE WRITING LORE ITEMS

Effect must touch one of these valid mechanics. Flavor and aesthetics alone are not enough.

KRISTALLSEJDARE: CV bonus on specific lore or spell; extra spell dice from pool; mana pool manipulation (store, borrow, conserve dice); miscast dampening or redirect; strengthen lore range or target count; bind a spell to item for faster or cheaper casting; swap or borrow spells cross-lore.

SHAMAN: KV bonus on specific ritual type; reduce KV requirement; stabilize ritual on shortfall (reduce backlash risk); extend ritual to additional targets; item counts as an ingredient type without being consumed; help find or identify ingredients; bind a ritual to a location for repeat use.

LYÅDSKAPARE: trance entry time shortened or stabilized; protect bearer during trance (harder to interrupt); strengthen music effect range or target count; store a melody for later release; disrupt another sound mage's working; allow sound to pass through unusual media (stone, water, bone).

ORAKEL: improve negotiation position before emissary; reduce offering requirement; soften consequences of bad negotiation; store a blessing for a specific future moment; strengthen a specific god's inclination to respond; protect against divine wrath without eliminating it.

Priority: type rules → lore mechanic above → guild mechanic signature → tag/twist → flavor. If the effect touches none of the valid mechanics for its type_id: reject and rewrite.

---

## SHAMAN vs SHAMAN_INGREDIENT

SHAMAN_INGREDIENT — consumable with a die value (D3–D60). Used in a ritual, contributes its die and is destroyed. Primary function: "adds Dx to KV". Always includes: ingredient_type, rarity, die_value, consumed_on_use: true. SHAMAN_INGREDIENT is valid in standard merchant layouts and may appear in item layouts.

SHAMAN (focus item) — a tool the shaman keeps. Shapes the ritual: reduces KV requirement, stabilizes miscasts, extends targets. Not consumed. If the effect is "reroll a KV die" or "lower KV requirement": SHAMAN item, not an ingredient.

---

## WEAPON PROFILE — MANDATORY FOR MELEE, RANGED, AMMO

Effect field for any MELEE or RANGED item must begin with: "En/Ett [adjective] [material] [subtype] som gör [damage level] skada och väger [AxB] rutor. Därtill [effect]. Däremot [drawback if warranted]." Examples: "En tung benklubba som gör Mellan skada och väger 2x1 rutor. Därtill..." / "En smal näverbåge som gör Låg till Mellan skada och väger 2x2 rutor. Därtill..." AMMO describes how it modifies the weapon's damage or function and how many uses it provides. If a weapon item lacks damage level, weight, or subtype: reject it and change type_id to what it actually is.

---

## EFFECT CLARITY RULE

Every effect must read as a playable rule. Write in this order: trigger → who acts → what happens → to whom or what → for how long → frequency limit. If any element is missing and cannot be inferred at the table, the effect is incomplete — rewrite it.

These words describe impressions, not rules. If they appear as the core of an effect, reject the item and rewrite: påverkar, vägleder, resonerar, kryper, smitar, smitta, renas, avslöjar, fungerar konstigt, influences, guides, resonates.

BAD: "Rörelsen smitar till den som rör staven — effekten kryper vidare." / "Renas allt utom det som bör stanna kvar."
GOOD: "Bäraren får +1 HV på nästa förflyttningshandling. En gång per strid." / "Alla gifteffekter på bäraren avlägsnas omedelbart. En gång per dag."

An effect that cannot be read aloud at the table and immediately understood by every player is rejected.

---

## DRAWBACKS

Optional. Skip if item is already balanced by frequency or limitation.
TIER A (preferred — gives GM material): visible mark or physical change on bearer others can see; public knowledge that the bearer used it; permanent cosmetic or social consequence; grows more demanding or conspicuous with repeated use.
TIER B (acceptable): limited frequency (once per day/week/moon); requires specific condition to reactivate; consumes something bearer must replenish.
TIER C (avoid): triggered by talking about the item; delayed effect at unknown future time; information visible to everyone except the bearer; slow debilitating effects over many sessions; drawbacks the GM must secretly track.
No Tier A or B available? Write none. Clean limitation with no drawback beats Tier C.

---

## POWER LEVELS

Every item must feel worth owning. Common: no magic, clear tactical or practical niche — right tool for a specific situation; if a player shrugs, redesign. Unique: distinctive effect beyond generic gear, not necessarily magical, does something no ordinary version of itself can do. Magical: real magical effect tied to Advenire or one of the four lores; carry a limitation or drawback derived from the item's own nature; generic costs (fatigue, short duration, rare materials) are lazy; creates a decision at the table, not a stat boost. In a typical 10-item layout: ~2-3 Common, ~5-6 Unique, ~1-2 Magical. Scale proportionally. If everything is Magical, rebalance.

---

## STONE AGE HARD EXCLUSIONS

Never include: keys, locks, metal tools, books, paper, coins, glass, clockwork, gunpowder, refined metal. Metal exists only as a rare near-mythical material, never mundane equipment.

---

## FINAL PASS — REJECT AND REDESIGN

Before finalizing each item:
1. Would a player spend limited resources on this? Valid reasons to buy: deal more damage in a specific situation; survive something otherwise fatal; get information the party needs; move differently (farther, faster, around obstacles); solve a problem without fighting; make a key check more reliable; protect an ally; create advantage before a hard encounter; recover from failure; force a social outcome; express or conceal identity. If none of these apply: redesign.
2. Can a player describe what it does in one sentence without reading the description? If not: simplify.
3. Is guild identity in the effect field, or only in name and description? If only flavor: redesign effect.
4. Does this overlap with another item's core function in this list? If yes: redesign.
5. Is the drawback Tier C? If yes: remove or replace.

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
      "tag": "string",
      "ingredient_type": "Fungi | Animal parts | Essence | Minerals | Plants — only if SHAMAN_INGREDIENT, omit otherwise",
      "rarity": "Common | Uncommon | Rare | Mythic — only if SHAMAN_INGREDIENT, omit otherwise",
      "die_value": "string — only if SHAMAN_INGREDIENT, e.g. D8, D12, D20 — omit otherwise",
      "advenire_lore_origin": "KRISTALLSEJDARE | SHAMAN | LYÅDSKAPARE | ORAKEL — only if ADVENIRE, omit otherwise",
      "description": "string — 1-3 sentences, physical form first, guild identity unmistakable",
      "effect": "string — concrete, mechanical, explicit trigger and outcome. MELEE/RANGED: must begin with weapon profile recipe.",
      "limitation": "string — optional, only if inseparable from function",
      "drawback": "string — optional, Tier A or Tier B only",
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
