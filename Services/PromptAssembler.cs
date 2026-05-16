using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using Viaproxima.Web.Models.Merchant;

namespace Viaproxima.Web.Services;

public class PromptAssembler : IPromptAssembler
{
    private readonly List<ViaproximaRace> _races;
    private readonly List<ViaproximaGuild> _guilds;
    private readonly Dictionary<string, JsonElement> _itemTypeRules;
    private readonly Dictionary<string, ArchetypeEntry> _archetypes;
    private readonly Dictionary<string, LardomLoreRules> _lardomRules;
    private readonly Dictionary<string, List<InspirationTagEntry>> _guildInspirationTags;
    private readonly string _worldContext;
    private readonly string _promptTemplate;
    private readonly Dictionary<string, string> _guildMechanicSignatures;
    private readonly Dictionary<string, RaceReminder> _raceReminders;

    private static readonly HashSet<string> LardomTypes =
        new() { "KRISTALLSEJDARE", "SHAMAN", "LYÅDSKAPARE", "ORAKEL" };

    public PromptAssembler(
        List<ViaproximaRace> races,
        List<ViaproximaGuild> guilds,
        Dictionary<string, JsonElement> itemTypeRules,
        ArchetypesData archetypesData,
        LardomRulesData lardomRulesData,
        Dictionary<string, List<InspirationTagEntry>> guildInspirationTags,
        string worldContext,
        string promptTemplate,
        Dictionary<string, string> guildMechanicSignatures,
        Dictionary<string, RaceReminder> raceReminders)
    {
        _races = races;
        _guilds = guilds;
        _itemTypeRules = itemTypeRules;
        _archetypes = archetypesData.Archetypes;
        _lardomRules = lardomRulesData.LoreTypes;
        _guildInspirationTags = guildInspirationTags;
        _worldContext = worldContext;
        _promptTemplate = promptTemplate;
        _guildMechanicSignatures = guildMechanicSignatures;
        _raceReminders = raceReminders;
    }

    public PromptResult BuildPrompt(PromptParams parameters)
    {
        // Validate inputs
        var race = _races.FirstOrDefault(r => r.Id == parameters.RaceId);
        if (race == null)
            return new PromptResult($"Error: Race ID '{parameters.RaceId}' not found.", "ERROR");

        var guild = _guilds.FirstOrDefault(g => g.Id == parameters.GuildId);
        if (guild == null)
            return new PromptResult($"Error: Guild ID '{parameters.GuildId}' not found.", "ERROR");

        var totalCount = parameters.ItemTypeCounts.Values.Sum();
        if (totalCount == 0 || totalCount > 12)
            return new PromptResult($"Error: Total items must be between 1 and 12. Got {totalCount}.", "ERROR");

        var layoutId = $"CUSTOM-{guild.Id}-{totalCount}";

        // Get inspiration pool for this guild
        var inspirationPool = _guildInspirationTags.TryGetValue(guild.Id, out var pool)
            ? pool
            : new List<InspirationTagEntry>();

        // Build slot list
        var usedInspirations = new HashSet<string>();
        var slots = new List<ItemSlot>();
        foreach (var (typeCode, count) in parameters.ItemTypeCounts.Where(kvp => kvp.Value > 0))
        {
            for (int i = 0; i < count; i++)
            {
                var inspTag = PickInspiration(inspirationPool, usedInspirations);
                var swedishName = GetSwedishTypeName(typeCode);

                slots.Add(new ItemSlot(typeCode, swedishName, inspTag));
            }
        }

        // Format item slots for template
        var usedArchetypes = new HashSet<string>();
        var usedLardomRuleIds = new Dictionary<string, HashSet<int>>();

        var slotLines = new List<string>();
        int num = 1;
        foreach (var slot in slots)
        {
            var archetype = PickArchetype(slot.TypeCode, usedArchetypes);
            var assignedMechanic = PickLardomRule(slot.TypeCode, usedLardomRuleIds);

            slotLines.Add($"Slot {num} — {slot.SwedishTypeName} ({slot.TypeCode})");
            if (!string.IsNullOrEmpty(assignedMechanic))
                slotLines.Add($"  assigned_mechanic: {assignedMechanic}");
            if (!string.IsNullOrEmpty(archetype))
                slotLines.Add($"  archetype: {archetype}");
            slotLines.Add($"  inspiration: {slot.InspirationTag}");
            num++;
        }
        var itemSlotsFormatted = string.Join("\n", slotLines);

        // Get unique type codes present and build type rules section (compressed prose format)
        var typesPresent = parameters.ItemTypeCounts.Where(kvp => kvp.Value > 0).Select(kvp => kvp.Key).ToList();
        var typeRulesLines = new List<string>();
        foreach (var typeCode in typesPresent)
        {
            if (_itemTypeRules.TryGetValue(typeCode, out var ruleElement))
                typeRulesLines.Add(FormatTypeRuleCompressed(typeCode, ruleElement));
        }
        var typeRulesFormatted = string.Join("\n\n", typeRulesLines);

        // Resolve new placeholder values
        _guildMechanicSignatures.TryGetValue(guild.Id, out var guildMechanicSignature);
        guildMechanicSignature ??= "";
        _raceReminders.TryGetValue(race.Id, out var raceReminder);
        var raceOneLine = raceReminder?.OneLine ?? "";
        var raceBodyFeatures = raceReminder?.BodyFeatures ?? "";

        // Build guild reference (kept for backward compat with old templates)
        var guildReference = string.Join(", ", _guilds.Select(g => $"{g.Id} ({g.Name})"));

        // Strip comment lines from template
        var cleanTemplate = Regex.Replace(_promptTemplate, @"(?m)^#[^\n]*\n?", "");

        // Replace all placeholders
        var prompt = cleanTemplate
            .Replace("{{WORLD_CONTEXT}}", _worldContext)
            .Replace("{{GUILD_NAME}}", guild.Name)
            .Replace("{{GUILD_THEME_KEYWORDS}}", guild.Theme)
            .Replace("{{GUILD_VIBE_FEELING}}", guild.Feeling)
            .Replace("{{GUILD_LORE}}", guild.Lore)
            .Replace("{{GUILD_FUNCTION_SPECTRUM}}", guild.Theme)
            .Replace("{{GUILD_MECHANIC_SIGNATURE}}", guildMechanicSignature)
            .Replace("{{RACE_NAME}}", race.Name)
            .Replace("{{RACE_ONE_LINE}}", raceOneLine)
            .Replace("{{RACE_BODY_FEATURES}}", raceBodyFeatures)
            .Replace("{{ITEM_COUNT}}", totalCount.ToString())
            .Replace("{{ITEM_SLOTS}}", itemSlotsFormatted)
            .Replace("{{OUTPUT_TYPE_RULES}}", typeRulesFormatted)
            .Replace("{{LAYOUT_ID}}", layoutId)
            .Replace("{{GUILD_REFERENCE}}", guildReference);

        return new PromptResult(prompt, layoutId);
    }

    public IReadOnlyList<ViaproximaRace> GetRaces() => _races.AsReadOnly();
    public IReadOnlyList<ViaproximaGuild> GetGuilds() => _guilds.AsReadOnly();
    public IReadOnlyList<string> GetItemTypeCodes() => _itemTypeRules.Keys.ToList().AsReadOnly();

    public string GetSwedishTypeName(string typeCode)
    {
        try
        {
            if (_itemTypeRules.TryGetValue(typeCode, out var element))
            {
                var swedishNameProp = element.GetProperty("swedish_name");
                return swedishNameProp.GetString() ?? typeCode;
            }
        }
        catch { }
        return typeCode;
    }

    private static string PickInspiration(List<InspirationTagEntry> pool, HashSet<string> usedInspirations)
    {
        if (pool.Count == 0)
            return "No inspiration available";

        var candidates = pool
            .Where(e => !usedInspirations.Contains(e.Tag))
            .ToList();

        // Fallback: allow reuse if all inspiration tags already used
        if (candidates.Count == 0)
            candidates = pool;

        var chosen = candidates[Random.Shared.Next(candidates.Count)];
        usedInspirations.Add(chosen.Tag);
        return chosen.Tag;
    }

    private string PickArchetype(string typeId, HashSet<string> usedArchetypes)
    {
        var candidates = _archetypes
            .Where(kvp => kvp.Value.CompatibleTypes.Contains(typeId)
                       && !usedArchetypes.Contains(kvp.Key))
            .ToList();

        // Fallback: if all compatible archetypes already used, allow reuse
        if (candidates.Count == 0)
        {
            candidates = _archetypes
                .Where(kvp => kvp.Value.CompatibleTypes.Contains(typeId))
                .ToList();
        }

        if (candidates.Count == 0)
            return string.Empty;

        var chosen = candidates[Random.Shared.Next(candidates.Count)];
        usedArchetypes.Add(chosen.Key);
        return $"{chosen.Key} — {chosen.Value.Description}";
    }

    private string PickLardomRule(string typeId, Dictionary<string, HashSet<int>> usedRuleIds)
    {
        if (!LardomTypes.Contains(typeId)) return string.Empty;
        if (!_lardomRules.TryGetValue(typeId, out var loreRules)) return string.Empty;

        if (!usedRuleIds.ContainsKey(typeId))
            usedRuleIds[typeId] = new HashSet<int>();

        var candidates = loreRules.Rules
            .Where(r => !usedRuleIds[typeId].Contains(r.Id))
            .ToList();

        // Fallback: allow reuse if all rules exhausted for this lore type
        if (candidates.Count == 0)
            candidates = loreRules.Rules;

        if (candidates.Count == 0) return string.Empty;

        var chosen = candidates[Random.Shared.Next(candidates.Count)];
        usedRuleIds[typeId].Add(chosen.Id);
        return $"{chosen.Id} — {chosen.Name}: {chosen.Rule}";
    }

    private string FormatTypeRuleCompressed(string typeCode, JsonElement rule)
    {
        var sw = GetSwedishTypeName(typeCode);
        return typeCode switch
        {
            "MELEE" =>
                $"MELEE ({sw}). Hit: (Accuracy+Strike)/2. Requires damage level/span, grid weight AxB. " +
                $"Subtype required: Hackvapen (edged/cleaves) | Trubbvapen (blunt/stuns) | Repvapen (flexible/hard to block) | Stickvapen (piercing/reach). " +
                $"Profile format defined in WEAPON PROFILE block.",

            "RANGED" =>
                $"RANGED ({sw}). Hit: Skytte. Requires damage level/span, grid weight AxB. Note if ammo required — weapon unusable without it. " +
                $"Subtype required: Kastvapen (thrown, dual melee use) | Pilbågar (arrows, high range) | Slungor (stone/bone projectiles) | Blåsvapen (darts/thorns, silent, often poisoned). " +
                $"Profile format defined in WEAPON PROFILE block.",

            "AMMO" =>
                $"AMMO ({sw}). Requires consumption rule (uses or single-use). " +
                $"Modifies weapon damage or function situationally. Cannot permanently alter weapon base profile.",

            "ARMOR" =>
                $"ARMOR ({sw}). Block: 1D6 on hit, 5-6 succeeds, damage reduced one level. " +
                $"Durability loss: LOW -1, MID -2, HIGH -3, EXTREME destroys. " +
                $"Light: blocks LOW, Dur 6, 2x1, bast/leather/thin wood/plant fiber. " +
                $"Medium: blocks LOW+MID, Dur 9, 2x2, hardened hide/bone plates/thick wood. " +
                $"Heavy: blocks LOW+MID+HIGH, Dur 12, 3x2, fossil shell/stone plates/solid wood. " +
                $"Cannot block EXTREME or damage above design level.",

            "SHIELD" =>
                $"SHIELD ({sw}). Small: +1 HV, Dur 6, 2x1. Medium: +2 HV, Dur 9, 2x2, difficult with two-handed weapons. " +
                $"Heavy: +2 HV, Dur 12, 3x2, reduced mobility, allows shield bash. Shield bash rule defined in HARD RULES.",

            "KRISTALLSEJDARE" =>
                $"KRISTALLSEJDARE ({sw}). Focus items for crystal mages. Usually incorporate colored crystals. " +
                $"Effects: CV bonuses, extra spell dice, mana pool storage, miscast dampening, lore strengthening, lore borrowing, spell binding, spell storage. " +
                $"Cost tied to lore's emotional character. No religion.",

            "SHAMAN" =>
                $"SHAMAN ({sw}). Ritual tools — bone, roots, dried animal parts, stone, bark, fungus. " +
                $"Effects: KV modifications, ritual stabilization, ritual type strengthening, place-binding, ingredient finding, count as ingredient type, extend targets, remember rituals. " +
                $"Cost tied to natural use condition.",

            "SHAMAN_INGREDIENT" =>
                $"SHAMAN_INGREDIENT ({sw}). Consumable ritual ingredient. Contributes dice to KV, then destroyed. " +
                $"ingredient_type: Fungi (Drömrök — reroll one die, keep new result) | Animal parts (Blodskraft — raise one die by +1, max 6) | Essence (Resonans — two matching dice = +2 KV) | Minerals (Stadga — fail by ≤4 KV softens backlash one step) | Plants (Återväxt — a rolled 1 counts as 3). " +
                $"Rarity/dice: Common 1D6, Uncommon 2D6, Rare 3D6, Mythic 4D6. Mythic doubles its trait; max one Mythic doubled per ritual. Rare/Mythic may add one concrete ritual effect beyond KV. Valid in standard merchant layouts.",

            "LYÅDSKAPARE" =>
                $"LYÅDSKAPARE ({sw}). Sound mage items — instruments, trance tools, sound-manipulation objects. " +
                $"Effects: instrument protection/strengthening/melody storage, trance shortening/stabilization, range/target extension, unusual media transmission (stone/water/bone), morale strengthening, tone storage, trance entry easing, disrupting other sound mages. " +
                $"Cost tied to sound — item may not fall silent, or binds bearer to a direction.",

            "ORAKEL" =>
                $"ORAKEL ({sw}). Sacred relics — inscribed stones, fossils, sacred bones, offering vessels. " +
                $"Effects: improved negotiation position, reduced offering requirement, softened poor outcome consequences, stored blessing, clearer signs/omens, strengthened god inclination, protection against divine wrath. " +
                $"Cost tied to divine — must return to sacred place or loses power if oracle breaks their god's code.",

            "ADVENIRE" =>
                $"ADVENIRE ({sw}). Shaped by Advenire contact through one lore tradition. No lore knowledge needed — effect belongs to item. " +
                $"Specify lore_origin: KRISTALLSEJDARE | SHAMAN | LYÅDSKAPARE | ORAKEL. Inherits that tradition's flavor. " +
                $"KRISTALLSEJDARE-origin color/emotion: Red/Wrath (fire/explosive), Green/Shame (plants/ensnaring), Yellow/Joy (light/healing), Purple/Pride (lightning/necromancy), Orange/Love (stone/sheltering), Blue/Sorrow (water/melancholic).",

            "PETS" =>
                $"PETS ({sw}). All animals are hybrids of two real animals. " +
                $"Sizes: Pocket (mouse), Foot (cat/dog), Ride (horse), Trample (hippo/elephant). " +
                $"Max 2 evolutions at purchase. Evolution format defined in HARD RULES. Pets do not replace player character core roles.",

            "MISC" =>
                $"MISC ({sw}). Jewelry, clothing, tools, contracts, maps, organic objects, relics, carrying equipment, instruments without lore connection, anything else. " +
                $"Describe what the item is in the type field. No mechanical restrictions beyond global rules. Last resort, not default.",

            _ => $"{typeCode} ({sw}). No compressed rule available — see full item rules JSON."
        };
    }
}
