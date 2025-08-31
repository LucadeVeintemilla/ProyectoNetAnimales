using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using GanadoAPI.Data;
using GanadoAPI.DTOs;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace GanadoAPI.Controllers
{
    // Import our custom DTOs for the detailed report
    using GanadoAPI.Models;
    [Route("api/[controller]")]
    [ApiController]
    public class ReportesController : BaseApiController
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<ReportesController> _logger;

        public ReportesController(ApplicationDbContext context, ILogger<ReportesController> logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// Obtiene un resumen general de la producción
        /// </summary>
        [HttpGet("resumen-produccion")]
        public async Task<ActionResult<ResumenProduccionDTO>> GetResumenProduccion(
            [FromQuery] DateTime fechaInicio, 
            [FromQuery] DateTime fechaFin)
        {
            try
            {
                if (fechaInicio > fechaFin)
                {
                    return BadRequest("La fecha de inicio no puede ser mayor a la fecha de fin");
                }

                // Obtener total de animales
                var totalAnimales = await _context.Animales
                    .Where(a => a.Activo)
                    .CountAsync();

                // Obtener total de hembras y machos
                var hembras = await _context.Animales
                    .Where(a => a.Activo && a.Sexo == "H")
                    .CountAsync();

                var machos = await _context.Animales
                    .Where(a => a.Activo && a.Sexo == "M")
                    .CountAsync();

                // Obtener producción total de leche en el período
                var produccionLeche = await _context.ProduccionesLeche
                    .Where(p => p.Fecha >= fechaInicio && p.Fecha <= fechaFin)
                    .SumAsync(p => p.CantidadLitros);

                // Obtener cantidad de partos en el período
                var partos = await _context.Reproducciones
                    .Where(r => r.FechaRealParto.HasValue && 
                              r.FechaRealParto.Value >= fechaInicio && 
                              r.FechaRealParto.Value <= fechaFin)
                    .CountAsync();

                // Obtener cantidad de nacimientos en el período
                var nacimientos = await _context.Animales
                    .Where(a => a.Activo && 
                              a.FechaNacimiento >= fechaInicio && 
                              a.FechaNacimiento <= fechaFin)
                    .CountAsync();

                // Obtener cantidad de controles de salud en el período
                var controlesSalud = await _context.ControlesSalud
                    .Where(c => c.Fecha >= fechaInicio && c.Fecha <= fechaFin)
                    .CountAsync();

                // Obtener distribución por razas
                var razas = await _context.Razas
                    .Select(r => new RazaResumenDTO
                    {
                        Id = r.Id,
                        Nombre = r.Nombre,
                        CantidadAnimales = r.Animales.Count(a => a.Activo)
                    })
                    .Where(r => r.CantidadAnimales > 0)
                    .OrderByDescending(r => r.CantidadAnimales)
                    .ToListAsync();

                // Obtener producción de leche por mes
                var produccionPorMes = await _context.ProduccionesLeche
                    .Where(p => p.Fecha.Year >= fechaInicio.Year && p.Fecha.Year <= fechaFin.Year)
                    .GroupBy(p => new { p.Fecha.Year, p.Fecha.Month })
                    .Select(g => new ProduccionMensualDTO
                    {
                        Anio = g.Key.Year,
                        Mes = g.Key.Month,
                        TotalLitros = g.Sum(p => p.CantidadLitros),
                        PromedioDiario = g.Average(p => p.CantidadLitros)
                    })
                    .OrderBy(p => p.Anio)
                    .ThenBy(p => p.Mes)
                    .ToListAsync();

                var resumen = new ResumenProduccionDTO
                {
                    FechaInicio = fechaInicio,
                    FechaFin = fechaFin,
                    TotalAnimales = totalAnimales,
                    TotalHembras = hembras,
                    TotalMachos = machos,
                    ProduccionTotalLeche = produccionLeche,
                    TotalPartos = partos,
                    TotalNacimientos = nacimientos,
                    TotalControlesSalud = controlesSalud,
                    DistribucionPorRazas = razas,
                    ProduccionMensual = produccionPorMes
                };

                return Ok(resumen);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al generar el resumen de producción");
                return StatusCode(500, new { message = "Error interno del servidor al generar el resumen de producción" });
            }
        }

        /// <summary>
        /// Obtiene un informe de vacas en producción
        /// </summary>
        [HttpGet("vacas-produccion")]
        public async Task<ActionResult<InformeVacasProduccionDTO>> GetInformeVacasProduccion()
        {
            try
            {
                // Obtener todas las hembras activas
                var vacas = await _context.Animales
                    .Where(a => a.Activo && a.Sexo == "H")
                    .OrderBy(a => a.NumeroIdentificacion)
                    .Select(a => new VacaProduccionDTO
                    {
                        Id = a.Id,
                        NumeroIdentificacion = a.NumeroIdentificacion,
                        Nombre = a.Nombre,
                        EdadMeses = (DateTime.Today.Year - a.FechaNacimiento.Year) * 12 + 
                                   (DateTime.Today.Month - a.FechaNacimiento.Month),
                        Raza = a.Raza != null ? a.Raza.Nombre : "Sin especificar",
                        UltimaProduccion = _context.ProduccionesLeche
                            .Where(p => p.AnimalId == a.Id)
                            .Max(p => (DateTime?)p.Fecha),
                        PromedioDiarioUltimos30Dias = _context.ProduccionesLeche
                            .Where(p => p.AnimalId == a.Id && 
                                      p.Fecha >= DateTime.Today.AddDays(-30))
                            .Average(p => (decimal?)p.CantidadLitros) ?? 0,
                        TotalUltimos30Dias = _context.ProduccionesLeche
                            .Where(p => p.AnimalId == a.Id && 
                                      p.Fecha >= DateTime.Today.AddDays(-30))
                            .Sum(p => (decimal?)p.CantidadLitros) ?? 0,
                        DiasEnProduccion = _context.ProduccionesLeche
                            .Where(p => p.AnimalId == a.Id)
                            .Select(p => p.Fecha.Date)
                            .Distinct()
                            .Count(),
                        TotalLitrosVida = _context.ProduccionesLeche
                            .Where(p => p.AnimalId == a.Id)
                            .Sum(p => (decimal?)p.CantidadLitros) ?? 0
                    })
                    .ToListAsync();

                // Calcular promedios
                var promedioProduccionDiaria = vacas.Any() ? vacas.Average(v => v.PromedioDiarioUltimos30Dias) : 0;
                var promedioTotal30Dias = vacas.Any() ? vacas.Average(v => v.TotalUltimos30Dias) : 0;

                var informe = new InformeVacasProduccionDTO
                {
                    FechaGeneracion = DateTime.Now,
                    TotalVacas = vacas.Count,
                    PromedioProduccionDiaria = promedioProduccionDiaria,
                    PromedioTotal30Dias = promedioTotal30Dias,
                    Vacas = vacas.OrderByDescending(v => v.TotalUltimos30Dias).ToList()
                };

                return Ok(informe);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al generar el informe de vacas en producción");
                return StatusCode(500, new { message = "Error interno del servidor al generar el informe de producción" });
            }
        }

        /// <summary>
        /// Obtiene un informe de reproducción
        /// </summary>
        [HttpGet("reproduccion")]
        public async Task<ActionResult<InformeReproduccionDTO>> GetInformeReproduccion(
            [FromQuery] int anio)
        {
            try
            {
                var fechaInicio = new DateTime(anio, 1, 1);
                var fechaFin = new DateTime(anio, 12, 31);

                // Obtener total de hembras en edad reproductiva (mayores a 12 meses)
                var hembrasReproductivas = await _context.Animales
                    .Where(a => a.Activo && 
                              a.Sexo == "H" && 
                              a.FechaNacimiento <= DateTime.Today.AddYears(-1))
                    .CountAsync();

                // Obtener total de montas en el año
                var totalMontas = await _context.Reproducciones
                    .Where(r => r.FechaMonta.HasValue && 
                              r.FechaMonta.Value.Year == anio)
                    .CountAsync();

                // Obtener total de preñeces confirmadas en el año
                var totalPreñeces = await _context.Reproducciones
                    .Where(r => r.FechaConfirmacionPrenez.HasValue && 
                              r.FechaConfirmacionPrenez.Value.Year == anio)
                    .CountAsync();

                // Obtener total de partos en el año
                var totalPartos = await _context.Reproducciones
                    .Where(r => r.FechaRealParto.HasValue && 
                              r.FechaRealParto.Value.Year == anio)
                    .CountAsync();

                // Obtener total de nacimientos en el año
                var totalNacimientos = await _context.Animales
                    .Where(a => a.Activo && 
                              a.FechaNacimiento.Year == anio)
                    .CountAsync();

                // Calcular tasa de preñez
                var tasaPreñez = totalMontas > 0 ? (decimal)totalPreñeces / totalMontas * 100 : 0;

                // Calcular tasa de parición
                var tasaParcicion = totalPreñeces > 0 ? (decimal)totalPartos / totalPreñeces * 100 : 0;

                // Calcular intervalo entre partos (días)
                var intervaloPartos = await CalcularIntervaloEntrePartos(anio);

                // Obtener distribución de partos por mes
                var partosPorMes = Enumerable.Range(1, 12)
                    .Select(mes => new PartosPorMesDTO
                    {
                        Mes = mes,
                        Cantidad = _context.Reproducciones
                            .Count(r => r.FechaRealParto.HasValue && 
                                      r.FechaRealParto.Value.Year == anio && 
                                      r.FechaRealParto.Value.Month == mes)
                    })
                    .ToList();

                var informe = new InformeReproduccionDTO
                {
                    Anio = anio,
                    FechaGeneracion = DateTime.Now,
                    TotalHembrasReproductivas = hembrasReproductivas,
                    TotalMontas = totalMontas,
                    TotalPreñeces = totalPreñeces,
                    TotalPartos = totalPartos,
                    TotalNacimientos = totalNacimientos,
                    TasaPreñez = Math.Round(tasaPreñez, 2),
                    TasaParcicion = Math.Round(tasaParcicion, 2),
                    IntervaloEntrePartosDias = intervaloPartos,
                    PartosPorMes = partosPorMes
                };

                return Ok(informe);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error al generar el informe de reproducción para el año {anio}");
                return StatusCode(500, new { message = "Error interno del servidor al generar el informe de reproducción" });
            }
        }

        private async Task<int> CalcularIntervaloEntrePartos(int anio)
        {
            try
            {
                // Obtener todas las hembras que tuvieron al menos dos partos
                var hembrasConDosPartos = await _context.Reproducciones
                    .Where(r => r.FechaRealParto.HasValue && 
                              r.FechaRealParto.Value.Year <= anio)
                    .GroupBy(r => r.HembraId)
                    .Where(g => g.Count() >= 2)
                    .Select(g => new
                    {
                        HembraId = g.Key,
                        Partos = g.OrderBy(p => p.FechaRealParto)
                                 .Select(p => p.FechaRealParto.Value)
                                 .ToList()
                    })
                    .ToListAsync();

                if (!hembrasConDosPartos.Any())
                {
                    return 0;
                }

                // Calcular el intervalo promedio entre partos para cada hembra
                var promedios = new List<double>();
                foreach (var hembra in hembrasConDosPartos)
                {
                    var intervalos = new List<double>();
                    for (int i = 1; i < hembra.Partos.Count; i++)
                    {
                        var intervalo = (hembra.Partos[i] - hembra.Partos[i - 1]).TotalDays;
                        intervalos.Add(intervalo);
                    }
                    if (intervalos.Any())
                    {
                        promedios.Add(intervalos.Average());
                    }
                }


                return promedios.Any() ? (int)Math.Round(promedios.Average()) : 0;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al calcular el intervalo entre partos");
                return 0;
            }
        }

        /// <summary>
        /// Obtiene un reporte detallado de un animal específico
        /// </summary>
        [HttpGet("detalle-animal/{animalId}")]
        public async Task<ActionResult<ReporteDetalladoAnimalDTO>> GetReporteDetalladoAnimal(int animalId)
        {
            try
            {
                // Buscar el animal
                var animal = await _context.Animales
                    .Include(a => a.Raza)
                    .Include(a => a.Madre)
                    .Include(a => a.Padre)
                    .FirstOrDefaultAsync(a => a.Id == animalId);

                if (animal == null)
                {
                    return NotFound($"Animal con ID {animalId} no encontrado");
                }

                // Calcular edad en meses
                TimeSpan edad = DateTime.Now - animal.FechaNacimiento;
                int edadMeses = (int)(edad.TotalDays / 30.44);

                // Obtener historial de producción de leche
                var historialLeche = await _context.ProduccionesLeche
                    .Where(p => p.AnimalId == animalId)
                    .OrderByDescending(p => p.Fecha)
                    .Select(p => new ProduccionLecheDTO
                    {
                        Id = p.Id,
                        Fecha = p.Fecha,
                        CantidadLitros = p.CantidadLitros,
                        Observaciones = p.Observaciones
                    })
                    .ToListAsync();

                // Obtener historial de producción de carne (pesajes)
                var historialCarne = await _context.ProduccionesCarne
                    .Where(p => p.AnimalId == animalId)
                    .OrderByDescending(p => p.FechaSacrificio)
                    .Select(p => new ReporteProduccionCarneDTO
                    {
                        Id = p.Id,
                        Fecha = p.FechaSacrificio,
                        Peso = p.PesoVivo,
                        Observaciones = p.RendimientoCarnico.ToString() ?? ""
                    })
                    .ToListAsync();

                // Obtener descendencia
                var hijos = new List<AnimalSimpleDTO>();
                
                if (animal.Sexo == "M")
                {
                    // Si es macho, buscar hijos donde es padre
                    var hijosEncontrados = await _context.Animales
                        .Where(a => a.PadreId == animalId)
                        .OrderByDescending(a => a.FechaNacimiento)
                        .Select(a => new AnimalSimpleDTO
                        {
                            Id = a.Id,
                            NumeroIdentificacion = a.NumeroIdentificacion,
                            Nombre = a.Nombre
                        })
                        .ToListAsync();
                    
                    hijos.AddRange(hijosEncontrados);
                }
                else if (animal.Sexo == "H")
                {
                    // Si es hembra, buscar hijos donde es madre
                    var hijosEncontrados = await _context.Animales
                        .Where(a => a.MadreId == animalId)
                        .OrderByDescending(a => a.FechaNacimiento)
                        .Select(a => new AnimalSimpleDTO
                        {
                            Id = a.Id,
                            NumeroIdentificacion = a.NumeroIdentificacion,
                            Nombre = a.Nombre
                        })
                        .ToListAsync();
                    
                    hijos.AddRange(hijosEncontrados);
                }
                
                // Eventos reproductivos
                var eventosReproductivos = new List<ReporteEventoReproductivoDTO>();
                
                // Si es hembra, obtener eventos como madre
                if (animal.Sexo == "H")
                {
                    var reproduccionesComoHembra = await _context.Reproducciones
                        .Include(r => r.Macho)
                        .Where(r => r.HembraId == animalId)
                        .OrderByDescending(r => r.FechaMonta)
                        .Select(r => new ReporteEventoReproductivoDTO
                        {
                            Id = r.Id,
                            FechaServicio = r.FechaMonta ?? DateTime.MinValue,
                            FechaPreñez = r.FechaConfirmacionPrenez,
                            FechaProbableParto = r.FechaProbableParto,
                            FechaRealParto = r.FechaRealParto,
                            TipoServicio = r.TipoMonta,
                            Estado = r.Resultado != null ? r.Resultado : "En proceso",
                            MadreId = r.HembraId,
                            MadreNumeroIdentificacion = r.Hembra != null ? r.Hembra.NumeroIdentificacion != null ? r.Hembra.NumeroIdentificacion : "" : "",
                            MadreNombre = r.Hembra != null ? r.Hembra.Nombre != null ? r.Hembra.Nombre : "" : "",
                            PadreId = r.MachoId ?? 0,
                            PadreNumeroIdentificacion = r.Macho != null ? (r.Macho.NumeroIdentificacion != null ? r.Macho.NumeroIdentificacion : "") : "Desconocido",
                            PadreNombre = r.Macho != null ? (r.Macho.Nombre != null ? r.Macho.Nombre : "") : "Desconocido",
                            Observaciones = r.Observaciones
                        })
                        .ToListAsync();
                    
                    eventosReproductivos.AddRange(reproduccionesComoHembra);
                }
                
                // Si es macho, obtener eventos como padre
                if (animal.Sexo == "M")
                {
                    var reproduccionesComoPadre = await _context.Reproducciones
                        .Include(r => r.Hembra)
                        .Where(r => r.MachoId == animalId)
                        .OrderByDescending(r => r.FechaMonta)
                        .Select(r => new ReporteEventoReproductivoDTO
                        {
                            Id = r.Id,
                            FechaServicio = r.FechaMonta ?? DateTime.MinValue,
                            FechaPreñez = r.FechaConfirmacionPrenez,
                            FechaProbableParto = r.FechaProbableParto,
                            FechaRealParto = r.FechaRealParto,
                            TipoServicio = r.TipoMonta,
                            Estado = r.Resultado != null ? r.Resultado : "En proceso",
                            MadreId = r.HembraId,
                            MadreNumeroIdentificacion = r.Hembra != null ? r.Hembra.NumeroIdentificacion != null ? r.Hembra.NumeroIdentificacion : "" : "",
                            MadreNombre = r.Hembra != null ? r.Hembra.Nombre != null ? r.Hembra.Nombre : "" : "",
                            PadreId = r.MachoId ?? 0,
                            PadreNumeroIdentificacion = animal.NumeroIdentificacion,
                            PadreNombre = animal.Nombre,
                            Observaciones = r.Observaciones
                        })
                        .ToListAsync();
                    
                    eventosReproductivos.AddRange(reproduccionesComoPadre);
                }

                // Obtener historial de salud
                var historialSalud = await _context.ControlesSalud
                    .Where(c => c.AnimalId == animalId)
                    .OrderByDescending(c => c.Fecha)
                    .Select(c => new ControlSaludDTO
                    {
                        Id = c.Id,
                        Fecha = c.Fecha,
                        TipoControl = c.TipoControl != null ? c.TipoControl : "",
                        Diagnostico = c.Diagnostico != null ? c.Diagnostico : "",
                        Tratamiento = c.Medicamento != null ? c.Medicamento : "",
                        Costo = 0,
                        AnimalNombre = animal.Nombre,
                        AnimalIdentificacion = animal.NumeroIdentificacion
                    })
                    .ToListAsync();

                // Determinar estado actual
                var enLactancia = historialLeche.Any() && historialLeche.First().Fecha >= DateTime.Today.AddDays(-30);
                
                // Verificar si está en gestación (si es hembra)
                bool enGestacion = false;
                if (animal.Sexo == "H")
                {
                    enGestacion = await _context.Reproducciones
                        .AnyAsync(r => r.HembraId == animalId && 
                                   r.Resultado != null && r.Resultado == "En gestación" && 
                                   r.FechaConfirmacionPrenez.HasValue && 
                                   r.FechaProbableParto.HasValue && 
                                   r.FechaProbableParto > DateTime.Today);
                }

                // Calcular promedios y totales
                decimal promedioLeche = historialLeche.Any() ? historialLeche.Average(h => h.CantidadLitros) : 0;
                decimal totalLeche = historialLeche.Sum(h => h.CantidadLitros);
                decimal pesoPromedio = historialCarne.Any() ? historialCarne.Average(h => h.Peso) : 0;
                
                // Obtener fecha del último control de salud
                DateTime? fechaUltimoControl = historialSalud.Any() ? historialSalud.First().Fecha : null;

                // Determinar estado actual consolidado
                string estadoActual = animal.Estado;
                if (enGestacion)
                {
                    estadoActual = "En gestación";
                }
                else if (enLactancia)
                {
                    estadoActual = "En lactancia";
                }

                // Contar eventos reproductivos
                int totalPartos = eventosReproductivos.Count(e => e.FechaRealParto.HasValue);
                int totalInseminaciones = eventosReproductivos.Count(e => e.TipoServicio != null && e.TipoServicio.Contains("Inseminación"));
                
                // Crear el DTO de respuesta
                var reporteDetallado = new ReporteDetalladoAnimalDTO
                {
                    Id = animal.Id,
                    NumeroIdentificacion = animal.NumeroIdentificacion,
                    Nombre = animal.Nombre,
                    FechaNacimiento = animal.FechaNacimiento,
                    EdadMeses = edadMeses,
                    Sexo = animal.Sexo,
                    RazaNombre = animal.Raza?.Nombre ?? "Sin especificar",
                    Estado = animal.Estado,
                    Categoria = animal.Categoria,
                    TipoAdquisicion = !string.IsNullOrWhiteSpace(animal.TipoAdquisicion)
                        ? animal.TipoAdquisicion
                        : (animal.ReproduccionId.HasValue ? "Nacimiento propio" : null),
                    Ubicacion = animal.Ubicacion,
                    EstadoActual = estadoActual,
                    EnLactancia = enLactancia,
                    EnGestacion = enGestacion,
                    FechaUltimoControl = fechaUltimoControl,
                    Madre = animal.Madre != null ? new AnimalSimpleDTO
                    {
                        Id = animal.Madre.Id,
                        NumeroIdentificacion = animal.Madre.NumeroIdentificacion,
                        Nombre = animal.Madre.Nombre
                    } : null,
                    Padre = animal.Padre != null ? new AnimalSimpleDTO
                    {
                        Id = animal.Padre.Id,
                        NumeroIdentificacion = animal.Padre.NumeroIdentificacion,
                        Nombre = animal.Padre.Nombre
                    } : null,
                    Hijos = hijos,
                    
                    // Producción
                    HistorialProduccionLeche = new List<DTOs.ProduccionLecheDTO>(historialLeche.Select(h => new DTOs.ProduccionLecheDTO {
                        Id = h.Id,
                        Fecha = h.Fecha,
                        CantidadLitros = h.CantidadLitros, 
                        Observaciones = h.Observaciones
                    })),
                    HistorialProduccionCarne = new List<DTOs.ProduccionCarneDTO>(historialCarne.Select(c => new DTOs.ProduccionCarneDTO {
                        Id = c.Id,
                        AnimalId = animalId,
                        NombreAnimal = animal.Nombre,
                        NumeroIdentificacion = animal.NumeroIdentificacion,
                        FechaSacrificio = c.Fecha,
                        PesoVivo = c.Peso,
                        PesoCanal = 0,
                        RendimientoCarnico = 0,
                        Observaciones = c.Observaciones,
                        Destino = "Faenamiento"
                    })),
                    PromedioProduccionLeche = promedioLeche,
                    TotalProduccionLeche = totalLeche,
                    PesoPromedio = pesoPromedio,
                    
                    // Reproducción
                    EventosReproductivos = new List<DTOs.ReproduccionDTO>(eventosReproductivos.Select(e => new DTOs.ReproduccionDTO {
                        Id = e.Id,
                        Fecha = e.FechaServicio,
                        TipoEvento = e.TipoServicio ?? "Servicio",
                        Resultado = e.Estado,
                        HembraNombre = e.MadreNombre,
                        HembraIdentificacion = e.MadreNumeroIdentificacion,
                        MachoNombre = e.PadreNombre,
                        MachoIdentificacion = e.PadreNumeroIdentificacion
                    })),
                    TotalPartos = totalPartos,
                    TotalInseminaciones = totalInseminaciones,
                    
                    // Salud
                    HistorialSalud = new List<DTOs.ControlSaludDTO>(historialSalud.Select(c => new DTOs.ControlSaludDTO
                    {
                        Id = c.Id,
                        Fecha = c.Fecha,
                        TipoControl = c.TipoControl,
                        Diagnostico = c.Diagnostico,
                        Tratamiento = c.Tratamiento,
                        Costo = c.Costo,
                        AnimalIdentificacion = c.AnimalIdentificacion,
                        AnimalNombre = c.AnimalNombre
                    }))
                };

                return Ok(reporteDetallado);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error al generar reporte detallado del animal {animalId}");
                return StatusCode(500, new { message = $"Error interno del servidor al generar el reporte detallado del animal {animalId}" });
            }
        }
    }

    public class ResumenProduccionDTO
    {
        public DateTime FechaInicio { get; set; }
        public DateTime FechaFin { get; set; }

        public int TotalDias { get; set; } // Agregar esta propiedad
        public decimal TotalLitros { get; set; } // Agregar esta propiedad
        public decimal PromedioDiario { get; set; } // Agregar esta propiedad
        public int TotalAnimales { get; set; }
        public int TotalHembras { get; set; }
        public int TotalMachos { get; set; }
        public decimal ProduccionTotalLeche { get; set; }
        public int TotalPartos { get; set; }
        public int TotalNacimientos { get; set; }
        public int TotalControlesSalud { get; set; }
        public List<RazaResumenDTO> DistribucionPorRazas { get; set; } = new List<RazaResumenDTO>();
        public List<ProduccionMensualDTO> ProduccionMensual { get; set; } = new List<ProduccionMensualDTO>();
    }

    public class RazaResumenDTO
    {
        public int Id { get; set; }
        public string Nombre { get; set; } = null!;
        public int CantidadAnimales { get; set; }
    }

    public class ProduccionMensualDTO
    {
        public int Anio { get; set; }
        public int Mes { get; set; }
        public decimal TotalLitros { get; set; }
        public decimal PromedioDiario { get; set; }
    }

    public class InformeVacasProduccionDTO
    {
        public DateTime FechaGeneracion { get; set; }
        public int TotalVacas { get; set; }
        public decimal PromedioProduccionDiaria { get; set; }
        public decimal PromedioTotal30Dias { get; set; }
        public List<VacaProduccionDTO> Vacas { get; set; } = new List<VacaProduccionDTO>();
    }

    public class VacaProduccionDTO
    {
        public int Id { get; set; }
        public string NumeroIdentificacion { get; set; } = null!;
        public string Nombre { get; set; } = null!;
        public int EdadMeses { get; set; }
        public string Raza { get; set; } = null!;
        public DateTime? UltimaProduccion { get; set; }
        public decimal PromedioDiarioUltimos30Dias { get; set; }
        public decimal TotalUltimos30Dias { get; set; }
        public int DiasEnProduccion { get; set; }
        public decimal TotalLitrosVida { get; set; }
        public decimal PromedioDiarioVida => DiasEnProduccion > 0 ? TotalLitrosVida / DiasEnProduccion : 0;
    }

    public class InformeReproduccionDTO
    {
        public int Anio { get; set; }
        public DateTime FechaGeneracion { get; set; }
        public int TotalHembrasReproductivas { get; set; }
        public int TotalMontas { get; set; }
        public int TotalPreñeces { get; set; }
        public int TotalPartos { get; set; }
        public int TotalNacimientos { get; set; }
        public decimal TasaPreñez { get; set; } // Porcentaje
        public decimal TasaParcicion { get; set; } // Porcentaje
        public int IntervaloEntrePartosDias { get; set; }
        public List<PartosPorMesDTO> PartosPorMes { get; set; } = new List<PartosPorMesDTO>();
    }

    public class PartosPorMesDTO
    {
        public int Mes { get; set; }
        public int Cantidad { get; set; }
    }
}
