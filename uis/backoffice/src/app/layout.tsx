import type { Metadata } from "next";
import { AppNav } from "@/src/components/app-nav";
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
        <div className="flex min-h-screen flex-col md:flex-row">
          <AppNav />
          <main className="flex-1 p-6 md:p-10">{children}</main>
        </div>
      </body>
    </html>
  );
}
