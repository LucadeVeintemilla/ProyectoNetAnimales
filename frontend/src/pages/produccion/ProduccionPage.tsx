import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Divider,
  IconButton,
  InputAdornment,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  useTheme,
  CircularProgress,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  MoreVert as MoreVertIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CalendarToday as CalendarIcon,
} from '@mui/icons-material';
import { ProduccionLeche } from '../../services/produccionService';
import produccionService from '../../services/produccionService';
import { useAuth } from '../../context/AuthContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';



const ProduccionPage: React.FC = () => {
  // Extend the ProduccionLeche interface to include additional properties
  interface ExtendedProduccionLeche extends ProduccionLeche {
    animalNombre?: string;
    fechaCreacion?: string | Date;
    fechaActualizacion?: string | Date;
  }

  const [producciones, setProducciones] = useState<ExtendedProduccionLeche[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [totalCount, setTotalCount] = useState<number>(0);
  const [fechaInicio, setFechaInicio] = useState<string>('');
  const [fechaFin, setFechaFin] = useState<string>('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  
  const theme = useTheme();
  const navigate = useNavigate();
  const { hasRole } = useAuth();

  const canEdit = hasRole('Administrador') || hasRole('Gerente');
  const canDelete = hasRole('Administrador');

  // Cargar datos iniciales
  useEffect(() => {
    fetchProducciones();
  }, [page, rowsPerPage, searchTerm, fechaInicio, fechaFin]);

  const fetchProducciones = async () => {
    try {
      setLoading(true);
      const response = await produccionService.getProducciones(
        page + 1,
        rowsPerPage,
        fechaInicio,
        fechaFin,
        searchTerm ? parseInt(searchTerm) : undefined
      );
      // Ensure the response data matches our extended interface
      const produccionesData = Array.isArray(response) 
        ? response 
        : response?.items || [];
      
      setProducciones(produccionesData);
      setTotalCount(Array.isArray(response) ? response.length : response?.totalCount || 0);
    } catch (error) {
      console.error('Error al cargar las producciones:', error);
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

  const handleFilterClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleFilterClose = () => {
    setAnchorEl(null);
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
    navigate(`/produccion/${id}`);
    handleMenuClose();
  };

  const handleEdit = (id: number) => {
    navigate(`/produccion/${id}/editar`);
    console.log('Redirigiendo a', `/produccion/${id}/editar`);
    handleMenuClose();
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Está seguro de que desea eliminar este registro de producción?')) {
      try {
        await produccionService.deleteProduccion(id);
        fetchProducciones();
      } catch (error) {
        console.error('Error al eliminar el registro de producción:', error);
      }
    }
    handleMenuClose();
  };

  const formatDate = (dateValue: string | Date | undefined): string => {
    if (!dateValue) return 'N/A';
    try {
      const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
      return isNaN(date.getTime()) ? 'Fecha inválida' : format(date, 'dd/MM/yyyy', { locale: es });
    } catch (error) {
      console.error('Error al formatear fecha:', error);
      return 'Fecha inválida';
    }
  };

  const formatDateTime = (dateValue: string | Date | undefined): string => {
    if (!dateValue) return 'N/A';
    try {
      const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
      return isNaN(date.getTime()) ? 'Fecha inválida' : format(date, 'dd/MM/yyyy HH:mm', { locale: es });
    } catch (error) {
      console.error('Error al formatear fecha/hora:', error);
      return 'Fecha inválida';
    }
  };

  const getTurnoColor = (turno: 'Mañana' | 'Tarde' | 'Noche') => {
    switch (turno) {
      case 'Mañana':
        return 'primary';
      case 'Tarde':
        return 'secondary';
      case 'Noche':
      default:
        return 'default';
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Producción de Leche</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => navigate('/produccion/nuevo')}
        >
          Añadir Producción
        </Button>
      </Box>

      <Card>
        <CardHeader
          title="Registros de Producción"
          action={
            <Box display="flex" alignItems="center">
              <TextField
                size="small"
                placeholder="Buscar por ID de animal..."
                value={searchTerm}
                onChange={handleSearch}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
                sx={{ mr: 1, minWidth: 250 }}
              />
              <Tooltip title="Filtros">
                <IconButton onClick={handleFilterClick}>
                  <FilterListIcon />
                </IconButton>
              </Tooltip>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl) && selectedId === null}
                onClose={handleFilterClose}
              >
                <Box p={2} width={250}>
                  <Typography variant="subtitle2" gutterBottom>
                    Filtros de Fecha
                  </Typography>
                  <Box mb={2}>
                    <TextField
                      label="Fecha Inicio"
                      type="date"
                      size="small"
                      fullWidth
                      value={fechaInicio}
                      onChange={(e) => setFechaInicio(e.target.value)}
                      InputLabelProps={{
                        shrink: true,
                      }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <CalendarIcon fontSize="small" />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Box>
                  <Box mb={2}>
                    <TextField
                      label="Fecha Fin"
                      type="date"
                      size="small"
                      fullWidth
                      value={fechaFin}
                      onChange={(e) => setFechaFin(e.target.value)}
                      InputLabelProps={{
                        shrink: true,
                      }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <CalendarIcon fontSize="small" />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Box>
                  <Button
                    variant="outlined"
                    size="small"
                    fullWidth
                    onClick={() => {
                      setFechaInicio('');
                      setFechaFin('');
                      handleFilterClose();
                    }}
                  >
                    Limpiar Filtros
                  </Button>
                </Box>
              </Menu>
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
                  <TableCell>Fecha</TableCell>
                  <TableCell>Animal</TableCell>
                  <TableCell>Cant. (Lts)</TableCell>
                  <TableCell>Turno</TableCell>
                  <TableCell>Registrado</TableCell>
                  <TableCell align="right">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Box py={4}>
                        <CircularProgress />
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : producciones.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Box py={4}>
                        <Typography variant="body1">
                          No se encontraron registros de producción
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : (
                  producciones.map((produccion) => (
                    <TableRow key={produccion.id} hover>
                      <TableCell>{produccion.id}</TableCell>
                      <TableCell>{formatDate(produccion.fecha)}</TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          <Typography variant="body2">
                            {produccion.animalId || `Animal #${produccion.animalId}`}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{produccion.cantidadLitros?.toFixed(2)} L</TableCell>
                      <TableCell>
                        <Chip
                          label={produccion.turno}
                          size="small"
                          color={getTurnoColor(produccion.turno as 'Mañana' | 'Tarde' | 'Noche')}
                        />
                      </TableCell>
                      <TableCell>{formatDateTime(produccion.fechaCreacion || '')}</TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          onClick={(e) => handleMenuClick(e, produccion.id as number)}
                        >
                          <MoreVertIcon fontSize="small" />
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
        {(
          <MenuItem onClick={() => selectedId && handleEdit(selectedId)}>
            <ListItemIcon>
              <EditIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Editar</ListItemText>
          </MenuItem>
        )}
        {(
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

export default ProduccionPage;
