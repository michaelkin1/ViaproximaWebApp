namespace Viaproxima.Web.Data;

public class Chapter
{
    public int Id { get; set; }
    public int AdventureId { get; set; }
    public Adventure Adventure { get; set; } = null!;
    public string Title { get; set; } = "";
    public string Date { get; set; } = "";
    public string BodyHtml { get; set; } = "";
    public int SortOrder { get; set; }
    public bool Collapsed { get; set; }
    public ICollection<ImageLink> ImageLinks { get; set; } = new List<ImageLink>();
}
