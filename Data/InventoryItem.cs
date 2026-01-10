namespace Viaproxima.Web.Data;

public class InventoryItem
{
    public int Id { get; set; }

    public int CharacterId { get; set; }
    public Character? Character { get; set; }

    public string Primary { get; set; } = "";
    public string Secondary { get; set; } = "";

    public bool IsMagic { get; set; }

    // "1x1", "2x1", etc (UI-friendly)
    public string Size { get; set; } = "1x1";

    // ✅ DB-friendly: explicit dimensions (what your API expects)
    public int Cols { get; set; } = 1;
    public int Rows { get; set; } = 1;

    // Optional: numeric "weight" if you want it separate from size
    public int Weight { get; set; } = 1;

    // Selected file name, e.g. "StoneAxe_Normal.svg"
    public string IconFile { get; set; } = "";

    // Folder keys so we can rebuild URL:
    public string IconPrimary { get; set; } = "";
    public string IconSecondary { get; set; } = "";

    public int? Durability { get; set; }
    public string Description { get; set; } = "";

    // Placement in grid
    public int X { get; set; }
    public int Y { get; set; }
}
