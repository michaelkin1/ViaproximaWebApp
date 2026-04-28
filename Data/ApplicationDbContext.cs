using Microsoft.EntityFrameworkCore;

namespace Viaproxima.Web.Data;

// EF Core DbContext = your app�s �DB session�.
// Used to query/save data, and to generate/apply migrations.
public class ApplicationDbContext : DbContext
{
    // Config is injected from Program.cs (provider + connection string, e.g. SQLite app.db).
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options) { }

    // DbSet<T> tells EF �this entity should be a table� and is how you query/update rows.
    public DbSet<Character> Characters => Set<Character>();
    public DbSet<InventoryItem> InventoryItems => Set<InventoryItem>();
    public DbSet<Lardom> Lardomar => Set<Lardom>();
    public DbSet<Evolution> Evolutioner => Set<Evolution>();
    public DbSet<Pet> Pets => Set<Pet>();
    public DbSet<User> Users => Set<User>();
    public DbSet<Adventure> Adventures => Set<Adventure>();
    public DbSet<Chapter> Chapters => Set<Chapter>();
    public DbSet<ImageLink> ImageLinks => Set<ImageLink>();
    public DbSet<CharacterGroup> CharacterGroups => Set<CharacterGroup>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.Entity<User>()
            .HasIndex(u => u.Username)
            .IsUnique();

        modelBuilder.Entity<Chapter>()
            .HasOne(c => c.Adventure)
            .WithMany(a => a.Chapters)
            .HasForeignKey(c => c.AdventureId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<ImageLink>()
            .HasOne(il => il.Chapter)
            .WithMany(c => c.ImageLinks)
            .HasForeignKey(il => il.ChapterId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Character>()
            .HasOne(c => c.Group)
            .WithMany(g => g.Characters)
            .HasForeignKey(c => c.GroupId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}