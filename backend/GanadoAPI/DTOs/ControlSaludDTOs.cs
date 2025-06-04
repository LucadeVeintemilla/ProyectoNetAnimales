using System.ComponentModel.DataAnnotations;

namespace GanadoAPI.DTOs
{
    public class ControlSaludDTO
    {
        public int Id { get; set; }
        public DateTime Fecha { get; set; }
        public string TipoControl { get; set; } = null!;
        public string Diagnostico { get; set; } = null!;
        public string Tratamiento { get; set; } = null!;
        public decimal Costo { get; set; }
        public string AnimalNombre { get; set; } = null!;
        public string AnimalIdentificacion { get; set; } = null!;
    }

    public class ControlSaludCreacionDTO
    {
        [Required]
        public DateTime Fecha { get; set; }
        [Required]
        public string TipoControl { get; set; } = null!;
        [Required]
        public string Diagnostico { get; set; } = null!;
        [Required]
        public string Tratamiento { get; set; } = null!;
        [Required]
        public decimal Costo { get; set; }
        [Required]
        public int AnimalId { get; set; }
    }
} 