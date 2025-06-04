using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using GanadoAPI.Data;
using GanadoAPI.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace GanadoAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class InformesController : BaseApiController
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<InformesController> _logger;

        public InformesController(
            ApplicationDbContext context, 
            ILogger<InformesController> logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// Genera un informe de productividad del hato lechero
        /// </summary>
        [HttpGet("productividad-hato")]
        public async Task<ActionResult<InformeProductividadDTO>> GetInformeProductividad(
            [FromQuery] DateTime fechaInicio, 
            [FromQuery] DateTime fechaFin)
        {
            try
            {
                if (fechaInicio > fechaFin)
                {
                    return BadRequest("La fecha de inicio no puede ser mayor a la fecha de fin");
                }

                var diasPeriodo = (fechaFin - fechaInicio).Days + 1;
                if (diasPeriodo > 365)
                {
                    return BadRequest("El período no puede ser mayor a un año");
                }

                // Obtener datos de producción
                var produccion = await _context.ProduccionesLeche
                    .Where(p => p.Fecha >= fechaInicio && p.Fecha <= fechaFin)
                    .GroupBy(p => 1)
                    .Select(g => new
                    {
                        TotalLitros = g.Sum(p => p.CantidadLitros),
                        PromedioDiario = g.Average(p => p.CantidadLitros),
                        DiasProduccion = g.Select(p => p.Fecha.Date).Distinct().Count(),
                        CantidadAnimales = g.Select(p => p.AnimalId).Distinct().Count()
                    })
                    .FirstOrDefaultAsync();

                // Obtener datos de reproducción
                var reproduccion = await _context.Reproducciones
                    .Where(r => r.FechaMonta >= fechaInicio && r.FechaMonta <= fechaFin)
                    .GroupBy(r => 1)
                    .Select(g => new
                    {
                        TotalMontas = g.Count(),
                        MontasExitosas = g.Count(r => r.Resultado == "Preñada"),
                        MontasFallidas = g.Count(r => r.Resultado == "No preñada")
                    })
                    .FirstOrDefaultAsync();
                // Obtener datos de salud
                var salud = await _context.ControlesSalud
                    .Where(cs => cs.Fecha >= fechaInicio && cs.Fecha <= fechaFin)
                    .GroupBy(cs => 1)
                    .Select(g => new
                    {
                        TotalControles = g.Count(),
                        AnimalesAtendidos = g.Select(cs => cs.AnimalId).Distinct().Count(),
                        EnfermedadesComunes = g
                            .Where(cs => !string.IsNullOrEmpty(cs.Diagnostico))
                            .GroupBy(cs => cs.Diagnostico)
                            .OrderByDescending(g2 => g2.Count())
                            .Take(5)
                            .Select(g2 => new EnfermedadComunDTO
                            {
                                Nombre = g2.Key,
                                CantidadCasos = g2.Count(),
                                Porcentaje = (decimal)g2.Count() / g.Count() * 100
                            })
                            .ToList()
                    })
                    .FirstOrDefaultAsync();

                // Calcular índices de productividad
                decimal indiceProductividad = 0;
                decimal indiceReproduccion = 0;
                decimal indiceSalud = 0;

                if (produccion != null && produccion.DiasProduccion > 0)
                {
                    indiceProductividad = produccion.TotalLitros / produccion.DiasProduccion;
                }

                if (reproduccion != null && reproduccion.TotalMontas > 0)
                {
                    indiceReproduccion = (decimal)reproduccion.MontasExitosas / reproduccion.TotalMontas * 100;
                }

                var totalAnimales = await _context.Animales.CountAsync(a => a.Activo);
                if (salud != null && totalAnimales > 0)
                {
                    indiceSalud = 100 - ((decimal)salud.TotalControles / (totalAnimales * diasPeriodo) * 100);
                    indiceSalud = Math.Max(0, Math.Min(100, indiceSalud)); // Asegurar que esté entre 0 y 100
                }

                var informe = new InformeProductividadDTO
                {
                    Periodo = new PeriodoDTO { Inicio = fechaInicio, Fin = fechaFin },
                    Produccion = new ProduccionInformeDTO
                    {
                        TotalLitros = produccion?.TotalLitros ?? 0,
                        PromedioDiario = produccion?.PromedioDiario ?? 0,
                        DiasProduccion = produccion?.DiasProduccion ?? 0,
                        CantidadAnimales = produccion?.CantidadAnimales ?? 0,
                        IndiceProductividad = indiceProductividad
                    },
                    Reproduccion = new ReproduccionInformeDTO
                    {
                        TotalMontas = reproduccion?.TotalMontas ?? 0,
                        MontasExitosas = reproduccion?.MontasExitosas ?? 0,
                        MontasFallidas = reproduccion?.MontasFallidas ?? 0,
                        TasaExito = indiceReproduccion
                    },
                    Salud = new SaludInformeDTO
                    {
                        TotalControles = salud?.TotalControles ?? 0,
                        AnimalesAtendidos = salud?.AnimalesAtendidos ?? 0,
                        IndiceSalud = indiceSalud,
                        EnfermedadesComunes = salud?.EnfermedadesComunes ?? new List<EnfermedadComunDTO>()
                    },
                    FechaGeneracion = DateTime.Now
                };

                return Ok(informe);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al generar el informe de productividad");
                return StatusCode(500, "Error interno al generar el informe de productividad");
            }
        }

        /// <summary>
        /// Genera un informe de rentabilidad del hato
        /// </summary>
        [HttpGet("rentabilidad")]
        public async Task<ActionResult<InformeRentabilidadDTO>> GetInformeRentabilidad(
            [FromQuery] int anio)
        {
            try
            {
                var fechaInicio = new DateTime(anio, 1, 1);
                var fechaFin = new DateTime(anio, 12, 31);

                // Obtener ingresos por venta de leche
                var ingresosLeche = await _context.ProduccionesLeche
                    .Where(p => p.Fecha.Year == anio)
                    .SumAsync(p => p.CantidadLitros * 0.5m); // Suponiendo un precio fijo por litro

                // Obtener ingresos por venta de animales
                var ingresosVentas = await _context.Ventas
                    .Where(v => v.FechaVenta.Year == anio)
                    .SumAsync(v => v.PrecioTotal);

                // Obtener costos de alimentación
                var costosAlimentacion = await _context.RegistroAlimentacion
                    .Where(r => r.Fecha.Year == anio)
                    .SumAsync(r => r.CostoTotal);

                // Obtener costos de salud
                var costosSalud = await _context.GastosSalud
                    .Where(g => g.Fecha.Year == anio)
                    .SumAsync(g => g.Monto);

                // Obtener otros costos
                var otrosCostos = await _context.OtrosGastos
                    .Where(g => g.Fecha.Year == anio)
                    .SumAsync(g => g.Monto);

                // Calcular indicadores de rentabilidad
                var ingresosTotales = ingresosLeche + ingresosVentas;
                var costosTotales = costosAlimentacion + costosSalud + otrosCostos;
                var utilidadBruta = ingresosTotales - costosTotales;
                var margenUtilidad = ingresosTotales > 0 ? (utilidadBruta / ingresosTotales) * 100 : 0;

                var informe = new InformeRentabilidadDTO
                {
                    Anio = anio,
                    Ingresos = new IngresosDTO
                    {
                        VentaLeche = ingresosLeche,
                        VentaAnimales = ingresosVentas,
                        Total = ingresosTotales
                    },
                    Costos = new CostosDTO
                    {
                        Alimentacion = costosAlimentacion,
                        Salud = costosSalud,
                        Otros = otrosCostos,
                        Total = costosTotales
                    },
                    UtilidadBruta = utilidadBruta,
                    MargenUtilidad = margenUtilidad,
                    FechaGeneracion = DateTime.Now
                };

                return Ok(informe);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error al generar el informe de rentabilidad para el año {anio}");
                return StatusCode(500, "Error interno al generar el informe de rentabilidad");
            }
        }
    }

    #region DTOs

    public class InformeProductividadDTO
    {
        public PeriodoDTO Periodo { get; set; }
        public ProduccionInformeDTO Produccion { get; set; }
        public ReproduccionInformeDTO Reproduccion { get; set; }
        public SaludInformeDTO Salud { get; set; }
        public DateTime FechaGeneracion { get; set; }
    }

    public class PeriodoDTO
    {
        public DateTime Inicio { get; set; }
        public DateTime Fin { get; set; }
    }

    public class ProduccionInformeDTO
    {
        public decimal TotalLitros { get; set; }
        public decimal PromedioDiario { get; set; }
        public int DiasProduccion { get; set; }
        public int CantidadAnimales { get; set; }
        public decimal IndiceProductividad { get; set; } // Litros por día de producción
    }

    public class ReproduccionInformeDTO
    {
        public int TotalMontas { get; set; }
        public int MontasExitosas { get; set; }
        public int MontasFallidas { get; set; }
        public decimal TasaExito { get; set; } // Porcentaje
    }

    public class SaludInformeDTO
    {
        public int TotalControles { get; set; }
        public int AnimalesAtendidos { get; set; }
        public decimal IndiceSalud { get; set; } // Porcentaje de días sin problemas de salud
        public List<EnfermedadComunDTO> EnfermedadesComunes { get; set; }
    }

    public class EnfermedadComunDTO
    {
        public string Nombre { get; set; }
        public int CantidadCasos { get; set; }
        public decimal Porcentaje { get; set; }
    }

    public class InformeRentabilidadDTO
    {
        public int Anio { get; set; }
        public IngresosDTO Ingresos { get; set; }
        public CostosDTO Costos { get; set; }
        public decimal UtilidadBruta { get; set; }
        public decimal MargenUtilidad { get; set; } // Porcentaje
        public DateTime FechaGeneracion { get; set; }
    }

    public class IngresosDTO
    {
        public decimal VentaLeche { get; set; }
        public decimal VentaAnimales { get; set; }
        public decimal Total { get; set; }
    }

    public class CostosDTO
    {
        public decimal Alimentacion { get; set; }
        public decimal Salud { get; set; }
        public decimal Otros { get; set; }
        public decimal Total { get; set; }
    }

    #endregion
}
