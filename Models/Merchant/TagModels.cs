using System.Text.Json.Serialization;

namespace Viaproxima.Web.Models.Merchant;

public record FunctionalTag(
    [property: JsonPropertyName("id")] string Id,
    [property: JsonPropertyName("tag")] string Tag,
    [property: JsonPropertyName("category")] string Category,
    [property: JsonPropertyName("note")] string? Note
);

public record FunctionalTagsData(
    [property: JsonPropertyName("version")] string? Version,
    [property: JsonPropertyName("functional_tags")] List<FunctionalTag> FunctionalTags
);

public record TwistTagsData(
    [property: JsonPropertyName("version")] string? Version,
    [property: JsonPropertyName("twist_tags")] List<string> TwistTags
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
