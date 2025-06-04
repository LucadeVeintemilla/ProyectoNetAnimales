import React from 'react';
import { Box, Typography, Container, Paper } from '@mui/material';

const ReportesPage: React.FC = () => {
  return (
    <Box sx={{ mt: 4, mb: 4 }}>
      <Container maxWidth="lg">
        <Paper sx={{ p: 3 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Reportes y Análisis
          </Typography>
          <Typography variant="body1">
            Módulo de generación de reportes y análisis de datos.
          </Typography>
          {/* Aquí irá el contenido principal de la página de reportes */}
        </Paper>
      </Container>
    </Box>
  );
};

export default ReportesPage;
