// ReproduccionDetallePage.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Button, Card, CardContent, CardHeader, Chip, Divider, Grid,
  IconButton, Typography, useTheme, LinearProgress, Tabs, Tab, Paper,
  List, ListItem, ListItemIcon, ListItemText, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Avatar, Badge,
  Tooltip
} from '@mui/material';
import { 
  ArrowBack, Edit, Female, Male, PregnantWoman, ChildCare, 
  Event, EventAvailable, EventBusy, Help, LocalHospital, Healing,
  CheckCircle, Warning, CalendarToday, AccessTime, Notes, Person,
  History
} from '@mui/icons-material';
import reproduccionService from '../../services/reproduccionService';
import { useSnackbar } from 'notistack';

interface Cria {
  id: number;
  numeroIdentificacion: string;
  nombre?: string;
  sexo: 'H' | 'M';
  pesoNacimiento?: number;
  estado: 'vivo' | 'muerto';
  fechaNacimiento?: string | null;
}

interface Reproduccion {
  id: number;
  hembraId: number;
  machoId: number | null;
  tipoMonta: string;
  fechaMonta: string;
  fechaConfirmacionPrenez: string | null;
  fechaPartoEstimada: string | null;
  fechaPartoReal: string | null;
  resultado: string | null;
  observaciones: string | null;
  metodoReproduccion?: string;
  hembraNombre?: string;
  machoNombre?: string;
  hembraIdentificacion?: string;
  machoIdentificacion?: string;
}

type ReproduccionEvento = Reproduccion;

const getEstadoParto = (fechaEstimada: string | null, fechaReal: string | null) => {
  if (!fechaEstimada) return null;

  const now = new Date();
  const estimada = fechaEstimada ? new Date(fechaEstimada) : null;
  
  if (fechaReal) {
    return {
      texto: 'Parto Realizado',
      color: 'success' as const,
      icon: <CheckCircle color="success" />
    };
  }
  
  if (!estimada) return null;
  
  if (estimada > now) {
    return {
      texto: 'En Progreso',
      color: 'info' as const,
      icon: <AccessTime color="info" />
    };
  }
  
  return {
    texto: 'Parto Pendiente',
    color: 'warning' as const,
    icon: <Warning color="warning" />
  };
};

const formatearFecha = (fecha: string | null, incluirHora = false): string => {
  if (!fecha) return 'No especificada';
  const date = new Date(fecha);
  const options: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    ...(incluirHora ? { hour: '2-digit', minute: '2-digit' } : {})
  };
  return new Intl.DateTimeFormat('es-ES', options).format(date);
};

const getEventoIcon = (tipo: string, props = {}) => {
  switch (tipo) {
    case 'parto':
      return <ChildCare {...props} />;
    case 'inseminacion':
      return <LocalHospital {...props} />;
    case 'natural':
      return <PregnantWoman {...props} />;
    default:
      return <Event {...props} />;
  }
};

const getEventoColor = (tipo: string): "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning" => {
  switch (tipo) {
    case 'parto':
      return 'success';
    case 'inseminacion':
      return 'info';
    case 'natural':
      return 'primary';
    default:
      return 'default';
  }
};

const ReproduccionDetallePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [evento, setEvento] = useState<ReproduccionEvento | null>(null);
  const [crias, setCrias] = useState<Cria[]>([]);
  const [historial, setHistorial] = useState<ReproduccionEvento[]>([]);
  const [estado, setEstado] = useState<ReturnType<typeof getEstadoParto> | null>(null);

  useEffect(() => {
    const cargarDatos = async () => {
      if (!id) {
        enqueueSnackbar('ID de reproducción no válido', { variant: 'error' });
        navigate('/reproduccion');
        return;
      }
      
      try {
        setLoading(true);
        // Cargar datos de reproducción
        const data = await reproduccionService.getReproduccionById(Number(id));
        if (!data) {
          enqueueSnackbar('No se encontró el registro de reproducción', { variant: 'error' });
          navigate('/reproduccion');
          return;
        }
        // Ensure all required properties exist
        if (!data.id) {
          throw new Error('ID is required for ReproduccionEvento');
        }
        
        console.log('Datos recibidos del backend:', data);
        
        // Usar type casting para evitar problemas con TypeScript
        const dataCast = data as any;
        
        const eventoData: ReproduccionEvento = {
          id: data.id,
          hembraId: data.hembraId,
          machoId: data.machoId ?? null,
          // Manejar los diferentes nombres de campos que pueden venir del backend
          tipoMonta: dataCast.tipoEvento || dataCast.tipoMonta || '',
          fechaMonta: dataCast.fecha || dataCast.fechaMonta || '',
          fechaConfirmacionPrenez: dataCast.fechaConfirmacionPrenez || null,
          fechaPartoEstimada: dataCast.fechaProbableParto || dataCast.fechaPartoEstimada || null,
          fechaPartoReal: dataCast.fechaRealParto || dataCast.fechaPartoReal || null,
          resultado: dataCast.resultado || null,
          observaciones: dataCast.observaciones || null,
          metodoReproduccion: dataCast.metodoReproduccion || dataCast.tipoEvento || dataCast.tipoMonta || '',
          // Asegurar que siempre tengamos la información de la hembra y el macho
          hembraNombre: dataCast.hembraNombre || 'No especificado',
          hembraIdentificacion: dataCast.hembraIdentificacion || 'No especificado',
          machoNombre: data.machoId ? (dataCast.machoNombre || 'No especificado') : null,
          machoIdentificacion: data.machoId ? (dataCast.machoIdentificacion || 'No especificado') : null
        };
        
        // Calcular fecha probable de parto si no existe
        if (!eventoData.fechaPartoEstimada && eventoData.fechaMonta) {
          const fechaMonta = new Date(eventoData.fechaMonta);
          const fechaProbable = new Date(fechaMonta);
          fechaProbable.setDate(fechaMonta.getDate() + 283); // 283 días de gestación promedio
          eventoData.fechaPartoEstimada = fechaProbable.toISOString();
        }
        
        setEvento(eventoData);
        
        // Calcular estado del parto
        const estadoParto = getEstadoParto(eventoData.fechaPartoEstimada, eventoData.fechaPartoReal);
        setEstado(estadoParto);
        
        // Cargar crías - intentar cargar siempre para ver si hay datos
        try {
          console.log('Intentando cargar crías para el evento:', Number(id));
          const criasData = await reproduccionService.getCrias(Number(id));
          
          if (criasData && criasData.length > 0) {
            console.log('Crías cargadas correctamente:', criasData);
            const transformedCrias = criasData.map(cria => ({
              id: cria.id as number,
              numeroIdentificacion: cria.numeroIdentificacion || 'Sin identificación',
              sexo: cria.sexo as 'H' | 'M',
              pesoNacimiento: cria.pesoNacimiento,
              estado: ('estado' in cria ? cria.estado : 'vivo') as 'vivo' | 'muerto',
              nombre: cria.nombre || '',
              fechaNacimiento: cria.fechaNacimiento || eventoData.fechaPartoReal
            }));
            setCrias(transformedCrias);
            console.log('Crías transformadas:', transformedCrias);
          } else {
            console.log('No se encontraron crías para este evento');
            setCrias([]);
          }
        } catch (error) {
          console.error('Error cargando crías:', error);
          enqueueSnackbar('Error al cargar las crías', { variant: 'error' });
          setCrias([]);
        }
        
        // Cargar historial reproductivo de la hembra
        if (data.hembraId) {
          try {
            console.log('Intentando cargar historial reproductivo para la hembra ID:', data.hembraId);
            const historialData = await reproduccionService.getHistorialReproductivo(data.hembraId);
            console.log('Datos del historial recibidos:', historialData);
            
            if (historialData && historialData.length > 0) {
              // Transform data to match ReproduccionEvento type
              const transformedHistorial = historialData.map(item => {
                const dataCast = item as any;
                return {
                  id: item.id as number,
                  hembraId: dataCast.hembraId || data.hembraId,
                  machoId: dataCast.machoId ?? null,
                  tipoMonta: dataCast.tipoEvento || dataCast.tipoMonta || '',
                  fechaMonta: dataCast.fecha || dataCast.fechaMonta || '',
                  fechaConfirmacionPrenez: dataCast.fechaConfirmacionPrenez || null,
                  fechaPartoEstimada: dataCast.fechaProbableParto || dataCast.fechaPartoEstimada || null,
                  fechaPartoReal: dataCast.fechaRealParto || dataCast.fechaPartoReal || null,
                  resultado: dataCast.resultado || null,
                  observaciones: dataCast.observaciones || null,
                  metodoReproduccion: dataCast.metodoReproduccion || dataCast.tipoEvento || dataCast.tipoMonta || '',
                  hembraNombre: dataCast.hembraNombre || (eventoData.hembraId === dataCast.hembraId ? eventoData.hembraNombre : 'No especificado'),
                  hembraIdentificacion: dataCast.hembraIdentificacion || 'No especificado',
                  machoNombre: dataCast.machoNombre || null,
                  machoIdentificacion: dataCast.machoIdentificacion || null
                } as ReproduccionEvento;
              }).filter(item => typeof item.id === 'number' && item.id !== Number(id));
              
              console.log('Historial transformado:', transformedHistorial);
              setHistorial(transformedHistorial);
            } else {
              console.log('No se encontró historial reproductivo para esta hembra');
              setHistorial([]);
            }
          } catch (error) {
            console.error('Error cargando historial:', error);
            enqueueSnackbar('Error al cargar el historial reproductivo', { variant: 'error' });
            setHistorial([]);
          }
        }
      } catch (error) {
        console.error('Error cargando datos de reproducción:', error);
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, [id]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const renderInfoItem = (icon: React.ReactNode, label: string, value: React.ReactNode) => (
    <ListItem>
      <ListItemIcon>{icon}</ListItemIcon>
      <ListItemText 
        primary={label} 
        secondary={value || 'No especificado'} 
        primaryTypographyProps={{ variant: 'subtitle2' }}
      />
    </ListItem>
  );

  if (loading) {
    return <LinearProgress />;
  }

  if (!evento) {
    return (
      <Box textAlign="center" p={3}>
        <Typography variant="h6">No se encontró el evento de reproducción</Typography>
        <Button onClick={() => navigate(-1)} sx={{ mt: 2 }}>
          Volver atrás
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center">
          <IconButton onClick={() => navigate(-1)} sx={{ mr: 1 }}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h4">Detalle del Evento de Reproducción</Typography>
        </Box>
        <Button
          variant="contained"
          color="primary"
          startIcon={<Edit />}
          onClick={() => navigate(`/reproduccion/${id}/editar`)}
        >
          Editar
        </Button>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <Event color="primary" sx={{ mr: 1 }} /> Información Básica
              </Typography>
              <List dense>
                {renderInfoItem(
                  <Event color="action" />,
                  'Tipo de Evento',
                  <Chip 
                    label={evento.tipoMonta} 
                    size="small" 
                    color={getEventoColor(evento.tipoMonta)} 
                  />
                )}
                {renderInfoItem(
                  <CalendarToday color="action" />,
                  'Fecha del Evento',
                  formatearFecha(evento.fechaMonta, true)
                )}
                {evento.observaciones && renderInfoItem(
                  <Notes color="action" />,
                  'Observaciones',
                  evento.observaciones
                )}
              </List>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <PregnantWoman color="secondary" sx={{ mr: 1 }} /> Estado y Fechas Importantes
              </Typography>
              <List dense>
                {estado && renderInfoItem(
                  estado.icon,
                  'Estado del Evento',
                  <Chip 
                    label={estado.texto} 
                    color={estado.color} 
                    size="small" 
                    icon={estado.icon} 
                  />
                )}
                {renderInfoItem(
                  <EventAvailable color="action" />,
                  'Fecha Probable de Parto',
                  formatearFecha(evento.fechaPartoEstimada)
                )}
               
                {renderInfoItem(
                  <ChildCare color="action" />,
                  'Fecha Real del Parto',
                  evento.fechaPartoReal ? formatearFecha(evento.fechaPartoReal) : 'No registrado'
                )}
              </List>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Box sx={{ width: '100%' }}>
        <Paper>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            indicatorColor="primary"
            textColor="primary"
            variant="fullWidth"
          >
            <Tab label="Resumen" {...a11yProps(0)} />
            <Tab label={`Crías`} {...a11yProps(1)} disabled={!evento.fechaPartoReal} />
            <Tab label={`Historial (${historial.length})`} {...a11yProps(2)} />
          </Tabs>
          
          <TabPanel value={tabValue} index={0}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardHeader 
                    title="Hembra" 
                    avatar={
                      <Avatar sx={{ bgcolor: 'secondary.main' }}>
                        <Female />
                      </Avatar>
                    }
                  />
                  <CardContent>
                    <List dense>
                      {renderInfoItem(<Person color="action" />, 'ID', evento.hembraId)}
                      {evento.hembraNombre && renderInfoItem(<Person color="action" />, 'Nombre', evento.hembraNombre)}
                      {renderInfoItem(<Person color="action" />, 'Identificación', evento.hembraIdentificacion || 'No especificado')}
                    </List>
                  </CardContent>
                </Card>
              </Grid>
              
              {evento.machoId && (
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardHeader 
                      title="Macho" 
                      avatar={
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          <Male />
                        </Avatar>
                      }
                    />
                    <CardContent>
                      <List dense>
                        {renderInfoItem(<Person color="action" />, 'ID', evento.machoId)}
                        {evento.machoNombre && renderInfoItem(<Person color="action" />, 'Nombre', evento.machoNombre)}
                        {renderInfoItem(<Person color="action" />, 'Identificación', evento.machoIdentificacion || 'No especificado')}
                        {evento.metodoReproduccion && renderInfoItem(
                          <LocalHospital color="action" />,
                          'Método',
                          evento.metodoReproduccion
                        )}
                      </List>
                    </CardContent>
                  </Card>
                </Grid>
              )}
            </Grid>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <Box textAlign="center" p={3}>
              {evento.fechaPartoReal ? (
                <>
                
                  
                  <Button 
                    variant="contained" 
                    color="primary"
                    size="large"
                    onClick={() => {
                      if (evento.id) {
                        // Preparamos la URL con todos los datos relevantes para la cría
                        const params = new URLSearchParams();
                        params.append('reproduccionId', evento.id.toString());
                        
                        // Si tenemos datos de los padres, los agregamos
                        if (evento.hembraId) {
                          params.append('madreId', evento.hembraId.toString());
                        }
                        if (evento.machoId) {
                          params.append('padreId', evento.machoId.toString());
                        }
                        
                        // Si tenemos fecha de parto real, la usamos como fecha de nacimiento
                        if (evento.fechaPartoReal) {
                          params.append('fechaNacimiento', evento.fechaPartoReal);
                        }
                        
                        // Navegamos con los parámetros
                        navigate(`/animales/nuevo?${params.toString()}`);
                      }
                    }}
                    startIcon={<ChildCare />}
                  >
                    {crias.length > 0 ? 'Registrar Más Crías' : 'Registrar Crías'}
                  </Button>
                </>
              ) : (
                <>
                  
                  
                  {evento.fechaPartoEstimada && (
                    <Button 
                      variant="outlined" 
                      color="primary"
                      size="large" 
                      onClick={() => evento.id && navigate(`/reproduccion/registrar-parto/${evento.id}`)}
                      startIcon={<EventAvailable />}
                    >
                      Registrar Parto
                    </Button>
                  )}
                </>
              )}
            </Box>
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            {historial.length > 0 ? (
              <>
                <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <History color="primary" sx={{ mr: 1 }} /> Historial Reproductivo de la Hembra
                </Typography>
                
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell><strong>Fecha</strong></TableCell>
                        <TableCell><strong>Tipo</strong></TableCell>
                        <TableCell><strong>Macho</strong></TableCell>
                        <TableCell><strong>Estado</strong></TableCell>
                        <TableCell><strong>Resultado</strong></TableCell>
                        <TableCell><strong>Acciones</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {historial.map((evento) => {
                        const estadoParto = getEstadoParto(evento.fechaPartoEstimada, evento.fechaPartoReal);
                        return (
                          <TableRow key={evento.id}>
                            <TableCell>
                              <Box>
                                <Tooltip title="Fecha de Monta" arrow placement="top">
                                  <Chip 
                                    size="small" 
                                    color="primary" 
                                    variant="outlined"
                                    label={formatearFecha(evento.fechaMonta!)} 
                                  />
                                </Tooltip>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {evento.metodoReproduccion || evento.tipoMonta || 'Monta Natural'}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              {evento.machoId ? (
                                <Box display="flex" alignItems="center">
                                  <Male color="primary" fontSize="small" style={{ marginRight: 4 }} />
                                  {evento.machoNombre ? (
                                    <Typography variant="body2">
                                      {evento.machoNombre} ({evento.machoIdentificacion || 'No ID'})
                                    </Typography>
                                  ) : (
                                    <Typography variant="body2">
                                      ID: {evento.machoId}
                                    </Typography>
                                  )}
                                </Box>
                              ) : 'No especificado'}
                            </TableCell>
                            <TableCell>
                              <Chip 
                                icon={estadoParto?.icon}
                                size="small" 
                                label={estadoParto?.texto} 
                                color={estadoParto?.color} 
                              />
                            </TableCell>
                            <TableCell>
                              {evento.resultado ? (
                                <Chip 
                                  size="small" 
                                  color={evento.resultado === 'parto_exitoso' ? 'success' : 
                                         evento.resultado === 'aborto' ? 'error' : 
                                         'warning'} 
                                  label={evento.resultado === 'parto_exitoso' ? 'Parto Exitoso' : 
                                         evento.resultado === 'aborto' ? 'Aborto' : 
                                         evento.resultado} 
                                />
                              ) : (
                                <Typography variant="body2" color="textSecondary">Pendiente</Typography>
                              )}
                            </TableCell>
                            <TableCell>
                              <Button 
                                size="small" 
                                variant="outlined"
                                color="primary"
                                onClick={() => navigate(`/reproduccion/${evento.id}`)}
                              >
                                Ver Detalle
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </>
            ) : (
              <Box textAlign="center" p={3}>
                <Typography variant="body1" color="textSecondary">
                  No hay registros de eventos reproductivos anteriores para este animal.
                </Typography>
              </Box>
            )}
          </TabPanel>
        </Paper>
      </Box>
    </Box>
  );
};

// Helper components
function a11yProps(index: number) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  };
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default ReproduccionDetallePage;