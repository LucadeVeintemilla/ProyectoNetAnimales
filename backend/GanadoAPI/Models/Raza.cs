using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GanadoAPI.Models
{
    public class Raza
    {
        [Key]
        public int Id { get; set; }
        
        [Required]
        [StringLength(100)]
        public string? Nombre { get; set; }
        
        [StringLength(500)]
        public string? Descripcion { get; set; }
        
        // Propiedades de navegación
        public virtual ICollection<Animal> Animales { get; set; } = new List<Animal>();
    }
}
