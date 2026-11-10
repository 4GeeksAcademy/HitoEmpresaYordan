'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Hook que escucha el evento `auth:logout` y redirige a /login.
 * Se usa en el provider del layout raíz.
 */
export function useAuthInterceptor(): void {
  const router = useRouter();

  useEffect(() => {
    const handleLogout = () => {
      router.push('/login');
    };

    window.addEventListener('auth:logout', handleLogout);

    return () => {
      window.removeEventListener('auth:logout', handleLogout);
    };
  }, [router]);
}
