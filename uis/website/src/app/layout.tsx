import type { Metadata } from 'next';
import './globals.css';
import { AuthInterceptorProvider } from '@/components/auth-interceptor-provider';

export const metadata: Metadata = {
  title: 'Nexova | Headhunting, soporte y formación corporativa',
  description:
    'Búsqueda ejecutiva, equipos de soporte al cliente y formación corporativa con condiciones claras y servicios independientes.',
  icons: { icon: '/favicon.svg' },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>
        <AuthInterceptorProvider>{children}</AuthInterceptorProvider>
      </body>
    </html>
  );
}
