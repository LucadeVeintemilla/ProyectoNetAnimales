import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Divider,
  FormControl,
  FormHelperText,
  Grid,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  TextField,
  Typography,
  CircularProgress,
  Alert,
  Breadcrumbs,
  Link,
} from '@mui/material';
import {
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import produccionCarneService, { ProduccionCarne, ProduccionCarneCreateDto } from '../../services/produccionCarneService';
import { useAuth } from '../../context/AuthContext';
import { format } from 'date-fns';

const ProduccionCarneFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const isEditing = Boolean(id);
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [animales, setAnimales] = useState<any[]>([]);
  const [rendimientoCalc, setRendimientoCalc] = useState<number | null>(null);

  const [formData, setFormData] = useState<ProduccionCarneCreateDto>({
    animalId: 0,
    fechaSacrificio: format(new Date(), 'yyyy-MM-dd'),
    pesoVivo: 0,
    pesoCanal: 0,
    destino: '',
    observaciones: ''
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const validateField = (name: string, value: any): string => {
    switch (name) {
      case 'animalId':
        return value <= 0 ? 'Debe seleccionar un animal' : '';
      case 'fechaSacrificio':
        return value ? '' : 'La fecha de sacrificio es requerida';
      case 'pesoVivo':
        return value <= 0 ? 'El peso vivo debe ser mayor a 0' : '';
      case 'pesoCanal':
        return value <= 0 ? 'El peso canal debe ser mayor a 0' : '';
      case 'destino':
        return value ? '' : 'El destino es requerido';
      default:
        return '';
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    let isValid = true;

    Object.entries(formData).forEach(([key, value]) => {
      if (key === 'observaciones') return; // campo opcional
      const error = validateField(key, value);
      if (error) {
        errors[key] = error;
        isValid = false;
      }
    });

    // Validación adicional: peso canal no debe ser mayor al peso vivo
    if (formData.pesoCanal > formData.pesoVivo) {
      errors['pesoCanal'] = 'El peso canal no puede ser mayor al peso vivo';
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  const handleTextFieldChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (!name) return;
    
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Clear error when field is edited
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: '' }));
    }
    
    // Calculate rendimiento when either peso changes
    if (name === 'pesoVivo' || name === 'pesoCanal') {
      const pesoVivo = name === 'pesoVivo' ? Number(value) : formData.pesoVivo;
      const pesoCanal = name === 'pesoCanal' ? Number(value) : formData.pesoCanal;
      
      if (pesoVivo > 0 && pesoCanal > 0) {
        const rendimiento = (pesoCanal / pesoVivo) * 100;
        setRendimientoCalc(Number(rendimiento.toFixed(2)));
      } else {
        setRendimientoCalc(null);
      }
    }
  };

  const handleSelectChange = (e: SelectChangeEvent<number>) => {
    const { name, value } = e.target;
    if (!name) return;
    
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Clear error when field is edited
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar formulario
    if (!validateForm()) {
      setError('Por favor, corrija los errores en el formulario');
      return;
    }
    
    setSaving(true);
    setError(null);
    
    try {
      if (isEditing && id) {
        await produccionCarneService.updateProduccion(parseInt(id), formData);
        setSuccess('Registro actualizado con éxito!');
        setTimeout(() => navigate('/produccion-carne'), 1500);
      } else {
        await produccionCarneService.createProduccion(formData);
        setSuccess('Registro creado con éxito!');
        setTimeout(() => navigate('/produccion-carne'), 1500);
      }
    } catch (error: any) {
      console.error('Error al guardar:', error);
      setError(error.response?.data?.message || 'Error al guardar el registro');
    } finally {
      setSaving(false);
    }
  };
  
  const loadAnimalesDisponibles = async () => {
    try {
      const data = await produccionCarneService.getAnimalesDisponibles();
      setAnimales(data);
    } catch (error) {
      console.error('Error al cargar los animales:', error);
      setError('No se pudieron cargar los animales disponibles');
    }
  };
  
  const loadProduccion = async (produccionId: string) => {
    try {
      setLoading(true);
      const data = await produccionCarneService.getProduccionById(parseInt(produccionId));
      
      // Formatear la fecha para el input
      const fechaSacrificio = data.fechaSacrificio 
        ? format(new Date(data.fechaSacrificio), 'yyyy-MM-dd')
        : '';
      
      setFormData({
        animalId: data.animalId,
        fechaSacrificio,
        pesoVivo: data.pesoVivo,
        pesoCanal: data.pesoCanal,
        destino: data.destino,
        observaciones: data.observaciones || ''
      });
      
      // Calcular rendimiento
      if (data.pesoVivo > 0 && data.pesoCanal > 0) {
        setRendimientoCalc((data.pesoCanal / data.pesoVivo) * 100);
      }
      
    } catch (error) {
      console.error('Error al cargar el registro:', error);
      setError('No se pudo cargar la información del registro');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    loadAnimalesDisponibles();
    
    if (isEditing && id) {
      loadProduccion(id);
    }
  }, [id]);
  
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" gutterBottom>
            {isEditing ? 'Editar Registro de Producción de Carne' : 'Nuevo Registro de Producción de Carne'}
          </Typography>
          <Breadcrumbs aria-label="breadcrumb">
            <Link color="inherit" href="#" onClick={() => navigate('/produccion-carne')}>
              Producción de Carne
            </Link>
            <Typography color="textPrimary">
              {isEditing ? 'Editar Registro' : 'Nuevo Registro'}
            </Typography>
          </Breadcrumbs>
        </Box>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/produccion-carne')}
        >
          Volver
        </Button>
      </Box>
      
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
      
      <Card>
        <CardHeader title="Datos del Registro" />
        <Divider />
        <CardContent>
          <Box component="form" onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth error={!!formErrors.animalId}>
                  <InputLabel id="animal-select-label">Animal</InputLabel>
                  <Select
                    labelId="animal-select-label"
                    id="animalId"
                    name="animalId"
                    value={formData.animalId}
                    onChange={handleSelectChange}
                    label="Animal"
                    disabled={isEditing || saving}
                  >
                    <MenuItem value={0}>-- Seleccione un animal --</MenuItem>
                    {animales.map((animal) => (
                      <MenuItem key={animal.id} value={animal.id}>
                        {animal.nombre} ({animal.numeroIdentificacion})
                      </MenuItem>
                    ))}
                  </Select>
                  {formErrors.animalId && (
                    <FormHelperText>{formErrors.animalId}</FormHelperText>
                  )}
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Fecha de Sacrificio"
                  type="date"
                  name="fechaSacrificio"
                  value={formData.fechaSacrificio}
                  onChange={handleTextFieldChange}
                  InputLabelProps={{ shrink: true }}
                  error={!!formErrors.fechaSacrificio}
                  helperText={formErrors.fechaSacrificio}
                  disabled={saving}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Peso Vivo (kg)"
                  type="number"
                  name="pesoVivo"
                  value={formData.pesoVivo}
                  onChange={handleTextFieldChange}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">kg</InputAdornment>,
                  }}
                  error={!!formErrors.pesoVivo}
                  helperText={formErrors.pesoVivo}
                  disabled={saving}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Peso Canal (kg)"
                  type="number"
                  name="pesoCanal"
                  value={formData.pesoCanal}
                  onChange={handleTextFieldChange}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">kg</InputAdornment>,
                  }}
                  error={!!formErrors.pesoCanal}
                  helperText={formErrors.pesoCanal}
                  disabled={saving}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Rendimiento Cárnico (%)"
                  type="number"
                  value={rendimientoCalc !== null ? rendimientoCalc.toFixed(2) : ''}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">%</InputAdornment>,
                    readOnly: true,
                  }}
                  helperText="Cálculo automático: (Peso Canal / Peso Vivo) * 100"
                  disabled={true}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Destino"
                  name="destino"
                  value={formData.destino}
                  onChange={handleTextFieldChange}
                  placeholder="Ej: Mercado Local, Frigorífico XYZ, Consumo propio"
                  error={!!formErrors.destino}
                  helperText={formErrors.destino}
                  disabled={saving}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Observaciones"
                  name="observaciones"
                  value={formData.observaciones}
                  onChange={handleTextFieldChange}
                  multiline
                  rows={3}
                  placeholder="Observaciones adicionales (opcional)"
                  disabled={saving}
                />
              </Grid>
            </Grid>
            
            <Box mt={3} display="flex" justifyContent="flex-end">
              <Button
                variant="contained"
                color="primary"
                type="submit"
                startIcon={<SaveIcon />}
                disabled={saving}
                sx={{ ml: 1 }}
              >
                {saving ? <CircularProgress size={24} /> : 'Guardar'}
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ProduccionCarneFormPage;
