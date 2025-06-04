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
    public class ReproduccionController : BaseApiController
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<ReproduccionController> _logger;

        public ReproduccionController(ApplicationDbContext context, ILogger<ReproduccionController> logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// Obtiene el historial reproductivo de un animal
        /// </summary>
        [HttpGet("animal/{animalId}")]
        public async Task<ActionResult<IEnumerable<ReproduccionDTO>>> GetHistorialReproductivo(int animalId)
        {
            try
            {
                var historial = await _context.Reproducciones
                    .Where(r => (r.HembraId == animalId || r.MachoId == animalId))
                    .OrderByDescending(r => r.FechaMonta)
                    .Select(r => new ReproduccionDTO
                    {
                        Id = r.Id,
                        Fecha = r.FechaMonta,
                        TipoEvento = r.TipoMonta,
                        Resultado = r.Resultado,
                        HembraNombre = r.Hembra.Nombre,
                        HembraIdentificacion = r.Hembra.NumeroIdentificacion,
                        MachoNombre = r.Macho != null ? r.Macho.Nombre : null,
                        MachoIdentificacion = r.Macho != null ? r.Macho.NumeroIdentificacion : null
                    })
                    .ToListAsync();

                return Ok(historial);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error al obtener el historial reproductivo del animal con ID {animalId}");
                return StatusCode(500, new { message = "Error interno del servidor al obtener el historial reproductivo" });
            }
        }

        /// <summary>
        /// Obtiene los partos próximos a ocurrir
        /// </summary>
        [HttpGet("partos-proximos")]
        public async Task<ActionResult<IEnumerable<PartoProximoDTO>>> GetPartosProximos([FromQuery] int dias = 30)
        {
            try
            {
                var fechaLimite = DateTime.Today.AddDays(dias);
                
                var partosProximos = await _context.Reproducciones
                    .Where(r => r.FechaProbableParto.HasValue && 
                              r.FechaProbableParto.Value.Date >= DateTime.Today && 
                              r.FechaProbableParto.Value.Date <= fechaLimite &&
                              (!r.FechaRealParto.HasValue || r.FechaRealParto.Value > DateTime.Today))
                    .OrderBy(r => r.FechaProbableParto)
                    .Select(r => new PartoProximoDTO
                    {
                        Id = r.Id,
                        HembraId = r.HembraId,
                        HembraNombre = r.Hembra.Nombre,
                        HembraNumeroIdentificacion = r.Hembra.NumeroIdentificacion,
                        FechaMonta = r.FechaMonta,
                        FechaConfirmacionPrenez = r.FechaConfirmacionPrenez,
                        FechaProbableParto = r.FechaProbableParto,
                        DiasRestantes = (r.FechaProbableParto.Value.Date - DateTime.Today).Days,
                        Observaciones = r.Observaciones
                    })
                    .ToListAsync();

                return Ok(partosProximos);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener los partos próximos");
                return StatusCode(500, new { message = "Error interno del servidor al obtener los partos próximos" });
            }
        }

        /// <summary>
        /// Obtiene los partos próximos ordenados por fecha
        /// </summary>
        [HttpGet("partos-proximos")]
        public async Task<ActionResult<IEnumerable<PartoProximoDTO>>> GetPartosProximos()
        {
            try
            {
                var hoy = DateTime.Now.Date;
                
                var partosProximos = await _context.Reproducciones
                    .Include(r => r.Hembra)
                    .Where(r => r.FechaProbableParto.HasValue && 
                           r.FechaRealParto == null && 
                           (r.Resultado == null || r.Resultado != "aborto") &&
                           r.FechaProbableParto.Value.Date >= hoy.AddDays(-7))
                    .OrderBy(r => r.FechaProbableParto)
                    .Take(10)
                    .Select(r => new PartoProximoDTO
                    {
                        Id = r.Id,
                        HembraId = r.HembraId,
                        HembraNombre = r.Hembra.Nombre,
                        HembraNumeroIdentificacion = r.Hembra.NumeroIdentificacion,
                        FechaMonta = r.FechaMonta,
                        FechaConfirmacionPrenez = r.FechaConfirmacionPrenez,
                        FechaProbableParto = r.FechaProbableParto,
                        DiasRestantes = r.FechaProbableParto.HasValue ? 
                            (int)(r.FechaProbableParto.Value.Date - hoy).TotalDays : 
                            null,
                        Observaciones = r.Observaciones
                    })
                    .ToListAsync();

                return Ok(partosProximos);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener partos próximos");
                return StatusCode(500, new { message = "Error interno del servidor" });
            }
        }

        /// <summary>
        /// Obtiene la lista de eventos reproductivos con paginación
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<PagedResult<ReproduccionDTO>>> GetReproducciones(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] string? tipoEvento = null)
        {
            try
            {
                var query = _context.Reproducciones
                    .Include(r => r.Hembra)
                    .Include(r => r.Macho)
                    .AsQueryable();

                // Aplicar filtros
                if (!string.IsNullOrEmpty(tipoEvento) && tipoEvento.ToLower() != "todos")
                {
                    query = query.Where(r => r.TipoMonta == tipoEvento);
                }

                // Obtener el total de registros
                var totalCount = await query.CountAsync();

                // Aplicar paginación
                var items = await query
                    .OrderByDescending(r => r.FechaMonta)
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .Select(r => new ReproduccionDTO
                    {
                        Id = r.Id,
                        Fecha = r.FechaMonta,
                        TipoEvento = r.TipoMonta,
                        Resultado = r.Resultado,
                        HembraId = r.HembraId,
                        HembraNombre = r.Hembra.Nombre,
                        HembraIdentificacion = r.Hembra.NumeroIdentificacion,
                        MachoId = r.MachoId,
                        MachoNombre = r.Macho != null ? r.Macho.Nombre : null,
                        MachoIdentificacion = r.Macho != null ? r.Macho.NumeroIdentificacion : null,
                        FechaConfirmacionPrenez = r.FechaConfirmacionPrenez,
                        FechaProbableParto = r.FechaProbableParto,
                        FechaRealParto = r.FechaRealParto,
                        Observaciones = r.Observaciones
                    })
                    .ToListAsync();

                var result = new PagedResult<ReproduccionDTO>
                {
                    Items = items,
                    TotalCount = totalCount,
                    PageNumber = page,
                    PageSize = pageSize
                };

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener la lista de eventos reproductivos");
                return StatusCode(500, new { message = "Error interno del servidor al obtener los eventos reproductivos" });
            }
        }

        /// <summary>
        /// Obtiene una reproducción por su ID
        /// </summary>
        [HttpGet("{id}")]
        public async Task<ActionResult<ReproduccionDTO>> GetReproduccion(int id)
        {
            try
            {
                var reproduccion = await _context.Reproducciones
                    .Include(r => r.Hembra)
                    .Include(r => r.Macho)
                    .Where(r => r.Id == id)
                    .Select(r => new ReproduccionDTO
                    {
                        Id = r.Id,
                        HembraId = r.HembraId,
                        MachoId = r.MachoId,
                        Fecha = r.FechaMonta,
                        TipoEvento = r.TipoMonta,
                        Resultado = r.Resultado,
                        FechaProbableParto = r.FechaProbableParto,
                        FechaRealParto = r.FechaRealParto,
                        FechaConfirmacionPrenez = r.FechaConfirmacionPrenez,
                        Observaciones = r.Observaciones,
                        HembraNombre = r.Hembra.Nombre,
                        HembraIdentificacion = r.Hembra.NumeroIdentificacion,
                        MachoNombre = r.Macho != null ? r.Macho.Nombre : null,
                        MachoIdentificacion = r.Macho != null ? r.Macho.NumeroIdentificacion : null
                    })
                    .FirstOrDefaultAsync();

                if (reproduccion == null)
                {
                    return NotFound();
                }

                return Ok(reproduccion);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error al obtener la reproducción con ID {id}");
                return StatusCode(500, new { message = "Error interno del servidor al obtener la reproducción" });
            }
        }

        /// <summary>
        /// Obtiene las crías asociadas a un evento de reproducción
        /// </summary>
        [HttpGet("crias/{id}")]
        public async Task<ActionResult<IEnumerable<CriaDTO>>> GetCriasByReproduccion(int id)
        {
            try
            {
                // Verificar que la reproducción existe
                var reproduccion = await _context.Reproducciones.FindAsync(id);
                if (reproduccion == null)
                {
                    return NotFound($"No se encontró un evento de reproducción con id {id}");
                }

                // Buscar animales que fueron nacidos en este evento de reproducción
                var crias = await _context.Animales
                    .Where(a => a.ReproduccionId == id)
                    .Select(a => new CriaDTO
                    {
                        Id = a.Id,
                        NumeroIdentificacion = a.NumeroIdentificacion,
                        Nombre = a.Nombre ?? "Sin nombre",
                        FechaNacimiento = a.FechaNacimiento,
                        Sexo = a.Sexo
                    })
                    .ToListAsync();

                return Ok(crias);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error al obtener las crías para la reproducción con ID {id}");
                return StatusCode(500, new { message = "Error interno del servidor al obtener las crías" });
            }
        }

        /// <summary>
        /// Registra un nuevo evento de reproducción
        /// </summary>
        [HttpPost]
        public async Task<ActionResult<ReproduccionDTO>> PostReproduccion(ReproduccionCreacionDTO reproduccionDto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                // Verificar que la hembra exista y sea hembra
                var hembra = await _context.Animales
                    .FirstOrDefaultAsync(a => a.Id == reproduccionDto.HembraId && a.Sexo == "H" && a.Activo);

                if (hembra == null)
                {
                    return BadRequest("Hembra no encontrada, inactiva o no es una hembra");
                }

                // Verificar que el macho exista y sea macho (si se especificó)
                if (reproduccionDto.MachoId.HasValue)
                {
                    var macho = await _context.Animales
                        .FirstOrDefaultAsync(a => a.Id == reproduccionDto.MachoId.Value && a.Sexo == "M" && a.Activo);

                    if (macho == null)
                    {
                        return BadRequest("Macho no encontrado, inactivo o no es un macho");
                    }
                }

                var reproduccion = new Reproduccion
                {
                    HembraId = reproduccionDto.HembraId,
                    MachoId = reproduccionDto.MachoId,
                    TipoMonta = reproduccionDto.TipoEvento,
                    FechaMonta = reproduccionDto.Fecha,
                    FechaProbableParto = reproduccionDto.FechaProbableParto,
                    FechaConfirmacionPrenez = reproduccionDto.FechaConfirmacionPrenez,
                    FechaRealParto = reproduccionDto.FechaRealParto,
                    Resultado = reproduccionDto.Resultado,
                    Observaciones = reproduccionDto.Observaciones
                };

                _context.Reproducciones.Add(reproduccion);
                await _context.SaveChangesAsync();

                var reproduccionCreada = new ReproduccionDTO
                {
                    Id = reproduccion.Id,
                    Fecha = reproduccion.FechaMonta,
                    TipoEvento = reproduccion.TipoMonta,
                    Resultado = reproduccion.Resultado,
                    HembraNombre = hembra.Nombre,
                    HembraIdentificacion = hembra.NumeroIdentificacion,
                    MachoNombre = reproduccion.MachoId.HasValue ? (await _context.Animales.FindAsync(reproduccion.MachoId.Value))?.Nombre : null,
                    MachoIdentificacion = reproduccion.MachoId.HasValue ? (await _context.Animales.FindAsync(reproduccion.MachoId.Value))?.NumeroIdentificacion : null
                };

                return CreatedAtAction(nameof(GetReproduccion), new { id = reproduccion.Id }, reproduccionCreada);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al crear un nuevo evento de reproducción");
                return StatusCode(500, new { message = "Error interno del servidor al crear el evento de reproducción" });
            }
        }

        /// <summary>
        /// Actualiza un evento de reproducción
        /// </summary>
        [HttpPut("{id}")]
        public async Task<ActionResult<ReproduccionDTO>> PutReproduccion(int id, ReproduccionCreacionDTO reproduccionDto)
        {
            try
            {
                if (id != reproduccionDto.Id)
                {
                    return BadRequest("ID de la reproducción no coincide");
                }

                var reproduccion = await _context.Reproducciones.FindAsync(id);
                if (reproduccion == null)
                {
                    return NotFound("Reproducción no encontrada");
                }

                // Verificar que la hembra exista y sea hembra
                var hembra = await _context.Animales
                    .FirstOrDefaultAsync(a => a.Id == reproduccionDto.HembraId && a.Sexo == "H" && a.Activo);

                if (hembra == null)
                {
                    return BadRequest("Hembra no encontrada, inactiva o no es una hembra");
                }

                // Verificar que el macho exista y sea macho (si se especificó)
                if (reproduccionDto.MachoId.HasValue)
                {
                    var macho = await _context.Animales
                        .FirstOrDefaultAsync(a => a.Id == reproduccionDto.MachoId.Value && a.Sexo == "M" && a.Activo);

                    if (macho == null)
                    {
                        return BadRequest("Macho no encontrado, inactivo o no es un macho");
                    }
                }

                reproduccion.HembraId = reproduccionDto.HembraId;
                reproduccion.MachoId = reproduccionDto.MachoId;
                reproduccion.TipoMonta = reproduccionDto.TipoEvento;
                reproduccion.FechaMonta = reproduccionDto.Fecha;
                reproduccion.FechaProbableParto = reproduccionDto.FechaProbableParto;
                reproduccion.FechaConfirmacionPrenez = reproduccionDto.FechaConfirmacionPrenez;
                reproduccion.FechaRealParto = reproduccionDto.FechaRealParto;
                reproduccion.Resultado = reproduccionDto.Resultado;
                reproduccion.Observaciones = reproduccionDto.Observaciones;

                _context.Entry(reproduccion).State = EntityState.Modified;
                await _context.SaveChangesAsync();

                var reproduccionActualizada = new ReproduccionDTO
                {
                    Id = reproduccion.Id,
                    Fecha = reproduccion.FechaMonta,
                    TipoEvento = reproduccion.TipoMonta,
                    Resultado = reproduccion.Resultado,
                    HembraNombre = hembra.Nombre,
                    HembraIdentificacion = hembra.NumeroIdentificacion,
                    MachoNombre = reproduccion.MachoId.HasValue ? (await _context.Animales.FindAsync(reproduccion.MachoId.Value))?.Nombre : null,
                    MachoIdentificacion = reproduccion.MachoId.HasValue ? (await _context.Animales.FindAsync(reproduccion.MachoId.Value))?.NumeroIdentificacion : null
                };

                return Ok(reproduccionActualizada);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error al actualizar la reproducción con ID {id}");
                return StatusCode(500, new { message = "Error interno del servidor al actualizar la reproducción" });
            }
        }

        /// <summary>
        /// Elimina un evento de reproducción
        /// </summary>
        [HttpDelete("{id}")]
        public async Task<ActionResult> DeleteReproduccion(int id)
        {
            try
            {
                var reproduccion = await _context.Reproducciones.FindAsync(id);
                if (reproduccion == null)
                {
                    return NotFound("Reproducción no encontrada");
                }

                _context.Reproducciones.Remove(reproduccion);
                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error al eliminar la reproducción con ID {id}");
                return StatusCode(500, new { message = "Error interno del servidor al eliminar la reproducción" });
            }
        }
    }

    public class ReproduccionCreacionDTO
    {
        public int Id { get; set; }
        public int HembraId { get; set; }
        public int? MachoId { get; set; }
        public string? TipoEvento { get; set; }
        public DateTime? Fecha { get; set; }
        public DateTime? FechaConfirmacionPrenez { get; set; }
        public DateTime? FechaProbableParto { get; set; }
        public DateTime? FechaRealParto { get; set; }
        public string? Resultado { get; set; }
        public string? Observaciones { get; set; }
    }

    public class ReproduccionDTO : ReproduccionCreacionDTO
    {
        public string? HembraNombre { get; set; }
        public string? HembraIdentificacion { get; set; }
        public string? MachoNombre { get; set; }
        public string? MachoIdentificacion { get; set; }
    }

    public class CriaCreacionDTO
    {
        public string NumeroIdentificacion { get; set; } = null!;
        public string? Nombre { get; set; }
        public DateTime? FechaNacimiento { get; set; }
        public string Sexo { get; set; } = null!; // M: Macho, H: Hembra
        public int? RazaId { get; set; }
        public string? Observaciones { get; set; }
    }

    public class CriaDTO
    {
        public int Id { get; set; }
        public string NumeroIdentificacion { get; set; } = null!;
        public string Nombre { get; set; } = null!;
        public DateTime FechaNacimiento { get; set; }
        public string Sexo { get; set; } = null!;
    }

    public class PartoProximoDTO
    {
        public int Id { get; set; }
        public int HembraId { get; set; }
        public string HembraNombre { get; set; } = null!;
        public string HembraNumeroIdentificacion { get; set; } = null!;
        public DateTime? FechaMonta { get; set; }
        public DateTime? FechaConfirmacionPrenez { get; set; }
        public DateTime? FechaProbableParto { get; set; }
        public int? DiasRestantes { get; set; }
        public string? Observaciones { get; set; }
    }
}
