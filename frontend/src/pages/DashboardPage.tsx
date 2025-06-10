import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  CircularProgress,
  useTheme,
} from '@mui/material';
import {
  Pets as AnimalsIcon,
  LocalDrink as MilkIcon,
  Favorite as ReproductionIcon,
  LocalHospital as HealthIcon,
  EventAvailable as CalendarIcon,
  Warning as WarningIcon,
  ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import animalService, { Animal } from '../services/animalService';
import produccionService, { ProduccionLeche } from '../services/produccionService';
import reproduccionService, { ReproduccionBaseDto } from '../services/reproduccionService';
import saludService from '../services/saludService'; // Import the saludService
import { useAuth } from '../context/AuthContext';

interface ProductionData {
  date: string;
  litros: number;
}

interface RecentActivity {
  id: number;
  tipo: 'produccion' | 'salud' | 'reproduccion';
  descripcion: string;
  fecha: Date;
}

interface UpcomingEvent {
  id: number;
  tipo: 'salud' | 'reproduccion';
  descripcion: string;
  fecha: Date;
  diasRestantes: number;
}

// Función para generar fechas para últimos 7 días
const getLastSevenDaysRange = () => {
  const today = new Date();
  const sevenDaysAgo = subDays(today, 6);
  return {
    start: format(sevenDaysAgo, 'yyyy-MM-dd'),
    end: format(today, 'yyyy-MM-dd')
  };
};

// Función de utilidad para acceder a propiedades de forma segura
function getPropertySafe<T, K extends string>(obj: T, key: K): any {
  return (obj as any)[key];
}

// Función para convertir fechas de forma segura
function safeParseDate(dateStr: string | null | undefined): Date {
  if (!dateStr) return new Date(); // Fecha actual como fallback
  
  try {
    // Intentar parsear como ISO string
    const date = new Date(dateStr);
    // Verificar si la fecha es válida
    if (isNaN(date.getTime())) {
      console.warn('Fecha inválida:', dateStr);
      return new Date(); // Fecha actual como fallback
    }
    return date;
  } catch (error) {
    console.warn('Error al parsear fecha:', dateStr, error);
    return new Date(); // Fecha actual como fallback
  }
}

// Datos de ejemplo para el gráfico (fallback)
const generateProductionData = () => {
  const data: ProductionData[] = [];
  const today = new Date();
  
  for (let i = 6; i >= 0; i--) {
    const date = subDays(today, i);
    data.push({
      date: format(date, 'EEE', { locale: es }),
      litros: Math.floor(Math.random() * 100) + 50,
    });
  }
  
  return data;
};

const DashboardPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalAnimales: 0,
    animalesActivos: 0,
    produccionHoy: 0,
    proximosPartos: 0,
    controlesPendientes: 0,
    ultimosRegistros: [] as RecentActivity[],
  });
  const [productionData, setProductionData] = useState<ProductionData[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<UpcomingEvent[]>([]);
  
  const theme = useTheme();
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const isAdmin = hasRole('Administrador');
  
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Obtener datos de animales
        const animalesData = await animalService.getAnimales(1, 1000, '', 'todos');
        const animalesList = animalesData.items || [];
        const totalAnimales = animalesData.totalCount || 0;
        const animalesActivos = animalesList.filter((animal: Animal) => animal.activo).length;
        
        // Obtener datos de producción de hoy
        const hoy = format(new Date(), 'yyyy-MM-dd');
        let produccionHoy = 0;
        
        try {
          const produccionResponse = await produccionService.getProducciones(1, 1000, hoy, hoy);
          const registrosHoy = produccionResponse.items || [];
          produccionHoy = registrosHoy.reduce((sum: number, registro: ProduccionLeche) => sum + (registro.cantidadLitros || 0), 0);
        } catch (error) {
          console.error('Error al obtener producción de hoy:', error);
        }
        
        // Obtener producción de los últimos 7 días para el gráfico
        try {
          const dateRange = getLastSevenDaysRange();
          const produccionSemanaResponse = await produccionService.getProducciones(1, 1000, dateRange.start, dateRange.end);
          const registrosSemana = produccionSemanaResponse.items || [];
          
          // Agrupar por fecha
          const produccionPorDia = registrosSemana.reduce((acc: Record<string, number>, registro: ProduccionLeche) => {
            const fecha = registro.fecha.toString().split('T')[0];
            if (!acc[fecha]) {
              acc[fecha] = 0;
            }
            acc[fecha] += registro.cantidadLitros || 0;
            return acc;
          }, {} as Record<string, number>);
          
          // Crear array para el gráfico
          const chartData: ProductionData[] = [];
          for (let i = 6; i >= 0; i--) {
            const date = subDays(new Date(), i);
            const formattedDate = format(date, 'yyyy-MM-dd');
            const dayName = format(date, 'EEE', { locale: es });
            chartData.push({
              date: dayName,
              litros: produccionPorDia[formattedDate] || 0
            });
          }
          setProductionData(chartData);
        } catch (error) {
          console.error('Error al obtener producción de la semana:', error);
          // Fallback a datos generados
          setProductionData(generateProductionData());
        }
        
        // Obtener próximos partos (próximos 30 días)
        let proximosPartos = 0;
        try {
          const partosResponse = await reproduccionService.getProximosPartos(30);
          proximosPartos = Array.isArray(partosResponse) ? partosResponse.length : 0;
        } catch (error) {
          console.error('Error al obtener próximos partos:', error);
        }
        
        // Obtener controles de salud pendientes
        let controlesPendientes = 0;
        try {
          const saludResumen = await saludService.getResumenSalud();
          controlesPendientes = saludResumen.pendientes;
        } catch (error) {
          console.error('Error al obtener controles pendientes:', error);
        }
        
        // Obtener próximos eventos (controles de salud y partos programados)
        const proximosEventos: UpcomingEvent[] = [];
        
        try {
          // Obtener próximos controles de salud
          const proximosControles = await saludService.getProximosControles(30);
          if (Array.isArray(proximosControles) && proximosControles.length > 0) {
            proximosControles.forEach((control) => {
              proximosEventos.push({
                id: control.id,
                tipo: 'salud',
                descripcion: `${control.tipo}: ${control.animalNombre} - ${control.descripcion}`,
                fecha: new Date(control.fecha),
                diasRestantes: control.diasRestantes
              });
            });
          }
          
          // Obtener próximos partos
          const proximosPartosData = await reproduccionService.getProximosPartos(30);
          if (Array.isArray(proximosPartosData) && proximosPartosData.length > 0) {
            proximosPartosData.forEach((parto) => {
              const fechaEstimada = new Date(parto.fechaPartoEstimada || parto.FechaProbableParto);
              const hoy = new Date();
              const diasRestantes = Math.ceil((fechaEstimada.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
              
              proximosEventos.push({
                id: parto.id || 0,
                tipo: 'reproduccion',
                descripcion: `Parto programado: ${parto.hembraNombre || parto.HembraNombre || 'Animal'}`,
                fecha: fechaEstimada,
                diasRestantes: diasRestantes
              });
            });
          }
          
          // Ordenar por fecha más cercana
          proximosEventos.sort((a, b) => a.diasRestantes - b.diasRestantes);
          
          setUpcomingEvents(proximosEventos);
        } catch (error) {
          console.error('Error al obtener próximos eventos:', error);
          setUpcomingEvents([]);
        }
        
        // Obtener actividades recientes (últimos registros de cada tipo)
        const ultimosRegistros: RecentActivity[] = [];
        
        try {
          // Últimos registros de producción
          const produccionReciente = await produccionService.getProducciones(1, 3);
          if (produccionReciente.items && produccionReciente.items.length > 0) {
            produccionReciente.items.forEach((item: ProduccionLeche) => {
              ultimosRegistros.push({
                id: item.id || 0,
                tipo: 'produccion',
                descripcion: `Registro de producción: ${item.cantidadLitros} L - ${item.animalNombre || 'Animal'}`,
                fecha: new Date(item.fecha)
              });
            });
          }
          
          // Últimos controles de salud
          const saludReciente = await saludService.getPaginated(1, 3);
          if (saludReciente.items && saludReciente.items.length > 0) {
            saludReciente.items.forEach((item) => {
              ultimosRegistros.push({
                id: item.id || 0,
                tipo: 'salud',
                descripcion: `${item.tipo}: ${item.descripcion}`,
                fecha: new Date(item.fecha)
              });
            });
          }
          
          // Últimos eventos reproductivos
          const reproduccionReciente = await reproduccionService.getReproducciones(1, 3);
          if (reproduccionReciente.items && reproduccionReciente.items.length > 0) {
            reproduccionReciente.items.forEach((item: ReproduccionBaseDto) => {
              ultimosRegistros.push({
                id: getPropertySafe(item, 'Id') || 0,
                tipo: 'reproduccion',
                descripcion: `${getPropertySafe(item, 'TipoEvento')}: ${(item as any).HembraNombre || 'Animal'} ${getPropertySafe(item, 'Resultado') ? `- ${getPropertySafe(item, 'Resultado')}` : ''}`,
                fecha: safeParseDate(getPropertySafe(item, 'Fecha'))
              });
            });
          }
          
          // Ordenar por fecha más reciente
          ultimosRegistros.sort((a, b) => b.fecha.getTime() - a.fecha.getTime());
          
        } catch (error) {
          console.error('Error al obtener registros recientes:', error);
          // Datos de ejemplo en caso de error
          ultimosRegistros.push(
            { id: 1, tipo: 'produccion', descripcion: 'Registro de producción', fecha: new Date() },
            { id: 2, tipo: 'salud', descripcion: 'Control de salud', fecha: subDays(new Date(), 1) },
            { id: 3, tipo: 'reproduccion', descripcion: 'Nuevo registro de monta', fecha: subDays(new Date(), 2) }
          );
        }
        
        setStats({
          totalAnimales,
          animalesActivos,
          produccionHoy,
          proximosPartos,
          controlesPendientes,
          ultimosRegistros,
        });
      } catch (error) {
        console.error('Error al cargar datos del dashboard:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);
  
  const getIconByType = (type: string) => {
    switch (type) {
      case 'produccion':
        return <MilkIcon color="primary" />;
      case 'salud':
        return <HealthIcon color="error" />;
      case 'reproduccion':
        return <ReproductionIcon color="secondary" />;
      default:
        return <WarningIcon color="warning" />;
    }
  };
  
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Panel de Control
      </Typography>
      
      {/* Estadísticas principales */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={4} lg={2.4}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <div>
                  <Typography color="textSecondary" gutterBottom>
                    Total de Animales
                  </Typography>
                  <Typography variant="h4">{stats.totalAnimales}</Typography>
                </div>
                <Box
                  bgcolor={theme.palette.primary.light}
                  color={theme.palette.primary.contrastText}
                  p={2}
                  borderRadius="50%"
                >
                  <AnimalsIcon />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={4} lg={2.4}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <div>
                  <Typography color="textSecondary" gutterBottom>
                    Animales Activos
                  </Typography>
                  <Typography variant="h4">{stats.animalesActivos}</Typography>
                </div>
                <Box
                  bgcolor={theme.palette.success.light}
                  color={theme.palette.success.contrastText}
                  p={2}
                  borderRadius="50%"
                >
                  <AnimalsIcon />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={4} lg={2.4}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <div>
                  <Typography color="textSecondary" gutterBottom>
                    Producción Hoy
                  </Typography>
                  <Typography variant="h4">{stats.produccionHoy} L</Typography>
                </div>
                <Box
                  bgcolor={theme.palette.info.light}
                  color={theme.palette.info.contrastText}
                  p={2}
                  borderRadius="50%"
                >
                  <MilkIcon />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={4} lg={2.4}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <div>
                  <Typography color="textSecondary" gutterBottom>
                    Próximos Partos
                  </Typography>
                  <Typography variant="h4">{stats.proximosPartos}</Typography>
                </div>
                <Box
                  bgcolor={theme.palette.warning.light}
                  color={theme.palette.warning.contrastText}
                  p={2}
                  borderRadius="50%"
                >
                  <ReproductionIcon />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={4} lg={2.4}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <div>
                  <Typography color="textSecondary" gutterBottom>
                    Controles Pendientes
                  </Typography>
                  <Typography variant="h4">{stats.controlesPendientes}</Typography>
                </div>
                <Box
                  bgcolor={theme.palette.error.light}
                  color={theme.palette.error.contrastText}
                  p={2}
                  borderRadius="50%"
                >
                  <HealthIcon />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Gráfico de producción y últimos registros */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardHeader 
              title="Producción de Leche (Últimos 7 días)" 
              action={
                <Button 
                  color="primary" 
                  endIcon={<ArrowForwardIcon />}
                  onClick={() => navigate('/produccion')}
                >
                  Ver más
                </Button>
              }
            />
            <Divider />
            <CardContent sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={productionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="litros" name="Litros" fill={theme.palette.primary.main} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card>
            <CardHeader 
              title="Actividad Reciente" 
              action={
                <Button 
                  color="primary" 
                  endIcon={<ArrowForwardIcon />}
                  onClick={() => navigate('/actividad')}
                >
                  Ver todo
                </Button>
              }
            />
            <Divider />
            <List>
              {stats.ultimosRegistros.map((item) => (
                <React.Fragment key={item.id}>
                  <ListItem>
                    <ListItemIcon>
                      {getIconByType(item.tipo)}
                    </ListItemIcon>
                    <ListItemText
                      primary={item.descripcion}
                      secondary={format(new Date(item.fecha), 'PPp', { locale: es })}
                    />
                  </ListItem>
                  <Divider variant="inset" component="li" />
                </React.Fragment>
              ))}
            </List>
          </Card>
        </Grid>
      </Grid>
      
      {/* Próximos eventos */}
      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardHeader title="Próximos Eventos" />
            <Divider />
            <CardContent>
              {upcomingEvents.length > 0 ? (
                <List>
                  {upcomingEvents.slice(0, 5).map((event) => (
                    <ListItem key={`${event.tipo}-${event.id}`} divider>
                      <ListItemIcon>
                        {event.tipo === 'salud' ? 
                          <HealthIcon color="error" /> : 
                          <ReproductionIcon color="secondary" />
                        }
                      </ListItemIcon>
                      <ListItemText 
                        primary={event.descripcion} 
                        secondary={`${format(event.fecha, 'dd MMM yyyy', { locale: es })} (en ${event.diasRestantes} días)`} 
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Box textAlign="center" py={3}>
                  <Typography color="textSecondary">
                    No hay eventos programados para los próximos días.
                  </Typography>
                </Box>
              )}
              
              <Box display="flex" justifyContent="flex-end" mt={2}>
                <Button 
                  variant="text" 
                  endIcon={<ArrowForwardIcon />}
                  onClick={() => navigate('/calendario')}
                  disabled={upcomingEvents.length === 0}
                >
                  Ver todos
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardPage;
