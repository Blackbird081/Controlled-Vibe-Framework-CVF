import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ClientProviders } from "@/components/ClientProviders";
import ChunkLoadRecovery from "@/components/ChunkLoadRecovery";
import { THEME_INIT_SCRIPT } from "@/lib/theme-init-script";

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "CVF Agent Platform",
  description: "Controlled Vibe Framework — AI-assisted coding with governance, not guesswork",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Applies the saved app theme (default dark) before first paint; see theme-init-script.ts */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="antialiased bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white">
        <ChunkLoadRecovery />
        <ClientProviders>
          {children}
        </ClientProviders>
      </body>
    </html>
  );
}
