using System;
using System.ComponentModel.DataAnnotations;

namespace GanadoAPI.DTOs
{
    public class OtroGastoDTO
    {
        public int Id { get; set; }
        
        [Required]
        public DateTime Fecha { get; set; }
        
        [Required]
        [StringLength(200, ErrorMessage = "El concepto no puede exceder los 200 caracteres")]
        public string Concepto { get; set; } = null!;
        
        [Required]
        [StringLength(100, ErrorMessage = "La categoría no puede exceder los 100 caracteres")]
        public string Categoria { get; set; } = null!;
        
        [Required]
        [Range(0.01, double.MaxValue, ErrorMessage = "El monto debe ser mayor a cero")]
        public decimal Monto { get; set; }
        
        [StringLength(500, ErrorMessage = "Las observaciones no pueden exceder los 500 caracteres")]
        public string? Observaciones { get; set; }
        
        public DateTime FechaCreacion { get; set; }
        public DateTime? FechaActualizacion { get; set; }
    }
    
    public class OtroGastoCreacionDTO
    {
        [Required]
        public DateTime Fecha { get; set; } = DateTime.Now;
        
        [Required]
        [StringLength(200, ErrorMessage = "El concepto no puede exceder los 200 caracteres")]
        public string Concepto { get; set; } = null!;
        
        [Required]
        [StringLength(100, ErrorMessage = "La categoría no puede exceder los 100 caracteres")]
        public string Categoria { get; set; } = null!;
        
        [Required]
        [Range(0.01, double.MaxValue, ErrorMessage = "El monto debe ser mayor a cero")]
        public decimal Monto { get; set; }
        
        [StringLength(500, ErrorMessage = "Las observaciones no pueden exceder los 500 caracteres")]
        public string? Observaciones { get; set; }
    }
}
