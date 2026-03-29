"use client";

import { MessageSquare } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/FirebaseAuthProvider";
import { useToast } from "@/components/ToastProvider";

export default function StickyAIChatButton() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();

  if (pathname === "/ai-chat" || pathname.startsWith("/ai-chat/")) {
    return null;
  }

  const handleClick = () => {
    if (!user) {
      toast("AI साठी login करा");
      router.push("/login");
    } else {
      router.push("/ai-chat");
    }
  };

  return (
    <button
      onClick={handleClick}
      className="fixed bottom-24 right-4 z-50 w-14 h-14 rounded-full bg-saffron text-white flex items-center justify-center shadow-lg shadow-saffron/30 hover:bg-saffron-600 transition-all duration-300 animate-slide-up group"
      aria-label="Open AI Chat"
    >
      <MessageSquare 
        size={24} 
        className="group-hover:scale-110 transition-transform duration-300" 
      />
    </button>
  );
}
