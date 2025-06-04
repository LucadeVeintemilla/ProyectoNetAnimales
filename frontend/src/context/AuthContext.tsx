import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import api from '../services/api';

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
            // Validate the token with the backend
            const response = await api.get('/auth/validate-token', {
              headers: { Authorization: `Bearer ${token}` }
            });
            
            if (response.status === 200) {
              const userData = JSON.parse(storedUser);
              setUser(userData);
            } else {
              // Token is invalid, clear auth data
              localStorage.removeItem('user');
              localStorage.removeItem('token');
            }
          } catch (error) {
            console.error('Error validating token:', error);
            localStorage.removeItem('user');
            localStorage.removeItem('token');
          }
        }
      } catch (error) {
        console.error('Error checking auth state:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
    
    // Set up a timer to check token validity periodically
    const interval = setInterval(checkAuth, 5 * 60 * 1000); // Check every 5 minutes
    
    return () => clearInterval(interval);
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
      
      if (response.token) {
        // Update the auth state
        setUser({
          id: 1, // This should come from your API response
          username: response.email,
          displayName: response.displayName,
          roles: response.roles || []
        });
        
        navigate('/dashboard');
        
        navigate('/dashboard');
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
