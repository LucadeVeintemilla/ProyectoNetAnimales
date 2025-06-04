import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Container,
  Divider,
  FormControl,
  Grid,
  IconButton,
  InputAdornment,
  Menu,
  MenuItem,
  Paper,
  Select,
  SelectChangeEvent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Toolbar,
  Tooltip,
  Typography,
  useTheme,
  CircularProgress,
  ListItemIcon,
  ListItemText,
  Avatar,
  Badge,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  MoreVert as MoreVertIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CalendarMonth as CalendarIcon,
  Female as FemaleIcon,
  Male as MaleIcon,
  PregnantWoman as PregnantWomanIcon,
  ChildCare as ChildCareIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import reproduccionService, { Reproduccion } from '../../services/reproduccionService';
import { useAuth } from '../../context/AuthContext';

const getEventoColor = (tipo?: string) => {
  if (!tipo) return 'default';
  
  const tipoLower = tipo.toLowerCase();
  if (tipoLower.includes('natural') || tipoLower.includes('monta') || tipoLower.includes('monta natural') || tipoLower.includes('breeding') || tipoLower.includes('natural breeding')) {
    return 'primary';
  }
  if (tipoLower.includes('inseminacion') || tipoLower.includes('inseminación') || tipoLower.includes('insemination') || tipoLower.includes('ai') || tipoLower.includes('artificial insemination')) {
    return 'secondary';
  }
  if (tipoLower.includes('parto') || tipoLower.includes('trasplante') || tipoLower.includes('birth') || tipoLower.includes('birth delivery')) {
    return 'success';
  }
  return 'default';
};

  const getEventoIcon = (tipo?: string) => {
    if (!tipo) return <CalendarIcon fontSize="small" />;
    
    const tipoLower = tipo.toLowerCase();
    if (tipoLower === 'natural' || tipoLower === 'monta natural') {
      return <FemaleIcon fontSize="small" />;
    }
    if (tipoLower === 'inseminacion' || tipoLower === 'inseminación') {
      return <PregnantWomanIcon fontSize="small" />;
    }
    if (tipoLower === 'parto' || tipoLower === 'trasplante') {
      return <ChildCareIcon fontSize="small" />;
    }
    return <CalendarIcon fontSize="small" />;
  };

const ReproduccionPage: React.FC = () => {
  const [eventos, setEventos] = useState<Reproduccion[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [tipoFiltro, setTipoFiltro] = useState<string>('todos');
  const [totalCount, setTotalCount] = useState<number>(0);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  
  const theme = useTheme();
  const navigate = useNavigate();
  const { hasRole } = useAuth();

  const canEdit = hasRole('ADMIN') || hasRole('MANAGER');
  const canDelete = hasRole('ADMIN');

  // Cargar datos iniciales
  useEffect(() => {
    fetchEventos();
  }, [page, rowsPerPage, searchTerm, tipoFiltro]);

  const fetchEventos = async () => {
    try {
      setLoading(true);
      const response = await reproduccionService.getReproducciones(
        page + 1,
        rowsPerPage,
        tipoFiltro === 'todos' ? undefined : tipoFiltro
      );
      
      console.log('API Response:', response); // Debug log
      
      // Verificar si la respuesta es paginada o un array simple
      const eventosData = Array.isArray(response) ? response : response?.items || [];
      
      // Debug log para ver los tipos de monta
      console.log('Eventos con tipos de monta:', eventosData.map((e: any) => ({
        id: e.id,
        tipoMonta: e.tipoMonta,
        tipoEvento: e.tipoEvento,
        raw: e
      })));
      
      // Handle both array and object responses
      if (Array.isArray(response)) {
        setEventos(response);
        setTotalCount(response.length);
      } else if (response && response.items) {
        setEventos(response.items);
        setTotalCount(response.totalCount || response.items.length);
      } else {
        setEventos([]);
        setTotalCount(0);
      }
    } catch (error) {
      console.error('Error al cargar los eventos reproductivos:', error);
      setEventos([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };

  const handleTipoFiltroChange = (event: SelectChangeEvent) => {
    setTipoFiltro(event.target.value);
    setPage(0);
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, id: number) => {
    setSelectedId(id);
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedId(null);
  };

  const handleView = (id: number) => {
    navigate(`/reproduccion/${id}`);
    handleMenuClose();
  };

  const handleEdit = (id: number) => {
    navigate(`/reproduccion/editar/${id}`);
    handleMenuClose();
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Está seguro de que desea eliminar este evento reproductivo?')) {
      try {
        await reproduccionService.deleteReproduccion(id);
        fetchEventos();
      } catch (error) {
        console.error('Error al eliminar el evento reproductivo:', error);
      }
    }
    handleMenuClose();
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return isNaN(date.getTime()) ? 'Fecha inválida' : format(date, 'dd/MM/yyyy', { locale: es });
    } catch (error) {
      console.error('Error al formatear fecha:', error);
      return 'Error';
    }
  };

  const formatDateTime = (dateString?: string | null) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return isNaN(date.getTime()) ? 'Fecha inválida' : format(date, 'dd/MM/yyyy HH:mm', { locale: es });
    } catch (error) {
      console.error('Error al formatear fecha/hora:', error);
      return 'Error';
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Reproducción</Typography>
        {(
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => navigate('/reproduccion/nuevo')}
          >
            Nuevo Evento
          </Button>
        )}
      </Box>

      <Card>
        <CardHeader
          title="Eventos Reproductivos"
          action={
            <Box display="flex" alignItems="center" gap={2}>
              <TextField
                size="small"
                placeholder="Buscar por ID o nombre..."
                value={searchTerm}
                onChange={handleSearch}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
                sx={{ minWidth: 250 }}
              />
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <Select
                  value={tipoFiltro}
                  onChange={handleTipoFiltroChange}
                  displayEmpty
                  inputProps={{ 'aria-label': 'Filtrar por tipo' }}
                >
                  <MenuItem value="todos">Todos los eventos</MenuItem>
                  <MenuItem value="monta">Montas</MenuItem>
                  <MenuItem value="preñes">Preñeces</MenuItem>
                  <MenuItem value="parto">Partos</MenuItem>
                </Select>
              </FormControl>
            </Box>
          }
        />
        <Divider />
        <CardContent>
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
                  <TableCell>Registrado</TableCell>
                  <TableCell align="right">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <Box py={4}>
                        <CircularProgress />
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : eventos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <Box py={4}>
                        <Typography variant="body1">
                          No se encontraron eventos reproductivos
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : (
                  eventos.map((evento) => {
                    console.log('Rendering evento:', {
                      id: evento.id,
                      tipoMonta: (evento as any).tipoMonta || (evento as any).tipoEvento,
                      raw: evento
                    });
                    
                    // Asegurarse de que tipo siempre sea un string y tenga un valor por defecto
                    const tipo = String((evento as any).tipoMonta || (evento as any).tipoEvento || 'desconocido').toLowerCase();
                    
                    return (
                      <TableRow key={evento.id} hover>
                        <TableCell>{evento.id}</TableCell>
                        <TableCell>
                          <Chip
                            icon={getEventoIcon(tipo)}
                            label={
                              tipo.includes('inseminacion') || tipo.includes('inseminación') ? 'Inseminación' :
                              tipo.includes('natural') ? 'Monta Natural' :
                              tipo.includes('trasplante') ? 'Trasplante' :
                              'Desconocido'
                            }
                            color={getEventoColor(tipo) as any}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            <FemaleIcon color="secondary" />
                            <Box>
                              <Typography variant="body2">
                                {evento.hembraNombre || 'N/A'}
                              </Typography>
                              <Typography variant="caption" color="textSecondary">
                                ID: {evento.hembraId}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          {evento.machoId ? (
                            <Box display="flex" alignItems="center" gap={1}>
                              <MaleIcon color="primary" />
                              <Box>
                                <Typography variant="body2">
                                  {evento.machoNombre || 'N/A'}
                                </Typography>
                                <Typography variant="caption" color="textSecondary">
                                  ID: {evento.machoId}
                                </Typography>
                              </Box>
                            </Box>
                          ) : (
                            <Typography variant="body2" color="textSecondary">
                              No aplica
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>{(evento.fechaMonta)}</TableCell>
                        <TableCell>
                          <Chip
                            label={evento.resultado || 'Pendiente'}
                            size="small"
                            color={
                              evento.resultado === 'parto_exitoso' 
                                ? 'success' 
                                : evento.resultado === 'preñada'
                                ? 'primary'
                                : ['aborto', 'parto_fallido', 'no_preñada'].includes(evento.resultado || '')
                                ? 'error'
                                : 'default'
                            }
                          />
                        </TableCell>
                        <TableCell>{formatDateTime(evento.fechaCreacion ?? '')}</TableCell>
                        <TableCell align="right">
                          <IconButton
                            size="small"
                            onClick={(e) => handleMenuClick(e, evento.id as number)}
                          >
                            <MoreVertIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  })
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
        </CardContent>
      </Card>

      {/* Menú de acciones */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl) && selectedId !== null}
        onClose={handleMenuClose}
        onClick={handleMenuClose}
      >
        <MenuItem onClick={() => selectedId && handleView(selectedId)}>
          <ListItemIcon>
            <VisibilityIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Ver Detalles</ListItemText>
        </MenuItem>
        {canEdit && (
          <MenuItem onClick={() => selectedId && handleEdit(selectedId)}>
            <ListItemIcon>
              <EditIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Editar</ListItemText>
          </MenuItem>
        )}
        {canDelete && (
          <MenuItem onClick={() => selectedId && handleDelete(selectedId)}>
            <ListItemIcon>
              <DeleteIcon fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText primaryTypographyProps={{ color: 'error' }}>
              Eliminar
            </ListItemText>
          </MenuItem>
        )}
      </Menu>
    </Box>
  );
};

export default ReproduccionPage;
