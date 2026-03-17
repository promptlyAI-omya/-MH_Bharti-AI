"use client";

import { ArrowLeft, Zap } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function PrivacyPolicyPage() {
  const router = useRouter();

  return (
    <div className="max-w-md mx-auto min-h-screen bg-dark-bg flex flex-col text-white pb-12">
      {/* Header */}
      <div className="sticky top-0 z-10 glass border-b border-dark-border px-4 py-4 flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-sm font-bold absolute left-1/2 -translate-x-1/2 uppercase tracking-wide">
          Privacy Policy
        </h1>
        <div className="w-5" /> {/* Spacer */}
      </div>

      <div className="px-5 pt-8">
        {/* Logo Profile */}
        <div className="flex flex-col items-center justify-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-saffron-gradient flex items-center justify-center mb-4 shadow-lg shadow-saffron/20">
            <Zap size={32} className="text-white" />
          </div>
          <h2 className="text-xl font-bold">MH_Bharti AI</h2>
          <p className="text-xs text-gray-500 mt-1">शेवटचा बदल: March 2026</p>
        </div>

        {/* Content */}
        <div className="space-y-8 animate-slide-up">

          <section>
            <h3 className="text-base font-bold text-saffron mb-2">1. माहिती गोळा करणे (Information We Collect)</h3>
            <ul className="list-disc list-outside ml-4 text-sm text-gray-300 leading-relaxed space-y-1">
              <li>Name (नाव) आणि Email (Google login मधून)</li>
              <li>Practice scores (तुमची सराव चाचणीची प्रगती)</li>
              <li>AI chat history (AI सोबत केलेल्या चॅटचा इतिहास)</li>
              <li>Device info (उपकरणाची सामान्य माहिती)</li>
            </ul>
          </section>

          <section>
            <h3 className="text-base font-bold text-saffron mb-2">2. माहितीचा वापर (How We Use Information)</h3>
            <ul className="list-disc list-outside ml-4 text-sm text-gray-300 leading-relaxed space-y-1">
              <li>Personalized learning (वैयक्तिकृत शिक्षणासाठी)</li>
              <li>Progress tracking (प्रगतीचा मागोवा घेण्यासाठी)</li>
              <li>App improvement (अॅप सुधारण्यासाठी)</li>
              <li>आम्ही तुमचा कोणताही डेटा कोणालाही <span className="text-red-400 font-bold">विकत नाही (NO data selling)</span>.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-base font-bold text-saffron mb-2">3. माहिती सुरक्षा (Data Security)</h3>
            <ul className="list-disc list-outside ml-4 text-sm text-gray-300 leading-relaxed space-y-1">
              <li>Supabase encryption (उच्च स्तरीय डेटा संरक्षण)</li>
              <li>Secure storage (तुमच्या माहितीची सुरक्षित साठवणूक)</li>
              <li>No unauthorized access (कोणताही अनधिकृत प्रवेश नाही)</li>
            </ul>
          </section>

          <section>
            <h3 className="text-base font-bold text-saffron mb-2">4. तृतीय पक्ष (Third Parties)</h3>
            <p className="text-sm text-gray-300 leading-relaxed mb-2">खालील Third-party सेवांचा वापर केला जातो आणि प्रत्येकाचे स्वतःचे गोपनीयता धोरण (privacy policy) आहे:</p>
            <ul className="list-disc list-outside ml-4 text-sm text-gray-300 leading-relaxed space-y-1">
              <li>Google OAuth (खाते नोंदणीसाठी)</li>
              <li>Razorpay payments (सबस्क्रिप्शन आणि पेमेंट्ससाठी)</li>
              <li>Groq AI (AI सहाय्यकासाठी)</li>
            </ul>
          </section>

          <section>
            <h3 className="text-base font-bold text-saffron mb-2">5. कुकीज (Cookies)</h3>
            <ul className="list-disc list-outside ml-4 text-sm text-gray-300 leading-relaxed space-y-1">
              <li>Session management (लॉगिन सत्र हाताळण्यासाठी)</li>
              <li>Preferences save (पसंती जतन करण्यासाठी)</li>
            </ul>
          </section>

          <section>
            <h3 className="text-base font-bold text-saffron mb-2">6. मुलांची गोपनीयता (Children&apos;s Privacy)</h3>
            <p className="text-sm text-gray-300 leading-relaxed">
              हे अॅप फक्त <span className="text-white font-medium">13+ years</span> (13 वर्षांवरील) वयोगटासाठी आहे.
            </p>
          </section>

          <section>
            <h3 className="text-base font-bold text-saffron mb-2">7. संपर्क (Contact Us)</h3>
            <ul className="list-disc list-outside ml-4 text-sm text-gray-300 leading-relaxed space-y-1">
              <li>Privacy concerns किंवा प्रश्न असल्यास संपर्क साधा.</li>
              <li>Website: <Link href={"https://omkhedkar.in"} className="text-saffron hover:underline">omkhedkar.in</Link></li>
            </ul>
          </section>

          <section>
            <h3 className="text-base font-bold text-saffron mb-2">8. बदल (Policy Changes)</h3>
            <p className="text-sm text-gray-300 leading-relaxed">
              या धोरणात बदल (Updates) केले गेल्यास तुम्हाला Notification (सूचना) देण्यात येईल.
            </p>
          </section>

          {/* App Info Box */}
          <div className="mt-8 pt-6 border-t border-dark-border">
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">App Information</h4>
            <div className="glass rounded-xl p-4 text-xs text-gray-400 space-y-2">
              <div className="flex justify-between">
                <span>App Name:</span>
                <span className="text-white">MH_Bharti AI</span>
              </div>
              <div className="flex justify-between">
                <span>Owner:</span>
                <span className="text-white">Omkar Khedkar</span>
              </div>
              <div className="flex justify-between">
                <span>Service:</span>
                <span className="text-white text-right ml-4">Online exam preparation</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
