import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  title: "Finanças — Inteligência de Fluxo de Caixa",
  description: "Gestão financeira pessoal com simulador, otimizador de dívidas e alertas preditivos.",
};

export const viewport: Viewport = { themeColor: "#0f0f0e" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <body className="min-h-screen font-sans">{children}</body>
    </html>
  );
}
