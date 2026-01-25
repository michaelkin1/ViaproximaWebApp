namespace Viaproxima.Web.Data;

public class Character
{
    public int Id { get; set; }

    public string Name { get; set; } = "";
    public string Race { get; set; } = "";

    public int Xp { get; set; }

    // ===== Grundegenskaper (huvudstats) =====
    public int Strength { get; set; }
    public int Skicklighet { get; set; }
    public int Talighet { get; set; }
    public int Intelligens { get; set; }
    public int Klokhet { get; set; }
    public int Utstralning { get; set; }

    // ===== STYRKA (substats) =====
    public int Genomslag { get; set; }
    public int Barformaga { get; set; }
    public int Forflytta { get; set; }
    public int Brottas { get; set; }

    // ===== SKICKLIGHET (substats) =====
    public int Skytte { get; set; }
    public int Fingerfardighet { get; set; }
    public int Traffsakerhet { get; set; }
    public int Akrobatik { get; set; }

    // ===== TALIGHET (substats) =====
    public int Mental { get; set; }
    public int Fysisk { get; set; }
    public int Blockera { get; set; }
    public int Uthallighet { get; set; }

    // ===== INTELLIGENS (substats) =====
    public int Allmanbildning { get; set; }
    public int LogisktTankande { get; set; }
    public int OgaForDetaljer { get; set; }
    public int Uppfinningsrikedom { get; set; }

    // ===== KLOKHET (substats) =====
    public int Snabbtankthet { get; set; }
    public int KannaAvFara { get; set; }
    public int SeIgenomLogner { get; set; }
    public int MagiskKansla { get; set; }

    // ===== UTSTRÅLNING (substats) =====
    public int Ljuga { get; set; }
    public int Overtala { get; set; }
    public int Intryck { get; set; }
    public int VackaKanslor { get; set; }

    // ===== Valuta =====
    public int Cuppar { get; set; }
    public int Ferrar { get; set; }
    public int Aurar { get; set; }

    // ===== Skada (nuvarande, max beräknas via rules) =====
    public int SkadaHuvud { get; set; }
    public int SkadaTorso { get; set; }
    public int SkadaBen { get; set; }
    public int SkadaArmar { get; set; }

    // ===== Skada (nuvarande, max beräknas via rules) =====
}
