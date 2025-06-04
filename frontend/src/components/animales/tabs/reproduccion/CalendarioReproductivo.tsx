import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  useTheme,
  useMediaQuery,
  Divider,
  ToggleButtonGroup,
  ToggleButton,
  Tooltip,
  Badge,
} from '@mui/material';
import {
  CalendarToday as CalendarIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Today as TodayIcon,
  EventAvailable as EventAvailableIcon,
  PregnantWoman as PregnantWomanIcon,
  ChildCare as ChildCareIcon,
  EventBusy as EventBusyIcon,
  LocalHospital as HospitalIcon,
  FilterList as FilterListIcon,
  Add as AddIcon,
  Info as InfoIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, 
  isSameMonth, isSameDay, isToday, parseISO, addDays, isBefore, isAfter } from 'date-fns';
import { es } from 'date-fns/locale';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { EventoReproductivo, TipoEventoReproductivo } from '../ReproduccionTab';

interface CalendarioReproductivoProps {
  eventos: EventoReproductivo[];
  loading: boolean;
  onRefresh: () => void;
  onAddEvent?: () => void;
  onEventClick?: (evento: EventoReproductivo) => void;
}

const getEventoColor = (tipo: TipoEventoReproductivo, theme: any) => {
  switch (tipo) {
    case 'celo': return theme.palette.info.main;
    case 'servicio': return theme.palette.primary.main;
    case 'diagnostico_preniez': return theme.palette.secondary.main;
    case 'parto': return theme.palette.success.main;
    case 'aborto': return theme.palette.error.main;
    default: return theme.palette.grey[500];
  }
};

const getEventoIcono = (tipo: TipoEventoReproductivo) => {
  switch (tipo) {
    case 'celo': return <EventAvailableIcon fontSize="small" />;
    case 'servicio': return <HospitalIcon fontSize="small" />;
    case 'diagnostico_preniez': return <PregnantWomanIcon fontSize="small" />;
    case 'parto': return <ChildCareIcon fontSize="small" />;
    case 'aborto': return <EventBusyIcon fontSize="small" />;
    default: return <EventAvailableIcon fontSize="small" />;
  }
};

const getTipoTexto = (tipo: string) => {
  switch (tipo) {
    case 'celo': return 'Celo';
    case 'servicio': return 'Servicio';
    case 'diagnostico_preniez': return 'Diagnóstico';
    case 'parto': return 'Parto';
    case 'aborto': return 'Aborto';
    default: return tipo;
  }
};

const CalendarioReproductivo: React.FC<CalendarioReproductivoProps> = ({
  eventos,
  loading,
  onRefresh,
  onAddEvent = () => {},
  onEventClick,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [mesActual, setMesActual] = useState<Date>(new Date());
  const [diaSeleccionado, setDiaSeleccionado] = useState<Date | null>(null);
  const [filtros, setFiltros] = useState({
    tipos: [] as TipoEventoReproductivo[],
    estados: [] as string[],
  });
  const [eventoDialog, setEventoDialog] = useState<{
    open: boolean;
    evento: EventoReproductivo | null;
  }>({ open: false, evento: null });
  const [filtrosDialog, setFiltrosDialog] = useState(false);

  // Obtener días del mes actual
  const diasMes = useMemo(() => {
    const primerDiaMes = startOfMonth(mesActual);
    const ultimoDiaMes = endOfMonth(mesActual);
    
    // Asegurar que el calendario comience en lunes
    const primerDiaMostrado = new Date(primerDiaMes);
    while (primerDiaMostrado.getDay() !== 1) {
      primerDiaMostrado.setDate(primerDiaMostrado.getDate() - 1);
    }
    
    // Asegurar que el calendario termine en domingo
    const ultimoDiaMostrado = new Date(ultimoDiaMes);
    while (ultimoDiaMostrado.getDay() !== 0) {
      ultimoDiaMostrado.setDate(ultimoDiaMostrado.getDate() + 1);
    }
    
    return eachDayOfInterval({
      start: primerDiaMostrado,
      end: ultimoDiaMostrado,
    });
  }, [mesActual]);

  // Filtrar eventos
  const eventosFiltrados = useMemo(() => {
    return eventos.filter(evento => {
      if (filtros.tipos.length > 0 && !filtros.tipos.includes(evento.tipo)) {
        return false;
      }
      if (filtros.estados.length > 0 && !filtros.estados.includes(evento.estado)) {
        return false;
      }
      return true;
    });
  }, [eventos, filtros]);

  // Agrupar eventos por día
  const eventosPorDia = useMemo(() => {
    const eventosAgrupados: Record<string, EventoReproductivo[]> = {};
    eventosFiltrados.forEach(evento => {
      const fecha = format(parseISO(evento.fecha), 'yyyy-MM-dd');
      if (!eventosAgrupados[fecha]) {
        eventosAgrupados[fecha] = [];
      }
      eventosAgrupados[fecha].push(evento);
    });
    return eventosAgrupados;
  }, [eventosFiltrados]);

  // Manejadores de navegación
  const mesAnterior = () => setMesActual(current => subMonths(current, 1));
  const mesSiguiente = () => setMesActual(current => addMonths(current, 1));
  const irAHoy = () => {
    setMesActual(new Date());
    setDiaSeleccionado(new Date());
  };

  // Manejadores de filtros
  const handleTipoFiltroChange = (tipos: TipoEventoReproductivo[]) => {
    setFiltros(prev => ({ ...prev, tipos }));
  };

  const handleEstadoFiltroChange = (estados: string[]) => {
    setFiltros(prev => ({ ...prev, estados }));
  };

  const limpiarFiltros = () => {
    setFiltros({ tipos: [], estados: [] });
  };

  // Manejadores de eventos
  const handleDiaClick = (dia: Date) => {
    setDiaSeleccionado(dia);
    const eventosDia = eventosPorDia[format(dia, 'yyyy-MM-dd')] || [];
    if (eventosDia.length > 0 && onEventClick) {
      onEventClick(eventosDia[0]);
    }
  };

  const handleEventoClick = (evento: EventoReproductivo, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEventClick) {
      onEventClick(evento);
    } else {
      setEventoDialog({ open: true, evento });
    }
  };

  // Obtener eventos para un día específico
  const getEventosDelDia = (dia: Date) => {
    return eventosPorDia[format(dia, 'yyyy-MM-dd')] || [];
  };

  // Nombres de los días de la semana
  const diasSemana = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  return (
    <Box>
      {/* Controles del calendario */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap" gap={2}>
        <Box display="flex" alignItems="center" gap={1}>
          <CalendarIcon color="primary" />
          <Typography variant="h6">
            {format(mesActual, 'MMMM yyyy', { locale: es })}
          </Typography>
        </Box>
        
        <Box display="flex" gap={1} flexWrap="wrap">
          <Tooltip title="Mes anterior">
            <IconButton onClick={mesAnterior} size="small">
              <ChevronLeftIcon />
            </IconButton>
          </Tooltip>
          
          <Button 
            variant="outlined" 
            size="small" 
            startIcon={<TodayIcon />}
            onClick={irAHoy}
          >
            Hoy
          </Button>
          
          <Tooltip title="Mes siguiente">
            <IconButton onClick={mesSiguiente} size="small">
              <ChevronRightIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Filtros">
            <IconButton 
              onClick={() => setFiltrosDialog(true)}
              color={(filtros.tipos.length > 0 || filtros.estados.length > 0) ? "primary" : "default"}
              size="small"
            >
              <Badge 
                badgeContent={filtros.tipos.length + filtros.estados.length} 
                color="primary"
                variant="dot"
              >
                <FilterListIcon />
              </Badge>
            </IconButton>
          </Tooltip>
          
          <Button 
            variant="contained" 
            color="primary" 
            size="small"
            startIcon={<AddIcon />}
            onClick={onAddEvent}
          >
            Nuevo Evento
          </Button>
        </Box>
      </Box>
      
      {/* Calendario */}
      <Paper variant="outlined">
        {/* Encabezado con días de la semana */}
        <Box 
          display="grid" 
          gridTemplateColumns="repeat(7, 1fr)" 
          textAlign="center" 
          bgcolor="action.hover"
          py={1}
        >
          {diasSemana.map(dia => (
            <Typography key={dia} variant="caption" fontWeight="bold">
              {dia}
            </Typography>
          ))}
        </Box>
        
        {/* Días del mes */}
        <Box 
          display="grid" 
          gridTemplateColumns="repeat(7, 1fr)" 
          gridAutoRows="1fr"
          minHeight={isMobile ? '60vh' : '70vh'}
        >
          {diasMes.map((dia, index) => {
            const esDiaActual = isToday(dia);
            const esOtroMes = !isSameMonth(dia, mesActual);
            const esDiaSeleccionado = diaSeleccionado && isSameDay(dia, diaSeleccionado);
            const eventosDia = getEventosDelDia(dia);
            
            return (
              <Box
                key={index}
                onClick={() => handleDiaClick(dia)}
                sx={{
                  p: 0.5,
                  minHeight: isMobile ? '80px' : '120px',
                  border: '1px solid',
                  borderColor: 'divider',
                  bgcolor: esDiaSeleccionado ? 'action.selected' : 'background.paper',
                  opacity: esOtroMes ? 0.5 : 1,
                  cursor: 'pointer',
                  '&:hover': { bgcolor: 'action.hover' },
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* Número del día */}
                <Box
                  display="flex"
                  justifyContent="center"
                  alignItems="center"
                  width={24}
                  height={24}
                  borderRadius="50%"
                  bgcolor={esDiaActual ? 'primary.main' : 'transparent'}
                  color={esDiaActual ? 'primary.contrastText' : 'text.primary'}
                  fontSize="0.875rem"
                  fontWeight={esDiaActual ? 'bold' : 'normal'}
                  mb={0.5}
                >
                  {format(dia, 'd')}
                </Box>
                
                {/* Eventos del día */}
                {eventosDia.length > 0 && (
                  <Box sx={{ overflowY: 'auto', maxHeight: 'calc(100% - 30px)' }}>
                    {eventosDia.slice(0, isMobile ? 2 : 4).map((evento, i) => (
                      <Chip
                        key={i}
                        label={getTipoTexto(evento.tipo)}
                        size="small"
                        onClick={(e) => handleEventoClick(evento, e)}
                        sx={{
                          width: '100%',
                          justifyContent: 'flex-start',
                          mb: 0.5,
                          bgcolor: `${getEventoColor(evento.tipo, theme)}22`,
                          color: theme.palette.getContrastText(theme.palette.background.paper),
                          border: `1px solid ${getEventoColor(evento.tipo, theme)}`,
                          fontSize: '0.65rem',
                          height: 'auto',
                          '& .MuiChip-label': {
                            whiteSpace: 'normal',
                            padding: '2px 4px',
                          },
                        }}
                        icon={getEventoIcono(evento.tipo)}
                      />
                    ))}
                    {eventosDia.length > (isMobile ? 2 : 4) && (
                      <Typography variant="caption" color="text.secondary">
                        +{eventosDia.length - (isMobile ? 2 : 4)} más
                      </Typography>
                    )}
                  </Box>
                )}
              </Box>
            );
          })}
        </Box>
      </Paper>
      
      {/* Diálogo de filtros */}
      <Dialog 
        open={filtrosDialog} 
        onClose={() => setFiltrosDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Filtrar Eventos</DialogTitle>
        <DialogContent>
          <Box mb={3}>
            <Typography variant="subtitle1" gutterBottom>
              Tipos de Eventos
            </Typography>
            <ToggleButtonGroup
              value={filtros.tipos}
              onChange={(_, nuevosTipos) => handleTipoFiltroChange(nuevosTipos)}
              aria-label="tipo de evento"
              sx={{ flexWrap: 'wrap', gap: 1, mb: 2 }}
            >
              <ToggleButton value="celo" aria-label="celo">
                <EventAvailableIcon sx={{ mr: 1 }} />
                Celo
              </ToggleButton>
              <ToggleButton value="servicio" aria-label="servicio">
                <HospitalIcon sx={{ mr: 1 }} />
                Servicio
              </ToggleButton>
              <ToggleButton value="diagnostico_preniez" aria-label="diagnóstico">
                <PregnantWomanIcon sx={{ mr: 1 }} />
                Diagnóstico
              </ToggleButton>
              <ToggleButton value="parto" aria-label="parto">
                <ChildCareIcon sx={{ mr: 1 }} />
                Parto
              </ToggleButton>
              <ToggleButton value="aborto" aria-label="aborto">
                <EventBusyIcon sx={{ mr: 1 }} />
                Aborto
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>
          
          <Divider sx={{ my: 2 }} />
          
          <Box>
            <Typography variant="subtitle1" gutterBottom>
              Estados
            </Typography>
            <ToggleButtonGroup
              value={filtros.estados}
              onChange={(_, nuevosEstados) => handleEstadoFiltroChange(nuevosEstados)}
              aria-label="estado del evento"
              sx={{ flexWrap: 'wrap', gap: 1 }}
            >
              <ToggleButton value="completado" aria-label="completado">
                Completado
              </ToggleButton>
              <ToggleButton value="pendiente" aria-label="pendiente">
                Pendiente
              </ToggleButton>
              <ToggleButton value="cancelado" aria-label="cancelado">
                Cancelado
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={limpiarFiltros} color="inherit">
            Limpiar Filtros
          </Button>
          <Button 
            onClick={() => setFiltrosDialog(false)} 
            variant="contained" 
            color="primary"
          >
            Aplicar
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Diálogo de detalles del evento */}
      <Dialog 
        open={eventoDialog.open} 
        onClose={() => setEventoDialog({ open: false, evento: null })}
        maxWidth="sm"
        fullWidth
      >
        {eventoDialog.evento && (
          <>
            <DialogTitle sx={{ 
              display: 'flex', 
              alignItems: 'center',
              bgcolor: `${getEventoColor(eventoDialog.evento.tipo, theme)}22`,
              borderBottom: `1px solid ${getEventoColor(eventoDialog.evento.tipo, theme)}`,
            }}>
              {getEventoIcono(eventoDialog.evento.tipo)}
              <Box ml={1}>
                <Typography variant="h6" component="div">
                  {getTipoTexto(eventoDialog.evento.tipo)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {format(parseISO(eventoDialog.evento.fecha), 'PPP', { locale: es })}
                </Typography>
              </Box>
              <IconButton
                aria-label="close"
                onClick={() => setEventoDialog({ open: false, evento: null })}
                sx={{
                  position: 'absolute',
                  right: 8,
                  top: 8,
                  color: (theme) => theme.palette.grey[500],
                }}
              >
                <CloseIcon />
              </IconButton>
            </DialogTitle>
            
            <DialogContent>
              <Box mt={2}>
                <Typography variant="subtitle2" color="text.secondary">Estado</Typography>
                <Chip 
                  label={eventoDialog.evento.estado.charAt(0).toUpperCase() + 
                        eventoDialog.evento.estado.slice(1)}
                  color={
                    eventoDialog.evento.estado === 'completado' ? 'success' :
                    eventoDialog.evento.estado === 'pendiente' ? 'warning' : 'error'
                  }
                  size="small"
                  sx={{ mb: 2 }}
                />
                
                {eventoDialog.evento.observaciones && (
                  <>
                    <Typography variant="subtitle2" color="text.secondary" mt={2}>
                      Observaciones
                    </Typography>
                    <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
                      {eventoDialog.evento.observaciones}
                    </Typography>
                  </>
                )}
                
                {eventoDialog.evento.tipo === 'servicio' && (
                  <>
                    <Typography variant="subtitle2" color="text.secondary" mt={2}>
                      Método
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      {eventoDialog.evento.metodoInseminacion === 'ia' ? 
                        'Inseminación Artificial' : 'Monta Natural'}
                    </Typography>
                    
                    {eventoDialog.evento.toroNombre && (
                      <>
                        <Typography variant="subtitle2" color="text.secondary" mt={2}>
                          Toro
                        </Typography>
                        <Typography variant="body1" gutterBottom>
                          {eventoDialog.evento.toroNombre}
                        </Typography>
                      </>
                    )}
                  </>
                )}
                
                {eventoDialog.evento.tipo === 'diagnostico_preniez' && (
                  <>
                    <Typography variant="subtitle2" color="text.secondary" mt={2}>
                      Resultado
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      {eventoDialog.evento.diagnostico === 'positivo' ? 
                        'Positivo' : 'Negativo'}
                    </Typography>
                    
                    {eventoDialog.evento.fechaProbableParto && (
                      <>
                        <Typography variant="subtitle2" color="text.secondary" mt={2}>
                          Fecha Probable de Parto
                        </Typography>
                        <Typography variant="body1" gutterBottom>
                          {format(parseISO(eventoDialog.evento.fechaProbableParto), 'PPP', { locale: es })}
                        </Typography>
                      </>
                    )}
                  </>
                )}
                
                {eventoDialog.evento.tipo === 'parto' && (
                  <>
                    <Typography variant="subtitle2" color="text.secondary" mt={2}>
                      Crías Nacidas
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      {eventoDialog.evento.criasNacidas || 'No especificado'}
                    </Typography>
                    
                    {eventoDialog.evento.pesoPromedioCrias && (
                      <>
                        <Typography variant="subtitle2" color="text.secondary" mt={2}>
                          Peso Promedio al Nacer
                        </Typography>
                        <Typography variant="body1" gutterBottom>
                          {eventoDialog.evento.pesoPromedioCrias} kg
                        </Typography>
                      </>
                    )}
                  </>
                )}
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setEventoDialog({ open: false, evento: null })}>
                Cerrar
              </Button>
              <Button 
                variant="contained" 
                color="primary"
                onClick={() => {
                  if (onEventClick) {
                    onEventClick(eventoDialog.evento!);
                  }
                  setEventoDialog({ open: false, evento: null });
                }}
              >
                Ver Detalles
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default CalendarioReproductivo;