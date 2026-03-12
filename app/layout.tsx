import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gestao de Contas - LOCKS",
  description: "MVP interno de contas a pagar"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="bg-slate-50">{children}</body>
    </html>
  );
}


