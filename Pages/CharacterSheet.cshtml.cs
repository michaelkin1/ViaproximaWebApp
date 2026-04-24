using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace Viaproxima.Web.Pages;

public class CharacterSheetModel : PageModel
{
    public IActionResult OnGet(int? id)
    {
        var target = id.HasValue ? $"/CharacterList?id={id}" : "/CharacterList";
        return Redirect(target);
    }
}
