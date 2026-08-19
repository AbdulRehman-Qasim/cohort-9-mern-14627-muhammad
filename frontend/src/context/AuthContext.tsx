import React, { createContext, useState, useEffect, ReactNode } from 'react';
import authService from '../services/auth.service';
import { setSessionId } from '../services/api';
import { User, ApiResponse } from '../types/auth.types';

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<ApiResponse<User>>;
  register: (name: string, email: string, password: string) => Promise<ApiResponse<User>>;
  logout: () => Promise<void>;
}

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAuthenticated: false,
  login: async () => ({ success: false }),
  register: async () => ({ success: false }),
  logout: async () => {},
});

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isActive = true;

    const initializeAuth = async () => {
      try {
        const response = await authService.getCurrentUser();
        if (isActive) {
          if (response.success && response.data) {
            const newSessionId = `session_${Date.now()}`;
            setSessionId(newSessionId);
            setUser(response.data);
          } else {
            setSessionId(null);
            setUser(null);
          }
        }
      } catch {
        if (isActive) {
          setSessionId(null);
          setUser(null);
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    const handleUnauthorized = () => {
      setSessionId(null);
      setUser(null);
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, []);

  const login = async (email: string, password: string): Promise<ApiResponse<User>> => {
    try {
      const response = await authService.login(email, password);
      if (response.success && response.data) {
        const newSessionId = `session_${Date.now()}`;
        setSessionId(newSessionId);
        setUser(response.data);
      }
      return response;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      return { success: false, error: errorMessage };
    }
  };

  const register = async (name: string, email: string, password: string): Promise<ApiResponse<User>> => {
    try {
      return await authService.register(name, email, password);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      return { success: false, error: errorMessage };
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await authService.logout();
    } catch {
      // Ignore logout API failures if session is already invalid
    } finally {
      setSessionId(null);
      setUser(null);
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
