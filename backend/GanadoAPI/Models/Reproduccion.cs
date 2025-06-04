using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GanadoAPI.Models
{
    public class Reproduccion
    {
        [Key]
        public int Id { get; set; }
        
        [Required]
        public int HembraId { get; set; }
        [ForeignKey("HembraId")]
        public virtual Animal? Hembra { get; set; }
        
        public int? MachoId { get; set; }
        [ForeignKey("MachoId")]
        public virtual Animal? Macho { get; set; }
        
        [StringLength(50)]
        public string? TipoMonta { get; set; } // Natural, Inseminación Artificial, etc.
        
        public DateTime? FechaMonta { get; set; }
        
        public DateTime? FechaConfirmacionPrenez { get; set; }
        
        public DateTime? FechaProbableParto { get; set; }
        
        public DateTime? FechaRealParto { get; set; }
        
        [StringLength(50)]
        public string? Resultado { get; set; } // Preñada, No preñada, Aborto, etc.
        
        [StringLength(500)]
        public string? Observaciones { get; set; }
        
        // Propiedad para los crías nacidas
        public virtual ICollection<Animal> Crias { get; set; } = new List<Animal>();
    }
}
