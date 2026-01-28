import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from 'sonner';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "WekangTrading - Professional Trading Performance Analytics",
  description: "Speed up your trading success! Real-time performance tracking, session analysis, and comprehensive analytics. Fast decisions, winning trades.",
  keywords: "trading journal, performance tracking, trade analytics, market session analysis, trading statistics, wekang trading",
  authors: [{ name: "WekangTrading" }],
  icons: {
    icon: [
      { url: "/logo.png", type: "image/png" },
      { url: "/favicon.ico" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#dc2626" },
    { media: "(prefers-color-scheme: dark)", color: "#dc2626" },
  ],
  openGraph: {
    title: "WekangTrading - Professional Trading Performance Analytics",
    description: "Speed up your trading success with real-time insights and comprehensive analytics",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "WekangTrading - Professional Trading Performance Analytics",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "WekangTrading - Professional Trading Performance Analytics",
    description: "Speed up your trading success with real-time insights and comprehensive analytics",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
