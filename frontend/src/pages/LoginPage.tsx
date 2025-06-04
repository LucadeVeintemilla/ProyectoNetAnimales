import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  TextField,
  Typography,
  Link,
  InputAdornment,
  IconButton,
  CircularProgress,
  Alert,
} from '@mui/material';
import { Visibility, VisibilityOff, LockOutlined, EmailOutlined } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    
    // Basic validation
    if (!email || !password) {
      setError('Por favor ingrese su correo electrónico y contraseña');
      return;
    }
    
    try {
      setLoading(true);
      const success = await login(email, password);
      
      if (!success) {
        setError('Correo electrónico o contraseña incorrectos');
      }
      // No need to navigate here, the AuthContext will handle the redirect
    } catch (err: any) {
      console.error('Login error:', err);
      const errorMessage = err.response?.data?.message || 'Error al intentar iniciar sesión. Por favor, intente nuevamente.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // If already logged in, show loading indicator while redirecting
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Box mb={4} textAlign="center">
          <img 
            src="/logo192.png" 
            alt="Logo" 
            style={{ height: 80, marginBottom: 16 }} 
          />
          <Typography component="h1" variant="h5">
            Sistema de Gestión Ganadera
          </Typography>
        </Box>
        
        <Card sx={{ width: '100%', maxWidth: 400, boxShadow: 3 }}>
          <CardContent sx={{ p: 4 }}>
            <Typography component="h2" variant="h6" align="center" gutterBottom>
              Iniciar Sesión
            </Typography>
            
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}
            
            <Box component="form" onSubmit={handleSubmit} noValidate>
              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="Correo Electrónico"
                name="email"
                autoComplete="email"
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailOutlined color="action" />
                    </InputAdornment>
                  ),
                }}
              />
              
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Contraseña"
                type={showPassword ? 'text' : 'password'}
                id="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockOutlined color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={() => setShowPassword(!showPassword)}
                        onMouseDown={(e) => e.preventDefault()}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              
              <Box sx={{ mt: 2, mb: 2, textAlign: 'right' }}>
                <Link component={RouterLink} to="/recuperar-contrasena" variant="body2">
                  ¿Olvidaste tu contraseña?
                </Link>
              </Box>
              
              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading}
                sx={{ mt: 2, mb: 2, py: 1.5 }}
              >
                {loading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  'Iniciar Sesión'
                )}
              </Button>
              
              <Box sx={{ mt: 2, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  ¿No tienes una cuenta?{' '}
                  <Link component={RouterLink} to="/registro" variant="body2">
                    Regístrate
                  </Link>
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
        
        <Box mt={4} textAlign="center">
          <Typography variant="body2" color="text.secondary">
            © {new Date().getFullYear()} Sistema de Gestión Ganadera. Todos los derechos reservados.
          </Typography>
        </Box>
      </Box>
    </Container>
  );
};

export default LoginPage;
