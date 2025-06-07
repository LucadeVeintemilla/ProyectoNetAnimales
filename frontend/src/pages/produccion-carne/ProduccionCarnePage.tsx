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
import { ProduccionCarne } from '../../services/produccionCarneService';
import produccionCarneService from '../../services/produccionCarneService';
import { useAuth } from '../../context/AuthContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const ProduccionCarnePage: React.FC = () => {
  // Extend the ProduccionCarne interface to include additional properties
  interface ExtendedProduccionCarne extends ProduccionCarne {
    nombreAnimal?: string;
    fechaCreacion?: string | Date;
    fechaActualizacion?: string | Date;
  }

  const [producciones, setProducciones] = useState<ExtendedProduccionCarne[]>([]);
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

  // Temporarily enabling editing for all users to test the feature
  // Original: const canEdit = hasRole('Administrador') || hasRole('Gerente');
  const canEdit = true; // Allow all users to create/edit records for testing
  const canDelete = hasRole('Administrador');

  // Cargar datos iniciales
  useEffect(() => {
    fetchProducciones();
  }, [page, rowsPerPage, searchTerm, fechaInicio, fechaFin]);

  const fetchProducciones = async () => {
    try {
      setLoading(true);
      const response = await produccionCarneService.getProducciones(
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
      console.error('Error al cargar las producciones de carne:', error);
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
    navigate(`/produccion-carne/${id}`);
    handleMenuClose();
  };

  const handleEdit = (id: number) => {
    navigate(`/produccion-carne/${id}/editar`);
    handleMenuClose();
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Está seguro de que desea eliminar este registro de producción de carne?')) {
      try {
        await produccionCarneService.deleteProduccion(id);
        fetchProducciones();
      } catch (error) {
        console.error('Error al eliminar el registro de producción de carne:', error);
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

  const formatNumber = (value: number | undefined, decimals: number = 2): string => {
    if (value === undefined || value === null) return 'N/A';
    return value.toFixed(decimals);
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Producción de Carne</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => navigate('/produccion-carne/nuevo')}
          disabled={!canEdit}
        >
          Nuevo Registro
        </Button>
      </Box>

      <Card>
        <CardHeader 
          title="Registros de Sacrificio y Faena" 
          action={
            <Box display="flex" alignItems="center">
              <TextField
                variant="outlined"
                size="small"
                placeholder="Buscar por ID animal"
                value={searchTerm}
                onChange={handleSearch}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
                sx={{ mr: 1 }}
              />
              <Tooltip title="Filtrar por fecha">
                <IconButton onClick={handleFilterClick}>
                  <FilterListIcon />
                </IconButton>
              </Tooltip>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl) && selectedId === null}
                onClose={handleFilterClose}
              >
                <Box p={2} width={240}>
                  <Typography variant="subtitle2" gutterBottom>
                    Filtrar por fecha
                  </Typography>
                  <TextField
                    label="Fecha inicio"
                    type="date"
                    value={fechaInicio}
                    onChange={(e) => setFechaInicio(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                    size="small"
                    margin="dense"
                  />
                  <TextField
                    label="Fecha fin"
                    type="date"
                    value={fechaFin}
                    onChange={(e) => setFechaFin(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                    size="small"
                    margin="dense"
                  />
                  <Box mt={2} display="flex" justifyContent="space-between">
                    <Button 
                      size="small" 
                      onClick={() => {
                        setFechaInicio('');
                        setFechaFin('');
                        handleFilterClose();
                      }}
                    >
                      Limpiar
                    </Button>
                    <Button 
                      size="small" 
                      variant="contained" 
                      onClick={handleFilterClose}
                    >
                      Aplicar
                    </Button>
                  </Box>
                </Box>
              </Menu>
            </Box>
          }
        />
        <Divider />
        <CardContent>
          <TableContainer component={Paper}>
            <Table size="medium">
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Animal</TableCell>
                  <TableCell>Fecha Sacrificio</TableCell>
                  <TableCell>Peso Vivo (kg)</TableCell>
                  <TableCell>Peso Canal (kg)</TableCell>
                  <TableCell>Rendimiento (%)</TableCell>
                  <TableCell>Destino</TableCell>
                  <TableCell>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <CircularProgress size={24} />
                      <Typography variant="body2" sx={{ ml: 1 }}>
                        Cargando...
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : producciones.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      No hay registros de producción de carne
                    </TableCell>
                  </TableRow>
                ) : (
                  producciones.map((produccion) => (
                    <TableRow key={produccion.id} hover>
                      <TableCell>{produccion.id}</TableCell>
                      <TableCell>
                        <Tooltip title={`ID: ${produccion.animalId}`}>
                          <span>
                            {produccion.nombreAnimal || 'N/A'}{' '}
                            <Typography variant="caption" color="textSecondary" component="span">
                              ({produccion.numeroIdentificacion || 'Sin ID'})
                            </Typography>
                          </span>
                        </Tooltip>
                      </TableCell>
                      <TableCell>{formatDate(produccion.fechaSacrificio)}</TableCell>
                      <TableCell>{formatNumber(produccion.pesoVivo)}</TableCell>
                      <TableCell>{formatNumber(produccion.pesoCanal)}</TableCell>
                      <TableCell>{formatNumber(produccion.rendimientoCarnico)}</TableCell>
                      <TableCell>{produccion.destino}</TableCell>
                      <TableCell>
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
            component="div"
            count={totalCount}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[5, 10, 25]}
            labelRowsPerPage="Filas por página:"
          />
        </CardContent>
      </Card>

      {/* Menu for row actions */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl) && selectedId !== null}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => selectedId && handleView(selectedId)}>
          <ListItemIcon>
            <VisibilityIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Ver detalles</ListItemText>
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
              <DeleteIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Eliminar</ListItemText>
          </MenuItem>
        )}
      </Menu>
    </Box>
  );
};

export default ProduccionCarnePage;
