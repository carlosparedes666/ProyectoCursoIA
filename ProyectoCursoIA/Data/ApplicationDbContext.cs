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
    public DbSet<Usuario> Usuarios => Set<Usuario>();
    public DbSet<Medico> Medicos => Set<Medico>();
    public DbSet<Paciente> Pacientes => Set<Paciente>();
    public DbSet<Consulta> Consultas => Set<Consulta>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.Entity<TblPrueba>(entity =>
        {
            entity.ToTable("tblPruebas");
            entity.HasKey(e => e.Id);

            entity.Property(e => e.Id)
                .HasColumnName("ID")
                .ValueGeneratedOnAdd();

            entity.Property(e => e.Fecha)
                .HasColumnType("datetime2")
                .ValueGeneratedOnAdd()
                .HasDefaultValueSql("GETDATE()");

            entity.Property(e => e.NumeroCel)
                .HasMaxLength(10);
        });

        modelBuilder.Entity<Usuario>(entity =>
        {
            entity.ToTable("Usuario");
            entity.HasKey(e => e.Id);

            entity.Property(e => e.Id)
                .HasColumnName("id")
                .ValueGeneratedOnAdd();

            entity.Property(e => e.Correo)
                .HasColumnName("correo")
                .HasMaxLength(50)
                .IsRequired();

            entity.Property(e => e.Password)
                .HasColumnName("password")
                .HasMaxLength(50)
                .IsRequired();

            entity.Property(e => e.NombreCompleto)
                .HasColumnName("nombre_completo")
                .HasMaxLength(50)
                .IsRequired();

            entity.Property(e => e.IdMedico)
                .HasColumnName("id_medico");

            entity.Property(e => e.Activo)
                .HasColumnName("activo")
                .HasColumnType("bit")
                .HasDefaultValue(true);

            entity.Property(e => e.FechaCreacion)
                .HasColumnName("fecha_creacion")
                .HasColumnType("datetime2")
                .HasDefaultValueSql("GETDATE()");

            entity.HasOne(e => e.Medico)
                .WithMany(m => m.Usuarios)
                .HasForeignKey(e => e.IdMedico)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("FK_Usuario_Medicos_id_medico");
        });

        modelBuilder.Entity<Medico>(entity =>
        {
            entity.ToTable("Medicos");
            entity.HasKey(e => e.Id);

            entity.Property(e => e.Id)
                .HasColumnName("id")
                .ValueGeneratedOnAdd();

            entity.Property(e => e.PrimerNombre)
                .HasColumnName("primer_nombre")
                .HasMaxLength(50)
                .IsRequired();

            entity.Property(e => e.SegundoNombre)
                .HasMaxLength(50)
                .HasColumnName("segundo_nombre");

            entity.Property(e => e.ApellidoPaterno)
                .HasColumnName("apellido_paterno")
                .HasMaxLength(50)
                .IsRequired();

            entity.Property(e => e.ApellidoMaterno)
                .HasColumnName("apellido_materno")
                .HasMaxLength(50);

            entity.Property(e => e.Cedula)
                .HasColumnName("cedula")
                .HasMaxLength(50)
                .IsRequired();

            entity.Property(e => e.Telefono)
                .HasColumnName("telefono")
                .HasColumnType("bigint");

            entity.Property(e => e.Especialidad)
                .HasColumnName("especialidad")
                .HasMaxLength(50)
                .IsRequired();

            entity.Property(e => e.Email)
                .HasColumnName("email")
                .HasMaxLength(50)
                .IsRequired();

            entity.Property(e => e.Activo)
                .HasColumnName("activo")
                .HasColumnType("bit")
                .HasDefaultValue(true);

            entity.Property(e => e.FechaCreacion)
                .HasColumnName("fecha_creacion")
                .HasColumnType("datetime2")
                .HasDefaultValueSql("GETDATE()");
        });

        modelBuilder.Entity<Paciente>(entity =>
        {
            entity.ToTable("Paciente");
            entity.HasKey(e => e.Id);

            entity.Property(e => e.Id)
                .HasColumnName("id")
                .ValueGeneratedOnAdd();

            entity.Property(e => e.PrimerNombre)
                .HasColumnName("primer_nombre")
                .HasMaxLength(50)
                .IsRequired();

            entity.Property(e => e.SegundoNombre)
                .HasColumnName("segundo_nombre")
                .HasMaxLength(50);

            entity.Property(e => e.ApellidoPaterno)
                .HasColumnName("apellido_paterno")
                .HasMaxLength(50)
                .IsRequired();

            entity.Property(e => e.ApellidoMaterno)
                .HasColumnName("apellido_materno")
                .HasMaxLength(50);

            entity.Property(e => e.Telefono)
                .HasColumnName("telefono")
                .HasMaxLength(50)
                .IsRequired();

            entity.Property(e => e.Activo)
                .HasColumnName("activo")
                .HasColumnType("bit")
                .HasDefaultValue(true);

            entity.Property(e => e.FechaCreacion)
                .HasColumnName("fecha_creacion")
                .HasColumnType("datetime2")
                .HasDefaultValueSql("GETDATE()");
        });

        modelBuilder.Entity<Consulta>(entity =>
        {
            entity.ToTable("Consulta");
            entity.HasKey(e => e.Id);

            entity.Property(e => e.Id)
                .HasColumnName("id")
                .ValueGeneratedOnAdd();

            entity.Property(e => e.IdMedico)
                .HasColumnName("id_medico");

            entity.Property(e => e.IdPaciente)
                .HasColumnName("id_paciente");

            entity.Property(e => e.Sintomas)
                .HasColumnName("sintomas")
                .HasMaxLength(50)
                .IsRequired();

            entity.Property(e => e.Recomendaciones)
                .HasColumnName("recomendaciones")
                .HasMaxLength(50);

            entity.Property(e => e.Diagnostico)
                .HasColumnName("diagnostico")
                .HasMaxLength(50);

            entity.Property(e => e.FechaCreacion)
                .HasColumnName("fecha_creacion")
                .HasColumnType("datetime2")
                .HasDefaultValueSql("GETDATE()");

            entity.HasOne(e => e.Medico)
                .WithMany(m => m.Consultas)
                .HasForeignKey(e => e.IdMedico)
                .OnDelete(DeleteBehavior.Cascade)
                .HasConstraintName("FK_Consulta_Medicos_id_medico");

            entity.HasOne(e => e.Paciente)
                .WithMany(p => p.Consultas)
                .HasForeignKey(e => e.IdPaciente)
                .OnDelete(DeleteBehavior.Cascade)
                .HasConstraintName("FK_Consulta_Paciente_id_paciente");
        });
    }
}
