'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

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
