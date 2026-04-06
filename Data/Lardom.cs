namespace Viaproxima.Web.Data;

public class Lardom
{
    public int Id { get; set; }
    public int CharacterId { get; set; }
    public Character Character { get; set; } = null!;
    public string Namn { get; set; } = "";
    public int Niva { get; set; }
    public string? Beskrivning { get; set; }
}
