import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  Divider,
  Chip,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  Card,
  CardContent,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  CheckCircle as CheckCircleIcon,
  AccessTime as ClockIcon,
  Warning as WarningIcon,
  Vaccines as VaccineIcon,
  LocalHospital as HospitalIcon,
  MedicalInformation as MedicalInformationIcon,
  Today as TodayIcon,
  Person as PersonIcon,
  Note as NoteIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import { saludService, ControlSalud, Medicamento } from '../../services/saludService';

const SaludDetallesPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [controlSalud, setControlSalud] = useState<ControlSalud | null>(null);

  useEffect(() => {
    const loadControlSalud = async () => {
      try {
        setLoading(true);
        if (!id) {
          setError('ID de control no válido');
          return;
        }
        
        const controlId = parseInt(id);
        const data = await saludService.getById(controlId);
        setControlSalud(data);
      } catch (error) {
        console.error('Error al cargar el control de salud:', error);
        setError('Error al cargar los datos. Por favor, intente nuevamente.');
      } finally {
        setLoading(false);
      }
    };
    
    loadControlSalud();
  }, [id]);

  const handleBack = () => {
    navigate('/salud');
  };

  const handleEdit = () => {
    navigate(`/salud/${id}/editar`);
  };

  // Función para obtener el icono y color según el estado
  const getEstadoInfo = (estado: string | undefined) => {
    // Manejar caso donde estado es undefined o nulo
    if (!estado) {
      return {
        icon: <ClockIcon />,
        label: 'Pendiente',
        color: 'primary' as const
      };
    }
    
    switch (estado.toLowerCase()) {
      case 'completado':
        return {
          icon: <CheckCircleIcon />,
          label: 'Completado',
          color: 'success' as const
        };
      case 'pendiente':
        return {
          icon: <ClockIcon />,
          label: 'Pendiente',
          color: 'primary' as const
        };
      case 'atrasado':
        return {
          icon: <WarningIcon />,
          label: 'Atrasado',
          color: 'error' as const
        };
      case 'cancelado':
        return {
          icon: <ClockIcon />,
          label: 'Cancelado',
          color: 'default' as const
        };
      default:
        return {
          icon: <ClockIcon />,
          label: estado,
          color: 'default' as const
        };
    }
  };

  // Obtener ícono según el tipo de control
  const getTipoIcon = (tipo?: string) => {
    // Manejar caso donde tipo es undefined o nulo
    if (!tipo) {
      return <MedicalInformationIcon fontSize="large" sx={{ color: 'text.secondary' }} />;
    }
    
    switch (tipo.toLowerCase()) {
      case 'vacuna':
        return <VaccineIcon fontSize="large" sx={{ color: 'success.main' }} />;
      case 'tratamiento':
        return <HospitalIcon fontSize="large" sx={{ color: 'primary.main' }} />;
      case 'revision':
        return <MedicalInformationIcon fontSize="large" sx={{ color: 'info.main' }} />;
      case 'cirugia':
        return <HospitalIcon fontSize="large" sx={{ color: 'error.main' }} />;
      default:
        return <MedicalInformationIcon fontSize="large" sx={{ color: 'text.secondary' }} />;
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !controlSalud) {
    return (
      <Box sx={{ p: 2 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={handleBack} sx={{ mb: 2 }}>
          Volver
        </Button>
        <Alert severity="error">{error || 'No se pudo cargar la información del control'}</Alert>
      </Box>
    );
  }

  const estadoInfo = getEstadoInfo(controlSalud.estado);
  
  return (
    <Box sx={{ width: '100%', p: 2 }}>
      <Button startIcon={<ArrowBackIcon />} onClick={handleBack} sx={{ mb: 2 }}>
        Volver al historial
      </Button>
      
      <Paper sx={{ p: 3 }}>
        {/* Encabezado */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {getTipoIcon(controlSalud.tipo)}
            <Box sx={{ ml: 2 }}>
              <Typography variant="h5" gutterBottom>
                {controlSalud.tipo 
                  ? `${controlSalud.tipo.charAt(0).toUpperCase() + controlSalud.tipo.slice(1)}: ${controlSalud.descripcion || ''}` 
                  : `Control médico: ${controlSalud.descripcion || 'Sin descripción'}`
                }
              </Typography>
              <Chip 
                icon={estadoInfo.icon}
                label={estadoInfo.label}
                color={estadoInfo.color}
                sx={{ mr: 1 }}
              />
              <Chip 
                icon={<TodayIcon />}
                label={format(new Date(controlSalud.fecha), "dd 'de' MMMM 'de' yyyy", { locale: es })}
                variant="outlined"
              />
            </Box>
          </Box>
          
          <Button
            variant="contained"
            startIcon={<EditIcon />}
            onClick={handleEdit}
          >
            Editar
          </Button>
        </Box>
        
        <Divider sx={{ mb: 3 }} />
        
        {/* Información del animal */}
        <Card variant="outlined" sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Información del Animal
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="textSecondary">
                  Identificación:
                </Typography>
                <Typography variant="body1">
                  {controlSalud.numeroIdentificacion || 'No disponible'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="textSecondary">
                  Nombre:
                </Typography>
                <Typography variant="body1">
                  {controlSalud.animalNombre || 'Sin nombre'}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
        
        {/* Detalles del control de salud */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <MedicalInformationIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">
                    Detalles del Control
                  </Typography>
                </Box>
                
                <List dense>
                  <ListItem>
                    <ListItemText 
                      primary="Fecha y hora" 
                      secondary={format(new Date(controlSalud.fecha), "dd/MM/yyyy HH:mm")}
                    />
                  </ListItem>
                  
                  <ListItem>
                    <ListItemText 
                      primary="Tipo" 
                      secondary={
                        controlSalud.tipo 
                          ? controlSalud.tipo.charAt(0).toUpperCase() + controlSalud.tipo.slice(1)
                          : 'No especificado'
                      }
                    />
                  </ListItem>
                  
                  <ListItem>
                    <ListItemText 
                      primary="Estado" 
                      secondary={
                        <Chip 
                          label={estadoInfo.label}
                          color={estadoInfo.color}
                          size="small"
                        />
                      }
                    />
                  </ListItem>
                  
                  
                  
                  {controlSalud.fechaProximoControl && (
                    <ListItem>
                      <ListItemText 
                        primary="Próximo control (90 días)" 
                        secondary={format(new Date(controlSalud.fechaProximoControl), "dd/MM/yyyy")}
                      />
                    </ListItem>
                  )}
                </List>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <NoteIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">
                    Diagnóstico
                  </Typography>
                </Box>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                    Diagnóstico:
                  </Typography>
                  <Typography variant="body1">
                    {controlSalud.diagnostico || 'No se ha registrado un diagnóstico.'}
                  </Typography>
                </Box>
                
                
              </CardContent>
            </Card>
          </Grid>
          
          {/* Medicamentos (si aplica) */}
          {controlSalud.medicamentos && controlSalud.medicamentos.length > 0 && (
            <Grid item xs={12}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Medicamentos
                  </Typography>
                  
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Medicamento</TableCell>
                        <TableCell>Dosis</TableCell>
                        <TableCell>Frecuencia</TableCell>
                        <TableCell>Vía de administración</TableCell>
                        <TableCell>Duración</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {controlSalud.medicamentos.map((med) => (
                        <TableRow key={med.id}>
                          <TableCell>{med.nombre}</TableCell>
                          <TableCell>{med.dosis}</TableCell>
                          <TableCell>{med.frecuencia || '-'}</TableCell>
                          <TableCell>{med.viaAdministracion || '-'}</TableCell>
                          <TableCell>{med.duracion || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      </Paper>
    </Box>
  );
};

export default SaludDetallesPage;
