using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GanadoAPI.Models
{
    public class Animal
    {
        [Key]
        public int Id { get; set; }
        
        [Required]
        [StringLength(50)]
        public string? NumeroIdentificacion { get; set; } // Número de arete o identificación única
        
        [Required]
        [StringLength(100)]
        public string? Nombre { get; set; }
        
        [Required]
        public DateTime FechaNacimiento { get; set; }
        
        [Required]
        [StringLength(10)]
        public string? Sexo { get; set; } // M: Macho, H: Hembra
        
        [Required]
        [StringLength(50)]
        public string? Estado { get; set; } // Estado del animal (Activo, Vendido, Muerto, etc.)
        
        public int? RazaId { get; set; }
        [ForeignKey("RazaId")]
        public virtual Raza? Raza { get; set; }
        
        public int? PadreId { get; set; }
        [ForeignKey("PadreId")]
        public virtual Animal? Padre { get; set; }
        
        public int? MadreId { get; set; }
        [ForeignKey("MadreId")]
        public virtual Animal? Madre { get; set; }
        
        [StringLength(500)]
        public string? Observaciones { get; set; }
        
        public bool Activo { get; set; } = true;
        
        // Propiedades de navegación
        public virtual ICollection<ProduccionLeche> ProduccionesLeche { get; set; } = new List<ProduccionLeche>();
        public virtual ICollection<ControlSalud> ControlesSalud { get; set; } = new List<ControlSalud>();
        
        public virtual ICollection<ProduccionCarne> ProduccionesCarne { get; set; } = new List<ProduccionCarne>();
        
        // Reproducciones donde este animal es la hembra
        public virtual ICollection<Reproduccion> ReproduccionesComoHembra { get; set; } = new List<Reproduccion>();
        
        // Reproducciones donde este animal es el macho
        public virtual ICollection<Reproduccion> ReproduccionesComoMacho { get; set; } = new List<Reproduccion>();
        
        // Todas las reproducciones relacionadas con este animal (solo para consulta, no mapeado)
        [NotMapped]
        public ICollection<Reproduccion> Reproducciones => 
            ReproduccionesComoHembra.Union(ReproduccionesComoMacho).ToList();
            
        public virtual ICollection<RegistroAlimentacion> RegistrosAlimentacion { get; set; } = new List<RegistroAlimentacion>();
        public virtual ICollection<GastoSalud> GastosSalud { get; set; } = new List<GastoSalud>();
        public virtual ICollection<Venta> Ventas { get; set; } = new List<Venta>();
        
        // Evento de reproducción en el que nació este animal
        public int? ReproduccionId { get; set; }
        [ForeignKey("ReproduccionId")]
        public virtual Reproduccion? ReproduccionDeNacimiento { get; set; }
    }
}
