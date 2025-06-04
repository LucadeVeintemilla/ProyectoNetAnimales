using System;
using System.Collections.Generic;

namespace GanadoAPI.DTOs
{
    public class ProduccionPorRazaDTO
    {
        public int RazaId { get; set; }
        public string NombreRaza { get; set; } = null!;
        public int CantidadAnimales { get; set; }
        public decimal TotalLitros { get; set; }
        public decimal PromedioPorAnimal { get; set; }
    }

    public class TendenciaMensualDTO
    {
        public int Ano { get; set; }
        public int Mes { get; set; }
        public string NombreMes { get; set; } = null!;
        public decimal TotalLitros { get; set; }
        public decimal PromedioDiario { get; set; }
        public int DiasProduccion { get; set; }
    }

    public class ComparativaAnimalesDTO
    {
        public int AnimalId { get; set; }
        public string NombreAnimal { get; set; } = null!;
        public string NumeroIdentificacion { get; set; } = null!;
        public Dictionary<string, decimal> ProduccionPorPeriodo { get; set; } = new Dictionary<string, decimal>();
        public decimal PromedioGeneral { get; set; }
    }

    public class AnomaliaProduccionDTO
    {
        public int AnimalId { get; set; }
        public string NombreAnimal { get; set; } = null!;
        public string NumeroIdentificacion { get; set; } = null!;
        public DateTime Fecha { get; set; }
        public decimal CantidadLitros { get; set; }
        public decimal DesviacionEstandar { get; set; }
        public string TipoAnomalia { get; set; } = null!; // "Baja" o "Alta" producción
    }
}
