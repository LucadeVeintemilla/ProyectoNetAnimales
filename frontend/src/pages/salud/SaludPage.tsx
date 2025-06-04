import React from 'react';
import { Box, Typography, Container, Paper } from '@mui/material';

const SaludPage: React.FC = () => {
  return (
    <Box sx={{ mt: 4, mb: 4 }}>
      <Container maxWidth="lg">
        <Paper sx={{ p: 3 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Gestión de Salud
          </Typography>
          <Typography variant="body1">
            Módulo de gestión de registros de salud de los animales.
          </Typography>
          {/* Aquí irá el contenido principal de la página de salud */}
        </Paper>
      </Container>
    </Box>
  );
};

export default SaludPage;
