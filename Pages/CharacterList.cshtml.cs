using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.EntityFrameworkCore;
using Viaproxima.Web.Data;

namespace Viaproxima.Web.Pages;

public class CharacterListModel : PageModel
{
    private readonly ApplicationDbContext _db;

    public CharacterListModel(ApplicationDbContext db)
    {
        _db = db;
    }

    public List<Character> Characters { get; private set; } = new();

    public async Task OnGetAsync()
    {
        Characters = await _db.Characters
            .OrderByDescending(c => c.Id)
            .ToListAsync();
    }

    public async Task<IActionResult> OnPostDeleteAsync(int id)
    {
        var c = await _db.Characters.FindAsync(id);
        if (c is null) return RedirectToPage();

        _db.Characters.Remove(c);
        await _db.SaveChangesAsync();

        return RedirectToPage();
    }
}
