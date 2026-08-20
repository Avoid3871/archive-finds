import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { WishlistProvider } from "@/lib/wishlist/WishlistContext";
import "./globals.css";
import { SITE_CONFIG } from "@/lib/constants";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-geist-sans",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://archive-finds.vercel.app"),
  title: {
    default: `${SITE_CONFIG.name} — ${SITE_CONFIG.tagline}`,
    template: `%s | ${SITE_CONFIG.name}`,
  },
  description: SITE_CONFIG.description,
  keywords: [
    "Archive Fashion",
    "Helmut Lang",
    "Rick Owens",
    "Raf Simons",
    "Undercover",
    "Sugargoo",
    "Japanese Fashion",
    "Designer Clothing",
    "Grails",
  ],
  authors: [{ name: "Archive Finds" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_CONFIG.url,
    title: SITE_CONFIG.name,
    description: SITE_CONFIG.description,
    siteName: SITE_CONFIG.name,
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_CONFIG.name,
    description: SITE_CONFIG.description,
  },
  robots: {
    index: true,
    follow: true,
  },
};

import { Suspense } from "react";
import { CurrencyProvider } from "@/lib/currency/CurrencyContext";
import { PageviewTracker } from "@/components/analytics/PageviewTracker";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-white text-black font-sans selection:bg-black selection:text-white pb-16 md:pb-0">
        <Suspense fallback={null}>
          <PageviewTracker />
        </Suspense>
        <CurrencyProvider>
          <WishlistProvider>
            {children}
          </WishlistProvider>
        </CurrencyProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}


