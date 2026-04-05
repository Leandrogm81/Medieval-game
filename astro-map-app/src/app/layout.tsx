import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AstroMap - Mapa Astral com IA",
  description: "Calcule seu mapa astral completo com interpretação por inteligência artificial. Grátis e sem cadastro.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark">
      <body className={`${inter.variable} font-sans min-h-screen text-slate-200`} style={{ backgroundColor: '#0f172a' }}>
        {children}
      </body>
    </html>
  );
}
