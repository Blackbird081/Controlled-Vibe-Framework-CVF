import "./globals.css";
import { ReactNode } from "react";
import ClientProviders from "@/components/ClientProviders";

export const metadata = {
  title: "CVF – Controlled Vibe Framework V1.7",
  description: "Governance Dashboard for AI-driven Development",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}