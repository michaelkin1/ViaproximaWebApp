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
