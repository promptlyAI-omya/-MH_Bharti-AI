"use client";

import { useEffect, useState } from "react";
import { MessageCircle, Rocket, Wrench, TrendingUp, Sparkles } from "lucide-react";

export default function BetaBanner() {
  const [show, setShow] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    // Only show if not seen before
    const hasSeen = localStorage.getItem("mhbharti_beta_seen");
    if (hasSeen === "true") return;

    // 1.5s delay after mount
    const timer = setTimeout(() => {
      setShouldRender(true);
      // Small tick for CSS transition to grab
      setTimeout(() => setShow(true), 50);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    localStorage.setItem("mhbharti_beta_seen", "true");
    setShow(false);
    // Remove from DOM after fade out completes
    setTimeout(() => setShouldRender(false), 300);
  };

  if (!shouldRender) return null;

  return (
    <div 
      className={`fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
        show ? "opacity-100" : "opacity-0"
      }`}
    >
      <div 
        className={`relative w-full max-w-[340px] bg-[#1a1a1a] border border-saffron/20 rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 transform ${
          show ? "scale-100 translate-y-0" : "scale-95 translate-y-4"
        }`}
      >
        {/* Header Ribbon */}
        <div className="bg-saffron/10 px-5 py-4 border-b border-saffron/20 flex items-center justify-center gap-2">
          <Rocket size={20} className="text-saffron" />
          <h2 className="text-white font-bold tracking-wide">Beta Version 1.2</h2>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4">
          <p className="text-white font-medium text-center text-sm leading-relaxed mb-6">
            MH_Bharti AI अजून तयार होत आहे! <br />
            (Work in Progress)
          </p>

          <div className="space-y-4">
            <div className="flex items-start gap-3 bg-white/5 p-3 rounded-xl border border-white/5">
              <div className="p-1.5 bg-red-500/10 rounded-lg text-red-400 mt-0.5"><Wrench size={16}/></div>
              <p className="text-xs text-gray-300 leading-relaxed"><strong className="text-white">काही errors येऊ शकतात —</strong> घाबरू नका, आम्ही रोज हे Fix करत आहोत.</p>
            </div>

            <div className="flex items-start gap-3 bg-white/5 p-3 rounded-xl border border-white/5">
              <div className="p-1.5 bg-blue-500/10 rounded-lg text-blue-400 mt-0.5"><Sparkles size={16}/></div>
              <p className="text-xs text-gray-300 leading-relaxed"><strong className="text-white">AI System —</strong> अधिक अचूक व उपयुक्त बनवण्याचे काम चालू आहे.</p>
            </div>

            <div className="flex items-start gap-3 bg-white/5 p-3 rounded-xl border border-white/5 mb-6">
              <div className="p-1.5 bg-green-500/10 rounded-lg text-green-400 mt-0.5"><TrendingUp size={16}/></div>
              <p className="text-xs text-gray-300 leading-relaxed"><strong className="text-white">नवीन Features —</strong> रोज सुधारत आहोत आणि लवकरच नवीन mock tests येतील.</p>
            </div>
          </div>

          <div className="text-center mt-6 pt-6 border-t border-white/10">
            <p className="text-sm font-bold text-saffron mb-4">
              तुम्ही महाराष्ट्राच्या पहिल्या AI Bharti App चे पहिले users आहात! 🎉
            </p>

            <a 
              href="https://wa.me/917821017501" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 bg-[#25D366]/10 text-[#25D366] border border-[#25D366]/30 hover:bg-[#25D366]/20 transition-colors rounded-xl font-bold text-sm mb-3"
            >
              <MessageCircle size={18} />
              WhatsApp वर Feedback द्या
            </a>

            <button 
              onClick={handleDismiss}
              className="w-full py-3 bg-saffron text-white rounded-xl font-bold text-sm shadow-[0_0_15px_rgba(255,107,0,0.3)] hover:shadow-[0_0_20px_rgba(255,107,0,0.5)] transition-all active:scale-[0.98]"
            >
              समजले! चालू करूया →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
