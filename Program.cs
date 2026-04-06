using Microsoft.EntityFrameworkCore;
using System.Text.RegularExpressions;
using Viaproxima.Web.Data;
using Viaproxima.Web.Models;

namespace Viaproxima.Web;

public class Program
{
    public static void Main(string[] args)
    {
        var builder = WebApplication.CreateBuilder(args);

        builder.Services.AddRazorPages();

        var dbPath = Path.Combine(builder.Environment.ContentRootPath, "app.db");
        builder.Services.AddDbContext<ApplicationDbContext>(options =>
            options.UseSqlite($"Data Source={dbPath}"));

        var app = builder.Build();

        using (var scope = app.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            db.Database.Migrate();
        }
        // =========================
        // Character API
        // =========================

        // Load one character
        app.MapGet("/api/characters/{id:int}", async (ApplicationDbContext db, int id) =>
        {
            var c = await db.Characters.FindAsync(id);
            return c is null ? Results.NotFound() : Results.Ok(c);
        });

        // Create a character
        app.MapPost("/api/characters", async (ApplicationDbContext db, Character dto) =>
        {
            db.Characters.Add(dto);
            await db.SaveChangesAsync();
            return Results.Ok(new { id = dto.Id });
        });

        // Update a character
        app.MapPut("/api/characters/{id:int}", async (ApplicationDbContext db, int id, Character dto) =>
        {
            var c = await db.Characters.FindAsync(id);
            if (c is null) return Results.NotFound();

            c.Name = dto.Name;
            c.Race = dto.Race;
            c.Xp = dto.Xp;

            c.Strength = dto.Strength;
            c.Genomslag = dto.Genomslag;
            c.Barformaga = dto.Barformaga;
            c.Forflytta = dto.Forflytta;
            c.Brottas = dto.Brottas;

            c.Skicklighet = dto.Skicklighet;
            c.Skytte = dto.Skytte;
            c.Fingerfardighet = dto.Fingerfardighet;
            c.Traffsakerhet = dto.Traffsakerhet;
            c.Akrobatik = dto.Akrobatik;

            c.Talighet = dto.Talighet;
            c.Mental = dto.Mental;
            c.Fysisk = dto.Fysisk;
            c.Blockera = dto.Blockera;
            c.Uthallighet = dto.Uthallighet;

            c.Intelligens = dto.Intelligens;
            c.Allmanbildning = dto.Allmanbildning;
            c.LogisktTankande = dto.LogisktTankande;
            c.OgaForDetaljer = dto.OgaForDetaljer;
            c.Uppfinningsrikedom = dto.Uppfinningsrikedom;

            c.Klokhet = dto.Klokhet;
            c.Snabbtankthet = dto.Snabbtankthet;
            c.KannaAvFara = dto.KannaAvFara;
            c.SeIgenomLogner = dto.SeIgenomLogner;
            c.MagiskKansla = dto.MagiskKansla;

            c.Utstralning = dto.Utstralning;
            c.Ljuga = dto.Ljuga;
            c.Overtala = dto.Overtala;
            c.Intryck = dto.Intryck;
            c.VackaKanslor = dto.VackaKanslor;

            c.Cuppar = dto.Cuppar;
            c.Ferrar = dto.Ferrar;
            c.Aurar = dto.Aurar;

            c.SkadaHuvud = dto.SkadaHuvud;
            c.SkadaTorso = dto.SkadaTorso;
            c.SkadaBen = dto.SkadaBen;
            c.SkadaArmar = dto.SkadaArmar;

            c.Pouch = dto.Pouch;
            c.Anteckningar = dto.Anteckningar;

            await db.SaveChangesAsync();
            return Results.Ok();
        });

        // =========================
        // Rules API (Bärkraft + grid size)
        // =========================

        app.MapPost("/api/rules/hp", (HpRequest req) =>
        {
            var talighet = req.Talighet < 0 ? 0 : req.Talighet;
            var fysisk = req.Fysisk < 0 ? 0 : req.Fysisk;
            var hpMax = talighet + fysisk;
            return Results.Ok(new HpResponse(hpMax));
        });

        app.MapPost("/api/rules/inventory-grid", (InventoryGridRequest req) =>
        {
            var strength = req.Strength < 0 ? 0 : req.Strength;
            var barf = req.Barformaga < 0 ? 0 : req.Barformaga;

            var barkraft = strength + barf;

            (int cols, int rows)? grid = barkraft switch
            {
                < 4 => null,
                < 6 => (3, 2),
                < 8 => (4, 2),
                < 10 => (4, 3),
                < 12 => (5, 3),
                < 14 => (5, 4),
                < 16 => (6, 4),
                < 18 => (6, 5),
                < 20 => (6, 6),
                _ => (7, 7),
            };

            return Results.Ok(new InventoryGridResponse(barkraft, grid?.cols, grid?.rows));
        });

        // =========================
        // Inventory Items API
        // =========================

        // List items for a character
        app.MapGet("/api/characters/{id:int}/items", async (ApplicationDbContext db, int id) =>
        {
            var items = await db.InventoryItems
                .Where(x => x.CharacterId == id)
                .OrderBy(x => x.Id)
                .ToListAsync();

            return Results.Ok(items);
        });

        // Create an item for character
        app.MapPost("/api/characters/{id:int}/items", async (ApplicationDbContext db, int id, InventoryItem dto) =>
        {
            dto.Id = 0;
            dto.CharacterId = id;

            db.InventoryItems.Add(dto);
            await db.SaveChangesAsync();

            return Results.Ok(new { id = dto.Id });
        });

        // Update an item
        app.MapPut("/api/items/{itemId:int}", async (ApplicationDbContext db, int itemId, InventoryItem dto) =>
        {
            var item = await db.InventoryItems.FindAsync(itemId);
            if (item is null) return Results.NotFound();

            item.Primary = dto.Primary;
            item.Secondary = dto.Secondary;
            item.IsMagic = dto.IsMagic;

            item.Size = dto.Size;

            item.IconPrimary = dto.IconPrimary;
            item.IconSecondary = dto.IconSecondary;
            item.IconFile = dto.IconFile;

            item.Durability = dto.Durability;
            item.Description = dto.Description;
            item.Name = dto.Name;

            item.X = dto.X;
            item.Y = dto.Y;

            await db.SaveChangesAsync();
            return Results.Ok();
        });

        // Delete an item
        app.MapDelete("/api/items/{itemId:int}", async (ApplicationDbContext db, int itemId) =>
        {
            var item = await db.InventoryItems.FindAsync(itemId);
            if (item is null) return Results.NotFound();

            db.InventoryItems.Remove(item);
            await db.SaveChangesAsync();
            return Results.NoContent();
        });

        // =========================
        // Lärdomar API
        // =========================

        app.MapGet("/api/characters/{id:int}/lardomar", async (ApplicationDbContext db, int id) =>
        {
            var items = await db.Lardomar
                .Where(x => x.CharacterId == id)
                .OrderBy(x => x.Id)
                .ToListAsync();
            return Results.Ok(items);
        });

        app.MapPost("/api/characters/{id:int}/lardomar", async (ApplicationDbContext db, int id, Lardom dto) =>
        {
            dto.Id = 0;
            dto.CharacterId = id;
            db.Lardomar.Add(dto);
            await db.SaveChangesAsync();
            return Results.Ok(new { id = dto.Id });
        });

        app.MapPut("/api/lardomar/{itemId:int}", async (ApplicationDbContext db, int itemId, Lardom dto) =>
        {
            var item = await db.Lardomar.FindAsync(itemId);
            if (item is null) return Results.NotFound();
            item.Namn = dto.Namn;
            item.Niva = dto.Niva;
            item.Beskrivning = dto.Beskrivning;
            await db.SaveChangesAsync();
            return Results.Ok();
        });

        app.MapDelete("/api/lardomar/{itemId:int}", async (ApplicationDbContext db, int itemId) =>
        {
            var item = await db.Lardomar.FindAsync(itemId);
            if (item is null) return Results.NotFound();
            db.Lardomar.Remove(item);
            await db.SaveChangesAsync();
            return Results.NoContent();
        });

        // =========================
        // Evolutioner API
        // =========================

        app.MapGet("/api/characters/{id:int}/evolutioner", async (ApplicationDbContext db, int id) =>
        {
            var items = await db.Evolutioner
                .Where(x => x.CharacterId == id)
                .OrderBy(x => x.Id)
                .ToListAsync();
            return Results.Ok(items);
        });

        app.MapPost("/api/characters/{id:int}/evolutioner", async (ApplicationDbContext db, int id, Evolution dto) =>
        {
            dto.Id = 0;
            dto.CharacterId = id;
            db.Evolutioner.Add(dto);
            await db.SaveChangesAsync();
            return Results.Ok(new { id = dto.Id });
        });

        app.MapPut("/api/evolutioner/{itemId:int}", async (ApplicationDbContext db, int itemId, Evolution dto) =>
        {
            var item = await db.Evolutioner.FindAsync(itemId);
            if (item is null) return Results.NotFound();
            item.Namn = dto.Namn;
            item.Niva = dto.Niva;
            item.Beskrivning = dto.Beskrivning;
            await db.SaveChangesAsync();
            return Results.Ok();
        });

        app.MapDelete("/api/evolutioner/{itemId:int}", async (ApplicationDbContext db, int itemId) =>
        {
            var item = await db.Evolutioner.FindAsync(itemId);
            if (item is null) return Results.NotFound();
            db.Evolutioner.Remove(item);
            await db.SaveChangesAsync();
            return Results.NoContent();
        });

        // =========================
        // Pets API
        // =========================

        app.MapGet("/api/characters/{id:int}/pets", async (ApplicationDbContext db, int id) =>
        {
            var items = await db.Pets
                .Where(x => x.CharacterId == id)
                .OrderBy(x => x.Id)
                .ToListAsync();
            return Results.Ok(items);
        });

        app.MapPost("/api/characters/{id:int}/pets", async (ApplicationDbContext db, int id, Pet dto) =>
        {
            dto.Id = 0;
            dto.CharacterId = id;
            db.Pets.Add(dto);
            await db.SaveChangesAsync();
            return Results.Ok(new { id = dto.Id });
        });

        app.MapPut("/api/pets/{petId:int}", async (ApplicationDbContext db, int petId, Pet dto) =>
        {
            var item = await db.Pets.FindAsync(petId);
            if (item is null) return Results.NotFound();
            item.Namn = dto.Namn;
            item.Tamdjurstyp = dto.Tamdjurstyp;
            item.Storlek = dto.Storlek;
            item.Beskrivning = dto.Beskrivning;
            item.IconFile = dto.IconFile;
            item.X = dto.X;
            item.Y = dto.Y;
            await db.SaveChangesAsync();
            return Results.Ok();
        });

        app.MapDelete("/api/pets/{petId:int}", async (ApplicationDbContext db, int petId) =>
        {
            var item = await db.Pets.FindAsync(petId);
            if (item is null) return Results.NotFound();
            db.Pets.Remove(item);
            await db.SaveChangesAsync();
            return Results.NoContent();
        });

        // =========================
        // Icons catalog API  (THE ONE your JS uses)
        // =========================
        app.MapGet("/api/icons/catalog", (IWebHostEnvironment env) =>
        {
            // scans: wwwroot/IconsItems/<Primary>/<Secondary>/*.svg  OR wwwroot/IconsItems/<Primary>/*.svg
            var iconsRoot = Path.Combine(env.WebRootPath, "IconsItems");

            if (!Directory.Exists(iconsRoot))
                return Results.Ok(new { primaries = Array.Empty<object>() });

            // Swedish labels (expand later or move to JSON)
            var primaryLabels = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["MeleeWeapons"] = "Närstridsvapen",
                ["Shields"] = "Sköldar",
                ["Armour"] = "Rustning",
                ["Ammo"] = "Ammunition",
                ["Crystals"] = "Kristaller",
            };

            var secondaryLabels = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["Axes"] = "Yxa",
                ["Knives"] = "Kniv/Dolk",
                ["Maces"] = "Klubba/Knölpåk",
                ["Spears"] = "Spjut",
                ["Staves"] = "Stav",
                ["Swords"] = "Hackvapen",
                ["Whip"] = "Piska",
                ["Scythe"] = "Lie",
                ["_root"] = "Alla",
            };

            static string StripSuffix(string fileNameNoExt)
            {
                if (fileNameNoExt.EndsWith("_Normal", StringComparison.OrdinalIgnoreCase))
                    return fileNameNoExt[..^7];
                if (fileNameNoExt.EndsWith("_Magic", StringComparison.OrdinalIgnoreCase))
                    return fileNameNoExt[..^6];
                return fileNameNoExt;
            }

            object BuildSecondary(string primaryKey, string secondaryKey, string folderPath, string urlPrefix)
            {
                var files = Directory.EnumerateFiles(folderPath, "*.svg", SearchOption.TopDirectoryOnly);

                var dict = new Dictionary<string, (string? normal, string? magic)>(StringComparer.OrdinalIgnoreCase);

                foreach (var f in files)
                {
                    var fileName = Path.GetFileName(f);
                    var noExt = Path.GetFileNameWithoutExtension(f);
                    var baseName = StripSuffix(noExt);

                    var isMagic = noExt.EndsWith("_Magic", StringComparison.OrdinalIgnoreCase);
                    var isNormal = noExt.EndsWith("_Normal", StringComparison.OrdinalIgnoreCase);

                    var url = $"{urlPrefix}/{fileName}";

                    if (!dict.TryGetValue(baseName, out var pair))
                        pair = (null, null);

                    if (isMagic) pair.magic = url;
                    else if (isNormal) pair.normal = url;
                    else pair.normal = url; // fallback if no suffix

                    dict[baseName] = pair;
                }

                var icons = dict
                    .OrderBy(k => k.Key)
                    .Select(k => new
                    {
                        baseName = k.Key,
                        normalUrl = k.Value.normal,
                        magicUrl = k.Value.magic
                    })
                    .ToList();

                return new
                {
                    secondaryKey,
                    secondaryLabel = secondaryLabels.TryGetValue(secondaryKey, out var sl) ? sl : secondaryKey,
                    icons
                };
            }

            var primaries = new List<object>();

            foreach (var primaryDir in Directory.EnumerateDirectories(iconsRoot))
            {
                var primaryKey = Path.GetFileName(primaryDir);

                var secondaryDirs = Directory.EnumerateDirectories(primaryDir).ToList();
                var secondaries = new List<object>();

                if (secondaryDirs.Count == 0)
                {
                    // Root-only primary (e.g. Shields/*.svg directly)
                    var urlPrefix = $"/IconsItems/{primaryKey}";
                    secondaries.Add(BuildSecondary(primaryKey, "_root", primaryDir, urlPrefix));
                }
                else
                {
                    foreach (var secDir in secondaryDirs)
                    {
                        var secondaryKey = Path.GetFileName(secDir);
                        var urlPrefix = $"/IconsItems/{primaryKey}/{secondaryKey}";
                        secondaries.Add(BuildSecondary(primaryKey, secondaryKey, secDir, urlPrefix));
                    }
                }

                primaries.Add(new
                {
                    primaryKey,
                    primaryLabel = primaryLabels.TryGetValue(primaryKey, out var pl) ? pl : Regex.Replace(primaryKey, "([a-z])([A-Z])", "$1 $2"),
                    secondaries
                });
            }

            return Results.Ok(new { primaries });
        });

        // =========================
        // Pets icon catalog API
        // =========================
        app.MapGet("/api/pets/icons/catalog", (IWebHostEnvironment env) =>
        {
            var root = Path.Combine(env.WebRootPath, "IconsPets");
            if (!Directory.Exists(root))
                return Results.Ok(new { types = Array.Empty<object>() });

            var types = Directory.EnumerateDirectories(root)
                .Select(dir =>
                {
                    var typeKey = Path.GetFileName(dir);
                    var icons = Directory.EnumerateFiles(dir, "*.svg", SearchOption.TopDirectoryOnly)
                        .Select(f => new
                        {
                            file = Path.GetFileName(f),
                            url  = $"/IconsPets/{typeKey}/{Path.GetFileName(f)}"
                        })
                        .OrderBy(x => x.file)
                        .ToList();
                    return new { typeKey, icons };
                })
                .OrderBy(t => t.typeKey)
                .ToList<object>();

            return Results.Ok(new { types });
        });

        app.MapGet("/api/pets/icons", (IWebHostEnvironment env) =>
        {
            var root = Path.Combine(env.WebRootPath, "IconsPets", "Pets");
            if (!Directory.Exists(root))
                return Results.Ok(new { icons = Array.Empty<object>() });

            var icons = Directory.EnumerateFiles(root, "*", SearchOption.AllDirectories)
                .Where(f => f.EndsWith(".svg", StringComparison.OrdinalIgnoreCase) ||
                            f.EndsWith(".png", StringComparison.OrdinalIgnoreCase))
                .Select(f =>
                {
                    var rel = Path.GetRelativePath(root, f).Replace('\\', '/');
                    return new { file = rel, url = $"/IconsPets/Pets/{rel}" };
                })
                .OrderBy(x => x.file)
                .ToList<object>();

            return Results.Ok(new { icons });
        });

        // =========================
        // Portrait API (filesystem only — no DB)
        // =========================

        // GET: return portrait URL if file exists on disk, else 404
        app.MapGet("/api/characters/{id:int}/portrait", (IWebHostEnvironment env, int id) =>
        {
            var dir = Path.Combine(env.WebRootPath, "portraits");
            if (!Directory.Exists(dir)) return Results.NotFound();
            var match = Directory.EnumerateFiles(dir, $"{id}.*").FirstOrDefault();
            return match is null
                ? Results.NotFound()
                : Results.Ok(new { url = $"/portraits/{Path.GetFileName(match)}" });
        });

        // POST: save uploaded portrait to wwwroot/portraits/{id}.{ext}, overwrite if present
        app.MapPost("/api/characters/{id:int}/portrait", async (IWebHostEnvironment env, int id, IFormFile file) =>
        {
            var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (ext is not (".png" or ".jpg" or ".jpeg" or ".webp"))
                return Results.BadRequest("Unsupported file type.");

            var dir = Path.Combine(env.WebRootPath, "portraits");
            Directory.CreateDirectory(dir);

            foreach (var old in Directory.EnumerateFiles(dir, $"{id}.*"))
                File.Delete(old);

            var dest = Path.Combine(dir, $"{id}{ext}");
            await using var stream = File.Create(dest);
            await file.CopyToAsync(stream);

            return Results.Ok(new { url = $"/portraits/{id}{ext}" });
        }).DisableAntiforgery();

        // =========================
        // Pipeline
        // =========================
        if (!app.Environment.IsDevelopment())
        {
            app.UseExceptionHandler("/Error");
            app.UseHsts();
            app.UseHttpsRedirection();
        }

        app.UseStaticFiles();

        app.UseRouting();
        app.UseAuthorization();

        app.MapRazorPages();

        app.Run();
    }
}
