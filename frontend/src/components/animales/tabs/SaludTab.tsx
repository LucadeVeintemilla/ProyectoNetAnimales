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
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, subDays, startOfMonth, endOfMonth, isAfter, isBefore } from 'date-fns';
import { es } from 'date-fns/locale';

interface ControlSalud {
  id: number;
  fecha: string;
  tipo: string;
  descripcion: string;
  diagnostico: string;
  tratamiento: string;
  proximoControl?: string;
  estado: 'completado' | 'pendiente' | 'atrasado';
  medico: string;
  observaciones?: string;
}

interface SaludTabProps {
  animalId: number;
}

const SaludTab: React.FC<SaludTabProps> = ({ animalId }) => {
  // Datos de ejemplo (en una aplicación real, estos vendrían de una API)
  const controlesEjemplo: ControlSalud[] = [
    {
      id: 1,
      fecha: '2023-05-15T10:30:00',
      tipo: 'Vacunación',
      descripcion: 'Vacuna contra la fiebre aftosa',
      diagnostico: 'Prevención',
      tratamiento: 'Vacuna Fiebre Aftosa - 5ml',
      proximoControl: '2023-11-15T10:30:00',
      estado: 'completado',
      medico: 'Dr. Juan Pérez',
    },
    {
      id: 2,
      fecha: '2023-06-01T14:00:00',
      tipo: 'Control General',
      descripcion: 'Revisión de rutina',
      diagnostico: 'Buen estado de salud',
      tratamiento: 'Desparasitación - Ivermectina 3.15% (1ml/50kg)',
      proximoControl: '2023-09-01T14:00:00',
      estado: 'completado',
      medico: 'Dra. Ana Gómez',
    },
    {
      id: 3,
      fecha: '2023-07-10T11:15:00',
      tipo: 'Tratamiento',
      descripcion: 'Infección en pezuña',
      diagnostico: 'Dermatitis interdigital',
      tratamiento: 'Limpieza y aplicación de pomada antibiótica',
      proximoControl: '2023-07-17T11:15:00',
      estado: 'pendiente',
      medico: 'Dr. Carlos Ruiz',
      observaciones: 'Mantener limpia y seca la zona afectada',
    },
  ];

  const [controles, setControles] = useState<ControlSalud[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [fechaInicio, setFechaInicio] = useState<Date>(startOfMonth(new Date()));
  const [fechaFin, setFechaFin] = useState<Date>(new Date());
  const [filtroTipo, setFiltroTipo] = useState<string>('todos');
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');
  
  // Cargar controles de salud del animal
  const fetchControles = async () => {
    try {
      setLoading(true);
      // Simular carga de datos
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Filtrar controles por fechas (en una app real, esto se haría en el backend)
      const controlesFiltrados = controlesEjemplo.filter(control => {
        const fechaControl = new Date(control.fecha);
        return (
          (fechaInicio ? isAfter(fechaControl, subDays(fechaInicio, 1)) : true) &&
          (fechaFin ? isBefore(fechaControl, new Date(fechaFin.getTime() + 24 * 60 * 60 * 1000)) : true) &&
          (filtroTipo !== 'todos' ? control.tipo === filtroTipo : true) &&
          (filtroEstado !== 'todos' ? control.estado === filtroEstado : true)
        );
      });
      
      setControles(controlesFiltrados);
    } catch (error) {
      console.error('Error al cargar los controles de salud:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchControles();
  }, [fechaInicio, fechaFin, filtroTipo, filtroEstado]);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
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

  const getTipoIcon = (tipo: string) => {
    switch (tipo.toLowerCase()) {
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
    total: controlesEjemplo.length,
    completados: controlesEjemplo.filter(c => c.estado === 'completado').length,
    pendientes: controlesEjemplo.filter(c => c.estado === 'pendiente').length,
    atrasados: controlesEjemplo.filter(c => c.estado === 'atrasado').length,
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
          {controlesEjemplo
            .filter(c => c.estado === 'pendiente' || c.estado === 'atrasado')
            .sort((a, b) => new Date(a.proximoControl || '').getTime() - new Date(b.proximoControl || '').getTime())
            .slice(0, 3)
            .map((control) => (
              <Grid item xs={12} md={4} key={`proximo-${control.id}`}>
                <Card 
                  variant="outlined"
                  sx={{
                    borderLeft: `4px solid ${control.estado === 'atrasado' ? 'error.main' : 'warning.main'}`,
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
                          {format(new Date(control.proximoControl || ''), 'PPPp', { locale: es })}
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
          {controlesEjemplo.filter(c => c.estado === 'pendiente' || c.estado === 'atrasado').length === 0 && (
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
                        {format(new Date(control.fecha), 'dd/MM/yyyy HH:mm', { locale: es })}
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          {getTipoIcon(control.tipo)}
                          <Box ml={1}>{control.tipo}</Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Tooltip title={control.descripcion}>
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
