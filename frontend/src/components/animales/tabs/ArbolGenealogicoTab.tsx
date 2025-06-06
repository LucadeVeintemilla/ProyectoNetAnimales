import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Card,
  CardContent,
  Divider,
  Button,
  Grid,
  Tooltip,
  IconButton,
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
  FormHelperText,
  Slider,
  Chip,
  Alert,
} from '@mui/material';
import {
  AccountTree as FamilyIcon,
  Female as FemaleIcon,
  Male as MaleIcon,
  Help as UnknownIcon,
  Info as InfoIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  ZoomOutMap as ZoomOutMapIcon,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { Tree, TreeNode } from 'react-organizational-chart';
import animalService from '../../../services/animalService';

// Interfaces para manejar la respuesta del backend
interface AnimalDTO {
  id: number;
  numeroIdentificacion: string;
  nombre: string;
  fechaNacimiento: string;
  sexo: string;
  estado: string;
  razaId: number;
  razaNombre?: string;
}

interface ArbolGenealogicoNodoDTO {
  animal: AnimalDTO;
  nivel: number;
  padre?: ArbolGenealogicoNodoDTO;
  madre?: ArbolGenealogicoNodoDTO;
}

interface ArbolGenealogicoDTO {
  animal: AnimalDTO;
  niveles: number;
  fechaGeneracion: string;
  ancestros: ArbolGenealogicoNodoDTO[];
}

// Interfaz para nuestro componente visual
interface AnimalNodo {
  id: number;
  nombre: string;
  numeroIdentificacion: string;
  sexo: 'M' | 'H' | 'Desconocido';
  razaNombre?: string;
  fechaNacimiento?: string;
  padre?: AnimalNodo | null;
  madre?: AnimalNodo | null;
  hijos?: AnimalNodo[];
}

interface ArbolGenealogicoTabProps {
  animalId: number;
}

const ArbolGenealogicoTab: React.FC<ArbolGenealogicoTabProps> = ({ animalId }) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [arbol, setArbol] = useState<AnimalNodo | null>(null);
  const [niveles, setNiveles] = useState<number>(3);
  const [zoom, setZoom] = useState<number>(100);
  const [consanguinidad, setConsanguinidad] = useState<number | null>(null);
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [selectedAnimal, setSelectedAnimal] = useState<AnimalNodo | null>(null);
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();

  // Convertir datos del backend al formato requerido por el componente
  const convertirAFormatoArbol = (datos: ArbolGenealogicoDTO): AnimalNodo => {
    // Convertir el animal principal
    const animalPrincipal: AnimalNodo = {
      id: datos.animal.id,
      nombre: datos.animal.nombre || 'Sin nombre',
      numeroIdentificacion: datos.animal.numeroIdentificacion,
      sexo: datos.animal.sexo as 'M' | 'H' | 'Desconocido',
      razaNombre: datos.animal.razaNombre,
      fechaNacimiento: datos.animal.fechaNacimiento,
      padre: null,
      madre: null,
      hijos: []
    };

    // Convertir ancestros (padres y madres) si existen
    datos.ancestros?.forEach(ancestro => {
      if (ancestro.animal) {
        const nodoAncestro = convertirNodo(ancestro);
        if (ancestro.animal.sexo === 'M') {
          animalPrincipal.padre = nodoAncestro;
        } else if (ancestro.animal.sexo === 'H') {
          animalPrincipal.madre = nodoAncestro;
        }
      }
    });

    console.log('Árbol convertido:', animalPrincipal);
    return animalPrincipal;
  };

  // Convertir recursivamente nodos del árbol
  const convertirNodo = (nodo: ArbolGenealogicoNodoDTO): AnimalNodo => {
    const resultado: AnimalNodo = {
      id: nodo.animal.id,
      nombre: nodo.animal.nombre || 'Sin nombre',
      numeroIdentificacion: nodo.animal.numeroIdentificacion,
      sexo: nodo.animal.sexo as 'M' | 'H' | 'Desconocido',
      razaNombre: nodo.animal.razaNombre,
      fechaNacimiento: nodo.animal.fechaNacimiento,
      padre: null,
      madre: null
    };

    // Convertir recursivamente padre y madre
    if (nodo.padre) {
      resultado.padre = convertirNodo(nodo.padre);
    }

    if (nodo.madre) {
      resultado.madre = convertirNodo(nodo.madre);
    }

    return resultado;
  };

  // Cargar árbol genealógico
  useEffect(() => {
    const cargarArbol = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await animalService.getArbolGenealogico(animalId, niveles);
        console.log('Datos recibidos del API:', data);
        
        if (data && data.animal) {
          const arbolConvertido = convertirAFormatoArbol(data);
          setArbol(arbolConvertido);
        } else {
          setError('Formato de datos no válido');
          console.error('Formato de datos no válido:', data);
        }
        
        // Calcular coeficiente de consanguinidad
        try {
          const coeficiente = await animalService.getCoeficienteConsanguinidad(animalId);
          console.log('Coeficiente recibido:', coeficiente);
          
          // Verificar si es un número válido
          if (coeficiente !== undefined && coeficiente !== null && !isNaN(coeficiente)) {
            setConsanguinidad(Number(coeficiente));
          } else {
            console.warn('Coeficiente de consanguinidad inválido:', coeficiente);
            setConsanguinidad(null);
          }
        } catch (error) {
          console.error('Error al cargar coeficiente de consanguinidad:', error);
          setConsanguinidad(null);
        }
      } catch (err) {
        console.error('Error al cargar el árbol genealógico:', err);
        setError('No se pudo cargar el árbol genealógico. Intente nuevamente.');
        enqueueSnackbar('Error al cargar el árbol genealógico', { variant: 'error' });
      } finally {
        setLoading(false);
      }
    };

    if (animalId) {
      cargarArbol();
    }
  }, [animalId, niveles, enqueueSnackbar]);

  // Renderizar un nodo del árbol
  const renderNodo = (nodo: AnimalNodo) => {
    const esMacho = nodo.sexo === 'M';
    const esHembra = nodo.sexo === 'H';
    const esActual = nodo.id === animalId;

    return (
      <Box
        sx={{
          p: 1,
          m: '0 auto',
          textAlign: 'center',
          border: `2px solid ${esActual ? '#1976d2' : '#e0e0e0'}`,
          borderRadius: 2,
          bgcolor: esActual ? '#f0f7ff' : 'background.paper',
          minWidth: 140,
          cursor: 'pointer',
          '&:hover': {
            boxShadow: 2,
          },
        }}
        onClick={() => {
          setSelectedAnimal(nodo);
          setDialogOpen(true);
        }}
      >
        <Box display="flex" alignItems="center" justifyContent="center" mb={1}>
          {esMacho && <MaleIcon color="primary" sx={{ mr: 0.5 }} />}
          {esHembra && <FemaleIcon color="secondary" sx={{ mr: 0.5 }} />}
          {!esMacho && !esHembra && <UnknownIcon color="action" sx={{ mr: 0.5 }} />}
          <Typography variant="subtitle2" fontWeight="bold">
            {nodo.nombre || 'Sin nombre'}
          </Typography>
        </Box>
        <Typography variant="caption" display="block">
          #{nodo.numeroIdentificacion}
        </Typography>
        {nodo.razaNombre && (
          <Chip
            label={nodo.razaNombre}
            size="small"
            sx={{ mt: 0.5, height: 20, fontSize: '0.6rem' }}
          />
        )}
      </Box>
    );
  };

  // Renderizar el árbol de forma recursiva
  const renderArbol = (nodo: AnimalNodo): React.ReactNode => {
    return (
      <TreeNode key={nodo.id} label={renderNodo(nodo)}>
        {nodo.padre && (
          <TreeNode key={`padre-${nodo.padre.id}`} label={renderNodo(nodo.padre)}>
            {nodo.padre.padre && renderArbol(nodo.padre.padre)}
            {nodo.padre.madre && renderArbol(nodo.padre.madre)}
          </TreeNode>
        )}
        {nodo.madre && (
          <TreeNode key={`madre-${nodo.madre.id}`} label={renderNodo(nodo.madre)}>
            {nodo.madre.padre && renderArbol(nodo.madre.padre)}
            {nodo.madre.madre && renderArbol(nodo.madre.madre)}
          </TreeNode>
        )}
      </TreeNode>
    );
  };

  // Manejadores de zoom
  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 20, 200));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 20, 50));
  const handleZoomReset = () => setZoom(100);

  // Manejador de cambio de niveles
  const handleNivelesChange = (event: Event, newValue: number | number[]) => {
    setNiveles(newValue as number);
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Controles */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h6" component="h2" gutterBottom>
            Árbol Genealógico
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ width: 200 }}>
              <Typography id="niveles-slider" gutterBottom>
                Niveles: {niveles}
              </Typography>
              <Slider
                value={niveles}
                onChange={handleNivelesChange}
                aria-labelledby="niveles-slider"
                valueLabelDisplay="auto"
                step={1}
                marks
                min={1}
                max={5}
                sx={{ mt: 2 }}
              />
            </Box>
          </Box>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Acercar">
            <IconButton onClick={handleZoomIn} size="small">
              <ZoomInIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Alejar">
            <IconButton onClick={handleZoomOut} size="small">
              <ZoomOutIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Restablecer zoom">
            <IconButton onClick={handleZoomReset} size="small">
              <ZoomOutMapIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Coeficiente de consanguinidad */}
      {consanguinidad !== null && !isNaN(consanguinidad) && (
        <Alert 
          severity={consanguinidad > 0.1 ? 'warning' : 'info'}
          sx={{ mb: 3, alignItems: 'center' }}
          icon={<InfoIcon fontSize="inherit" />}
        >
          <Box>
            <Typography variant="subtitle2">
              Coeficiente de consanguinidad: {consanguinidad.toFixed(2)}%
            </Typography>
            <Typography variant="caption" display="block">
              {consanguinidad > 0.1 
                ? '¡Atención! Este valor sugiere consanguinidad significativa.'
                : 'Este valor indica una consanguinidad dentro de los parámetros normales.'}
            </Typography>
          </Box>
        </Alert>
      )}

      {/* Árbol genealógico */}
      <Paper 
        variant="outlined" 
        sx={{ 
          p: 3, 
          overflow: 'auto',
          maxWidth: '100%',
          '& > div': { 
            transform: `scale(${zoom / 100})`,
            transformOrigin: 'top center',
            transition: 'transform 0.2s',
            minHeight: 300,
            display: 'flex',
            justifyContent: 'center',
          },
        }}
      >
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={300}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Box textAlign="center" p={4}>
            <Typography color="error">{error}</Typography>
            <Button 
              variant="outlined" 
              color="primary" 
              onClick={() => window.location.reload()}
              sx={{ mt: 2 }}
            >
              Reintentar
            </Button>
          </Box>
        ) : arbol ? (
          <Tree
            lineWidth="2px"
            lineColor="#bdbdbd"
            lineBorderRadius="10px"
            label={renderNodo(arbol)}
          >
            {arbol.padre && renderArbol(arbol.padre)}
            {arbol.madre && renderArbol(arbol.madre)}
          </Tree>
        ) : (
          <Box textAlign="center" p={4}>
            <Typography>No se encontró información genealógica para este animal.</Typography>
          </Box>
        )}
      </Paper>

      {/* Diálogo de detalles del animal */}
      <Dialog 
        open={dialogOpen} 
        onClose={() => setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        {selectedAnimal && (
          <>
            <DialogTitle>
              {selectedAnimal.nombre || 'Animal sin nombre'}
              <Typography variant="subtitle2" color="text.secondary">
                #{selectedAnimal.numeroIdentificacion}
              </Typography>
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2">Sexo:</Typography>
                  <Typography gutterBottom>
                    {selectedAnimal.sexo === 'M' ? 'Macho' : 
                     selectedAnimal.sexo === 'H' ? 'Hembra' : 'Desconocido'}
                  </Typography>
                </Grid>
                {selectedAnimal.fechaNacimiento && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2">Fecha de Nacimiento:</Typography>
                    <Typography gutterBottom>
                      {new Date(selectedAnimal.fechaNacimiento).toLocaleDateString()}
                    </Typography>
                  </Grid>
                )}
                {selectedAnimal.razaNombre && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2">Raza:</Typography>
                    <Typography gutterBottom>{selectedAnimal.razaNombre}</Typography>
                  </Grid>
                )}
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDialogOpen(false)}>Cerrar</Button>
              <Button 
                variant="contained" 
                onClick={() => {
                  setDialogOpen(false);
                  navigate(`/animales/${selectedAnimal.id}`);
                }}
              >
                Ver detalles completos
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default ArbolGenealogicoTab;
