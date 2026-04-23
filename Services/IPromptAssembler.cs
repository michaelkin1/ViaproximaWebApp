using Viaproxima.Web.Models.Merchant;

namespace Viaproxima.Web.Services;

public interface IPromptAssembler
{
    PromptResult BuildPrompt(PromptParams parameters);
    IReadOnlyList<ViaproximaRace> GetRaces();
    IReadOnlyList<ViaproximaGuild> GetGuilds();
    IReadOnlyList<string> GetItemTypeCodes();
    string GetSwedishTypeName(string typeCode);
}
