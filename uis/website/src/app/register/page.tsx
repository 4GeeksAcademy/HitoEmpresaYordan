'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getToken } from '@/lib/api';
import RegisterForm from '@/components/register-form';

export default function RegisterPage() {
  const router = useRouter();

  useEffect(() => {
    const token = getToken();
    if (token) {
      router.push('/dashboard');
    }
  }, [router]);

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-[#070B16] p-4">
      <div className="fixed -left-16 top-20 h-56 w-56 rounded-full bg-cyan-300/25 blur-[90px] -z-10" />
      <div className="fixed right-0 top-24 h-64 w-64 rounded-full bg-fuchsia-300/20 blur-[110px] -z-10" />
      <RegisterForm />
    </main>
  );
}
