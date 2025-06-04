import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSnackbar } from 'notistack';
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
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Paper,
  Alert,
  AlertTitle,
} from '@mui/material';
import {
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
  CalendarMonth as CalendarIcon,
  Female as FemaleIcon,
  Male as MaleIcon,
  PregnantWoman as PregnantWomanIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { useFormik } from 'formik';
import * as Yup from 'yup';

import reproduccionService, { 
  Reproduccion, 
  ReproduccionCreateDto, 
  ReproduccionUpdateDto,
} from '../../services/reproduccionService';
import animalService, { Animal } from '../../services/animalService';
import { useAuth } from '../../context/AuthContext';

// Esquema de validación para el registro de reproducción
const reproduccionSchema = Yup.object({
  HembraId: Yup.number().required('La hembra es requerida').positive('Seleccione una hembra'),
  MachoId: Yup.number().when('TipoEvento', {
    is: 'natural',
    then: (schema) => schema.required('El macho es requerido para monta natural').positive('Seleccione un macho'),
    otherwise: (schema) => schema.notRequired(),
  }),
  TipoEvento: Yup.string()
    .oneOf(['natural', 'inseminacion', 'trasplante'], 'Tipo de monta inválido')
    .required('El tipo de monta es requerido'),
  Fecha: Yup.date()
    .required('La fecha de monta es requerida')
    .max(new Date(), 'La fecha no puede ser futura'),
  FechaConfirmacionPrenez: Yup.date()
    .min(Yup.ref('Fecha'), 'La fecha de confirmación debe ser posterior a la fecha de monta')
    .max(new Date(), 'La fecha no puede ser futura')
    .nullable(),
  FechaProbableParto: Yup.date()
    .min(Yup.ref('Fecha'), 'La fecha estimada de parto debe ser posterior a la fecha de monta')
    .nullable(),
  FechaRealParto: Yup.date()
    .min(Yup.ref('Fecha'), 'La fecha de parto debe ser posterior a la fecha de monta')
    .max(new Date(), 'La fecha de parto no puede ser futura')
    .nullable(),
  Resultado: Yup.string()
    .oneOf(['preñada', 'no_preñada', 'aborto', 'parto_exitoso', 'parto_fallido'], 'Resultado inválido')
    .nullable(),
  Observaciones: Yup.string().max(500, 'Máximo 500 caracteres').nullable(),
});

const ReproduccionFormPage: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  
  // Estados
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [activeStep, setActiveStep] = useState<number>(0);
  const [hembras, setHembras] = useState<Animal[]>([]);
  const [machos, setMachos] = useState<Animal[]>([]);
  const [loadingAnimales, setLoadingAnimales] = useState<boolean>(true);
  const [hembraSeleccionada, setHembraSeleccionada] = useState<{ id: number; nombre: string } | null>(null);
  const [machoSeleccionado, setMachoSeleccionado] = useState<{ id: number; nombre: string } | null>(null);
  const [loadingTimeout, setLoadingTimeout] = useState<boolean>(false);

  const isEditing = Boolean(id);
  const pageTitle = isEditing ? 'Editar Registro de Reproducción' : 'Nuevo Registro de Reproducción';
  const steps = ['Datos de la Monta', 'Seguimiento', 'Registro de Crías'];

  // Inicializar formulario con valores por defecto
  const formik = useFormik<ReproduccionCreateDto>({
    initialValues: {
      Id: undefined,
      HembraId: 0,
      MachoId: null,
      TipoEvento: 'natural',
      Fecha: format(new Date(), 'yyyy-MM-dd'),
      FechaConfirmacionPrenez: null,
      FechaProbableParto: null,
      FechaRealParto: null,
      Resultado: null,
      Observaciones: null
    },
    validationSchema: reproduccionSchema,
    onSubmit: async (values) => {
      try {
        setSubmitting(true);
        
        // Ensure Fecha has a valid value
        if (!values.Fecha) {
          values.Fecha = format(new Date(), 'yyyy-MM-dd');
        }
        
        // Preparar los datos para enviar según el DTO del backend
        console.log('Valor de TipoEvento:', values.TipoEvento);
        
        // Asegurar que la fecha de monta tenga un valor válido
        const fechaMontaFinal = values.Fecha || format(new Date(), 'yyyy-MM-dd');
        
        // Calcular automáticamente la fecha probable de parto (283 días después de la monta)
        const fechaProbableParto = calcularFechaPartoEstimada(fechaMontaFinal);
        console.log('Fecha probable de parto calculada:', fechaProbableParto);
        
        // Preparar los datos para enviar según el DTO del backend
        const dataToSend: ReproduccionCreateDto = {
          Id: id ? Number(id) : undefined,
          HembraId: Number(values.HembraId),
          MachoId: values.TipoEvento === 'natural' && values.MachoId ? Number(values.MachoId) : null,
          TipoEvento: values.TipoEvento,
          Fecha: format(new Date(fechaMontaFinal), 'yyyy-MM-dd'),
          FechaConfirmacionPrenez: values.FechaConfirmacionPrenez ? format(new Date(values.FechaConfirmacionPrenez), 'yyyy-MM-dd') : null,
          // Siempre usar la fecha calculada de parto para garantizar que se envíe al backend
          FechaProbableParto: fechaProbableParto,
          FechaRealParto: values.FechaRealParto ? format(new Date(values.FechaRealParto), 'yyyy-MM-dd') : null,
          Resultado: values.Resultado || null,
          Observaciones: values.Observaciones || null
        };
        
        console.log('Enviando datos al servidor:', dataToSend);
        
        if (isEditing && id) {
          // Actualizar registro existente
          await reproduccionService.updateReproduccion(parseInt(id, 10), dataToSend);
          enqueueSnackbar('Registro de reproducción actualizado correctamente', { variant: 'success' });
        } else {
          // Crear nuevo registro
          await reproduccionService.createReproduccion(dataToSend);
          enqueueSnackbar('Registro de reproducción creado correctamente', { variant: 'success' });
        }
        
        navigate('/reproduccion');
      } catch (error: unknown) {
        console.error('Error al guardar el registro de reproducción:', error);
        const errorMessage = error && 
          typeof error === 'object' && 
          'response' in error && 
          error.response && 
          typeof error.response === 'object' &&
          'data' in error.response &&
          error.response.data &&
          typeof error.response.data === 'object' &&
          'message' in error.response.data &&
          typeof error.response.data.message === 'string'
            ? error.response.data.message
            : 'Error al guardar el registro de reproducción';
            
        enqueueSnackbar(errorMessage, { variant: 'error' });
      } finally {
        setSubmitting(false);
      }
    },
  });

  // Fetch function for loading initial data
  const fetchInitialData = React.useCallback(async () => {
    console.log('Iniciando fetchData para ReproduccionFormPage');
    let didCancel = false;
    
    try {
      setLoading(true);
      setLoadingAnimales(true);
      
      // Cargar lista de hembras (vacas) - sexo 'H' y activas
      const hembrasResponse = await animalService.getAnimales(1, 1000, '', 'activos');
      if (!didCancel) {
        const hembrasFiltradas = hembrasResponse.items.filter((animal: Animal) => animal.sexo === 'H');
        setHembras(hembrasFiltradas);
      }
      
      // Cargar lista de machos (toros) - sexo 'M' y activos
      const machosResponse = await animalService.getAnimales(1, 1000, '', 'activos');
      if (!didCancel) {
        const machosFiltrados = machosResponse.items.filter((animal: Animal) => animal.sexo === 'M');
        setMachos(machosFiltrados);
      }
      
      setLoadingAnimales(false);
      
      // Si es edición, cargar los datos del registro
      if (isEditing && id && !didCancel) {
        try {
          const data = await reproduccionService.getReproduccionById(Number(id));
          if (didCancel) return;
          
          console.log('Datos obtenidos del backend:', data);
          
          // Mapear los datos del backend al formulario - usando casting para evitar errores de TypeScript
          const dataAny = data as any; // Casting para evitar errores de TypeScript
          const formData = {
            Id: data.id,
            HembraId: data.hembraId,
            MachoId: data.machoId || 0,
            // Usar operador OR para manejar diferentes nombres de campos posibles
            TipoEvento: dataAny.tipoEvento || data.tipoMonta || '',
            Fecha: dataAny.fecha || data.fechaMonta || format(new Date(), 'yyyy-MM-dd'),
            FechaProbableParto: dataAny.fechaProbableParto || data.fechaPartoEstimada || null,
            FechaRealParto: dataAny.fechaRealParto || data.fechaPartoReal || null,
            Resultado: data.resultado || null,
            Observaciones: data.observaciones || null
          };
          console.log('Datos mapeados del backend:', formData);
          
          formik.setValues(formData, false); // false para no validar inmediatamente
          
          // Actualizar los estados de selección
          setHembraSeleccionada({ 
            id: data.hembraId, 
            nombre: data.hembraNombre || `Hembra #${data.hembraId}` 
          });
          
          if (data.machoId && data.machoNombre) {
            setMachoSeleccionado({
              id: data.machoId,
              nombre: data.machoNombre
            });
          }
        } catch (error) {
          console.error('Error al cargar los datos del registro:', error);
          enqueueSnackbar('Error al cargar los datos del registro', { variant: 'error' });
        }  
      }
    } catch (error) {
      console.error('Error al cargar los datos:', error);
      if (!didCancel) {
        enqueueSnackbar('Error al cargar los datos', { variant: 'error' });
      }
    } finally {
      if (!didCancel) {
        setLoading(false); // Asegurarse de que loading se establezca en false al terminar
      }
    }
    
    console.log('fetchData completado');
    
    return () => {
      didCancel = true;
    };
  }, [id, isEditing, enqueueSnackbar]);

  // Cargar datos iniciales
  useEffect(() => {
    const timer = setTimeout(() => {
      if (loading) {
        setLoadingTimeout(true);
        setLoading(false);
        enqueueSnackbar('Tiempo de espera agotado. Intente nuevamente o contacte al soporte.', { 
          variant: 'warning',
          autoHideDuration: 10000
        });
      }
    }, 30000); // Ampliamos a 30 segundos el timeout para dar más tiempo

    const abortController = new AbortController();
    
    fetchInitialData();
    
    return () => {
      clearTimeout(timer);
      abortController.abort();
    };
  }, [fetchInitialData]);

  // Calcular fecha estimada de parto (283 días después de la monta)
  const calcularFechaPartoEstimada = (fecha: string) => {
    const fechaObj = new Date(fecha);
    fechaObj.setDate(fechaObj.getDate() + 283); // 283 días de gestación
    return format(fechaObj, 'yyyy-MM-dd');
  };

  // Manejar cambio de fecha de monta
  const handleFechaMontaChange = (date: Date | null) => {
    if (date) {
      const fechaStr = format(date, 'yyyy-MM-dd');
      formik.setFieldValue('Fecha', fechaStr, false);
      
      // Calcular y establecer automáticamente la fecha estimada de parto (283 días después)
      const fechaParto = new Date(date);
      fechaParto.setDate(fechaParto.getDate() + 283);
      const fechaPartoStr = format(fechaParto, 'yyyy-MM-dd');
      formik.setFieldValue('FechaProbableParto', fechaPartoStr, false);
      
      // Si es una IA, establecer automáticamente la fecha de confirmación de preñez (30 días después)
      if (formik.values.TipoEvento === 'inseminacion') {
        const fechaConfirmacion = new Date(date);
        fechaConfirmacion.setDate(fechaConfirmacion.getDate() + 30);
        const fechaConfirmacionStr = format(fechaConfirmacion, 'yyyy-MM-dd');
        formik.setFieldValue('FechaConfirmacionPrenez', fechaConfirmacionStr, false);
      }
    } else {
      formik.setFieldValue('Fecha', null, false);
      formik.setFieldValue('FechaProbableParto', null, false);
      if (formik.values.TipoEvento === 'inseminacion') {
        formik.setFieldValue('FechaConfirmacionPrenez', null, false);
      }
    }
  };

  // Navegación del stepper
  const handleNext = async () => {
    // Validar paso actual antes de continuar
    let isValid = true;
    
    if (activeStep === 0) {
      // Validar datos básicos
      const errors = await formik.validateForm();
      const { FechaProbableParto, FechaRealParto, Resultado, ...requiredFields } = formik.values;
      
      // Verificar campos requeridos del paso actual
      const hasErrors = Object.keys(requiredFields).some(
        (field) => errors[field as keyof typeof errors]
      );
      
      if (hasErrors) {
        formik.setTouched({
          HembraId: true,
          TipoEvento: true,
          Fecha: true,
        });
        isValid = false;
      }
    }
    
    if (isValid) {
      setActiveStep((prevStep) => prevStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  // Formatear fechas para visualización
  const formatDate = (dateString: string) => {
    return format(parseISO(dateString), 'dd/MM/yyyy', { locale: es });
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (loadingTimeout) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <Alert severity="warning">
          <AlertTitle>Timeout</AlertTitle>
          Tiempo de espera agotado. Intente nuevamente o contacte al soporte.
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">{pageTitle}</Typography>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/reproduccion')}
        >
          Volver al listado
        </Button>
      </Box>

      <Card>
        <CardHeader 
          title="Registro de Reproducción" 
          subheader="Complete la información solicitada para registrar el evento reproductivo"
        />
        <Divider />
        <CardContent>
          <form onSubmit={formik.handleSubmit}>
            <Stepper activeStep={activeStep} orientation="vertical">
              {/* Paso 1: Datos de la Monta */}
              <Step key="datos-monta">
                <StepLabel>Datos de la Monta</StepLabel>
                <StepContent>
                  <Box sx={{ mt: 2, mb: 4, pl: 2 }}>
                    <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                      Complete la información básica del evento de monta
                    </Typography>
                    
                    <Grid container spacing={3}>
                      {/* Selección de Hembra */}
                      <Grid item xs={12} md={6}>
                        <FormControl 
                          fullWidth 
                          error={formik.touched.HembraId && Boolean(formik.errors.HembraId)}
                        >
                          <InputLabel id="hembra-label">Hembra *</InputLabel>
                          <Select
                            labelId="hembra-label"
                            id="HembraId"
                            name="HembraId"
                            value={formik.values.HembraId}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            disabled={loadingAnimales || submitting || isEditing}
                            label="Hembra *"
                            startAdornment={
                              loadingAnimales ? (
                                <Box mr={1} display="flex" alignItems="center">
                                  <CircularProgress size={20} />
                                </Box>
                              ) : null
                            }
                          >
                            <MenuItem value={0} disabled>
                              Seleccione una hembra
                            </MenuItem>
                            {hembras.map((hembra) => (
                              <MenuItem key={hembra.id} value={hembra.id}>
                                {hembra.nombre} (ID: {hembra.id})
                              </MenuItem>
                            ))}
                          </Select>
                          {formik.touched.HembraId && formik.errors.HembraId && (
                            <FormHelperText>{formik.errors.HembraId}</FormHelperText>
                          )}
                        </FormControl>
                      </Grid>

                      {/* Tipo de Monta */}
                      <Grid item xs={12} md={6}>
                        <FormControl 
                          fullWidth 
                          error={formik.touched.TipoEvento && Boolean(formik.errors.TipoEvento)}
                        >
                          <InputLabel id="tipo-evento-label">Tipo de Monta *</InputLabel>
                          <Select
                            labelId="tipo-evento-label"
                            id="TipoEvento"
                            name="TipoEvento"
                            value={formik.values.TipoEvento}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            disabled={submitting || isEditing}
                            label="Tipo de Monta *"
                          >
                            <MenuItem value="natural">Monta Natural</MenuItem>
                            <MenuItem value="inseminacion">Inseminación Artificial</MenuItem>
                            <MenuItem value="trasplante">Trasplante de Embriones</MenuItem>
                          </Select>
                          {formik.touched.TipoEvento && formik.errors.TipoEvento && (
                            <FormHelperText>{formik.errors.TipoEvento}</FormHelperText>
                          )}
                        </FormControl>
                      </Grid>

                      {/* Selección de Macho (solo para monta natural) */}
                      {formik.values.TipoEvento === 'natural' && (
                        <Grid item xs={12} md={6}>
                          <FormControl 
                            fullWidth 
                            error={formik.touched.MachoId && Boolean(formik.errors.MachoId)}
                          >
                            <InputLabel id="macho-label">Macho *</InputLabel>
                            <Select
                              labelId="macho-label"
                              id="MachoId"
                              name="MachoId"
                              value={formik.values.MachoId}
                              onChange={formik.handleChange}
                              onBlur={formik.handleBlur}
                              disabled={loadingAnimales || submitting || isEditing}
                              label="Macho *"
                            >
                              <MenuItem value={0} disabled>
                                Seleccione un macho
                              </MenuItem>
                              {machos.map((macho) => (
                                <MenuItem key={macho.id} value={macho.id}>
                                  {macho.nombre} (ID: {macho.id})
                                </MenuItem>
                              ))}
                            </Select>
                            {formik.touched.MachoId && formik.errors.MachoId && (
                              <FormHelperText>{formik.errors.MachoId}</FormHelperText>
                            )}
                          </FormControl>
                        </Grid>
                      )}

                      {/* Fecha de Monta */}
                      <Grid item xs={12} md={6}>
                        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
                          <DatePicker
                            label="Fecha de Monta *"
                            value={formik.values.Fecha ? new Date(formik.values.Fecha) : null}
                            onChange={handleFechaMontaChange}
                            disabled={submitting || isEditing}
                            slotProps={{
                              textField: {
                                fullWidth: true,
                                error: formik.touched.Fecha && Boolean(formik.errors.Fecha),
                                helperText: formik.touched.Fecha && formik.errors.Fecha,
                              },
                            }}
                            slots={{
                              openPickerIcon: CalendarIcon,
                            }}
                          />
                        </LocalizationProvider>
                      </Grid>

                      {/* Fecha Estimada de Parto */}
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          id="FechaProbableParto"
                          name="FechaProbableParto"
                          label="Fecha Estimada de Parto"
                          type="date"
                          value={formik.values.FechaProbableParto || ''}
                          onChange={formik.handleChange}
                          onBlur={formik.handleBlur}
                          error={formik.touched.FechaProbableParto && Boolean(formik.errors.FechaProbableParto)}
                          helperText={formik.touched.FechaProbableParto && formik.errors.FechaProbableParto}
                          disabled={submitting || isEditing}
                          InputLabelProps={{
                            shrink: true,
                          }}
                          InputProps={{
                            startAdornment: (
                              <CalendarIcon color="action" sx={{ mr: 1 }} />
                            ),
                          }}
                        />
                      </Grid>

                      {/* Observaciones */}
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          id="Observaciones"
                          name="Observaciones"
                          label="Observaciones"
                          multiline
                          rows={3}
                          value={formik.values.Observaciones}
                          onChange={formik.handleChange}
                          onBlur={formik.handleBlur}
                          error={formik.touched.Observaciones && Boolean(formik.errors.Observaciones)}
                          helperText={formik.touched.Observaciones && formik.errors.Observaciones}
                          disabled={submitting}
                          placeholder="Ingrese cualquier observación relevante sobre la monta..."
                        />
                      </Grid>
                    </Grid>

                    <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                      <Button
                        variant="contained"
                        onClick={handleNext}
                        disabled={submitting}
                        endIcon={<ArrowBackIcon sx={{ transform: 'rotate(180deg)' }} />}
                      >
                        Siguiente
                      </Button>
                    </Box>
                  </Box>
                </StepContent>
              </Step>

              {/* Paso 2: Seguimiento */}
              <Step key="seguimiento">
                <StepLabel>Seguimiento</StepLabel>
                <StepContent>
                  <Box sx={{ mt: 2, mb: 4, pl: 2 }}>
                    <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                      Actualice el estado del seguimiento reproductivo
                    </Typography>
                    
                    <Grid container spacing={3}>
                      {/* Resultado */}
                      <Grid item xs={12} md={6}>
                        <FormControl fullWidth>
                          <InputLabel id="resultado-label">Resultado</InputLabel>
                          <Select
                            labelId="resultado-label"
                            id="Resultado"
                            name="Resultado"
                            value={formik.values.Resultado || ''}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            disabled={submitting}
                            label="Resultado"
                          >
                            <MenuItem value="">
                              <em>Sin resultado</em>
                            </MenuItem>
                            <MenuItem value="preñada">Preñada</MenuItem>
                            <MenuItem value="no_preñada">No Preñada</MenuItem>
                            <MenuItem value="aborto">Aborto</MenuItem>
                            <MenuItem value="parto_exitoso">Parto Exitoso</MenuItem>
                            <MenuItem value="parto_fallido">Parto Fallido</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>

                      {/* Fecha de Parto Real */}
                      {(formik.values.Resultado === 'parto_exitoso' || formik.values.Resultado === 'parto_fallido') && (
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            id="FechaRealParto"
                            name="FechaRealParto"
                            label="Fecha de Parto"
                            type="date"
                            value={formik.values.FechaRealParto || ''}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            error={formik.touched.FechaRealParto && Boolean(formik.errors.FechaRealParto)}
                            helperText={formik.touched.FechaRealParto && formik.errors.FechaRealParto}
                            disabled={submitting}
                            InputLabelProps={{
                              shrink: true,
                            }}
                            InputProps={{
                              startAdornment: (
                                <CalendarIcon color="action" sx={{ mr: 1 }} />
                              ),
                            }}
                          />
                        </Grid>
                      )}

                      {/* Mensaje informativo */}
                      <Grid item xs={12}>
                        {formik.values.Resultado === 'parto_exitoso' ? (
                          <Alert severity="success" icon={<CheckCircleIcon />}>
                            <AlertTitle>¡Parto exitoso!</AlertTitle>
                            Registre las crías nacidas en el siguiente paso.
                          </Alert>
                        ) : formik.values.Resultado === 'parto_fallido' ? (
                          <Alert severity="error">
                            <AlertTitle>Parto fallido</AlertTitle>
                            Se ha registrado un parto fallido. Por favor, indique la causa en las observaciones.
                          </Alert>
                        ) : formik.values.Resultado === 'aborto' ? (
                          <Alert severity="warning">
                            <AlertTitle>Aborto registrado</AlertTitle>
                            Se ha registrado un aborto. Por favor, indique detalles en las observaciones.
                          </Alert>
                        ) : formik.values.Resultado === 'preñada' ? (
                          <Alert severity="info" icon={<PregnantWomanIcon />}>
                            <AlertTitle>Preñez confirmada</AlertTitle>
                            Se ha confirmado la preñez del animal. Se recomienda realizar seguimiento periódico.
                          </Alert>
                        ) : formik.values.Resultado === 'no_preñada' ? (
                          <Alert severity="info">
                            <AlertTitle>Preñez no confirmada</AlertTitle>
                            No se ha confirmado la preñez del animal. Se recomienda repetir el servicio.
                          </Alert>
                        ) : (
                          <Alert severity="info">
                            <AlertTitle>En seguimiento</AlertTitle>
                            Registre el resultado del seguimiento reproductivo cuando esté disponible.
                          </Alert>
                        )}
                      </Grid>
                    </Grid>

                    <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
                      <Button onClick={handleBack} disabled={submitting} startIcon={<ArrowBackIcon />}>
                        Atrás
                      </Button>
                      <Button
                        variant="contained"
                        onClick={handleNext}
                        disabled={submitting}
                        endIcon={<ArrowBackIcon sx={{ transform: 'rotate(180deg)' }} />}
                      >
                        Siguiente
                      </Button>
                    </Box>
                  </Box>
                </StepContent>
              </Step>

              {/* Paso 3: Registro de Crías (solo para parto exitoso) */}
              <Step key="crias">
                <StepLabel>Registro de Crías</StepLabel>
                <StepContent>
                  <Box sx={{ mt: 2, mb: 4, pl: 2 }}>
                    {formik.values.Resultado === 'parto_exitoso' ? (
                      <>
                        <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                          Registre las crías nacidas en este parto
                        </Typography>
                        
                        <Alert severity="info" sx={{ mb: 2 }}>
                          <AlertTitle>Registro de Crías</AlertTitle>
                          Para registrar las crías, por favor utilice la opción de edición después de guardar este registro.
                        </Alert>
                      </>
                    ) : (
                      <Alert severity="info">
                        <AlertTitle>No aplica</AlertTitle>
                        El registro de crías solo está disponible para partos exitosos.
                      </Alert>
                    )}

                    <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
                      <Button onClick={handleBack} disabled={submitting} startIcon={<ArrowBackIcon />}>
                        Atrás
                      </Button>
                      <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        disabled={submitting || !formik.isValid}
                        startIcon={submitting ? <CircularProgress size={20} /> : <SaveIcon />}
                      >
                        {isEditing ? 'Actualizar' : 'Guardar'}
                      </Button>
                    </Box>
                  </Box>
                </StepContent>
              </Step>
            </Stepper>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ReproduccionFormPage;
