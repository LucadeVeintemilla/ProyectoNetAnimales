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
using System.Globalization;

namespace GanadoAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ControlesSaludController : BaseApiController
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<ControlesSaludController> _logger;

        /// <summary>
        /// Normaliza el tipo de control para evitar problemas con acentos y mayúsculas
        /// </summary>
        private string NormalizarTipoControl(string tipo)
        {
            if (string.IsNullOrEmpty(tipo))
                return "otro";

            // Convertir a minúsculas y eliminar acentos
            string normalizado = tipo.ToLower();
            normalizado = normalizado.Replace("á", "a")
                                   .Replace("é", "e")
                                   .Replace("í", "i")
                                   .Replace("ó", "o")
                                   .Replace("ú", "u")
                                   .Replace(" ", "");

            // Clasificar por tipo
            if (normalizado.Contains("vacun"))
                return "vacuna";
            else if (normalizado.Contains("tratam"))
                return "tratamiento";
            else if (normalizado.Contains("revis"))
                return "revision";
            else if (normalizado.Contains("cirug"))
                return "cirugia";
            else
                return "otro";
        }

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
                        Descripcion = c.Diagnostico,
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
                    .Include(c => c.Animal)
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
                        Descripcion = c.Descripcion,
                        Diagnostico = c.Diagnostico,
                        Tratamiento = c.Medicamento,
                        ProximoControl = c.ProximoControl,
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
        public async Task<ActionResult<IEnumerable<ControlSaludDTO>>> GetProximosControles([FromQuery] int dias = 30, [FromQuery] int? animalId = null)
        {
            try
            {
                var fechaLimite = DateTime.Today.AddDays(dias);

                var query = _context.ControlesSalud
                    .Include(c => c.Animal)
                    .Where(c => c.ProximoControl.HasValue &&
                              c.ProximoControl.Value.Date >= DateTime.Today &&
                              c.ProximoControl.Value.Date <= fechaLimite);

                if (animalId.HasValue)
                {
                    query = query.Where(c => c.AnimalId == animalId.Value);
                }

                var controles = await query
                    .OrderBy(c => c.ProximoControl)
                    .Select(c => new ControlSaludDTO
                    {
                        Id = c.Id,
                        AnimalId = c.AnimalId,
                        Fecha = c.Fecha,
                        ProximoControl = c.ProximoControl,
                        TipoControl = c.TipoControl,
                        Diagnostico = c.Descripcion,
                        Tratamiento = c.Medicamento,
                        Costo = c.Dosis != null ? decimal.Parse(c.Dosis) : 0,
                        AnimalNombre = c.Animal.Nombre,
                        AnimalIdentificacion = c.Animal.NumeroIdentificacion,
                        Estado = c.Estado ?? "Pendiente"
                    })
                    .ToListAsync();

                // Agregar los días restantes para cada control
                var proximosControlesFormatted = controles.Select(c => new
                {
                    c.Id,
                    c.AnimalId,
                    AnimalNombre = c.AnimalNombre ?? "Sin nombre",
                    NumeroIdentificacion = c.AnimalIdentificacion ?? "Sin ID",
                    Fecha = c.ProximoControl?.ToString("yyyy-MM-dd"),
                    Tipo = c.TipoControl?.ToLower() ?? "otro",
                    Descripcion = c.Diagnostico ?? "Control programado",
                    DiasRestantes = c.ProximoControl.HasValue ? (int)(c.ProximoControl.Value.Date - DateTime.Today).TotalDays : 0
                }).ToList();

                return Ok(proximosControlesFormatted);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener los próximos controles de salud");
                return StatusCode(500, new { message = "Error interno del servidor al obtener los próximos controles" });
            }
        }

        /// <summary>
        /// Obtiene los controles por tipo y mes para el dashboard
        /// </summary>
        [HttpGet("dashboard/controles-por-mes")]
        public async Task<ActionResult<IEnumerable<object>>> GetControlesPorMes([FromQuery] int año = 0, [FromQuery] int? animalId = null)
        {
            try
            {
                if (año == 0)
                {
                    año = DateTime.Today.Year;
                }

                var fechaInicio = new DateTime(año, 1, 1);
                var fechaFin = new DateTime(año, 12, 31, 23, 59, 59);

                var query = _context.ControlesSalud
                    .Where(c => c.Fecha >= fechaInicio && c.Fecha <= fechaFin);

                if (animalId.HasValue)
                {
                    query = query.Where(c => c.AnimalId == animalId.Value);
                }

                var controles = await query.ToListAsync();

                // Normalizar tipos de control para evitar problemas con mayúsculas y acentos
                var controlesPorMes = controles.Select(c => new
                {
                    Mes = c.Fecha.Month,
                    // Normalizar el tipo de control para clasificarlo correctamente
                    TipoNormalizado = NormalizarTipoControl(c.TipoControl)
                }).ToList();

                // Agrupar por mes y tipo de control
                var meses = Enumerable.Range(1, 12)
                    .Select(mes => new
                    {
                        Month = mes,
                        MonthName = CultureInfo.GetCultureInfo("es-ES").DateTimeFormat.GetMonthName(mes).Substring(0, 3),
                        Vacuna = controlesPorMes.Count(c => c.Mes == mes && c.TipoNormalizado == "vacuna"),
                        Tratamiento = controlesPorMes.Count(c => c.Mes == mes && c.TipoNormalizado == "tratamiento"),
                        Revision = controlesPorMes.Count(c => c.Mes == mes && c.TipoNormalizado == "revision"),
                        Cirugia = controlesPorMes.Count(c => c.Mes == mes && c.TipoNormalizado == "cirugia"),
                        Otro = controlesPorMes.Count(c => c.Mes == mes && c.TipoNormalizado == "otro")
                    })
                    .Select(m => new
                    {
                        name = m.MonthName,
                        vacuna = m.Vacuna,
                        tratamiento = m.Tratamiento,
                        revision = m.Revision,
                        cirugia = m.Cirugia,
                        otro = m.Otro
                    })
                    .ToList();

                return Ok(meses);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener los controles por mes");
                return StatusCode(500, new { message = "Error interno del servidor al obtener los controles por mes" });
            }
        }

        /// <summary>
        /// Obtiene la distribución de estados por tipo de control para el dashboard
        /// </summary>
        [HttpGet("dashboard/estados-por-tipo")]
        public async Task<ActionResult<IEnumerable<object>>> GetEstadosPorTipo([FromQuery] int? animalId = null)
        {
            try
            {
                var query = _context.ControlesSalud.AsQueryable();

                if (animalId.HasValue)
                {
                    query = query.Where(c => c.AnimalId == animalId.Value);
                }

                var controles = await query.ToListAsync();

                // Normalizar tipos de control para evitar problemas con mayúsculas y acentos
                var controlesNormalizados = controles.Select(c => new {
                    TipoNormalizado = NormalizarTipoControl(c.TipoControl),
                    Estado = c.Estado?.ToLower() ?? "pendiente"
                }).ToList();
                
                // Agrupar por tipo de control y estado
                var tiposControl = new[] { "vacuna", "tratamiento", "revision", "cirugia", "otro" };
                var datosPorTipo = tiposControl.Select(tipo => new
                {
                    name = tipo == "revision" ? "revisión" : 
                           tipo == "cirugia" ? "cirugía" : tipo,
                    completado = controlesNormalizados.Count(c => c.TipoNormalizado == tipo && c.Estado == "completado"),
                    pendiente = controlesNormalizados.Count(c => c.TipoNormalizado == tipo && c.Estado == "pendiente"),
                    atrasado = controlesNormalizados.Count(c => c.TipoNormalizado == tipo && c.Estado == "atrasado")
                }).ToList();

                return Ok(datosPorTipo);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener los estados por tipo de control");
                return StatusCode(500, new { message = "Error interno del servidor al obtener los estados por tipo de control" });
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
                        Descripcion = c.Descripcion,
                        Diagnostico = c.Diagnostico,
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
                    Descripcion = controlDto.Descripcion,
                    Diagnostico = controlDto.Diagnostico,
                    Medicamento = "",
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
                control.Descripcion = controlDto.Descripcion;
                control.Diagnostico = controlDto.Diagnostico;
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
        public string? Descripcion { get; set; }
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
    

