import React from 'react';
import { Container, Box } from '@mui/material';
import { Outlet } from 'react-router-dom';
import SaludTabs from './SaludTabs';

const SaludPage: React.FC = () => {
  return (
    <Box sx={{ mt: 4, mb: 4 }}>
      <Container maxWidth="lg">
        <SaludTabs />
        <Outlet />
      </Container>
    </Box>
  );
};

export default SaludPage;
