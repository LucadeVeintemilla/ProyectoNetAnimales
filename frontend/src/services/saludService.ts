import api from './api';

export interface ControlSalud {
  id?: number;
  animalId: number;
  animalNombre?: string;
  numeroIdentificacion?: string;
  fecha: string | Date;
  tipo: 'vacuna' | 'tratamiento' | 'revision' | 'cirugia' | 'otro';
  descripcion: string;
  diagnostico?: string;
  estado: 'completado' | 'pendiente' | 'atrasado' | 'cancelado';
  fechaProximoControl?: string | Date | null;
  responsable?: string;
  observaciones?: string;
  veterinario?: string; // Campo para compatibilidad con el backend
  medicamentos?: Medicamento[];
}

export interface Medicamento {
  id?: number;
  controlSaludId: number;
  nombre: string;
  dosis: string;
  frecuencia?: string;
  viaAdministracion?: string;
  duracion?: string;
}

// Interfaz para el inventario de medicamentos
export interface MedicamentoInventario {
  id: number;
  nombre: string;
  descripcion?: string;
  tipo?: string;
  unidad?: string;
  stock: number;
  stockMinimo: number;
  observaciones?: string;
}

export interface ControlSaludCreateDto extends Omit<ControlSalud, 'id' | 'animalNombre' | 'numeroIdentificacion' | 'medicamentos'> {
  fecha: string;
  fechaProximoControl?: string | null;
  medicamentos?: Omit<Medicamento, 'id' | 'controlSaludId'>[];
}

export interface ControlSaludUpdateDto extends Partial<ControlSaludCreateDto> {}

export interface ResumenSalud {
  totalControles: number;
  completados: number;
  pendientes: number;
  atrasados: number;
  proximosControles: ProximoControl[];
}

export interface ProximoControl {
  id: number;
  animalId: number;
  animalNombre: string;
  numeroIdentificacion: string;
  fecha: string;
  tipo: string;
  descripcion: string;
  diasRestantes: number;
}

export const saludService = {
  // Obtener todos los registros de salud
  getAll: async (): Promise<ControlSalud[]> => {
    const response = await api.get('/ControlesSalud');
    return response.data;
  },

  // Obtener registros de salud con paginación y filtros
  getPaginated: async (page: number = 1, pageSize: number = 10, filtros?: {
    fechaInicio?: string;
    fechaFin?: string;
    animalId?: number;
    tipo?: string;
    estado?: string;
    busqueda?: string;
  }) => {
    try {
      // Usar el endpoint getAll ya que no existe un endpoint específico para paginación y filtros
      const response = await api.get('/ControlesSalud/proximos', { 
        params: { 
          dias: 3650 // Obtener controles de los últimos 10 años para asegurar que todos aparezcan
        }
      });
      
      console.log('Datos recibidos del API:', response.data);
      
      // Mapear los datos del backend al formato del frontend
      let data = Array.isArray(response.data) ? response.data.map((item: any) => ({
        id: item.id,
        animalId: item.animalId,
        animalNombre: item.animal?.nombre || 'Sin nombre',
        numeroIdentificacion: item.animal?.numeroIdentificacion || 'Sin ID',
        fecha: item.fecha,
        tipo: item.tipoControl?.toLowerCase() || 'otro', // Convertir TipoControl a tipo
        descripcion: item.diagnostico || '', // Mapear Diagnostico a descripcion
        diagnostico: item.tratamiento || '', // Mapear Tratamiento a diagnostico
        estado: item.estado?.toLowerCase() || 'pendiente',
        fechaProximoControl: item.proximoControl,
        responsable: item.veterinario || '',
        observaciones: item.observaciones || ''
      })) : [];
      
      console.log('Datos mapeados:', data);
      
      // Aplicar filtros si existen
      if (filtros) {
        if (filtros.fechaInicio) {
          data = data.filter((control: any) => {
            const fechaControl = new Date(control.fecha);
            const fechaInicio = new Date(filtros.fechaInicio!);
            return fechaControl >= fechaInicio;
          });
        }
        
        if (filtros.fechaFin) {
          data = data.filter((control: any) => {
            const fechaControl = new Date(control.fecha);
            const fechaFin = new Date(filtros.fechaFin!);
            // Establecer la hora de la fecha fin a 23:59:59
            fechaFin.setHours(23, 59, 59, 999);
            return fechaControl <= fechaFin;
          });
        }
        
        if (filtros.animalId) {
          data = data.filter((control: any) => control.animalId === filtros.animalId);
        }
        
        if (filtros.tipo) {
          data = data.filter((control: any) => control.tipo?.toLowerCase() === filtros.tipo?.toLowerCase());
        }
        
        if (filtros.estado) {
          data = data.filter((control: any) => control.estado?.toLowerCase() === filtros.estado?.toLowerCase());
        }
        
        if (filtros.busqueda) {
          const searchLower = filtros.busqueda.toLowerCase();
          data = data.filter((control: any) => 
            (control.animalNombre && control.animalNombre.toLowerCase().includes(searchLower)) ||
            (control.descripcion && control.descripcion.toLowerCase().includes(searchLower)) ||
            (control.diagnostico && control.diagnostico.toLowerCase().includes(searchLower))
          );
        }
      }
      
      console.log('Datos filtrados:', data);
      
      // Calcular paginación
      const totalItems = data.length;
      const start = (page - 1) * pageSize;
      const end = start + pageSize;
      const items = data.slice(start, end);
      
      return {
        items,
        totalItems
      };
    } catch (error) {
      console.error('Error al obtener registros de salud:', error);
      return { items: [], totalItems: 0 };
    }
  },

  // Obtener un registro de salud por ID
  getById: async (id: number): Promise<ControlSalud> => {
    try {
      console.log(`Obteniendo control de salud con ID: ${id}`);
      const response = await api.get(`/ControlesSalud/${id}`);
      console.log('Datos recibidos del backend:', response.data);

      // Mapear los datos del backend al formato del frontend
      const data = {
        id: response.data.id,
        animalId: response.data.animalId,
        animalNombre: response.data.animalNombre || response.data.animal?.nombre || 'Sin nombre',
        numeroIdentificacion: response.data.animalIdentificacion || response.data.animal?.numeroIdentificacion || '',
        fecha: response.data.fecha,
        tipo: response.data.tipoControl?.toLowerCase() || 'otro',
        descripcion: response.data.diagnostico || '',
        diagnostico: response.data.tratamiento || '',
        estado: response.data.estado?.toLowerCase() || 'pendiente',
        fechaProximoControl: response.data.proximoControl,
        responsable: response.data.veterinario || '',
        observaciones: response.data.Observaciones || response.data.observaciones || '',
        veterinario: response.data.veterinario || ''
      };
      
      // Registrar en consola para depuración detallada
      console.log('Datos completos recibidos del backend:', response.data);
      console.log('Veterinario/Responsable recibido:', response.data.veterinario);
      console.log('Observaciones recibidas (directo):', response.data.observaciones);
      console.log('Observaciones recibidas (mayúscula):', response.data.Observaciones);

      console.log('Datos mapeados para el frontend:', data);
      return data;
    } catch (error) {
      console.error('Error al obtener el control de salud:', error);
      throw error;
    }
  },

  // Crear un nuevo registro de salud
  create: async (control: ControlSaludCreateDto): Promise<ControlSalud> => {
    try {
      console.log('Datos recibidos para crear control:', control);
      
      // Asegurar que el campo estado siempre tenga un valor
      const estadoValue = control.estado || 'Pendiente';
      // Capitalizar la primera letra como lo espera el backend
      const estado = estadoValue.charAt(0).toUpperCase() + estadoValue.slice(1).toLowerCase();
      console.log('Estado a enviar (capitalizado):', estado);
      
      // Mapear los campos al formato que espera el backend
      const controlMapped: any = {
        Id: 0, // El backend espera un Id aunque sea un nuevo registro
        AnimalId: control.animalId,
        Fecha: control.fecha,
        TipoControl: control.tipo, // El backend espera TipoControl, no tipo
        Diagnostico: control.descripcion, // El backend usa Diagnostico como descripcion
        Tratamiento: control.diagnostico || '', // Usar diagnostico como Tratamiento
        Costo: 0, // Valor por defecto
        ProximoControl: control.fechaProximoControl,
        Observaciones: control.observaciones || '',
        Veterinario: control.responsable || '', // Veterinario en lugar de responsable
        Estado: estado // Incluir el estado capitalizado
      };
      
      // Ya no necesitamos estas líneas ya que Estado está incluido en el objeto
      
      console.log('Datos mapeados para enviar al backend:', controlMapped);
      
      const response = await api.post('/ControlesSalud', controlMapped);
      console.log('Respuesta del backend:', response.data);
      
      return response.data;
    } catch (error) {
      console.error('Error al crear control de salud:', error);
      throw error;
    }
  },

  // Actualizar un registro de salud existente
  update: async (id: number, control: ControlSaludUpdateDto): Promise<ControlSalud> => {
    try {
      console.log(`Actualizando control de salud ID ${id}:`, control);

      // Asegurar que el campo estado siempre tenga un valor y esté capitalizado
      const estadoValue = control.estado || 'Pendiente';
      // Capitalizar la primera letra como lo espera el backend
      const estado = estadoValue.charAt(0).toUpperCase() + estadoValue.slice(1).toLowerCase();
      console.log('Estado a enviar en actualización (capitalizado):', estado);

      // Mapear los campos al formato que espera el backend, igual que en create
      const controlMapped: any = {
        Id: id, // En este caso, el ID es el que viene como parámetro
        AnimalId: control.animalId,
        Fecha: control.fecha,
        TipoControl: control.tipo,
        Diagnostico: control.descripcion,
        Tratamiento: control.diagnostico || '',
        Costo: 0,
        ProximoControl: control.fechaProximoControl,
        Observaciones: control.observaciones || '',
        Veterinario: control.responsable || '',
        // Asegurarse de que se envíen todos los campos esperados por el backend
        Estado: estado
      };
      
      // Ya no necesitamos estas líneas ya que Estado está incluido en el objeto

      console.log('Datos mapeados para actualizar:', controlMapped);

      const response = await api.put(`/ControlesSalud/${id}`, controlMapped);
      console.log('Respuesta del backend (actualización):', response.data);
      
      return response.data;
    } catch (error) {
      console.error(`Error al actualizar control de salud ${id}:`, error);
      throw error;
    }
  },

  // Eliminar un registro de salud
  delete: async (id: number): Promise<void> => {
    await api.delete(`/ControlesSalud/${id}`);
  },

  // Obtener resumen de salud de un animal específico o de todos
  getResumenSalud: async (animalId?: number): Promise<ResumenSalud> => {
    try {
      // Como el endpoint /resumen no está disponible, vamos a calcular el resumen nosotros mismos
      // usando los datos de los próximos controles con un período amplio
      const response = await api.get('/ControlesSalud/proximos', { 
        params: { 
          dias: 365 // Obtener controles del último año
        }
      });
      
      const controles = response.data || [];
      
      // Filtrar por animalId si se especifica
      let filteredControles = controles;
      if (animalId) {
        filteredControles = controles.filter((c: any) => c.animalId === animalId);
      }
      
      const hoy = new Date();
      const totalControles = filteredControles.length;
      
      // Clasificar controles
      const completados = filteredControles.filter((c: any) => 
        c.estado?.toLowerCase() === 'completado').length;
      
      const pendientes = filteredControles.filter((c: any) => 
        c.estado?.toLowerCase() === 'pendiente').length;
      
      const atrasados = filteredControles.filter((c: any) => 
        c.estado?.toLowerCase() === 'atrasado').length;
      
      // Obtener próximos controles (ordenados por fecha)
      const proximosControles = filteredControles
        .filter((c: any) => {
          const fechaControl = c.fechaProximoControl ? new Date(c.fechaProximoControl) : null;
          return fechaControl && fechaControl >= hoy;
        })
        .sort((a: any, b: any) => {
          const fechaA = new Date(a.fechaProximoControl);
          const fechaB = new Date(b.fechaProximoControl);
          return fechaA.getTime() - fechaB.getTime();
        })
        .slice(0, 5) // Limitar a los 5 próximos
        .map((c: any) => {
          const fechaControl = new Date(c.fechaProximoControl);
          const diasRestantes = Math.ceil((fechaControl.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
          
          return {
            id: c.id,
            animalId: c.animalId,
            animalNombre: c.animalNombre || 'Sin nombre',
            numeroIdentificacion: c.animalIdentificacion || 'Sin ID',
            fecha: c.fechaProximoControl,
            tipo: c.tipoControl,
            descripcion: c.diagnostico || '',
            diasRestantes: diasRestantes
          };
        });
      
      return {
        totalControles,
        completados,
        pendientes,
        atrasados,
        proximosControles
      };
    } catch (error) {
      console.error('Error al obtener resumen de salud:', error);
      // Devolver un resumen vacío en caso de error
      return {
        totalControles: 0,
        completados: 0,
        pendientes: 0,
        atrasados: 0,
        proximosControles: []
      };
    }
  },

  // Obtener registros de salud de un animal específico
  getByAnimalId: async (animalId: number, page: number = 1, pageSize: number = 10): Promise<any> => {
    const response = await api.get(`/ControlesSalud/animal/${animalId}`, {
      params: { page, pageSize }
    });
    return response.data;
  },

  // Marcar un control de salud como completado
  marcarCompletado: async (id: number, diagnostico: string, observaciones?: string): Promise<ControlSalud> => {
    const response = await api.put(`/ControlesSalud/${id}/completar`, {
      diagnostico,
      observaciones
    });
    return response.data;
  },

  // Reprogramar un control de salud
  reprogramar: async (id: number, nuevaFecha: string): Promise<ControlSalud> => {
    const response = await api.put(`/ControlesSalud/${id}/reprogramar`, {
      nuevaFecha
    });
    return response.data;
  },

  // Agregar medicamentos a un control de salud
  agregarMedicamentos: async (id: number, medicamentos: Omit<Medicamento, 'id' | 'controlSaludId'>[]): Promise<Medicamento[]> => {
    const response = await api.post(`/ControlesSalud/${id}/medicamentos`, medicamentos);
    return response.data;
  },

  // Obtener tipos de controles disponibles
  getTiposControl: async (): Promise<string[]> => {
    const response = await api.get('/ControlesSalud/tipos');
    return response.data;
  },

  // Obtener estados de controles disponibles
  getEstadosControl: async (): Promise<string[]> => {
    return ['completado', 'pendiente', 'atrasado', 'cancelado'];
  },

  // ===== MÉTODOS PARA LA GESTIÓN DE MEDICAMENTOS EN INVENTARIO =====

  // Obtener todos los medicamentos del inventario
  getMedicamentos: async (): Promise<MedicamentoInventario[]> => {
    const response = await api.get('/medicamentos');
    return response.data;
  },

  // Obtener un medicamento del inventario por ID
  getMedicamentoById: async (id: number): Promise<MedicamentoInventario> => {
    const response = await api.get(`/medicamentos/${id}`);
    return response.data;
  },

  // Crear un nuevo medicamento en el inventario
  createMedicamento: async (medicamento: Omit<MedicamentoInventario, 'id'>): Promise<MedicamentoInventario> => {
    const response = await api.post('/medicamentos', medicamento);
    return response.data;
  },

  // Actualizar un medicamento existente en el inventario
  updateMedicamento: async (id: number, medicamento: Partial<MedicamentoInventario>): Promise<MedicamentoInventario> => {
    const response = await api.put(`/medicamentos/${id}`, medicamento);
    return response.data;
  },

  // Eliminar un medicamento del inventario
  deleteMedicamento: async (id: number): Promise<void> => {
    await api.delete(`/medicamentos/${id}`);
  },

  // Ajustar stock de un medicamento
  ajustarStock: async (id: number, cantidad: number, motivo: string): Promise<MedicamentoInventario> => {
    const response = await api.put(`/medicamentos/${id}/stock`, { 
      cantidad, 
      motivo 
    });
    return response.data;
  },

  // Obtener historial de uso de un medicamento
  getHistorialMedicamento: async (id: number): Promise<any[]> => {
    const response = await api.get(`/medicamentos/${id}/historial`);
    return response.data;
  },

  // Obtener medicamentos con stock bajo
  getMedicamentosStockBajo: async (): Promise<MedicamentoInventario[]> => {
    const response = await api.get('/medicamentos/stock-bajo');
    return response.data;
  }
};

export default saludService;
