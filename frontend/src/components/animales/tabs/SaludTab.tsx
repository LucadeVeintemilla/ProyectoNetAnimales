import React, { useState, useEffect } from 'react';
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
  Chip,
  Badge,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  DateRange as DateRangeIcon,
  LocalHospital as HealthIcon,
  LocalPharmacy as MedicineIcon,
  Vaccines as VaccineIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon,
  Refresh as RefreshIcon,
  MedicalServices,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, subDays, startOfMonth, endOfMonth, isAfter, isBefore, parseISO, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import saludService, { ControlSalud } from '../../../services/saludService';

// Usamos la interfaz ControlSalud importada desde saludService

interface SaludTabProps {
  animalId: number;
}

const SaludTab: React.FC<SaludTabProps> = ({ animalId }) => {
  // Estados para manejar los datos y filtros
  const [controles, setControles] = useState<ControlSalud[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [fechaInicio, setFechaInicio] = useState<Date | null>(startOfMonth(new Date()));
  const [fechaFin, setFechaFin] = useState<Date | null>(new Date());
  const [filtroTipo, setFiltroTipo] = useState<string>('todos');
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  // Cargar controles de salud del animal desde la API
  const fetchControles = async () => {
    try {
      setLoading(true);
      setError(null);

      // Usar el servicio en lugar de axios directo
      let controlesData = await saludService.getByAnimalId(animalId);
      
      // Aplicar filtros adicionales en el cliente si es necesario
      if (filtroTipo !== 'todos') {
        controlesData = controlesData.filter((control: ControlSalud) => 
          control.tipo === filtroTipo
        );
      }
      
      if (filtroEstado !== 'todos') {
        controlesData = controlesData.filter((control: ControlSalud) => 
          control.estado.toLowerCase() === filtroEstado
        );
      }
      
      if (searchTerm) {
        controlesData = controlesData.filter((control: ControlSalud) => 
          control.descripcion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          control.diagnostico?.toLowerCase().includes(searchTerm.toLowerCase()) || false
        );
      }
      
      setControles(controlesData);
    } catch (error) {
      console.error('Error al cargar los controles de salud:', error);
      setError('Error al cargar los controles de salud. Por favor, intente de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  // Cargar datos cuando cambien los filtros
  useEffect(() => {
    fetchControles();
  }, [animalId, fechaInicio, fechaFin]);
  
  // Aplicar filtros cliente cuando cambian
  useEffect(() => {
    // Solo aplicar filtros adicionales sin llamar a la API
    if (!loading && controles.length > 0) {
      fetchControles();
    }
  }, [filtroTipo, filtroEstado, searchTerm]);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getEstadoColor = (estado: string | undefined) => {
    if (!estado) return 'default';
    switch (estado.toLowerCase()) {
      case 'completado':
        return 'success';
      case 'pendiente':
        return 'warning';
      case 'atrasado':
        return 'error';
      default:
        return 'default';
    }
  };

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'completado':
        return <CheckCircleIcon fontSize="small" />;
      case 'pendiente':
        return <PendingIcon fontSize="small" />;
      case 'atrasado':
        return <WarningIcon fontSize="small" />;
      default:
        return <CheckCircleIcon fontSize="small" />;
    }
  };

  const getTipoIcon = (tipo: string | undefined) => {
    if (!tipo) return <MedicalServices color="action" />; // Valor por defecto si tipo es undefined
    const tipoLower = tipo.toLowerCase();
    switch (tipoLower) {
      case 'vacunación':
        return <VaccineIcon color="primary" />;
      case 'tratamiento':
        return <MedicineIcon color="secondary" />;
      default:
        return <HealthIcon color="action" />;
    }
  };

  // Contar controles por estado para el resumen
  const resumenControles = {
    total: controles.length,
    completados: controles.filter((c: ControlSalud) => c.estado.toLowerCase() === 'completado').length,
    pendientes: controles.filter((c: ControlSalud) => c.estado.toLowerCase() === 'pendiente').length,
    atrasados: controles.filter((c: ControlSalud) => c.estado.toLowerCase() === 'atrasado').length,
  };

  return (
    <Box>
      <Box mb={3} display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="h6" component="h2">
          Historial de Salud
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => console.log('Nuevo control de salud')}
        >
          Nuevo Control
        </Button>
      </Box>

      {/* Filtros */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={2}>
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
          <Grid item xs={12} md={2}>
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
          <Grid item xs={12} md={2}>
            <TextField
              select
              fullWidth
              size="small"
              label="Tipo"
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
              SelectProps={{ native: true }}
            >
              <option value="todos">Todos los tipos</option>
              <option value="Vacunación">Vacunación</option>
              <option value="Control General">Control General</option>
              <option value="Tratamiento">Tratamiento</option>
              <option value="Emergencia">Emergencia</option>
            </TextField>
          </Grid>
          <Grid item xs={12} md={2}>
            <TextField
              select
              fullWidth
              size="small"
              label="Estado"
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              SelectProps={{ native: true }}
            >
              <option value="todos">Todos los estados</option>
              <option value="completado">Completado</option>
              <option value="pendiente">Pendiente</option>
              <option value="atrasado">Atrasado</option>
            </TextField>
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              size="small"
              placeholder="Buscar por descripción..."
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={1} textAlign="right">
            <Tooltip title="Restablecer filtros">
              <IconButton
                onClick={() => {
                  setFechaInicio(startOfMonth(new Date()));
                  setFechaFin(new Date());
                  setFiltroTipo('todos');
                  setFiltroEstado('todos');
                }}
              >
                <FilterListIcon />
              </IconButton>
            </Tooltip>
          </Grid>
        </Grid>
      </Paper>

      {/* Resumen */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Controles Totales
                  </Typography>
                  <Typography variant="h4">{resumenControles.total}</Typography>
                </Box>
                <Box
                  sx={{
                    backgroundColor: 'primary.light',
                    color: 'primary.contrastText',
                    p: 2,
                    borderRadius: '50%',
                  }}
                >
                  <HealthIcon />
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
                    Completados
                  </Typography>
                  <Typography variant="h4" color="success.main">
                    {resumenControles.completados}
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
                  <CheckCircleIcon />
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
                    Pendientes
                  </Typography>
                  <Typography variant="h4" color="warning.main">
                    {resumenControles.pendientes}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    backgroundColor: 'warning.light',
                    color: 'warning.contrastText',
                    p: 2,
                    borderRadius: '50%',
                  }}
                >
                  <PendingIcon />
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
                    Atrasados
                  </Typography>
                  <Typography variant="h4" color="error.main">
                    {resumenControles.atrasados}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    backgroundColor: 'error.light',
                    color: 'error.contrastText',
                    p: 2,
                    borderRadius: '50%',
                  }}
                >
                  <WarningIcon />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Próximos controles */}
      <Box mb={3}>
        <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
          <PendingIcon color="warning" sx={{ mr: 1 }} />
          Próximos Controles
        </Typography>
        <Grid container spacing={2}>
          {controles
            .filter((c: ControlSalud) => c.estado.toLowerCase() === 'pendiente' || c.estado.toLowerCase() === 'atrasado')
            .sort((a: ControlSalud, b: ControlSalud) => {
              // Si ambas fechas existen, comparamos normalmente
              if (a.fechaProximoControl && b.fechaProximoControl) {
                return new Date(a.fechaProximoControl).getTime() - new Date(b.fechaProximoControl).getTime();
              }
              // Si sólo a tiene fecha, debe ir primero (ordenar en orden ascendente)
              if (a.fechaProximoControl) return -1;
              // Si sólo b tiene fecha, debe ir primero
              if (b.fechaProximoControl) return 1;
              // Si ninguno tiene fecha, mantener el orden original
              return 0;
            })
            .slice(0, 3)
            .map((control: ControlSalud) => (
              <Grid item xs={12} md={4} key={`proximo-${control.id}`}>
                <Card 
                  variant="outlined"
                  sx={{
                    borderLeft: `4px solid ${control.estado.toLowerCase() === 'atrasado' ? 'error.main' : 'warning.main'}`,
                    height: '100%',
                  }}
                >
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                      <Box>
                        <Typography variant="subtitle1" gutterBottom>
                          {control.tipo}
                        </Typography>
                        <Typography variant="body2" color="textSecondary" gutterBottom>
                          {control.fechaProximoControl && control.fechaProximoControl !== '' ? 
                            format(new Date(control.fechaProximoControl), 'PPP', { locale: es }) : 
                            'No programado'}
                        </Typography>
                        <Chip
                          size="small"
                          icon={getEstadoIcon(control.estado)}
                          label={control.estado.charAt(0).toUpperCase() + control.estado.slice(1)}
                          color={getEstadoColor(control.estado)}
                          sx={{ mt: 1 }}
                        />
                      </Box>
                      <Box>
                        {getTipoIcon(control.tipo)}
                      </Box>
                    </Box>
                    <Typography variant="body2" sx={{ mt: 1 }} noWrap>
                      {control.descripcion}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          {controles.filter((c: ControlSalud) => c.estado.toLowerCase() === 'pendiente' || c.estado.toLowerCase() === 'atrasado').length === 0 && (
            <Grid item xs={12}>
              <Paper sx={{ p: 3, textAlign: 'center' }}>
                <Typography color="textSecondary">
                  No hay controles pendientes o atrasados
                </Typography>
              </Paper>
            </Grid>
          )}
        </Grid>
      </Box>

      {/* Historial de controles */}
      <Box>
        <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
          <HealthIcon color="primary" sx={{ mr: 1 }} />
          Historial de Controles
        </Typography>
        
        <Paper sx={{ width: '100%', overflow: 'hidden', mb: 2 }}>
          <TableContainer sx={{ maxHeight: 440 }}>
            <Table stickyHeader aria-label="historial de controles de salud">
              <TableHead>
                <TableRow>
                  <TableCell>Fecha</TableCell>
                  <TableCell>Tipo</TableCell>
                  <TableCell>Descripción</TableCell>
                  <TableCell>Diagnóstico</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell align="right">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                      <CircularProgress />
                      <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                        Cargando controles de salud...
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : controles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                      <Typography variant="body1" color="textSecondary">
                        No se encontraron registros de salud
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  controles.map((control) => (
                    <TableRow key={control.id} hover>
                      <TableCell>
                        {control.fecha ? format(new Date(control.fecha), 'dd/MM/yyyy HH:mm', { locale: es }) : 'Sin fecha'}
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          {getTipoIcon(control.tipo)}
                          <Box ml={1}>{control.tipo}</Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Tooltip title={control.diagnostico}>
                          <Typography noWrap sx={{ maxWidth: 200 }}>
                            {control.descripcion}
                          </Typography>
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        <Tooltip title={control.diagnostico}>
                          <Typography noWrap sx={{ maxWidth: 200 }}>
                            {control.diagnostico}
                          </Typography>
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          icon={getEstadoIcon(control.estado)}
                          label={control.estado.charAt(0).toUpperCase() + control.estado.slice(1)}
                          color={getEstadoColor(control.estado)}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Ver detalles">
                          <IconButton size="small" onClick={() => console.log('Ver control', control.id)}>
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Editar">
                          <IconButton size="small" onClick={() => console.log('Editar control', control.id)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
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
            count={controles.length}
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
    </Box>
  );
};

export default SaludTab;
