import React from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Divider,
  useTheme,
  useMediaQuery,
  CircularProgress,
  Tooltip,
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
} from '@mui/material';
import {
  Timeline as TimelineIcon,
  EventAvailable as EventAvailableIcon,
  PregnantWoman as PregnantWomanIcon,
  ChildCare as ChildCareIcon,
  EventBusy as EventBusyIcon,
  Refresh as RefreshIcon,
  BarChart as BarChartIcon,
  ShowChart as ShowChartIcon,
  PieChart as PieChartIcon,
  Timeline as TimelineChartIcon,
  CalendarToday as CalendarIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, subMonths, subYears, parseISO, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { EventoReproductivo } from '../ReproduccionTab';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';

interface EstadisticasReproductivasProps {
  eventos: EventoReproductivo[];
  loading: boolean;
  onRefresh: () => void;
}

// Colores para los gráficos
const COLORS = [
  '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', 
  '#82ca9d', '#ffc658', '#d0ed57', '#ff7300', '#a4de6c'
];

const EstadisticasReproductivas: React.FC<EstadisticasReproductivasProps> = ({
  eventos,
  loading,
  onRefresh,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Filtros de fecha
  const [rangoFecha, setRangoFecha] = React.useState({
    inicio: subYears(new Date(), 1),
    fin: new Date(),
  });
  
  // Estado para controlar el diálogo de ayuda
  const [openAyuda, setOpenAyuda] = React.useState(false);
  
  // Filtrar eventos por el rango de fechas seleccionado
  const eventosFiltrados = React.useMemo(() => {
    return eventos.filter(evento => {
      const fechaEvento = new Date(evento.fecha);
      return fechaEvento >= rangoFecha.inicio && fechaEvento <= rangoFecha.fin;
    });
  }, [eventos, rangoFecha]);
  
  // Calcular métricas clave
  const metricas = React.useMemo(() => {
    const metricasIniciales = {
      totalEventos: 0,
      servicios: 0,
      diagnosticos: 0,
      partos: 0,
      abortos: 0,
      exitosos: 0,
      fallidos: 0,
      intervaloEntrePartos: 0,
      diasAbiertos: 0,
      tasaPrenez: 0,
      tasaParto: 0,
    };
    
    if (eventosFiltrados.length === 0) return metricasIniciales;
    
    const eventosPorTipo = eventosFiltrados.reduce((acc, evento) => {
      acc[evento.tipo] = (acc[evento.tipo] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Calcular intervalo entre partos
    const partos = eventosFiltrados
      .filter(e => e.tipo === 'parto')
      .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
    
    let intervaloTotalDias = 0;
    if (partos.length > 1) {
      for (let i = 1; i < partos.length; i++) {
        const dias = differenceInDays(
          new Date(partos[i].fecha),
          new Date(partos[i - 1].fecha)
        );
        intervaloTotalDias += dias;
      }
    }
    
    // Calcular días abiertos (desde el último parto o nacimiento hasta ahora o próximo servicio exitoso)
    let diasAbiertos = 0;
    if (partos.length > 0) {
      const ultimoParto = new Date(partos[partos.length - 1].fecha);
      const hoy = new Date();
      diasAbiertos = differenceInDays(hoy, ultimoParto);
    }
    
    // Calcular tasas
    const totalServicios = eventosFiltrados.filter(e => e.tipo === 'servicio').length;
    const totalDiagnosticos = eventosFiltrados.filter(e => e.tipo === 'diagnostico_preniez').length;
    const diagnosticosPositivos = eventosFiltrados.filter(e => 
      e.tipo === 'diagnostico_preniez' && e.diagnostico === 'positivo'
    ).length;
    
    return {
      totalEventos: eventosFiltrados.length,
      servicios: totalServicios,
      diagnosticos: totalDiagnosticos,
      partos: partos.length,
      abortos: eventosFiltrados.filter(e => e.tipo === 'aborto').length,
      exitosos: eventosFiltrados.filter(e => e.estado === 'completado').length,
      fallidos: eventosFiltrados.filter(e => e.estado === 'cancelado').length,
      intervaloEntrePartos: partos.length > 1 ? Math.round(intervaloTotalDias / (partos.length - 1)) : 0,
      diasAbiertos,
      tasaPrenez: totalDiagnosticos > 0 ? Math.round((diagnosticosPositivos / totalDiagnosticos) * 100) : 0,
      tasaParto: totalServicios > 0 ? Math.round((partos.length / totalServicios) * 100) : 0,
    };
  }, [eventosFiltrados]);
  
  // Datos para gráficos
  const datosGraficos = React.useMemo(() => {
    // Datos para el gráfico de eventos por mes
    const eventosPorMes: Record<string, number> = {};
    const serviciosPorMes: Record<string, number> = {};
    const partosPorMes: Record<string, number> = {};
    
    eventosFiltrados.forEach(evento => {
      const fecha = new Date(evento.fecha);
      const mesAnio = format(fecha, 'MMM yyyy', { locale: es });
      
      // Contar todos los eventos por mes
      eventosPorMes[mesAnio] = (eventosPorMes[mesAnio] || 0) + 1;
      
      // Contar servicios por mes
      if (evento.tipo === 'servicio') {
        serviciosPorMes[mesAnio] = (serviciosPorMes[mesAnio] || 0) + 1;
      }
      
      // Contar partos por mes
      if (evento.tipo === 'parto') {
        partosPorMes[mesAnio] = (partosPorMes[mesAnio] || 0) + 1;
      }
    });
    
    // Convertir a formato para gráfico de líneas
    const mesesUnicos = Array.from(new Set([
      ...Object.keys(eventosPorMes),
      ...Object.keys(serviciosPorMes),
      ...Object.keys(partosPorMes)
    ])).sort((a, b) => {
      return new Date(a).getTime() - new Date(b).getTime();
    });
    
    const datosLineas = mesesUnicos.map(mes => ({
      name: mes,
      'Total Eventos': eventosPorMes[mes] || 0,
      'Servicios': serviciosPorMes[mes] || 0,
      'Partos': partosPorMes[mes] || 0,
    }));
    
    // Datos para el gráfico de pastel de tipos de eventos
    const tiposEventos = eventosFiltrados.reduce((acc, evento) => {
      acc[evento.tipo] = (acc[evento.tipo] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const datosPastel = Object.entries(tiposEventos).map(([tipo, cantidad], index) => ({
      name: tipo === 'diagnostico_preniez' ? 'Diagnósticos' : 
            tipo === 'servicio' ? 'Servicios' :
            tipo.charAt(0).toUpperCase() + tipo.slice(1),
      value: cantidad,
      color: COLORS[index % COLORS.length],
    }));
    
    // Datos para el gráfico de barras de estados
    const estados = eventosFiltrados.reduce((acc, evento) => {
      acc[evento.estado] = (acc[evento.estado] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const datosBarras = Object.entries(estados).map(([estado, cantidad], index) => ({
      name: estado === 'completado' ? 'Completados' :
             estado === 'pendiente' ? 'Pendientes' :
             'Cancelados',
      Cantidad: cantidad,
      color: estado === 'completado' ? '#4caf50' :
              estado === 'pendiente' ? '#ff9800' :
              '#f44336',
    }));
    
    return { datosLineas, datosPastel, datosBarras };
  }, [eventosFiltrados]);
  
  // Componente personalizado para la leyenda del gráfico de pastel
  const renderCustomizedLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
    index,
    name,
  }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = 25 + innerRadius + (outerRadius - innerRadius);
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
  
    return (
      <text
        x={x}
        y={y}
        fill="#666"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        style={{ fontSize: '12px' }}
      >
        {`${name} (${(percent * 100).toFixed(0)}%)`}
      </text>
    );
  };
  
  // Manejar cambio de fechas
  const handleFechaInicioChange = (fecha: Date | null) => {
    if (fecha) {
      setRangoFecha(prev => ({
        ...prev,
        inicio: fecha,
      }));
    }
  };
  
  const handleFechaFinChange = (fecha: Date | null) => {
    if (fecha) {
      setRangoFecha(prev => ({
        ...prev,
        fin: fecha,
      }));
    }
  };
  
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Box>
      {/* Encabezado con controles */}
      <Box mb={3} display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
        <Box display="flex" alignItems="center" gap={1}>
          <TimelineIcon color="primary" />
          <Typography variant="h6">Estadísticas Reproductivas</Typography>
          <Tooltip title="Ayuda">
            <IconButton size="small" onClick={() => setOpenAyuda(true)}>
              <InfoIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
        
        <Box display="flex" gap={2} flexWrap="wrap">
          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
            <DatePicker
              label="Desde"
              value={rangoFecha.inicio}
              onChange={handleFechaInicioChange}
              slotProps={{
                textField: {
                  size: "small",
                  sx: { width: isMobile ? '100%' : 150 }
                }
              }}
            />
            <DatePicker
              label="Hasta"
              value={rangoFecha.fin}
              onChange={handleFechaFinChange}
              slotProps={{
                textField: {
                  size: "small",
                  sx: { width: isMobile ? '100%' : 150 }
                }
              }}
            />
          </LocalizationProvider>
          
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={onRefresh}
            disabled={loading}
          >
            Actualizar
          </Button>
        </Box>
      </Box>
      
      {/* Métricas clave */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={4} lg={3}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Box display="flex" alignItems="center" mb={1}>
              <EventAvailableIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="subtitle2" color="text.secondary">Total Eventos</Typography>
            </Box>
            <Typography variant="h4">{metricas.totalEventos}</Typography>
            <Typography variant="caption" color="text.secondary">
              en el período seleccionado
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={6} md={4} lg={3}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Box display="flex" alignItems="center" mb={1}>
              <PregnantWomanIcon color="secondary" sx={{ mr: 1 }} />
              <Typography variant="subtitle2" color="text.secondary">Tasa de Preñez</Typography>
            </Box>
            <Typography variant="h4">{metricas.tasaPrenez}%</Typography>
            <Typography variant="caption" color="text.secondary">
              {metricas.diagnosticos} diagnósticos realizados
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={6} md={4} lg={3}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Box display="flex" alignItems="center" mb={1}>
              <ChildCareIcon color="success" sx={{ mr: 1 }} />
              <Typography variant="subtitle2" color="text.secondary">Tasa de Parto</Typography>
            </Box>
            <Typography variant="h4">{metricas.tasaParto}%</Typography>
            <Typography variant="caption" color="text.secondary">
              {metricas.partos} partos / {metricas.servicios} servicios
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={6} md={4} lg={3}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Box display="flex" alignItems="center" mb={1}>
              <CalendarIcon color="info" sx={{ mr: 1 }} />
              <Typography variant="subtitle2" color="text.secondary">Días Abiertos</Typography>
            </Box>
            <Typography variant="h4">{metricas.diasAbiertos}</Typography>
            <Typography variant="caption" color="text.secondary">
              desde el último parto
            </Typography>
          </Paper>
        </Grid>
      </Grid>
      
      {/* Gráficos */}
      <Grid container spacing={3} mb={4}>
        {/* Gráfico de líneas - Eventos por mes */}
        <Grid item xs={12} lg={8}>
          <Paper sx={{ p: 2, height: 400 }}>
            <Box display="flex" alignItems="center" mb={2}>
              <ShowChartIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="subtitle1">Eventos por Mes</Typography>
            </Box>
            <ResponsiveContainer width="100%" height="90%">
              <LineChart
                data={datosGraficos.datosLineas}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  angle={-45} 
                  textAnchor="end"
                  height={60}
                  tick={{ fontSize: 12 }}
                />
                <YAxis />
                <ChartTooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="Total Eventos" 
                  stroke="#8884d8" 
                  activeDot={{ r: 8 }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="Servicios" 
                  stroke="#82ca9d" 
                />
                <Line 
                  type="monotone" 
                  dataKey="Partos" 
                  stroke="#ffc658" 
                />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
        
        {/* Gráfico de pastel - Tipos de eventos */}
        <Grid item xs={12} lg={4}>
          <Paper sx={{ p: 2, height: 400 }}>
            <Box display="flex" alignItems="center" mb={2}>
              <PieChartIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="subtitle1">Distribución por Tipo</Typography>
            </Box>
            <ResponsiveContainer width="100%" height="90%">
              <PieChart>
                <Pie
                  data={datosGraficos.datosPastel}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  label={renderCustomizedLabel}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {datosGraficos.datosPastel.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <ChartTooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
        
        {/* Gráfico de barras - Estados */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2, height: 400 }}>
            <Box display="flex" alignItems="center" mb={2}>
              <BarChartIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="subtitle1">Eventos por Estado</Typography>
            </Box>
            <ResponsiveContainer width="100%" height="90%">
              <BarChart
                data={datosGraficos.datosBarras}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <ChartTooltip />
                <Legend />
                <Bar dataKey="Cantidad" name="Cantidad">
                  {datosGraficos.datosBarras.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>
      
      {/* Tabla resumen */}
      <Paper sx={{ p: 2, mb: 4 }}>
        <Box display="flex" alignItems="center" mb={2}>
          <TimelineChartIcon color="primary" sx={{ mr: 1 }} />
          <Typography variant="subtitle1">Resumen de Métricas</Typography>
        </Box>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Métrica</TableCell>
                <TableCell align="right">Valor</TableCell>
                <TableCell>Descripción</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell>Intervalo entre Partos</TableCell>
                <TableCell align="right">
                  {metricas.intervaloEntrePartos} días
                </TableCell>
                <TableCell>Promedio de días entre partos</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Días Abiertos</TableCell>
                <TableCell align="right">
                  {metricas.diasAbiertos} días
                </TableCell>
                <TableCell>Días desde el último parto</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Tasa de Preñez</TableCell>
                <TableCell align="right">
                  {metricas.tasaPrenez}%
                </TableCell>
                <TableCell>Porcentaje de diagnósticos positivos</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Tasa de Parto</TableCell>
                <TableCell align="right">
                  {metricas.tasaParto}%
                </TableCell>
                <TableCell>Partos por cada 100 servicios</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Total Partos</TableCell>
                <TableCell align="right">
                  {metricas.partos}
                </TableCell>
                <TableCell>Número total de partos registrados</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Total Abortos</TableCell>
                <TableCell align="right">
                  {metricas.abortos}
                </TableCell>
                <TableCell>Número total de abortos registrados</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
      
      {/* Diálogo de ayuda */}
      <Dialog open={openAyuda} onClose={() => setOpenAyuda(false)} maxWidth="md">
        <DialogTitle>Ayuda - Estadísticas Reproductivas</DialogTitle>
        <DialogContent>
          <Box mb={3}>
            <Typography variant="h6" gutterBottom>Métricas Clave</Typography>
            <Typography variant="body2" paragraph>
              Las métricas clave proporcionan una visión general del rendimiento reproductivo del animal:
            </Typography>
            <ul>
              <li><strong>Total Eventos:</strong> Número total de eventos reproductivos registrados en el período seleccionado.</li>
              <li><strong>Tasa de Preñez:</strong> Porcentaje de diagnósticos de preñez positivos sobre el total de diagnósticos realizados.</li>
              <li><strong>Tasa de Parto:</strong> Relación entre el número de partos y el número de servicios realizados.</li>
              <li><strong>Días Abiertos:</strong> Número de días transcurridos desde el último parto.</li>
            </ul>
          </Box>
          
          <Box mb={3}>
            <Typography variant="h6" gutterBottom>Gráficos</Typography>
            <Typography variant="body2" paragraph>
              Los gráficos proporcionan una representación visual de los datos reproductivos:
            </Typography>
            <ul>
              <li><strong>Eventos por Mes:</strong> Muestra la tendencia de eventos a lo largo del tiempo.</li>
              <li><strong>Distribución por Tipo:</strong> Muestra la proporción de cada tipo de evento reproductivo.</li>
              <li><strong>Eventos por Estado:</strong> Muestra la distribución de eventos según su estado (completado, pendiente, cancelado).</li>
            </ul>
          </Box>
          
          <Box>
            <Typography variant="h6" gutterBottom>Filtros</Typography>
            <Typography variant="body2" paragraph>
              Utilice los selectores de fecha para ajustar el período de tiempo que desea analizar. 
              Los gráficos y métricas se actualizarán automáticamente.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAyuda(false)} color="primary">
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EstadisticasReproductivas;
