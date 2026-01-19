using Microsoft.EntityFrameworkCore;

namespace Viaproxima.Web.Data;

// EF Core DbContext = your app’s “DB session”.
// Used to query/save data, and to generate/apply migrations.
public class ApplicationDbContext : DbContext
{
    // Config is injected from Program.cs (provider + connection string, e.g. SQLite app.db).
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options) { }

    // DbSet<T> tells EF “this entity should be a table” and is how you query/update rows.
    public DbSet<Character> Characters => Set<Character>();
    public DbSet<InventoryItem> InventoryItems => Set<InventoryItem>();
}