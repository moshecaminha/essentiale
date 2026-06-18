import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Essentiale Fragrance — Aromas que transformam o seu dia",
  description: "Velas, difusores e home sprays de fragrância autoral. Marca própria, feita à mão em Recife. Enviamos para todo o Brasil.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
