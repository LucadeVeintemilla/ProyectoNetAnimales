import React from 'react';
import {
  PregnantWoman as PregnantWomanIcon,
  Male as MaleIcon,
  Female as FemaleIcon,
  Event as EventIcon,
  Help as HelpIcon,
  LocalHospital as LocalHospitalIcon,
  Healing as HealingIcon,
  ChildCare as ChildCareIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  EventBusy as EventBusyIcon,
  EventAvailable as EventAvailableIcon,
} from '@mui/icons-material';
import { format, parseISO, addDays, differenceInDays, isBefore, isAfter, isValid } from 'date-fns';
import { es } from 'date-fns/locale';

// Mapeo de tipos de evento a iconos
export const getEventoIcon = (
  tipoEvento: string = '', 
  props: React.ComponentProps<typeof EventIcon> = { fontSize: 'medium' }
): React.ReactElement => {
  const iconProps = { ...props, key: 'icon' };
  
  if (!tipoEvento) return React.createElement(HelpIcon, iconProps);
  
  const tipo = tipoEvento.toLowerCase();
  
  if (tipo.includes('inseminacion') || tipo === 'ia') {
    return React.createElement(LocalHospitalIcon, iconProps);
  }
  
  if (tipo === 'natural' || tipo.includes('monta')) {
    return React.createElement(HealingIcon, iconProps);
  }
  
  if (tipo.includes('trasplante') || tipo === 'te') {
    return React.createElement(HealingIcon, iconProps);
  }
  
  if (tipo.includes('parto')) {
    return React.createElement(ChildCareIcon, iconProps);
  }
  
  if (tipo.includes('preñez') || tipo === 'prenada') {
    return React.createElement(PregnantWomanIcon, iconProps);
  }
  
  return React.createElement(EventIcon, iconProps);
};

// Mapeo de tipos de evento a colores
export const getEventoColor = (
  tipoEvento?: string
): 'default' | 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning' => {
  if (!tipoEvento) return 'default';
  
  const tipo = tipoEvento.toLowerCase();
  
  if (tipo.includes('inseminacion') || tipo === 'ia') {
    return 'primary';
  }
  
  if (tipo === 'natural' || tipo.includes('monta')) {
    return 'secondary';
  }
  
  if (tipo.includes('trasplante') || tipo === 'te') {
    return 'info';
  }
  
  if (tipo.includes('parto') || tipo.includes('nacimiento')) {
    return 'success';
  }
  
  if (tipo.includes('preñez') || tipo === 'prenada') {
    return 'warning';
  }
  
  if (tipo.includes('aborto') || tipo.includes('fallido')) {
    return 'error';
  }
  
  return 'default';
};

// Formatear fechas para mostrar en la interfaz
export const formatearFecha = (fecha: string | Date, incluirHora: boolean = false): string => {
  if (!fecha) return 'N/A';
  
  try {
    const date = typeof fecha === 'string' ? new Date(fecha) : fecha;
    
    if (isNaN(date.getTime())) return 'Fecha inválida';
    
    const opciones: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    };
    
    if (incluirHora) {
      opciones.hour = '2-digit';
      opciones.minute = '2-digit';
    }
    
    return date.toLocaleDateString('es-ES', opciones);
  } catch (error) {
    console.error('Error formateando fecha:', error);
    return 'Fecha inválida';
  }
};

// Calcular fecha probable de parto (283 días después de la monta)
export const calcularFechaParto = (fechaMonta: string | Date): Date => {
  const fecha = typeof fechaMonta === 'string' ? new Date(fechaMonta) : new Date(fechaMonta);
  if (isNaN(fecha.getTime())) return new Date();
  
  const fechaParto = new Date(fecha);
  fechaParto.setDate(fechaParto.getDate() + 283); // 9 meses y 10 días
  return fechaParto;
};

// Validar formulario de reproducción
export const validarReproduccion = (values: any) => {
  const errors: any = {};
  
  if (!values.hembraId) {
    errors.hembraId = 'Se requiere seleccionar una hembra';
  }
  
  if (values.tipoEvento === 'inseminacion' || values.tipoEvento === 'natural') {
    if (!values.machoId) {
      errors.machoId = 'Se requiere seleccionar un macho';
    }
  }
  
  if (!values.fechaMonta) {
    errors.fechaMonta = 'La fecha de monta es requerida';
  } else if (new Date(values.fechaMonta) > new Date()) {
    errors.fechaMonta = 'La fecha no puede ser futura';
  }
  
  if (values.fechaParto && new Date(values.fechaParto) < new Date(values.fechaMonta)) {
    errors.fechaParto = 'La fecha de parto no puede ser anterior a la fecha de monta';
  }
  
  return errors;
};

// Mapear tipo de evento para mostrar
export const mapearTipoEvento = (tipo: string): string => {
  if (!tipo) return 'Desconocido';
  
  const tipoLower = tipo.toLowerCase();
  
  if (tipoLower.includes('inseminacion') || tipoLower === 'ia') {
    return 'Inseminación Artificial';
  }
  
  if (tipoLower === 'natural' || tipoLower.includes('monta')) {
    return 'Monta Natural';
  }
  
  if (tipoLower.includes('trasplante') || tipoLower === 'te') {
    return 'Trasplante Embrionario';
  }
  
  return tipo.charAt(0).toUpperCase() + tipo.slice(1);
};

// Mapear resultado para mostrar
export const mapearResultado = (resultado?: string): string => {
  if (!resultado) return 'Pendiente';
  
  const res = resultado.toLowerCase();
  
  if (res === 'preñada' || res === 'positivo') {
    return 'Preñada';
  }
  
  if (res === 'no_preñada' || res === 'negativo') {
    return 'No Preñada';
  }
  
  if (res === 'parto_exitoso') {
    return 'Parto Exitoso';
  }
  
  if (res === 'aborto') {
    return 'Aborto';
  }
  
  if (res === 'fallido') {
    return 'Fallido';
  }
  
  // Capitalizar primera letra
  return resultado.charAt(0).toUpperCase() + resultado.slice(1);
};

/**
 * Obtener el estado del parto basado en fechas
 */
export interface EstadoParto {
  texto: string;
  color: 'default' | 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning';
  icon: React.ReactElement;
}

export const getEstadoParto = (
  fechaProbableParto?: string | Date, 
  fechaRealParto?: string | Date
): EstadoParto => {
  if (fechaRealParto) {
    return {
      texto: 'Parto registrado',
      color: 'success' as const,
      icon: React.createElement(CheckCircleIcon, { fontSize: 'small' })
    };
  }

  if (!fechaProbableParto) {
    return {
      texto: 'Sin fecha de parto',
      color: 'default' as const,
      icon: React.createElement(HelpIcon, { fontSize: 'small' })
    };
  }

  const fechaParto = typeof fechaProbableParto === 'string' ? parseISO(fechaProbableParto) : fechaProbableParto;
  const hoy = new Date();
  const dias = differenceInDays(fechaParto, hoy);

  if (isNaN(dias)) {
    return {
      texto: 'Fecha inválida',
      color: 'error' as const,
      icon: React.createElement(WarningIcon, { fontSize: 'small' })
    };
  }

  if (dias < 0) {
    return {
      texto: `Atrasado por ${Math.abs(dias)} días`,
      color: 'error' as const,
      icon: React.createElement(EventBusyIcon, { fontSize: 'small' })
    };
  }
  
  if (dias === 0) {
    return {
      texto: '¡Hoy es el día!',
      color: 'warning' as const,
      icon: React.createElement(EventAvailableIcon, { fontSize: 'small' })
    };
  }
  
  if (dias <= 7) {
    return {
      texto: `En ${dias} días`,
      color: 'info' as const,
      icon: React.createElement(EventAvailableIcon, { fontSize: 'small' })
    };
  }

  return {
    texto: `En ${dias} días`,
    color: 'default' as const,
    icon: React.createElement(EventIcon, { fontSize: 'small' })
  };
};

/**
 * Validar fechas de reproducción
 */
export const validarFechasReproduccion = (values: any) => {
  const errors: any = {};
  const hoy = new Date();
  
  if (values.fechaMonta) {
    const fechaMonta = typeof values.fechaMonta === 'string' ? parseISO(values.fechaMonta) : values.fechaMonta;
    
    // Validar que la fecha de monta no sea futura (a menos que se permita)
    if (isAfter(fechaMonta, hoy)) {
      errors.fechaMonta = 'La fecha de monta no puede ser futura';
    }
    
    // Validar fecha de confirmación si existe
    if (values.fechaConfirmacion) {
      const fechaConfirmacion = typeof values.fechaConfirmacion === 'string' 
        ? parseISO(values.fechaConfirmacion) 
        : values.fechaConfirmacion;
      
      if (isBefore(fechaConfirmacion, fechaMonta)) {
        errors.fechaConfirmacion = 'La confirmación no puede ser anterior a la fecha de monta';
      }
    }
    
    // Validar fecha de parto si existe
    if (values.fechaParto) {
      const fechaParto = typeof values.fechaParto === 'string' 
        ? parseISO(values.fechaParto) 
        : values.fechaParto;
      
      if (isBefore(fechaParto, fechaMonta)) {
        errors.fechaParto = 'La fecha de parto no puede ser anterior a la fecha de monta';
      }
    }
  }
  
  return errors;
};

/**
 * Calcular días hasta el parto
 */
export const calcularDiasHastaParto = (fechaProbableParto: string | Date | null | undefined): number | null => {
  if (!fechaProbableParto) return null;
  
  try {
    const fechaParto = typeof fechaProbableParto === 'string' 
      ? parseISO(fechaProbableParto)
      : fechaProbableParto;
    
    if (!isValid(fechaParto)) return null;
    
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    const diferencia = differenceInDays(fechaParto, hoy);
    return diferencia;
  } catch (error) {
    console.error('Error calculando días hasta el parto:', error);
    return null;
  }
};
