"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Moon, Info, Trash2, ChevronRight, Check } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const router = useRouter();
  
  const [darkMode, setDarkMode] = useState(true);
  const [language, setLanguage] = useState<"mr" | "hi">("mr");
  
  useEffect(() => {
    // Basic init from local storage
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "false") setDarkMode(false);
    
    const savedLang = localStorage.getItem("language");
    if (savedLang === "hi") setLanguage("hi");
  }, []);

  const handleDarkModeToggle = () => {
    const newVal = !darkMode;
    setDarkMode(newVal);
    localStorage.setItem("theme", String(newVal));
    
    // Optional: actually toggle a class if global.css supports .light-mode
    // document.documentElement.classList.toggle("light-mode", !newVal);
  };

  const handleLanguageChange = (lang: "mr" | "hi") => {
    setLanguage(lang);
    localStorage.setItem("language", lang);
    // Reload or emit event to reflect language changes
  };

  const handleClearCache = () => {
    if (confirm("तुम्हाला खात्री आहे का? तुमचा सर्व स्थानिक डेटा नष्ट होईल.")) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-dark-bg flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 glass border-b border-dark-border px-4 py-4 flex items-center justify-between">
        <button 
          onClick={() => router.back()}
          className="text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-bold text-white absolute left-1/2 -translate-x-1/2">
          सेटिंग्ज
        </h1>
        <div className="w-5" /> {/* Spacer */}
      </div>

      <div className="flex-1 px-4 py-6 space-y-6">
        
        {/* App Appearance */}
        <section className="animate-slide-up">
          <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 px-1">
            देखावा (Appearance)
          </h2>
          <div className="glass rounded-xl overflow-hidden divide-y divide-dark-border">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-dark-bg flex items-center justify-center flex-shrink-0">
                  <Moon size={16} className="text-gray-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">डार्क मोड</p>
                  <p className="text-[10px] text-gray-500">अॅपचा रंग गडद करा</p>
                </div>
              </div>
              <button 
                onClick={handleDarkModeToggle}
                className={`w-11 h-6 rounded-full transition-colors relative ${darkMode ? 'bg-saffron' : 'bg-gray-600'}`}
              >
                <div 
                  className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${darkMode ? 'translate-x-6' : 'translate-x-1'}`}
                />
              </button>
            </div>
          </div>
        </section>

        {/* Language */}
        <section className="animate-slide-up" style={{ animationDelay: "0.1s" }}>
          <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 px-1">
            भाषा (Language)
          </h2>
          <div className="glass rounded-xl overflow-hidden divide-y divide-dark-border">
            <button 
              onClick={() => handleLanguageChange("mr")}
              className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-dark-bg flex items-center justify-center flex-shrink-0 text-xl">
                  🚩
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-white">मराठी</p>
                  <p className="text-[10px] text-gray-500">प्रादेशिक भाषा</p>
                </div>
              </div>
              {language === "mr" && <Check size={18} className="text-saffron" />}
            </button>
            <button 
              onClick={() => handleLanguageChange("hi")}
              className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-dark-bg flex items-center justify-center flex-shrink-0 text-xl">
                  🇮🇳
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-white">हिंदी</p>
                  <p className="text-[10px] text-gray-500">राष्ट्रीय भाषा</p>
                </div>
              </div>
              {language === "hi" && <Check size={18} className="text-saffron" />}
            </button>
          </div>
        </section>

        {/* Data & Storage */}
        <section className="animate-slide-up" style={{ animationDelay: "0.2s" }}>
          <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 px-1">
            डेटा आणि स्टोरेज
          </h2>
          <div className="glass rounded-xl overflow-hidden">
            <button 
              onClick={handleClearCache}
              className="w-full flex items-center justify-between p-4 hover:bg-red-500/5 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-dark-bg group-hover:bg-red-500/10 flex items-center justify-center flex-shrink-0 transition-colors">
                  <Trash2 size={16} className="text-gray-400 group-hover:text-red-400" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-white group-hover:text-red-400 transition-colors">Clear Cache</p>
                  <p className="text-[10px] text-gray-500">अॅपचा स्थानिक डेटा नष्ट करा</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-gray-600" />
            </button>
          </div>
        </section>

        {/* About */}
        <section className="animate-slide-up" style={{ animationDelay: "0.3s" }}>
          <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 px-1">
            बद्दल (About)
          </h2>
          <div className="glass rounded-xl overflow-hidden divide-y divide-dark-border">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-dark-bg flex items-center justify-center flex-shrink-0">
                  <Info size={16} className="text-gray-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">App Version</p>
                  <p className="text-[10px] text-gray-500">Build 1.1.0</p>
                </div>
              </div>
              <span className="text-xs font-mono text-gray-500 bg-dark-bg px-2 py-1 rounded">v1.1.0</span>
            </div>
            
            <Link href="#" className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors text-left">
              <p className="text-sm font-medium text-gray-300 ml-12">Terms of Service</p>
              <ChevronRight size={14} className="text-gray-600" />
            </Link>
            <Link href="#" className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors text-left">
              <p className="text-sm font-medium text-gray-300 ml-12">Privacy Policy</p>
              <ChevronRight size={14} className="text-gray-600" />
            </Link>
          </div>
        </section>

      </div>
    </div>
  );
}
