using System.Text.Json.Serialization;

namespace Viaproxima.Web.Models.Merchant;

public record Layout(
    [property: JsonPropertyName("id")] string Id,
    [property: JsonPropertyName("slots")] int Slots,
    [property: JsonPropertyName("counts")] Dictionary<string, int> Counts
);

public record LayoutsData(
    [property: JsonPropertyName("mapping")] Dictionary<string, string> Mapping,
    [property: JsonPropertyName("layouts")] List<Layout> Layouts
);
