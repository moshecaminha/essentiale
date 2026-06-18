import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Essentiale · Inteligência Comercial",
  description: "Painel de gestão e inteligência de mercado da Essentiale Fragrance",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
