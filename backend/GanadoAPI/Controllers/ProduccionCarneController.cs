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
    public class ProduccionCarneController : BaseApiController
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<ProduccionCarneController> _logger;

        public ProduccionCarneController(ApplicationDbContext context, ILogger<ProduccionCarneController> logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// Obtiene todos los registros de producción de carne con paginación y filtros
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<PagedResult<ProduccionCarneDTO>>> GetProduccionesCarne(
            [FromQuery] int page = 1, 
            [FromQuery] int pageSize = 10,
            [FromQuery] DateTime? fechaInicio = null,
            [FromQuery] DateTime? fechaFin = null,
            [FromQuery] int? animalId = null)
        {
            try
            {
                var query = _context.ProduccionesCarne
                    .Include(p => p.Animal)
                    .AsQueryable();

                // Aplicar filtros
                if (fechaInicio.HasValue)
                {
                    query = query.Where(p => p.FechaSacrificio >= fechaInicio.Value.Date);
                }

                if (fechaFin.HasValue)
                {
                    var endOfDay = fechaFin.Value.Date.AddDays(1).AddTicks(-1);
                    query = query.Where(p => p.FechaSacrificio <= endOfDay);
                }

                if (animalId.HasValue)
                {
                    query = query.Where(p => p.AnimalId == animalId.Value);
                }

                // Obtener el total de registros
                var totalCount = await query.CountAsync();

                // Aplicar paginación
                var items = await query
                    .OrderByDescending(p => p.FechaSacrificio)
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .Select(p => new ProduccionCarneDTO
                    {
                        Id = p.Id,
                        AnimalId = p.AnimalId,
                        NombreAnimal = p.Animal.Nombre,
                        NumeroIdentificacion = p.Animal.NumeroIdentificacion,
                        FechaSacrificio = p.FechaSacrificio,
                        PesoVivo = p.PesoVivo,
                        PesoCanal = p.PesoCanal,
                        RendimientoCarnico = p.RendimientoCarnico,
                        Destino = p.Destino,
                        Observaciones = p.Observaciones
                    })
                    .ToListAsync();

                var result = new PagedResult<ProduccionCarneDTO>
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
                _logger.LogError(ex, "Error al obtener la lista de producciones de carne");
                return StatusCode(500, new { message = "Error interno del servidor al obtener las producciones de carne" });
            }
        }

        /// <summary>
        /// Obtiene un registro de producción de carne por su ID
        /// </summary>
        [HttpGet("{id}")]
        public async Task<ActionResult<ProduccionCarneDTO>> GetProduccionCarne(int id)
        {
            try
            {
                var produccionCarne = await _context.ProduccionesCarne
                    .Include(p => p.Animal)
                    .FirstOrDefaultAsync(p => p.Id == id);

                if (produccionCarne == null)
                {
                    return NotFound(new { message = "Registro de producción de carne no encontrado" });
                }

                var produccionDTO = new ProduccionCarneDTO
                {
                    Id = produccionCarne.Id,
                    AnimalId = produccionCarne.AnimalId,
                    NombreAnimal = produccionCarne.Animal.Nombre,
                    NumeroIdentificacion = produccionCarne.Animal.NumeroIdentificacion,
                    FechaSacrificio = produccionCarne.FechaSacrificio,
                    PesoVivo = produccionCarne.PesoVivo,
                    PesoCanal = produccionCarne.PesoCanal,
                    RendimientoCarnico = produccionCarne.RendimientoCarnico,
                    Destino = produccionCarne.Destino,
                    Observaciones = produccionCarne.Observaciones
                };

                return Ok(produccionDTO);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener el registro de producción de carne");
                return StatusCode(500, new { message = "Error interno del servidor al obtener el registro" });
            }
        }

        /// <summary>
        /// Obtiene el resumen de producción de carne por período
        /// </summary>
        [HttpGet("resumen")]
        public async Task<ActionResult<ResumenProduccionCarneDTO>> GetResumenProduccion(
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

                // Obtener datos del período
                var datos = await _context.ProduccionesCarne
                    .Where(p => p.FechaSacrificio >= fechaInicio.Date && p.FechaSacrificio <= fechaFin.Date)
                    .ToListAsync();

                var totalAnimales = datos.Count;
                var totalPesoVivo = datos.Sum(p => p.PesoVivo);
                var totalPesoCanal = datos.Sum(p => p.PesoCanal);
                var promedioRendimiento = totalAnimales > 0 ? datos.Average(p => p.RendimientoCarnico) : 0;

                var resumen = new ResumenProduccionCarneDTO
                {
                    FechaInicio = fechaInicio,
                    FechaFin = fechaFin,
                    TotalAnimales = totalAnimales,
                    TotalPesoVivo = totalPesoVivo,
                    TotalPesoCanal = totalPesoCanal,
                    PromedioRendimiento = promedioRendimiento
                };

                return Ok(resumen);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener el resumen de producción de carne");
                return StatusCode(500, new { message = "Error interno del servidor al obtener el resumen de producción" });
            }
        }

        /// <summary>
        /// Registra una nueva producción de carne
        /// </summary>
        [HttpPost]
        public async Task<ActionResult<ProduccionCarneDTO>> PostProduccionCarne(ProduccionCarneCreacionDTO produccionDto)
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

                // Calcular el rendimiento cárnico
                decimal rendimientoCarnico = (produccionDto.PesoCanal / produccionDto.PesoVivo) * 100;
                
                // Crear el registro de producción de carne
                var produccion = new ProduccionCarne
                {
                    AnimalId = produccionDto.AnimalId,
                    FechaSacrificio = produccionDto.FechaSacrificio,
                    PesoVivo = produccionDto.PesoVivo,
                    PesoCanal = produccionDto.PesoCanal,
                    RendimientoCarnico = rendimientoCarnico,
                    Destino = produccionDto.Destino,
                    Observaciones = produccionDto.Observaciones
                };

                _context.ProduccionesCarne.Add(produccion);
                
                // Actualizar el estado del animal a "Sacrificado" ya que ha sido faenado
                animal.Estado = "Sacrificado";
                animal.Activo = false;
                
                await _context.SaveChangesAsync();

                var produccionCreada = new ProduccionCarneDTO
                {
                    Id = produccion.Id,
                    AnimalId = produccion.AnimalId,
                    NombreAnimal = animal.Nombre,
                    NumeroIdentificacion = animal.NumeroIdentificacion,
                    FechaSacrificio = produccion.FechaSacrificio,
                    PesoVivo = produccion.PesoVivo,
                    PesoCanal = produccion.PesoCanal,
                    RendimientoCarnico = produccion.RendimientoCarnico,
                    Destino = produccion.Destino,
                    Observaciones = produccion.Observaciones
                };

                return CreatedAtAction(nameof(GetProduccionCarne), new { id = produccion.Id }, produccionCreada);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al registrar la producción de carne");
                return StatusCode(500, new { message = "Error interno del servidor al registrar la producción de carne" });
            }
        }

        /// <summary>
        /// Actualiza un registro de producción de carne
        /// </summary>
        [HttpPut("{id}")]
        public async Task<IActionResult> PutProduccionCarne(int id, ProduccionCarneCreacionDTO produccionDto)
        {
            try
            {
                var produccion = await _context.ProduccionesCarne.FindAsync(id);
                if (produccion == null)
                {
                    return NotFound(new { message = "Registro de producción de carne no encontrado" });
                }

                // Verificar que el animal exista
                var animal = await _context.Animales.FindAsync(produccionDto.AnimalId);
                if (animal == null)
                {
                    return BadRequest("Animal no encontrado");
                }

                // Actualizar los campos
                produccion.AnimalId = produccionDto.AnimalId;
                produccion.FechaSacrificio = produccionDto.FechaSacrificio;
                produccion.PesoVivo = produccionDto.PesoVivo;
                produccion.PesoCanal = produccionDto.PesoCanal;
                produccion.RendimientoCarnico = (produccionDto.PesoCanal / produccionDto.PesoVivo) * 100;
                produccion.Destino = produccionDto.Destino;
                produccion.Observaciones = produccionDto.Observaciones;

                await _context.SaveChangesAsync();
                
                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al actualizar el registro de producción de carne");
                return StatusCode(500, new { message = "Error interno del servidor al actualizar el registro" });
            }
        }

        /// <summary>
        /// Elimina un registro de producción de carne
        /// </summary>
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteProduccionCarne(int id)
        {
            try
            {
                var produccion = await _context.ProduccionesCarne
                    .Include(p => p.Animal)
                    .FirstOrDefaultAsync(p => p.Id == id);
                
                if (produccion == null)
                {
                    return NotFound(new { message = "Registro de producción de carne no encontrado" });
                }

                // Al eliminar un registro de sacrificio, podríamos revertir el estado del animal
                // Sin embargo, esto es peligroso ya que podría haber acciones subsecuentes.
                // Por seguridad, dejamos el animal como estaba y solo eliminamos el registro.

                _context.ProduccionesCarne.Remove(produccion);
                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al eliminar el registro de producción de carne");
                return StatusCode(500, new { message = "Error interno del servidor al eliminar el registro" });
            }
        }
    }
}
