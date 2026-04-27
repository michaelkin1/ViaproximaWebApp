namespace Viaproxima.Web.Data;

public class Adventure
{
    public int Id { get; set; }
    public string UserId { get; set; } = "";
    public string Title { get; set; } = "";
    public string Session { get; set; } = "";
    public int SortOrder { get; set; }
    public DateTime CreatedAt { get; set; }
    public ICollection<Chapter> Chapters { get; set; } = new List<Chapter>();
}
