import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ClientProviders } from "@/components/ClientProviders";
import ChunkLoadRecovery from "@/components/ChunkLoadRecovery";

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "CVF v1.6 Agent Platform",
  description: "Controlled Vibe Framework — AI-assisted coding with governance, not guesswork",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white">
        <ChunkLoadRecovery />
        <ClientProviders>
          {children}
        </ClientProviders>
      </body>
    </html>
  );
}
