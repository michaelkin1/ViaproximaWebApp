namespace Viaproxima.Web.Models;

public record InventoryGridRequest(int Strength, int Barformaga);
public record InventoryGridResponse(int Barkraft, int? Cols, int? Rows);
