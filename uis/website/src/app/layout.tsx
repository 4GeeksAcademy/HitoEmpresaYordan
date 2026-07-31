import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Nexova Solutions | Neo-Consulting",
  description:
    "Nexova Solutions: 15 anos conectando talento entre Valencia y Miami para empresas de Retail, Finanzas y Tecnologia.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${plusJakartaSans.variable} h-full antialiased`}>
      <body className="min-h-full bg-[#070B16] text-white">{children}</body>
    </html>
  );
}
