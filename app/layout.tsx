import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ClientOnly } from "@/components/ClientOnly";
import { AppShell } from "@/components/layout/AppShell";
import { InitDb } from "@/components/InitDb";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Planner Agência Furta Cor",
  description: "Planejador inteligente da Agência Furta Cor — agenda, pendências e metas",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Furta Cor",
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#D946EF",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`h-full antialiased ${inter.variable}`}>
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body className="min-h-full">
        <ClientOnly>
          <AppShell>{children}</AppShell>
        </ClientOnly>
      </body>
    </html>
  );
}
