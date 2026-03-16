"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCcw, Home } from "lucide-react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Optionally log the error to an error reporting service like Sentry or LogRocket
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-dark-bg flex flex-col items-center justify-center p-6 text-center">
      <div className="w-20 h-20 rounded-3xl bg-red-500/10 flex items-center justify-center mb-6">
        <AlertTriangle size={36} className="text-red-400" />
      </div>
      <h1 className="text-2xl font-bold text-white mb-3">काहीतरी चूक झाली!</h1>
      <p className="text-sm text-gray-400 max-w-sm mb-8 leading-relaxed">
        अपेक्षित त्रुटी आली आहे. कृपया पृष्ठ रिफ्रेश करा किंवा मुख्य पृष्ठावर परत जा.
      </p>
      
      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-xs">
        <button
          onClick={() => reset()}
          className="flex-1 btn-primary flex items-center justify-center gap-2"
        >
          <RefreshCcw size={16} />
          पुन्हा प्रयत्न करा
        </button>
        <Link
          href="/"
          className="flex-1 glass text-white flex items-center justify-center gap-2 py-3 rounded-xl border border-dark-border hover:bg-white/5 transition-colors"
        >
          <Home size={16} />
          मुख्य पृष्ठ
        </Link>
      </div>
    </div>
  );
}
