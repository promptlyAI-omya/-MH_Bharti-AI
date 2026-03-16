"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Loader2, AlertCircle } from "lucide-react";
import { Suspense } from "react";
import Link from "next/link";

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState("Logging in...");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get("code");
      const error = searchParams.get("error");
      const errorDescription = searchParams.get("error_description");

      if (error) {
        setErrorMsg(errorDescription || error || "Authentication failed");
        return;
      }

      if (!code) {
        // No code in URL — check if user already has a session
        // (Supabase may have already handled the callback via hash fragment)
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          router.replace("/");
          return;
        }
        setErrorMsg("No authentication code found. Please try logging in again.");
        return;
      }

      try {
        // Add timeout to prevent infinite loading
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Login timeout — 15 सेकंदात response आला नाही. कृपया पुन्हा login करा.")), 15000)
        );

        const exchangePromise = supabase.auth.exchangeCodeForSession(code);

        const { data, error: sessionError } = await Promise.race([
          exchangePromise,
          timeoutPromise,
        ]);

        if (sessionError) {
          console.error("Session exchange error:", sessionError);
          setErrorMsg(`Login failed: ${sessionError.message}`);
          return;
        }

        if (!data.user) {
          setErrorMsg("Login failed: No user data received.");
          return;
        }

        // Auto-create user profile if it doesn't exist
        setStatus("Setting up profile...");
        const { data: existingUser } = await supabase
          .from("users")
          .select("id")
          .eq("id", data.user.id)
          .single();

        if (!existingUser) {
          await supabase.from("users").upsert(
            {
              id: data.user.id,
              name:
                data.user.user_metadata?.full_name ||
                data.user.user_metadata?.name ||
                null,
              phone: data.user.phone || null,
              plan: "free",
              ai_credits: 5,
              daily_question_count: 0,
              streak_count: 0,
            },
            { onConflict: "id" }
          );
        }

        // Redirect to home
        router.replace("/");
      } catch (err) {
        console.error("Callback error:", err);
        setErrorMsg(
          err instanceof Error
            ? err.message
            : "Something went wrong. Please try again."
        );
      }
    };

    handleCallback();
  }, [router, searchParams]);

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
            onClick={() => router.replace("/")}
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

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col items-center justify-center gap-4">
          <Loader2 size={32} className="text-saffron animate-spin" />
          <p className="text-sm text-gray-400">Loading...</p>
        </div>
      }
    >
      <CallbackHandler />
    </Suspense>
  );
}

