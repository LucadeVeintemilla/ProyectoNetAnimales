using System.ComponentModel.DataAnnotations;

namespace GanadoAPI.DTOs
{
    public class RazaDTO
    {
        public int Id { get; set; }
        public string Nombre { get; set; } = null!;
        public string Descripcion { get; set; } = null!;
    }

    public class RazaCreacionDTO
    {
        [Required]
        public string Nombre { get; set; } = null!;
        [Required]
        public string Descripcion { get; set; } = null!;
    }

    public class RazaConAnimalesDTO
    {
        public int Id { get; set; }
        public string Nombre { get; set; } = null!;
        public string Descripcion { get; set; } = null!;
        public List<AnimalDTO> Animales { get; set; } = new List<AnimalDTO>();
    }
} 