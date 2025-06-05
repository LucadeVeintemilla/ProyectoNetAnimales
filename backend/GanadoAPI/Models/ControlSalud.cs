using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GanadoAPI.Models
{
    public class ControlSalud
    {
        [Key]
        public int Id { get; set; }
        
        [Required]
        public int AnimalId { get; set; }
        [ForeignKey("AnimalId")]
        public virtual Animal? Animal { get; set; }
        
        [Required]
        public DateTime Fecha { get; set; }
        
        [Required]
        [StringLength(100)]
        public string? TipoControl { get; set; } // Vacunación, Desparasitación, Enfermedad, etc.
        
        [StringLength(200)]
        public string? Descripcion { get; set; }
        
        [StringLength(200)]
        public string? Diagnostico { get; set; }
        
        [StringLength(200)]
        public string? Medicamento { get; set; }
        
        [StringLength(50)]
        public string? Dosis { get; set; }
        
        public DateTime? ProximoControl { get; set; }
        
        [StringLength(500)]
        public string? Observaciones { get; set; }
        
        [StringLength(100)]
        public string? Veterinario { get; set; }
        
        [StringLength(50)]
        public string? Estado { get; set; } // Completado, Pendiente, Atrasado, Cancelado
    }
}
