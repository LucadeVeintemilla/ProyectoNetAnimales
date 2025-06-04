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
  Female as FemaleIcon,
  Male as MaleIcon,
} from '@mui/icons-material';
import { Animal } from '../../services/animalService';
import animalService from '../../services/animalService';
import { useAuth } from '../../context/AuthContext';

const AnimalesPage: React.FC = () => {
  const [animales, setAnimales] = useState<Animal[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'activos' | 'inactivos' | 'todos'>('activos');
  const [totalCount, setTotalCount] = useState<number>(0);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedAnimal, setSelectedAnimal] = useState<Animal | null>(null);
  
  const theme = useTheme();
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const isAdmin = hasRole('Administrador');

  const fetchAnimales = async () => {
    try {
      setLoading(true);
      console.log('Fetching animales with params:', { 
        page: page + 1, 
        pageSize: rowsPerPage, 
        search: searchTerm,
        status: statusFilter
      });
      
      const data = await animalService.getAnimales(
        page + 1, 
        rowsPerPage, 
        searchTerm,
        statusFilter
      );
      
      console.log('Received animales data:', data);
      setAnimales(data.items || []);
      setTotalCount(data.totalCount || 0);
    } catch (error) {
      console.error('Error al cargar los animales:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnimales();
  }, [page, rowsPerPage, searchTerm, statusFilter]);

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

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, animal: Animal) => {
    setAnchorEl(event.currentTarget);
    setSelectedAnimal(animal);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedAnimal(null);
  };

  const handleViewDetails = () => {
    if (selectedAnimal) {
      navigate(`/animales/${selectedAnimal.id}`);
      handleMenuClose();
    }
  };

  const handleEdit = () => {
    if (selectedAnimal) {
      navigate(`/animales/${selectedAnimal.id}/editar`);
      handleMenuClose();
    }
  };

  const handleDelete = async () => {
    if (selectedAnimal && selectedAnimal.id) {
      if (window.confirm(`¿Está seguro de que desea eliminar el animal ${selectedAnimal.nombre}?`)) {
        try {
          await animalService.deleteAnimal(selectedAnimal.id);
          fetchAnimales(); // Recargar la lista
        } catch (error) {
          console.error('Error al eliminar el animal:', error);
        }
      }
      handleMenuClose();
    }
  };

  const getStatusText = (activo: boolean) => {
    return activo ? 'Activo' : 'Inactivo';
  };

  const getStatusColor = (activo: boolean) => {
    return activo ? 'success' : 'error';
  };
  
  const handleStatusFilterChange = (newStatus: 'activos' | 'inactivos' | 'todos') => {
    setStatusFilter(newStatus);
    setPage(0); // Reset to first page when changing filter
    console.log('Changing status filter to:', newStatus);
  };

  const getSexoIcon = (sexo: string) => {
    return sexo === 'H' ? (
      <FemaleIcon color="secondary" />
    ) : (
      <MaleIcon color="primary" />
    );
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Gestión de Animales
        </Typography>
        {true && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => navigate('/animales/nuevo')}
          >
            Nuevo Animal
          </Button>
        )}
      </Box>

      <Card>
        <CardHeader
          title="Lista de Animales"
          action={
            <Box display="flex" alignItems="center">
              <TextField
                variant="outlined"
                size="small"
                placeholder="Buscar animales..."
                value={searchTerm}
                onChange={handleSearch}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="action" />
                    </InputAdornment>
                  ),
                }}
                sx={{ mr: 2, width: 300 }}
              />
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant={statusFilter === 'activos' ? 'contained' : 'outlined'}
                  color="primary"
                  size="small"
                  onClick={() => handleStatusFilterChange('activos')}
                  startIcon={<FilterListIcon />}
                >
                  Activos
                </Button>
                <Button
                  variant={statusFilter === 'inactivos' ? 'contained' : 'outlined'}
                  color="secondary"
                  size="small"
                  onClick={() => handleStatusFilterChange('inactivos')}
                  startIcon={<FilterListIcon />}
                >
                  Inactivos
                </Button>
                <Button
                  variant={statusFilter === 'todos' ? 'contained' : 'outlined'}
                  color="info"
                  size="small"
                  onClick={() => handleStatusFilterChange('todos')}
                  startIcon={<FilterListIcon />}
                >
                  Todos
                </Button>
              </Box>
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
                  <TableCell>Nombre</TableCell>
                  <TableCell>N° Identificación</TableCell>
                  <TableCell>Sexo</TableCell>
                  <TableCell>Raza</TableCell>
                  <TableCell>Fecha Nacimiento</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell align="right">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                      <CircularProgress />
                      <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                        Cargando animales...
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : animales.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                      <Typography variant="body1" color="textSecondary">
                        No se encontraron animales
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  animales.map((animal) => (
                    <TableRow key={animal.id} hover>
                      <TableCell>{animal.id}</TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          {getSexoIcon(animal.sexo)}
                          <Box ml={1}>{animal.nombre}</Box>
                        </Box>
                      </TableCell>
                      <TableCell>{animal.numeroIdentificacion}</TableCell>
                      <TableCell>{animal.sexo === 'H' ? 'Hembra' : 'Macho'}</TableCell>
                      <TableCell>{animal.razaNombre || 'N/A'}</TableCell>
                      <TableCell>
                        {new Date(animal.fechaNacimiento).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Chip
                        label={getStatusText(animal.activo)}
                        color={getStatusColor(animal.activo)}
                        size="small"
                        variant={animal.activo ? 'filled' : 'outlined'}
                      />
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          onClick={(e) => handleMenuOpen(e, animal)}
                        >
                          <MoreVertIcon />
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
            labelRowsPerPage="Filas por página:"
            labelDisplayedRows={({ from, to, count }) =>
              `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`
            }
          />
        </CardContent>
      </Card>

      {/* Menú de acciones */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        onClick={handleMenuClose}
        PaperProps={{
          elevation: 1,
          sx: { width: 200 },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={handleViewDetails}>
          <ListItemIcon>
            <VisibilityIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Ver Detalles</ListItemText>
        </MenuItem>
        {true && (
          <MenuItem onClick={handleEdit}>
            <ListItemIcon>
              <EditIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Editar</ListItemText>
          </MenuItem>
        )}
        {true && (
          <MenuItem onClick={handleDelete}>
            <ListItemIcon>
              <DeleteIcon fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText sx={{ color: theme.palette.error.main }}>
              Eliminar
            </ListItemText>
          </MenuItem>
        )}
      </Menu>
    </Box>
  );
};

export default AnimalesPage;
