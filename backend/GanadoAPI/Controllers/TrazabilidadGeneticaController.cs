using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
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
    public class TrazabilidadGeneticaController : BaseApiController
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<TrazabilidadGeneticaController> _logger;

        public TrazabilidadGeneticaController(
            ApplicationDbContext context, 
            ILogger<TrazabilidadGeneticaController> logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// Obtiene el árbol genealógico de un animal
        /// </summary>
        [HttpGet("arbol-genealogico/{animalId}")]
        public async Task<ActionResult<ArbolGenealogicoDTO>> GetArbolGenealogico(int animalId, [FromQuery] int niveles = 3)
        {
            try
            {
                if (niveles < 1 || niveles > 5)
                {
                    return BadRequest("El número de niveles debe estar entre 1 y 5");
                }

                var animal = await _context.Animales
                    .Include(a => a.Raza)
                    .FirstOrDefaultAsync(a => a.Id == animalId && a.Activo);

                if (animal == null)
                {
                    return NotFound("Animal no encontrado o inactivo");
                }

                var arbol = new ArbolGenealogicoDTO
                {
                    Animal = MapearAnimalADTO(animal),
                    Niveles = niveles,
                    FechaGeneracion = DateTime.Now,
                    Ancestros = new List<ArbolGenealogicoNodoDTO>()
                };

                // Cargar ancestros recursivamente
                var padre = await ObtenerAncestroAsync(animal.PadreId, 1, niveles);
                var madre = await ObtenerAncestroAsync(animal.MadreId, 1, niveles);
                
                if (padre != null) arbol.Ancestros.Add(padre);
                if (madre != null) arbol.Ancestros.Add(madre);

                return Ok(arbol);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error al generar el árbol genealógico para el animal {animalId}");
                return StatusCode(500, "Error interno al generar el árbol genealógico");
            }
        }

        /// <summary>
        /// Obtiene el coeficiente de consanguinidad de un animal
        /// </summary>
        [HttpGet("coeficiente-consanguinidad/{animalId}")]
        public async Task<ActionResult<CoeficienteConsanguinidadDTO>> GetCoeficienteConsanguinidad(int animalId)
        {
            try
            {
                var animal = await _context.Animales
                    .FirstOrDefaultAsync(a => a.Id == animalId && a.Activo);

                if (animal == null)
                {
                    return NotFound("Animal no encontrado o inactivo");
                }

                decimal coeficiente = await CalcularCoeficienteConsanguinidadAsync(animalId);
                return Ok(new CoeficienteConsanguinidadDTO
                { 
                    AnimalId = animalId,
                    Nombre = animal.Nombre,
                    CoeficienteConsanguinidad = coeficiente,
                    FechaCalculo = DateTime.Now
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error al calcular el coeficiente de consanguinidad para el animal {animalId}");
                return StatusCode(500, "Error interno al calcular el coeficiente de consanguinidad");
            }
        }

        #region Métodos Auxiliares

        private async Task<ArbolGenealogicoNodoDTO> ObtenerAncestroAsync(int? animalId, int nivelActual, int nivelMaximo)
        {
            if (animalId == null || nivelActual >= nivelMaximo)
                return null;

            var animal = await _context.Animales
                .Include(a => a.Raza)
                .FirstOrDefaultAsync(a => a.Id == animalId);

            if (animal == null)
                return null;

            var nodo = new ArbolGenealogicoNodoDTO
            {
                Animal = MapearAnimalADTO(animal),
                Nivel = nivelActual
            };

            // Cargar ancestros recursivamente
            nodo.Padre = await ObtenerAncestroAsync(animal.PadreId, nivelActual + 1, nivelMaximo);
            nodo.Madre = await ObtenerAncestroAsync(animal.MadreId, nivelActual + 1, nivelMaximo);

            return nodo;
        }

        private async Task<decimal> CalcularCoeficienteConsanguinidadAsync(int animalId, int maxGeneraciones = 5)
        {
            // Implementación simplificada del cálculo de coeficiente de consanguinidad
            // En una implementación real, se usaría el método de Wright o un algoritmo más preciso
            var ancestros = new Dictionary<int, int>(); // ID del ancestro -> generación
            await ContarAncestros(animalId, 0, maxGeneraciones, ancestros);

            // Contar ancestros duplicados (aparecen más de una vez en el árbol genealógico)
            var ancestrosComunes = ancestros
                .GroupBy(a => a.Key)
                .Where(g => g.Count() > 1)
                .ToList();

            if (!ancestrosComunes.Any())
                return 0;

            // Cálculo simplificado del coeficiente de consanguinidad
            decimal coeficiente = 0;
            foreach (var grupo in ancestrosComunes)
            {
                // Cuanto más cercano sea el ancestro común, mayor será la contribución al coeficiente
                int generacion = grupo.Min(g => g.Value);
                coeficiente += (decimal)(1 / Math.Pow(2, generacion + 1));
            }

            return Math.Round(coeficiente * 100, 2); // Convertir a porcentaje
        }

        private async Task ContarAncestros(int? animalId, int generacion, int maxGeneraciones, Dictionary<int, int> ancestros)
        {
            if (animalId == null || generacion > maxGeneraciones)
                return;

            if (ancestros.ContainsKey(animalId.Value))
            {
                ancestros[animalId.Value] = Math.Min(ancestros[animalId.Value], generacion);
            }
            else
            {
                ancestros[animalId.Value] = generacion;
            }

            // Obtener padre y madre
            var animal = await _context.Animales
                .Where(a => a.Id == animalId)
                .Select(a => new { a.PadreId, a.MadreId })
                .FirstOrDefaultAsync();

            if (animal == null)
                return;

            // Contar ancestros recursivamente
            await ContarAncestros(animal.PadreId, generacion + 1, maxGeneraciones, ancestros);
            await ContarAncestros(animal.MadreId, generacion + 1, maxGeneraciones, ancestros);
        }

        private AnimalDTO MapearAnimalADTO(Animal animal)
        {
            if (animal == null) return null;

            return new AnimalDTO
            {
                Id = animal.Id,
                NumeroIdentificacion = animal.NumeroIdentificacion,
                Nombre = animal.Nombre,
                FechaNacimiento = animal.FechaNacimiento,
                Sexo = animal.Sexo,
                Estado = animal.Estado,
                RazaId = animal.RazaId,
                RazaNombre = animal.Raza?.Nombre
            };
        }

        #endregion
    }

    public class ArbolGenealogicoDTO
    {
        public AnimalDTO Animal { get; set; }
        public int Niveles { get; set; }
        public DateTime FechaGeneracion { get; set; }
        public List<ArbolGenealogicoNodoDTO> Ancestros { get; set; }
    }

    public class ArbolGenealogicoNodoDTO
    {
        public AnimalDTO Animal { get; set; }
        public int Nivel { get; set; }
        public ArbolGenealogicoNodoDTO Padre { get; set; }
        public ArbolGenealogicoNodoDTO Madre { get; set; }
    }

    public class CoeficienteConsanguinidadDTO
    {
        public int AnimalId { get; set; }
        public string Nombre { get; set; }
        public decimal CoeficienteConsanguinidad { get; set; }
        public DateTime FechaCalculo { get; set; }
    }
}
