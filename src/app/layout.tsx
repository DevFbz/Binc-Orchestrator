import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Binc OS — Orchestrator",
  description: "Control plane operacional para projetos, automações e governança.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
