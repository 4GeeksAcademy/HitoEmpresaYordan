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
      <main className="relative flex min-h-screen items-center justify-center bg-[#070B16] p-4">
        <div className="fixed -left-16 top-20 h-56 w-56 rounded-full bg-cyan-300/25 blur-[90px] -z-10" />
        <div className="fixed right-0 top-24 h-64 w-64 rounded-full bg-fuchsia-300/20 blur-[110px] -z-10" />
        <div className="text-center text-slate-400">Cargando...</div>
      </main>
    );
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-[#070B16] p-4">
      <div className="fixed -left-16 top-20 h-56 w-56 rounded-full bg-cyan-300/25 blur-[90px] -z-10" />
      <div className="fixed right-0 top-24 h-64 w-64 rounded-full bg-fuchsia-300/20 blur-[110px] -z-10" />
      <LoginForm />
    </main>
  );
}
