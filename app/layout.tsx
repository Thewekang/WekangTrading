import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from 'sonner';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "WekangTrading - Professional Trading Performance Analytics",
  description: "Master your trading performance with real-time tracking, session analysis, and comprehensive analytics. Track every trade, analyze timing patterns, and optimize your strategy.",
  keywords: "trading journal, performance tracking, trade analytics, market session analysis, trading statistics",
  authors: [{ name: "WekangTrading" }],
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    title: "WekangTrading - Professional Trading Performance Analytics",
    description: "Master your trading performance with real-time insights and comprehensive analytics",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
