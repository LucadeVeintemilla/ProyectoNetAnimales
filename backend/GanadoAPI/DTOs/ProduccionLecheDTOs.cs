using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace GanadoAPI.DTOs
{
    public class ProduccionLecheDTO
    {
        public int Id { get; set; }
        public int AnimalId { get; set; }
        public string NombreAnimal { get; set; } = null!;
        public string NumeroIdentificacion { get; set; } = null!;
        public DateTime Fecha { get; set; }
        public decimal CantidadLitros { get; set; }
        public string Turno { get; set; } = null!;
        public string? Observaciones { get; set; }
    }

    public class ProduccionLecheCreacionDTO
    {
        public int Id { get; set; }

        [Required(ErrorMessage = "El ID del animal es requerido")]
        public int AnimalId { get; set; }

        [Required(ErrorMessage = "La fecha es requerida")]
        public DateTime Fecha { get; set; }

        [Required(ErrorMessage = "La cantidad de litros es requerida")]
        [Range(0.1, 1000, ErrorMessage = "La cantidad de litros debe estar entre 0.1 y 1000")]
        public decimal CantidadLitros { get; set; }

        [Required(ErrorMessage = "El turno es requerido")]
        public string Turno { get; set; } = null!;

        public string? Observaciones { get; set; }
    }

    public class ProduccionDiaDTO
    {
        public DateTime Fecha { get; set; }
        public decimal TotalLitros { get; set; }
        public int CantidadRegistros { get; set; }
    }

    public class ProduccionAnimalDTO
    {
        public int AnimalId { get; set; }
        public string NumeroIdentificacion { get; set; } = null!;
        public string NombreAnimal { get; set; } = null!;
        public decimal TotalLitros { get; set; }
        public decimal PromedioDiario { get; set; }
    }

    public class ResumenProduccionDTO
    {
        public DateTime FechaInicio { get; set; }
        public DateTime FechaFin { get; set; }
        public int TotalDias { get; set; }
        public decimal TotalLitros { get; set; }
        public decimal PromedioDiario { get; set; }
    }
}
