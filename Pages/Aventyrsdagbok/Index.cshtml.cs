using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace Viaproxima.Web.Pages.Aventyrsdagbok;

[Authorize]
public class IndexModel : PageModel
{
    public void OnGet() { }
}
