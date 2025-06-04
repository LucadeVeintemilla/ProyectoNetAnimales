import api from './api';

// Interfaz para Animal (simplificada, ajustar según sea necesario)
interface Animal {
  id: number;
  nombre?: string;
  numeroIdentificacion: string;
  // Agregar más propiedades según sea necesario
}

export interface ProduccionLeche {
  id?: number;
  animalId: number;
  animalNombre?: string;
  numeroIdentificacion?: string;
  fecha: string | Date;
  cantidadLitros: number;
  turno: 'Mañana' | 'Tarde' | 'Noche';
  observaciones?: string;
}

export interface ProduccionLecheCreateDto extends Omit<ProduccionLeche, 'id' | 'animalNombre' | 'numeroIdentificacion'> {
  fecha: string;
}

export interface ProduccionLecheUpdateDto extends Partial<ProduccionLecheCreateDto> {}

export interface ResumenProduccion {
  fechaInicio: string;
  fechaFin: string;
  totalLitros: number;
  promedioDiario: number;
  produccionPorDia: ProduccionDia[];
  topAnimales: ProduccionAnimal[];
}

interface ProduccionDia {
  fecha: string;
  totalLitros: number;
  cantidadRegistros: number;
}

interface ProduccionAnimal {
  animalId: number;
  nombreAnimal: string;
  totalLitros: number;
  promedioDiario: number;
}

export const produccionService = {
  // Obtener todos los registros de producción
  getAll: async (): Promise<ProduccionLeche[]> => {
    const response = await api.get('/produccionleche');
    return response.data;
  },

  // Obtener registros de producción con paginación
  getPaginated: async (page: number = 1, pageSize: number = 10, fechaInicio?: string, fechaFin?: string, animalId?: number) => {
    const response = await api.get('/produccionleche', {
      params: { 
        page, 
        pageSize, 
        fechaInicio: fechaInicio || undefined, 
        fechaFin: fechaFin || undefined, 
        animalId: animalId || undefined 
      }
    });
    return response.data;
  },
  
  // Alias para compatibilidad
  getProducciones: async (page: number = 1, pageSize: number = 10, fechaInicio?: string, fechaFin?: string, animalId?: number) => {
    return produccionService.getPaginated(page, pageSize, fechaInicio, fechaFin, animalId);
  },

  // Obtener un registro de producción por ID
  getById: async (id: number): Promise<ProduccionLeche> => {
    const response = await api.get(`/produccionleche/${id}`);
    return response.data;
  },

  // Obtener un registro de producción por ID (alias para compatibilidad)
  getProduccionById: async (id: number): Promise<ProduccionLeche> => {
    return produccionService.getById(id);
  },

  // Crear un nuevo registro de producción
  create: async (produccion: ProduccionLecheCreateDto): Promise<ProduccionLeche> => {
    const response = await api.post('/produccionleche', produccion);
    return response.data;
  },

  // Alias para compatibilidad
  createProduccion: async (produccion: ProduccionLecheCreateDto): Promise<ProduccionLeche> => {
    return produccionService.create(produccion);
  },

  // Actualizar un registro de producción existente
  update: async (id: number, produccion: ProduccionLecheUpdateDto): Promise<ProduccionLeche> => {
    const response = await api.put(`/produccionleche/${id}`, produccion);
    return response.data;
  },

  // Alias para compatibilidad
  updateProduccion: async (id: number, produccion: ProduccionLecheUpdateDto): Promise<ProduccionLeche> => {
    return produccionService.update(id, produccion);
  },

  // Eliminar un registro de producción
  delete: async (id: number): Promise<void> => {
    await api.delete(`/produccionleche/${id}`);
  },

  // Alias para compatibilidad
  deleteProduccion: async (id: number): Promise<void> => {
    return produccionService.delete(id);
  },
  
  // Obtener animales en producción
  getAnimalesEnProduccion: async (): Promise<Animal[]> => {
    // Usamos el endpoint de animales con un filtro para los que están en producción
    const response = await api.get('/animales', {
      params: {
        enProduccion: true,
        pageSize: 1000 // Un número grande para obtener todos los animales en producción
      }
    });
    return response.data.items || [];
  },

  // Obtener resumen de producción
  getResumenProduccion: async (fechaInicio: string, fechaFin: string): Promise<ResumenProduccion> => {
    const response = await api.get('/produccionleche/resumen', {
      params: { fechaInicio, fechaFin }
    });
    return response.data;
  },

  // Obtener producción por raza
  getProduccionPorRaza: async (fechaInicio: string, fechaFin: string) => {
    const response = await api.get('/produccionleche/reporte-por-raza', {
      params: { fechaInicio, fechaFin }
    });
    return response.data;
  },

  // Obtener tendencia mensual
  getTendenciaMensual: async (anioInicio: number, anioFin: number) => {
    const response = await api.get('/produccionleche/tendencia-mensual', {
      params: { anioInicio, anioFin }
    });
    return response.data;
  },

  // Comparativa entre animales
  getComparativaAnimales: async (animalesIds: number[], fechaInicio: string, fechaFin: string, agrupacion: string = 'diaria') => {
    const response = await api.get('/produccionleche/comparativa-animales', {
      params: { 
        animalesIds: animalesIds.join(','),
        fechaInicio,
        fechaFin,
        agrupacion
      }
    });
    return response.data;
  },

  // Detección de anomalías
  getDeteccionAnomalias: async (animalId: number, fechaInicio: string, fechaFin: string, umbralDesviacion: number = 2.0) => {
    const response = await api.get('/produccionleche/deteccion-anomalias', {
      params: { animalId, fechaInicio, fechaFin, umbralDesviacion }
    });
    return response.data;
  }
};

export default produccionService;
