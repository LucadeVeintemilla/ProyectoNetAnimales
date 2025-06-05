import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Grid,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Paper,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Save as SaveIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { es } from 'date-fns/locale';
import { format } from 'date-fns';

import { saludService, ControlSaludCreateDto } from '../../services/saludService';
import { animalService } from '../../services/animalService';
import type { Animal } from '../../services/animalService';

// Esquema de validación con Yup
const validationSchema = Yup.object({
  animalId: Yup.number().required('El animal es requerido'),
  fecha: Yup.date().required('La fecha es requerida'),
  tipo: Yup.string().required('El tipo de control es requerido'),
  descripcion: Yup.string().required('La descripción es requerida'),
  estado: Yup.string().required('El estado es requerido'),
});

interface SaludFormPageProps {
  isEditing?: boolean;
}

const SaludFormPage: React.FC<SaludFormPageProps> = ({ isEditing: isEditingProp }) => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const isEditing = isEditingProp || !!id;

  // Estados
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [animales, setAnimales] = useState<{items: Animal[], totalCount: number}>({items: [], totalCount: 0});

  // Formik para manejar el formulario
  const formik = useFormik<ControlSaludCreateDto>({
    initialValues: {
      animalId: 0,
      fecha: format(new Date(), 'yyyy-MM-dd\'T\'HH:mm:ss'),
      tipo: 'revision' as const,
      descripcion: '',
      estado: 'pendiente',
      diagnostico: '',
      fechaProximoControl: null,
      responsable: '',
      observaciones: '',
    },
    validationSchema,
    onSubmit: async (values) => {
      handleSubmit(values);
    },
  });

  // Cargar datos iniciales
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      try {
        const animalData = await animalService.getAnimales();
        setAnimales(animalData); // animalData tiene estructura {items, totalCount}

        if (isEditing && id) {
          const controlId = parseInt(id);
          const controlData = await saludService.getById(controlId);

          formik.setValues({
            animalId: controlData.animalId,
            fecha: typeof controlData.fecha === 'string'
              ? controlData.fecha
              : format(controlData.fecha, 'yyyy-MM-dd\'T\'HH:mm:ss'),
            tipo: controlData.tipo,
            descripcion: controlData.descripcion,
            estado: controlData.estado,
            diagnostico: controlData.diagnostico || '',
            fechaProximoControl: controlData.fechaProximoControl ? 
              (typeof controlData.fechaProximoControl === 'string' 
                ? controlData.fechaProximoControl 
                : format(controlData.fechaProximoControl, 'yyyy-MM-dd\'T\'HH:mm:ss'))
              : null,
            responsable: controlData.responsable || '',
            observaciones: controlData.observaciones || '',
          });
        }
      } catch (error) {
        console.error('Error al cargar datos:', error);
        setError('Error al cargar los datos. Por favor, intente de nuevo.');
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, [id, isEditing]);

  // Manejar envío del formulario
  const handleSubmit = async (values: ControlSaludCreateDto) => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      if (isEditing && id) {
        const controlId = parseInt(id);
        await saludService.update(controlId, values);
        setSuccess('Control de salud actualizado correctamente');
      } else {
        await saludService.create(values);
        setSuccess('Control de salud registrado correctamente');
        formik.resetForm();
      }
    } catch (error) {
      console.error('Error al guardar el control de salud:', error);
      setError('Error al guardar los datos. Por favor, intente de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  const handleDateChange = (field: string) => (date: Date | null) => {
    if (date) {
      formik.setFieldValue(field, format(date, 'yyyy-MM-dd\'T\'HH:mm:ss'));
    } else {
      formik.setFieldValue(field, null);
    }
  };

  const handleBack = () => {
    navigate('/salud');
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', p: 2 }}>
      <Paper sx={{ p: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
          sx={{ mb: 2 }}
        >
          Volver al historial
        </Button>

        <Typography variant="h5" gutterBottom>
          {isEditing ? 'Editar Control de Salud' : 'Nuevo Control de Salud'}
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        <form onSubmit={formik.handleSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth error={formik.touched.animalId && Boolean(formik.errors.animalId)}>
                <InputLabel id="animal-label">Animal</InputLabel>
                <Select
                  labelId="animal-label"
                  id="animalId"
                  name="animalId"
                  value={formik.values.animalId}
                  onChange={formik.handleChange}
                  label="Animal"
                  disabled={isEditing} // Animal no debe ser editable si estamos editando
                >
                  <MenuItem value={0}>Seleccione un animal</MenuItem>
                  {animales.items && animales.items.map((animal) => (
                    <MenuItem key={animal.id} value={animal.id}>
                      {animal.numeroIdentificacion} - {animal.nombre || 'Sin nombre'}
                    </MenuItem>
                  ))}
                </Select>
                {formik.touched.animalId && formik.errors.animalId && (
                  <FormHelperText>{formik.errors.animalId}</FormHelperText>
                )}
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
                <DatePicker
                  label="Fecha del control"
                  value={formik.values.fecha ? new Date(formik.values.fecha) : null}
                  onChange={handleDateChange('fecha')}
                  format="dd/MM/yyyy HH:mm"
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      variant: 'outlined',
                      error: formik.touched.fecha && Boolean(formik.errors.fecha),
                      helperText: formik.touched.fecha && formik.errors.fecha,
                    },
                  }}
                />
              </LocalizationProvider>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth error={formik.touched.tipo && Boolean(formik.errors.tipo)}>
                <InputLabel id="tipo-label">Tipo de control</InputLabel>
                <Select
                  labelId="tipo-label"
                  id="tipo"
                  name="tipo"
                  value={formik.values.tipo}
                  onChange={formik.handleChange}
                  label="Tipo de control"
                >
                  <MenuItem value="">Seleccione un tipo</MenuItem>
                  <MenuItem value="vacuna">Vacuna</MenuItem>
                  <MenuItem value="tratamiento">Tratamiento</MenuItem>
                  <MenuItem value="revision">Revisión</MenuItem>
                  <MenuItem value="cirugia">Cirugía</MenuItem>
                  <MenuItem value="otro">Otro</MenuItem>
                </Select>
                {formik.touched.tipo && formik.errors.tipo && (
                  <FormHelperText>{formik.errors.tipo}</FormHelperText>
                )}
              </FormControl>
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
                  label="Estado"
                >
                  <MenuItem value="pendiente">Pendiente</MenuItem>
                  <MenuItem value="completado">Completado</MenuItem>
                  <MenuItem value="atrasado">Atrasado</MenuItem>
                  <MenuItem value="cancelado">Cancelado</MenuItem>
                </Select>
                {formik.touched.estado && formik.errors.estado && (
                  <FormHelperText>{formik.errors.estado}</FormHelperText>
                )}
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                id="descripcion"
                name="descripcion"
                label="Descripción"
                value={formik.values.descripcion}
                onChange={formik.handleChange}
                error={formik.touched.descripcion && Boolean(formik.errors.descripcion)}
                helperText={formik.touched.descripcion && formik.errors.descripcion}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                id="diagnostico"
                name="diagnostico"
                label="Diagnóstico"
                value={formik.values.diagnostico}
                onChange={formik.handleChange}
                error={formik.touched.diagnostico && Boolean(formik.errors.diagnostico)}
                helperText={formik.touched.diagnostico && formik.errors.diagnostico}
                multiline
                rows={3}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
                <DatePicker
                  label="Fecha próximo control (opcional)"
                  value={formik.values.fechaProximoControl ? new Date(formik.values.fechaProximoControl) : null}
                  onChange={handleDateChange('fechaProximoControl')}
                  format="dd/MM/yyyy"
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      variant: 'outlined',
                      error: formik.touched.fechaProximoControl && Boolean(formik.errors.fechaProximoControl),
                      helperText: formik.touched.fechaProximoControl && formik.errors.fechaProximoControl,
                    },
                  }}
                />
              </LocalizationProvider>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                id="responsable"
                name="responsable"
                label="Responsable"
                value={formik.values.responsable}
                onChange={formik.handleChange}
                error={formik.touched.responsable && Boolean(formik.errors.responsable)}
                helperText={formik.touched.responsable && formik.errors.responsable}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                id="observaciones"
                name="observaciones"
                label="Observaciones"
                value={formik.values.observaciones}
                onChange={formik.handleChange}
                error={formik.touched.observaciones && Boolean(formik.errors.observaciones)}
                helperText={formik.touched.observaciones && formik.errors.observaciones}
                multiline
                rows={3}
              />
            </Grid>

            <Grid item xs={12}>
              <Button
                type="submit"
                variant="contained"
                startIcon={<SaveIcon />}
                disabled={saving}
                sx={{ mt: 2 }}
              >
                {saving ? 'Guardando...' : isEditing ? 'Actualizar' : 'Guardar'}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  );
};

export default SaludFormPage;