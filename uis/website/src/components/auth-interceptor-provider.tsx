'use client';

import { ReactNode } from 'react';
import { useAuthInterceptor } from '@/hooks/useAuthInterceptor';

export interface AuthInterceptorProviderProps {
  children: ReactNode;
}

export function AuthInterceptorProvider({ children }: AuthInterceptorProviderProps) {
  useAuthInterceptor();
  return <>{children}</>;
}
