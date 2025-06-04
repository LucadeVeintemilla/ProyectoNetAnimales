using GanadoAPI.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace GanadoAPI.Data
{
    public class DbInitializer
    {
        private readonly ApplicationDbContext _context;

        public DbInitializer(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task Initialize()
        {
            // Verificar si ya existen razas
            if (await _context.Razas.AnyAsync())
            {
                return; // La base de datos ya ha sido sembrada
            }

            // Crear las razas
            var razas = new Raza[]
            {
                new Raza { 
                    Nombre = "Holstein", 
                    Descripcion = "Raza lechera de origen holandés, reconocida por su patrón de color blanco y negro.",
                    
                },
                new Raza { 
                    Nombre = "Jersey", 
                    Descripcion = "Raza lechera de tamaño mediano, conocida por la alta calidad de su leche con mayor contenido de grasa.",
                   
                },
                new Raza { 
                    Nombre = "Angus", 
                    Descripcion = "Raza de carne de alta calidad, de color negro o rojo, conocida por su marmoleo y sabor.",
                    
                }
            };

            await _context.Razas.AddRangeAsync(razas);
            await _context.SaveChangesAsync();
        }
    }
}
