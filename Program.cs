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
            c.Strength = dto.Strength;
            c.Barformaga = dto.Barformaga;
            c.Xp = dto.Xp;

            c.SkadaHuvud = dto.SkadaHuvud;
            c.SkadaTorso = dto.SkadaTorso;
            c.SkadaBen = dto.SkadaBen;
            c.SkadaArmar = dto.SkadaArmar;

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
