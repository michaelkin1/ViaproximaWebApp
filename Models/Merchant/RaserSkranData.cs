using System.Text.Json.Serialization;

namespace Viaproxima.Web.Models.Merchant;

public record Ras(
    [property: JsonPropertyName("id")] string Id,
    [property: JsonPropertyName("namn")] string Namn,
    [property: JsonPropertyName("visuella_taggar")] List<string> VisuellaTAggar,
    [property: JsonPropertyName("material_bias")] List<string> MaterialBias,
    [property: JsonPropertyName("estetisk_bias")] List<string> EstetiskBias
);

public record Skrå(
    [property: JsonPropertyName("id")] string Id,
    [property: JsonPropertyName("namn")] string Namn,
    [property: JsonPropertyName("tema_nyckelord")] List<string> TemaNyckelord,
    [property: JsonPropertyName("estetisk_bias")] List<string> EstetiskBias,
    [property: JsonPropertyName("material_bias")] List<string> MaterialBias,
    [property: JsonPropertyName("design_riktning")] string DesignRiktning
);

public record RaserSkranData(
    [property: JsonPropertyName("version")] string? Version,
    [property: JsonPropertyName("design_princip")] string? DesignPrincip,
    [property: JsonPropertyName("raser")] List<Ras> Raser,
    [property: JsonPropertyName("skrån")] List<Skrå> Skrån
);
