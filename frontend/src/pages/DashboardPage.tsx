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
import produccionService from '../services/produccionService';
import reproduccionService from '../services/reproduccionService';
import { useAuth } from '../context/AuthContext';

interface ProductionData {
  date: string;
  litros: number;
}

// Datos de ejemplo para el gráfico
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
    ultimosRegistros: [] as any[],
  });
  
  const theme = useTheme();
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const isAdmin = hasRole('Administrador');
  
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Obtener datos de animales
        const animalesData = await animalService.getAnimales(1, 1);
        
        // Obtener datos de producción de hoy
        const hoy = format(new Date(), 'yyyy-MM-dd');
        const produccionHoy = 0; // Aquí iría la llamada real al servicio
        
        // Obtener próximos partos (últimos 7 días)
        const proximosPartos = 0; // Aquí iría la llamada real al servicio
        
        // Obtener controles de salud pendientes
        const controlesPendientes = 0; // Aquí iría la llamada real al servicio
        
        // Últimos registros (ejemplo)
        const ultimosRegistros = [
          { id: 1, tipo: 'produccion', descripcion: 'Registro de producción', fecha: new Date() },
          { id: 2, tipo: 'salud', descripcion: 'Control de salud', fecha: subDays(new Date(), 1) },
          { id: 3, tipo: 'reproduccion', descripcion: 'Nuevo registro de monta', fecha: subDays(new Date(), 2) },
        ];
        
        setStats({
          totalAnimales: animalesData.totalCount || 0,
          animalesActivos: 0, // Actualizar con datos reales
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
  
  const productionData = generateProductionData();
  
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
        <Grid item xs={12}>
          <Card>
            <CardHeader 
              title="Próximos Eventos" 
              action={
                <Button 
                  color="primary" 
                  startIcon={<CalendarIcon />}
                  onClick={() => navigate('/calendario')}
                >
                  Ver Calendario
                </Button>
              }
            />
            <Divider />
            <CardContent>
              <Typography variant="body1" color="textSecondary" align="center" sx={{ py: 4 }}>
                No hay eventos programados para los próximos días.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardPage;
