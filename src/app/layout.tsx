// app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "../components/providers/providers";
//import { auth } from "../app/lib/auth";
import { AuthProvider } from "../app/lib/hooks/useAuth";
const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MedGuide",
  description: "Sistema de gestão de saúde",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <Providers>
          <AuthProvider>{children}</AuthProvider>
        </Providers>
      </body>
    </html>
  );
}
