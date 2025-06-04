import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CircularProgress,
  Grid,
  MenuItem,
  Paper,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import { reproduccionService } from '../../services/reproduccionService';
import { getEventoColor } from './utils/reproduccionUtils';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export const EstadisticasReproduccion: React.FC = () => {
  const theme = useTheme();
  const [loading, setLoading] = useState<boolean>(true);
  const [anio, setAnio] = useState<number>(new Date().getFullYear());
  const [estadisticas, setEstadisticas] = useState<any>(null);

  // Cargar estadísticas
  const cargarEstadisticas = async () => {
    try {
      setLoading(true);
      const data = await reproduccionService.getEstadisticas(anio);
      setEstadisticas(data);
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarEstadisticas();
  }, [anio]);

  const handleAnioChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setAnio(Number(event.target.value));
  };

  // Generar opciones de años (últimos 5 años)
  const anios = Array.from({ length: 5 }, (_, i) => anio - i);

  if (loading && !estadisticas) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" component="h1">
          Estadísticas de Reproducción
        </Typography>
        <TextField
          select
          size="small"
          label="Año"
          value={anio}
          onChange={handleAnioChange}
          sx={{ minWidth: 120 }}
        >
          {anios.map((year) => (
            <MenuItem key={year} value={year}>
              {year}
            </MenuItem>
          ))}
        </TextField>
      </Box>

      {!estadisticas ? (
        <Typography>No hay datos disponibles</Typography>
      ) : (
        <Grid container spacing={3}>
          {/* Resumen */}
          <Grid item xs={12} md={6} lg={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Eventos
                </Typography>
                <Typography variant="h4">
                  {estadisticas.totalEventos || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6} lg={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Tasa de Preñez
                </Typography>
                <Typography variant="h4">
                  {estadisticas.tasaPrenez ? `${estadisticas.tasaPrenez}%` : 'N/A'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6} lg={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Partos Exitosos
                </Typography>
                <Typography variant="h4">
                  {estadisticas.partosExitosos || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6} lg={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Crías Nacidas
                </Typography>
                <Typography variant="h4">
                  {estadisticas.criasNacidas || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Gráfico de eventos por mes */}
          <Grid item xs={12} lg={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Eventos por Mes
                </Typography>
                <Box height={300}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={estadisticas.eventosPorMes || []}
                      margin={{
                        top: 20,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="mes" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="total" name="Total Eventos" fill="#8884d8" />
                      <Bar dataKey="preñadas" name="Preñadas" fill="#82ca9d" />
                      <Bar dataKey="partos" name="Partos" fill="#ffc658" />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Gráfico de distribución por tipo */}
          <Grid item xs={12} lg={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Distribución por Tipo
                </Typography>
                <Box height={300}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={estadisticas.distribucionPorTipo || []}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="cantidad"
                        nameKey="tipo"
                        label={({ name, percent }) =>
                          `${name}: ${(percent * 100).toFixed(0)}%`
                        }
                      >
                        {(estadisticas.distribucionPorTipo || []).map((entry: any, index: number) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Gráfico de tasa de preñez por mes */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Tasa de Preñez por Mes
                </Typography>
                <Box height={300}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={estadisticas.tasaPrenezPorMes || []}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="mes" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip formatter={(value) => [`${value}%`, 'Tasa de Preñez']} />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="tasaPrenez"
                        name="Tasa de Preñez"
                        stroke="#8884d8"
                        activeDot={{ r: 8 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Detalle por tipo de evento */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Eficiencia por Tipo de Monta
                </Typography>
                <Box height={300}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      layout="vertical"
                      data={estadisticas.eficienciaPorTipo || []}
                      margin={{
                        top: 20,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" domain={[0, 100]} />
                      <YAxis dataKey="tipo" type="category" />
                      <Tooltip formatter={(value) => [`${value}%`, 'Tasa de Éxito']} />
                      <Legend />
                      <Bar
                        dataKey="tasaExito"
                        name="Tasa de Éxito"
                        fill="#82ca9d"
                      >
                        {(estadisticas.eficienciaPorTipo || []).map((entry: any, index: number) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={getEventoColor(entry.tipo) as string}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Resumen de resultados */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Resumen de Resultados
                </Typography>
                <Box height={300}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={estadisticas.resumenResultados || []}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="cantidad"
                        nameKey="resultado"
                        label={({ name, percent }) =>
                          `${name}: ${(percent * 100).toFixed(0)}%`
                        }
                      >
                        {(estadisticas.resumenResultados || []).map((entry: any, index: number) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={
                              entry.resultado.toLowerCase().includes('exitoso')
                                ? '#82ca9d'
                                : entry.resultado.toLowerCase().includes('fallido') ||
                                  entry.resultado.toLowerCase().includes('aborto')
                                ? '#ff6b6b'
                                : COLORS[index % COLORS.length]
                            }
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default EstadisticasReproduccion;
