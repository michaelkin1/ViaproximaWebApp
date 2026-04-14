using System.Security.Claims;
using System.Text.Json;
using System.Text.RegularExpressions;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Viaproxima.Web.Data;
using Viaproxima.Web.Models;
using Viaproxima.Web.Models.Merchant;
using Viaproxima.Web.Services;

namespace Viaproxima.Web;

public class Program
{
    public static async Task Main(string[] args)
    {
        var builder = WebApplication.CreateBuilder(args);

        builder.Configuration.AddJsonFile("appsettings.Secrets.json", optional: true, reloadOnChange: false);

        builder.Services.AddRazorPages();

        var dbPath = Path.Combine(builder.Environment.ContentRootPath, "app.db");
        builder.Services.AddDbContext<ApplicationDbContext>(options =>
            options.UseSqlite($"Data Source={dbPath}"));

        builder.Services.AddSingleton<IPasswordHasher<User>, PasswordHasher<User>>();

        builder.Services.AddAuthentication("Cookies")
            .AddCookie("Cookies", options =>
            {
                options.Cookie.Name = "Viaproxima.Auth";
                options.Cookie.HttpOnly = true;
                options.Cookie.SecurePolicy = CookieSecurePolicy.Always;
                options.Cookie.SameSite = SameSiteMode.Lax;
                options.SlidingExpiration = true;
                options.ExpireTimeSpan = TimeSpan.FromHours(8);
                options.LoginPath = "/Login";
                options.Events.OnRedirectToLogin = context =>
                {
                    if (context.Request.Path.StartsWithSegments("/api"))
                    {
                        context.Response.StatusCode = 401;
                        return Task.CompletedTask;
                    }
                    context.Response.Redirect(context.RedirectUri);
                    return Task.CompletedTask;
                };
            });

        builder.Services.AddAuthorization(options =>
        {
            options.AddPolicy("CanWrite", policy =>
                policy.RequireRole("Writer", "Admin"));
        });

        builder.Services.AddAntiforgery(options =>
        {
            options.HeaderName = "X-XSRF-TOKEN";
        });

        builder.Services.AddRateLimiter(options =>
        {
            options.AddPolicy("LoginLimit", _ =>
                RateLimitPartition.GetFixedWindowLimiter("login", _ => new FixedWindowRateLimiterOptions
                {
                    PermitLimit = 5,
                    Window = TimeSpan.FromMinutes(1),
                    QueueLimit = 0,
                }));
            options.OnRejected = async (context, ct) =>
            {
                context.HttpContext.Response.StatusCode = 429;
                await context.HttpContext.Response.WriteAsync("Too many requests. Try again later.", ct);
            };
        });

        builder.Services.AddSingleton<IPromptAssembler>(sp =>
        {
            var env = sp.GetRequiredService<IWebHostEnvironment>();
            var root = Path.Combine(env.WebRootPath, "MerchantRules");
            var opts = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };

            var raserSkran = JsonSerializer.Deserialize<RaserSkranData>(
                File.ReadAllText(Path.Combine(root, "viaproxima_raser_skran_design_sv.json")), opts)!;
            var itemRules = JsonSerializer.Deserialize<ItemRulesData>(
                File.ReadAllText(Path.Combine(root, "viaproxima_item_rules.json")), opts)!;
            var layouts = JsonSerializer.Deserialize<LayoutsData>(
                File.ReadAllText(Path.Combine(root, "viaproxima_layouts_150.json")), opts)!;
            var creativity = JsonSerializer.Deserialize<CreativityData>(
                File.ReadAllText(Path.Combine(root, "viaproxima_item_creativity.json")), opts)!;
            var skeleton = File.ReadAllText(Path.Combine(root, "viaproxima_merchant_prompt_skeleton.md"));

            return new PromptAssembler(raserSkran, itemRules, layouts, creativity, skeleton);
        });

        var app = builder.Build();

        using (var scope = app.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            db.Database.Migrate();
        }

        await AdminSeeder.TrySeedFromArgsAsync(args, app.Services);

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
        app.UseRateLimiter();
        app.UseForwardedHeaders(new ForwardedHeadersOptions
        {
            ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto
        });
        app.UseAuthentication();
        app.UseAuthorization();
        app.UseAntiforgery();

        // =========================
        // Auth API
        // =========================

        app.MapGet("/api/auth/me", (HttpContext context) =>
        {
            var user = context.User;
            if (user.Identity?.IsAuthenticated != true)
                return Results.Ok(new { isAuthenticated = false, username = (string?)null, role = (string?)null });

            return Results.Ok(new
            {
                isAuthenticated = true,
                username = user.Identity.Name,
                role = user.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Role)?.Value
            });
        });

        app.MapPost("/api/auth/login", async (
            ApplicationDbContext db,
            IPasswordHasher<User> hasher,
            HttpContext context,
            LoginRequest request) =>
        {
            var user = await db.Users.FirstOrDefaultAsync(u => u.Username == request.Username);
            if (user is null)
                return Results.Json(new { error = "Felaktigt användarnamn eller lösenord." }, statusCode: 401);

            var result = hasher.VerifyHashedPassword(user, user.PasswordHash, request.Password);
            if (result == PasswordVerificationResult.Failed)
                return Results.Json(new { error = "Felaktigt användarnamn eller lösenord." }, statusCode: 401);

            var claims = new List<Claim>
            {
                new(ClaimTypes.Name, user.Username),
                new(ClaimTypes.Role, user.Role),
            };
            var identity = new ClaimsIdentity(claims, "Cookies");
            var principal = new ClaimsPrincipal(identity);

            await context.SignInAsync("Cookies", principal);
            return Results.Ok(new { username = user.Username, role = user.Role });
        }).RequireRateLimiting("LoginLimit").DisableAntiforgery();

        app.MapPost("/api/auth/logout", async (HttpContext context) =>
        {
            await context.SignOutAsync("Cookies");
            return Results.Ok();
        }).RequireAuthorization();

        app.MapGet("/antiforgery/token", (IAntiforgery antiforgery, HttpContext context) =>
        {
            var tokens = antiforgery.GetAndStoreTokens(context);
            return Results.Ok(new { token = tokens.RequestToken });
        }).RequireAuthorization();

        // =========================
        // Character API
        // =========================

        app.MapGet("/api/characters/{id:int}", async (ApplicationDbContext db, int id) =>
        {
            var c = await db.Characters.FindAsync(id);
            return c is null ? Results.NotFound() : Results.Ok(c);
        });

        app.MapPost("/api/characters", async (ApplicationDbContext db, Character dto) =>
        {
            db.Characters.Add(dto);
            await db.SaveChangesAsync();
            return Results.Ok(new { id = dto.Id });
        }).RequireAuthorization("CanWrite");

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
        }).RequireAuthorization("CanWrite");

        // =========================
        // Rules API (stateless calculations — no auth required)
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

        app.MapGet("/api/characters/{id:int}/items", async (ApplicationDbContext db, int id) =>
        {
            var items = await db.InventoryItems
                .Where(x => x.CharacterId == id)
                .OrderBy(x => x.Id)
                .ToListAsync();

            return Results.Ok(items);
        });

        app.MapPost("/api/characters/{id:int}/items", async (ApplicationDbContext db, int id, InventoryItem dto) =>
        {
            dto.Id = 0;
            dto.CharacterId = id;

            db.InventoryItems.Add(dto);
            await db.SaveChangesAsync();

            return Results.Ok(new { id = dto.Id });
        }).RequireAuthorization("CanWrite");

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
        }).RequireAuthorization("CanWrite");

        app.MapDelete("/api/items/{itemId:int}", async (ApplicationDbContext db, int itemId) =>
        {
            var item = await db.InventoryItems.FindAsync(itemId);
            if (item is null) return Results.NotFound();

            db.InventoryItems.Remove(item);
            await db.SaveChangesAsync();
            return Results.NoContent();
        }).RequireAuthorization("CanWrite");

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
        }).RequireAuthorization("CanWrite");

        app.MapPut("/api/lardomar/{itemId:int}", async (ApplicationDbContext db, int itemId, Lardom dto) =>
        {
            var item = await db.Lardomar.FindAsync(itemId);
            if (item is null) return Results.NotFound();
            item.Namn = dto.Namn;
            item.Niva = dto.Niva;
            item.Beskrivning = dto.Beskrivning;
            await db.SaveChangesAsync();
            return Results.Ok();
        }).RequireAuthorization("CanWrite");

        app.MapDelete("/api/lardomar/{itemId:int}", async (ApplicationDbContext db, int itemId) =>
        {
            var item = await db.Lardomar.FindAsync(itemId);
            if (item is null) return Results.NotFound();
            db.Lardomar.Remove(item);
            await db.SaveChangesAsync();
            return Results.NoContent();
        }).RequireAuthorization("CanWrite");

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
        }).RequireAuthorization("CanWrite");

        app.MapPut("/api/evolutioner/{itemId:int}", async (ApplicationDbContext db, int itemId, Evolution dto) =>
        {
            var item = await db.Evolutioner.FindAsync(itemId);
            if (item is null) return Results.NotFound();
            item.Namn = dto.Namn;
            item.Niva = dto.Niva;
            item.Beskrivning = dto.Beskrivning;
            await db.SaveChangesAsync();
            return Results.Ok();
        }).RequireAuthorization("CanWrite");

        app.MapDelete("/api/evolutioner/{itemId:int}", async (ApplicationDbContext db, int itemId) =>
        {
            var item = await db.Evolutioner.FindAsync(itemId);
            if (item is null) return Results.NotFound();
            db.Evolutioner.Remove(item);
            await db.SaveChangesAsync();
            return Results.NoContent();
        }).RequireAuthorization("CanWrite");

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
        }).RequireAuthorization("CanWrite");

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
        }).RequireAuthorization("CanWrite");

        app.MapDelete("/api/pets/{petId:int}", async (ApplicationDbContext db, int petId) =>
        {
            var item = await db.Pets.FindAsync(petId);
            if (item is null) return Results.NotFound();
            db.Pets.Remove(item);
            await db.SaveChangesAsync();
            return Results.NoContent();
        }).RequireAuthorization("CanWrite");

        // =========================
        // Icons catalog API
        // =========================
        app.MapGet("/api/icons/catalog", (IWebHostEnvironment env) =>
        {
            var iconsRoot = Path.Combine(env.WebRootPath, "IconsItems");

            if (!Directory.Exists(iconsRoot))
                return Results.Ok(new { primaries = Array.Empty<object>() });

            var primaryLabels = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["Ammo"] = "Ammunition",
                ["Armour"] = "Rustning",
                ["Artefacts"] = "Artefakter",
                ["Clothes"] = "Kläder",
                ["Crystals"] = "Kristaller",
                ["Instrument"] = "Instrument",
                ["Jewelry"] = "Smycken",
                ["MeleeWeapons"] = "Närstridsvapen",
                ["Miscellaneous"] = "Diverse",
                ["RangedWeapons"] = "Distansvapen",
                ["ShamanItems"] = "Shamaningredienser",
                ["Shields"] = "Sköldar",
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
                    else pair.normal = url;

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
        app.MapGet("/api/pets/icons", (IWebHostEnvironment env) =>
        {
            var root = Path.Combine(env.WebRootPath, "IconsPets", "Pets");
            if (!Directory.Exists(root))
                return Results.Ok(new { icons = Array.Empty<object>() });

            var icons = Directory.EnumerateFiles(root, "*", SearchOption.TopDirectoryOnly)
                .Where(f => f.EndsWith(".svg", StringComparison.OrdinalIgnoreCase) ||
                            f.EndsWith(".png", StringComparison.OrdinalIgnoreCase))
                .Select(f => new { file = Path.GetFileName(f), url = $"/IconsPets/Pets/{Path.GetFileName(f)}" })
                .OrderBy(x => x.file)
                .ToList<object>();

            return Results.Ok(new { icons });
        });

        // =========================
        // Portrait API
        // =========================

        app.MapGet("/api/characters/{id:int}/portrait", (IWebHostEnvironment env, int id) =>
        {
            var dir = Path.Combine(env.WebRootPath, "portraits");
            if (!Directory.Exists(dir)) return Results.NotFound();
            var match = Directory.EnumerateFiles(dir, $"{id}.*").FirstOrDefault();
            return match is null
                ? Results.NotFound()
                : Results.Ok(new { url = $"/portraits/{Path.GetFileName(match)}" });
        });

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
        }).RequireAuthorization("CanWrite");

        app.MapRazorPages();

        app.Run();
    }
}
