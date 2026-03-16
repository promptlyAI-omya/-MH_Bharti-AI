import type { Metadata, Viewport } from "next";
import "./globals.css";
import BottomNav from "@/components/BottomNav";
import SupabaseProvider from "@/components/SupabaseProvider";

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
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
      </head>
      <body className="antialiased">
        <SupabaseProvider>
          <main className="min-h-screen pb-20">{children}</main>
          <BottomNav />
        </SupabaseProvider>
      </body>
    </html>
  );
}
