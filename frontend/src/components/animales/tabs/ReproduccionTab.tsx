import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  Card,
  CardContent,
  Divider,
  Tabs,
  Tab,
  Badge,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Timeline as TimelineIcon,
  PregnantWoman as PregnantWomanIcon,
  ChildCare as ChildCareIcon,
  EventAvailable as EventAvailableIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Pending as PendingIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import HistorialReproductivo from './reproduccion/HistorialReproductivo';
import EventosPendientes from './reproduccion/EventosPendientes';
import EstadisticasReproductivas from './reproduccion/EstadisticasReproductivas';
import CalendarioReproductivo from './reproduccion/CalendarioReproductivo';

// Tipos de eventos reproductivos
export type TipoEventoReproductivo = 'celo' | 'servicio' | 'diagnostico_preniez' | 'parto' | 'aborto' | 'otro';

export interface EventoReproductivo {
  id: number;
  tipo: TipoEventoReproductivo;
  fecha: string;
  toroId?: number;
  toroNombre?: string;
  metodoInseminacion?: 'natural' | 'ia';
  diagnostico?: 'positivo' | 'negativo' | 'no_aplicable';
  fechaProbableParto?: string;
  fechaParto?: string;
  observaciones?: string;
  estado: 'completado' | 'pendiente' | 'cancelado';
  criasNacidas?: number;
  criasVivas?: number;
  pesoPromedioCrias?: number;
  veterinario?: string;
}

interface ReproduccionTabProps {
  animalId: number;
  sexo: 'H' | 'M';
}

const ReproduccionTab: React.FC<ReproduccionTabProps> = ({ animalId, sexo }) => {
  // Datos de ejemplo (en una aplicación real, estos vendrían de una API)
  const eventosEjemplo: EventoReproductivo[] = [
    {
      id: 1,
      tipo: 'celo',
      fecha: '2023-03-10T08:30:00',
      estado: 'completado',
      observaciones: 'Celo detectado por comportamiento',
    },
    {
      id: 2,
      tipo: 'servicio',
      fecha: '2023-03-12T10:15:00',
      toroId: 45,
      toroNombre: 'Toro Ejemplar',
      metodoInseminacion: 'ia',
      estado: 'completado',
      observaciones: 'Inseminación artificial realizada',
      veterinario: 'Dr. Juan Pérez',
    },
    {
      id: 3,
      tipo: 'diagnostico_preniez',
      fecha: '2023-04-20T14:00:00',
      diagnostico: 'positivo',
      fechaProbableParto: '2023-12-10T00:00:00',
      estado: 'completado',
      observaciones: 'Diagnóstico por ultrasonido - 45 días de gestación',
      veterinario: 'Dra. Ana Gómez',
    },
    {
      id: 4,
      tipo: 'parto',
      fecha: '2023-12-08T04:30:00',
      estado: 'completado',
      criasNacidas: 2,
      criasVivas: 2,
      pesoPromedioCrias: 35.5,
      observaciones: 'Parto sin complicaciones',
    },
    {
      id: 5,
      tipo: 'celo',
      fecha: '2024-02-15T09:20:00',
      estado: 'pendiente',
      observaciones: 'Posible celo detectado, monitorear',
    },
  ];

  const [eventos, setEventos] = useState<EventoReproductivo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [tabValue, setTabValue] = useState<number>(0);
  
  // Cargar eventos reproductivos del animal
  const fetchEventos = async () => {
    try {
      setLoading(true);
      // Simular carga de datos
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // En una aplicación real, aquí se haría la llamada a la API
      setEventos(eventosEjemplo);
    } catch (error) {
      console.error('Error al cargar los eventos reproductivos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEventos();
  }, [animalId]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Calcular resúmenes
  const resumenReproduccion = {
    totalEventos: eventos.length,
    partosExitosos: eventos.filter(e => e.tipo === 'parto' && e.estado === 'completado').length,
    criasNacidas: eventos
      .filter(e => e.tipo === 'parto' && e.estado === 'completado')
      .reduce((sum, evento) => sum + (evento.criasNacidas || 0), 0),
    prenezActual: eventos.some(
      e => e.tipo === 'diagnostico_preniez' && 
           e.diagnostico === 'positivo' && 
           e.estado === 'completado' &&
           (!eventos.some(
             p => p.tipo === 'parto' && 
                  p.estado === 'completado' && 
                  new Date(p.fecha) > new Date(e.fecha)
           ))
    ),
  };

  // Obtener el último diagnóstico de preñez
  const ultimoDiagnostico = eventos
    .filter(e => e.tipo === 'diagnostico_preniez' && e.diagnostico === 'positivo')
    .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())[0];

  // Obtener el último parto
  const ultimoParto = eventos
    .filter(e => e.tipo === 'parto' && e.estado === 'completado')
    .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())[0];

  // Calcular días desde el último parto
  const diasDesdeUltimoParto = ultimoParto 
    ? Math.floor((new Date().getTime() - new Date(ultimoParto.fecha).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  // Calcular días hasta el próximo parto esperado
  const diasHastaProximoParto = ultimoDiagnostico?.fechaProbableParto
    ? Math.ceil((new Date(ultimoDiagnostico.fechaProbableParto).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null;

  // Verificar si hay un parto próximo (en los próximos 30 días)
  const partoProximo = diasHastaProximoParto !== null && diasHastaProximoParto > 0 && diasHastaProximoParto <= 30;

  // Verificar si hay un parto atrasado (fecha probable de parto pasada pero sin registro de parto)
  const partoAtrasado = ultimoDiagnostico?.fechaProbableParto && 
    new Date(ultimoDiagnostico.fechaProbableParto) < new Date() && 
    !ultimoParto;

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box mb={3} display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="h6" component="h2">
          Gestión Reproductiva
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => console.log('Nuevo evento reproductivo')}
        >
          Nuevo Evento
        </Button>
      </Box>

      {/* Resumen */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total de Eventos
                  </Typography>
                  <Typography variant="h4">{resumenReproduccion.totalEventos}</Typography>
                </Box>
                <Box
                  sx={{
                    backgroundColor: 'primary.light',
                    color: 'primary.contrastText',
                    p: 2,
                    borderRadius: '50%',
                  }}
                >
                  <TimelineIcon />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Partos Exitosos
                  </Typography>
                  <Typography variant="h4" color="success.main">
                    {resumenReproduccion.partosExitosos}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    backgroundColor: 'success.light',
                    color: 'success.contrastText',
                    p: 2,
                    borderRadius: '50%',
                  }}
                >
                  <ChildCareIcon />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Crías Nacidas
                  </Typography>
                  <Typography variant="h4">
                    {resumenReproduccion.criasNacidas}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    backgroundColor: 'secondary.light',
                    color: 'secondary.contrastText',
                    p: 2,
                    borderRadius: '50%',
                  }}
                >
                  <PregnantWomanIcon />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card 
            sx={{
              borderLeft: `4px solid ${
                partoAtrasado ? 'error.main' : 
                partoProximo ? 'warning.main' : 
                resumenReproduccion.prenezActual ? 'success.main' : 'divider'
              }`,
            }}
          >
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Estado Actual
                  </Typography>
                  <Typography 
                    variant="h6"
                    color={
                      partoAtrasado ? 'error.main' : 
                      partoProximo ? 'warning.main' : 
                      resumenReproduccion.prenezActual ? 'success.main' : 'text.primary'
                    }
                  >
                    {partoAtrasado ? 'Parto Atrasado' :
                     partoProximo ? 'Parto Próximo' :
                     resumenReproduccion.prenezActual ? 'Preñada' : 
                     'No Preñada'}
                  </Typography>
                  {ultimoDiagnostico?.fechaProbableParto && (
                    <Typography variant="body2" color="textSecondary">
                      {`Parto: ${format(new Date(ultimoDiagnostico.fechaProbableParto), 'dd/MM/yyyy')}`}
                    </Typography>
                  )}
                </Box>
                <Box>
                  {partoAtrasado ? (
                    <WarningIcon color="error" sx={{ fontSize: 40 }} />
                  ) : partoProximo ? (
                    <PendingIcon color="warning" sx={{ fontSize: 40 }} />
                  ) : resumenReproduccion.prenezActual ? (
                    <CheckCircleIcon color="success" sx={{ fontSize: 40 }} />
                  ) : (
                    <EventAvailableIcon color="action" sx={{ fontSize: 40 }} />
                  )}
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Contenido principal con pestañas */}
      <Paper sx={{ mb: 3 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          aria-label="pestañas de reproducción"
        >
          <Tab label="Historial" icon={<TimelineIcon />} iconPosition="start" />
          <Tab 
            label={
              <Badge 
                badgeContent={eventos.filter(e => e.estado === 'pendiente').length} 
                color="error"
              >
                Pendientes
              </Badge>
            } 
            iconPosition="start"
          />
          <Tab label="Estadísticas" icon={<TimelineIcon />} iconPosition="start" />
          <Tab label="Calendario" icon={<EventAvailableIcon />} iconPosition="start" />
        </Tabs>
        
        <Divider />
        
        {/* Contenido de la pestaña seleccionada */}
        <Box p={3}>
          {tabValue === 0 && (
            <HistorialReproductivo 
              eventos={eventos} 
              loading={loading} 
              onRefresh={fetchEventos} 
            />
          )}
          
          {tabValue === 1 && (
            <EventosPendientes 
              eventos={eventos.filter(e => e.estado === 'pendiente')} 
              loading={loading} 
              onRefresh={fetchEventos} 
            />
          )}
          
          {tabValue === 2 && (
            <EstadisticasReproductivas 
              eventos={eventos} 
              loading={loading}
              onRefresh={fetchEventos}
            />
          )}
          
          {tabValue === 3 && (
            <CalendarioReproductivo 
              eventos={eventos} 
              loading={loading}
              onRefresh={fetchEventos}
            />
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default ReproduccionTab;
