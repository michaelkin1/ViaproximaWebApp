using System.Text.Json.Serialization;

namespace Viaproxima.Web.Models.Merchant;

public record ViaproximaRace(
    [property: JsonPropertyName("id")] string Id,
    [property: JsonPropertyName("name")] string Name,
    [property: JsonPropertyName("description")] string? Description,
    [property: JsonPropertyName("visual_tags")] List<string> VisualTags,
    [property: JsonPropertyName("material_bias")] List<string> MaterialBias,
    [property: JsonPropertyName("aesthetic_bias")] List<string> AestheticBias
);

public record RacesData(
    [property: JsonPropertyName("version")] string? Version,
    [property: JsonPropertyName("races")] List<ViaproximaRace> Races
);

public record RaceReminder(
    [property: JsonPropertyName("one_line")] string OneLine,
    [property: JsonPropertyName("body_features")] string BodyFeatures
);

public record RaceRemindersData(
    [property: JsonPropertyName("version")] string? Version,
    [property: JsonPropertyName("description")] string? Description,
    [property: JsonPropertyName("races")] Dictionary<string, RaceReminder> Races
);
