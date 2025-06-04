using System.Collections.Generic;
using System.Threading.Tasks;
using GanadoAPI.Data;
using GanadoAPI.DTOs;
using GanadoAPI.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System;
using System.Linq;

namespace GanadoAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class RazasController : BaseApiController
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<RazasController> _logger;

        public RazasController(ApplicationDbContext context, ILogger<RazasController> logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// Obtiene todas las razas de ganado
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<IEnumerable<RazaDTO>>> GetRazas()
        {
            try
            {
                var razas = await _context.Razas
                    .Where(r => r.Animales.Any(a => a.Activo))
                    .Select(r => new RazaDTO
                    {
                        Id = r.Id,
                        Nombre = r.Nombre,
                        Descripcion = r.Descripcion
                    })
                    .ToListAsync();

                return Ok(razas);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener la lista de razas");
                return StatusCode(500, new { message = "Error interno del servidor al obtener las razas" });
            }
        }

        /// <summary>
        /// Obtiene una raza por su ID con su lista de animales
        /// </summary>
        [HttpGet("{id}")]
        public async Task<ActionResult<RazaConAnimalesDTO>> GetRaza(int id)
        {
            try
            {
                var raza = await _context.Razas
                    .Include(r => r.Animales.Where(a => a.Activo))
                    .Select(r => new RazaConAnimalesDTO
                    {
                        Id = r.Id,
                        Nombre = r.Nombre,
                        Descripcion = r.Descripcion,
                        Animales = r.Animales
                            .Where(a => a.Activo)
                            .Select(a => new AnimalDTO
                            {
                                Id = a.Id,
                                NumeroIdentificacion = a.NumeroIdentificacion,
                                Nombre = a.Nombre,
                                FechaNacimiento = a.FechaNacimiento,
                                Sexo = a.Sexo,
                                Estado = a.Estado,
                                RazaId = a.RazaId,
                                RazaNombre = r.Nombre
                            })
                            .ToList()
                    })
                    .FirstOrDefaultAsync(r => r.Id == id);

                if (raza == null)
                {
                    return NotFound();
                }

                return Ok(raza);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error al obtener la raza con ID {id}");
                return StatusCode(500, new { message = "Error interno del servidor al obtener la raza" });
            }
        }

        /// <summary>
        /// Crea una nueva raza
        /// </summary>
        [HttpPost]
        public async Task<ActionResult<RazaDTO>> PostRaza(RazaCreacionDTO razaDto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var raza = new Raza
                {
                    Nombre = razaDto.Nombre,
                    Descripcion = razaDto.Descripcion
                };

                _context.Razas.Add(raza);
                await _context.SaveChangesAsync();

                var razaCreada = new RazaDTO
                {
                    Id = raza.Id,
                    Nombre = raza.Nombre,
                    Descripcion = raza.Descripcion
                };

                return CreatedAtAction(nameof(GetRaza), new { id = raza.Id }, razaCreada);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al crear una nueva raza");
                return StatusCode(500, new { message = "Error interno del servidor al crear la raza" });
            }
        }

        /// <summary>
        /// Actualiza una raza existente
        /// </summary>
        [HttpPut("{id}")]
        public async Task<ActionResult<RazaDTO>> PutRaza(int id, RazaDTO razaDto)
        {
            try
            {
                if (id != razaDto.Id)
                {
                    return BadRequest("ID de la raza no coincide");
                }

                var raza = await _context.Razas.FindAsync(id);
                if (raza == null)
                {
                    return NotFound("Raza no encontrada");
                }

                raza.Nombre = razaDto.Nombre;
                raza.Descripcion = razaDto.Descripcion;

                _context.Entry(raza).State = EntityState.Modified;
                await _context.SaveChangesAsync();

                return Ok(razaDto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error al actualizar la raza con ID {id}");
                return StatusCode(500, new { message = "Error interno del servidor al actualizar la raza" });
            }
        }

        /// <summary>
        /// Elimina una raza (solo si no tiene animales asociados)
        /// </summary>
        [HttpDelete("{id}")]
        public async Task<ActionResult> DeleteRaza(int id)
        {
            try
            {
                var raza = await _context.Razas
                    .Include(r => r.Animales)
                    .FirstOrDefaultAsync(r => r.Id == id);

                if (raza == null)
                {
                    return NotFound("Raza no encontrada");
                }

                if (raza.Animales.Any())
                {
                    return BadRequest("No se puede eliminar la raza porque tiene animales asociados");
                }

                _context.Razas.Remove(raza);
                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error al eliminar la raza con ID {id}");
                return StatusCode(500, new { message = "Error interno del servidor al eliminar la raza" });
            }
        }
    }

    public class RazaDTO
    {
        public int Id { get; set; }
        public string Nombre { get; set; } = null!;
        public string? Descripcion { get; set; }
    }

    public class RazaConAnimalesDTO : RazaDTO
    {
        public List<AnimalDTO> Animales { get; set; } = new List<AnimalDTO>();
    }
}
