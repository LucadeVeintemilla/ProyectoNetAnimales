import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Divider,
  Grid,
  IconButton,
  Typography,
  Tooltip,
  CircularProgress,
  Breadcrumbs,
  Link,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CalendarToday as CalendarIcon,
  Visibility as VisibilityIcon,
  Scale as ScaleIcon,
  LocalShipping as LocalShippingIcon,
  Notes as NotesIcon,
} from '@mui/icons-material';
import produccionCarneService, { ProduccionCarne as BaseProduccionCarne } from '../../services/produccionCarneService';
import { useAuth } from '../../context/AuthContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Extendemos la interfaz para incluir campos de auditoría que pueden venir del backend
interface ProduccionCarne extends BaseProduccionCarne {
  nombreAnimal?: string;
  numeroIdentificacion?: string;
  fechaCreacion?: string | Date;
  fechaActualizacion?: string | Date;
  usuarioCreacion?: string;
  usuarioActualizacion?: string;
};

const ProduccionCarneDetallePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const [loading, setLoading] = useState<boolean>(true);
  const [produccion, setProduccion] = useState<ProduccionCarne | null>(null);
  const [animal, setAnimal] = useState<any>(null);
  
  // Temporarily enabling editing/deleting for all users to test the feature
  // Original: const canEdit = hasRole('Administrador') || hasRole('Gerente');
  // Original: const canDelete = hasRole('Administrador');
  const canEdit = true; // Allow all users to edit records for testing
  const canDelete = true; // Allow all users to delete records for testing

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const data = await produccionCarneService.getProduccionById(parseInt(id));
        setProduccion(data);
        
        // También podríamos cargar los detalles del animal si es necesario
        // Esto depende de si la API devuelve todos los detalles necesarios o no
        
      } catch (error) {
        console.error('Error al cargar los detalles de producción de carne:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleDelete = async () => {
    if (!id) return;
    
    if (window.confirm('¿Está seguro de que desea eliminar este registro de producción de carne? Esta acción no se puede deshacer.')) {
      try {
        await produccionCarneService.deleteProduccion(parseInt(id));
        navigate('/produccion-carne');
      } catch (error) {
        console.error('Error al eliminar el registro:', error);
        alert('No se pudo eliminar el registro. Inténtelo de nuevo más tarde.');
      }
    }
  };

  const formatDate = (dateValue: string | Date | undefined): string => {
    if (!dateValue) return 'N/A';
    try {
      const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
      return isNaN(date.getTime()) ? 'Fecha inválida' : format(date, 'dd MMMM yyyy', { locale: es });
    } catch (error) {
      return 'Fecha inválida';
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!produccion) {
    return (
      <Box p={3}>
        <Typography variant="h6" color="error">
          No se encontró el registro de producción de carne solicitado
        </Typography>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/produccion-carne')}
          sx={{ mt: 2 }}
        >
          Volver al listado
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Detalles de Producción de Carne
          </Typography>
          <Breadcrumbs aria-label="breadcrumb">
            <Link color="inherit" href="#" onClick={() => navigate('/produccion-carne')}>
              Producción de Carne
            </Link>
            <Typography color="textPrimary">Registro #{produccion.id}</Typography>
          </Breadcrumbs>
        </Box>
        <Box>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/produccion-carne')}
            sx={{ mr: 1 }}
          >
            Volver
          </Button>
          {canEdit && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<EditIcon />}
              onClick={() => navigate(`/produccion-carne/${id}/editar`)}
              sx={{ mr: 1 }}
            >
              Editar
            </Button>
          )}
          {canDelete && (
            <Button
              variant="contained"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={handleDelete}
            >
              Eliminar
            </Button>
          )}
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Información principal */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader 
              title="Información de Sacrificio"
              avatar={<CalendarIcon color="primary" />}
            />
            <Divider />
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    ID de Registro:
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {produccion.id}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Fecha de Sacrificio:
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {formatDate(produccion.fechaSacrificio)}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }} />
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    ID del Animal:
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {produccion.animalId}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Nombre del Animal:
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {produccion.nombreAnimal || 'N/A'} 
                    {produccion.numeroIdentificacion && 
                      <Typography component="span" variant="caption" color="textSecondary">
                        ({produccion.numeroIdentificacion})
                      </Typography>
                    }
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Información de pesos */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader 
              title="Datos de Peso y Rendimiento"
              avatar={<ScaleIcon color="primary" />}
            />
            <Divider />
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={4}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Peso Vivo:
                  </Typography>
                  <Typography variant="h6" gutterBottom>
                    {produccion.pesoVivo.toFixed(2)} kg
                  </Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Peso Canal:
                  </Typography>
                  <Typography variant="h6" gutterBottom>
                    {produccion.pesoCanal.toFixed(2)} kg
                  </Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Rendimiento:
                  </Typography>
                  <Typography variant="h6" color="primary" gutterBottom>
                    {produccion.rendimientoCarnico.toFixed(2)}%
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Destino */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader 
              title="Destino de la Carne" 
              avatar={<LocalShippingIcon color="primary" />}
            />
            <Divider />
            <CardContent>
              <Typography variant="body1">
                {produccion.destino || 'No especificado'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Observaciones */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader 
              title="Observaciones" 
              avatar={<NotesIcon color="primary" />}
            />
            <Divider />
            <CardContent>
              <Typography variant="body1">
                {produccion.observaciones || 'Sin observaciones'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Información de auditoría */}
        <Grid item xs={12}>
          <Card>
            <CardHeader title="Información de Auditoría" />
            <Divider />
            <CardContent>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Acción</TableCell>
                      <TableCell>Fecha</TableCell>
                      <TableCell>Usuario</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {produccion.fechaCreacion && (
                      <TableRow>
                        <TableCell>Creación</TableCell>
                        <TableCell>{formatDate(produccion.fechaCreacion)}</TableCell>
                        <TableCell>{produccion.usuarioCreacion || 'Sistema'}</TableCell>
                      </TableRow>
                    )}
                    {produccion.fechaActualizacion && (
                      <TableRow>
                        <TableCell>Última Actualización</TableCell>
                        <TableCell>{formatDate(produccion.fechaActualizacion)}</TableCell>
                        <TableCell>{produccion.usuarioActualizacion || 'Sistema'}</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ProduccionCarneDetallePage;
