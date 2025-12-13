using Microsoft.AspNetCore.Mvc.RazorPages;

namespace Viaproxima.Web.Pages
{
    public class CharacterSheetModel : PageModel
    {
        public string Name { get; private set; } = "";
        public string Race { get; private set; } = "";

        // Main + sub stats the .cshtml expects
        public int Strength { get; private set; }
        public int Barformaga { get; private set; }

        // Derived Bärkraft = Styrka + Bärförmåga
        public int Barkraft => Strength + Barformaga;

        public void OnGet()
        {
            // Temporary hard-coded test values
            Name = "Rekordu";
            Race = "Kalluer";

            Strength = 3;    // main stat "Styrka"
            Barformaga = 5;  // sub stat "Bärförmåga"
        }
    }
}
