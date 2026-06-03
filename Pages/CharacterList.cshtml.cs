using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.EntityFrameworkCore;
using Viaproxima.Web.Data;

namespace Viaproxima.Web.Pages;

public class CharacterListModel : PageModel
{
    private readonly ApplicationDbContext _db;
    private readonly IAuthorizationService _authorizationService;

    public CharacterListModel(ApplicationDbContext db, IAuthorizationService authorizationService)
    {
        _db = db;
        _authorizationService = authorizationService;
    }

    public List<Character> Characters { get; private set; } = new();
    public List<CharacterGroup> Groups { get; private set; } = new();

    public async Task OnGetAsync()
    {
        Characters = await _db.Characters
            .OrderByDescending(c => c.Id)
            .ToListAsync();
        Groups = await _db.CharacterGroups
            .OrderBy(g => g.SortOrder).ThenBy(g => g.Id)
            .ToListAsync();
    }

    public async Task<IActionResult> OnPostDeleteAsync(int id)
    {
        var authResult = await _authorizationService.AuthorizeAsync(User, "CanWrite");
        if (!authResult.Succeeded)
            return Forbid();

        var c = await _db.Characters.FindAsync(id);
        if (c is null) return RedirectToPage();

        _db.Characters.Remove(c);
        await _db.SaveChangesAsync();

        return RedirectToPage();
    }
}
