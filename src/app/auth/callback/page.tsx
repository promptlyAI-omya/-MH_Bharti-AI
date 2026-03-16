"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/SupabaseProvider";
import { Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function AuthCallbackPage() {
  const router = useRouter();
  const { user, profile, loading } = useAuth();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes("error")) {
      const params = new URLSearchParams(hash.replace("#", ""));
      const errorDesc = params.get("error_description");
      setErrorMsg(errorDesc || "Authentication failed");
    }
  }, []);

  useEffect(() => {
    // If not loading and profile is ready, user is fully signed in and database is updated
    if (!loading && user && profile) {
      router.replace("/");
    }
  }, [loading, user, profile, router]);

  // Timeout — if nothing happens in 10 seconds, show error
  useEffect(() => {
    if (errorMsg) return;
    
    // We wait up to 15 seconds for network/supabase resolution
    const timeout = setTimeout(() => {
      if (!user) {
        setErrorMsg("Login timeout — कृपया पुन्हा login करा.");
      }
    }, 15000);

    return () => clearTimeout(timeout);
  }, [user, errorMsg]);

  // Error state
  if (errorMsg) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6">
        <AlertCircle size={32} className="text-red-400" />
        <p className="text-sm text-red-400 text-center max-w-xs">{errorMsg}</p>
        <div className="flex gap-3 mt-4">
          <Link
            href="/login"
            className="px-4 py-2 bg-saffron text-white text-sm font-medium rounded-xl hover:bg-saffron/90 transition-colors"
          >
            पुन्हा Login करा
          </Link>
          <button
            onClick={() => (window.location.href = "/")}
            className="px-4 py-2 glass text-gray-300 text-sm font-medium rounded-xl border border-dark-border hover:bg-white/5 transition-colors"
          >
            Home वर जा
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <Loader2 size={32} className="text-saffron animate-spin" />
      <p className="text-sm text-gray-400">
        {!user ? "लॉगिन होत आहे..." : "प्रोफाइल सेट करत आहे..."}
      </p>
    </div>
  );
}
