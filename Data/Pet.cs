namespace Viaproxima.Web.Data;

public class Pet
{
    public int Id { get; set; }
    public int CharacterId { get; set; }
    public Character Character { get; set; } = null!;
    public string Namn { get; set; } = "";
    public string Tamdjurstyp { get; set; } = "";
    public string Storlek { get; set; } = "1x1";
    public string? Beskrivning { get; set; }
    public string IconFile { get; set; } = "";
    public int X { get; set; }
    public int Y { get; set; }
}
