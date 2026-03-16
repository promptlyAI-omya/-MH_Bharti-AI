"use client";

import { useState, useRef, useEffect } from "react";
import {
  ArrowLeft,
  Send,
  Sparkles,
  Bot,
  User,
  Loader2,
  Crown,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/components/SupabaseProvider";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  model?: string;
  cached?: boolean;
  timestamp: Date;
}

const suggestedPrompts = [
  "भारतीय राज्यघटनेतील मूलभूत अधिकार कोणते?",
  "Police Bharti साठी Physical Test काय आहे?",
  "MPSC Prelim आणि Mains मध्ये काय फरक आहे?",
  "महाराष्ट्राचे प्रमुख राष्ट्रीय उद्यान कोणते?",
  "तलाठी पदाचे कार्य आणि जबाबदाऱ्या सांगा",
  "GK साठी सर्वात महत्त्वाचे विषय कोणते?",
];

export default function AiChatPage() {
  const { user, profile, refreshProfile } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: messageText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    // Auto-resize textarea back to normal
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
    }

    try {
      const res = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: messageText,
          user_id: user?.id || null,
        }),
      });

      const data = await res.json();

      if (res.status === 429) {
        // Credits exhausted
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: data.message || "AI credits संपले आहेत.",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, aiMessage]);
      } else if (data.response) {
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: data.response,
          model: data.model,
          cached: data.cached,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, aiMessage]);
      } else {
        const errorMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: data.error || "काहीतरी चूक झाली. पुन्हा प्रयत्न करा.",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMsg]);
      }

      // Refresh profile to get updated credits
      if (user) {
        await refreshProfile();
      }
    } catch {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "नेटवर्क त्रुटी. कृपया तुमचे इंटरनेट कनेक्शन तपासा.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    }

    setLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    // Auto-resize
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
  };

  const credits = profile?.ai_credits ?? null;

  return (
    <div className="max-w-md mx-auto flex flex-col h-screen">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-5 pb-3">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={16} />
          मागे
        </Link>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-saffron-gradient flex items-center justify-center">
            <Sparkles size={16} className="text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white">AI शिक्षक</h1>
            <p className="text-[9px] text-gray-500">Powered by Groq</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {credits !== null && (
            <div className="flex items-center gap-1 bg-saffron/10 px-2 py-1 rounded-lg">
              <Zap size={10} className="text-saffron" />
              <span className="text-[10px] font-bold text-saffron">
                {credits}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {messages.length === 0 ? (
          // Empty state with suggestions
          <div className="flex flex-col items-center pt-8">
            <div className="w-16 h-16 rounded-2xl bg-saffron/10 flex items-center justify-center mb-4 animate-pulse-glow">
              <Bot size={32} className="text-saffron" />
            </div>
            <h2 className="text-base font-bold text-white mb-1">
              AI शिक्षकाला विचारा
            </h2>
            <p className="text-xs text-gray-400 text-center mb-6 max-w-[260px]">
              परीक्षेशी संबंधित कोणताही प्रश्न विचारा — मराठी किंवा इंग्रजी मध्ये
            </p>

            {/* Suggested prompts */}
            <div className="w-full space-y-2">
              <p className="text-[10px] text-gray-500 font-medium px-1">
                💡 सुचवलेले प्रश्न
              </p>
              {suggestedPrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => sendMessage(prompt)}
                  className="w-full text-left glass rounded-xl p-3 text-xs text-gray-300 hover:bg-saffron/5 hover:border-saffron/20 transition-all duration-200 active:scale-[0.98]"
                >
                  {prompt}
                </button>
              ))}
            </div>

            {/* Premium upsell */}
            {profile?.plan !== "premium" && (
              <div className="w-full mt-4 p-3 rounded-xl bg-gradient-to-r from-saffron/10 to-navy/10 border border-saffron/10">
                <div className="flex items-center gap-2">
                  <Crown size={14} className="text-saffron" />
                  <span className="text-[10px] text-gray-400">
                    Free: {profile?.ai_credits ?? 5} चॅट/दिवस •{" "}
                    <Link
                      href="/profile"
                      className="text-saffron hover:underline"
                    >
                      Premium घ्या →
                    </Link>
                  </span>
                </div>
              </div>
            )}
          </div>
        ) : (
          // Chat messages
          <div className="space-y-3 pt-2">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 animate-fade-in ${
                  msg.role === "user" ? "flex-row-reverse" : ""
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    msg.role === "user"
                      ? "bg-saffron-gradient"
                      : "bg-navy/50 border border-navy-200/20"
                  }`}
                >
                  {msg.role === "user" ? (
                    <User size={14} className="text-white" />
                  ) : (
                    <Bot size={14} className="text-blue-400" />
                  )}
                </div>
                <div
                  className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 ${
                    msg.role === "user"
                      ? "bg-saffron/15 border border-saffron/20 rounded-tr-md"
                      : "glass rounded-tl-md"
                  }`}
                >
                  <p className="text-xs text-white leading-relaxed whitespace-pre-wrap">
                    {msg.content}
                  </p>
                  {msg.role === "assistant" && msg.model && (
                    <p className="text-[8px] text-gray-600 mt-1.5 flex items-center gap-1">
                      {msg.cached && "⚡ "}
                      {msg.model.includes("70b") ? "🧠 70B" : "⚡ 8B"}
                    </p>
                  )}
                </div>
              </div>
            ))}

            {/* Loading indicator */}
            {loading && (
              <div className="flex gap-2.5 animate-fade-in">
                <div className="w-7 h-7 rounded-lg bg-navy/50 border border-navy-200/20 flex items-center justify-center flex-shrink-0">
                  <Bot size={14} className="text-blue-400" />
                </div>
                <div className="glass rounded-2xl rounded-tl-md px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <Loader2 size={12} className="text-saffron animate-spin" />
                    <span className="text-[10px] text-gray-400">
                      विचार करत आहे...
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="px-4 pb-24 pt-2">
        <div className="glass rounded-2xl p-2 flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder="तुमचा प्रश्न टाका..."
            rows={1}
            className="flex-1 bg-transparent text-sm text-white placeholder:text-gray-600 resize-none py-2 px-2 focus:outline-none max-h-[120px]"
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            className="w-9 h-9 rounded-xl bg-saffron-gradient flex items-center justify-center flex-shrink-0 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-90"
          >
            <Send size={16} className="text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}
