import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import { SnackbarProvider } from 'notistack';
import theme from './styles/theme';
import MainLayout from './layouts/MainLayout';
import DashboardPage from './pages/DashboardPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AnimalesPage from './pages/animales/AnimalesPage';
import AnimalDetallePage from './pages/animales/AnimalDetallePage';
import AnimalFormPage from './pages/animales/AnimalFormPage';
import ProduccionPage from './pages/produccion/ProduccionPage';
import ProduccionFormPage from './pages/produccion/ProduccionFormPage';
import ReproduccionPage from './pages/reproduccion/ReproduccionPage';
import ReproduccionFormPage from './pages/reproduccion/ReproduccionFormPage';
import ReproduccionDetallePage from './pages/reproduccion/ReproduccionDetallePage';

import SaludPage from './pages/salud/SaludPage';
import ReportesPage from './pages/reportes/ReportesPage';
import NotFoundPage from './pages/NotFoundPage';
import { AuthProvider, useAuth } from './context/AuthContext';

// Componente de ruta protegida
const ProtectedRoute: React.FC<{ element: React.ReactElement }> = ({ element }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }


  if (!isAuthenticated) {
    // Store the intended URL before redirecting to login
    const currentPath = window.location.pathname + window.location.search;
    if (currentPath !== '/login') {
      sessionStorage.setItem('redirectAfterLogin', currentPath);
    }
    return <Navigate to="/login" replace state={{ from: currentPath }} />;
  }

  return element;
};

// Componente de ruta pública solo para usuarios no autenticados
const PublicRoute: React.FC<{ element: React.ReactElement }> = ({ element }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (isAuthenticated) {
    // Redirect to dashboard or the intended URL after login
    const from = sessionStorage.getItem('redirectAfterLogin') || '/dashboard';
    sessionStorage.removeItem('redirectAfterLogin');
    return <Navigate to={from} replace />;
  }

  return element;
};

const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <SnackbarProvider maxSnack={3}>
        <Router>
          <AuthProvider>
            <Routes>
              {/* Ruta raíz redirige a login */}
              <Route path="/" element={<Navigate to="/login" replace />} />
              
              {/* Rutas públicas */}
              <Route path="/login" element={
                <PublicRoute element={<LoginPage />} />
              } />
              <Route path="/registro" element={
                <PublicRoute element={<RegisterPage />} />
              } />
              
              {/* Rutas protegidas */}
              <Route element={
                <ProtectedRoute element={<MainLayout />} />
              }>
                <Route path="/dashboard" element={<DashboardPage />} />
                
                {/* Animales */}
                <Route path="/animales">
                  <Route index element={<AnimalesPage />} />
                  <Route path="nuevo" element={<AnimalFormPage />} />
                  <Route path=":id" element={<AnimalDetallePage />} />
                  <Route path=":id/editar" element={<AnimalFormPage />} />
                </Route>
                
                {/* Producción de leche */}
                <Route path="/produccion">
                  <Route index element={<ProduccionPage />} />
                  <Route path="nuevo" element={<ProduccionFormPage />} />
                  <Route path=":id/editar" element={<ProduccionFormPage />} />
                </Route>
                
                {/* Reproducción */}
                <Route path="/reproduccion">
                  <Route index element={<ReproduccionPage />} />
                  <Route path="nuevo" element={<ReproduccionFormPage />} />
                  <Route path=":id" element={<ReproduccionDetallePage />} />
                  <Route path=":id/editar" element={<ReproduccionFormPage />} />
                </Route>
                
                {/* Salud */}
                <Route path="/salud" element={<SaludPage />} />
                
                {/* Reportes */}
                <Route path="/reportes" element={<ReportesPage />} />
                
                {/* Configuración */}
                <Route path="/configuracion" element={
                  <Box p={3}>
                    <Typography variant="h4">Configuración</Typography>
                    <Typography>Página de configuración en construcción</Typography>
                  </Box>
                } />
                
                {/* Redirigir cualquier otra ruta a dashboard */}
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Route>
            </Routes>
          </AuthProvider>
        </Router>
      </SnackbarProvider>
    </ThemeProvider>
  );
};

export default App;
