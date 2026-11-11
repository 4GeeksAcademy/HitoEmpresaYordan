'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { register } from '@/lib/api';
import { login } from '@nexova/auth';

export default function RegisterForm() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});
    setIsLoading(true);

    try {
      // Step 1: Register the user
      const registerPayload = {
        email: formData.email,
        password: formData.password,
        first_name: formData.first_name,
        last_name: formData.last_name,
      };

      await register(registerPayload);

      // Step 2: Automatically login with the same credentials
      await login({ email: formData.email, password: formData.password });
      router.push('/dashboard');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Registration failed';
      
      // Try to parse field-level errors if they come from API
      if (errorMessage.includes('email')) {
        setErrors({ email: errorMessage });
      } else if (errorMessage.includes('password')) {
        setErrors({ password: errorMessage });
      } else {
        setErrors({ general: errorMessage });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto rounded-[2rem] border border-white/25 bg-white/10 p-7 text-white shadow-[0_18px_60px_rgba(2,6,23,0.55)] backdrop-blur-2xl">
      <p className="text-sm font-semibold text-slate-400">Nexova Solutions</p>
      <h2 className="text-2xl font-bold mt-2 mb-6">Crear cuenta</h2>

      {errors.general && (
        <div className="mb-4 p-4 bg-red-900/30 border border-red-400/30 text-red-300 rounded-xl">
          {errors.general}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-1">
            Correo electrónico <span className="text-red-400">*</span>
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            value={formData.email}
            onChange={handleChange}
            className={`w-full px-4 py-2.5 rounded-xl border bg-[#0A0E1F] text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 ${
              errors.email
                ? 'border-red-400/60 focus:ring-red-400/40'
                : 'border-white/20 focus:border-cyan-400/60 focus:ring-cyan-400/20'
            }`}
            placeholder="tu@correo.com"
          />
          {errors.email && <p className="text-red-400 text-sm mt-1">{errors.email}</p>}
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-1">
            Contraseña <span className="text-red-400">*</span>
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            value={formData.password}
            onChange={handleChange}
            className={`w-full px-4 py-2.5 rounded-xl border bg-[#0A0E1F] text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 ${
              errors.password
                ? 'border-red-400/60 focus:ring-red-400/40'
                : 'border-white/20 focus:border-cyan-400/60 focus:ring-cyan-400/20'
            }`}
            placeholder="••••••••"
          />
          {errors.password && <p className="text-red-400 text-sm mt-1">{errors.password}</p>}
        </div>

        <div>
          <label htmlFor="first_name" className="block text-sm font-medium text-slate-300 mb-1">
            Nombre
          </label>
          <input
            id="first_name"
            name="first_name"
            type="text"
            value={formData.first_name}
            onChange={handleChange}
            className="w-full px-4 py-2.5 rounded-xl border border-white/20 bg-[#0A0E1F] text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:border-cyan-400/60 focus:ring-cyan-400/20"
            placeholder="Tu nombre"
          />
        </div>

        <div>
          <label htmlFor="last_name" className="block text-sm font-medium text-slate-300 mb-1">
            Apellidos
          </label>
          <input
            id="last_name"
            name="last_name"
            type="text"
            value={formData.last_name}
            onChange={handleChange}
            className="w-full px-4 py-2.5 rounded-xl border border-white/20 bg-[#0A0E1F] text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:border-cyan-400/60 focus:ring-cyan-400/20"
            placeholder="Tus apellidos"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-xl border border-cyan-200/80 bg-cyan-300/20 py-2.5 text-sm font-bold text-cyan-50 shadow-[0_0_22px_rgba(34,211,238,0.5)] transition hover:-translate-y-0.5 hover:bg-cyan-300/30 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Creando cuenta…' : 'Crear cuenta'}
        </button>
      </form>

      <div className="mt-6 text-center text-sm text-slate-400">
        ¿Ya tienes cuenta?{' '}
        <a href="/login" className="text-cyan-300 hover:underline font-medium">
          Inicia sesión aquí
        </a>
      </div>
    </div>
  );
}
