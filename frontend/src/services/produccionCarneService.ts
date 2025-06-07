import api from './api';

// Interfaz para Animal (simplificada, ajustar según sea necesario)
interface Animal {
  id: number;
  nombre?: string;
  numeroIdentificacion: string;
  // Agregar más propiedades según sea necesario
}

export interface ProduccionCarne {
  id?: number;
  animalId: number;
  nombreAnimal?: string;
  numeroIdentificacion?: string;
  fechaSacrificio: string | Date;
  pesoVivo: number;
  pesoCanal: number;
  rendimientoCarnico: number;
  destino: string;
  observaciones?: string;
}

export interface ProduccionCarneCreateDto extends Omit<ProduccionCarne, 'id' | 'nombreAnimal' | 'numeroIdentificacion' | 'rendimientoCarnico'> {
  fechaSacrificio: string;
}

export interface ProduccionCarneUpdateDto extends Partial<ProduccionCarneCreateDto> {
  id?: number;
}

export interface ResumenProduccionCarne {
  fechaInicio: string;
  fechaFin: string;
  totalAnimales: number;
  totalPesoVivo: number;
  totalPesoCanal: number;
  promedioRendimiento: number;
}

export const produccionCarneService = {
  // Obtener todos los registros de producción de carne
  getAll: async (): Promise<ProduccionCarne[]> => {
    const response = await api.get('/produccioncarne');
    return response.data;
  },

  // Obtener registros de producción de carne con paginación
  getPaginated: async (page: number = 1, pageSize: number = 10, fechaInicio?: string, fechaFin?: string, animalId?: number) => {
    const response = await api.get('/produccioncarne', {
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
    return produccionCarneService.getPaginated(page, pageSize, fechaInicio, fechaFin, animalId);
  },

  // Obtener un registro de producción de carne por ID
  getById: async (id: number): Promise<ProduccionCarne> => {
    const response = await api.get(`/produccioncarne/${id}`);
    return response.data;
  },

  // Alias para compatibilidad
  getProduccionById: async (id: number): Promise<ProduccionCarne> => {
    return produccionCarneService.getById(id);
  },

  // Crear un nuevo registro de producción de carne
  create: async (produccion: ProduccionCarneCreateDto): Promise<ProduccionCarne> => {
    const response = await api.post('/produccioncarne', produccion);
    return response.data;
  },

  // Alias para compatibilidad
  createProduccion: async (produccion: ProduccionCarneCreateDto): Promise<ProduccionCarne> => {
    return produccionCarneService.create(produccion);
  },

  // Actualizar un registro de producción de carne existente
  update: async (id: number, produccion: ProduccionCarneUpdateDto): Promise<ProduccionCarne> => {
    const response = await api.put(`/produccioncarne/${id}`, produccion);
    return response.data;
  },

  // Alias para compatibilidad
  updateProduccion: async (id: number, produccion: ProduccionCarneUpdateDto): Promise<ProduccionCarne> => {
    return produccionCarneService.update(id, produccion);
  },

  // Eliminar un registro de producción de carne
  delete: async (id: number): Promise<void> => {
    await api.delete(`/produccioncarne/${id}`);
  },

  // Alias para compatibilidad
  deleteProduccion: async (id: number): Promise<void> => {
    return produccionCarneService.delete(id);
  },
  
  // Obtener el resumen de producción de carne
  getResumen: async (fechaInicio: string, fechaFin: string): Promise<ResumenProduccionCarne> => {
    const response = await api.get('/produccioncarne/resumen', {
      params: { fechaInicio, fechaFin }
    });
    return response.data;
  },
  
  // Obtener animales disponibles para sacrificio (animales activos)
  getAnimalesDisponibles: async (): Promise<Animal[]> => {
    try {
      // Llamamos al endpoint de animales con el filtro de activo=true
      const response = await api.get('/animales', { 
        params: { activo: true } 
      });
      return response.data.items || [];
    } catch (error) {
      console.error('Error al obtener animales disponibles para sacrificio:', error);
      return [];
    }
  }
};

export default produccionCarneService;
