using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace Viaproxima.Web.Data;

public static class AdminSeeder
{
    public static async Task TrySeedFromArgsAsync(string[] args, IServiceProvider services)
    {
        if (!args.Contains("--seed-admin")) return;

        using var scope = services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var config = scope.ServiceProvider.GetRequiredService<IConfiguration>();
        var hasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher<User>>();

        if (await db.Users.AnyAsync()) return;

        var username = config["SeedAdmin:Username"];
        var password = config["SeedAdmin:Password"];

        if (string.IsNullOrWhiteSpace(username) || string.IsNullOrWhiteSpace(password))
            throw new InvalidOperationException("SeedAdmin:Username and SeedAdmin:Password must be set in appsettings.Secrets.json.");

        var user = new User { Username = username, Role = "Admin" };
        user.PasswordHash = hasher.HashPassword(user, password);

        db.Users.Add(user);
        await db.SaveChangesAsync();

        Console.WriteLine($"[Seed] Admin user '{username}' created.");
    }
}
