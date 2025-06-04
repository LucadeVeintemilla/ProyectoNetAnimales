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
    public class VentasController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IMapper _mapper;

        public VentasController(ApplicationDbContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        // GET: api/Ventas
        [HttpGet]
        public async Task<ActionResult<IEnumerable<VentaDTO>>> GetVentas()
        {
            var ventas = await _context.Ventas
                .Include(v => v.Animal)
                .OrderByDescending(v => v.FechaVenta)
                .ToListAsync();
                
            return Ok(_mapper.Map<List<VentaDTO>>(ventas));
        }

        // GET: api/Ventas/5
        [HttpGet("{id}")]
        public async Task<ActionResult<VentaDTO>> GetVenta(int id)
        {
            var venta = await _context.Ventas
                .Include(v => v.Animal)
                .FirstOrDefaultAsync(v => v.Id == id);

            if (venta == null)
            {
                return NotFound();
            }

            return _mapper.Map<VentaDTO>(venta);
        }

        // POST: api/Ventas
        [HttpPost]
        public async Task<ActionResult<VentaDTO>> PostVenta(VentaCreacionDTO ventaCreacionDTO)
        {
            var animal = await _context.Animales.FindAsync(ventaCreacionDTO.AnimalId);
            if (animal == null)
            {
                return BadRequest("El animal especificado no existe.");
            }

            var venta = _mapper.Map<Venta>(ventaCreacionDTO);
            venta.FechaCreacion = DateTime.UtcNow;
            
            _context.Ventas.Add(venta);
            
            // Marcar el animal como inactivo al venderlo
            animal.Activo = false;
            _context.Entry(animal).State = EntityState.Modified;
            
            await _context.SaveChangesAsync();

            var ventaDTO = _mapper.Map<VentaDTO>(venta);
            
            return CreatedAtAction(nameof(GetVenta), new { id = venta.Id }, ventaDTO);
        }

        // DELETE: api/Ventas/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteVenta(int id)
        {
            var venta = await _context.Ventas.FindAsync(id);
            if (venta == null)
            {
                return NotFound();
            }

            _context.Ventas.Remove(venta);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool VentaExists(int id)
        {
            return _context.Ventas.Any(e => e.Id == id);
        }
    }
}
