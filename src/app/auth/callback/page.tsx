"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState("Logging in...");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    // With implicit flow, Supabase handles the hash fragment automatically
    // via onAuthStateChange in SupabaseProvider.
    // This page just waits for session to appear, then redirects.

    let redirected = false;

    const checkSession = async () => {
      // Check for error in hash
      const hash = window.location.hash;
      if (hash.includes("error")) {
        const params = new URLSearchParams(hash.replace("#", ""));
        const errorDesc = params.get("error_description");
        setErrorMsg(errorDesc || "Authentication failed");
        return;
      }

      // Wait a moment for Supabase SDK to process the hash
      await new Promise((r) => setTimeout(r, 500));

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        setStatus("Setting up profile...");

        // Auto-create user profile if it doesn't exist
        try {
          const { data: existingUser } = await supabase
            .from("users")
            .select("id")
            .eq("id", session.user.id)
            .single();

          if (!existingUser) {
            await supabase.from("users").upsert(
              {
                id: session.user.id,
                name:
                  session.user.user_metadata?.full_name ||
                  session.user.user_metadata?.name ||
                  null,
                phone: session.user.phone || null,
                plan: "free",
                ai_credits: 5,
                daily_question_count: 0,
                streak_count: 0,
              },
              { onConflict: "id" }
            );
          }
        } catch (err) {
          console.error("Profile setup error:", err);
        }

        redirected = true;
        router.replace("/");
        return;
      }

      // If no session yet, try again after a short delay
      if (!redirected) {
        setTimeout(checkSession, 1000);
      }
    };

    checkSession();

    // Timeout — if nothing happens in 10 seconds, show error
    const timeout = setTimeout(() => {
      if (!redirected) {
        setErrorMsg(
          "Login timeout — कृपया पुन्हा login करा."
        );
      }
    }, 10000);

    return () => {
      redirected = true;
      clearTimeout(timeout);
    };
  }, [router]);

  // Error state
  if (errorMsg) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6">
        <AlertCircle size={32} className="text-red-400" />
        <p className="text-sm text-red-400 text-center max-w-xs">{errorMsg}</p>
        <div className="flex gap-3 mt-2">
          <Link
            href="/login"
            className="px-4 py-2 bg-saffron text-white text-sm font-medium rounded-xl hover:bg-saffron/90 transition-colors"
          >
            पुन्हा Login करा
          </Link>
          <button
            onClick={() => (window.location.href = "/")}
            className="px-4 py-2 bg-dark-card text-gray-300 text-sm font-medium rounded-xl border border-dark-border hover:bg-dark-card/80 transition-colors"
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
      <p className="text-sm text-gray-400">{status}</p>
    </div>
  );
}
