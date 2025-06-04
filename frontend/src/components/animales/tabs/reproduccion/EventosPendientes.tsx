import React, { useState } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Avatar,
  IconButton,
  Chip,
  Paper,
  Button,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  FormControlLabel,
  Switch,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import {
  EventAvailable as EventAvailableIcon,
  PregnantWoman as PregnantWomanIcon,
  ChildCare as ChildCareIcon,
  Edit as EditIcon,
  CheckCircle as CheckCircleIcon,
  Close as CloseIcon,
  Delete as DeleteIcon,
  EventBusy as EventBusyIcon,
  LocalHospital as HospitalIcon,
  EmojiPeople as InseminationIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, isAfter, isBefore } from 'date-fns';
import { es } from 'date-fns/locale';
import { EventoReproductivo, TipoEventoReproductivo } from '../ReproduccionTab';

interface EventosPendientesProps {
  eventos: EventoReproductivo[];
  loading: boolean;
  onRefresh: () => void;
}

// Asegurarse de que la interfaz EventoReproductivo está completa si no está definida en ReproduccionTab
interface EventoReproductivoExtra extends EventoReproductivo {
  criasNacidas?: number;
  criasVivas?: number;
  pesoPromedioCrias?: number;
  metodoInseminacion?: 'natural' | 'ia';
  diagnostico?: 'positivo' | 'negativo' | 'no_aplicable';
  fechaProbableParto?: string;
}

const EventosPendientes: React.FC<EventosPendientesProps> = ({ 
  eventos, 
  loading, 
  onRefresh 
}) => {
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedEvento, setSelectedEvento] = useState<EventoReproductivo | null>(null);
  const [dialogType, setDialogType] = useState<'complete' | 'edit' | 'delete' | null>(null);
  
  // Estado para el formulario de edición/completado
  const [formData, setFormData] = useState<Partial<EventoReproductivoExtra>>({});

  const handleOpenDialog = (evento: EventoReproductivo, type: 'complete' | 'edit' | 'delete') => {
    setSelectedEvento(evento);
    setDialogType(type);
    
    if (type === 'complete' || type === 'edit') {
      // Inicializar el formulario con los datos del evento
      setFormData({
        ...evento,
        fecha: evento.fecha,
        observaciones: evento.observaciones || '',
      });
    }
    
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedEvento(null);
    setDialogType(null);
    setFormData({});
  };

  const handleFormChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = () => {
    if (!selectedEvento) return;
    
    console.log('Enviando datos:', formData);
    
    // Aquí iría la lógica para actualizar el evento en la API
    // Por ahora, solo cerramos el diálogo y actualizamos la lista
    setTimeout(() => {
      handleCloseDialog();
      onRefresh();
    }, 1000);
  };

  const handleDelete = () => {
    if (!selectedEvento) return;
    
    console.log('Eliminando evento:', selectedEvento.id);
    
    // Aquí iría la lógica para eliminar el evento en la API
    // Por ahora, solo cerramos el diálogo y actualizamos la lista
    setTimeout(() => {
      handleCloseDialog();
      onRefresh();
    }, 1000);
  };

  const getTipoIcono = (tipo: TipoEventoReproductivo) => {
    switch (tipo) {
      case 'celo':
        return <EventAvailableIcon />;
      case 'servicio':
        return <InseminationIcon />;
      case 'diagnostico_preniez':
        return <PregnantWomanIcon />;
      case 'parto':
        return <ChildCareIcon />;
      case 'aborto':
        return <EventBusyIcon />;
      default:
        return <EventAvailableIcon />;
    }
  };

  const getTipoColor = (tipo: TipoEventoReproductivo) => {
    switch (tipo) {
      case 'celo':
        return 'info';
      case 'servicio':
        return 'primary';
      case 'diagnostico_preniez':
        return 'secondary';
      case 'parto':
        return 'success';
      case 'aborto':
        return 'error';
      default:
        return 'default';
    }
  };

  const getTipoTexto = (tipo: TipoEventoReproductivo) => {
    switch (tipo) {
      case 'celo':
        return 'Celo';
      case 'servicio':
        return 'Servicio/Monta';
      case 'diagnostico_preniez':
        return 'Diagnóstico de Preñez';
      case 'parto':
        return 'Parto';
      case 'aborto':
        return 'Aborto';
      default:
        return 'Evento';
    }
  };

  // Ordenar eventos por fecha (más próximos primero)
  const eventosOrdenados = [...eventos].sort((a, b) => 
    new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
  );

  // Agrupar eventos por estado (atrasados vs próximos)
  const hoy = new Date();
  const eventosAtrasados = eventosOrdenados.filter(evento => 
    new Date(evento.fecha) < hoy
  );
  
  const eventosProximos = eventosOrdenados.filter(evento => 
    new Date(evento.fecha) >= hoy
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box mb={3} display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="h6">Eventos Reproductivos Pendientes</Typography>
        <Button 
          variant="outlined" 
          size="small" 
          onClick={onRefresh}
          disabled={loading}
        >
          Actualizar
        </Button>
      </Box>

      {/* Eventos Atrasados */}
      {eventosAtrasados.length > 0 && (
        <Box mb={4}>
          <Typography variant="subtitle1" color="error" gutterBottom>
            <EventBusyIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
            Eventos Atrasados
          </Typography>
          <Paper variant="outlined">
            <List>
              {eventosAtrasados.map((evento) => (
                <React.Fragment key={evento.id}>
                  <ListItem>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: `${getTipoColor(evento.tipo)}.light` }}>
                        {getTipoIcono(evento.tipo)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <>
                          <Typography component="span" variant="subtitle1">
                            {getTipoTexto(evento.tipo)}
                          </Typography>
                          <Chip 
                            label="Atrasado" 
                            size="small" 
                            color="error" 
                            sx={{ ml: 1, fontSize: '0.7rem' }}
                          />
                        </>
                      }
                      secondary={
                        <>
                          <Typography component="span" variant="body2" color="text.primary">
                            {format(new Date(evento.fecha), 'PPPp', { locale: es })}
                          </Typography>
                          {evento.observaciones && (
                            <Typography component="div" variant="body2" color="text.secondary">
                              {evento.observaciones}
                            </Typography>
                          )}
                          {evento.tipo === 'diagnostico_preniez' && evento.fechaProbableParto && (
                            <Typography component="div" variant="body2" color="error">
                              Parto esperado: {format(new Date(evento.fechaProbableParto), 'PPP', { locale: es })}
                            </Typography>
                          )}
                        </>
                      }
                    />
                    <ListItemSecondaryAction>
                      <Tooltip title="Marcar como completado">
                        <IconButton 
                          edge="end" 
                          color="success"
                          onClick={() => handleOpenDialog(evento, 'complete')}
                        >
                          <CheckCircleIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Editar">
                        <IconButton 
                          edge="end"
                          onClick={() => handleOpenDialog(evento, 'edit')}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Eliminar">
                        <IconButton 
                          edge="end" 
                          color="error"
                          onClick={() => handleOpenDialog(evento, 'delete')}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </ListItemSecondaryAction>
                  </ListItem>
                  <Divider component="li" />
                </React.Fragment>
              ))}
            </List>
          </Paper>
        </Box>
      )}

      {/* Próximos Eventos */}
      <Box>
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          <EventAvailableIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
          Próximos Eventos
        </Typography>
        
        {eventosProximos.length > 0 ? (
          <Paper variant="outlined">
            <List>
              {eventosProximos.map((evento, index) => (
                <React.Fragment key={evento.id}>
                  <ListItem>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: `${getTipoColor(evento.tipo)}.light` }}>
                        {getTipoIcono(evento.tipo)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Typography component="span" variant="subtitle1">
                          {getTipoTexto(evento.tipo)}
                          <Chip 
                            label={format(new Date(evento.fecha), 'PPP', { locale: es })}
                            size="small" 
                            sx={{ ml: 1, fontSize: '0.7rem' }}
                            variant="outlined"
                          />
                        </Typography>
                      }
                      secondary={
                        <>
                          <Typography component="span" variant="body2" color="text.primary">
                            {format(new Date(evento.fecha), 'ppp', { locale: es })}
                          </Typography>
                          {evento.observaciones && (
                            <Typography component="div" variant="body2" color="text.secondary">
                              {evento.observaciones}
                            </Typography>
                          )}
                          {evento.tipo === 'diagnostico_preniez' && evento.fechaProbableParto && (
                            <Typography component="div" variant="body2" color="success.main">
                              Parto esperado: {format(new Date(evento.fechaProbableParto), 'PPP', { locale: es })}
                            </Typography>
                          )}
                        </>
                      }
                    />
                    <ListItemSecondaryAction>
                      <Tooltip title="Marcar como completado">
                        <IconButton 
                          edge="end" 
                          color="success"
                          onClick={() => handleOpenDialog(evento, 'complete')}
                        >
                          <CheckCircleIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Editar">
                        <IconButton 
                          edge="end"
                          onClick={() => handleOpenDialog(evento, 'edit')}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Eliminar">
                        <IconButton 
                          edge="end" 
                          color="error"
                          onClick={() => handleOpenDialog(evento, 'delete')}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </ListItemSecondaryAction>
                  </ListItem>
                  {index < eventosProximos.length - 1 && <Divider component="li" />}
                </React.Fragment>
              ))}
            </List>
          </Paper>
        ) : (
          <Paper variant="outlined" sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="text.secondary">
              No hay eventos programados
            </Typography>
          </Paper>
        )}
      </Box>

      {/* Diálogos */}
      <Dialog 
        open={openDialog && dialogType === 'complete'} 
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Confirmar Evento</DialogTitle>
        <DialogContent>
          <DialogContentText gutterBottom>
            ¿Desea marcar este evento como completado?
          </DialogContentText>
          
          <Box mt={2}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Observaciones"
              value={formData.observaciones || ''}
              onChange={(e) => handleFormChange('observaciones', e.target.value)}
              margin="normal"
            />
            
            {selectedEvento?.tipo === 'parto' && (
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Crías nacidas"
                    value={formData.criasNacidas || ''}
                    onChange={(e) => handleFormChange('criasNacidas', parseInt(e.target.value) || 0)}
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Peso promedio (kg)"
                    value={formData.pesoPromedioCrias || ''}
                    onChange={(e) => handleFormChange('pesoPromedioCrias', parseFloat(e.target.value) || 0)}
                    margin="normal"
                    InputProps={{
                      endAdornment: 'kg',
                    }}
                  />
                </Grid>
              </Grid>
            )}
            
            {selectedEvento?.tipo === 'diagnostico_preniez' && (
              <FormControl fullWidth margin="normal">
                <InputLabel id="diagnostico-label">Diagnóstico</InputLabel>
                <Select
                  labelId="diagnostico-label"
                  value={formData.diagnostico || ''}
                  label="Diagnóstico"
                  onChange={(e) => handleFormChange('diagnostico', e.target.value)}
                >
                  <MenuItem value="positivo">Positivo</MenuItem>
                  <MenuItem value="negativo">Negativo</MenuItem>
                  <MenuItem value="no_aplicable">No aplicable</MenuItem>
                </Select>
              </FormControl>
            )}
            
            {selectedEvento?.tipo === 'servicio' && (
              <FormControl fullWidth margin="normal">
                <InputLabel id="metodo-label">Método de Servicio</InputLabel>
                <Select
                  labelId="metodo-label"
                  value={formData.metodoInseminacion || ''}
                  label="Método de Servicio"
                  onChange={(e) => handleFormChange('metodoInseminacion', e.target.value)}
                >
                  <MenuItem value="ia">Inseminación Artificial</MenuItem>
                  <MenuItem value="natural">Monta Natural</MenuItem>
                </Select>
              </FormControl>
            )}
            
            <FormControl fullWidth margin="normal">
              <InputLabel id="estado-label">Estado</InputLabel>
              <Select
                labelId="estado-label"
                value={formData.estado || ''}
                label="Estado"
                onChange={(e) => handleFormChange('estado', e.target.value)}
              >
                <MenuItem value="completado">Completado</MenuItem>
                <MenuItem value="pendiente">Pendiente</MenuItem>
                <MenuItem value="cancelado">Cancelado</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            Confirmar
          </Button>
        </DialogActions>
      </Dialog>
      
      <Dialog 
        open={openDialog && dialogType === 'edit'} 
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Editar Evento</DialogTitle>
        <DialogContent>
          <Box mt={2}>
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
              <DatePicker
                label="Fecha del evento"
                value={formData.fecha ? new Date(formData.fecha) : new Date()}
                onChange={(date) => handleFormChange('fecha', date?.toISOString())}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    margin: "normal"
                  }
                }}
              />
            </LocalizationProvider>
            
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Observaciones"
              value={formData.observaciones || ''}
              onChange={(e) => handleFormChange('observaciones', e.target.value)}
              margin="normal"
            />
            
            {selectedEvento?.tipo === 'diagnostico_preniez' && formData.diagnostico === 'positivo' && (
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
                <DatePicker
                  label="Fecha probable de parto"
                  value={formData.fechaProbableParto ? new Date(formData.fechaProbableParto) : null}
                  onChange={(date) => handleFormChange('fechaProbableParto', date?.toISOString())}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      margin: "normal"
                    }
                  }}
                />
              </LocalizationProvider>
            )}
            
            <FormControl fullWidth margin="normal">
              <InputLabel id="estado-label">Estado</InputLabel>
              <Select
                labelId="estado-label"
                value={formData.estado || ''}
                label="Estado"
                onChange={(e) => handleFormChange('estado', e.target.value)}
              >
                <MenuItem value="completado">Completado</MenuItem>
                <MenuItem value="pendiente">Pendiente</MenuItem>
                <MenuItem value="cancelado">Cancelado</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            Guardar Cambios
          </Button>
        </DialogActions>
      </Dialog>
      
      <Dialog 
        open={openDialog && dialogType === 'delete'} 
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Eliminar Evento</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Está seguro de que desea eliminar este evento? Esta acción no se puede deshacer.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button onClick={handleDelete} variant="contained" color="error">
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EventosPendientes;
