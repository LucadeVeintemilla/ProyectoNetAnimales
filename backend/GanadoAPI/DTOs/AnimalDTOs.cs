using System.ComponentModel.DataAnnotations;

namespace GanadoAPI.DTOs
{
    public class AnimalDTO
    {
        public int Id { get; set; }
        public string NumeroIdentificacion { get; set; } = null!;
        public string Nombre { get; set; } = null!;
        public DateTime FechaNacimiento { get; set; }
        public string Sexo { get; set; } = null!; // M: Macho, H: Hembra
        public string Estado { get; set; } = null!;
        public string? Categoria { get; set; }
        public string? TipoAdquisicion { get; set; }
        public string? Ubicacion { get; set; }
        public int? RazaId { get; set; }
        public string? RazaNombre { get; set; }
        public int? PadreId { get; set; }
        public int? MadreId { get; set; }
        public string? Observaciones { get; set; }
        public bool Activo { get; set; }
        public DateTime FechaCreacion { get; set; }
        public DateTime? FechaActualizacion { get; set; }
    }

    public class AnimalCreacionDTO
    {
        [Required]
        public string Nombre { get; set; } = null!;
        [Required]
        public string NumeroIdentificacion { get; set; } = null!;
        [Required]
        public DateTime FechaNacimiento { get; set; }
        [Required]
        public string Sexo { get; set; } = null!;
        [Required]
        public string Estado { get; set; } = null!;
        [Required]
        public int RazaId { get; set; }
        public int? PadreId { get; set; }
        public int? MadreId { get; set; }
        public string? Observaciones { get; set; }
        public int? ReproduccionId { get; set; }
        public string? TipoAdquisicion { get; set; }
        public string? Ubicacion { get; set; }
    }

    public class AnimalDetalleDTO
    {
        public int Id { get; set; }
        public string Nombre { get; set; } = null!;
        public string NumeroIdentificacion { get; set; } = null!;
        public DateTime FechaNacimiento { get; set; }
        public string Sexo { get; set; } = null!;
        public string Estado { get; set; } = null!;
        public string? Categoria { get; set; }
        public string? TipoAdquisicion { get; set; }
        public string? Ubicacion { get; set; }
        public string Raza { get; set; } = null!;
        public int? PadreId { get; set; }
        public int? MadreId { get; set; }
        public string? Observaciones { get; set; }
        public bool Activo { get; set; }
    }

    public class AnimalActualizacionDTO
    {
        [Required]
        public int Id { get; set; }
        [Required]
        public string Nombre { get; set; } = null!;
        [Required]
        public string NumeroIdentificacion { get; set; } = null!;
        [Required]
        public DateTime FechaNacimiento { get; set; }
        [Required]
        public string Sexo { get; set; } = null!;
        [Required]
        public string Estado { get; set; } = null!;
        [Required]
        public int RazaId { get; set; }
        public int? PadreId { get; set; }
        public int? MadreId { get; set; }
        public string? Observaciones { get; set; }
        public bool Activo { get; set; }
        public string? TipoAdquisicion { get; set; }
        public string? Ubicacion { get; set; }
    }
}
 