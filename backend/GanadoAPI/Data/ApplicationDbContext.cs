using Microsoft.EntityFrameworkCore;
using GanadoAPI.Models;
using GanadoAPI.Models.Identity;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;

namespace GanadoAPI.Data
{
    public class ApplicationDbContext : IdentityDbContext<ApplicationUser, IdentityRole, string>
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        public DbSet<Animal> Animales { get; set; } = null!;
        public DbSet<Raza> Razas { get; set; } = null!;
        public DbSet<ProduccionLeche> ProduccionesLeche { get; set; } = null!;
        public DbSet<ProduccionCarne> ProduccionesCarne { get; set; } = null!;
        public DbSet<ControlSalud> ControlesSalud { get; set; } = null!;
        public DbSet<Reproduccion> Reproducciones { get; set; } = null!;
        public DbSet<Venta> Ventas { get; set; } = null!;
        public DbSet<RegistroAlimentacion> RegistroAlimentacion { get; set; } = null!;
        public DbSet<GastoSalud> GastosSalud { get; set; } = null!;
        public DbSet<OtroGasto> OtrosGastos { get; set; } = null!;

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
            
            // Configuración de Identity
            modelBuilder.Entity<ApplicationUser>(b =>
            {
                b.ToTable("Usuarios"); // Opcional: Cambia el nombre de la tabla
            });
            
            // Configuración de esquema
            foreach (var entity in modelBuilder.Model.GetEntityTypes())
            {
                // Elimina el prefijo 'AspNet' de los nombres de las tablas
                if (entity.GetTableName().StartsWith("AspNet"))
                {
                    entity.SetTableName(entity.GetTableName().Substring(6));
                }
            }

            // Configuraciones adicionales para las relaciones
            
            // Configuración para la relación Animal - ProduccionLeche
            modelBuilder.Entity<Animal>()
                .HasMany(a => a.ProduccionesLeche)
                .WithOne(p => p.Animal!)
                .HasForeignKey(p => p.AnimalId)
                .OnDelete(DeleteBehavior.Cascade);

            // Configuración para la relación Animal - ControlSalud
            modelBuilder.Entity<Animal>()
                .HasMany(a => a.ControlesSalud)
                .WithOne(c => c.Animal!)
                .HasForeignKey(c => c.AnimalId)
                .OnDelete(DeleteBehavior.Cascade);

            // Configuración para la relación Animal - Reproduccion (Hembra)
            modelBuilder.Entity<Reproduccion>()
                .HasOne(r => r.Hembra)
                .WithMany(a => a.ReproduccionesComoHembra)
                .HasForeignKey(r => r.HembraId)
                .OnDelete(DeleteBehavior.Restrict);

            // Configuración para la relación Animal - Reproduccion (Macho)
            modelBuilder.Entity<Reproduccion>()
                .HasOne(r => r.Macho)
                .WithMany(a => a.ReproduccionesComoMacho)
                .HasForeignKey(r => r.MachoId)
                .OnDelete(DeleteBehavior.Restrict);

            // Configuración para la relación Raza - Animal
            modelBuilder.Entity<Raza>()
                .HasMany(r => r.Animales)
                .WithOne(a => a.Raza!)
                .HasForeignKey(a => a.RazaId)
                .OnDelete(DeleteBehavior.Restrict);

            // Configuración para la relación Animal - Crias (Padre/Madre)
            modelBuilder.Entity<Animal>()
                .HasOne(a => a.Padre)
                .WithMany()
                .HasForeignKey(a => a.PadreId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Animal>()
                .HasOne(a => a.Madre)
                .WithMany()
                .HasForeignKey(a => a.MadreId)
                .OnDelete(DeleteBehavior.Restrict);

            // Configuración para la relación Animal - RegistroAlimentacion
            modelBuilder.Entity<Animal>()
                .HasMany(a => a.RegistrosAlimentacion)
                .WithOne(ra => ra.Animal!)
                .HasForeignKey(ra => ra.AnimalId)
                .OnDelete(DeleteBehavior.Cascade);

            // Configuración para la relación Animal - GastoSalud
            modelBuilder.Entity<Animal>()
                .HasMany(a => a.GastosSalud)
                .WithOne(gs => gs.Animal!)
                .HasForeignKey(gs => gs.AnimalId)
                .OnDelete(DeleteBehavior.Cascade);

            // Configuración para la relación Animal - Venta
            modelBuilder.Entity<Animal>()
                .HasMany(a => a.Ventas)
                .WithOne(v => v.Animal!)
                .HasForeignKey(v => v.AnimalId)
                .OnDelete(DeleteBehavior.Cascade);
                
            // Configuración para la relación Animal - ProduccionCarne
            modelBuilder.Entity<Animal>()
                .HasMany(a => a.ProduccionesCarne)
                .WithOne(pc => pc.Animal!)
                .HasForeignKey(pc => pc.AnimalId)
                .OnDelete(DeleteBehavior.Cascade);

            // Configuración de índices para mejorar el rendimiento de consultas comunes
            modelBuilder.Entity<RegistroAlimentacion>()
                .HasIndex(ra => ra.Fecha);
                
            modelBuilder.Entity<GastoSalud>()
                .HasIndex(gs => gs.Fecha);
                
            modelBuilder.Entity<Venta>()
                .HasIndex(v => v.FechaVenta);
                
            modelBuilder.Entity<OtroGasto>()
                .HasIndex(og => og.Fecha);
        }
    }
}
