using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GanadoAPI.Models
{
    public class OtroGasto
    {
        [Key]
        public int Id { get; set; }
        
        [Required]
        public DateTime Fecha { get; set; }
        
        [Required]
        [MaxLength(200)]
        public string Concepto { get; set; } = null!;
        
        [Required]
        [MaxLength(100)]
        public string Categoria { get; set; } = null!;
        
        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal Monto { get; set; }
        
        [MaxLength(500)]
        public string? Observaciones { get; set; }
        
        public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;
        public DateTime? FechaActualizacion { get; set; }
    }
}
