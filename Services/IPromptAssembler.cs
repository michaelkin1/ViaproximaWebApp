using Viaproxima.Web.Models.Merchant;

namespace Viaproxima.Web.Services;

public interface IPromptAssembler
{
    PromptResult BuildPrompt(PromptParams parameters);
    IReadOnlyList<Ras> GetRaser();
    IReadOnlyList<Skrå> GetSkrån();
}
