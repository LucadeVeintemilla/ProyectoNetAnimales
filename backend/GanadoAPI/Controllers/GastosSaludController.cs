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

namespace GanadoAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class GastosSaludController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IMapper _mapper;

        public GastosSaludController(ApplicationDbContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        // GET: api/GastosSalud
        [HttpGet]
        public async Task<ActionResult<IEnumerable<GastoSaludDTO>>> GetGastosSalud(
            [FromQuery] int? animalId = null,
            [FromQuery] DateTime? fechaInicio = null,
            [FromQuery] DateTime? fechaFin = null)
        {
            IQueryable<GastoSalud> query = _context.GastosSalud
                .Include(g => g.Animal)
                .OrderByDescending(g => g.Fecha);

            if (animalId.HasValue)
            {
                query = query.Where(g => g.AnimalId == animalId.Value);
            }

            if (fechaInicio.HasValue)
            {
                query = query.Where(g => g.Fecha >= fechaInicio.Value);
            }

            if (fechaFin.HasValue)
            {
                query = query.Where(g => g.Fecha <= fechaFin.Value);
            }

            var gastos = await query.ToListAsync();
            return Ok(_mapper.Map<List<GastoSaludDTO>>(gastos));
        }

        // GET: api/GastosSalud/5
        [HttpGet("{id}")]
        public async Task<ActionResult<GastoSaludDTO>> GetGastoSalud(int id)
        {
            var gasto = await _context.GastosSalud
                .Include(g => g.Animal)
                .FirstOrDefaultAsync(g => g.Id == id);

            if (gasto == null)
            {
                return NotFound();
            }

            return _mapper.Map<GastoSaludDTO>(gasto);
        }

        // POST: api/GastosSalud
        [HttpPost]
        public async Task<ActionResult<GastoSaludDTO>> PostGastoSalud(GastoSaludCreacionDTO gastoCreacionDTO)
        {
            var animal = await _context.Animales.FindAsync(gastoCreacionDTO.AnimalId);
            if (animal == null)
            {
                return BadRequest("El animal especificado no existe.");
            }

            var gasto = _mapper.Map<GastoSalud>(gastoCreacionDTO);
            gasto.FechaCreacion = DateTime.UtcNow;
            
            _context.GastosSalud.Add(gasto);
            await _context.SaveChangesAsync();

            var gastoDTO = _mapper.Map<GastoSaludDTO>(gasto);
            
            return CreatedAtAction(nameof(GetGastoSalud), new { id = gasto.Id }, gastoDTO);
        }

        // PUT: api/GastosSalud/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutGastoSalud(int id, GastoSaludCreacionDTO gastoActualizacionDTO)
        {
            var gasto = await _context.GastosSalud.FindAsync(id);
            if (gasto == null)
            {
                return NotFound();
            }

            _mapper.Map(gastoActualizacionDTO, gasto);
            gasto.FechaActualizacion = DateTime.UtcNow;
            
            _context.Entry(gasto).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!GastoSaludExists(id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return NoContent();
        }

        // DELETE: api/GastosSalud/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteGastoSalud(int id)
        {
            var gasto = await _context.GastosSalud.FindAsync(id);
            if (gasto == null)
            {
                return NotFound();
            }

            _context.GastosSalud.Remove(gasto);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool GastoSaludExists(int id)
        {
            return _context.GastosSalud.Any(e => e.Id == id);
        }
    }
}
