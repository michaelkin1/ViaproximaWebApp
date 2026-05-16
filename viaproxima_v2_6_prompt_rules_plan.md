# V2.6 — Prompt Rules + Lärdom Expansion

This is a self-contained Claude Code task covering all prompt-side changes for V2.6.
It does NOT touch the webapp, widget, DB, or viewer. Those live in the unified plan.

**Operating rules:**
- Read every listed file before making any change.
- Show a diff of proposed changes before applying them.
- Stop after each numbered task and wait for confirmation.
- Do not tidy adjacent content not listed in the task.
- Do not overwrite any v2.5 file — always save as a new versioned file.
- After each task, print the section headers or top-level keys of the modified file in order.
- All rule-level content (function menus, constraints, tests, notes) must be in English.
- World-flavor lore content (guild lore, god names, ingredient trait names like Drömrök) stays Swedish.
- Proper game-system terms (besvärjelse, trans, offergåva, sändebud, lyåd, KV, CV, HV, lore color names) stay Swedish in both contexts — they are proper nouns, not translated instructions.
- Before inserting any new content, check the language of the surrounding block. If mismatch, flag and wait — do not silently mix languages.

**Files in scope:**
- The active item rules JSON (find it by checking which file Program.cs or PromptAssembler.cs loads — likely `ViaproximaItemRules_v2_5.json` or similar)
- The active compressed prompt template (find it by checking which file PromptAssembler.cs loads — likely `PromptTemplate_v2_5_compressed.md` or similar)
- `world_context.txt`

**Files NOT in scope:**
- Guild JSONs, race JSON, inspiration tag JSONs, twist tag JSON, functional tags JSON, layout JSON, any .cs files, Program.cs, widget source

**Output files (do not overwrite v2.5):**
- `ViaproximaItemRules_v2_6.json`
- `PromptTemplate_v2_6.md`

---

## PRE-TASK — File discovery

Before anything else:

1. Open `PromptAssembler.cs` and identify:
   - Which item rules JSON file is currently loaded.
   - Which prompt template file is currently loaded.
   - Which other merchant rule JSON files are loaded (functional tags, guild mechanics, race reminders, twist tags, etc.).

2. Read all identified files fully.

3. Report:
   - Exact file paths for item rules and prompt template.
   - Current version strings in both files.
   - Whether the prompt template already contains any of: TYPE DISAMBIGUATION block, HARD TYPE BOUNDARY block, LÄRDOM ITEM PATTERNS block, EFFECT CLARITY RULE block, DRAWBACK RULES block, EFFECT VARIETY RULE block.
   - Whether the item rules JSON already has a `hard_type_boundary` key.
   - Whether KRISTALLSEJDARE, SHAMAN, LYÅDSKAPARE, ORAKEL type rules already have a `function_menu` key.

4. Check whether a `.gitignore` exists in the project root. If yes, append `viaproxima_v2_6_implementation_plan.md` to it. If no `.gitignore` exists, create one containing only that filename. Show the result.

Stop here. Wait for confirmation before Task 1.

---

## TASK 1 — KRISTALLSEJDARE rules expansion

**File:** Active item rules JSON
**Target:** `type_rules.KRISTALLSEJDARE` block

Replace the entire existing KRISTALLSEJDARE block with:

```json
"KRISTALLSEJDARE": {
  "swedish_name": "Kristallsejdarföremål",
  "description": "Focus items for Kristallsejdare who cast spells (besvärjelser) through colored crystals and emotional lores. Almost always incorporate crystals in some form — set, inscribed, or carried loose. Color corresponds to lore.",
  "rule": "A KRISTALLSEJDARE item only works for a Kristallsejdare and must modify spellcasting mechanics. If the item produces magic on its own and anyone can use it, it is ADVENIRE, not KRISTALLSEJDARE.",
  "lores": {
    "Röd vrede": "Fire, smoke, explosion, destruction, pressure.",
    "Grön skam": "Plants, animals, roots, growth, nature.",
    "Gul glädje": "Light, warmth, healing, comfort, protection.",
    "Lila stolthet": "Lightning, necromancy, dominance, death-force.",
    "Orange kärlek": "Stone, sand, weight, shelter, endurance.",
    "Blå sorg": "Water, wind, stillness, storm, loss, movement."
  },
  "function_menu": {
    "1": "CV bonus — +1 to +3 CV for a specific lore, spell type, target type, emotional state, risk, or situation. +3 requires Magical power level and a drawback.",
    "2": "Store spell dice — stores one or more dice for later casting.",
    "3": "Extra spell die — grants one additional die for a specific lore, spell type, or condition.",
    "4": "Dice control — lets the Kristallsejdare lock, reroll, swap, split, lower, raise, or preserve a spell die.",
    "5": "Reduce miscast — softens, delays, redirects, or weakens a miscast.",
    "6": "Risk trade — increases miscast risk in exchange for a stronger spell, extra die, higher CV, additional targets, longer duration, or stronger form.",
    "7": "Extra spell access — lets the Kristallsejdare temporarily gain, prepare, choose, or stabilize an additional spell.",
    "8": "Spell selection — choose a spell instead of rolling, reroll a spell selection, or lock a known spell in place.",
    "9": "Borrow from another lore — borrows a limited effect from a different lore. Must have a clear limitation, cost, or miscast risk.",
    "10": "Bind spell — binds a spell into the item so it can be cast later, faster, cheaper, or under a specific condition.",
    "11": "Shape spell — changes range, area, target count, duration, physical form, trigger, or a secondary physical detail.",
    "12": "Emotional catalyst — requires the caster to express, acknowledge, conceal, or risk the lore's emotional state to gain the benefit."
  },
  "effect_must_state": [
    "which lore, color, emotional state, or spell category is affected",
    "which casting mechanic is changed (CV, dice, miscast, spell selection, spell shape)",
    "when the Kristallsejdare activates the item",
    "how often it can be used"
  ],
  "note": "Magical items carry a cost tied to the lore's emotional character — a wrath-lore item might cost calm; a sorrow-lore item might demand a memory."
}
```

**Verification:** Print top-level keys of `type_rules.KRISTALLSEJDARE`. Confirm presence of: `swedish_name`, `description`, `rule`, `lores`, `function_menu`, `effect_must_state`, `note`. Confirm `function_menu` has keys 1 through 12.

Stop. Wait for confirmation before Task 2.

---

## TASK 2 — SHAMAN rules expansion + SHAMAN_INGREDIENT revamp

**File:** Active item rules JSON
**Targets:** `type_rules.SHAMAN` AND `type_rules.SHAMAN_INGREDIENT`

### 2A — Replace SHAMAN block

```json
"SHAMAN": {
  "swedish_name": "Shamanföremål",
  "description": "Reusable ritual tool for Shamaner who perform rituals (ritualer) with ingredients. Natural and organic — bone, roots, dried animal parts, stone, bark, fungus. Worn and personal, marked by many rituals. Not consumed as an ingredient.",
  "rule": "A SHAMAN item only works for a Shaman and must modify how rituals are performed. If the item produces magic on its own and anyone can use it, it is ADVENIRE, not SHAMAN.",
  "function_menu": {
    "1": "Find ingredients — helps the shaman locate, identify, preserve, improve, or harvest ingredients.",
    "2": "KV bonus — +1 to +3 KV under a specific ritual condition. +3 requires Magical power level and a drawback.",
    "3": "Upgrade die — upgrades one or more ritual dice under a specific condition (example: one D6 becomes D10). Affects the roll, not the ingredient permanently.",
    "4": "Backlash control — softens backlash, weakens severe backlash, protects an ingredient from being consumed on a near-miss.",
    "5": "Set bonus interaction — counts an ingredient as a different type, completes a 3-set, strengthens three of the same type, or lets an ingredient count as a wildcard.",
    "6": "Trait amplifier — improves a specific ingredient type: Fungi rerolls an extra die, Animal parts raise more dice, Essence adds more KV, Minerals soften more backlash, Plants convert more 1s.",
    "7": "Ritual trigger — activates when a ritual is performed under a specific condition. Examples: on a successful ritual with 5+ margin, a ritual remnant is stored; on a miss by 4 or less, backlash is delayed; on three 1s, backlash redirects into the item.",
    "8": "Place binder — binds a ritual to a location, allows a weak repeat at that place, improves rituals on prepared ground, or stores the location's ritual memory.",
    "9": "Ritual shaper — changes target count, area, duration, physical form, delay, or anchor point.",
    "10": "Ingredient converter — swaps one ingredient type for another, downgrades rarity for safety, combines weak ingredients, or splits a strong ingredient.",
    "11": "Ritual storage — stores unused KV, a ritual echo, a failed ritual remnant, or a preserved type_trait."
  },
  "effect_must_state": [
    "when the shaman uses the item",
    "which part of the ritual is affected (KV, backlash, die size, ingredient type, set bonus, type_trait, ritual shape, place, or storage)",
    "how often it can be used"
  ],
  "note": "Magical items carry a concrete natural cost — must be buried after use, requires blood, functions only in specific terrain."
}
```

### 2B — Replace SHAMAN_INGREDIENT block

This is a full revamp. The previous D3–D60 die_value system tied to rarity is replaced with a D6-based system with type_traits per ingredient type.

```json
"SHAMAN_INGREDIENT": {
  "swedish_name": "Shamaningrediens",
  "description": "Consumable ritual ingredient for Shamaner. Destroyed when used in a ritual. Contributes dice to KV.",
  "structure": {
    "ingredient_type": "Fungi | Animal parts | Essence | Minerals | Plants",
    "rarity": "Common | Uncommon | Rare | Mythic",
    "die_value": {
      "Common": "1D6",
      "Uncommon": "2D6",
      "Rare": "3D6",
      "Mythic": "4D6"
    },
    "consumed_on_use": true,
    "type_trait": "see ingredient_types below"
  },
  "ingredient_types": {
    "Fungi": {
      "domain": "Mushroom, spores, rot, dream, hallucination, hidden growth.",
      "trait": "Drömrök — after rolling, the shaman may reroll one die and must keep the new result."
    },
    "Animal parts": {
      "domain": "Bone, blood, claw, horn, hide, tooth, organ, instinct.",
      "trait": "Blodskraft — raise one die result by +1 after rolling, max 6."
    },
    "Essence": {
      "domain": "Weather residue, emotional sediment, elemental trace, Advenire leakage, breath, shadow, light.",
      "trait": "Resonans — if two dice show the same value after rolling, add +2 KV."
    },
    "Minerals": {
      "domain": "Stone, crystal dust, clay, fossil, salt, ash, heavy earth.",
      "trait": "Stadga — if the ritual fails by 4 KV or less, backlash is softened one step."
    },
    "Plants": {
      "domain": "Roots, bark, seeds, sap, flowers, moss, thorns, living fibers.",
      "trait": "Återväxt — a rolled 1 counts as 3."
    }
  },
  "mythic_rule": "A Mythic ingredient contributes 4D6 and its type_trait is doubled. Only one Mythic trait may be doubled per ritual.",
  "rare_mythic_bonus": "Rare and Mythic ingredients may have a concrete additional ritual effect beyond KV. The effect must modify what a shaman ritual can do, not produce standalone magic usable without a ritual.",
  "note": "SHAMAN_INGREDIENT is valid in standard merchant layouts."
}
```

**Verification:** Print top-level keys of both blocks. Confirm SHAMAN has `function_menu` with keys 1 through 11 and `effect_must_state`. Confirm SHAMAN_INGREDIENT has `ingredient_types` with all five types each containing `domain` and `trait`, and that the `die_value` table uses 1D6/2D6/3D6/4D6 by rarity.

Stop. Wait for confirmation before Task 3.

---

## TASK 3 — LYÅDSKAPARE rules expansion

**File:** Active item rules JSON
**Target:** `type_rules.LYÅDSKAPARE` block

Replace the entire existing LYÅDSKAPARE block with:

```json
"LYÅDSKAPARE": {
  "swedish_name": "Lyådskaparföremål",
  "description": "Items for Lyådskapare who create songs and lyåder through instruments, song, rhythm, humming, breathing, vibration, silence, or repeated sound. Through the lyåd they enter trance (trans) and project their soul via Advenire.",
  "trance_capabilities": [
    "move objects",
    "steer objects",
    "teleport self or others",
    "read thoughts",
    "affect senses",
    "command, calm, confuse, or distract",
    "project presence or perception",
    "carry sound through unusual media",
    "affect larger objects or more targets through stronger trance"
  ],
  "rule": "A LYÅDSKAPARE item only works for a Lyådskapare and must help with trance, lyåd, soul projection, range, targets, object size, mental influence, or teleportation. If the effect works without trance, it is ADVENIRE.",
  "function_menu": {
    "1": "Trance entry — helps the Lyådskapare enter trance faster, more safely, more quietly, or under stress.",
    "2": "Trance stability — helps maintain trance despite pain, sound, movement, fear, interruption, combat, or magical disruption.",
    "3": "Trance protection — protects the body, voice, instrument, or projected soul during trance.",
    "4": "Lyåd range — increases how far the sound, rhythm, song, or soul projection reaches.",
    "5": "Sound medium — lets the lyåd pass through stone, bone, water, wood, smoke, skin, roots, wind, silence, or walls.",
    "6": "Target count — lets the Lyådskapare affect more minds, bodies, objects, or listeners.",
    "7": "Object size — lets the Lyådskapare move, steer, pull, push, hold, or teleport larger objects.",
    "8": "Mind focus — improves mental influence: clearer thought-reading, stronger command, calmer target, better distraction, or more precise memory-touch.",
    "9": "Object control — gives finer control over moved or steered objects: grip, twist, tie, open, close, carry, press, strike, or hold.",
    "10": "Teleport anchor — creates a safer destination, return point, sound marker, or linked object for teleportation.",
    "11": "Soul tether — prevents the projected soul from drifting, getting stuck, being misled, or being seized.",
    "12": "Stored melody — stores a song, rhythm, command, thought-fragment, or trance pattern for later use.",
    "13": "Counter-lyåd — disrupts another Lyådskapare's trance, rhythm, projection, or mental influence.",
    "14": "Risk trade — makes trance stronger in exchange for greater danger: harder awakening, exposed body, louder sound, mental bleed, soul drift, or worse backlash."
  },
  "effect_must_state": [
    "which sound, song, rhythm, instrument, silence, or vibration is used",
    "which part of trance or soul projection is changed",
    "whether it affects range, targets, object size, mind, teleportation, stability, protection, or storage",
    "what can interrupt the effect",
    "how often it can be used"
  ],
  "note": "Magical items carry a cost tied to sound or instrument — the item may be unable to fall silent, or it binds the bearer to a specific direction of magic."
}
```

**Verification:** Print top-level keys of `type_rules.LYÅDSKAPARE`. Confirm `function_menu` has keys 1 through 14. Confirm `trance_capabilities` and `effect_must_state` are present.

Stop. Wait for confirmation before Task 4.

---

## TASK 4 — ORAKEL rules expansion

**File:** Active item rules JSON
**Target:** `type_rules.ORAKEL` block

Replace the entire existing ORAKEL block with:

```json
"ORAKEL": {
  "swedish_name": "Orakelföremål",
  "description": "Items for Orakel who pray (ber böner) and negotiate with divine emissaries (sändebud) from the gods. The GM plays the emissary. The oracle's level and relationship with the god affects how friendly, demanding, costly, or clear the emissary is.",
  "core_logic": "offergåva (offering) → prayer and negotiation → emissary → divine effect → cost, condition, or consequence.",
  "oracle_levels": {
    "1": "The emissary is demanding, costly, vague, or difficult. Effects are modest.",
    "2": "Still difficult but more predictable. Small blessings become easier.",
    "3": "The emissary begins to respect the oracle. Stronger blessings become possible.",
    "4": "The emissary cooperates if the oracle respects the god's nature.",
    "5": "The emissary is friendly or personally invested. Powerful prayers become cheaper and clearer."
  },
  "gods_reference": "Seven gods available: Mitriki (knowledge, memory, truth), Folgor (family, protection, blood), Sternine (freedom, defiance, curiosity), Ebba (sea, movement, change), Kung Kallus (earth, fertility, tribe), Viaträdet (life, connection, cycle), Mortmori (death, rebirth, decay). Full god descriptions in world_context. Only ORAKEL items use the offering/negotiation/emissary mechanic — other item types may reference gods as flavor only.",
  "rule": "An ORAKEL item only works for an Orakel and must affect the offering (offergåva), prayer, negotiation, divine relationship, emissary attitude, blessing storage, omen, or divine consequence. If the effect works without prayer or negotiation, it is ADVENIRE.",
  "function_menu": {
    "1": "Offering vessel — holds, improves, preserves, transforms, or formalizes an offering.",
    "2": "Substitute offering — counts as a special offering: blood, memory, warmth, sleep, pain, an object, a promise, food, a name, a secret.",
    "3": "Negotiation aid — makes the emissary less hostile, clearer, cheaper, more patient, or more bound to answer honestly.",
    "4": "Relationship marker — improves or measures standing with a god, stores favor, marks debt, or proves prior devotion.",
    "5": "Cost reducer — lowers offering cost for a specific god, prayer type, or situation.",
    "6": "Consequence softener — makes a poor negotiation outcome less punishing.",
    "7": "Blessing storage — stores a negotiated blessing for later use under a specified condition.",
    "8": "Omen clarifier — makes divine signs clearer, narrower, less misleading, or easier to interpret.",
    "9": "Divine condition — adds a rule to a blessing: works if a promise is kept, a target is named, an offering is accepted, or a location is sacred.",
    "10": "Wrath buffer — protects against divine wrath once, but does not remove the debt or offense.",
    "11": "God focus — improves negotiation with one specific god but may complicate relations with another.",
    "12": "Consumable offering item — used as an offering. Should produce a specific type of divine effect if accepted by the emissary."
  },
  "effect_must_state": [
    "which god, emissary, offering type, or relationship is affected",
    "which part of the prayer or negotiation is changed",
    "what the oracle must sacrifice, risk, promise, lose, or maintain",
    "how often it can be used"
  ],
  "note": "Magical items carry a cost tied to the divine — must be returned to a sacred place after use, or loses power if the oracle breaks their god's code."
}
```

**Verification:** Print top-level keys of `type_rules.ORAKEL`. Confirm presence of `oracle_levels`, `gods_reference`, `core_logic`, `rule`, `function_menu` with keys 1 through 12, `effect_must_state`, `note`.

Stop. Wait for confirmation before Task 5.

---

## TASK 5 — ADVENIRE lore_origin flavor palettes

**File:** Active item rules JSON
**Target:** `type_rules.ADVENIRE.lore_origins` block only. Keep the rest of ADVENIRE intact.

Replace the existing `lore_origins` block with:

```json
"lore_origins": {
  "KRISTALLSEJDARE": {
    "description": "Item shaped by one of the six lores through color, emotion, and element. Produces lore-colored effects — fire and smoke from wrath, roots and growth from shame, light and warmth from joy, lightning and death-force from pride, stone and sand from love, water and wind from sorrow. Often carries a visible crystal whose color reveals the lore. Does NOT modify CV, spell dice, spell selection, or miscast — those belong to KRISTALLSEJDARE items. Here the item performs the magic itself, for anyone.",
    "lores_reference": "see KRISTALLSEJDARE.lores for the six lore definitions"
  },
  "SHAMAN": {
    "description": "Item blessed in rituals or with shamanic ingredients woven into it. Nature's force channeled into an object — produces effects rooted in an ingredient's nature and a ritual's intention. May contain a preserved type_trait (Drömrök, Blodskraft, Resonans, Stadga, Återväxt) in fixed form, stored KV, or a ritual effect that triggers without the Shaman being present. Does NOT modify ongoing rituals — that belongs to SHAMAN items."
  },
  "LYÅDSKAPARE": {
    "description": "A Lyådskapare's soul or tone locked into an object. Carries the nature of music magic permanently and gives properties tied to sound, vibration, or movement. May contain a trapped soul, failed trance, soul echo, enchanted instrument, stored voice, sound marker, thought echo, or teleport anchor. Lets anyone trigger a limited lyåd-like effect without trance. Does NOT help a Lyådskapare enter or maintain trance — that belongs to LYÅDSKAPARE items."
  },
  "ORAKEL": {
    "description": "Religious artifact from the gods. May be blessed, cursed, sacred, taboo — a relic, fossil, sacred bone, vessel, idol, or god-fragment. Carries a god's or aspect's nature and gives effects tied to that god's domain. Works without an Orakel and without negotiation — the god's power is already in the object. Does NOT modify offering, prayer, or emissary relationship — those belong to ORAKEL items."
  }
}
```

**Verification:** Print top-level keys of `type_rules.ADVENIRE.lore_origins`. Confirm all four origins present each with `description`. Confirm the rest of `type_rules.ADVENIRE` (swedish_name, description, lore_origin_field) is unchanged.

Stop. Wait for confirmation before Task 6.

---

## TASK 6 — Add HARD TYPE BOUNDARY block to item rules

**File:** Active item rules JSON
**Target:** Add new top-level key `hard_type_boundary` placed AFTER `global_rules` and BEFORE `damage_scale`. If either of those keys doesn't exist at the top level, report their actual position before placing.

```json
"hard_type_boundary": {
  "purpose": "Disambiguates between practitioner lore types and ADVENIRE. The same flavor (fire, trance, blessing) can belong to either depending on whether the item helps a practitioner perform their craft, or whether the item performs the magic itself.",
  "tests": {
    "KRISTALLSEJDARE": "Helps a Kristallsejdare cast spells. Modifies CV, dice, miscast, spell selection, or spell shaping. If a non-practitioner picks it up, it does nothing useful.",
    "SHAMAN": "Helps a Shaman perform rituals. Modifies KV, backlash, dice size, ingredient handling, ritual shape, place-binding, or ritual storage. If a non-practitioner picks it up, it does nothing useful.",
    "LYÅDSKAPARE": "Helps a Lyådskapare create lyåder, enter trance, and project the soul. Modifies trance entry, stability, protection, range, targets, object size, mental focus, teleport anchoring, or stored melody. If a non-practitioner picks it up, it does nothing useful.",
    "ORAKEL": "Helps an Orakel pray and negotiate with divine emissaries. Modifies offering, prayer, negotiation, relationship, blessing storage, omen clarity, or divine consequence. If a non-practitioner picks it up, it does nothing useful.",
    "ADVENIRE": "Magical item that performs the effect itself. Takes flavor from one lore tradition (specify advenire_lore_origin) but the effect is self-contained and works for anyone. Does NOT touch CV, KV, trance mechanics, or negotiation."
  },
  "decision_order": [
    "1. Does the effect only work if the bearer is a practitioner of a specific lore? → lore type (KRISTALLSEJDARE / SHAMAN / LYÅDSKAPARE / ORAKEL).",
    "2. Does the bearer need no lore knowledge and the item just does the thing? → ADVENIRE (set advenire_lore_origin).",
    "3. No lore flavor and doesn't fit weapon/armor/shield/pet? → MISC."
  ],
  "examples": {
    "Staff giving +1 CV on red-lore spells": "KRISTALLSEJDARE",
    "Red crystal projecting 3m of flame once per day": "ADVENIRE (lore_origin: KRISTALLSEJDARE)",
    "Idol storing a divine blessing for later release": "ORAKEL",
    "Blessed bone amulet making anyone harder to trick": "ADVENIRE (lore_origin: ORAKEL)",
    "Drum that shortens trance entry by half": "LYÅDSKAPARE",
    "Carved stone that hums and lets anyone hear distant conversations": "ADVENIRE (lore_origin: LYÅDSKAPARE)",
    "Root bundle that adds +1 KV to growth rituals": "SHAMAN",
    "Mummified frog that produces a healing salve when squeezed": "ADVENIRE (lore_origin: SHAMAN)"
  }
}
```

**Verification:** Print top-level keys of the item rules JSON in order. Confirm `hard_type_boundary` appears between `global_rules` and `damage_scale` (or report its actual position relative to adjacent keys).

Save the result as `ViaproximaItemRules_v2_6.json`. Confirm it is valid JSON.

Stop. Wait for confirmation before Task 7.

---

## TASK 7 — Religion globalization in world_context

**File:** `world_context.txt`
**Target:** The religions block.

Confirm all seven religions are present: Mitriki, Folgor, Sternine, Ebba, Kung Kallus, Viaträdet, Mortmori. If any are missing or have thinner descriptions than the others, flag it.

Add one line at the very end of the religions block (before the next section separator or at the end of the block):

```
Religion-as-flavor is available to all guilds and item types. Only ORAKEL items use the mechanical offering/negotiation/emissary system. Other items may reference a god thematically without invoking those mechanics.
```

**Verification:** Print the religions section with the new closing line.

Stop. Wait for confirmation before Task 8.

---

## TASK 8 — Prompt template: lärdom mechanic enforcement block

**File:** Active prompt template
**Target:** Locate the existing TYPE DISAMBIGUATION block or ITEM RULES section.

If a block called TYPE DISAMBIGUATION or LÄRDOM ITEM PATTERNS already exists, read it in full and report its current contents before making any change.

Add a new section called `## LÄRDOM ITEM PATTERNS` immediately after TYPE DISAMBIGUATION (or after the SHAMAN vs SHAMAN_INGREDIENT block if TYPE DISAMBIGUATION doesn't exist). Use this exact text:

```markdown
## LÄRDOM ITEM PATTERNS

When generating a KRISTALLSEJDARE, SHAMAN, LYÅDSKAPARE, or ORAKEL item, choose exactly one function from that type's function_menu in the item rules. The chosen function must appear explicitly in the effect field as a concrete mechanical change — not as flavor, not as description, not as a vague capability.

**KRISTALLSEJDARE** — choose one: CV bonus for a specific lore or condition; store spell dice; grant extra spell die; dice control (lock/reroll/swap/split); reduce or redirect miscast; risk trade (more miscast for stronger spell); extra spell access; spell selection control; borrow from another lore; bind spell into item; shape spell (range/area/targets/duration); emotional catalyst requiring the lore's emotional state.

**SHAMAN** — choose one: find or improve ingredients; KV bonus under a specific ritual condition; upgrade a ritual die (e.g. D6 → D10); backlash control; set bonus interaction (ingredient type swap or wildcard); trait amplifier for a specific ingredient type; ritual trigger on a defined outcome; place-binder (bind ritual to a location); ritual shaper (targets/area/duration/delay); ingredient converter (type swap or rarity change); ritual storage (KV, echo, remnant, or type_trait).

**LYÅDSKAPARE** — choose one: trance entry speed or safety; trance stability under disruption; trance protection (body/voice/instrument/soul); lyåd range extension; sound medium (pass through stone/water/bone/etc.); target count for mental or physical influence; object size limit for movement/teleportation; mind focus (thought-reading/command/distraction); object control fidelity; teleport anchor creation; soul tether; stored melody; counter-lyåd disruption; risk trade (stronger trance for greater danger).

**ORAKEL** — choose one: offering vessel (hold/improve/formalize offering); substitute offering type; negotiation aid (emissary attitude); relationship marker with a god; cost reducer for offering or prayer; consequence softener; blessing storage for later release; omen clarifier; divine condition on a blessing; wrath buffer; god focus (improve with one god, complicate with another); consumable offering item.

If the type_id is ADVENIRE, do NOT choose from the lore function menus. ADVENIRE items have self-contained effects that work for anyone. Set advenire_lore_origin to match the flavor, then design the effect freely. The lore origin supplies aesthetic only, not mechanical constraints.

Priority order for item construction: type rules → lärdom mechanic choice (if applicable) → guild mechanic signature → tag direction → twist constraint → flavor.
```

**Verification:** Print the section headers of the prompt template in order. Confirm LÄRDOM ITEM PATTERNS is present in the correct location.

Stop. Wait for confirmation before Task 9.

---

## TASK 9 — Prompt template: effect clarity rule

**File:** Active prompt template
**Target:** Add new section after WEAPON PROFILE block (or after LÄRDOM ITEM PATTERNS if WEAPON PROFILE doesn't exist).

Add `## EFFECT CLARITY RULE` with this exact text:

```markdown
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
```

**Verification:** Print section headers in order. Confirm EFFECT CLARITY RULE appears after LÄRDOM ITEM PATTERNS (or WEAPON PROFILE).

Stop. Wait for confirmation before Task 10.

---

## TASK 10 — Prompt template: HV variety rule

**File:** Active prompt template
**Target:** Add new section after EFFECT CLARITY RULE and before DRAWBACK RULES (or POWER LEVELS if DRAWBACK RULES doesn't exist).

Add `## EFFECT VARIETY RULE` with this exact text:

```markdown
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

HV bonuses may appear as secondary support inside these effects, but must not be the answer to "what does this item do?" If the HV cap has been reached, all remaining slots must use a non-HV payoff regardless of what the tag or twist suggests.
```

**Verification:** Print section headers in order. Confirm EFFECT VARIETY RULE is in the correct position.

Stop. Wait for confirmation before Task 11.

---

## TASK 11 — Prompt template: drawback rules block

**File:** Active prompt template
**Target:** Locate existing drawback guidance. If a DRAWBACK RULES block already exists, read and print its full current contents before changing anything.

Replace or add the DRAWBACK RULES block with this exact text:

```markdown
## DRAWBACK RULES

Optional. Skip if item is already balanced by frequency or limitation. Only include for Magical power_level items — omit drawbacks for Common and Unique items entirely.

**TIER A (preferred — give the GM material, choose from menu, vary across items):**
- visible mark or physical change on bearer that others can see
- public knowledge that the bearer used it (witness, rumor, claim filed)
- material consumption that depletes a finite resource the bearer must replenish
- environmental change at the use site (scorch, frost-print, flattened ground, lingering smell, sound, or residue)
- attention shift that draws creatures, spirits, or rivals toward the bearer or location
- obligation, debt, or owed favor created toward a person, place, or faction
- temporary inability to use related items or perform related actions
- transferred risk that lands on an ally, animal, location, or future scene

**TIER B (acceptable):** limited frequency (once per day/week/moon); requires specific condition to reactivate; consumes something bearer must replenish.

**TIER C (avoid — creates bookkeeping or kills play):** triggered by talking about the item; delayed effect at unknown future time; information visible to everyone except the bearer; slow debilitating effects over many sessions; drawbacks the GM must secretly track.

No Tier A or B option available? Write none. Clean limitation beats Tier C.

**Drawback must be expressible in one word or phrase the GM can track** (examples: "mark", "known", "consumed reagent", "scorched ground", "owes Mortokat debt", "can't use armor until rested").

**DRAWBACK DIVERSITY RULE:** Across all {{ITEM_COUNT}} items, no single Tier A category may appear more than one-quarter of the total item count rounded up. For 12 items: max 3 per category. For 6 items: max 2 per category. "Visible mark" appearing on 4 of 12 Magical items is a violation.
```

**Verification:** Print section headers in order. Confirm DRAWBACK RULES is present.

Stop. Wait for confirmation before Task 12.

---

## TASK 12 — Prompt template: finalization checklist

**File:** Active prompt template
**Target:** Locate existing finalization/creativity check. Read and print its full current contents before changing anything.

Replace the existing check (whatever form it takes) with:

```markdown
## FINAL PASS — REJECT AND REDESIGN

Before finalizing each item, answer these questions in order:

1. **Gameplay value:** What can the player now do, cause, prevent, prepare, delay, redirect, store, spend, risk, protect, expose, hide, force, transform, or make costly that they could not before? Write the answer in one verb-led sentence. Weak if used as the entire payoff: "+1 HV on next attack," "detect poison in food." These can work as components of a larger effect but must not be the whole thing. Strong: "create a temporary handhold on a smooth surface," "transfer one wound from an ally to an enemy," "make a named object impossible to lift until dawn."

2. **Clarity:** Can a player describe what it does in one sentence without reading the description? If not: simplify the mechanic.

3. **Guild identity:** Is the guild's mechanic signature in the effect field, or only in the name and description? If only flavor: redesign the effect.

4. **Overlap:** Does this share its core function with another item in this list? If yes: redesign.

5. **Drawback:** Is the drawback Tier C, or is it on a non-Magical item? If yes: remove or replace.

6. **Merchant-level diversity:** After all {{ITEM_COUNT}} items are drafted, assign each item's main usefulness one verb from this closed set: *bonus, detect, mark, summon, store, redirect, transform, create, restrain, transfer, anchor, shelter, exchange, conceal, expose, prepare, trigger, restore, break, move, protect, lure, misdirect, open, close, gamble*. No verb may appear more than one-quarter of {{ITEM_COUNT}} rounded up. For 12 items: max 3 per verb. For 6 items: max 2. Redesign the lowest-priority items in any over-represented group until compliant. Use only verbs from this list.

Do not emit an item that fails any of these checks.
```

**Verification:** Print the full finalization block. Confirm 6 numbered checks with the 26-verb list ending in "gamble."

Stop. Wait for confirmation before Task 13.

---

## TASK 13 — Prompt template: twist system update

**File:** Active prompt template
**Target:** Locate the ITEM LAYOUT section where Tag, Inspiration, and Twist are described.

Read and print the current ITEM LAYOUT description before making changes.

Replace only the Twist line/paragraph with:

```
Twist: a mechanical constraint on how the item behaves — not a narrative surprise, not a drawback penalty. Design the item around the twist first. Valid twist forms: once per scene only; requires preparation before use; only activates on the second attempt; consumes a limited charge; reveals the bearer's status or location when used; self-penalty for stronger effect (user takes the cost, effect is stronger). Avoid: permanent marks, unknown delayed effects, GM hidden tracking, arbitrary social consequences.
```

Leave the Tag and Inspiration descriptions unchanged unless they currently say something directly contradicted by this plan (in which case flag it before changing).

**Verification:** Print the full ITEM LAYOUT section. Confirm the new Twist description is in place.

Stop. Wait for confirmation before Task 14.

---

## TASK 14 — Prompt template: schema cleanup + version bump

**File:** Active prompt template

### 14a. Schema field updates

In the OUTPUT SCHEMA item object:
- Remove `"price": "Cuppar | Ferrar | Aurar"` if still present.
- Remove `"cost": "string — ..."` if still present.
- Update `"description"` comment to: `"string — max 280 characters. Physical object first, one distinctive detail. No lore summary."`
- Update `"effect"` comment to: `"string — max 480 characters. Answer: trigger, actor, outcome, target, duration, frequency. MELEE/RANGED: must begin with weapon profile recipe."`
- Update `"drawback"` comment to: `"string — optional, Magical items only, Tier A or Tier B, expressible in one trackable word or phrase."`
- Add `"lore_mechanic_choice": "string — required if type_id is KRISTALLSEJDARE/SHAMAN/LYÅDSKAPARE/ORAKEL; state which function_menu number was chosen and its name. Omit for all other types."` after the `"tag"` field.

### 14b. GUILD section update

In the GUILD section, after the Functions line and before "Guild defines item function...", confirm `{{GUILD_MECHANIC_SIGNATURE}}` placeholder is present. If missing, add it.

Add after the placeholder:
```
For each item, the guild mechanic signature pattern must appear in the effect field — not only in the name or description. At least half of all items must clearly express the guild's mechanic pattern in the effect.
```

### 14c. RACE block

Confirm the RACE block with `{{RACE_NAME}}`, `{{RACE_ONE_LINE}}`, `{{RACE_BODY_FEATURES}}` exists after the GUILD section. If missing, add it:
```
## RACE

**{{RACE_NAME}}**

{{RACE_ONE_LINE}}
{{RACE_BODY_FEATURES}}

Race shapes appearance only. It does not affect item function or theme.
```

### 14d. Version bump

Change the version header on line 1 to:
```
# Viaproxima Merchant Prompt Skeleton v2.6
```

Add on line 2:
```
# v2.6 changelog: Lärdom function menus (KRISTALLSEJDARE, SHAMAN, LYÅDSKAPARE, ORAKEL). SHAMAN_INGREDIENT trait system (1D6–4D6, type_traits). ADVENIRE lore_origin flavor palettes. HARD TYPE BOUNDARY block. Religion globalization. Twist system → mechanical constraints. Effect clarity rule (6-question format). Effect variety rule (HV cap). Drawback menu + diversity rule. 26-verb merchant diversity check.
```

### 14e. Save

Save the completed template as `PromptTemplate_v2_6.md`. Do not overwrite the v2.5 file.

**Verification:**
- Print all section headers of `PromptTemplate_v2_6.md` in order.
- Confirm version header reads v2.6.
- Confirm `lore_mechanic_choice` field is in the schema.
- Confirm `price` and `cost` fields are absent from schema.

Stop. Wait for confirmation before Task 15.

---

## TASK 15 — Final validation

**Files:** `ViaproximaItemRules_v2_6.json` and `PromptTemplate_v2_6.md`

### Item rules checks

Confirm:
- `hard_type_boundary` present at top level between `global_rules` and `damage_scale`.
- All four practitioner types (KRISTALLSEJDARE, SHAMAN, LYÅDSKAPARE, ORAKEL) have `function_menu`, `effect_must_state`, `rule`.
- KRISTALLSEJDARE `function_menu` has keys 1–12.
- SHAMAN `function_menu` has keys 1–11.
- LYÅDSKAPARE `function_menu` has keys 1–14.
- ORAKEL `function_menu` has keys 1–12.
- SHAMAN_INGREDIENT has `ingredient_types` with all five types each having `domain` and `trait`.
- SHAMAN_INGREDIENT `die_value` uses 1D6/2D6/3D6/4D6.
- ADVENIRE `lore_origins` has all four entries each with `description`.
- File is valid JSON (parse it).

### Prompt template checks

Confirm all of these sections are present, in order, with no section missing:
- WORLD (with `{{WORLD_CONTEXT}}`)
- GUILD (with `{{GUILD_MECHANIC_SIGNATURE}}` placeholder)
- RACE (with `{{RACE_NAME}}`, `{{RACE_ONE_LINE}}`, `{{RACE_BODY_FEATURES}}`)
- ITEM LAYOUT (with updated Twist description)
- ITEM RULES (with `{{OUTPUT_TYPE_RULES}}`)
- TYPE DISAMBIGUATION (or equivalent)
- LÄRDOM ITEM PATTERNS
- SHAMAN vs SHAMAN_INGREDIENT distinction
- WEAPON PROFILE
- EFFECT CLARITY RULE
- EFFECT VARIETY RULE
- DRAWBACK RULES
- POWER LEVELS
- STONE AGE HARD EXCLUSIONS
- FINAL PASS (6-point check with 26-verb list)
- HARD RULES block
- OUTPUT SCHEMA (with `lore_mechanic_choice`, without `price`/`cost`)
- PARAMETERS

Confirm `{{ITEM_COUNT}}` appears in EFFECT VARIETY RULE, DRAWBACK DIVERSITY RULE, and FINAL PASS check 6.

Report any missing section or rule. Do not ship if anything is missing.

### Assembler wiring note

Do NOT update `PromptAssembler.cs` in this task. Report which filename the assembler currently loads so the user can decide whether to switch it to `PromptTemplate_v2_6.md` manually or as a separate task.

---

## TESTING PROTOCOL (user-run after Task 15)

After Claude Code confirms both files pass Task 15 validation, the user runs:

1. Take two existing V2.5 outputs and count: HV-primary items, visible-mark drawbacks, lärdom items that don't state a function_menu choice, ADVENIRE items with no lore_origin flavor in the effect.

2. Run V2.6 on the same merchants plus one fresh run. Count the same metrics.

3. Acceptance criteria:
   - HV-primary count ≤ one-third of total items.
   - Every KRISTALLSEJDARE/SHAMAN/LYÅDSKAPARE/ORAKEL item states its lore_mechanic_choice in the JSON.
   - Every lore item effect answers trigger/actor/outcome/target/duration/frequency.
   - No single drawback category exceeds one-quarter of Magical items.
   - No single usefulness verb exceeds one-quarter of total items.

4. If acceptance criteria pass, update PromptAssembler.cs to load `PromptTemplate_v2_6.md` and `ViaproximaItemRules_v2_6.json`.
