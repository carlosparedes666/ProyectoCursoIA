using Microsoft.EntityFrameworkCore;
using ProyectoCursoIA.Models;

namespace ProyectoCursoIA.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<TblPrueba> TblPruebas => Set<TblPrueba>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<TblPrueba>(entity =>
        {
            entity.ToTable("tblPruebas");

            entity.HasKey(e => e.ID);

            entity.Property(e => e.ID)
                .ValueGeneratedOnAdd();

            entity.Property(e => e.Fecha)
                .HasColumnType("datetime")
                .HasDefaultValueSql("GETDATE()");

            entity.Property(e => e.NumeroCel)
                .HasMaxLength(10)
                .IsUnicode(false);
        });
    }
}
