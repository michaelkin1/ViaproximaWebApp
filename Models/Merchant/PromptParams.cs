namespace Viaproxima.Web.Models.Merchant;

public record ItemSlot(
    string TypeCode,
    string SwedishTypeName,
    string FunctionalTag,
    string InspirationTag,
    string TwistTag
);

public record PromptParams(
    string GuildId,
    string RaceId,
    Dictionary<string, int> ItemTypeCounts
);

public record PromptResult(
    string Prompt,
    string LayoutId
);
