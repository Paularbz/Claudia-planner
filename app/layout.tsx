import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ClientOnly } from "@/components/ClientOnly";
import { AppShell } from "@/components/layout/AppShell";
import { InitDb } from "@/components/InitDb";

export const metadata: Metadata = {
  title: "Planner da Amanda",
  description: "Planejador pessoal inteligente — agenda, pendências e metas",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Planner",
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#8B5CF6",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
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
