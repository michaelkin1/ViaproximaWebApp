using System.Text.Json.Serialization;

namespace Viaproxima.Web.Models.Merchant;

public record ArchetypeEntry(
    [property: JsonPropertyName("description")] string Description,
    [property: JsonPropertyName("compatible_types")] List<string> CompatibleTypes
);

public record ArchetypesData(
    [property: JsonPropertyName("version")] string? Version,
    [property: JsonPropertyName("description")] string? Description,
    [property: JsonPropertyName("usage_rule")] string? UsageRule,
    [property: JsonPropertyName("item_types")] List<string> ItemTypes,
    [property: JsonPropertyName("archetypes")] Dictionary<string, ArchetypeEntry> Archetypes
);

public record LardomRule(
    [property: JsonPropertyName("id")] int Id,
    [property: JsonPropertyName("name")] string Name,
    [property: JsonPropertyName("rule")] string Rule
);

public record LardomLoreRules(
    [property: JsonPropertyName("rules")] List<LardomRule> Rules
);

public record LardomRulesData(
    [property: JsonPropertyName("version")] string? Version,
    [property: JsonPropertyName("description")] string? Description,
    [property: JsonPropertyName("lore_types")] Dictionary<string, LardomLoreRules> LoreTypes
);

public record InspirationTagEntry(
    [property: JsonPropertyName("tag")] string Tag,
    [property: JsonPropertyName("type")] string Type
);

public record InspirationTagCategory(
    [property: JsonPropertyName("tags")] List<InspirationTagEntry> Tags
);

public record GuildInspirationData(
    [property: JsonPropertyName("guild")] string Guild,
    [property: JsonPropertyName("categories")] Dictionary<string, InspirationTagCategory> Categories
);
