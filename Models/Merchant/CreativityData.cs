using System.Text.Json.Serialization;

namespace Viaproxima.Web.Models.Merchant;

public record GuildFlavor(
    [property: JsonPropertyName("inspirationskorn")] List<string> Inspirationskorn
);

public record FlavorSeedsContainer(
    [property: JsonPropertyName("skrån")] Dictionary<string, GuildFlavor> Skrån
);

public record CreativityData(
    [property: JsonPropertyName("version")] string? Version,
    [property: JsonPropertyName("flavor_seeds")] FlavorSeedsContainer FlavorSeeds
);
