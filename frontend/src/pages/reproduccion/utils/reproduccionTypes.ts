import { SvgIconTypeMap } from '@mui/material';
import { OverridableComponent } from '@mui/material/OverridableComponent';

// Tipos para los iconos de Material-UI
type IconType = OverridableComponent<SvgIconTypeMap<{}, "svg">> & {
  muiName: string;
};

// Tipos para el estado del parto
export interface EstadoParto {
  texto: string;
  color: 'default' | 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning';
  icon: React.ReactElement;
}

// Tipos para los eventos de reproducción
export interface ReproduccionEvento {
  id: number;
  tipo: string;
  fecha: string;
  resultado?: string;
  observaciones?: string;
  hembraId: number;
  machoId?: number;
  fechaConfirmacionPrenez?: string;
  fechaProbableParto?: string;
  fechaRealParto?: string;
  crias?: Cria[];
}

// Tipos para las crías
export interface Cria {
  id: number;
  numeroIdentificacion: string;
  nombre?: string;
  sexo: 'M' | 'H';
  fechaNacimiento: string;
  pesoNacimiento?: number;
  observaciones?: string;
  estado: 'vivo' | 'muerto' | 'vendido' | 'otro';
  madreId: number;
  padreId?: number;
  eventoNacimientoId: number;
}

// Tipos para los filtros de búsqueda
export interface ReproduccionFiltros {
  tipoEvento?: string;
  resultado?: string;
  fechaInicio?: string;
  fechaFin?: string;
  hembraId?: number;
  machoId?: number;
  incluirCrias?: boolean;
}

// Tipos para los datos del formulario
export interface ReproduccionFormData {
  tipoEvento: string;
  fecha: string;
  hembraId: number;
  machoId?: number;
  observaciones?: string;
  resultado?: string;
  fechaConfirmacionPrenez?: string;
  fechaProbableParto?: string;
  fechaRealParto?: string;
  crias?: Omit<Cria, 'id' | 'eventoNacimientoId' | 'madreId' | 'padreId'>[];
}
