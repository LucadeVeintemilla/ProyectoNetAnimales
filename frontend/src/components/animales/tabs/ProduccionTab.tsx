import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Button,
  TextField,
  InputAdornment,
  IconButton,
  Tooltip,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  DateRange as DateRangeIcon,
  BarChart as BarChartIcon,
  Timeline as TimelineIcon,
  FileDownload as ExportIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import produccionService, { ProduccionLeche } from '../../../services/produccionService';

interface ProduccionTabProps {
  animalId: number;
}

const ProduccionTab: React.FC<ProduccionTabProps> = ({ animalId }) => {
  const navigate = useNavigate();
  const [producciones, setProducciones] = useState<ProduccionLeche[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [fechaInicio, setFechaInicio] = useState<Date>(startOfMonth(new Date()));
  const [fechaFin, setFechaFin] = useState<Date>(new Date());
  
  // Cargar producciones del animal
  const fetchProducciones = async () => {
    try {
      setLoading(true);
      const data = await produccionService.getProducciones(
        page + 1,
        rowsPerPage,
        format(fechaInicio, 'yyyy-MM-dd'),
        format(fechaFin, 'yyyy-MM-dd'),
        animalId
      );
      
      setProducciones(data.items || []);
      setTotalCount(data.totalCount || 0);
    } catch (error) {
      console.error('Error al cargar las producciones:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducciones();
  }, [page, rowsPerPage, fechaInicio, fechaFin, animalId]);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleExportar = () => {
    // Implementar lógica de exportación
    console.log('Exportar datos de producción');
  };

  // Manejar la edición de un registro de producción
  const handleEditar = (produccionId: number | undefined) => {
    if (produccionId) {
      navigate(`/produccion/${produccionId}/editar`);
    }
  };

  // Manejar la eliminación de un registro de producción
  const handleEliminar = async (produccionId: number | undefined) => {
    if (!produccionId) return;
    
    if (window.confirm('¿Está seguro de que desea eliminar este registro de producción?')) {
      try {
        setLoading(true);
        await produccionService.deleteProduccion(produccionId);
        // Recargar los datos después de eliminar
        fetchProducciones();
      } catch (error) {
        console.error('Error al eliminar el registro:', error);
        alert('No se pudo eliminar el registro. Por favor, intente nuevamente.');
      } finally {
        setLoading(false);
      }
    }
  };

  const getTurnoTexto = (turno: string) => {
    switch (turno) {
      case 'mañana':
        return 'Mañana';
      case 'tarde':
        return 'Tarde';
      case 'noche':
        return 'Noche';
      default:
        return turno;
    }
  };

  // Calcular totales
  const totalLitros = producciones.reduce((sum, prod) => sum + prod.cantidadLitros, 0);
  const promedioDiario = producciones.length > 0 
    ? totalLitros / producciones.length 
    : 0;

  return (
    <Box>
      <Box mb={3} display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="h6" component="h2">
          Registros de Producción de Leche
        </Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<ExportIcon />}
            onClick={handleExportar}
            sx={{ mr: 1 }}
          >
            Exportar
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => console.log('Nuevo registro')}
          >
            Nuevo Registro
          </Button>
        </Box>
      </Box>

      {/* Filtros */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
              <DatePicker
                label="Fecha Inicio"
                value={fechaInicio}
                onChange={(date) => setFechaInicio(date || new Date())}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    size: "small",
                    InputProps: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <DateRangeIcon color="action" />
                        </InputAdornment>
                      ),
                    }
                  }
                }}
              />
            </LocalizationProvider>
          </Grid>
          <Grid item xs={12} md={3}>
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
              <DatePicker
                label="Fecha Fin"
                value={fechaFin}
                onChange={(date) => setFechaFin(date || new Date())}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    size: "small",
                    InputProps: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <DateRangeIcon color="action" />
                        </InputAdornment>
                      ),
                    }
                  }
                }}
              />
            </LocalizationProvider>
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              placeholder="Buscar por observaciones..."
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={2} textAlign="right">
            <Button
              variant="outlined"
              startIcon={<FilterListIcon />}
              onClick={() => console.log('Aplicar filtros')}
            >
              Filtrar
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Resumen */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total de Litros
                  </Typography>
                  <Typography variant="h4">{totalLitros.toFixed(2)} L</Typography>
                </Box>
                <Box
                  sx={{
                    backgroundColor: 'primary.light',
                    color: 'primary.contrastText',
                    p: 2,
                    borderRadius: '50%',
                  }}
                >
                  <BarChartIcon />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Promedio Diario
                  </Typography>
                  <Typography variant="h4">{promedioDiario.toFixed(2)} L</Typography>
                </Box>
                <Box
                  sx={{
                    backgroundColor: 'secondary.light',
                    color: 'secondary.contrastText',
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
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total de Registros
                  </Typography>
                  <Typography variant="h4">{totalCount}</Typography>
                </Box>
                <Box
                  sx={{
                    backgroundColor: 'success.light',
                    color: 'success.contrastText',
                    p: 2,
                    borderRadius: '50%',
                  }}
                >
                  <BarChartIcon />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabla de registros */}
      <Paper sx={{ width: '100%', overflow: 'hidden', mb: 2 }}>
        <TableContainer sx={{ maxHeight: 440 }}>
          <Table stickyHeader aria-label="tabla de producción">
            <TableHead>
              <TableRow>
                <TableCell>Fecha</TableCell>
                <TableCell>Turno</TableCell>
                <TableCell align="right">Cantidad (L)</TableCell>
                <TableCell>Observaciones</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                    <CircularProgress />
                    <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                      Cargando registros...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : producciones.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                    <Typography variant="body1" color="textSecondary">
                      No se encontraron registros de producción
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                producciones.map((produccion) => (
                  <TableRow key={produccion.id} hover>
                    <TableCell>
                      {format(new Date(produccion.fecha), 'dd/MM/yyyy')}
                    </TableCell>
                    <TableCell>{getTurnoTexto(produccion.turno)}</TableCell>
                    <TableCell align="right">{produccion.cantidadLitros.toFixed(2)} L</TableCell>
                    <TableCell>
                      <Tooltip title={produccion.observaciones || 'Sin observaciones'}>
                        <Typography noWrap sx={{ maxWidth: 300 }}>
                          {produccion.observaciones || '-'}
                        </Typography>
                      </Tooltip>
                    </TableCell>
                    <TableCell align="right">
                      <IconButton size="small" onClick={() => handleEditar(produccion.id)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleEliminar(produccion.id)}>
                        <DeleteIcon fontSize="small" color="error" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={totalCount}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Registros por página:"
          labelDisplayedRows={({ from, to, count }) =>
            `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`
          }
        />
      </Paper>
    </Box>
  );
};

export default ProduccionTab;
