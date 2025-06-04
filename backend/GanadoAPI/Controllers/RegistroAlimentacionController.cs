using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AutoMapper;
using GanadoAPI.Data;
using GanadoAPI.DTOs;
using GanadoAPI.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace GanadoAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class RegistroAlimentacionController : BaseApiController
    {
        private readonly ApplicationDbContext _context;
        private readonly IMapper _mapper;
        private readonly ILogger<RegistroAlimentacionController> _logger;

        public RegistroAlimentacionController(
            ApplicationDbContext context, 
            IMapper mapper,
            ILogger<RegistroAlimentacionController> logger)
        {
            _context = context;
            _mapper = mapper;
            _logger = logger;
        }

        /// <summary>
        /// Obtiene los registros de alimentación
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<IEnumerable<RegistroAlimentacionDTO>>> GetRegistrosAlimentacion(
            [FromQuery] int? animalId = null,
            [FromQuery] DateTime? fechaInicio = null,
            [FromQuery] DateTime? fechaFin = null)
        {
            try
            {
                IQueryable<RegistroAlimentacion> query = _context.RegistroAlimentacion
                    .Include(r => r.Animal)
                    .OrderByDescending(r => r.Fecha);

                if (animalId.HasValue)
                {
                    query = query.Where(r => r.AnimalId == animalId.Value);
                }

                if (fechaInicio.HasValue)
                {
                    query = query.Where(r => r.Fecha >= fechaInicio.Value);
                }

                if (fechaFin.HasValue)
                {
                    query = query.Where(r => r.Fecha <= fechaFin.Value);
                }

                var registros = await query.ToListAsync();
                return Ok(_mapper.Map<List<RegistroAlimentacionDTO>>(registros));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener los registros de alimentación");
                return StatusCode(500, new { message = "Error interno del servidor al obtener los registros de alimentación" });
            }
        }

        /// <summary>
        /// Obtiene un registro de alimentación por su ID
        /// </summary>
        [HttpGet("{id}")]
        public async Task<ActionResult<RegistroAlimentacionDTO>> GetRegistroAlimentacion(int id)
        {
            try
            {
                var registro = await _context.RegistroAlimentacion
                    .Include(r => r.Animal)
                    .FirstOrDefaultAsync(r => r.Id == id);

                if (registro == null)
                {
                    return NotFound("Registro de alimentación no encontrado");
                }

                return Ok(_mapper.Map<RegistroAlimentacionDTO>(registro));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error al obtener el registro de alimentación con ID {id}");
                return StatusCode(500, new { message = "Error interno del servidor al obtener el registro de alimentación" });
            }
        }

        /// <summary>
        /// Crea un nuevo registro de alimentación
        /// </summary>
        [HttpPost]
        public async Task<ActionResult<RegistroAlimentacionDTO>> PostRegistroAlimentacion(RegistroAlimentacionCreacionDTO registroCreacionDTO)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var animal = await _context.Animales
                    .FirstOrDefaultAsync(a => a.Id == registroCreacionDTO.AnimalId && a.Activo);

                if (animal == null)
                {
                    return BadRequest("El animal especificado no existe o está inactivo");
                }

                var registro = _mapper.Map<RegistroAlimentacion>(registroCreacionDTO);
                registro.FechaCreacion = DateTime.UtcNow;
                
                _context.RegistroAlimentacion.Add(registro);
                await _context.SaveChangesAsync();

                var registroDTO = _mapper.Map<RegistroAlimentacionDTO>(registro);
                
                return CreatedAtAction(nameof(GetRegistroAlimentacion), new { id = registro.Id }, registroDTO);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al crear el registro de alimentación");
                return StatusCode(500, new { message = "Error interno del servidor al crear el registro de alimentación" });
            }
        }

        /// <summary>
        /// Actualiza un registro de alimentación
        /// </summary>
        [HttpPut("{id}")]
        public async Task<ActionResult<RegistroAlimentacionDTO>> PutRegistroAlimentacion(int id, RegistroAlimentacionCreacionDTO registroActualizacionDTO)
        {
            try
            {
                if (id != registroActualizacionDTO.Id)
                {
                    return BadRequest("ID del registro no coincide");
                }

                var registro = await _context.RegistroAlimentacion.FindAsync(id);
                if (registro == null)
                {
                    return NotFound("Registro de alimentación no encontrado");
                }

                var animal = await _context.Animales
                    .FirstOrDefaultAsync(a => a.Id == registroActualizacionDTO.AnimalId && a.Activo);

                if (animal == null)
                {
                    return BadRequest("El animal especificado no existe o está inactivo");
                }

                _mapper.Map(registroActualizacionDTO, registro);
                registro.FechaActualizacion = DateTime.UtcNow;
                
                _context.Entry(registro).State = EntityState.Modified;
                await _context.SaveChangesAsync();

                var registroActualizado = _mapper.Map<RegistroAlimentacionDTO>(registro);
                return Ok(registroActualizado);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error al actualizar el registro de alimentación con ID {id}");
                return StatusCode(500, new { message = "Error interno del servidor al actualizar el registro de alimentación" });
            }
        }

        /// <summary>
        /// Elimina un registro de alimentación
        /// </summary>
        [HttpDelete("{id}")]
        public async Task<ActionResult> DeleteRegistroAlimentacion(int id)
        {
            try
            {
                var registro = await _context.RegistroAlimentacion.FindAsync(id);
                if (registro == null)
                {
                    return NotFound("Registro de alimentación no encontrado");
                }

                _context.RegistroAlimentacion.Remove(registro);
                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error al eliminar el registro de alimentación con ID {id}");
                return StatusCode(500, new { message = "Error interno del servidor al eliminar el registro de alimentación" });
            }
        }
    }
}
