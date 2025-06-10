import axios from 'axios';

// Configuración base de axios
const api = axios.create({
  baseURL: 'http://localhost:5069/api', // Usando el puerto HTTP del backend
  headers: {
    'Content-Type': 'application/json',
  }
});

// Variable para rastrear si ya mostramos el mensaje de error
let hasShownConnectionError = false;

// Interceptor para añadir el token de autenticación a las peticiones
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores globales
api.interceptors.response.use(
  (response) => {
    // Reset connection error flag on successful response
    hasShownConnectionError = false;
    return response;
  },
  (error) => {
    // Handle network errors
    if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
      if (!hasShownConnectionError) {
        console.error('No se pudo conectar con el servidor. Asegúrate de que el backend esté en ejecución.');
        hasShownConnectionError = true;
      }
      return Promise.reject(error);
    }

    if (error.response) {
      // Handle HTTP errors
      switch (error.response.status) {
        case 401:
          // Only redirect if not already on login page
          if (!window.location.pathname.includes('/login')) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            // Use window.location.replace to prevent adding to browser history
            window.location.replace('/login');
          }
          break;
        case 400:
          // No hacer nada especial para errores 400 en la página de login
          // Permitir que el componente maneje el error
          if (window.location.pathname.includes('/login')) {
            console.warn('Error de autenticación - credenciales incorrectas');
          }
          break;
        case 403:
          console.error('Acceso denegado');
          break;
        case 404:
          console.error('Recurso no encontrado');
          break;
        case 500:
          console.error('Error del servidor');
          break;
        default:
          console.error('Error en la petición');
      }
    } else if (error.request) {
      // La petición fue hecha pero no se recibió respuesta
      console.error('No se pudo conectar con el servidor');
    } else {
      // Error al configurar la petición
      console.error('Error al configurar la petición', error.message);
    }
    return Promise.reject(error);
  }
);

export default api;
