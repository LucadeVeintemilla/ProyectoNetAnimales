using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GanadoAPI.Models
{
    public class ProduccionCarne
    {
        [Key]
        public int Id { get; set; }
        
        [Required]
        public int AnimalId { get; set; }
        [ForeignKey("AnimalId")]
        public virtual Animal? Animal { get; set; }
        
        [Required]
        [Column(TypeName = "date")]
        public DateTime FechaSacrificio { get; set; }
        
        [Required]
        [Column(TypeName = "decimal(10,2)")]
        public decimal PesoVivo { get; set; }
        
        [Required]
        [Column(TypeName = "decimal(10,2)")]
        public decimal PesoCanal { get; set; }
        
        [Column(TypeName = "decimal(5,2)")]
        public decimal RendimientoCarnico { get; set; } // Calculado: (PesoCanal / PesoVivo) * 100
        
        [StringLength(500)]
        public string? Observaciones { get; set; }
        
        [Required]
        [StringLength(100)]
        public string? Destino { get; set; } // A quién se vendió, planta, etc.
    }
}
