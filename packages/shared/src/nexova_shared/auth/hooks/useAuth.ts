"use client";

import { useCallback, useState } from "react";
import { getToken, setToken as setStorageToken, removeToken } from "../api";

export interface UseAuthReturn {
  token: string | null;
  isAuthenticated: boolean;
  login: (newToken: string) => void;
  logout: () => void;
  clearAuth: () => void;
}

/**
 * Hook compartido de autenticación.
 * Expone el token actual, estado de autenticación y acciones login/logout.
 *
 * A diferencia de la versión anterior, usa useState para que los
 * componentes que consumen el hook se re-rendericen al cambiar el token.
 */
export function useAuth(): UseAuthReturn {
  const [token, setTokenState] = useState<string | null>(() => getToken());
  const isAuthenticated = token !== null;

  const login = useCallback((newToken: string) => {
    setStorageToken(newToken);
    setTokenState(newToken);
  }, []);

  const logout = useCallback(() => {
    removeToken();
    setTokenState(null);
  }, []);

  const clearAuth = useCallback(() => {
    removeToken();
    setTokenState(null);
  }, []);

  return {
    token,
    isAuthenticated,
    login,
    logout,
    clearAuth,
  };
}