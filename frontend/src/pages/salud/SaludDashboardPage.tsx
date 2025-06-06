import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Card,
  CardContent,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  AccessTime as ClockIcon,
  Warning as WarningIcon,
  Event as EventIcon,
  LocalHospital as HospitalIcon,
  Vaccines as VaccineIcon,
  Pets as PetsIcon,
} from '@mui/icons-material';
import { format, isAfter, isBefore, parseISO, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

import { saludService, ResumenSalud, TipoControlPorMes, EstadoPorTipo } from '../../services/saludService';
import { animalService } from '../../services/animalService';

// Colores para gráficos
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const SaludDashboardPage: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [resumen, setResumen] = useState<ResumenSalud>({
    totalControles: 0,
    completados: 0,
    pendientes: 0,
    atrasados: 0,
    proximosControles: []
  });
  const [animalId, setAnimalId] = useState<number | string>('');
  const [animales, setAnimales] = useState<{items: any[], totalCount: number}>({items: [], totalCount: 0});
  const [tiposPorMes, setTiposPorMes] = useState<TipoControlPorMes[]>([]);
  const [estadosPorTipo, setEstadosPorTipo] = useState<EstadoPorTipo[]>([]);
  const [año, setAño] = useState<number>(new Date().getFullYear());

  // Cargar datos para el dashboard
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Cargar animales para filtro
        const animalData = await animalService.getAnimales();
        setAnimales(animalData); // animalData ya tiene la estructura {items, totalCount}
        
        // Cargar resumen de salud
        const resumenData = await saludService.getResumenSalud(
          typeof animalId === 'number' ? animalId : undefined
        );
        setResumen(resumenData);
        
        // Cargar datos de controles por mes y tipo
        const tiposData = await saludService.getControlesPorMes(
          typeof animalId === 'number' ? animalId : undefined,
          año
        );
        console.log('Datos de controles por mes recibidos:', tiposData);
        setTiposPorMes(tiposData);
        
        // Cargar datos de estados por tipo
        const estadosData = await saludService.getEstadosPorTipo(
          typeof animalId === 'number' ? animalId : undefined
        );
        console.log('Datos de estados por tipo recibidos:', estadosData);
        setEstadosPorTipo(estadosData);
        
      } catch (error) {
        console.error('Error al cargar datos del dashboard:', error);
        setError('Error al cargar los datos. Por favor, intente nuevamente.');
      } finally {
        setLoading(false);
      }
    };
    
    loadDashboardData();
  }, [animalId, año]);

  // Manejar cambio de filtro por animal
  const handleAnimalChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setAnimalId(event.target.value as number);
  };
  
  // Manejar cambio de año para filtrado
  const handleAñoChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setAño(event.target.value as number);
  };
  
  // Obtener lista de años para el selector (año actual y 5 años atrás)
  const añosDisponibles = () => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 6 }, (_, i) => currentYear - i);
  };

  // Preparar datos para gráfico de estado general (pie chart)
  const estadoGeneralData = [
    { name: 'Completados', value: resumen.completados, color: '#00C49F' },
    { name: 'Pendientes', value: resumen.pendientes, color: '#0088FE' },
    { name: 'Atrasados', value: resumen.atrasados, color: '#FF8042' },
  ];

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      {/* Título y filtros */}
      <Grid container spacing={2} alignItems="center" sx={{ mb: 3 }}>
        <Grid item xs={12} md={6} lg={4}>
          <Typography variant="h5">Dashboard de Salud Animal</Typography>
        </Grid>
        <Grid item xs={12} md={3} lg={4}>
          <FormControl fullWidth variant="outlined" size="small">
            <InputLabel id="animal-filter-label">Filtrar por Animal</InputLabel>
            <Select
              labelId="animal-filter-label"
              id="animal-filter"
              value={animalId}
              onChange={handleAnimalChange as any}
              label="Filtrar por Animal"
            >
              <MenuItem value="">Todos los animales</MenuItem>
              {animales.items && animales.items.map((animal) => (
                <MenuItem key={animal.id} value={animal.id}>
                  {animal.numeroIdentificacion} - {animal.nombre || 'Sin nombre'}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={3} lg={4}>
          <FormControl fullWidth variant="outlined" size="small">
            <InputLabel id="year-filter-label">Año</InputLabel>
            <Select
              labelId="year-filter-label"
              id="year-filter"
              value={año}
              onChange={handleAñoChange as any}
              label="Año"
            >
              {añosDisponibles().map((year) => (
                <MenuItem key={year} value={year}>{year}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      {/* Mensajes de error */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Tarjetas de resumen */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <HospitalIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="subtitle1" color="textSecondary">
                  Controles Totales
                </Typography>
              </Box>
              <Typography variant="h4">{resumen.totalControles}</Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <CheckCircleIcon sx={{ color: 'success.main', mr: 1 }} />
                <Typography variant="subtitle1" color="textSecondary">
                  Completados
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ color: 'success.main' }}>
                {resumen.completados}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <ClockIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="subtitle1" color="textSecondary">
                  Pendientes
                </Typography>
              </Box>
              <Typography variant="h4" color="primary">
                {resumen.pendientes}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <WarningIcon sx={{ color: 'error.main', mr: 1 }} />
                <Typography variant="subtitle1" color="textSecondary">
                  Atrasados
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ color: 'error.main' }}>
                {resumen.atrasados}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Gráficos y listas */}
      <Grid container spacing={3}>
        {/* Gráfico de estado general (pie chart) */}
        <Grid item xs={12} md={6} lg={4}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Estado General
            </Typography>
            <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={estadoGeneralData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {estadoGeneralData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>
        
        {/* Controles por mes y tipo (bar chart) */}
        <Grid item xs={12} md={6} lg={8}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Controles por Mes y Tipo
            </Typography>
            <Box sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={tiposPorMes}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="vacuna" name="Vacuna" fill="#8884d8" />
                  <Bar dataKey="tratamiento" name="Tratamiento" fill="#82ca9d" />
                  <Bar dataKey="revision" name="Revisión" fill="#ffc658" />
                  <Bar dataKey="cirugia" name="Cirugía" fill="#ff8042" />
                  <Bar dataKey="otro" name="Otros" fill="#8dd1e1" />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* Estado por tipo de control (stacked bar) */}
        <Grid item xs={12} lg={8}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Estado por Tipo de Control
            </Typography>
            <Box sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={estadosPorTipo}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  layout="vertical"
                >
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="completado" name="Completados" stackId="a" fill="#00C49F" />
                  <Bar dataKey="pendiente" name="Pendientes" stackId="a" fill="#0088FE" />
                  <Bar dataKey="atrasado" name="Atrasados" stackId="a" fill="#FF8042" />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>
        
        {/* Próximos controles */}
        <Grid item xs={12} lg={4}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <EventIcon sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h6">Próximos Controles</Typography>
            </Box>
            
            <List sx={{ width: '100%' }}>
              {resumen.proximosControles && resumen.proximosControles.length > 0 ? (
                resumen.proximosControles.map((control) => (
                  <React.Fragment key={control.id}>
                    <ListItem alignItems="flex-start">
                      <ListItemIcon>
                        {control.tipo === 'vacuna' ? (
                          <VaccineIcon color="primary" />
                        ) : control.tipo === 'tratamiento' ? (
                          <HospitalIcon color="secondary" />
                        ) : (
                          <PetsIcon color="action" />
                        )}
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="body1">{control.descripcion}</Typography>
                            <Chip 
                              label={`${control.diasRestantes} días`}
                              color="primary"
                              size="small"
                            />
                          </Box>
                        }
                        secondary={
                          <>
                            <Typography variant="body2" component="span">
                              {format(new Date(control.fecha), "dd/MM/yyyy")}
                            </Typography>
                            <Typography variant="body2" component="span" sx={{ ml: 1 }}>
                              Animal: {control.numeroIdentificacion}
                            </Typography>
                          </>
                        }
                      />
                    </ListItem>
                    <Divider variant="inset" component="li" />
                  </React.Fragment>
                ))
              ) : (
                <ListItem>
                  <ListItemText primary="No hay controles próximos" />
                </ListItem>
              )}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SaludDashboardPage;
