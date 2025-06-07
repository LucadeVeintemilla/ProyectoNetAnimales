using System;

namespace GanadoAPI.DTOs
{
    public class ReporteEventoReproductivoDTO
    {
        public int Id { get; set; }
        public DateTime FechaServicio { get; set; }
        public DateTime? FechaPreñez { get; set; }
        public DateTime? FechaProbableParto { get; set; }
        public DateTime? FechaRealParto { get; set; }
        public string TipoServicio { get; set; } = null!;
        public string Estado { get; set; } = null!;
        public int MadreId { get; set; }
        public string MadreNumeroIdentificacion { get; set; } = null!;
        public string MadreNombre { get; set; } = null!;
        public int PadreId { get; set; }
        public string PadreNumeroIdentificacion { get; set; } = null!;
        public string PadreNombre { get; set; } = null!;
        public string Observaciones { get; set; } = null!;
    }
}
