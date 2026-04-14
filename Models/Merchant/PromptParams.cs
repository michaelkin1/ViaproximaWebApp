namespace Viaproxima.Web.Models.Merchant;

public record PromptParams(
    string SkråId,
    string RasId,
    int AntalItems,
    string? LärdomFokus
);

public record PromptResult(
    string Prompt,
    string LayoutId
);
