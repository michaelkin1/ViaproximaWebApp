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

public record GuildMechanicSignature(
    [property: JsonPropertyName("prompt_block")] string PromptBlock
);

public record GuildMechanicData(
    [property: JsonPropertyName("version")] string? Version,
    [property: JsonPropertyName("description")] string? Description,
    [property: JsonPropertyName("guilds")] Dictionary<string, GuildMechanicSignature> Guilds
);
