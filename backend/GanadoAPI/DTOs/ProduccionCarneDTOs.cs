using System;
using System.ComponentModel.DataAnnotations;

namespace GanadoAPI.DTOs
{
    public class ProduccionCarneDTO
    {
        public int Id { get; set; }
        public int AnimalId { get; set; }
        public string NombreAnimal { get; set; } = null!;
        public string NumeroIdentificacion { get; set; } = null!;
        public DateTime FechaSacrificio { get; set; }
        public decimal PesoVivo { get; set; }
        public decimal PesoCanal { get; set; }
        public decimal RendimientoCarnico { get; set; }
        public string? Observaciones { get; set; }
        public string Destino { get; set; } = null!;
    }

    public class ProduccionCarneCreacionDTO
    {
        [Required(ErrorMessage = "El ID del animal es requerido")]
        public int AnimalId { get; set; }

        [Required(ErrorMessage = "La fecha de sacrificio es requerida")]
        public DateTime FechaSacrificio { get; set; }

        [Required(ErrorMessage = "El peso vivo es requerido")]
        [Range(1, 3000, ErrorMessage = "El peso vivo debe estar entre 1 y 3000 kg")]
        public decimal PesoVivo { get; set; }

        [Required(ErrorMessage = "El peso canal es requerido")]
        [Range(0.1, 2000, ErrorMessage = "El peso canal debe estar entre 0.1 y 2000 kg")]
        public decimal PesoCanal { get; set; }

        [Required(ErrorMessage = "El destino es requerido")]
        public string Destino { get; set; } = null!;

        public string? Observaciones { get; set; }
    }

    public class ResumenProduccionCarneDTO
    {
        public DateTime FechaInicio { get; set; }
        public DateTime FechaFin { get; set; }
        public int TotalAnimales { get; set; }
        public decimal TotalPesoVivo { get; set; }
        public decimal TotalPesoCanal { get; set; }
        public decimal PromedioRendimiento { get; set; }
    }
}
