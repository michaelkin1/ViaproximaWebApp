using System.Text.Json;
using System.Text.RegularExpressions;
using Viaproxima.Web.Models.Merchant;

namespace Viaproxima.Web.Services;

public class PromptAssembler : IPromptAssembler
{
    private readonly List<ViaproximaRace> _races;
    private readonly List<ViaproximaGuild> _guilds;
    private readonly Dictionary<string, JsonElement> _itemTypeRules;
    private readonly List<FunctionalTag> _functionalTags;
    private readonly List<string> _twistTags;
    private readonly Dictionary<string, List<InspirationTagEntry>> _guildInspirationTags;
    private readonly string _worldContext;
    private readonly string _promptTemplate;

    public PromptAssembler(
        List<ViaproximaRace> races,
        List<ViaproximaGuild> guilds,
        Dictionary<string, JsonElement> itemTypeRules,
        List<FunctionalTag> functionalTags,
        List<string> twistTags,
        Dictionary<string, List<InspirationTagEntry>> guildInspirationTags,
        string worldContext,
        string promptTemplate)
    {
        _races = races;
        _guilds = guilds;
        _itemTypeRules = itemTypeRules;
        _functionalTags = functionalTags;
        _twistTags = twistTags;
        _guildInspirationTags = guildInspirationTags;
        _worldContext = worldContext;
        _promptTemplate = promptTemplate;
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
        var slots = new List<ItemSlot>();
        var slotNumber = 1;
        foreach (var (typeCode, count) in parameters.ItemTypeCounts.Where(kvp => kvp.Value > 0))
        {
            for (int i = 0; i < count; i++)
            {
                var funcTag = _functionalTags[Random.Shared.Next(_functionalTags.Count)];
                var inspTag = inspirationPool.Any()
                    ? inspirationPool[Random.Shared.Next(inspirationPool.Count)].Tag
                    : "No inspiration available";
                var twistTag = _twistTags[Random.Shared.Next(_twistTags.Count)];
                var swedishName = GetSwedishTypeName(typeCode);

                slots.Add(new ItemSlot(typeCode, swedishName, funcTag.Tag, inspTag, twistTag));
                slotNumber++;
            }
        }

        // Format item slots for template
        var slotLines = new List<string>();
        int num = 1;
        foreach (var slot in slots)
        {
            slotLines.Add($"Slot {num} — {slot.SwedishTypeName} ({slot.TypeCode})");
            slotLines.Add($"  Tag: {slot.FunctionalTag}");
            slotLines.Add($"  Inspiration: {slot.InspirationTag}");
            slotLines.Add($"  Twist: {slot.TwistTag}");
            num++;
        }
        var itemSlotsFormatted = string.Join("\n", slotLines);

        // Get unique type codes present and build type rules section
        var typesPresent = parameters.ItemTypeCounts.Where(kvp => kvp.Value > 0).Select(kvp => kvp.Key).ToList();
        var typeRulesLines = new List<string>();
        foreach (var typeCode in typesPresent)
        {
            if (_itemTypeRules.TryGetValue(typeCode, out var ruleElement))
            {
                var swedishName = GetSwedishTypeName(typeCode);
                var ruleJson = JsonSerializer.Serialize(ruleElement, new JsonSerializerOptions { WriteIndented = true });
                typeRulesLines.Add($"**{swedishName} ({typeCode})**");
                typeRulesLines.Add("```json");
                typeRulesLines.Add(ruleJson);
                typeRulesLines.Add("```");
            }
        }
        var typeRulesFormatted = string.Join("\n", typeRulesLines);

        // Build guild reference
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
            .Replace("{{RACE_NAME}}", race.Name)
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
}
