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
    public class ProduccionLecheController : BaseApiController
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<ProduccionLecheController> _logger;

        public ProduccionLecheController(ApplicationDbContext context, ILogger<ProduccionLecheController> logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// Obtiene todos los registros de producción de leche con paginación y filtros
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<PagedResult<ProduccionLecheDTO>>> GetProduccionesLeche(
            [FromQuery] int page = 1, 
            [FromQuery] int pageSize = 10,
            [FromQuery] DateTime? fechaInicio = null,
            [FromQuery] DateTime? fechaFin = null,
            [FromQuery] int? animalId = null)
        {
            try
            {
                var query = _context.ProduccionesLeche
                    .Include(p => p.Animal)
                    .AsQueryable();

                // Aplicar filtros
                if (fechaInicio.HasValue)
                {
                    query = query.Where(p => p.Fecha >= fechaInicio.Value.Date);
                }

                if (fechaFin.HasValue)
                {
                    var endOfDay = fechaFin.Value.Date.AddDays(1).AddTicks(-1);
                    query = query.Where(p => p.Fecha <= endOfDay);
                }


                if (animalId.HasValue)
                {
                    query = query.Where(p => p.AnimalId == animalId.Value);
                }


                // Obtener el total de registros
                var totalCount = await query.CountAsync();

                // Aplicar paginación
                var items = await query
                    .OrderByDescending(p => p.Fecha)
                    .ThenBy(p => p.Turno)
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .Select(p => new ProduccionLecheDTO
                    {
                        Id = p.Id,
                        AnimalId = p.AnimalId,
                        NombreAnimal = p.Animal.Nombre,
                        NumeroIdentificacion = p.Animal.NumeroIdentificacion,
                        Fecha = p.Fecha,
                        CantidadLitros = p.CantidadLitros,
                        Turno = p.Turno,
                        Observaciones = p.Observaciones
                    })
                    .ToListAsync();

                var result = new PagedResult<ProduccionLecheDTO>
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
                _logger.LogError(ex, "Error al obtener la lista de producciones de leche");
                return StatusCode(500, new { message = "Error interno del servidor al obtener las producciones de leche" });
            }
        }

        /// <summary>
        /// Obtiene el resumen de producción de leche por período
        /// </summary>
        [HttpGet("resumen")]
        public async Task<ActionResult<ResumenProduccionDTO>> GetResumenProduccion(
            [FromQuery] DateTime fechaInicio, 
            [FromQuery] DateTime fechaFin)
        {
            try
            {
                // Asegurarse de que las fechas estén en el rango correcto
                if (fechaInicio > fechaFin)
                {
                    return BadRequest("La fecha de inicio no puede ser mayor a la fecha de fin");
                }

                // Calcular el rango de fechas
                var rangoDias = (fechaFin - fechaInicio).Days + 1;
                if (rangoDias > 365)
                {
                    return BadRequest("El rango de fechas no puede ser mayor a un año");
                }

                // Obtener la producción total en el período
                var produccionTotal = await _context.ProduccionesLeche
                    .Where(p => p.Fecha >= fechaInicio.Date && p.Fecha <= fechaFin.Date)
                    .SumAsync(p => p.CantidadLitros);

                var resumen = new ResumenProduccionDTO
                {
                    FechaInicio = fechaInicio,
                    FechaFin = fechaFin,
                    TotalDias = rangoDias,
                    TotalLitros = produccionTotal,
                    PromedioDiario = rangoDias > 0 ? produccionTotal / rangoDias : 0
                };

                return Ok(resumen);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener el resumen de producción");
                return StatusCode(500, new { message = "Error interno del servidor al obtener el resumen de producción" });
            }
        }

        /// <summary>
        /// Registra una nueva producción de leche
        /// </summary>
        [HttpPost]
        public async Task<ActionResult<ProduccionLecheDTO>> PostProduccionLeche(ProduccionLecheCreacionDTO produccionDto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                // Verificar que el animal exista y esté activo
                var animal = await _context.Animales
                    .FirstOrDefaultAsync(a => a.Id == produccionDto.AnimalId && a.Activo);

                if (animal == null)
                {
                    return BadRequest("Animal no encontrado o inactivo");
                }

                var produccion = new ProduccionLeche
                {
                    AnimalId = produccionDto.AnimalId,
                    Fecha = produccionDto.Fecha,
                    CantidadLitros = produccionDto.CantidadLitros,
                    Turno = produccionDto.Turno,
                    Observaciones = produccionDto.Observaciones
                };

                _context.ProduccionesLeche.Add(produccion);
                await _context.SaveChangesAsync();

                var produccionCreada = new ProduccionLecheDTO
                {
                    Id = produccion.Id,
                    AnimalId = produccion.AnimalId,
                    NombreAnimal = animal.Nombre,
                    NumeroIdentificacion = animal.NumeroIdentificacion,
                    Fecha = produccion.Fecha,
                    CantidadLitros = produccion.CantidadLitros,
                    Turno = produccion.Turno,
                    Observaciones = produccion.Observaciones
                };

                return CreatedAtAction(nameof(GetProduccionLeche), new { id = produccion.Id }, produccionCreada);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al registrar la producción de leche");
                return StatusCode(500, new { message = "Error interno del servidor al registrar la producción de leche" });
            }
        }

        /// <summary>
        /// Obtiene una producción de leche por su ID
        /// </summary>
        [HttpGet("{id}")]
        public async Task<ActionResult<ProduccionLecheDTO>> GetProduccionLeche(int id)
        {
            try
            {
                var produccion = await _context.ProduccionesLeche
                    .Include(p => p.Animal)
                    .Where(p => p.Id == id)
                    .Select(p => new ProduccionLecheDTO
                    {
                        Id = p.Id,
                        AnimalId = p.AnimalId,
                        NombreAnimal = p.Animal.Nombre,
                        NumeroIdentificacion = p.Animal.NumeroIdentificacion,
                        Fecha = p.Fecha,
                        CantidadLitros = p.CantidadLitros,
                        Turno = p.Turno,
                        Observaciones = p.Observaciones
                    })
                    .FirstOrDefaultAsync();

                if (produccion == null)
                {
                    return NotFound();
                }

                return Ok(produccion);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error al obtener la producción de leche con ID {id}");
                return StatusCode(500, new { message = "Error interno del servidor al obtener la producción de leche" });
            }
        }

        /// <summary>
        /// Actualiza una producción de leche
        /// </summary>
        [HttpPut("{id}")]
        public async Task<ActionResult<ProduccionLecheDTO>> PutProduccionLeche(int id, ProduccionLecheCreacionDTO produccionDto)
        {
            try
            {
                if (id != produccionDto.Id)
                {
                    return BadRequest("ID de la producción no coincide");
                }

                var produccion = await _context.ProduccionesLeche.FindAsync(id);
                if (produccion == null)
                {
                    return NotFound("Producción no encontrada");
                }

                // Verificar que el animal exista y esté activo
                var animal = await _context.Animales
                    .FirstOrDefaultAsync(a => a.Id == produccionDto.AnimalId && a.Activo);

                if (animal == null)
                {
                    return BadRequest("Animal no encontrado o inactivo");
                }

                produccion.AnimalId = produccionDto.AnimalId;
                produccion.Fecha = produccionDto.Fecha;
                produccion.CantidadLitros = produccionDto.CantidadLitros;
                produccion.Turno = produccionDto.Turno;
                produccion.Observaciones = produccionDto.Observaciones;

                _context.Entry(produccion).State = EntityState.Modified;
                await _context.SaveChangesAsync();

                var produccionActualizada = new ProduccionLecheDTO
                {
                    Id = produccion.Id,
                    AnimalId = produccion.AnimalId,
                    NombreAnimal = animal.Nombre,
                    NumeroIdentificacion = animal.NumeroIdentificacion,
                    Fecha = produccion.Fecha,
                    CantidadLitros = produccion.CantidadLitros,
                    Turno = produccion.Turno,
                    Observaciones = produccion.Observaciones
                };

                return Ok(produccionActualizada);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error al actualizar la producción de leche con ID {id}");
                return StatusCode(500, new { message = "Error interno del servidor al actualizar la producción de leche" });
            }
        }

        /// <summary>
        /// Elimina una producción de leche
        /// </summary>
        [HttpDelete("{id}")]
        public async Task<ActionResult> DeleteProduccionLeche(int id)
        {
            try
            {
                var produccion = await _context.ProduccionesLeche.FindAsync(id);
                if (produccion == null)
                {
                    return NotFound("Producción no encontrada");
                }

                _context.ProduccionesLeche.Remove(produccion);
                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error al eliminar la producción de leche con ID {id}");
                return StatusCode(500, new { message = "Error interno del servidor al eliminar la producción de leche" });
            }
        }
    }

    // Los DTOs principales han sido movidos a la carpeta DTOs/ProduccionLecheDTOs.cs
}