import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
  IconButton,
  Tooltip,
  SelectChangeEvent,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { reproduccionService } from '../../services/reproduccionService';
import { getEventoIcon, getEventoColor } from './utils/reproduccionUtils';

interface FiltrosReproduccion {
  tipoEvento: string;
  fechaInicio: string;
  fechaFin: string;
  resultado: string;
}

export const ReproduccionList: React.FC = () => {
  const navigate = useNavigate();
  const [reproducciones, setReproducciones] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [total, setTotal] = useState<number>(0);
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [filtros, setFiltros] = useState<FiltrosReproduccion>({
    tipoEvento: '',
    fechaInicio: '',
    fechaFin: '',
    resultado: '',
  });
  const [mostrarFiltros, setMostrarFiltros] = useState<boolean>(false);
  const [filtrosDisponibles, setFiltrosDisponibles] = useState<{
    tiposEvento: Array<{ value: string; label: string }>;
    resultados: Array<{ value: string; label: string }>;
  }>({ tiposEvento: [], resultados: [] });

  // Cargar filtros disponibles
  useEffect(() => {
    const cargarFiltros = async () => {
      try {
        const data = await reproduccionService.getFiltros();
        setFiltrosDisponibles({
          tiposEvento: data.tiposEvento,
          resultados: data.resultados,
        });
      } catch (error) {
        console.error('Error al cargar los filtros:', error);
      }
    };

    cargarFiltros();
  }, []);

  // Cargar reproducciones
  const cargarReproducciones = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: page + 1,
        pageSize: rowsPerPage,
      };

      // Aplicar filtros
      if (filtros.tipoEvento) params.tipoEvento = filtros.tipoEvento;
      if (filtros.resultado) params.resultado = filtros.resultado;
      if (filtros.fechaInicio) params.fechaInicio = filtros.fechaInicio;
      if (filtros.fechaFin) params.fechaFin = filtros.fechaFin;

      const data = await reproduccionService.getReproducciones(
        params.page,
        params.pageSize,
        params.tipoEvento
      );

      setReproducciones(data.items || []);
      setTotal(data.totalCount || 0);
    } catch (error) {
      console.error('Error al cargar las reproducciones:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarReproducciones();
  }, [page, rowsPerPage, filtros]);

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleFiltroChange = (e: React.ChangeEvent<{ name?: string; value: unknown }> | SelectChangeEvent) => {
    const { name, value } = e.target;
    setFiltros((prev) => ({
      ...prev,
      [name as string]: value,
    }));
    setPage(0);
  };

  const limpiarFiltros = () => {
    setFiltros({
      tipoEvento: '',
      fechaInicio: '',
      fechaFin: '',
      resultado: '',
    });
    setPage(0);
  };

  const formatearFecha = (fecha: string) => {
    if (!fecha) return 'N/A';
    return format(new Date(fecha), 'dd MMM yyyy', { locale: es });
  };

  const handleVerDetalle = (id: number) => {
    navigate(`/reproduccion/detalle/${id}`);
  };

  const handleEditar = (id: number) => {
    navigate(`/reproduccion/editar/${id}`);
  };

  const handleEliminar = async (id: number) => {
    if (window.confirm('¿Está seguro de eliminar este evento de reproducción?')) {
      try {
        await reproduccionService.deleteReproduccion(id);
        await cargarReproducciones();
      } catch (error) {
        console.error('Error al eliminar la reproducción:', error);
      }
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h1">
          Eventos de Reproducción
        </Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<FilterIcon />}
            onClick={() => setMostrarFiltros(!mostrarFiltros)}
            sx={{ mr: 2 }}
          >
            Filtros
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => navigate('/reproduccion/nuevo')}
          >
            Nuevo Evento
          </Button>
        </Box>
      </Box>

      {mostrarFiltros && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={2} alignItems="flex-end">
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel id="tipo-evento-label">Tipo de Evento</InputLabel>
                  <Select
                    labelId="tipo-evento-label"
                    name="tipoEvento"
                    value={filtros.tipoEvento}
                    label="Tipo de Evento"
                    onChange={handleFiltroChange}
                  >
                    <MenuItem value="">Todos</MenuItem>
                    {filtrosDisponibles.tiposEvento.map((tipo) => (
                      <MenuItem key={tipo.value} value={tipo.value}>
                        {tipo.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <TextField
                  fullWidth
                  size="small"
                  label="Fecha Inicio"
                  type="date"
                  name="fechaInicio"
                  value={filtros.fechaInicio}
                  onChange={handleFiltroChange}
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <TextField
                  fullWidth
                  size="small"
                  label="Fecha Fin"
                  type="date"
                  name="fechaFin"
                  value={filtros.fechaFin}
                  onChange={handleFiltroChange}
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel id="resultado-label">Resultado</InputLabel>
                  <Select
                    labelId="resultado-label"
                    name="resultado"
                    value={filtros.resultado}
                    label="Resultado"
                    onChange={handleFiltroChange}
                  >
                    <MenuItem value="">Todos</MenuItem>
                    {filtrosDisponibles.resultados.map((resultado) => (
                      <MenuItem key={resultado.value} value={resultado.value}>
                        {resultado.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <Button fullWidth variant="outlined" onClick={limpiarFiltros}>
                  Limpiar
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Tipo</TableCell>
              <TableCell>Hembra</TableCell>
              <TableCell>Macho</TableCell>
              <TableCell>Fecha</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>Próximo Parto</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  Cargando...
                </TableCell>
              </TableRow>
            ) : reproducciones.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  No se encontraron eventos de reproducción
                </TableCell>
              </TableRow>
            ) : (
              reproducciones.map((reproduccion) => (
                <TableRow key={reproduccion.id} hover>
                  <TableCell>{reproduccion.id}</TableCell>
                  <TableCell>
                    <Chip
                      icon={getEventoIcon(reproduccion.tipoEvento)}
                      label={reproduccion.tipoEvento}
                      color={getEventoColor(reproduccion.tipoEvento) as any}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2">{reproduccion.hembraNombre}</Typography>
                      <Typography variant="caption" color="textSecondary">
                        {reproduccion.hembraIdentificacion}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    {reproduccion.machoNombre ? (
                      <Box>
                        <Typography variant="body2">{reproduccion.machoNombre}</Typography>
                        <Typography variant="caption" color="textSecondary">
                          {reproduccion.machoIdentificacion}
                        </Typography>
                      </Box>
                    ) : (
                      'N/A'
                    )}
                  </TableCell>
                  <TableCell>{formatearFecha(reproduccion.fechaMonta)}</TableCell>
                  <TableCell>
                    <Chip
                      label={reproduccion.resultado || 'Pendiente'}
                      color={
                        reproduccion.resultado === 'preñada'
                          ? 'success'
                          : reproduccion.resultado === 'no_preñada'
                          ? 'error'
                          : 'default'
                      }
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    {reproduccion.fechaProbableParto
                      ? formatearFecha(reproduccion.fechaProbableParto)
                      : 'N/A'}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Tooltip title="Ver detalles">
                        <IconButton
                          size="small"
                          onClick={() => handleVerDetalle(reproduccion.id)}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Editar">
                        <IconButton
                          size="small"
                          onClick={() => handleEditar(reproduccion.id)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Eliminar">
                        <IconButton
                          size="small"
                          onClick={() => handleEliminar(reproduccion.id)}
                          color="error"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={total}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Filas por página:"
          labelDisplayedRows={({ from, to, count }) =>
            `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`
          }
        />
      </TableContainer>
    </Box>
  );
};

export default ReproduccionList;
