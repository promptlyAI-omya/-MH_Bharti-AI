"use client";

import { useAuth } from "@/components/SupabaseProvider";
import Link from "next/link";
import { LogIn, Sparkles } from "lucide-react";

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="max-w-md mx-auto px-4 pt-20 flex flex-col items-center">
        <div className="w-10 h-10 rounded-xl bg-saffron-gradient flex items-center justify-center animate-pulse-glow">
          <Sparkles size={20} className="text-white" />
        </div>
        <p className="text-sm text-gray-400 mt-4">लोड होत आहे...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 pt-16 flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-2xl bg-saffron/10 flex items-center justify-center mb-4">
          <LogIn size={28} className="text-saffron" />
        </div>
        <h2 className="text-lg font-bold text-white mb-2">लॉगिन आवश्यक आहे</h2>
        <p className="text-sm text-gray-400 mb-6 leading-relaxed">
          हे वैशिष्ट्य वापरण्यासाठी कृपया लॉगिन करा
        </p>
        <Link href="/login" className="btn-primary text-sm">
          लॉगिन करा →
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}
