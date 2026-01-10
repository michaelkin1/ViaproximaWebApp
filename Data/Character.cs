namespace Viaproxima.Web.Data;

public class Character
{
    public int Id { get; set; }

    public string Name { get; set; } = "";
    public string Race { get; set; } = "";

    public int Strength { get; set; }
    public int Barformaga { get; set; }

    public int Xp { get; set; }


    // later you add more stats/substats here
}
