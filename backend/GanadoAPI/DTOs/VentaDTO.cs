using System;
using System.ComponentModel.DataAnnotations;

namespace GanadoAPI.DTOs
{
    public class VentaDTO
    {
        public int Id { get; set; }
        
        [Required]
        public DateTime FechaVenta { get; set; }
        
        [Required]
        public int AnimalId { get; set; }
        
        public string? AnimalNombre { get; set; }
        public string? AnimalIdentificacion { get; set; }
        
        [Required]
        [Range(0.01, double.MaxValue, ErrorMessage = "El precio debe ser mayor a cero")]
        public decimal Precio { get; set; }
        
        [StringLength(500, ErrorMessage = "Las observaciones no pueden exceder los 500 caracteres")]
        public string? Observaciones { get; set; }
        
        public DateTime FechaCreacion { get; set; }
        public DateTime? FechaActualizacion { get; set; }
    }
    
    public class VentaCreacionDTO
    {
        [Required]
        public DateTime FechaVenta { get; set; } = DateTime.Now;
        
        [Required]
        public int AnimalId { get; set; }
        
        [Required]
        [Range(0.01, double.MaxValue, ErrorMessage = "El precio debe ser mayor a cero")]
        public decimal Precio { get; set; }
        
        [StringLength(500, ErrorMessage = "Las observaciones no pueden exceder los 500 caracteres")]
        public string? Observaciones { get; set; }
    }
}
