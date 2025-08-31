using System.Threading.Tasks;
using GanadoAPI.Data;
using GanadoAPI.DTOs;
using GanadoAPI.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System;

namespace GanadoAPI.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class AnimalesController : BaseApiController
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<AnimalesController> _logger;

        public AnimalesController(ApplicationDbContext context, ILogger<AnimalesController> logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// Obtiene todos los animales con paginación y búsqueda
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<PagedResult<AnimalDTO>>> GetAnimales(
            [FromQuery] int page = 1, 
            [FromQuery] int pageSize = 10, 
            [FromQuery] string search = "",
            [FromQuery(Name = "status")] string status = "activos")
        {
            try
            {
                _logger.LogInformation($"Getting animales with status: {status}, page: {page}, pageSize: {pageSize}, search: {search}");
                
                var query = _context.Animales
                    .Include(a => a.Raza)
                    .AsQueryable();

                // Log total count before filtering
                var totalBeforeFilter = await query.CountAsync();
                _logger.LogInformation($"Total animales before filtering: {totalBeforeFilter}");

                // Filtrar por estado
                _logger.LogInformation($"Applying status filter: {status}");
                if (string.Equals(status, "activos", StringComparison.OrdinalIgnoreCase))
                {
                    query = query.Where(a => a.Activo);
                    _logger.LogInformation("Filtering for active animals only");
                }
                else if (string.Equals(status, "inactivos", StringComparison.OrdinalIgnoreCase))
                {
                    query = query.Where(a => !a.Activo);
                    _logger.LogInformation("Filtering for inactive animals only");
                }
                else if (string.Equals(status, "todos", StringComparison.OrdinalIgnoreCase))
                {
                    _logger.LogInformation("No status filter applied - showing all animals");
                }
                else
                {
                    _logger.LogWarning($"Unknown status filter: {status}. Defaulting to active animals");
                    query = query.Where(a => a.Activo);
                }

                // Log count after status filter
                var countAfterStatusFilter = await query.CountAsync();
                _logger.LogInformation($"Animales count after status filter: {countAfterStatusFilter}");

                // Aplicar búsqueda si se proporciona
                if (!string.IsNullOrEmpty(search))
                {
                    search = search.ToLower();
                    query = query.Where(a => 
                        a.NumeroIdentificacion.ToLower().Contains(search) ||
                        a.Nombre.ToLower().Contains(search) ||
                        (a.Raza != null && a.Raza.Nombre.ToLower().Contains(search)));
                }

                // Obtener el total de registros
                var totalCount = await query.CountAsync();

                // Log the final query
                var sql = query.ToQueryString();
                _logger.LogInformation($"SQL Query: {sql}");

                // Aplicar paginación
                var items = await query
                    .OrderBy(a => a.NumeroIdentificacion)
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .Select(a => new AnimalDTO
                    {
                        Id = a.Id,
                        NumeroIdentificacion = a.NumeroIdentificacion,
                        Nombre = a.Nombre,
                        FechaNacimiento = a.FechaNacimiento,
                        Sexo = a.Sexo,
                        Estado = a.Estado,
                        Categoria = a.Categoria,
                        TipoAdquisicion = a.TipoAdquisicion,
                        Ubicacion = a.Ubicacion,
                        RazaId = a.RazaId,
                        RazaNombre = a.Raza != null ? a.Raza.Nombre : "Sin especificar",
                        Activo = a.Activo // Asegurémonos de incluir esto
                    })
                    .ToListAsync();

                _logger.LogInformation($"Returning {items.Count} items out of {totalCount} total");

                return Ok(new PagedResult<AnimalDTO>
                {
                    Items = items,
                    TotalCount = totalCount,
                    PageNumber = page,
                    PageSize = pageSize
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener la lista de animales");
                return StatusCode(500, new { message = "Error interno del servidor al obtener animales" });
            }
        }

        /// <summary>
        /// Obtiene un animal por su ID
        /// </summary>
        [HttpGet("{id}")]
        public async Task<ActionResult<AnimalDTO>> GetAnimal(int id)
        {
            try
            {
                var animal = await _context.Animales
                    .Include(a => a.Raza)
                    .Where(a => a.Id == id) // Removed the Activo filter to allow loading inactive animals
                    .Select(a => new AnimalDTO
                    {
                        Id = a.Id,
                        NumeroIdentificacion = a.NumeroIdentificacion,
                        Nombre = a.Nombre,
                        FechaNacimiento = a.FechaNacimiento,
                        Sexo = a.Sexo,
                        Estado = a.Estado,
                        Categoria = a.Categoria,
                        TipoAdquisicion = a.TipoAdquisicion,
                        Ubicacion = a.Ubicacion,
                        RazaId = a.RazaId,
                        RazaNombre = a.Raza != null ? a.Raza.Nombre : "Sin especificar",
                        PadreId = a.PadreId,
                        MadreId = a.MadreId,
                        Observaciones = a.Observaciones,
                        Activo = a.Activo // Include the Activo status in the response
                    })
                    .FirstOrDefaultAsync();

                if (animal == null)
                {
                    return NotFound();
                }

                return Ok(animal);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error al obtener el animal con ID {id}");
                return StatusCode(500, new { message = "Error interno del servidor al obtener el animal" });
            }
        }

        /// <summary>
        /// Crea un nuevo animal
        /// </summary>
        [HttpPost]
        public async Task<ActionResult<AnimalDTO>> PostAnimal(AnimalCreacionDTO animalDto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var animal = new Animal
                {
                    NumeroIdentificacion = animalDto.NumeroIdentificacion,
                    Nombre = animalDto.Nombre,
                    FechaNacimiento = animalDto.FechaNacimiento,
                    Sexo = animalDto.Sexo,
                    Estado = animalDto.Estado,
                    TipoAdquisicion = animalDto.TipoAdquisicion,
                    Ubicacion = animalDto.Ubicacion,
                    RazaId = animalDto.RazaId,
                    PadreId = animalDto.PadreId,
                    MadreId = animalDto.MadreId,
                    Observaciones = animalDto.Observaciones,
                    Activo = true,
                    ReproduccionId = animalDto.ReproduccionId
                };

                _context.Animales.Add(animal);
                await _context.SaveChangesAsync();

                // Calcular categoría automática
                animal.Categoria = await CalcularCategoriaAsync(animal);
                _context.Entry(animal).State = EntityState.Modified;
                await _context.SaveChangesAsync();

                var animalCreado = new AnimalDTO
                {
                    Id = animal.Id,
                    NumeroIdentificacion = animal.NumeroIdentificacion,
                    Nombre = animal.Nombre,
                    FechaNacimiento = animal.FechaNacimiento,
                    Sexo = animal.Sexo,
                    Estado = animal.Estado,
                    Categoria = animal.Categoria,
                    TipoAdquisicion = animal.TipoAdquisicion,
                    Ubicacion = animal.Ubicacion,
                    RazaId = animal.RazaId,
                    RazaNombre = (await _context.Razas.FindAsync(animal.RazaId))?.Nombre ?? string.Empty,
                    PadreId = animal.PadreId,
                    MadreId = animal.MadreId,
                    Observaciones = animal.Observaciones
                };

                return CreatedAtAction(nameof(GetAnimal), new { id = animal.Id }, animalCreado);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al crear un nuevo animal");
                return StatusCode(500, new { message = "Error interno del servidor al crear el animal" });
            }
        }

        /// <summary>
        /// Actualiza un animal existente
        /// </summary>
        [HttpPut("{id}")]
        public async Task<ActionResult<AnimalDTO>> PutAnimal(int id, AnimalActualizacionDTO animalDto)
        {
            try
            {
                if (id != animalDto.Id)
                {
                    return BadRequest("ID del animal no coincide");
                }

                var animal = await _context.Animales.FindAsync(id);
                if (animal == null)
                {
                    return NotFound("Animal no encontrado");
                }


                // Actualizar solo los campos que se permiten modificar
                animal.NumeroIdentificacion = animalDto.NumeroIdentificacion;
                animal.Nombre = animalDto.Nombre;
                animal.FechaNacimiento = animalDto.FechaNacimiento;
                animal.Sexo = animalDto.Sexo;
                animal.Estado = animalDto.Estado;
                animal.TipoAdquisicion = animalDto.TipoAdquisicion;
                animal.Ubicacion = animalDto.Ubicacion;
                animal.RazaId = animalDto.RazaId;
                animal.PadreId = animalDto.PadreId;
                animal.MadreId = animalDto.MadreId;
                animal.Observaciones = animalDto.Observaciones;
                // No actualizamos el campo Activo aquí para evitar que se cambie al editar
                // El estado activo solo debe cambiarse mediante el endpoint específico para activar/desactivar

                _context.Entry(animal).State = EntityState.Modified;
                await _context.SaveChangesAsync();

                // Recalcular categoría si cambian datos clave
                animal.Categoria = await CalcularCategoriaAsync(animal);
                _context.Entry(animal).State = EntityState.Modified;
                await _context.SaveChangesAsync();

                // Devolver el animal actualizado
                var animalActualizado = new AnimalDTO
                {
                    Id = animal.Id,
                    NumeroIdentificacion = animal.NumeroIdentificacion,
                    Nombre = animal.Nombre,
                    FechaNacimiento = animal.FechaNacimiento,
                    Sexo = animal.Sexo,
                    Estado = animal.Estado,
                    Categoria = animal.Categoria,
                    TipoAdquisicion = animal.TipoAdquisicion,
                    Ubicacion = animal.Ubicacion,
                    RazaId = animal.RazaId,
                    RazaNombre = (await _context.Razas.FindAsync(animal.RazaId))?.Nombre,
                    PadreId = animal.PadreId,
                    MadreId = animal.MadreId,
                    Activo = animal.Activo,
                    
                };

                return Ok(animalActualizado);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error al actualizar el animal con ID {id}");
                return StatusCode(500, new { message = "Error interno del servidor al actualizar el animal" });
            }
        }

        private async Task<string> CalcularCategoriaAsync(Animal animal)
        {
            try
            {
                var hoy = DateTime.UtcNow.Date;
                var dias = (hoy - animal.FechaNacimiento.Date).TotalDays;
                var sexo = (animal.Sexo ?? "").ToUpperInvariant();

                // Toro
                if (sexo == "M" && dias > 1080) return "Toro";

                // Datos de reproducción (solo hembras)
                DateTime hace8Meses = hoy.AddMonths(-8);
                bool estaPrenada = false;
                bool tuvoPartoReciente = false;
                bool tieneCriaRegistrada = false;
                bool paridaPrenada = false;

                if (sexo == "H")
                {
                    var reproducciones = await _context.Reproducciones
                        .Where(r => r.HembraId == animal.Id)
                        .OrderByDescending(r => r.FechaRealParto)
                        .ToListAsync();

                    // Confirmación de preñez (palpación efectiva)
                    estaPrenada = await _context.Reproducciones
                        .AnyAsync(r => r.HembraId == animal.Id && r.FechaConfirmacionPrenez != null && (r.Resultado == null || r.Resultado == "Preñada"));

                    var ultimoParto = reproducciones.FirstOrDefault(r => r.FechaRealParto != null);
                    if (ultimoParto?.FechaRealParto != null)
                    {
                        tuvoPartoReciente = ultimoParto.FechaRealParto.Value.Date >= hace8Meses;
                        if (tuvoPartoReciente)
                        {
                            // Verificar cría registrada para ese evento
                            tieneCriaRegistrada = await _context.Animales.AnyAsync(a => a.ReproduccionId == ultimoParto.Id);

                            // Parida preñada: hay confirmación de preñez luego del parto dentro de 8 meses
                            if (estaPrenada)
                            {
                                var confirmacionPostParto = await _context.Reproducciones.AnyAsync(r => r.HembraId == animal.Id && r.FechaConfirmacionPrenez != null && r.FechaConfirmacionPrenez >= ultimoParto.FechaRealParto);
                                paridaPrenada = confirmacionPostParto;
                            }
                        }
                    }
                }

                // Reglas por prioridad
                if (sexo == "H" && tuvoPartoReciente && tieneCriaRegistrada)
                {
                    if (paridaPrenada) return "Parida preñada";
                    return "Parida vacía";
                }

                if (sexo == "H" && estaPrenada)
                {
                    return "Preñada";
                }

                if (dias <= 240) return "Becerro";

                if (dias > 240 && dias <= 365)
                {
                    if (sexo == "H") return "Novillas destete";
                    if (sexo == "M") return "Novillos destete";
                }

                if (dias > 365 && dias <= 600)
                {
                    if (sexo == "H") return "Novillas levante";
                    if (sexo == "M") return "Novillos levante";
                }

                if (dias > 600 && dias <= 1080)
                {
                    if (sexo == "H") return "Novillas vientre";
                    if (sexo == "M") return "Novillos ceba";
                }

                if (sexo == "H" && dias > 1080)
                {
                    return "Vacía"; // >1080 días y no marcada preñada arriba
                }

                return animal.Categoria ?? "";
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error calculando categoría para animal {animal.Id}");
                return animal.Categoria ?? string.Empty;
            }
        }

        /// <summary>
        /// Elimina un animal (borrado lógico)
        /// </summary>
        [HttpDelete("{id}")]
        public async Task<ActionResult> DeleteAnimal(int id)
        {
            try
            {
                var animal = await _context.Animales.FindAsync(id);
                if (animal == null || !animal.Activo)
                {
                    return NotFound("Animal no encontrado o ya eliminado");
                }

                // Borrado lógico
                animal.Activo = false;
                _context.Entry(animal).State = EntityState.Modified;
                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error al eliminar el animal con ID {id}");
                return StatusCode(500, new { message = "Error interno del servidor al eliminar el animal" });
            }
        }

        /// <summary>
        /// Obtiene la producción de leche de un animal
        /// </summary>
        [HttpGet("{id}/produccion-leche")]
        public async Task<ActionResult<IEnumerable<ProduccionLecheDTO>>> GetProduccionLeche(int id, [FromQuery] DateTime? fechaInicio = null, [FromQuery] DateTime? fechaFin = null)
        {
            try
            {
                var query = _context.ProduccionesLeche
                    .Where(p => p.AnimalId == id);

                if (fechaInicio.HasValue)
                {
                    query = query.Where(p => p.Fecha >= fechaInicio.Value.Date);
                }

                if (fechaFin.HasValue)
                {
                    query = query.Where(p => p.Fecha <= fechaFin.Value.Date.AddDays(1).AddTicks(-1));
                }

                var producciones = await query
                    .OrderByDescending(p => p.Fecha)
                    .Select(p => new ProduccionLecheDTO
                    {
                        Id = p.Id,
                        Fecha = p.Fecha,
                        CantidadLitros = p.CantidadLitros,
                        Turno = p.Turno,
                        Observaciones = p.Observaciones
                    })
                    .ToListAsync();

                return Ok(producciones);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error al obtener la producción de leche del animal con ID {id}");
                return StatusCode(500, new { message = "Error interno del servidor al obtener la producción de leche" });
            }
        }
    }

    public class ProduccionLecheDTO
    {
        public int Id { get; set; }

        public int AnimalId { get; set; } // Agregar esta propiedad
        public string NombreAnimal { get; set; } = null!; // Agregar esta propiedad
        public string NumeroIdentificacion { get; set; } = null!; // Agregar esta propiedad
        public DateTime Fecha { get; set; }
        public decimal CantidadLitros { get; set; }
        public string? Turno { get; set; }
        public string? Observaciones { get; set; }
    }
}
