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

    public List<SelectListItem> Raser { get; set; } = [];
    public List<SelectListItem> Skrån { get; set; } = [];

    [BindProperty]
    public string SkråId { get; set; } = "";

    [BindProperty]
    public string RasId { get; set; } = "";

    [BindProperty]
    public int AntalItems { get; set; } = 8;

    [BindProperty]
    public string? LärdomFokus { get; set; }

    public string? GeneradPrompt { get; set; }
    public string? LayoutId { get; set; }

    public void OnGet()
    {
        PopulateDropdowns();
    }

    public void OnPost()
    {
        PopulateDropdowns();

        var result = _assembler.BuildPrompt(new PromptParams(SkråId, RasId, AntalItems, LärdomFokus));
        GeneradPrompt = result.Prompt;
        LayoutId = result.LayoutId;
    }

    private void PopulateDropdowns()
    {
        var raser = _assembler.GetRaser();
        var skrån = _assembler.GetSkrån();

        Raser = raser
            .Select(r => new SelectListItem(r.Namn, r.Id))
            .ToList();

        Skrån = skrån
            .Select(s => new SelectListItem(s.Namn, s.Id))
            .ToList();

        // Default selections
        if (string.IsNullOrEmpty(SkråId) && Skrån.Any())
        {
            SkråId = Skrån.First().Value;
        }

        if (string.IsNullOrEmpty(RasId) && Raser.Any())
        {
            RasId = Raser.First().Value;
        }
    }
}
