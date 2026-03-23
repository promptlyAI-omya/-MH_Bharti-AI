import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import BottomNav from "@/components/BottomNav";
import RazorpayBootstrap from "@/components/RazorpayBootstrap";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ToastProvider } from "@/components/ToastProvider";
import SupabaseProvider from "@/components/SupabaseProvider";
import StickyAIChatButton from "@/components/StickyAIChatButton";
import GlobalAICredits from "@/components/GlobalAICredits";
import BetaBanner from "@/components/BetaBanner";


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
  return (
    <html lang="mr">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body className="antialiased text-white light-theme:text-gray-900 transition-colors duration-300">
        <Script
          strategy="afterInteractive"
          src={'https://www.googletagmanager.com/gtag/js?id=G-1CBHZJRW9T'}
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', 'G-1CBHZJRW9T');
          `}
        </Script>
        <RazorpayBootstrap />
        <Script id="sw-register" strategy="afterInteractive">
          {`
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js').catch(function() {});
              });
            }
          `}
        </Script>
        <ToastProvider>
          <ThemeProvider>
            <SupabaseProvider>
              <GlobalAICredits />
              
              {/* Persistent Beta Badge */}
              <div className="absolute top-4 left-4 z-50 pointer-events-none opacity-80">
                <div className="bg-saffron text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-lg shadow-saffron/20">
                  <span className="text-[10px]">🔧</span> Beta
                </div>
              </div>

              <main className="min-h-screen pb-20">{children}</main>
              
              <BetaBanner />
              <StickyAIChatButton />
              <BottomNav />
            </SupabaseProvider>
          </ThemeProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
