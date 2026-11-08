'use client';

import { useCallback } from 'react';
import { getToken, setToken, removeToken } from '@/lib/api';

export interface UseAuthReturn {
  token: string | null;
  isAuthenticated: boolean;
  login: (token: string) => void;
  logout: () => void;
  clearAuth: () => void;
}

export function useAuth(): UseAuthReturn {
  const token = getToken();
  const isAuthenticated = !!token;

  const login = useCallback((newToken: string) => {
    setToken(newToken);
  }, []);

  const logout = useCallback(() => {
    removeToken();
  }, []);

  const clearAuth = useCallback(() => {
    removeToken();
  }, []);

  return {
    token,
    isAuthenticated,
    login,
    logout,
    clearAuth,
  };
}
