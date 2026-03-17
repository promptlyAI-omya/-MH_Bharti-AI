import type { Metadata, Viewport } from "next";
import "./globals.css";
import BottomNav from "@/components/BottomNav";
import RazorpayBootstrap from "@/components/RazorpayBootstrap";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ToastProvider } from "@/components/ToastProvider";
import SupabaseProvider from "@/components/SupabaseProvider";
import StickyAIChatButton from "@/components/StickyAIChatButton";
import { RAZORPAY_CHECKOUT_SRC } from "@/lib/razorpay-client";

export const metadata: Metadata = {
// ... existing metadata ...
};

export const viewport: Viewport = {
// ... existing viewport ...
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
        <link rel="preload" href={RAZORPAY_CHECKOUT_SRC} as="script" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
      </head>
      <body className="antialiased text-white light-theme:text-gray-900 transition-colors duration-300">
        <RazorpayBootstrap />
        <ToastProvider>
          <ThemeProvider>
            <SupabaseProvider>
              <main className="min-h-screen pb-20">{children}</main>
              <StickyAIChatButton />
              <BottomNav />
            </SupabaseProvider>
          </ThemeProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
