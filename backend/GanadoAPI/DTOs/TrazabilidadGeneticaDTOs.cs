using System;
using System.Collections.Generic;

namespace GanadoAPI.DTOs
{
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
