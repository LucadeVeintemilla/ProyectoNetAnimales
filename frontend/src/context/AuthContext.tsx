import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';

interface User {
  id: number;
  username: string;
  displayName: string;
  roles: string[];
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  hasRole: (role: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type AuthProviderProps = {
  children: ReactNode;
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');
        
        if (token && storedUser) {
          try {
            // Verificar si el token es válido (parsearlo y comprobar la fecha de expiración)
            const tokenPayload = JSON.parse(atob(token.split('.')[1]));
            const tokenExp = tokenPayload.exp * 1000; // Convertir a milisegundos
            const currentTime = new Date().getTime();
            
            if (tokenExp > currentTime) {
              // Token aún es válido
              const userData = JSON.parse(storedUser);
              setUser(userData);
            } else {
              // Token expirado, limpiar datos de autenticación
              console.log('Token expirado, cerrando sesión');
              localStorage.removeItem('user');
              localStorage.removeItem('token');
            }
          } catch (error) {
            console.error('Error verificando el token:', error);
            // No eliminar el token en caso de error para evitar cierres inesperados de sesión
            // En su lugar, intentamos usar el usuario almacenado
            try {
              const userData = JSON.parse(storedUser);
              setUser(userData);
            } catch (e) {
              console.error('Error parseando datos de usuario:', e);
            }
          }
        }
      } catch (error) {
        console.error('Error verificando estado de autenticación:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
    
    // Ya no hacemos verificaciones periódicas para evitar cierres de sesión inesperados
    // const interval = setInterval(checkAuth, 5 * 60 * 1000);
    // return () => clearInterval(interval);
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      // Clear any existing auth data to prevent race conditions
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Call the auth service login
      const response = await authService.login({ 
        email: username, 
        password 
      });
      
      if (response && response.token) {
        // Update the auth state
        setUser({
          id: 1, // This should come from your API response
          username: response.email,
          displayName: response.displayName,
          roles: response.roles || []
        });
        
        // Solo navegar si la autenticación fue exitosa
        setTimeout(() => navigate('/dashboard'), 100);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Login failed:', error);
      // Clear any partial auth data on failure
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = (redirectToLogin = true) => {
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    if (redirectToLogin && !window.location.pathname.includes('/login')) {
      navigate('/login', { replace: true });
    }
  };

  const hasRole = (role: string): boolean => {
    return user?.roles?.includes(role) || false;
  };

  const value = {
    isAuthenticated: !!user,
    user,
    loading,
    login,
    logout,
    hasRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
