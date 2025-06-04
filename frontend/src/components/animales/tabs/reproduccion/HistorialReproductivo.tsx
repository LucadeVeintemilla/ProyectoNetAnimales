import React, { useState } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  InputAdornment,
  IconButton,
  Tooltip,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Paper,
  Grid,
  CircularProgress,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterListIcon,
  DateRange as DateRangeIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { EventoReproductivo, TipoEventoReproductivo } from '../ReproduccionTab';

interface HistorialReproductivoProps {
  eventos: EventoReproductivo[];
  loading: boolean;
  onRefresh: () => void;
}

const HistorialReproductivo: React.FC<HistorialReproductivoProps> = ({ 
  eventos, 
  loading, 
  onRefresh 
}) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [fechaInicio, setFechaInicio] = useState<Date | null>(subDays(new Date(), 90));
  const [fechaFin, setFechaFin] = useState<Date | null>(new Date());
  const [filtroTipo, setFiltroTipo] = useState<string>('todos');
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');
  const [busqueda, setBusqueda] = useState('');

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getTipoEvento = (tipo: TipoEventoReproductivo) => {
    switch (tipo) {
      case 'celo':
        return 'Celo';
      case 'servicio':
        return 'Servicio/Monta';
      case 'diagnostico_preniez':
        return 'Diagnóstico de Preñez';
      case 'parto':
        return 'Parto';
      case 'aborto':
        return 'Aborto';
      default:
        return 'Otro';
    }
  };

  const getTipoColor = (tipo: TipoEventoReproductivo) => {
    switch (tipo) {
      case 'celo':
        return 'info';
      case 'servicio':
        return 'primary';
      case 'diagnostico_preniez':
        return 'secondary';
      case 'parto':
        return 'success';
      case 'aborto':
        return 'error';
      default:
        return 'default';
    }
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'completado':
        return 'success';
      case 'pendiente':
        return 'warning';
      case 'cancelado':
        return 'error';
      default:
        return 'default';
    }
  };

  // Filtrar eventos
  const eventosFiltrados = eventos.filter((evento) => {
    // Filtrar por fechas
    if (fechaInicio && new Date(evento.fecha) < fechaInicio) return false;
    if (fechaFin && new Date(evento.fecha) > new Date(fechaFin.getTime() + 24 * 60 * 60 * 1000)) return false;
    
    // Filtrar por tipo
    if (filtroTipo !== 'todos' && evento.tipo !== filtroTipo) return false;
    
    // Filtrar por estado
    if (filtroEstado !== 'todos' && evento.estado !== filtroEstado) return false;
    
    // Filtrar por búsqueda
    if (busqueda) {
      const searchLower = busqueda.toLowerCase();
      const matchesSearch = 
        (evento.observaciones?.toLowerCase().includes(searchLower)) ||
        (evento.toroNombre?.toLowerCase().includes(searchLower)) ||
        (evento.veterinario?.toLowerCase().includes(searchLower)) ||
        (evento.diagnostico?.toLowerCase().includes(searchLower));
      
      if (!matchesSearch) return false;
    }
    
    return true;
  });

  // Ordenar eventos por fecha (más recientes primero)
  const eventosOrdenados = [...eventosFiltrados].sort((a, b) => 
    new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
  );

  // Paginar eventos
  const eventosPaginados = eventosOrdenados.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const resetFiltros = () => {
    setFechaInicio(subDays(new Date(), 90));
    setFechaFin(new Date());
    setFiltroTipo('todos');
    setFiltroEstado('todos');
    setBusqueda('');
  };

  return (
    <Box>
      <Typography variant="subtitle1" gutterBottom>
        Historial de Eventos Reproductivos
      </Typography>
      
      {/* Filtros */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={2.5}>
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
              <DatePicker
                label="Fecha Inicio"
                value={fechaInicio}
                onChange={setFechaInicio}
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
          <Grid item xs={12} md={2.5}>
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
              <DatePicker
                label="Fecha Fin"
                value={fechaFin}
                onChange={setFechaFin}
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
            <FormControl fullWidth size="small">
              <InputLabel id="tipo-evento-label">Tipo</InputLabel>
              <Select
                labelId="tipo-evento-label"
                id="tipo-evento"
                value={filtroTipo}
                label="Tipo"
                onChange={(e) => setFiltroTipo(e.target.value)}
              >
                <MenuItem value="todos">Todos</MenuItem>
                <MenuItem value="celo">Celo</MenuItem>
                <MenuItem value="servicio">Servicio/Monta</MenuItem>
                <MenuItem value="diagnostico_preniez">Diagnóstico</MenuItem>
                <MenuItem value="parto">Parto</MenuItem>
                <MenuItem value="aborto">Aborto</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel id="estado-label">Estado</InputLabel>
              <Select
                labelId="estado-label"
                id="estado"
                value={filtroEstado}
                label="Estado"
                onChange={(e) => setFiltroEstado(e.target.value)}
              >
                <MenuItem value="todos">Todos</MenuItem>
                <MenuItem value="completado">Completado</MenuItem>
                <MenuItem value="pendiente">Pendiente</MenuItem>
                <MenuItem value="cancelado">Cancelado</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2.5}>
            <TextField
              fullWidth
              size="small"
              label="Buscar"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Observaciones, toro, veterinario..."
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={0.5} textAlign="right">
            <Tooltip title="Restablecer filtros">
              <IconButton onClick={resetFiltros}>
                <FilterListIcon />
              </IconButton>
            </Tooltip>
          </Grid>
          <Grid item xs={12}>
            <Button 
              variant="outlined" 
              size="small" 
              onClick={onRefresh}
              disabled={loading}
            >
              Actualizar
            </Button>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Tabla de eventos */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Fecha</TableCell>
              <TableCell>Tipo</TableCell>
              <TableCell>Detalles</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                  <CircularProgress />
                  <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                    Cargando eventos reproductivos...
                  </Typography>
                </TableCell>
              </TableRow>
            ) : eventosFiltrados.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                  <Typography variant="body1" color="textSecondary">
                    No se encontraron eventos con los filtros actuales
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              eventosPaginados.map((evento) => (
                <TableRow key={evento.id} hover>
                  <TableCell>
                    {format(new Date(evento.fecha), 'dd/MM/yyyy HH:mm', { locale: es })}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={getTipoEvento(evento.tipo)}
                      color={getTipoColor(evento.tipo)}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Box>
                      {evento.tipo === 'servicio' && (
                        <Typography variant="body2">
                          {evento.metodoInseminacion === 'ia' 
                            ? 'Inseminación Artificial' 
                            : 'Monta Natural'}
                          {evento.toroNombre && ` con ${evento.toroNombre}`}
                        </Typography>
                      )}
                      {evento.tipo === 'diagnostico_preniez' && (
                        <Typography variant="body2">
                          Diagnóstico: {evento.diagnostico === 'positivo' ? 'Positivo' : 'Negativo'}
                          {evento.fechaProbableParto && (
                            <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                              (Parto: {format(new Date(evento.fechaProbableParto), 'dd/MM/yyyy')})
                            </Typography>
                          )}
                        </Typography>
                      )}
                      {evento.tipo === 'parto' && (
                        <Typography variant="body2">
                          {evento.criasNacidas} cría(s) nacida(s)
                          {evento.pesoPromedioCrias && `, ${evento.pesoPromedioCrias} kg en promedio`}
                        </Typography>
                      )}
                      {evento.observaciones && (
                        <Tooltip title={evento.observaciones}>
                          <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: 300 }}>
                            {evento.observaciones}
                          </Typography>
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={evento.estado.charAt(0).toUpperCase() + evento.estado.slice(1)}
                      color={getEstadoColor(evento.estado)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Ver detalles">
                      <IconButton size="small" onClick={() => console.log('Ver evento', evento.id)}>
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Editar">
                      <IconButton size="small" onClick={() => console.log('Editar evento', evento.id)}>
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
      
      {/* Paginación */}
      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={eventosFiltrados.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        labelRowsPerPage="Registros por página:"
        labelDisplayedRows={({ from, to, count }) =>
          `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`
        }
      />
    </Box>
  );
};

export default HistorialReproductivo;
