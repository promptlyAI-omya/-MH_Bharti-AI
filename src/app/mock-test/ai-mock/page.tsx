"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Sparkles,
  Clock,
  FileText,
  CheckCircle2,
  Zap,
  Shield,
  Landmark,
  FileCheck,
  Users,
  Lock,
  AlertCircle,
  Loader2,
  Crown,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/components/SupabaseProvider";

interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

const allSubjects = [
  {
    exam: "पोलीस भरती",
    icon: Shield,
    color: "from-orange-600 to-red-700",
    subjects: [
      "मराठी व्याकरण",
      "गणित",
      "आकृती मोजणी",
      "संख्या मालिका",
      "सादृश्यता",
      "दिशा ज्ञान",
      "सामान्य ज्ञान",
      "कायदे व नियम",
      "चालू घडामोडी",
    ],
  },
  {
    exam: "MPSC",
    icon: Landmark,
    color: "from-blue-600 to-indigo-800",
    subjects: [
      "भारतीय राज्यघटना",
      "इतिहास",
      "भूगोल",
      "अर्थशास्त्र",
      "विज्ञान",
      "पर्यावरण",
    ],
  },
  {
    exam: "तलाठी",
    icon: FileCheck,
    color: "from-emerald-600 to-teal-800",
    subjects: ["महसूल कायदा", "ग्रामीण विकास", "संगणक ज्ञान", "मराठी"],
  },
  {
    exam: "ग्रामसेवक",
    icon: Users,
    color: "from-purple-600 to-violet-800",
    subjects: [
      "पंचायत राज",
      "कृषी",
      "समाजशास्त्र",
      "ग्रामीण अर्थव्यवस्था",
    ],
  },
];

export default function AIMockSelectPage() {
  const router = useRouter();
  const { user, profile, refreshProfile } = useAuth();
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [isBuying, setIsBuying] = useState(false);

  const toggleSubject = (subject: string) => {
    setSelectedSubjects((prev) =>
      prev.includes(subject)
        ? prev.filter((s) => s !== subject)
        : [...prev, subject]
    );
  };

  const isPremium = profile?.plan === "premium";
  const credits = profile?.ai_credits || 0;

  const handleStartTest = () => {
    if (!user) {
      router.push("/login");
      return;
    }
    if (selectedSubjects.length < 2) return;

    // Free users: show upgrade popup — they can only solve limited questions
    if (!isPremium && credits < 25) {
      setShowUpgradeModal(true);
      return;
    }

    const params = new URLSearchParams();
    params.set("subjects", selectedSubjects.join(","));
    router.push(`/mock-test/ai-mock/test?${params.toString()}`);
  };

  const handleStartAnyway = () => {
    // Free user starts with whatever credits they have
    setShowUpgradeModal(false);
    const params = new URLSearchParams();
    params.set("subjects", selectedSubjects.join(","));
    router.push(`/mock-test/ai-mock/test?${params.toString()}`);
  };

  const handleBuyCredits = async () => {
    if (!user) return;
    setIsBuying(true);
    try {
      const { loadRazorpayScript } = await import("@/lib/razorpay-client");
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        setIsBuying(false);
        return;
      }

      const res = await fetch("/api/payment/create-order-credits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });
      const data = await res.json();
      if (!data.orderId) throw new Error("Order failed");

      const options = {
        key: data.key_id || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: data.amount,
        currency: "INR",
        name: "MH Bharti AI",
        description: "111 AI Credits",
        order_id: data.orderId,
        handler: async (response: RazorpayResponse) => {
          try {
            const verifyRes = await fetch("/api/payment/verify-credits", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                userId: user.id,
              }),
            });
            const verifyData = await verifyRes.json();
            if (verifyData.success) {
              await refreshProfile();
              setShowUpgradeModal(false);
            }
          } catch {
            // error
          }
        },
        prefill: {
          name: profile?.name || "",
          email: user?.email || "",
        },
        theme: { color: "#FF6B00" },
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch {
      // error
    } finally {
      setIsBuying(false);
    }
  };

  return (
    <>
      {/* Main scrollable content */}
      <div className="max-w-md mx-auto px-4 pt-6 pb-40">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <Link
            href="/mock-test"
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={16} />
            मागे
          </Link>
          <div className="flex items-center gap-1.5 text-xs text-saffron bg-saffron/10 px-3 py-1 rounded-full font-bold">
            <Sparkles size={12} />
            AI Powered
          </div>
        </div>

        {/* Title Card */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-saffron via-orange-600 to-red-700 p-5 mb-6">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/5 rounded-full blur-2xl" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <Zap size={18} className="text-white" />
              <span className="text-xs font-bold text-white/80">
                AI-Powered Mock Test
              </span>
            </div>
            <h1 className="text-lg font-bold text-white mb-1">
              विषय निवडा ⚡
            </h1>
            <p className="text-[11px] text-white/60">
              तुमच्या आवडीचे विषय निवडा, AI कठीण प्रश्न तयार करेल
            </p>
          </div>
        </div>

        {/* Test Info */}
        <div className="grid grid-cols-3 gap-2 mb-6">
          <div className="glass rounded-xl p-3 text-center">
            <FileText size={14} className="text-saffron mx-auto mb-1" />
            <p className="text-xs font-bold text-white">25 प्रश्न</p>
            <p className="text-[9px] text-gray-500">AI Generated</p>
          </div>
          <div className="glass rounded-xl p-3 text-center">
            <Clock size={14} className="text-blue-400 mx-auto mb-1" />
            <p className="text-xs font-bold text-white">20 मिनिटे</p>
            <p className="text-[9px] text-gray-500">वेळ मर्यादा</p>
          </div>
          <div className="glass rounded-xl p-3 text-center">
            <Sparkles size={14} className="text-green-400 mx-auto mb-1" />
            <p className="text-xs font-bold text-white">1/प्रश्न</p>
            <p className="text-[9px] text-gray-500">AI Credit</p>
          </div>
        </div>

        {/* Subject Selection */}
        <div className="space-y-4 mb-6">
          {allSubjects.map((group) => {
            const Icon = group.icon;
            return (
              <div key={group.exam}>
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className={`w-6 h-6 rounded-lg bg-gradient-to-br ${group.color} flex items-center justify-center`}
                  >
                    <Icon size={12} className="text-white" />
                  </div>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide">
                    {group.exam}
                  </h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {group.subjects.map((subject) => {
                    const isSelected = selectedSubjects.includes(subject);
                    return (
                      <button
                        key={subject}
                        onClick={() => toggleSubject(subject)}
                        className={`px-3 py-2 rounded-xl text-xs font-medium transition-all border ${
                          isSelected
                            ? "bg-saffron/20 border-saffron text-saffron shadow-lg shadow-saffron/10"
                            : "bg-dark-card border-dark-border text-gray-400 hover:border-gray-500 hover:text-gray-200"
                        }`}
                      >
                        {isSelected && (
                          <CheckCircle2
                            size={12}
                            className="inline mr-1.5 -mt-0.5"
                          />
                        )}
                        {subject}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Inline selected count (always visible in scroll) */}
        <div className="text-center text-sm text-gray-400 mb-2">
          निवडलेले विषय:{" "}
          <span className="text-saffron font-bold">{selectedSubjects.length}</span>
          {selectedSubjects.length < 2 && (
            <span className="text-red-400 text-xs ml-2">
              (किमान 2 विषय निवडा)
            </span>
          )}
        </div>
      </div>

      {/* ===== STICKY START BUTTON — OUTSIDE main div, ABOVE bottom nav ===== */}
      {selectedSubjects.length >= 2 && (
        <div
          style={{
            position: "fixed",
            bottom: "68px",
            left: 0,
            right: 0,
            zIndex: 55,
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              maxWidth: "448px",
              margin: "0 auto",
              padding: "0 16px",
              pointerEvents: "auto",
            }}
          >
            <div
              style={{
                background: "rgba(20, 20, 20, 0.97)",
                backdropFilter: "blur(20px)",
                borderRadius: "16px",
                padding: "16px",
                border: "1px solid rgba(255, 107, 0, 0.3)",
                boxShadow: "0 -4px 30px rgba(0, 0, 0, 0.6), 0 0 20px rgba(255, 107, 0, 0.1)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                <p style={{ fontSize: "14px", color: "#d1d5db" }}>
                  निवडलेले विषय:{" "}
                  <span style={{ color: "#FF6B00", fontWeight: 700, fontSize: "18px" }}>
                    {selectedSubjects.length}
                  </span>
                </p>
                {!isPremium && (
                  <span style={{ fontSize: "10px", background: "rgba(234, 179, 8, 0.1)", color: "#facc15", padding: "2px 8px", borderRadius: "9999px", fontWeight: 500 }}>
                    {credits} Credits शिल्लक
                  </span>
                )}
              </div>

              {credits === 0 && (
                <p style={{ fontSize: "12px", color: "#f87171", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
                  <AlertCircle size={12} />
                  AI credits संपले आहेत.
                </p>
              )}

              <button
                onClick={handleStartTest}
                disabled={credits === 0}
                style={{
                  width: "100%",
                  padding: "14px",
                  fontSize: "16px",
                  fontWeight: 700,
                  color: "#fff",
                  background: credits === 0 ? "rgba(255, 107, 0, 0.3)" : "linear-gradient(135deg, #FF6B00, #FF8C00)",
                  border: "none",
                  borderRadius: "12px",
                  cursor: credits === 0 ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "10px",
                  boxShadow: credits === 0 ? "none" : "0 4px 20px rgba(255, 107, 0, 0.4)",
                  opacity: credits === 0 ? 0.4 : 1,
                  transition: "all 0.2s ease",
                }}
              >
                <Sparkles size={18} />
                AI टेस्ट सुरू करा 🚀
              </button>

              {!isPremium && credits > 0 && credits < 25 && (
                <p style={{ fontSize: "10px", color: "#6b7280", textAlign: "center", marginTop: "6px" }}>
                  ⚠️ तुम्ही फक्त {credits} प्रश्नांची उत्तरे देऊ शकता
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Upgrade Modal for Free Users */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-dark-card border border-dark-border rounded-2xl w-full max-w-sm p-6 text-center shadow-2xl animate-scale-up">
            <div className="w-16 h-16 bg-saffron/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Crown size={32} className="text-saffron" />
            </div>
            <h2 className="text-lg font-bold text-white mb-2">
              पूर्ण टेस्ट द्यायची आहे? 🎯
            </h2>
            <p className="text-sm text-gray-300 mb-1">
              तुमच्याकडे फक्त <span className="text-saffron font-bold">{credits}</span> AI credits आहेत.
            </p>
            <p className="text-xs text-gray-500 mb-5">
              पूर्ण 25 प्रश्न सोडवण्यासाठी Premium घ्या किंवा Credits खरेदी करा.
            </p>

            <div className="space-y-2.5">
              <button
                onClick={() => router.push("/profile")}
                className="w-full btn-primary py-3 flex items-center justify-center gap-2 text-sm font-bold"
              >
                <Crown size={16} />
                Premium घ्या — रोज 50 Credits 🚀
              </button>

              <button
                onClick={handleBuyCredits}
                disabled={isBuying}
                className="w-full bg-dark-bg border border-saffron/40 text-saffron py-3 rounded-xl text-sm font-bold hover:bg-saffron/10 transition-colors flex items-center justify-center gap-2"
              >
                {isBuying ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Sparkles size={16} />
                )}
                ₹59 मध्ये 111 Credits खरेदी करा
              </button>

              <button
                onClick={handleStartAnyway}
                className="w-full bg-dark-bg border border-dark-border py-3 rounded-xl text-xs font-medium text-gray-400 hover:text-white transition-colors"
              >
                <Lock size={12} className="inline mr-1.5" />
                {credits} Credits मध्ये टेस्ट सुरू करा (फक्त {credits} प्रश्न)
              </button>

              <button
                onClick={() => setShowUpgradeModal(false)}
                className="w-full py-2 text-xs text-gray-500 hover:text-gray-300 transition-colors"
              >
                रद्द करा
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
