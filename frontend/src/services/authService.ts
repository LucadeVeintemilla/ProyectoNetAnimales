import api from './api';

export interface RegisterRequest {
  nombreCompleto: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  email: string;
  displayName: string;
  roles: string[];
}

export const authService = {
  register: async (userData: RegisterRequest): Promise<void> => {
    try {
      const response = await api.post('/auth/register', userData);
      console.log('Usuario registrado exitosamente:', response.data);
      // Opcional: Iniciar sesión automáticamente después del registro
      // await authService.login({
      //   email: userData.email,
      //   password: userData.password
      // });
    } catch (error) {
      console.error('Error en el registro:', error);
      throw error;
    }
  },


  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    try {
      const response = await api.post<LoginResponse>('/auth/login', credentials);
      
      if (response.data && response.data.token) {
        // Solo guardar en localStorage si la respuesta contiene un token válido
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify({
          email: response.data.email,
          displayName: response.data.displayName,
          roles: response.data.roles
        }));
        return response.data;
      } else {
        // Si no hay token pero la respuesta es exitosa, lanzar un error
        throw new Error('Respuesta de autenticación inválida');
      }
    } catch (error: any) {
      console.error('Error en login:', error);
      // No recargar la página, simplemente propagar el error para que sea manejado por el componente
      throw error;
    }
  },

  logout: (): void => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  },

  getCurrentUser: (): { email: string; displayName: string; roles: string[] } | null => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  isAuthenticated: (): boolean => {
    return localStorage.getItem('token') !== null;
  },

  hasRole: (role: string): boolean => {
    const user = authService.getCurrentUser();
    return user ? user.roles.includes(role) : false;
  },

  getAuthHeader: (): { Authorization: string } | {} => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }
};

export default authService;
