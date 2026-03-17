"use client";

import { useCallback } from "react";
import {
  User,
  Crown,
  Settings,
  Bell,
  HelpCircle,
  LogOut,
  ChevronRight,
  Shield,
  Phone,
  Star,
  CreditCard,
  Moon,
  Globe,
  Share2,
  Loader2,
  CheckCircle2,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/components/SupabaseProvider";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useToast } from "@/components/ToastProvider";
import { loadRazorpayScript } from "@/lib/razorpay-client";

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpayResponse) => void;
  prefill: { contact: string };
  theme: { color: string };
  modal: { ondismiss: () => void };
}

interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export default function ProfilePage() {
  const { user, profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Logout Error:", err);
    }
    
    // Clear all client-side storage
    localStorage.clear();
    sessionStorage.clear();
    
    router.push("/login");
    router.refresh();
  };

  const handlePremiumUpgrade = useCallback(async () => {
    if (!user) {
      router.push("/login");
      return;
    }

    const rzpKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    if (!rzpKey) {
      toast("पेमेंट सध्या उपलब्ध नाही, कृपया नंतर प्रयत्न करा");
      return;
    }

    setPaymentLoading(true);

    try {
      // Load Razorpay script
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        toast("Payment service load करता आले नाही. पुन्हा प्रयत्न करा.");
        setPaymentLoading(false);
        return;
      }

      // Create order
      const res = await fetch("/api/payment/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id }),
      });

      const orderData = await res.json();
      if (!orderData.order_id) {
        throw new Error("Order creation failed");
      }

      // Open Razorpay checkout
      const options: RazorpayOptions = {
        key: orderData.key_id,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "MH_Bharti AI",
        description: "Premium Plan - ₹99/महिना",
        order_id: orderData.order_id,
        handler: async (response: RazorpayResponse) => {
          // Verify payment
          try {
            const verifyRes = await fetch("/api/payment/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                ...response,
                user_id: user.id,
              }),
            });

            const verifyData = await verifyRes.json();
            if (verifyData.success) {
              setPaymentSuccess(true);
              await refreshProfile();
              setTimeout(() => setPaymentSuccess(false), 5000);
            } else {
              toast("Payment verification failed. Contact support.");
            }
          } catch {
            toast("Verification error. मदतीसाठी संपर्क करा.");
          }
          setPaymentLoading(false);
          document.body.style.overflow = '';
          document.body.style.position = '';
        },
        prefill: {
          contact: profile?.phone || "",
        },
        theme: {
          color: "#FF6B00",
        },
        modal: {
          ondismiss: () => {
            setPaymentLoading(false);
            document.body.style.overflow = '';
            document.body.style.position = '';
          },
        },
      };

      if (!window.Razorpay) {
        toast("Payment service load करता आले नाही. पुन्हा प्रयत्न करा.");
        setPaymentLoading(false);
        return;
      }
      
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch {
      toast("Payment सुरू करता आली नाही. पुन्हा प्रयत्न करा.");
      setPaymentLoading(false);
      document.body.style.overflow = '';
      document.body.style.position = '';
    }
  }, [user, profile, router, refreshProfile, toast]);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "MH_Bharti AI",
          text: "महाराष्ट्राचं स्वतःचं Exam Prep AI! 🚀",
          url: window.location.origin,
        });
      } catch (err) {
        console.log("Error sharing:", err);
      }
    } else {
      toast("तुमच्या ब्राउझरमध्ये शेअर करण्याची सुविधा उपलब्ध नाही.");
    }
  };

  const isPremium = profile?.plan === "premium";

  const menuItems = [
    {
      section: "खाते",
      items: [
        {
          icon: CreditCard,
          label: "सबस्क्रिप्शन",
          sublabel: isPremium ? "Premium Plan ✨" : "Free Plan",
          badge: isPremium ? undefined : "अपग्रेड करा",
          badgeColor: "text-saffron bg-saffron/10",
          onClick: isPremium ? () => toast("तुमचा Premium प्लॅन सक्रिय आहे!") : handlePremiumUpgrade,
        },
        {
          icon: Bell,
          label: "सूचना",
          sublabel: "अभ्यासाचे रिमाइंडर",
          onClick: () => toast("सूचना चालू केल्या आहेत!"),
        },
        {
          icon: Shield,
          label: "गोपनीयता",
          sublabel: "डेटा आणि सुरक्षितता",
        },
      ],
    },
    {
      section: "अ‍ॅप",
      items: [
        {
          icon: Moon,
          label: "डार्क मोड",
          sublabel: "चालू आहे",
          onClick: () => router.push("/settings"),
        },
        {
          icon: Globe,
          label: "भाषा",
          sublabel: "मराठी",
          onClick: () => toast("सध्या फक्त 'मराठी' भाषा उपलब्ध आहे."),
        },
        {
          icon: Settings,
          label: "सेटिंग्ज",
          sublabel: "अ‍ॅप कॉन्फिगरेशन",
          onClick: () => router.push("/settings"),
        },
      ],
    },
    {
      section: "इतर",
      items: [
        {
          icon: Share2,
          label: "शेअर करा",
          sublabel: "मित्रांना सांगा",
          onClick: handleShare,
        },
        {
          icon: Star,
          label: "रेट करा",
          sublabel: "Play Store वर रेट द्या",
          onClick: () => toast("लवकरच येत आहे!"),
        },
        {
          icon: HelpCircle,
          label: "मदत",
          sublabel: "FAQ आणि सपोर्ट",
          onClick: () => toast("वापरकर्ता मदतीसाठी support@mhbhartiai.com वर संपर्क साधा"),
        },
      ],
    },
  ];

  return (
    <div className="max-w-md mx-auto px-4 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-lg font-bold text-white">प्रोफाइल</h1>
        <Link href="/settings" className="w-9 h-9 rounded-xl glass flex items-center justify-center card-hover">
          <Settings size={16} className="text-gray-400" />
        </Link>
      </div>

      {/* Payment Success Banner */}
      {paymentSuccess && (
        <div className="mb-4 p-3 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center gap-2 animate-slide-up">
          <CheckCircle2 size={16} className="text-green-400" />
          <span className="text-xs text-green-400 font-medium">
            Premium plan activated! 🎉
          </span>
        </div>
      )}

      {/* User Card */}
      <section className="mb-5 animate-slide-up">
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-saffron-gradient flex items-center justify-center">
              <User size={28} className="text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-base font-bold text-white">
                {profile?.name || (user ? "वापरकर्ता" : "अतिथी")}
              </h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Phone size={11} className="text-gray-500" />
                <p className="text-xs text-gray-400">
                  {profile?.phone || (user ? user.phone : "")}
                  {!user && (
                    <Link href="/login" className="text-saffron hover:underline">
                      लॉगिन करा
                    </Link>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span
                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                    isPremium
                      ? "text-yellow-400 bg-yellow-400/10"
                      : "text-saffron bg-saffron/10"
                  }`}
                >
                  {isPremium ? "✨ Premium" : "Free Plan"}
                </span>
                {profile && (
                  <span className="text-[10px] text-gray-500 flex items-center gap-1">
                    <Zap size={9} />
                    {profile.ai_credits} AI credits
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Premium CTA */}
      {!isPremium && (
        <section className="mb-5 animate-slide-up" style={{ animationDelay: "0.1s" }}>
          <button
            onClick={handlePremiumUpgrade}
            disabled={paymentLoading}
            className="w-full relative overflow-hidden rounded-xl bg-gradient-to-r from-saffron/20 via-dark-card to-navy/20 p-4 border border-saffron/10 text-left transition-all hover:border-saffron/30 active:scale-[0.98] disabled:opacity-60"
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-saffron/10 flex items-center justify-center">
                {paymentLoading ? (
                  <Loader2 size={22} className="text-saffron animate-spin" />
                ) : (
                  <Crown size={22} className="text-saffron" />
                )}
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-white">
                  {paymentLoading ? "Processing..." : "Premium अपग्रेड ✨"}
                </h4>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  अनलिमिटेड प्रश्न + 50 AI चॅट/दिवस
                </p>
              </div>
              <div className="bg-saffron text-white text-[11px] font-bold px-3 py-1.5 rounded-xl">
                ₹99/मो
              </div>
            </div>
          </button>
        </section>
      )}

      {/* Premium Active Card */}
      {isPremium && (
        <section className="mb-5 animate-slide-up" style={{ animationDelay: "0.1s" }}>
          <div className="rounded-xl bg-gradient-to-r from-yellow-500/10 via-dark-card to-saffron/10 p-4 border border-yellow-500/10">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-yellow-400/10 flex items-center justify-center">
                <Crown size={22} className="text-yellow-400" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                  Premium Active ✨
                </h4>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  अनलिमिटेड प्रश्न + {profile?.ai_credits} AI credits
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Menu Sections */}
      <div className="space-y-4 mb-24">
        {menuItems.map((section, sIdx) => (
          <section
            key={section.section}
            className="animate-slide-up"
            style={{ animationDelay: `${0.15 + sIdx * 0.05}s` }}
          >
            <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2 px-1">
              {section.section}
            </h3>
            <div className="glass rounded-xl overflow-hidden divide-y divide-dark-border">
              {section.items.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.label}
                    onClick={"onClick" in item && item.onClick ? item.onClick : undefined}
                    className="w-full flex items-center gap-3 p-3.5 hover:bg-white/[0.02] transition-colors text-left"
                  >
                    <div className="w-9 h-9 rounded-lg bg-dark-bg flex items-center justify-center flex-shrink-0">
                      <Icon size={16} className="text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white">
                        {item.label}
                      </p>
                      <p className="text-[10px] text-gray-500">
                        {item.sublabel}
                      </p>
                    </div>
                    {"badge" in item && item.badge && (
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${"badgeColor" in item ? item.badgeColor : ""}`}
                      >
                        {item.badge}
                      </span>
                    )}
                    <ChevronRight size={14} className="text-gray-600" />
                  </button>
                );
              })}
            </div>
          </section>
        ))}

        {/* Logout */}
        {user && (
          <section className="animate-slide-up" style={{ animationDelay: "0.35s" }}>
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="w-full glass rounded-xl p-3.5 flex items-center gap-3 hover:bg-red-500/5 transition-colors disabled:opacity-50"
            >
              <div className="w-9 h-9 rounded-lg bg-red-500/10 flex items-center justify-center">
                {loggingOut ? (
                  <Loader2 size={16} className="text-red-400 animate-spin" />
                ) : (
                  <LogOut size={16} className="text-red-400" />
                )}
              </div>
              <span className="text-sm font-medium text-red-400">
                {loggingOut ? "लॉगआउट होत आहे..." : "लॉगआउट"}
              </span>
            </button>
          </section>
        )}

        {/* Login prompt if not logged in */}
        {!user && (
          <section className="animate-slide-up" style={{ animationDelay: "0.35s" }}>
            <Link
              href="/login"
              className="w-full glass rounded-xl p-3.5 flex items-center gap-3 hover:bg-saffron/5 transition-colors block"
            >
              <div className="w-9 h-9 rounded-lg bg-saffron/10 flex items-center justify-center">
                <User size={16} className="text-saffron" />
              </div>
              <span className="text-sm font-medium text-saffron">
                लॉगिन करा →
              </span>
            </Link>
          </section>
        )}

        {/* App Version */}
        <p className="text-center text-[10px] text-gray-600 py-4">
          MH_Bharti AI v1.0.0 • Made with ❤️ in Maharashtra
        </p>
      </div>
    </div>
  );
}
