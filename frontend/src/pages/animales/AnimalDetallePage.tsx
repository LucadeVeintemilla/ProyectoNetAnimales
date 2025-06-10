import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link as RouterLink, useLocation } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Divider,
  Grid,
  Button,
  Tabs,
  Tab,
  Paper,
  Chip,
  IconButton,
  CircularProgress,
  Breadcrumbs,
  Link,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Female as FemaleIcon,
  Male as MaleIcon,
  LocalDrink as MilkIcon,
  Favorite as ReproductionIcon,
  LocalHospital as HealthIcon,
  FamilyRestroom as FamilyIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { Animal } from '../../services/animalService';
import animalService from '../../services/animalService';
import { useAuth } from '../../context/AuthContext';
import TabPanel from '../../components/common/TabPanel';
import ProduccionTab from '../../components/animales/tabs/ProduccionTab';
import SaludTab from '../../components/animales/tabs/SaludTab';
// Reproducción tab eliminada
import ArbolGenealogicoTab from '../../components/animales/tabs/ArbolGenealogicoTab';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const AnimalDetallePage: React.FC = () => {
  const { id: idParam } = useParams<{ id: string }>();
  const id = idParam ?? ''; // Provide a default empty string if undefined
  const navigate = useNavigate();
  const location = useLocation();
  const { hasRole } = useAuth();
  const isAdmin = hasRole('Administrador');
  
  const [loading, setLoading] = useState<boolean>(true);
  const [animal, setAnimal] = useState<Animal | null>(null);
  const [tabValue, setTabValue] = useState<number>(0);
  const [error, setError] = useState<string>('');

  // Cargar datos del animal
  const fetchAnimal = async () => {
    if (!id) {
      setError('ID de animal no válido');
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const animalId = parseInt(id, 10);
      if (isNaN(animalId)) {
        throw new Error('ID de animal no válido');
      }
      const data = await animalService.getAnimalById(animalId);
      setAnimal(data);
    } catch (err) {
      console.error('Error al cargar el animal:', err);
      setError('No se pudo cargar la información del animal');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnimal();
  }, [id]);

  // Leer el parámetro tab de la URL cuando se carga la página
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tabParam = searchParams.get('tab');
    if (tabParam !== null) {
      const tabIndex = parseInt(tabParam, 10);
      if (!isNaN(tabIndex) && tabIndex >= 0 && tabIndex <= 3) { // Asegurarse que el índice es válido
        setTabValue(tabIndex);
      }
    }
  }, [location.search]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const getEdad = (fechaNacimiento: string) => {
    const nacimiento = new Date(fechaNacimiento);
    const hoy = new Date();
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }
    
    return `${edad} ${edad === 1 ? 'año' : 'años'}`;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error || !animal || !id) {
    return (
      <Box textAlign="center" p={4}>
        <Typography color="error">
          {!id ? 'ID de animal no válido' : error || 'No se pudo cargar la información del animal'}
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(-1)}
          sx={{ mt: 2 }}
        >
          Volver
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      {/* Breadcrumbs */}
      <Box mb={3}>
        <Breadcrumbs aria-label="breadcrumb">
          <Link component={RouterLink} to="/animales" color="inherit">
            Animales
          </Link>
          <Typography color="text.primary">
            {animal.nombre || `ID: ${id}`}
          </Typography>
        </Breadcrumbs>
      </Box>

      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={3}>
        <Box>
          <Box display="flex" alignItems="center">
            <IconButton onClick={() => navigate(-1)} sx={{ mr: 1 }}>
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h4" component="h1">
              {animal.nombre || `Animal #${id}`}
            </Typography>
            <Chip 
              label={animal.activo ? 'Activo' : 'Inactivo'} 
              color={animal.activo ? 'success' : 'default'}
              size="small" 
              sx={{ ml: 2 }}
            />
          </Box>
          
          <Box mt={1}>
            <Typography variant="subtitle1" color="text.secondary">
              {animal.razaNombre || 'Raza no especificada'}
            </Typography>
            <Box display="flex" mt={1}>
              <Chip 
                icon={animal.sexo === 'H' ? <FemaleIcon /> : <MaleIcon />}
                label={animal.sexo === 'H' ? 'Hembra' : 'Macho'} 
                size="small" 
                variant="outlined"
                sx={{ mr: 1 }}
              />
              <Chip 
                label={`ID: ${animal.numeroIdentificacion}`}
                size="small"
                variant="outlined"
                sx={{ mr: 1 }}
              />
              <Chip 
                label={`Edad: ${getEdad(animal.fechaNacimiento)}`}
                size="small"
                variant="outlined"
              />
            </Box>
          </Box>
        </Box>
        
        <Box>
          {isAdmin && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<EditIcon />}
              onClick={() => navigate(`/animales/${id}/editar`)}
              sx={{ mr: 1, mb: 1 }}
            >
              Editar
            </Button>
          )}
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate(-1)}
          >
            Volver
          </Button>
        </Box>
      </Box>

      {/* Tabs */}
      <Card sx={{ mt: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            aria-label="pestañas de información del animal"
          >
            <Tab icon={<InfoIcon />} label="Información" />
            <Tab icon={<MilkIcon />} label="Producción" />
            <Tab icon={<HealthIcon />} label="Salud" />
            <Tab icon={<FamilyIcon />} label="Árbol Genealógico" />
          </Tabs>
        </Box>
        
        <CardContent>
          {/* Information Tab */}
          <TabPanel value={tabValue} index={0}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3, height: '100%' }}>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    <InfoIcon color="primary" sx={{ mr: 1 }} />
                    Datos Generales
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="subtitle2" color="text.secondary">N° Identificación:</Typography>
                      <Typography variant="body1">{animal.numeroIdentificacion}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="subtitle2" color="text.secondary">Raza:</Typography>
                      <Typography variant="body1">{animal.razaNombre || 'No especificada'}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="subtitle2" color="text.secondary">Fecha de Nacimiento:</Typography>
                      <Typography variant="body1">
                        {format(new Date(animal.fechaNacimiento), 'PP', { locale: es })}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="subtitle2" color="text.secondary">Edad:</Typography>
                      <Typography variant="body1">{getEdad(animal.fechaNacimiento)}</Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="text.secondary">Estado:</Typography>
                      <Chip 
                        label={animal.activo ? 'Activo' : 'Inactivo'} 
                        color={animal.activo ? 'success' : 'error'} 
                        size="small" 
                      />
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3, height: '100%' }}>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    <FamilyIcon color="primary" sx={{ mr: 1 }} />
                    Genealogía
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="text.secondary">Padre:</Typography>
                      {animal.padreId ? (
                        <Link 
                          component={RouterLink} 
                          to={`/animales/${animal.padreId}`}
                          sx={{ display: 'flex', alignItems: 'center' }}
                        >
                          <MaleIcon color="primary" sx={{ mr: 1 }} />
                          {animal.padreNombre || `ID: ${animal.padreId}`}
                        </Link>
                      ) : (
                        <Typography variant="body1" color="text.secondary">No especificado</Typography>
                      )}
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="text.secondary">Madre:</Typography>
                      {animal.madreId ? (
                        <Link 
                          component={RouterLink} 
                          to={`/animales/${animal.madreId}`}
                          sx={{ display: 'flex', alignItems: 'center' }}
                        >
                          <FemaleIcon color="secondary" sx={{ mr: 1 }} />
                          {animal.madreNombre || `ID: ${animal.madreId}`}
                        </Link>
                      ) : (
                        <Typography variant="body1" color="text.secondary">No especificada</Typography>
                      )}
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>
            </Grid>
          </TabPanel>

          {/* Production Tab */}
          <TabPanel value={tabValue} index={1}>
            <ProduccionTab animalId={parseInt(id, 10)} />
          </TabPanel>

          {/* Health Tab */}
          <TabPanel value={tabValue} index={2}>
            <SaludTab animalId={parseInt(id, 10)} />
          </TabPanel>

          {/* Genealogy Tab */}
          <TabPanel value={tabValue} index={3}>
            <ArbolGenealogicoTab animalId={parseInt(id, 10)} />
          </TabPanel>

         
        </CardContent>
      </Card>
    </Box>
  );
};

export default AnimalDetallePage;
