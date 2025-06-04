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
    public class OtrosGastosController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IMapper _mapper;

        public OtrosGastosController(ApplicationDbContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        // GET: api/OtrosGastos
        [HttpGet]
        public async Task<ActionResult<IEnumerable<OtroGastoDTO>>> GetOtrosGastos(
            [FromQuery] string? categoria = null,
            [FromQuery] DateTime? fechaInicio = null,
            [FromQuery] DateTime? fechaFin = null)
        {
            IQueryable<OtroGasto> query = _context.OtrosGastos
                .OrderByDescending(g => g.Fecha);

            if (!string.IsNullOrEmpty(categoria))
            {
                query = query.Where(g => g.Categoria == categoria);
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
            return Ok(_mapper.Map<List<OtroGastoDTO>>(gastos));
        }

        // GET: api/OtrosGastos/5
        [HttpGet("{id}")]
        public async Task<ActionResult<OtroGastoDTO>> GetOtroGasto(int id)
        {
            var gasto = await _context.OtrosGastos.FindAsync(id);

            if (gasto == null)
            {
                return NotFound();
            }

            return _mapper.Map<OtroGastoDTO>(gasto);
        }

        // GET: api/OtrosGastos/categorias
        [HttpGet("categorias")]
        public async Task<ActionResult<IEnumerable<string>>> GetCategoriasGastos()
        {
            var categorias = await _context.OtrosGastos
                .Select(g => g.Categoria)
                .Distinct()
                .OrderBy(c => c)
                .ToListAsync();
                
            return Ok(categorias);
        }

        // POST: api/OtrosGastos
        [HttpPost]
        public async Task<ActionResult<OtroGastoDTO>> PostOtroGasto(OtroGastoCreacionDTO gastoCreacionDTO)
        {
            var gasto = _mapper.Map<OtroGasto>(gastoCreacionDTO);
            gasto.FechaCreacion = DateTime.UtcNow;
            
            _context.OtrosGastos.Add(gasto);
            await _context.SaveChangesAsync();

            var gastoDTO = _mapper.Map<OtroGastoDTO>(gasto);
            
            return CreatedAtAction(nameof(GetOtroGasto), new { id = gasto.Id }, gastoDTO);
        }

        // PUT: api/OtrosGastos/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutOtroGasto(int id, OtroGastoCreacionDTO gastoActualizacionDTO)
        {
            var gasto = await _context.OtrosGastos.FindAsync(id);
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
                if (!OtroGastoExists(id))
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

        // DELETE: api/OtrosGastos/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteOtroGasto(int id)
        {
            var gasto = await _context.OtrosGastos.FindAsync(id);
            if (gasto == null)
            {
                return NotFound();
            }


            _context.OtrosGastos.Remove(gasto);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool OtroGastoExists(int id)
        {
            return _context.OtrosGastos.Any(e => e.Id == id);
        }
    }
}
