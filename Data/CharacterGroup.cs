namespace Viaproxima.Web.Data;

public class CharacterGroup
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public int SortOrder { get; set; }
    public ICollection<Character> Characters { get; set; } = new List<Character>();
}
