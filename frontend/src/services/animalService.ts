import api from './api';

export interface Animal {
  id?: number;
  numeroIdentificacion: string;
  nombre: string;
  fechaNacimiento: string;
  sexo: 'M' | 'H';
  estado: string;
  razaId: number;
  razaNombre?: string;
  padreId?: number;
  padreNombre?: string;
  madreId?: number;
  madreNombre?: string;
  observaciones?: string;
  activo: boolean;
  fechaCreacion?: string;
  fechaActualizacion?: string;
}

export interface AnimalCreateDto extends Omit<Animal, 'id' | 'fechaCreacion' | 'fechaActualizacion' | 'razaNombre' | 'padreNombre' | 'madreNombre'> {}

export interface AnimalUpdateDto {
  id: number;
  nombre: string;
  numeroIdentificacion: string;
  fechaNacimiento: string;
  sexo: 'M' | 'H';
  estado: string;
  razaId: number;
  padreId?: number | null;
  madreId?: number | null;
  observaciones?: string;
  activo: boolean;
}

export const animalService = {
  // Obtener todos los animales con paginación
  getAnimales: async (page: number = 1, pageSize: number = 10, search: string = '', status: 'activos' | 'inactivos' | 'todos' = 'activos') => {
    try {
      console.log('Sending request to /animales with params:', { page, pageSize, search, status });
      const response = await api.get('/animales', {
        params: { 
          page, 
          pageSize, 
          search,
          status
        }
      });
      console.log('Response from /animales:', response.data);
      
      // Manejar tanto el formato antiguo (array) como el nuevo (objeto con items y totalCount)
      if (Array.isArray(response.data)) {
        return {
          items: response.data,
          totalCount: response.data.length
        };
      }
      
      return response.data;
    } catch (error) {
      console.error('Error in getAnimales:', error);
      throw error;
    }
  },

  // Obtener un animal por ID
  getAnimalById: async (id: number): Promise<Animal> => {
    const response = await api.get(`/animales/${id}`);
    return response.data;
  },

  // Crear un nuevo animal
  createAnimal: async (animal: AnimalCreateDto): Promise<Animal> => {
    try {
      console.log('Enviando datos al servidor:', JSON.stringify(animal, null, 2));
      const response = await api.post('/animales', animal);
      return response.data;
    } catch (error: any) {
      console.error('Error al crear el animal:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          data: error.config?.data
        }
      });
      throw error;
    }
  },

  // Actualizar un animal existente
  updateAnimal: async (id: number, animal: AnimalUpdateDto): Promise<Animal> => {
    try {
      const response = await api.put(`/animales/${id}`, animal);
      return response.data;
    } catch (error: any) {
      console.error('Error al actualizar el animal:', {
        id,
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      throw error;
    }
  },

  // Eliminar un animal (marcar como inactivo)
  deleteAnimal: async (id: number): Promise<void> => {
    await api.delete(`/animales/${id}`);
  },

  // Obtener opciones para dropdowns
  getAnimalesOptions: async (): Promise<{value: number, label: string}[]> => {
    const response = await api.get('/animales/options');
    return response.data;
  },

  // Obtener el árbol genealógico
  getArbolGenealogico: async (id: number, niveles: number = 3) => {
    try {
      const response = await api.get(`/trazabilidadgenetica/arbol-genealogico/${id}`, {
        params: { niveles }
      });
      
      console.log('API respuesta árbol:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error al obtener árbol genealógico:', error);
      throw error;
    }
  },

  // Obtener coeficiente de consanguinidad
  getCoeficienteConsanguinidad: async (id: number) => {
    try {
      const response = await api.get(`/trazabilidadgenetica/coeficiente-consanguinidad/${id}`);
      console.log('API respuesta coeficiente:', response.data);
      
      // Si la respuesta es un objeto con la propiedad coeficienteConsanguinidad, extraer ese valor
      if (response.data && typeof response.data === 'object' && 'coeficienteConsanguinidad' in response.data) {
        return response.data.coeficienteConsanguinidad;
      }
      
      return response.data;
    } catch (error) {
      console.error('Error al obtener coeficiente de consanguinidad:', error);
      return null;
    }
  }
};

export default animalService;
