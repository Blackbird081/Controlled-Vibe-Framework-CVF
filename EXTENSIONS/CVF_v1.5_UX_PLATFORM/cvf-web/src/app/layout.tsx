import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CVF v1.5 UX Platform",
  description: "User không cần biết CVF để dùng CVF - AI without prompt engineering",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className="antialiased bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white">
        {children}
      </body>
    </html>
  );
}
