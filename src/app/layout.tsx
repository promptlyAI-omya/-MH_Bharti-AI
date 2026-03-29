import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Noto_Sans_Devanagari, Inter } from "next/font/google";
import "./globals.css";
import ClientProviders from "@/components/ClientProviders";

const notoSansDevanagari = Noto_Sans_Devanagari({
  subsets: ["devanagari", "latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-noto",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "MH_Bharti AI | महाराष्ट्राचं स्वतःचं Exam Prep AI",
  description:
    "Maharashtra government exam preparation with AI - Police Bharti, MPSC, Talathi, Gramsevak. AI-powered practice, mock tests, and smart analysis.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "MH Bharti AI",
  },
  openGraph: {
    title: "MH_Bharti AI",
    description: "महाराष्ट्राचं स्वतःचं Exam Prep AI",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#FF6B00",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const analyticsEnabled = process.env.NODE_ENV === "production";

  return (
    <html lang="mr" className={`${notoSansDevanagari.variable} ${inter.variable}`}>
      <head>
        <meta name="google-site-verification" content="ORmPCVlplk1O3K23jK4Fue6Y3vjD3uP5O-NwpceEGRU" />
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body className="antialiased text-white light-theme:text-gray-900 transition-colors duration-300">
        {analyticsEnabled && (
          <>
            <Script
              strategy="lazyOnload"
              src="https://www.googletagmanager.com/gtag/js?id=G-1CBHZJRW9T"
            />
            <Script id="google-analytics" strategy="lazyOnload">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', 'G-1CBHZJRW9T');
              `}
            </Script>
          </>
        )}
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
