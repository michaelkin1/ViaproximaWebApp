namespace Viaproxima.Web.Models;

public record AdventureCreateDto(string Title, string Session);
public record ChapterCreateDto(string Title, string Date);
public record ChapterUpdateDto(string Title, string Date, string BodyHtml, bool Collapsed);
