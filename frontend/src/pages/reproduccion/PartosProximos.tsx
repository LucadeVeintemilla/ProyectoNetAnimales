import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
  Tooltip,
  IconButton,
  useTheme,
} from '@mui/material';
import {
  Event as EventIcon,
  EventAvailable as EventAvailableIcon,
  EventBusy as EventBusyIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { format, differenceInDays, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { reproduccionService } from '../../services/reproduccionService';
import { getEventoColor } from './utils/reproduccionUtils';

interface PartoProximo {
  id: number;
  hembraId: number;
  hembraNombre: string;
  hembraIdentificacion: string;
  fechaMonta: string;
  fechaProbableParto: string;
  diasRestantes: number;
  tipoMonta: string;
}

export const PartosProximos: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [partosProximos, setPartosProximos] = useState<PartoProximo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [diasAnticipacion, setDiasAnticipacion] = useState<number>(30);
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);

  // Cargar partos próximos
  const cargarPartosProximos = async () => {
    try {
      setLoading(true);
      const data = await reproduccionService.getProximosPartos(diasAnticipacion);
      
      // Procesar datos para incluir días restantes
      const partosConDias = data.map((parto: any) => ({
        ...parto,
        diasRestantes: differenceInDays(
          new Date(parto.fechaProbableParto),
          new Date()
        ),
      }));
      
      // Ordenar por fecha de parto más cercana
      partosConDias.sort((a: any, b: any) => a.diasRestantes - b.diasRestantes);
      
      setPartosProximos(partosConDias);
    } catch (error) {
      console.error('Error al cargar partos próximos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarPartosProximos();
  }, [diasAnticipacion]);

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleVerDetalle = (id: number) => {
    navigate(`/reproduccion/detalle/${id}`);
  };

  const handleEditar = (id: number) => {
    navigate(`/reproduccion/editar/${id}`);
  };

  const getEstadoColor = (dias: number) => {
    if (dias < 0) return 'error';
    if (dias <= 7) return 'warning';
    return 'success';
  };

  const getEstadoTexto = (dias: number) => {
    if (dias < 0) return 'Atrasado';
    if (dias === 0) return 'Hoy';
    if (dias === 1) return 'Mañana';
    return `En ${dias} días`;
  };

  const formatearFecha = (fecha: string) => {
    try {
      return format(parseISO(fecha), 'PPP', { locale: es });
    } catch (error) {
      return 'Fecha inválida';
    }
  };

  if (loading && partosProximos.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" component="h1">
          Próximos Partos
        </Typography>
        <Box display="flex" alignItems="center" gap={2}>
          <TextField
            id="dias-anticipacion-select"
            select
            size="small"
            label="Mostrar partos en los próximos"
            value={diasAnticipacion}
            onChange={(e) => setDiasAnticipacion(Number(e.target.value))}
            sx={{ minWidth: 200 }}
            SelectProps={{
              native: true,
            }}
            inputProps={{
              'aria-label': 'Mostrar partos en los próximos días',
              name: 'dias-anticipacion',
            }}
          >
            <option value={7}>7 días</option>
            <option value={15}>15 días</option>
            <option value={30}>30 días</option>
            <option value={60}>60 días</option>
            <option value={90}>90 días</option>
          </TextField>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={cargarPartosProximos}
          >
            Actualizar
          </Button>
        </Box>
      </Box>

      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 'calc(100vh - 300px)' }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Estado</TableCell>
                <TableCell>Hembra</TableCell>
                <TableCell>Identificación</TableCell>
                <TableCell>Fecha Monta</TableCell>
                <TableCell>Fecha Probable Parto</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {partosProximos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <Box display="flex" flexDirection="column" alignItems="center">
                      <EventIcon color="action" sx={{ fontSize: 48, mb: 2 }} />
                      <Typography variant="subtitle1" color="textSecondary">
                        No hay partos programados para los próximos {diasAnticipacion} días
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                partosProximos
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((parto) => (
                    <TableRow hover key={parto.id}>
                      <TableCell>
                        <Chip
                          label={getEstadoTexto(parto.diasRestantes)}
                          color={getEstadoColor(parto.diasRestantes) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{parto.hembraNombre}</Typography>
                        <Typography variant="caption" color="textSecondary">
                          {parto.hembraIdentificacion}
                        </Typography>
                      </TableCell>
                      <TableCell>{parto.hembraIdentificacion}</TableCell>
                      <TableCell>{formatearFecha(parto.fechaMonta)}</TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          {parto.diasRestantes <= 0 ? (
                            <EventBusyIcon color="error" fontSize="small" />
                          ) : (
                            <EventAvailableIcon color="primary" fontSize="small" />
                          )}
                          {formatearFecha(parto.fechaProbableParto)}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={parto.tipoMonta}
                          color={getEventoColor(parto.tipoMonta) as any}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Box display="flex" gap={1}>
                          <Tooltip title="Ver detalles">
                            <IconButton
                              size="small"
                              onClick={() => handleVerDetalle(parto.id)}
                              color="primary"
                            >
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Editar">
                            <IconButton
                              size="small"
                              onClick={() => handleEditar(parto.id)}
                              color="secondary"
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={partosProximos.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Filas por página:"
          labelDisplayedRows={({ from, to, count }) =>
            `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`
          }
        />
      </Paper>

      <Box mt={3}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Resumen de Partos Próximos
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Box display="flex" alignItems="center" gap={1}>
                  <EventBusyIcon color="error" />
                  <Typography>
                    <strong>{partosProximos.filter(p => p.diasRestantes < 0).length}</strong> partos atrasados
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={4}>
                <Box display="flex" alignItems="center" gap={1}>
                  <EventAvailableIcon color="warning" />
                  <Typography>
                    <strong>{partosProximos.filter(p => p.diasRestantes >= 0 && p.diasRestantes <= 7).length}</strong> partos esta semana
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={4}>
                <Box display="flex" alignItems="center" gap={1}>
                  <EventAvailableIcon color="success" />
                  <Typography>
                    <strong>{partosProximos.filter(p => p.diasRestantes > 7).length}</strong> partos programados
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default PartosProximos;
