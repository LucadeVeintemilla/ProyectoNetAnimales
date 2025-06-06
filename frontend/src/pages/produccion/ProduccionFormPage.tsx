import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Grid,
  MenuItem,
  TextField,
  Typography,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  SelectChangeEvent,
  FormHelperText,
  Paper,
  Alert,
  AlertTitle,
  Chip,
  Tooltip,
} from '@mui/material';
import {
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
  CalendarMonth as CalendarIcon,
  LocalDining as FoodIcon,
  Info as InfoIcon,
  Female as FemaleIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, parseISO, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { useFormik } from 'formik';
import * as Yup from 'yup';

import { produccionService } from '../../services/produccionService';
import { reproduccionService } from '../../services/reproduccionService';
import type { 
  ProduccionLeche, 
  ProduccionLecheCreateDto, 
  ProduccionLecheUpdateDto,
} from '../../services/produccionService';
import type { Animal } from '../../services/animalService';
import { useAuth } from '../../context/AuthContext';

// Esquema de validación con Yup
const validationSchema = Yup.object({
  animalId: Yup.number().required('La hembra es requerida'),
  fecha: Yup.date()
    .required('La fecha es requerida')
    .max(new Date(), 'La fecha no puede ser futura'),
  cantidadLitros: Yup.number()
    .required('La cantidad de litros es requerida')
    .min(0.1, 'La cantidad debe ser mayor a 0')
    .max(1000, 'La cantidad no puede ser mayor a 1000 litros'),
  turno: Yup.string()
    .oneOf(['Mañana', 'Tarde', 'Noche'], 'Turno inválido')
    .required('El turno es requerido'),
  observaciones: Yup.string().max(500, 'Máximo 500 caracteres'),
});

const ProduccionFormPage: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [animales, setAnimales] = useState<Animal[]>([]);
  const [validacionInfo, setValidacionInfo] = useState<Record<number, {elegible: boolean; mensaje?: string}>>({});
  
  const formik = useFormik<{
    id: number;
    animalId: number;
    fecha: Date;
    cantidadLitros: number;
    turno: 'Mañana' | 'Tarde' | 'Noche';
    observaciones: string;
  }>({
    initialValues: {
      id: 0,
      animalId: 0,
      fecha: new Date(),
      cantidadLitros: 0,
      turno: 'Mañana' as const,
      observaciones: '',
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        setSaving(true);
        setError(null);
        setSuccess(null);

        if (id) {
          // Actualizar registro existente
          const produccionUpdateData: ProduccionLecheUpdateDto = {
            id: parseInt(id), // Incluir el ID para que coincida con el parámetro de la URL
            animalId: values.animalId,
            fecha: values.fecha.toISOString().split('T')[0], // Convert Date to YYYY-MM-DD string
            cantidadLitros: values.cantidadLitros,
            turno: values.turno,
            observaciones: values.observaciones,
          };
          await produccionService.update(parseInt(id), produccionUpdateData);
          setSuccess('Registro de producción actualizado correctamente');
        } else {
          // Crear nuevo registro
          const produccionCreateData: ProduccionLecheCreateDto = {
            animalId: values.animalId,
            fecha: values.fecha.toISOString().split('T')[0], // Convert Date to YYYY-MM-DD string
            cantidadLitros: values.cantidadLitros,
            turno: values.turno,
            observaciones: values.observaciones,
          };
          await produccionService.create(produccionCreateData);
          setSuccess('Registro de producción creado correctamente');
          formik.resetForm();
        }

        // Redirigir después de 2 segundos
        setTimeout(() => {
          navigate('/produccion');
        }, 2000);
      } catch (err) {
        console.error('Error al guardar el registro de producción:', err);
        setError('Error al guardar el registro. Por favor, intente nuevamente.');
      } finally {
        setSaving(false);
      }
    },
  });

  // Cargar datos iniciales para edición
  useEffect(() => {
    const loadData = async () => {
      if (!id) return;

      try {
        setLoading(true);
        
        // Cargar el registro de producción
        const produccion = await produccionService.getById(parseInt(id));
        
        if (produccion) {
          formik.setValues({
            id: produccion.id || 0,
            animalId: produccion.animalId,
            fecha: new Date(produccion.fecha),
            cantidadLitros: parseFloat(produccion.cantidadLitros.toString()),
            turno: produccion.turno || 'Mañana',
            observaciones: produccion.observaciones || '',
          });
          
          // En modo edición, validamos el animal seleccionado
          // Pero no impedimos la edición aunque no sea elegible actualmente
          try {
            const esElegible = await produccionService.esAnimalElegibleParaProduccion(produccion.animalId);
            setValidacionInfo(prev => ({
              ...prev,
              [produccion.animalId]: { 
                elegible: true, // Permitimos la edición de registros existentes aunque ya no sea elegible
                mensaje: !esElegible ? 'Este animal ya no es elegible para nuevos registros, pero puede editar este registro existente.' : undefined 
              }
            }));
          } catch (validationErr) {
            console.error('Error al validar el animal:', validationErr);
          }
        }
      } catch (err) {
        console.error('Error al cargar el registro de producción:', err);
        setError('Error al cargar el registro de producción');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id]);

  // Cargar lista de animales (vacas en producción)
  useEffect(() => {
    const loadAnimales = async () => {
      try {
        setLoading(true);
        
        // Obtenemos solo las hembras elegibles para producción
        const data = await produccionService.getAnimalesEnProduccion();
        
        // Aseguramos que los datos tengan el formato correcto según la interfaz Animal
        const animalesFormateados = data.map((animal: any) => ({
          id: animal.id,
          nombre: animal.nombre || `Animal ${animal.id}`,
          numeroIdentificacion: animal.numeroIdentificacion || `ID ${animal.id}`,
          fechaNacimiento: animal.fechaNacimiento || new Date().toISOString(),
          sexo: animal.sexo === 'M' || animal.sexo === 'H' ? animal.sexo : 'H',
          estado: animal.estado || 'Activo',
          razaId: animal.razaId || 0,
          activo: animal.activo ?? true,
          // Campos opcionales con valores por defecto
          razaNombre: animal.razaNombre,
          padreId: animal.padreId,
          padreNombre: animal.padreNombre,
          madreId: animal.madreId,
          madreNombre: animal.madreNombre,
          observaciones: animal.observaciones,
          // Campo adicional específico de esta vista
          enProduccion: true
        }));
        setAnimales(animalesFormateados);
        
        // Para cada animal, verificamos y guardamos su elegibilidad
        const validaciones: {[key: number]: {elegible: boolean, mensaje?: string}} = {};
        
        // Primero verificamos que sean hembras
        animalesFormateados.forEach(animal => {
          if (animal.sexo !== 'H') {
            validaciones[animal.id] = { 
              elegible: false, 
              mensaje: 'Solo las hembras pueden producir leche.'
            };
          }
        });
        
        // Después verificamos la fecha de parto para cada una
        for (const animal of animalesFormateados) {
          if (animal.sexo === 'H' && !validaciones[animal.id]) {
            try {
              // Obtenemos el historial reproductivo para verificar la fecha de último parto
              const historial = await reproduccionService.getHistorialReproductivo(animal.id);
              
              // Buscamos la fecha del último parto
              let ultimoPartoFecha: Date | null = null;
              
              for (const evento of historial) {
                if (evento.fechaPartoReal) {
                  const fechaParto = new Date(evento.fechaPartoReal);
                  if (!ultimoPartoFecha || fechaParto > ultimoPartoFecha) {
                    ultimoPartoFecha = fechaParto;
                  }
                }
              }
              
              // Si hay fecha de parto, verificamos que hayan pasado al menos 2 días
              if (ultimoPartoFecha) {
                const hoy = new Date();
                const tiempoTranscurrido = hoy.getTime() - ultimoPartoFecha.getTime();
                const diasTranscurridos = Math.floor(tiempoTranscurrido / (1000 * 3600 * 24));
                
                if (diasTranscurridos < 2) {
                  validaciones[animal.id] = { 
                    elegible: false, 
                    mensaje: `Deben pasar al menos 2 días después del parto (ocurrido el ${format(ultimoPartoFecha, 'dd/MM/yyyy')}) para registrar producción.`
                  };
                } else {
                  validaciones[animal.id] = { elegible: true };
                }
              } else {
                validaciones[animal.id] = { elegible: true };
              }
            } catch (err) {
              console.error(`Error al verificar elegibilidad del animal ${animal.id}:`, err);
              validaciones[animal.id] = { 
                elegible: false, 
                mensaje: 'Error al verificar elegibilidad. Contacte al administrador.'
              };
            }
          }
        }
        
        setValidacionInfo(validaciones);
        
      } catch (err) {
        console.error('Error al cargar los animales:', err);
        setError('Error al cargar los animales. Por favor, intente nuevamente.');
      } finally {
        setLoading(false);
      }
    };

    loadAnimales();
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 4, mb: 4 }}>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate('/produccion')}
        sx={{ mb: 2 }}
      >
        Volver al listado
      </Button>

      <Card>
        <CardHeader
          title={id ? 'Editar Registro de Producción' : 'Nuevo Registro de Producción'}
          titleTypographyProps={{ variant: 'h4' }}
        />
        <Divider />
        <CardContent>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              <AlertTitle>Error</AlertTitle>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 3 }}>
              <AlertTitle>Éxito</AlertTitle>
              {success}
            </Alert>
          )}

          <form onSubmit={formik.handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth error={formik.touched.animalId && (Boolean(formik.errors.animalId) || (formik.values.animalId > 0 && validacionInfo[formik.values.animalId]?.elegible === false))}>
                  <InputLabel id="animal-label">Animal</InputLabel>
                  <Select
                    labelId="animal-label"
                    id="animalId"
                    name="animalId"
                    value={formik.values.animalId}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    label="Animal"
                    disabled={saving || !!id}
                  >
                    <MenuItem value={0} disabled>
                      Seleccione un animal
                    </MenuItem>
                    {animales
                      // Filtramos para mostrar solo los animales elegibles (sexo H y +2 días después del parto)
                      .filter(animal => {
                        if (typeof animal.id !== 'number') return false;
                        return validacionInfo[animal.id]?.elegible === true || animal.sexo === 'H';
                      })
                      .map((animal) => {
                        // Asegurar que id siempre sea un número válido para el índice
                        const animalId = typeof animal.id === 'number' ? animal.id : -1;
                        const isDisabled = validacionInfo[animalId]?.elegible === false;
                        
                        return (
                          <MenuItem 
                            key={animalId} 
                            value={animalId}
                            disabled={isDisabled}
                          >
                            {animal.numeroIdentificacion} - {animal.nombre || 'Sin nombre'}
                            {isDisabled && " (No disponible)"}
                          </MenuItem>
                        );
                      })}
                  </Select>
                  {formik.touched.animalId && formik.errors.animalId && (
                    <FormHelperText>{formik.errors.animalId}</FormHelperText>
                  )}
                  {formik.touched.animalId && formik.values.animalId > 0 && validacionInfo[formik.values.animalId]?.elegible === false && (
                    <FormHelperText error>
                      {validacionInfo[formik.values.animalId]?.mensaje || 'Este animal no está disponible para registro de producción'}
                    </FormHelperText>
                  )}
                </FormControl>
                
                <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 1 }}>
                  Solo se muestran hembras elegibles para producción de leche (después de 2 días del parto).
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
                  <DatePicker
                    label="Fecha de ordeño"
                    value={formik.values.fecha}
                    onChange={(date) => formik.setFieldValue('fecha', date || new Date())}
                    format="dd/MM/yyyy"
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        error: formik.touched.fecha && Boolean(formik.errors.fecha),
                        helperText: formik.touched.fecha && formik.errors.fecha as React.ReactNode,
                        onBlur: formik.handleBlur,
                      },
                    }}
                    disabled={saving}
                  />
                </LocalizationProvider>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  id="cantidadLitros"
                  name="cantidadLitros"
                  label="Cantidad (litros)"
                  type="number"
                  inputProps={{
                    step: '0.1',
                    min: '0.1',
                    max: '1000',
                  }}
                  value={formik.values.cantidadLitros}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.cantidadLitros && Boolean(formik.errors.cantidadLitros)}
                  helperText={formik.touched.cantidadLitros && formik.errors.cantidadLitros}
                  disabled={saving}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth error={formik.touched.turno && Boolean(formik.errors.turno)}>
                  <InputLabel id="turno-label">Turno</InputLabel>
                  <Select
                    labelId="turno-label"
                    id="turno"
                    name="turno"
                    value={formik.values.turno}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    label="Turno"
                    disabled={saving}
                  >
                    <MenuItem value="Mañana">Mañana</MenuItem>
                    <MenuItem value="Tarde">Tarde</MenuItem>
                    <MenuItem value="Noche">Noche</MenuItem>
                  </Select>
                  {formik.touched.turno && formik.errors.turno && (
                    <FormHelperText>{formik.errors.turno}</FormHelperText>
                  )}
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  id="observaciones"
                  name="observaciones"
                  label="Observaciones"
                  multiline
                  rows={3}
                  value={formik.values.observaciones}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.observaciones && Boolean(formik.errors.observaciones)}
                  helperText={formik.touched.observaciones && formik.errors.observaciones}
                  disabled={saving}
                />
              </Grid>

              <Grid item xs={12} sx={{ mt: 2 }}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
                  disabled={saving}
                >
                  {saving ? 'Guardando...' : 'Guardar'}
                </Button>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ProduccionFormPage;
