import type { Metadata } from 'next';
import './globals.css';
import { AuthInterceptorProvider } from '@/components/auth-interceptor-provider';

export const metadata: Metadata = {
  title: 'Nexova Solutions | Neo-Consulting',
  description:
    'Nexova Solutions: 15 años conectando talento entre Valencia y Miami para empresas de Retail, Finanzas y Tecnología.',
  icons: { icon: '/imagenes/favicon-nexova.svg' },
  robots: 'index, follow',
  other: {
    'theme-color': '#070B16',
    'geo.region': 'ES-VC',
    'geo.placename': 'Valencia',
    'geo.position': '39.4699;-0.3763',
    'ICBM': '39.4699, -0.3763',
  },
  openGraph: {
    type: 'website',
    locale: 'es_ES',
    title: 'Nexova Solutions | Consultora de Talento',
    description:
      'Consultora de recursos humanos y selección de talento para Retail, Finanzas y Tecnología entre Valencia y Miami.',
    url: 'https://nexovasolutions.com/',
    images: [{ url: 'https://nexovasolutions.com/imagenes/imagenhero.jpg' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Nexova Solutions | Consultora de Talento',
    description:
      '15 años conectando talento entre Valencia y Miami para empresas de Retail, Finanzas y Tecnología.',
    images: ['https://nexovasolutions.com/imagenes/imagenhero.jpg'],
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'EmploymentAgency',
  name: 'Nexova Solutions',
  url: 'https://nexovasolutions.com/',
  description:
    'Consultora de recursos humanos y selección de talento para empresas de Retail, Finanzas y Tecnología.',
  foundingDate: '2011',
  areaServed: ['ES', 'US'],
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Valencia',
    addressCountry: 'ES',
  },
  knowsAbout: [
    'Headhunting',
    'Outsourcing',
    'Corporate Training',
    'Pipeline de contenido asistido por IA',
    'Dashboard de métricas de marketing',
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className="scroll-smooth">
      <head>
        <link rel="canonical" href="https://nexovasolutions.com/" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="font-sans bg-[#070B16] text-white">
        <AuthInterceptorProvider>{children}</AuthInterceptorProvider>
      </body>
    </html>
  );
}
