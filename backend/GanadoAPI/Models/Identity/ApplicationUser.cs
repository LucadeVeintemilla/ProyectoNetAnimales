using Microsoft.AspNetCore.Identity;

namespace GanadoAPI.Models.Identity
{
    public class ApplicationUser : IdentityUser
    {
        // Propiedades adicionales para el usuario
        public string? NombreCompleto { get; set; }
        public bool Activo { get; set; } = true;
        public DateTime FechaRegistro { get; set; } = DateTime.UtcNow;
        public DateTime? UltimoAcceso { get; set; }
    }
}
