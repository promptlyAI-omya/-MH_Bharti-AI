"use client";

import dynamic from "next/dynamic";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ToastProvider } from "@/components/ToastProvider";
import FirebaseAuthProvider from "@/components/FirebaseAuthProvider";
import BottomNav from "@/components/BottomNav";
import ServiceWorkerManager from "@/components/ServiceWorkerManager";

// Dynamic imports — correctly inside "use client" boundary
const StickyAIChatButton = dynamic(
  () => import("@/components/StickyAIChatButton"),
  { ssr: false }
);
const GlobalAICredits = dynamic(
  () => import("@/components/GlobalAICredits"),
  { ssr: false }
);
const BetaBanner = dynamic(
  () => import("@/components/BetaBanner"),
  { ssr: false }
);

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <ThemeProvider>
        <FirebaseAuthProvider>
          <ServiceWorkerManager />
          <GlobalAICredits />
          
          <div className="absolute top-4 left-4 z-50 pointer-events-none opacity-80">
            <div className="bg-saffron text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-lg shadow-saffron/20">
              <span className="text-[10px]">🔧</span> Beta
            </div>
          </div>

          <main className="min-h-screen pb-20">{children}</main>
          
          <BetaBanner />
          <StickyAIChatButton />
          <BottomNav />
        </FirebaseAuthProvider>
      </ThemeProvider>
    </ToastProvider>
  );
}
