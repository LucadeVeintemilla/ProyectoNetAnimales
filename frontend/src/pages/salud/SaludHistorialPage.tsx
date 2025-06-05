import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  Button,
  Chip,
  IconButton,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  AccessTime as ClockIcon,
  Warning as WarningIcon,
  CalendarToday as CalendarIcon,
  EventNote as EventNoteIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { es } from 'date-fns/locale';
import { format } from 'date-fns';

import { saludService, ControlSalud, ResumenSalud } from '../../services/saludService';
import ConfirmDialog from '../../components/common/ConfirmDialog';

const SaludHistorialPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(false);
  const [controlesSalud, setControlesSalud] = useState<ControlSalud[]>([]);
  const [resumen, setResumen] = useState<ResumenSalud>({
    totalControles: 0,
    completados: 0,
    pendientes: 0,
    atrasados: 0,
    proximosControles: []
  });
  const [filtros, setFiltros] = useState({
    fechaInicio: format(new Date(new Date().setDate(new Date().getDate() - 30)), 'yyyy-MM-dd'),
    fechaFin: format(new Date(), 'yyyy-MM-dd'),
    tipo: '',
    estado: '',
    busqueda: '',
  });
  
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState<boolean>(false);
  const [controlToDelete, setControlToDelete] = useState<number | null>(null);

  // Cargar datos del historial de salud
  const loadControlesSalud = async () => {
    try {
      setLoading(true);
      const response = await saludService.getPaginated(
        page + 1,
        rowsPerPage,
        {
          fechaInicio: filtros.fechaInicio,
          fechaFin: filtros.fechaFin,
          tipo: filtros.tipo || undefined,
          estado: filtros.estado || undefined,
          busqueda: filtros.busqueda || undefined,
        }
      );
      
      setControlesSalud(response.items || []);
      setTotalItems(response.totalItems || 0);
      
      // Cargar resumen
      const resumenData = await saludService.getResumenSalud();
      setResumen(resumenData);
    } catch (error) {
      console.error('Error al cargar los controles de salud:', error);
      setError('Error al cargar los controles de salud. Por favor, intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  // Cargar datos iniciales
  useEffect(() => {
    loadControlesSalud();
  }, [page, rowsPerPage]);

  // Manejar cambios en los filtros
  const handleFilterChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFiltros((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleDateChange = (name: string) => (date: Date | null) => {
    if (date) {
      setFiltros((prev) => ({
        ...prev,
        [name]: format(date, 'yyyy-MM-dd'),
      }));
    }
  };

  // Aplicar filtros
  const handleApplyFilters = () => {
    setPage(0); // Reset a la primera página
    loadControlesSalud();
  };

  // Manejar paginación
  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Acciones para controles de salud
  const handleEdit = (id: number) => {
    navigate(`/salud/${id}/editar`);
  };

  const handleView = (id: number) => {
    navigate(`/salud/${id}`);
  };

  const handleDelete = (id: number) => {
    setControlToDelete(id);
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (controlToDelete) {
      try {
        await saludService.delete(controlToDelete);
        loadControlesSalud(); // Recargar datos
        setConfirmOpen(false);
        setControlToDelete(null);
      } catch (error) {
        console.error('Error al eliminar el control de salud:', error);
        setError('Error al eliminar el control de salud.');
      }
    }
  };

  // Obtener chip según el estado del control
  const getEstadoChip = (estado?: string) => {
    // Manejar caso de estado indefinido o nulo
    if (!estado) {
      return <Chip icon={<ClockIcon />} label="Pendiente" color="primary" size="small" />;
    }
    
    switch (estado.toLowerCase()) {
      case 'completado':
        return <Chip icon={<CheckCircleIcon />} label="Completado" color="success" size="small" />;
      case 'pendiente':
        return <Chip icon={<ClockIcon />} label="Pendiente" color="primary" size="small" />;
      case 'atrasado':
        return <Chip icon={<WarningIcon />} label="Atrasado" color="error" size="small" />;
      case 'cancelado':
        return <Chip label="Cancelado" color="default" size="small" />;
      default:
        return <Chip label={estado} size="small" />;
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h5" gutterBottom>
        Historial de Salud
      </Typography>
      
      {/* Filtros */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
              <DatePicker
                label="Fecha Inicio"
                value={filtros.fechaInicio ? new Date(filtros.fechaInicio) : null}
                onChange={handleDateChange('fechaInicio')}
                format="dd/MM/yyyy"
                slotProps={{
                  textField: {
                    fullWidth: true,
                    variant: 'outlined',
                    InputProps: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <CalendarIcon />
                        </InputAdornment>
                      ),
                    },
                  },
                }}
              />
            </LocalizationProvider>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
              <DatePicker
                label="Fecha Fin"
                value={filtros.fechaFin ? new Date(filtros.fechaFin) : null}
                onChange={handleDateChange('fechaFin')}
                format="dd/MM/yyyy"
                slotProps={{
                  textField: {
                    fullWidth: true,
                    variant: 'outlined',
                    InputProps: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <CalendarIcon />
                        </InputAdornment>
                      ),
                    },
                  },
                }}
              />
            </LocalizationProvider>
          </Grid>
          
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth variant="outlined">
              <InputLabel id="tipo-label">Tipo</InputLabel>
              <Select
                labelId="tipo-label"
                id="tipo"
                name="tipo"
                value={filtros.tipo}
                onChange={handleFilterChange as any}
                label="Tipo"
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="vacuna">Vacuna</MenuItem>
                <MenuItem value="tratamiento">Tratamiento</MenuItem>
                <MenuItem value="revision">Revisión</MenuItem>
                <MenuItem value="cirugia">Cirugía</MenuItem>
                <MenuItem value="otro">Otro</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth variant="outlined">
              <InputLabel id="estado-label">Estado</InputLabel>
              <Select
                labelId="estado-label"
                id="estado"
                name="estado"
                value={filtros.estado}
                onChange={handleFilterChange as any}
                label="Estado"
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="completado">Completado</MenuItem>
                <MenuItem value="pendiente">Pendiente</MenuItem>
                <MenuItem value="atrasado">Atrasado</MenuItem>
                <MenuItem value="cancelado">Cancelado</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={12} md={2}>
            <Button 
              fullWidth 
              variant="contained" 
              color="primary" 
              onClick={handleApplyFilters}
              sx={{ height: '56px' }}
            >
              Filtrar
            </Button>
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              variant="outlined"
              id="busqueda"
              name="busqueda"
              label="Buscar por descripción..."
              value={filtros.busqueda}
              onChange={handleFilterChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleApplyFilters();
                }
              }}
            />
          </Grid>
        </Grid>
      </Paper>
      
      {/* Resumen */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="textSecondary">
                Controles Totales
              </Typography>
              <Typography variant="h4" sx={{ mt: 1 }}>
                {resumen.totalControles}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="textSecondary">
                Completados
              </Typography>
              <Typography variant="h4" color="success.main" sx={{ mt: 1 }}>
                {resumen.completados}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="textSecondary">
                Pendientes
              </Typography>
              <Typography variant="h4" color="primary.main" sx={{ mt: 1 }}>
                {resumen.pendientes}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="textSecondary">
                Atrasados
              </Typography>
              <Typography variant="h4" color="error.main" sx={{ mt: 1 }}>
                {resumen.atrasados}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Próximos Controles */}
      {resumen.proximosControles && resumen.proximosControles.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Próximos Controles
          </Typography>
          <Paper>
            {resumen.proximosControles.map((control, index) => (
              <Box 
                key={control.id}
                sx={{ 
                  p: 2, 
                  display: 'flex', 
                  alignItems: 'center',
                  borderBottom: index < resumen.proximosControles.length - 1 ? '1px solid #eee' : 'none'
                }}
              >
                <EventNoteIcon sx={{ mr: 2, color: 'primary.main' }} />
                <Box>
                  <Typography variant="body1">
                    {format(new Date(control.fecha), "dd 'de' MMMM 'de' yyyy", { locale: es })} a las {format(new Date(control.fecha), "HH:mm")}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    {control.tipo}: {control.descripcion}
                  </Typography>
                </Box>
                <Chip 
                  label={`En ${control.diasRestantes} días`}
                  color="primary"
                  size="small"
                  sx={{ ml: 'auto' }}
                />
              </Box>
            ))}
          </Paper>
        </Box>
      )}
      
      {/* Tabla de Historial */}
      <Typography variant="h6" gutterBottom>
        Historial de Controles
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
      )}
      
      <Paper>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Fecha</TableCell>
                    <TableCell>Tipo</TableCell>
                    <TableCell>Descripción</TableCell>
                    <TableCell>Diagnóstico</TableCell>
                    <TableCell>Estado</TableCell>
                    <TableCell>Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {controlesSalud.length > 0 ? (
                    controlesSalud.map((control) => (
                      <TableRow key={control.id} hover>
                        <TableCell>
                          {format(new Date(control.fecha), 'dd/MM/yyyy HH:mm')}
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={control.tipo}
                            color={
                              control.tipo === 'vacuna' ? 'success' :
                              control.tipo === 'tratamiento' ? 'primary' :
                              control.tipo === 'cirugia' ? 'error' : 'default'
                            }
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{control.descripcion}</TableCell>
                        <TableCell>{control.diagnostico || '-'}</TableCell>
                        <TableCell>{getEstadoChip(control.estado)}</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex' }}>
                            <Tooltip title="Ver detalle">
                              <IconButton size="small" onClick={() => handleView(control.id!)}>
                                <SearchIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Editar">
                              <IconButton size="small" onClick={() => handleEdit(control.id!)}>
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Eliminar">
                              <IconButton size="small" onClick={() => handleDelete(control.id!)}>
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        No se encontraron registros de salud
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              component="div"
              count={totalItems}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              labelRowsPerPage="Filas por página:"
              labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
              rowsPerPageOptions={[5, 10, 25]}
            />
          </>
        )}
      </Paper>
      
      {/* Diálogo de confirmación para eliminar */}
      <ConfirmDialog
        open={confirmOpen}
        title="Confirmar eliminación"
        message="¿Está seguro de que desea eliminar este registro de salud? Esta acción no se puede deshacer."
        onConfirm={confirmDelete}
        onCancel={() => setConfirmOpen(false)}
        severity="error"
      />
    </Box>
  );
};

export default SaludHistorialPage;
