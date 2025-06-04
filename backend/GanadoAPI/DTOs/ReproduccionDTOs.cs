using System.ComponentModel.DataAnnotations;

namespace GanadoAPI.DTOs
{
    public class ReproduccionDTO
    {
        public int Id { get; set; }
        public DateTime Fecha { get; set; }
        public string TipoEvento { get; set; } = null!;
        public string Resultado { get; set; } = null!;
        public string HembraNombre { get; set; } = null!;
        public string HembraIdentificacion { get; set; } = null!;
        public string? MachoNombre { get; set; }
        public string? MachoIdentificacion { get; set; }
    }

    public class ReproduccionCreacionDTO
    {
        [Required]
        public DateTime Fecha { get; set; }
        [Required]
        public string TipoEvento { get; set; } = null!;
        [Required]
        public string Resultado { get; set; } = null!;
        [Required]
        public int HembraId { get; set; }
        public int? MachoId { get; set; }
    }
} 