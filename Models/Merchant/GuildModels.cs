using System.Text.Json.Serialization;

namespace Viaproxima.Web.Models.Merchant;

public record ViaproximaGuild(
    [property: JsonPropertyName("id")] string Id,
    [property: JsonPropertyName("name")] string Name,
    [property: JsonPropertyName("theme")] string Theme,
    [property: JsonPropertyName("lore")] string Lore,
    [property: JsonPropertyName("feeling")] string Feeling
);

public record GuildsData(
    [property: JsonPropertyName("version")] string? Version,
    [property: JsonPropertyName("guilds")] List<ViaproximaGuild> Guilds
);
