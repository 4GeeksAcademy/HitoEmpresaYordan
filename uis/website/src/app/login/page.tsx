'use client';

import { useEffect, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import { getToken } from '@/lib/api';
import LoginForm from '@/components/login-form';

function subscribeToToken(onStoreChange: () => void) {
  window.addEventListener('storage', onStoreChange);
  return () => window.removeEventListener('storage', onStoreChange);
}

function getServerTokenSnapshot(): string | null | undefined {
  return undefined;
}

export default function LoginPage() {
  const router = useRouter();
  const token = useSyncExternalStore(subscribeToToken, getToken, getServerTokenSnapshot);

  useEffect(() => {
    if (token) {
      router.push('/dashboard');
    }
  }, [router, token]);

  if (token === undefined || token) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="text-center text-gray-700">Cargando...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <LoginForm />
    </main>
  );
}
