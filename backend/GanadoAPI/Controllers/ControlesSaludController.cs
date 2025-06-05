using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using GanadoAPI.Data;
using GanadoAPI.DTOs;
using GanadoAPI.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace GanadoAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ControlesSaludController : BaseApiController
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<ControlesSaludController> _logger;

        public ControlesSaludController(ApplicationDbContext context, ILogger<ControlesSaludController> logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// Obtiene TODOS los controles de salud sin filtros
        /// </summary>
        [HttpGet("todos")]
        public async Task<ActionResult<IEnumerable<ControlSaludDTO>>> GetTodosControles()
        {
            try
            {
                var controles = await _context.ControlesSalud
                    .Include(c => c.Animal)
                    .Select(c => new ControlSaludDTO
                    {
                        Id = c.Id,
                        Fecha = c.Fecha,
                        TipoControl = c.TipoControl,
                        Diagnostico = c.Descripcion,
                        Tratamiento = c.Medicamento,
                        Costo = c.Dosis != null ? decimal.Parse(c.Dosis) : 0,
                        AnimalNombre = c.Animal.Nombre,
                        AnimalIdentificacion = c.Animal.NumeroIdentificacion,
                        Estado = c.Estado ?? "Pendiente"
                    })
                    .ToListAsync();

                return Ok(controles);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener todos los controles de salud");
                return StatusCode(500, new { message = "Error interno del servidor al obtener todos los controles de salud" });
            }
        }

        /// <summary>
        /// Obtiene los controles de salud de un animal
        /// </summary>
        [HttpGet("animal/{animalId}")]
        public async Task<ActionResult<IEnumerable<ControlSaludDTO>>> GetControlesPorAnimal(int animalId, [FromQuery] DateTime? fechaInicio = null, [FromQuery] DateTime? fechaFin = null)
        {
            try
            {
                var query = _context.ControlesSalud
                    .Where(c => c.AnimalId == animalId);

                if (fechaInicio.HasValue)
                {
                    query = query.Where(c => c.Fecha >= fechaInicio.Value.Date);
                }

                if (fechaFin.HasValue)
                {
                    query = query.Where(c => c.Fecha <= fechaFin.Value.Date.AddDays(1).AddTicks(-1));
                }

                var controles = await query
                    .OrderByDescending(c => c.Fecha)
                    .Select(c => new ControlSaludDTO
                    {
                        Id = c.Id,
                        Fecha = c.Fecha,
                        TipoControl = c.TipoControl,
                        Diagnostico = c.Descripcion,
                        Tratamiento = c.Medicamento,
                        Costo = c.Dosis != null ? decimal.Parse(c.Dosis) : 0,
                        AnimalNombre = c.Animal.Nombre,
                        AnimalIdentificacion = c.Animal.NumeroIdentificacion,
                        Estado = c.Estado ?? "Pendiente"
                    })
                    .ToListAsync();

                return Ok(controles);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error al obtener los controles de salud del animal con ID {animalId}");
                return StatusCode(500, new { message = "Error interno del servidor al obtener los controles de salud" });
            }
        }

        /// <summary>
        /// Obtiene los próximos controles programados
        /// </summary>
        [HttpGet("proximos")]
        public async Task<ActionResult<IEnumerable<ControlSaludDTO>>> GetProximosControles([FromQuery] int dias = 30)
        {
            try
            {
                var fechaLimite = DateTime.Today.AddDays(dias);
                
                var controles = await _context.ControlesSalud
                    .Where(c => c.ProximoControl.HasValue && 
                              c.ProximoControl.Value.Date >= DateTime.Today && 
                              c.ProximoControl.Value.Date <= fechaLimite)
                    .OrderBy(c => c.ProximoControl)
                    .Select(c => new ControlSaludDTO
                    {
                        Id = c.Id,
                        Fecha = c.Fecha,
                        TipoControl = c.TipoControl,
                        Diagnostico = c.Descripcion,
                        Tratamiento = c.Medicamento,
                        Costo = c.Dosis != null ? decimal.Parse(c.Dosis) : 0,
                        AnimalNombre = c.Animal.Nombre,
                        AnimalIdentificacion = c.Animal.NumeroIdentificacion,
                        Estado = c.Estado ?? "Pendiente"
                    })
                    .ToListAsync();

                return Ok(controles);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener los próximos controles de salud");
                return StatusCode(500, new { message = "Error interno del servidor al obtener los próximos controles" });
            }
        }

        /// <summary>
        /// Obtiene un control de salud por su ID
        /// </summary>
        [HttpGet("{id}")]
        public async Task<ActionResult<ControlSaludDTO>> GetControlSalud(int id)
        {
            try
            {
                var control = await _context.ControlesSalud
                    .Include(c => c.Animal)
                    .Where(c => c.Id == id)
                    .Select(c => new ControlSaludDTO
                    {
                        Id = c.Id,
                        AnimalId = c.AnimalId,
                        Fecha = c.Fecha,
                        TipoControl = c.TipoControl,
                        Diagnostico = c.Descripcion,
                        Tratamiento = c.Medicamento,
                        Costo = c.Dosis != null ? decimal.Parse(c.Dosis) : 0,
                        AnimalNombre = c.Animal.Nombre,
                        AnimalIdentificacion = c.Animal.NumeroIdentificacion,
                        Estado = c.Estado ?? "Pendiente",
                        ProximoControl = c.ProximoControl,
                        Observaciones = c.Observaciones,
                        Veterinario = c.Veterinario
                    })
                    .FirstOrDefaultAsync();

                if (control == null)
                {
                    return NotFound();
                }

                return Ok(control);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error al obtener el control de salud con ID {id}");
                return StatusCode(500, new { message = "Error interno del servidor al obtener el control de salud" });
            }
        }

        /// <summary>
        /// Crea un nuevo control de salud
        /// </summary>
        [HttpPost]
        public async Task<ActionResult<ControlSaludDTO>> PostControlSalud(ControlSaludCreacionDTO controlDto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                // Verificar que el animal exista y esté activo
                var animal = await _context.Animales
                    .FirstOrDefaultAsync(a => a.Id == controlDto.AnimalId && a.Activo);

                if (animal == null)
                {
                    return BadRequest("Animal no encontrado o inactivo");
                }

                var control = new ControlSalud
                {
                    AnimalId = controlDto.AnimalId,
                    Fecha = controlDto.Fecha,
                    TipoControl = controlDto.TipoControl,
                    Descripcion = controlDto.Diagnostico,
                    Medicamento = controlDto.Tratamiento,
                    Dosis = controlDto.Costo.ToString(),
                    ProximoControl = controlDto.ProximoControl,
                    Observaciones = controlDto.Observaciones,
                    Veterinario = controlDto.Veterinario,
                    Estado = controlDto.Estado ?? "Pendiente" // Incluir el campo Estado con un valor por defecto
                };

                _context.ControlesSalud.Add(control);
                await _context.SaveChangesAsync();

                var controlCreado = new ControlSaludDTO
                {
                    Id = control.Id,
                    Fecha = control.Fecha,
                    TipoControl = control.TipoControl,
                    Diagnostico = control.Descripcion,
                    Tratamiento = control.Medicamento,
                    Costo = control.Dosis != null ? decimal.Parse(control.Dosis) : 0,
                    AnimalNombre = animal.Nombre,
                    AnimalIdentificacion = animal.NumeroIdentificacion
                };

                return CreatedAtAction(nameof(GetControlSalud), new { id = control.Id }, controlCreado);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al crear un nuevo control de salud");
                return StatusCode(500, new { message = "Error interno del servidor al crear el control de salud" });
            }
        }

        /// <summary>
        /// Actualiza un control de salud existente
        /// </summary>
        [HttpPut("{id}")]
        public async Task<ActionResult<ControlSaludDTO>> PutControlSalud(int id, ControlSaludCreacionDTO controlDto)
        {
            try
            {
                if (id != controlDto.Id)
                {
                    return BadRequest("ID del control no coincide");
                }

                var control = await _context.ControlesSalud.FindAsync(id);
                if (control == null)
                {
                    return NotFound("Control de salud no encontrado");
                }

                control.Fecha = controlDto.Fecha;
                control.TipoControl = controlDto.TipoControl;
                control.Descripcion = controlDto.Diagnostico;
                control.Medicamento = controlDto.Tratamiento;
                control.Dosis = controlDto.Costo.ToString();
                control.ProximoControl = controlDto.ProximoControl;
                control.Observaciones = controlDto.Observaciones;
                control.Veterinario = controlDto.Veterinario;
                control.Estado = controlDto.Estado ?? control.Estado ?? "Pendiente"; // Mantener estado existente o usar valor por defecto

                _context.Entry(control).State = EntityState.Modified;
                await _context.SaveChangesAsync();

                var animal = await _context.Animales.FindAsync(control.AnimalId);
                var controlActualizado = new ControlSaludDTO
                {
                    Id = control.Id,
                    Fecha = control.Fecha,
                    TipoControl = control.TipoControl,
                    Diagnostico = control.Descripcion,
                    Tratamiento = control.Medicamento,
                    Costo = control.Dosis != null ? decimal.Parse(control.Dosis) : 0,
                    AnimalNombre = animal?.Nombre ?? string.Empty,
                    AnimalIdentificacion = animal?.NumeroIdentificacion ?? string.Empty
                };

                return Ok(controlActualizado);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error al actualizar el control de salud con ID {id}");
                return StatusCode(500, new { message = "Error interno del servidor al actualizar el control de salud" });
            }
        }

        /// <summary>
        /// Elimina un control de salud
        /// </summary>
        [HttpDelete("{id}")]
        public async Task<ActionResult> DeleteControlSalud(int id)
        {
            try
            {
                var control = await _context.ControlesSalud.FindAsync(id);
                if (control == null)
                {
                    return NotFound("Control de salud no encontrado");
                }

                _context.ControlesSalud.Remove(control);
                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error al eliminar el control de salud con ID {id}");
                return StatusCode(500, new { message = "Error interno del servidor al eliminar el control de salud" });
            }
        }
    }

    public class ControlSaludCreacionDTO
    {
        public int Id { get; set; }
        public int AnimalId { get; set; }
        public DateTime Fecha { get; set; }
        public string TipoControl { get; set; } = null!;
        public string? Diagnostico { get; set; }
        public string? Tratamiento { get; set; }
        public decimal Costo { get; set; }
        public DateTime? ProximoControl { get; set; }
        public string? Observaciones { get; set; }
        public string? Veterinario { get; set; }
        public string? Estado { get; set; }
    }

    public class ControlSaludDTO : ControlSaludCreacionDTO
    {
        public string? AnimalNombre { get; set; }
        public string? AnimalIdentificacion { get; set; }
    }
}
