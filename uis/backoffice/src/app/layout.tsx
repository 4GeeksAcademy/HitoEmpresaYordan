import type { Metadata } from "next";
import { AuthGate } from "@/src/components/auth-gate";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nexova Backoffice",
  description: "Herramientas internas de operaciones de Nexova.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="min-h-full">
        <AuthGate>{children}</AuthGate>
      </body>
    </html>
  );
}
