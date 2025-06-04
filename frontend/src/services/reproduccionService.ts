import api from './api';

export interface Reproduccion {
  id?: number;
  hembraId: number;
  hembraNombre?: string;
  machoId?: number | null;
  machoNombre?: string;
  tipoMonta: 'natural' | 'inseminacion' | 'trasplante';
  fechaMonta: string;
  fechaPartoEstimada?: string;
  fechaPartoReal?: string;
  resultado?: 'preñada' | 'no_preñada' | 'aborto' | 'parto_exitoso' | 'parto_fallido';
  observaciones?: string;
  fechaCreacion?: string;
  fechaActualizacion?: string;
  crias?: Cria[];
}

export interface Cria {
  id?: number;
  reproduccionId: number;
  numeroIdentificacion: string;
  nombre: string;
  sexo: 'M' | 'H';
  fechaNacimiento: string;
  pesoNacimiento: number;
  observaciones?: string;
}

export interface ReproduccionBaseDto {
  Id?: number;
  HembraId: number;
  MachoId?: number | null;
  TipoEvento: string;
  Fecha: string;
  FechaConfirmacionPrenez?: string | null;
  FechaProbableParto?: string | null;
  FechaRealParto?: string | null;
  Resultado?: 'preñada' | 'no_preñada' | 'aborto' | 'parto_exitoso' | 'parto_fallido' | null;
  Observaciones?: string | null;
}

export interface ReproduccionCreateDto extends ReproduccionBaseDto {}

export interface ReproduccionUpdateDto extends Partial<ReproduccionBaseDto> {}

export interface CriaCreateDto extends Omit<Cria, 'id' | 'reproduccionId'> {}

export const reproduccionService = {
  // Obtener todos los eventos de reproducción con paginación y filtros
  getReproducciones: async (page: number = 1, pageSize: number = 10, tipoEvento?: string) => {
    const response = await api.get('/Reproduccion', {
      params: { 
        page, 
        pageSize, 
        tipoEvento: tipoEvento || undefined 
      }
    });
    return response.data;
  },

  // Obtener un evento de reproducción por ID
  getReproduccionById: async (id: number): Promise<Reproduccion> => {
    const response = await api.get(`/Reproduccion/${id}`);
    return response.data;
  },

  // Crear un nuevo evento de reproducción
  createReproduccion: async (data: ReproduccionCreateDto): Promise<Reproduccion> => {
    const response = await api.post('/Reproduccion', data);
    return response.data;
  },

  // Actualizar un evento de reproducción existente
  updateReproduccion: async (id: number, data: ReproduccionUpdateDto): Promise<Reproduccion> => {
    const response = await api.put(`/Reproduccion/${id}`, { ...data, id });
    return response.data;
  },

  // Eliminar un evento de reproducción
  deleteReproduccion: async (id: number): Promise<void> => {
    await api.delete(`/Reproduccion/${id}`);
  },

  // Obtener partos próximos
  getProximosPartos: async (dias: number = 30) => {
    const response = await api.get('/Reproduccion/partos-proximos', { params: { dias } });
    return response.data;
  },

  // Obtener historial reproductivo de un animal
  getHistorialReproductivo: async (animalId: number): Promise<Reproduccion[]> => {
    const response = await api.get(`/Reproduccion/animal/${animalId}`);
    return response.data;
  },

  // Obtener estadísticas reproductivas
  getEstadisticas: async (anio: number = new Date().getFullYear()) => {
    const response = await api.get('/Reproduccion/estadisticas', { params: { anio } });
    return response.data;
  },

  // Confirmar preñez
  confirmarPrenez: async (id: number, fechaConfirmacion: string, observaciones?: string) => {
    const response = await api.put(`/Reproduccion/${id}/confirmar-prenez`, { 
      fechaConfirmacion, 
      observaciones 
    });
    return response.data;
  },

  // Registrar parto
  registrarParto: async (id: number, fechaParto: string, resultado: string, observaciones?: string) => {
    const response = await api.put(`/Reproduccion/${id}/registrar-parto`, { 
      fechaParto, 
      resultado,
      observaciones 
    });
    return response.data;
  },

  // Obtener crías de un parto
  getCrias: async (reproduccionId: number): Promise<Cria[]> => {
    const response = await api.get(`/Reproduccion/crias/${reproduccionId}`);
    return response.data;
  },

  // Registrar crías
  registrarCrias: async (reproduccionId: number, crias: CriaCreateDto[]): Promise<Cria[]> => {
    const response = await api.post(`/Reproduccion/${reproduccionId}/crias`, { crias });
    return response.data;
  },

  // Buscar animales por tipo (hembra/macho)
  buscarAnimales: async (tipo: 'H' | 'M', query: string = '') => {
    const response = await api.get('/Animales/buscar', { 
      params: { 
        sexo: tipo,
        query,
        activo: true
      } 
    });
    return response.data;
  },

  // Obtener opciones para filtros
  getFiltros: async () => {
    return {
      tiposEvento: [
        { value: 'natural', label: 'Monta Natural' },
        { value: 'inseminacion', label: 'Inseminación' },
        { value: 'trasplante', label: 'Trasplante Embrionario' }
      ],
      resultados: [
        { value: 'preñada', label: 'Preñada' },
        { value: 'no_preñada', label: 'No Preñada' },
        { value: 'aborto', label: 'Aborto' },
        { value: 'parto_exitoso', label: 'Parto Exitoso' },
        { value: 'parto_fallido', label: 'Parto Fallido' }
      ]
    };
  }
};

export default reproduccionService;
