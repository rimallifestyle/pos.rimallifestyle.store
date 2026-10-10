import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Rimal | Clothing Management System",
  description: "Clothing Warehouse + Multi-Outlet POS Management System for Rimal.",
};

import ToastProvider from "@/components/providers/ToastProvider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[var(--color-brand-background)] text-[var(--color-text-main)]">
        <ToastProvider />
        {children}
      </body>
    </html>
  );
}
