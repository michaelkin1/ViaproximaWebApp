using System.Text.RegularExpressions;
using Viaproxima.Web.Models.Merchant;

namespace Viaproxima.Web.Services;

public class PromptAssembler : IPromptAssembler
{
    private readonly RaserSkranData _raserSkran;
    private readonly ItemRulesData _itemRules;
    private readonly LayoutsData _layouts;
    private readonly CreativityData _creativity;
    private readonly string _skeletonText;
    private readonly Random _random = new();

    public PromptAssembler(
        RaserSkranData raserSkran,
        ItemRulesData itemRules,
        LayoutsData layouts,
        CreativityData creativity,
        string skeletonText)
    {
        _raserSkran = raserSkran;
        _itemRules = itemRules;
        _layouts = layouts;
        _creativity = creativity;
        _skeletonText = skeletonText;
    }

    public PromptResult BuildPrompt(PromptParams parameters)
    {
        var prompt = _skeletonText;

        // Validate and look up inputs
        var ras = _raserSkran.Raser.FirstOrDefault(r => r.Id == parameters.RasId);
        if (ras == null)
        {
            return new PromptResult($"Error: Ras ID '{parameters.RasId}' not found.", "ERROR");
        }

        var skrå = _raserSkran.Skrån.FirstOrDefault(s => s.Id == parameters.SkråId);
        if (skrå == null)
        {
            return new PromptResult($"Error: Skrå ID '{parameters.SkråId}' not found.", "ERROR");
        }

        // Pick a random layout from all available layouts
        // AntalItems controls how many items the LLM generates, not which layout is selected
        if (!_layouts.Layouts.Any())
        {
            return new PromptResult("Error: No layouts available.", "ERROR");
        }

        var selectedLayout = _layouts.Layouts[_random.Next(_layouts.Layouts.Count)];
        var layoutId = selectedLayout.Id;

        // Replace ras placeholders
        prompt = prompt.Replace("{{RAS_NAMN}}", ras.Namn);
        prompt = prompt.Replace("{{RAS_VISUELLA_TAGGAR}}", string.Join(", ", ras.VisuellaTAggar));
        prompt = prompt.Replace("{{RAS_MATERIAL_BIAS}}", string.Join(", ", ras.MaterialBias));
        prompt = prompt.Replace("{{RAS_ESTETISK_BIAS}}", string.Join(", ", ras.EstetiskBias));

        // Replace skrå placeholders
        prompt = prompt.Replace("{{SKRÅ_NAMN}}", skrå.Namn);
        prompt = prompt.Replace("{{SKRÅ_TEMA_NYCKELORD}}", string.Join(", ", skrå.TemaNyckelord));
        prompt = prompt.Replace("{{SKRÅ_ESTETISK_BIAS}}", string.Join(", ", skrå.EstetiskBias));
        prompt = prompt.Replace("{{SKRÅ_MATERIAL_BIAS}}", string.Join(", ", skrå.MaterialBias));
        prompt = prompt.Replace("{{SKRÅ_DESIGN_RIKTNING}}", skrå.DesignRiktning);

        // Replace skrå inspiration
        if (_creativity.FlavorSeeds.Skrån.TryGetValue(parameters.SkråId, out var guildFlavor))
        {
            var inspirationBullets = string.Join("\n", guildFlavor.Inspirationskorn.Select(s => $"  - {s}"));
            prompt = prompt.Replace("{{SKRÅ_INSPIRATIONSKORN}}", inspirationBullets);
        }
        else
        {
            prompt = prompt.Replace("{{SKRÅ_INSPIRATIONSKORN}}", "");
        }

        // Replace layout ID
        prompt = prompt.Replace("{{LAYOUT_ID}}", layoutId);

        // Build layout counts block
        var countsLines = selectedLayout.Counts
            .Select(kvp => {
                var swedishName = _itemRules.Enums.TryGetValue(kvp.Key, out var name) ? name : kvp.Key;
                return $"- {swedishName}: {kvp.Value}";
            })
            .ToList();
        prompt = prompt.Replace("{{LAYOUT_COUNTS}}", string.Join("\n", countsLines));

        // Build enum mapping (types present in layout)
        var enumMappingLines = selectedLayout.Counts.Keys
            .Where(typeCode => _itemRules.Enums.ContainsKey(typeCode))
            .Select(typeCode => $"{typeCode}: {_itemRules.Enums[typeCode]}")
            .ToList();
        prompt = prompt.Replace("{{ENUM_MAPPING}}", string.Join(", ", enumMappingLines));

        // Build type rules
        var typeRulesLines = new List<string>();
        foreach (var typeCode in selectedLayout.Counts.Keys)
        {
            if (_itemRules.TypeRules.TryGetValue(typeCode, out var rule))
            {
                var swedishName = _itemRules.Enums.TryGetValue(typeCode, out var name) ? name : typeCode;
                var mustInclude = string.Join(" + ", rule.MustInclude);
                var constraints = string.Join(". ", rule.Constraints);
                typeRulesLines.Add($"**{swedishName}:** {mustInclude}. {constraints}");
            }
        }
        prompt = prompt.Replace("{{INJICERADE_TYPREGLER}}", string.Join("\n", typeRulesLines));

        // Handle section F (LORE)
        if (!selectedLayout.Counts.ContainsKey("LORE"))
        {
            // Remove section F: from "## [STATISK] F. MAGISYSTEM..." to the next "## " or end
            var sectionFPattern = @"## \[STATISK\] F\. MAGISYSTEM[^\n]*\n(?:(?!## ).)*";
            prompt = Regex.Replace(prompt, sectionFPattern, "");
        }

        // Replace remaining params
        prompt = prompt.Replace("{{ANTAL_ITEMS}}", parameters.AntalItems.ToString());
        prompt = prompt.Replace("{{LÄRDOM_FOKUS}}", parameters.LärdomFokus ?? "Ingen");

        return new PromptResult(prompt, layoutId);
    }

    public IReadOnlyList<Ras> GetRaser()
    {
        return _raserSkran.Raser.AsReadOnly();
    }

    public IReadOnlyList<Skrå> GetSkrån()
    {
        return _raserSkran.Skrån.AsReadOnly();
    }
}
