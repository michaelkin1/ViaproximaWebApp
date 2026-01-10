using Microsoft.EntityFrameworkCore;

namespace Viaproxima.Web.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options) { }

    public DbSet<Character> Characters => Set<Character>();

    public DbSet<InventoryItem> InventoryItems => Set<InventoryItem>();
}

