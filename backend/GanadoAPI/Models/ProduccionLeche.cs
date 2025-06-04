using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GanadoAPI.Models
{
    public class ProduccionLeche
    {
        [Key]
        public int Id { get; set; }
        
        [Required]
        public int AnimalId { get; set; }
        [ForeignKey("AnimalId")]
        public virtual Animal? Animal { get; set; }
        
        [Required]
        [Column(TypeName = "date")]
        public DateTime Fecha { get; set; }
        
        [Required]
        [Column(TypeName = "decimal(10,2)")]
        public decimal CantidadLitros { get; set; }
        
        [StringLength(10)]
        public string? Turno { get; set; } // Mañana, Tarde, Noche
        
        [StringLength(500)]
        public string? Observaciones { get; set; }
    }
}
