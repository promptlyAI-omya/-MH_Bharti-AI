"use client";

import { useAuth } from "./FirebaseAuthProvider";
import { Bot, AlertTriangle } from "lucide-react";

export default function GlobalAICredits() {
  const { profile } = useAuth();
  if (!profile || profile.ai_credits === undefined) return null;

  const total = profile.plan === "premium" ? 50 : 10;
  const remaining = profile.ai_credits;

  let text = `${remaining}/${total} AI शिल्लक`;
  if (remaining === 1) text = "फक्त 1 AI मदत शिल्लक";
  if (remaining === 0) text = "AI मदत संपली — उद्या 10 मिळतील";

  return (
    <div className="fixed top-4 right-4 z-50 animate-fade-in pointer-events-none">
      <div className={`
        glass rounded-full px-3 py-1.5 flex items-center gap-1.5 text-xs font-bold shadow-lg
        ${remaining === 0 ? "border-red-500/30 text-red-400 bg-red-500/10" :
          remaining === 1 ? "border-saffron/30 text-saffron bg-saffron/10" :
          "border-dark-border text-gray-300"
        }
      `}>
        {remaining === 0 ? <AlertTriangle size={12} className="text-red-400" /> :
         remaining === 1 ? <AlertTriangle size={12} className="text-saffron" /> :
         <Bot size={12} className="text-saffron" />}
        {text}
      </div>
    </div>
  );
}
