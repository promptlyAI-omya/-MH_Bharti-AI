"use client";

import { ArrowLeft, Zap } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function TermsPage() {
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
          Terms & Conditions
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
            <h3 className="text-base font-bold text-saffron mb-2">1. सेवेची स्वीकृती (Acceptance of Service)</h3>
            <p className="text-sm text-gray-300 leading-relaxed">
              अॅप (App) वापरल्याने तुम्ही या प्लॅटफॉर्मच्या सर्व terms accept करत आहात. 
              जर तुम्ही या अटींशी सहमत नसाल, तर कृपया अॅप वापरू नका.
            </p>
          </section>

          <section>
            <h3 className="text-base font-bold text-saffron mb-2">2. सेवेचे वर्णन (Service Description)</h3>
            <ul className="list-disc list-outside ml-4 text-sm text-gray-300 leading-relaxed space-y-1">
              <li>हे एक Online Exam preparation platform आहे.</li>
              <li>अॅप AI powered practice आणि Mock tests ची सुविधा देते.</li>
              <li>हे अॅप कोणत्याही <span className="text-white font-medium">Government body</span> (सरकारी संस्थेशी) निगडीत नाही.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-base font-bold text-saffron mb-2">3. खाते नोंदणी (Account Registration)</h3>
            <ul className="list-disc list-outside ml-4 text-sm text-gray-300 leading-relaxed space-y-1">
              <li>नोंदणी करताना Accurate info (अचूक माहिती) देणे आवश्यक आहे.</li>
              <li>तुमच्या Account security ची पूर्ण responsibility (जबाबदारी) तुमची (user) राहील.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-base font-bold text-saffron mb-2">4. पेमेंट आणि सदस्यता (Payment & Subscription)</h3>
            <ul className="list-disc list-outside ml-4 text-sm text-gray-300 leading-relaxed space-y-1">
              <li>Premium plan ची किंमत ₹99/month आहे.</li>
              <li>पेमेंटसाठी सुरक्षित Razorpay payment gateway चा वापर केला जातो.</li>
              <li>अॅपची <span className="text-white font-medium">No refund policy</span> आहे. (कोणताही परतावा दिला जाणार नाही).</li>
              <li>सदस्यतेचे Auto renewal (स्वयंचलित नूतनीकरण) नाही.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-base font-bold text-saffron mb-2">5. वापराचे नियम (Usage Rules)</h3>
            <ul className="list-disc list-outside ml-4 text-sm text-gray-300 leading-relaxed space-y-1">
              <li>अॅप फक्त वैयक्तिक वापरासाठी (Personal use only) आहे.</li>
              <li>कोणतेही Content copy किंवा share करण्यास मनाई आहे.</li>
              <li>अॅपचा गैरवापर (Misuse) केल्यास तुमचे account ban केले जाईल.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-base font-bold text-saffron mb-2">6. AI सेवा (AI Service)</h3>
            <ul className="list-disc list-outside ml-4 text-sm text-gray-300 leading-relaxed space-y-1">
              <li>AI ची उत्तरे 100% accurate (अचूक) असू शकत नाहीत.</li>
              <li>कोणतीही महत्त्वपूर्ण माहिती (important info) स्वतः verify (तपासून) घ्या.</li>
              <li>ही सुविधा फक्त Educational purpose (शैक्षणिक हेतू) साठी वापरली जावी.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-base font-bold text-saffron mb-2">7. बदल (Changes)</h3>
            <ul className="list-disc list-outside ml-4 text-sm text-gray-300 leading-relaxed space-y-1">
              <li>या Terms मध्ये काळानुसार change (बदल) होऊ शकतात.</li>
              <li>असे बदल झाल्यास वापरकर्त्यांना Notice (सूचना) दिली जाईल.</li>
            </ul>
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
                <span>Website:</span>
                <Link href={"https://mh-bharti-ai.vercel.app"} className="text-saffron hover:underline">mh-bharti-ai.vercel.app</Link>
              </div>
              <div className="flex justify-between">
                <span>Contact:</span>
                <Link href={"https://omkhedkar.in"} className="text-saffron hover:underline">omkhedkar.in</Link>
              </div>
              <div className="flex justify-between">
                <span>Location:</span>
                <span className="text-white">Maharashtra, India</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
