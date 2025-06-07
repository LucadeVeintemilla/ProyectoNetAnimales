using System;
using System.Collections.Generic;

namespace GanadoAPI.DTOs
{
    public class ReporteDetalladoAnimalDTO
    {
        // Datos generales
        public int Id { get; set; }
        public string NumeroIdentificacion { get; set; }
        public string Nombre { get; set; }
        public DateTime FechaNacimiento { get; set; }
        public int EdadMeses { get; set; }
        public string Sexo { get; set; }
        public string Estado { get; set; }
        public string RazaNombre { get; set; }
        public string Observaciones { get; set; }
        
        // Información genealógica
        public AnimalSimpleDTO Padre { get; set; }
        public AnimalSimpleDTO Madre { get; set; }
        public List<AnimalSimpleDTO> Hijos { get; set; } = new List<AnimalSimpleDTO>();

        // Estado actual
        public string EstadoActual { get; set; }
        public bool EnLactancia { get; set; }
        public bool EnGestacion { get; set; }
        public DateTime? FechaUltimoControl { get; set; }
        
        // Historial de producción
        public List<ProduccionLecheDTO> HistorialProduccionLeche { get; set; } = new List<ProduccionLecheDTO>();
        public decimal PromedioProduccionLeche { get; set; }
        public decimal TotalProduccionLeche { get; set; }
        
        public List<ProduccionCarneDTO> HistorialProduccionCarne { get; set; } = new List<ProduccionCarneDTO>();
        public decimal PesoPromedio { get; set; }
        
        // Eventos reproductivos
        public List<ReproduccionDTO> EventosReproductivos { get; set; } = new List<ReproduccionDTO>();
        public int TotalPartos { get; set; }
        public int TotalInseminaciones { get; set; }
        
        // Historial de salud
        public List<ControlSaludDTO> HistorialSalud { get; set; } = new List<ControlSaludDTO>();
    }

    public class AnimalSimpleDTO
    {
        public int Id { get; set; }
        public string NumeroIdentificacion { get; set; }
        public string Nombre { get; set; }
        public string Sexo { get; set; }
    }
}
