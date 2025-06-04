import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link as RouterLink } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  FormControlLabel,
  Switch,
  Typography,
  CircularProgress,
  Breadcrumbs,
  Link,
  Paper,
  Alert,
} from '@mui/material';
import {
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
  Pets as PetsIcon,
  Female as FemaleIcon,
  Male as MaleIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { es } from 'date-fns/locale';
import { Animal, AnimalCreateDto, AnimalUpdateDto } from '../../services/animalService';
import animalService from '../../services/animalService';
import { useAuth } from '../../context/AuthContext';

// Define form data type with string IDs for form handling
interface AnimalFormData {
  nombre: string;
  numeroIdentificacion: string;
  fechaNacimiento: string;
  sexo: 'M' | 'H';
  estado: string;
  razaId: string;  // string in form, will be converted to number on submit
  padreId: string; // string in form, will be converted to number on submit
  madreId: string; // string in form, will be converted to number on submit
  observaciones?: string;
  activo: boolean;
}

const AnimalFormPage: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const isAdmin = hasRole('Administrador');
  
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [razas, setRazas] = useState<Array<{ id: number; nombre: string }>>([
    { id: 1, nombre: 'Holstein' },
    { id: 2, nombre: 'Jersey' },
    { id: 3, nombre: 'Angus' },
  ]);
  
  const [animales, setAnimales] = useState<Array<{ id: number; nombre: string; sexo: string }>>([
    { id: 1, nombre: 'Toro 1', sexo: 'M' },
    { id: 2, nombre: 'Vaca 1', sexo: 'H' },
  ]);
  
  // Function to load razas for the dropdown
  const loadRazas = async () => {
    try {
      // Replace with actual API call to get razas
      // const response = await someService.getRazas();
      // setRazas(response.data);
    } catch (error) {
      console.error('Error loading razas:', error);
    }
  };
  
  // Function to load animales for parent selection
  const loadAnimales = async () => {
    try {
      // Replace with actual API call to get animales
      // const response = await animalService.getAnimales();
      // setAnimales(response.data);
    } catch (error) {
      console.error('Error loading animales:', error);
    }
  };
  
  useEffect(() => {
    loadRazas();
    loadAnimales();
  }, []);

  // Esquema de validación con Yup
  const validationSchema = Yup.object({
    nombre: Yup.string().required('El nombre es requerido'),
    numeroIdentificacion: Yup.string().required('El número de identificación es requerido'),
    fechaNacimiento: Yup.date()
      .required('La fecha de nacimiento es requerida')
      .max(new Date(), 'La fecha no puede ser futura'),
    sexo: Yup.string().required('El sexo es requerido'),
    estado: Yup.string().required('El estado es requerido'),
    razaId: Yup.string().required('La raza es requerida'),
    padreId: Yup.string(),
    madreId: Yup.string(),
    observaciones: Yup.string(),
    activo: Yup.boolean().default(true),
  });

  // Inicializar formulario con Formik
  const formik = useFormik<AnimalFormData>({
    initialValues: {
      nombre: '',
      numeroIdentificacion: '',
      fechaNacimiento: new Date().toISOString().split('T')[0], // Format as YYYY-MM-DD
      sexo: 'M',
      estado: 'Activo',
      razaId: '', // Changed to string to match AnimalFormData type
      padreId: '',
      madreId: '',
      observaciones: '',
      activo: true,
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        setSaving(true);
        setError('');
        
        if (isEditMode && id) {
          // Update existing animal
          const updateData: AnimalUpdateDto = {
            id: parseInt(id, 10),
            nombre: values.nombre,
            numeroIdentificacion: values.numeroIdentificacion,
            fechaNacimiento: values.fechaNacimiento,
            sexo: values.sexo,
            estado: values.estado,
            razaId: parseInt(values.razaId, 10),
            padreId: values.padreId ? parseInt(values.padreId, 10) : null,
            madreId: values.madreId ? parseInt(values.madreId, 10) : null,
            observaciones: values.observaciones,
            activo: values.activo
          };
          await animalService.updateAnimal(updateData.id, updateData);
        } else {
          // Create new animal
          const createData: AnimalCreateDto = {
            nombre: values.nombre,
            numeroIdentificacion: values.numeroIdentificacion,
            fechaNacimiento: values.fechaNacimiento,
            sexo: values.sexo,
            estado: values.estado,
            razaId: parseInt(values.razaId, 10),
            padreId: values.padreId ? parseInt(values.padreId, 10) : undefined,
            madreId: values.madreId ? parseInt(values.madreId, 10) : undefined,
            observaciones: values.observaciones,
            activo: true // New animals are active by default
          };
          await animalService.createAnimal(createData);
        }
        
        navigate('/animales', {
          state: { 
            message: isEditMode 
              ? 'Animal actualizado correctamente' 
              : 'Animal creado correctamente',
            severity: 'success'
          }
        });
      } catch (err) {
        console.error('Error al guardar el animal:', err);
        setError('Ocurrió un error al guardar el animal. Por favor, inténtelo de nuevo.');
      } finally {
        setSaving(false);
      }
    },
  });

  // Cargar datos iniciales
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Usar datos de muestra para razas (ya inicializado en el estado)
        // Si necesitas cargar las razas desde la API, implementa el endpoint correspondiente
        
        // Cargar animales para selección de padres
        const animalesResponse = await animalService.getAnimales(1, 1000); // Ajustar paginación según sea necesario
        setAnimales(animalesResponse.items || []);
        
        // Si es modo edición, cargar los datos del animal
        if (isEditMode && id) {
          const animal = await animalService.getAnimalById(parseInt(id, 10));
          // Convert the date to YYYY-MM-DD format for the date input
          const fechaNacimiento = new Date(animal.fechaNacimiento);
          const formattedDate = fechaNacimiento.toISOString().split('T')[0];
          
          formik.setValues({
            nombre: animal.nombre,
            numeroIdentificacion: animal.numeroIdentificacion,
            fechaNacimiento: formattedDate,
            sexo: animal.sexo,
            estado: animal.estado || 'Activo',
            razaId: animal.razaId.toString(),
            padreId: animal.padreId?.toString() || '',
            madreId: animal.madreId?.toString() || '',
            observaciones: animal.observaciones || '',
            activo: animal.activo,
          });
        }
      } catch (err) {
        console.error('Error al cargar datos:', err);
        setError('Error al cargar los datos necesarios. Por favor, recargue la página.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id, isEditMode]);

  // Filtrar animales por sexo para los selectores de padre/madre
  const machos = animales.filter(a => a.sexo === 'M');
  const hembras = animales.filter(a => a.sexo === 'H');

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Migas de pan */}
      <Box mb={3}>
        <Breadcrumbs aria-label="breadcrumb">
          <Link component={RouterLink} to="/animales" color="inherit">
            Animales
          </Link>
          <Typography color="text.primary">
            {isEditMode ? 'Editar Animal' : 'Nuevo Animal'}
          </Typography>
        </Breadcrumbs>
      </Box>

      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          {isEditMode ? 'Editar Animal' : 'Nuevo Animal'}
        </Typography>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          component={RouterLink}
          to="/animales"
        >
          Volver
        </Button>
      </Box>

      <Card>
        <CardHeader 
          title="Información Básica" 
          titleTypographyProps={{ variant: 'h6' }}
        />
        <Divider />
        <CardContent>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}
          
          <form onSubmit={formik.handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  id="nombre"
                  name="nombre"
                  label="Nombre del Animal"
                  value={formik.values.nombre}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.nombre && Boolean(formik.errors.nombre)}
                  helperText={formik.touched.nombre && formik.errors.nombre}
                  disabled={saving}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  id="numeroIdentificacion"
                  name="numeroIdentificacion"
                  label="Número de Identificación"
                  value={formik.values.numeroIdentificacion}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.numeroIdentificacion && Boolean(formik.errors.numeroIdentificacion)}
                  helperText={formik.touched.numeroIdentificacion && formik.errors.numeroIdentificacion}
                  disabled={saving || isEditMode}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth error={formik.touched.estado && Boolean(formik.errors.estado)}>
                  <InputLabel id="estado-label">Estado</InputLabel>
                  <Select
                    labelId="estado-label"
                    id="estado"
                    name="estado"
                    value={formik.values.estado}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    label="Estado"
                    disabled={saving}
                  >
                    <MenuItem value="Activo">Activo</MenuItem>
                    <MenuItem value="Vendido">Vendido</MenuItem>
                    <MenuItem value="Muerto">Muerto</MenuItem>
                    <MenuItem value="Enfermo">Enfermo</MenuItem>
                  </Select>
                  {formik.touched.estado && formik.errors.estado && (
                    <FormHelperText>{formik.errors.estado}</FormHelperText>
                  )}
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
                  <DatePicker
                    label="Fecha de Nacimiento"
                    value={formik.values.fechaNacimiento ? new Date(formik.values.fechaNacimiento) : null}
                    onChange={(date: Date | null) => {
                      const dateString = date ? date.toISOString().split('T')[0] : '';
                      formik.setFieldValue('fechaNacimiento', dateString);
                    }}
                    maxDate={new Date()}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        error: formik.touched.fechaNacimiento && Boolean(formik.errors.fechaNacimiento),
                        helperText: formik.touched.fechaNacimiento && formik.errors.fechaNacimiento,
                        disabled: saving
                      }
                    }}
                  />
                </LocalizationProvider>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth error={formik.touched.sexo && Boolean(formik.errors.sexo)}>
                  <InputLabel id="sexo-label">Sexo</InputLabel>
                  <Select
                    labelId="sexo-label"
                    id="sexo"
                    name="sexo"
                    value={formik.values.sexo}
                    label="Sexo"
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    disabled={saving || isEditMode}
                    startAdornment={
                      formik.values.sexo === 'H' ? 
                        <FemaleIcon color="secondary" sx={{ mr: 1 }} /> : 
                        <MaleIcon color="primary" sx={{ mr: 1 }} />
                    }
                  >
                    <MenuItem value="M">Macho</MenuItem>
                    <MenuItem value="H">Hembra</MenuItem>
                  </Select>
                  {formik.touched.sexo && formik.errors.sexo && (
                    <FormHelperText>{formik.errors.sexo}</FormHelperText>
                  )}
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth error={formik.touched.razaId && Boolean(formik.errors.razaId)}>
                  <InputLabel id="raza-label">Raza</InputLabel>
                  <Select
                    labelId="raza-label"
                    id="razaId"
                    name="razaId"
                    value={formik.values.razaId}
                    label="Raza"
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    disabled={saving}
                  >
                    {razas.map((raza) => (
                      <MenuItem key={raza.id} value={raza.id.toString()}>
                        {raza.nombre}
                      </MenuItem>
                    ))}
                  </Select>
                  {formik.touched.razaId && formik.errors.razaId && (
                    <FormHelperText>{formik.errors.razaId}</FormHelperText>
                  )}
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel id="padre-label">Padre (Opcional)</InputLabel>
                  <Select
                    labelId="padre-label"
                    id="padreId"
                    name="padreId"
                    value={formik.values.padreId}
                    label="Padre (Opcional)"
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    disabled={saving}
                  >
                    <MenuItem value="">
                      <em>No especificado</em>
                    </MenuItem>
                    {machos.map((animal) => (
                      <MenuItem key={animal.id} value={animal.id.toString()}>
                        {animal.nombre}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel id="madre-label">Madre (Opcional)</InputLabel>
                  <Select
                    labelId="madre-label"
                    id="madreId"
                    name="madreId"
                    value={formik.values.madreId}
                    label="Madre (Opcional)"
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    disabled={saving}
                  >
                    <MenuItem value="">
                      <em>No especificada</em>
                    </MenuItem>
                    {hembras.map((animal) => (
                      <MenuItem key={animal.id} value={animal.id.toString()}>
                        {animal.nombre}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  id="observaciones"
                  name="observaciones"
                  label="Observaciones"
                  multiline
                  rows={4}
                  value={formik.values.observaciones}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  disabled={saving}
                />
              </Grid>
              
              {isEditMode && (
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formik.values.activo}
                        onChange={(e) => formik.setFieldValue('activo', e.target.checked)}
                        disabled={!isAdmin || saving}
                        color="primary"
                      />
                    }
                    label={
                      <Typography color={formik.values.activo ? 'primary.main' : 'text.secondary'}>
                        {formik.values.activo ? 'Activo' : 'Inactivo'}
                      </Typography>
                    }
                  />
                </Grid>
              )}
              
              <Grid item xs={12}>
                <Box display="flex" justifyContent="flex-end" mt={2}>
                  <Button
                    variant="outlined"
                    color="secondary"
                    onClick={() => navigate('/animales')}
                    sx={{ mr: 2 }}
                    disabled={saving}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                    disabled={saving || !formik.isValid || !formik.dirty}
                  >
                    {saving ? 'Guardando...' : 'Guardar'}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};

export default AnimalFormPage;
