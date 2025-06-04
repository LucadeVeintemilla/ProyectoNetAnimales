import React from 'react';
import { Box, Typography, Button, Container, Paper } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '80vh',
      }}
    >
      <Container maxWidth="md">
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h1" component="h1" gutterBottom>
            404
          </Typography>
          <Typography variant="h4" component="h2" gutterBottom>
            Página no encontrada
          </Typography>
          <Typography variant="body1" sx={{ mb: 3 }}>
            Lo sentimos, la página que estás buscando no existe o ha sido movida.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => navigate('/')}
          >
            Volver al inicio
          </Button>
        </Paper>
      </Container>
    </Box>
  );
};

export default NotFoundPage;
