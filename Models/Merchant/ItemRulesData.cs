using System.Text.Json.Serialization;

namespace Viaproxima.Web.Models.Merchant;

public record TypeRule(
    [property: JsonPropertyName("must_include")] List<string> MustInclude,
    [property: JsonPropertyName("constraints")] List<string> Constraints
);

public record ItemRulesData(
    [property: JsonPropertyName("version")] string? Version,
    [property: JsonPropertyName("enums")] Dictionary<string, string> Enums,
    [property: JsonPropertyName("type_rules")] Dictionary<string, TypeRule> TypeRules
);
