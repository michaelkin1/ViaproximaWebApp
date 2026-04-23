using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.AspNetCore.Mvc.Rendering;
using Viaproxima.Web.Models.Merchant;
using Viaproxima.Web.Services;

namespace Viaproxima.Web.Pages;

public class MerchantGeneratorModel : PageModel
{
    private readonly IPromptAssembler _assembler;

    public MerchantGeneratorModel(IPromptAssembler assembler)
    {
        _assembler = assembler;
    }

    public List<SelectListItem> Races { get; set; } = [];
    public List<SelectListItem> Guilds { get; set; } = [];
    public List<(string Code, string SwedishName)> ItemTypes { get; set; } = [];

    [BindProperty]
    public string GuildId { get; set; } = "";

    [BindProperty]
    public string RaceId { get; set; } = "";

    [BindProperty]
    public Dictionary<string, int> ItemTypeCounts { get; set; } = new();

    public string? GeneratedPrompt { get; set; }
    public string? LayoutId { get; set; }
    public string? ErrorMessage { get; set; }

    public void OnGet()
    {
        Populate();
    }

    public void OnPost()
    {
        Populate();

        var total = ItemTypeCounts.Values.Sum();
        if (total == 0 || total > 12)
        {
            ErrorMessage = $"Total items must be between 1 and 12. Current: {total}.";
            return;
        }

        var result = _assembler.BuildPrompt(new PromptParams(GuildId, RaceId, ItemTypeCounts));
        GeneratedPrompt = result.Prompt;
        LayoutId = result.LayoutId;
    }

    private void Populate()
    {
        Races = _assembler.GetRaces()
            .Select(r => new SelectListItem(r.Name, r.Id))
            .ToList();

        Guilds = _assembler.GetGuilds()
            .Select(g => new SelectListItem(g.Name, g.Id))
            .ToList();

        ItemTypes = _assembler.GetItemTypeCodes()
            .Select(c => (c, _assembler.GetSwedishTypeName(c)))
            .ToList();

        // Default selections
        if (string.IsNullOrEmpty(GuildId) && Guilds.Any())
        {
            GuildId = Guilds.First().Value;
        }

        if (string.IsNullOrEmpty(RaceId) && Races.Any())
        {
            RaceId = Races.First().Value;
        }
    }
}
