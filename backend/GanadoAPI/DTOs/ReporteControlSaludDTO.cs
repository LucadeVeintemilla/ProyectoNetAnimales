using System;

namespace GanadoAPI.DTOs
{
    public class ReporteControlSaludDTO
    {
        public int Id { get; set; }
        public DateTime Fecha { get; set; }
        public string Tipo { get; set; } = null!;
        public string Veterinario { get; set; } = null!;
        public string Diagnostico { get; set; } = null!;
        public string Tratamiento { get; set; } = null!;
        public DateTime? FechaSiguienteControl { get; set; }
        public string Observaciones { get; set; } = null!;
    }
}
