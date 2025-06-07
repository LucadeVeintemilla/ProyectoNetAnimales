using System;

namespace GanadoAPI.DTOs
{
    public class ReporteProduccionCarneDTO
    {
        public int Id { get; set; }
        public DateTime Fecha { get; set; }
        public decimal Peso { get; set; }
        public string Observaciones { get; set; } = null!;
    }
}
