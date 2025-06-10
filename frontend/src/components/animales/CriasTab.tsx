import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Skeleton,
  Alert,
  Chip,
  IconButton,
  Link,
} from '@mui/material';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Link as RouterLink } from 'react-router-dom';
import FemaleIcon from '@mui/icons-material/Female';
import MaleIcon from '@mui/icons-material/Male';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { animalService, Cria } from '../../services/animalService';

interface CriasTabProps {
  animalId: number;
}

const CriasTab: React.FC<CriasTabProps> = ({ animalId }) => {
  const [crias, setCrias] = useState<Cria[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCrias = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await animalService.getCriasByAnimal(animalId);
        setCrias(data);
      } catch (err) {
        console.error('Error al cargar las crías:', err);
        setError('No se pudieron cargar las crías del animal');
      } finally {
        setLoading(false);
      }
    };

    fetchCrias();
  }, [animalId]);

  if (loading) {
    return (
      <Box>
        <Typography variant="h6" gutterBottom>Crías</Typography>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Nombre</TableCell>
                <TableCell>Sexo</TableCell>
                <TableCell>Fecha de nacimiento</TableCell>
                <TableCell>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {[...Array(3)].map((_, index) => (
                <TableRow key={index}>
                  <TableCell><Skeleton variant="text" /></TableCell>
                  <TableCell><Skeleton variant="text" /></TableCell>
                  <TableCell><Skeleton variant="text" /></TableCell>
                  <TableCell><Skeleton variant="text" /></TableCell>
                  <TableCell><Skeleton variant="circular" width={40} height={40} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (crias.length === 0) {
    return (
      <Box sx={{ mt: 2 }}>
        <Alert severity="info">Este animal no tiene crías registradas</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>Crías registradas ({crias.length})</Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Nombre</TableCell>
              <TableCell>Sexo</TableCell>
              <TableCell>Fecha de nacimiento</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {crias.map((cria) => (
              <TableRow key={cria.id}>
                <TableCell>{cria.numeroIdentificacion}</TableCell>
                <TableCell>{cria.nombre}</TableCell>
                <TableCell>
                  <Chip
                    icon={cria.sexo === 'H' ? <FemaleIcon /> : <MaleIcon />}
                    label={cria.sexo === 'H' ? 'Hembra' : 'Macho'}
                    size="small"
                    color={cria.sexo === 'H' ? 'secondary' : 'primary'}
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>
                  {format(new Date(cria.fechaNacimiento), 'dd/MM/yyyy', { locale: es })}
                </TableCell>
                <TableCell>
                  <IconButton
                    component={RouterLink}
                    to={`/animales/${cria.id}`}
                    color="primary"
                    size="small"
                    title="Ver detalle"
                  >
                    <VisibilityIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default CriasTab;
