namespace Viaproxima.Web.Data;

public class ImageLink
{
    public int Id { get; set; }
    public int ChapterId { get; set; }
    public Chapter Chapter { get; set; } = null!;
    public string AnchorText { get; set; } = "";
    public string ImagePath { get; set; } = "";
    public string FileName { get; set; } = "";
}
