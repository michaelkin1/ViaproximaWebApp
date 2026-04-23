GLOBAL RULE: All output except image_prompt must be in Swedish. 
This includes item names, type names, subtype names, descriptions, 
effects, limitations, drawbacks, and all other visible text. No exceptions.

# Viaproxima Merchant Prompt Skeleton v2.4
# PromptAssembler strips lines beginning with # before sending.
# Replace all {{PLACEHOLDER}} before sending.
# ITEM_COUNT: inject the number of items to generate (default 8, min 3, max 12).
# OUTPUT_TYPE_RULES: inject only types present in layout.
# ITEM_SLOTS: inject full slot list — type, one tag, one inspiration, one twist per slot.

---

You are generating a merchant for the stone age fantasy world **Viaproxima**.
Output exactly one JSON object. Nothing else — no prose, no explanation, no markdown.
Do not repeat item concepts across the {{ITEM_COUNT}} items.

---

## WORLD

{{WORLD_CONTEXT}}

---

## GUILD

**{{GUILD_NAME}}**

Theme: {{GUILD_THEME_KEYWORDS}}
Feeling: {{GUILD_VIBE_FEELING}}
Lore: {{GUILD_LORE}}
Functions: {{GUILD_FUNCTION_SPECTRUM}}

Guild defines item function, purpose, and theme.
Race defines only the merchant's appearance — never the items.
Each item must express the guild's identity in a different way.

---

## ITEM LAYOUT

Generate exactly {{ITEM_COUNT}} items.
Each slot defines: type, one tag, one inspiration source, and one twist.
Type: item category — see ITEM RULES.
Tag: defines what the item does. The tag MUST be visible in the final effect. 
The effect must be concrete, short, and mechanically usable at the table.
Inspiration: extract the underlying principle only. State it in one sentence 
before designing. Then discard the surface entirely — no imagery, named concepts, 
characters, or object forms from the source may appear in the item.
Twist: design the item around the twist first. The twist is the item's core nature, 
not an added modifier. Tag = what it does. Twist = what kind of thing it becomes.

{{ITEM_SLOTS}}

---

## ITEM RULES

{{OUTPUT_TYPE_RULES}}

Damage levels must use exact Swedish terms: Låg / Mellan / Hög / Extrem. 
Never use numbers (1, 2, 3) to represent damage levels.

MELEE and RANGED items must include subtype as a separate field:
- MELEE subtype: Hackvapen | Trubbvapen | Repvapen | Stickvapen  
- RANGED subtype: Kastvapen | Pilbågar | Slungor | Blåsvapen

Crystal magic (Kristallsejdare) is emotional and elemental, never religious. 
No gods, offerings, prayers, or sacred rituals in KRISTALLSEJDARE items. 
Religion belongs to ORAKEL items only.

Do not generate cost fields. Only generate:
- limitation: when or how the item cannot be used (optional, only if inseparable from function)
- drawback: negative consequence directly tied to using it (optional, only if it sharpens the item)

Desirability check — for each item before finalizing:
1. Would a player want to own this because it creates a specific tactic, opportunity, or temptation?
2. Is the effect understandable without reading the description?
3. Does the guild's identity show in the mechanic itself, not only in the name?
If no to any of these: redesign.

---

## OUTPUT SCHEMA

Return exactly this JSON. No other text.

```json
{
  "merchant": {
    "name": "string",
    "race": "{{RACE_NAME}}",
    "guild": "{{GUILD_NAME}}",
    "backstory": "string — 2-3 sentences. Compact and gameable. At least one hook or habit a GM can use.",
    "appearance": "string — 2-3 sentences. Race features and how guild identity shows on body and goods.",
    "transport": "string — how the merchant travels or moves their goods.",
    "image_prompt": "string — begin exactly with: In a black-and-white, highly detailed Viaproxima-style fantasy illustration (refined DeviantArt linework, smooth shading, intricate textures and atmospheric depth) — describe the merchant as an anthropomorphic {{RACE_NAME}} at their stall or market, guild theme clearly visible, 2-3 visually striking items present, stone age throughout, no modern materials."
  },
  "items": [
    {
      "name": "string — Swedish compound built from function, behavior or consequence",
      "type": "string — Swedish type name",
      "subtype": "string — required for MELEE and RANGED, omit for all other types",
      "type_id": "MELEE | RANGED | AMMO | ARMOR | SHIELD | KRISTALLSEJDARE | SHAMAN | SHAMAN_INGREDIENT | LYÅDSKAPARE | ORAKEL | ADVENIRE | PETS | MISC",
      "power_level": "Common | Unique | Magical",
      "tag": "string",
      "advenire_lore_origin": "KRISTALLSEJDARE | SHAMAN | LYÅDSKAPARE | ORAKEL — only if type_id is ADVENIRE, omit otherwise",
      "description": "string — 1-3 sentences. Physical form first, then distinctive use. Guild identity unmistakable.",
      "effect": "string — short, concrete, mechanically usable. Explicit trigger and outcome. No vague verbs.",
      "limitation": "string — optional. Only include if inseparable from the item's function.",
      "drawback": "string — optional. Only include if it sharpens the item, not to balance it.",
      "price": "Cuppar | Ferrar | Aurar",
      "affinities": ["string — other guild IDs that would naturally sell or use this item"]
    }
  ]
}
```

Items array: exactly {{ITEM_COUNT}} objects, in slot order.

After generating all {{ITEM_COUNT}} items, assign affinities.
For each item consider which other guilds would naturally sell or use it.
Guild reference: {{GUILD_REFERENCE}}
Add matching guild IDs to affinities. Leave empty if strongly specific to {{GUILD_NAME}}.

---

## PARAMETERS

Race: **{{RACE_NAME}}**
Guild: **{{GUILD_NAME}}**
Layout ID: **{{LAYOUT_ID}}**
Item count: **{{ITEM_COUNT}}**
