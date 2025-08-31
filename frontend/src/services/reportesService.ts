import api from './api';

const API_URL = '/reportes';

export interface ResumenProduccion {
  fechaInicio: string;
  fechaFin: string;
  totalDias: number;
  totalLitros: number;
  promedioDiario: number;
  totalAnimales: number;
  totalHembras: number;
  totalMachos: number;
  produccionTotalLeche: number;
  totalPartos: number;
  totalNacimientos: number;
  totalControlesSalud: number;
  distribucionPorRazas: RazaResumen[];
  produccionMensual: ProduccionMensual[];
}

export interface RazaResumen {
  id: number;
  nombre: string;
  cantidadAnimales: number;
}

export interface ProduccionMensual {
  anio: number;
  mes: number;
  totalLitros: number;
  promedioDiario: number;
}

export interface AnimalSimple {
  id: number;
  numeroIdentificacion: string;
  nombre: string;
  sexo: string;
}

export interface ProduccionLeche {
  id: number;
  fecha: string;
  cantidadLitros: number;
  observaciones: string;
}

export interface ProduccionCarne {
  id: number;
  fecha: string;
  peso: number;
  observaciones: string;
}

export interface Reproduccion {
  id: number;
  fechaServicio: string;
  fechaPreñez: string | null;
  fechaProbableParto: string | null;
  fechaRealParto: string | null;
  tipoServicio: string;
  estado: string;
  madreId: number;
  madreNumeroIdentificacion: string;
  madreNombre: string;
  padreId: number;
  padreNumeroIdentificacion: string;
  padreNombre: string;
  observaciones: string;
}

export interface ControlSalud {
  id: number;
  fecha: string;
  tipo: string;
  veterinario: string;
  diagnostico: string;
  tratamiento: string;
  fechaSiguienteControl: string | null;
  observaciones: string;
}

export interface ReporteDetalladoAnimal {
  id: number;
  numeroIdentificacion: string;
  nombre: string;
  fechaNacimiento: string;
  edadMeses: number;
  sexo: string;
  estado: string;
  razaNombre: string;
  observaciones: string;
  categoria?: string;
  tipoAdquisicion?: 'Nacimiento propio' | 'Compra';
  ubicacion?: string;
  
  // Genealogía
  padre: AnimalSimple | null;
  madre: AnimalSimple | null;
  hijos: AnimalSimple[];
  
  // Estado actual
  estadoActual: string;
  enLactancia: boolean;
  enGestacion: boolean;
  fechaUltimoControl: string | null;
  
  // Producción
  historialProduccionLeche: ProduccionLeche[];
  promedioProduccionLeche: number;
  totalProduccionLeche: number;
  historialProduccionCarne: ProduccionCarne[];
  pesoPromedio: number;
  
  // Reproducción
  eventosReproductivos: Reproduccion[];
  totalPartos: number;
  totalInseminaciones: number;
  
  // Salud
  historialSalud: ControlSalud[];
}

const reportesService = {
  getResumenProduccion: async (fechaInicio: string, fechaFin: string): Promise<ResumenProduccion> => {
    try {
      const response = await api.get(`${API_URL}/resumen-produccion`, {
        params: {
          fechaInicio,
          fechaFin
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error al obtener resumen de producción:', error);
      throw error;
    }
  },

  getInformeVacasProduccion: async () => {
    try {
      const response = await api.get(`${API_URL}/vacas-produccion`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener informe de vacas en producción:', error);
      throw error;
    }
  },

  getInformeReproduccion: async (anio: number) => {
    try {
      const response = await api.get(`${API_URL}/reproduccion`, {
        params: { anio }
      });
      return response.data;
    } catch (error) {
      console.error('Error al obtener informe de reproducción:', error);
      throw error;
    }
  },

  getReporteDetalladoAnimal: async (animalId: number): Promise<ReporteDetalladoAnimal> => {
    try {
      const response = await api.get(`${API_URL}/detalle-animal/${animalId}`);
      return response.data;
    } catch (error) {
      console.error(`Error al obtener reporte detallado del animal ${animalId}:`, error);
      throw error;
    }
  },
};

export default reportesService;
