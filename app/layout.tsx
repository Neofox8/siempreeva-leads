import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Siempre Eva — Leads",
  description: "Gestión de leads",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="min-h-screen font-sans antialiased">{children}</body>
    </html>
  );
}
