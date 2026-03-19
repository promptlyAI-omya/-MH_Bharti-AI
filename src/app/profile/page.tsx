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
  Trophy,
  Medal,
  RotateCcw,
  Heart,
} from "lucide-react";
import { useState, useEffect } from "react";
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
  const [activeTab, setActiveTab] = useState<"profile" | "leaderboard">("profile");
  const [leaderboard, setLeaderboard] = useState<{ id: string; name: string; leaderboard_points: number }[]>([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);
  const [attemptedProfileCreation, setAttemptedProfileCreation] = useState(false);

  useEffect(() => {
    if (user && !profile && !attemptedProfileCreation) {
      setAttemptedProfileCreation(true);
      // Fallback: create user profile if the row doesn't exist
      supabase.from("users").upsert(
        {
          id: user.id,
          name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split("@")[0] || null,
          phone: user.phone || null,
          plan: "free",
        },
        { onConflict: "id", ignoreDuplicates: true }
      ).then(() => {
        refreshProfile();
      });
    }
  }, [user, profile, attemptedProfileCreation, refreshProfile]);

  useEffect(() => {
    if (activeTab === "leaderboard") {
      fetchLeaderboard();
    }
  }, [activeTab]);

  const fetchLeaderboard = async () => {
    setLoadingLeaderboard(true);
    try {
      const { data, error } = await supabase
        .from("users")
        .select("id, name, leaderboard_points")
        .order("leaderboard_points", { ascending: false, nullsFirst: false })
        .limit(10);
      
      if (!error && data) {
        setLeaderboard(data);
      }
    } catch (err) {
      console.error(err);
    }
    setLoadingLeaderboard(false);
  };

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

  const handleResetHistory = async () => {
    if (user) {
      try {
        const res = await fetch(`/api/reset-history?userId=${user.id}`, { method: 'DELETE' });
        if (res.ok) {
          toast("सराव इतिहास रीसेट झाला आहे!");
        } else {
          toast("इतिहास रीसेट करताना त्रुटी आली.");
        }
      } catch {
        toast("इतिहास रीसेट करताना त्रुटी आली.");
      }
    } else {
      localStorage.removeItem("guest_history");
      toast("सराव इतिहास रीसेट झाला आहे!");
    }
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
          icon: RotateCcw,
          label: "इतिहास रीसेट",
          sublabel: "सराव इतिहास नव्याने सुरू करा",
          onClick: handleResetHistory,
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

      {/* Tabs */}
      <div className="flex bg-dark-card rounded-xl p-1 mb-5">
        <button
          onClick={() => setActiveTab("profile")}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
            activeTab === "profile"
              ? "bg-navy text-white shadow-lg"
              : "text-gray-500 hover:text-gray-300"
          }`}
        >
          प्रोफाइल
        </button>
        <button
          onClick={() => setActiveTab("leaderboard")}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2 ${
            activeTab === "leaderboard"
              ? "bg-navy text-white shadow-lg"
              : "text-gray-500 hover:text-gray-300"
          }`}
        >
          <Trophy size={14} className={activeTab === "leaderboard" ? "text-saffron" : ""} />
          लीडरबोर्ड
        </button>
      </div>

      {activeTab === "leaderboard" ? (
        <section className="animate-fade-in mb-24">
          <div className="glass rounded-xl p-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-saffron/10 flex items-center justify-center">
                <Trophy size={16} className="text-saffron" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">टॉप 10 विद्यार्थी</h3>
                <p className="text-[10px] text-gray-400">रोजचे आव्हान सोडवून गुण मिळवा</p>
              </div>
            </div>
            
            {loadingLeaderboard ? (
              <div className="flex justify-center py-8">
                <Loader2 size={24} className="text-saffron animate-spin" />
              </div>
            ) : leaderboard.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm">
                अजून कोणीही नाही
              </div>
            ) : (
              <div className="space-y-3">
                {leaderboard.map((u, idx) => (
                  <div key={u.id} className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${u.id === user?.id ? 'bg-saffron/10 border-saffron/30' : 'bg-dark-bg/50 border-dark-border hover:border-gray-700'}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${idx === 0 ? 'bg-yellow-500/20 text-yellow-500' : idx === 1 ? 'bg-gray-300/20 text-gray-300' : idx === 2 ? 'bg-amber-700/20 text-amber-600' : 'bg-dark-card text-gray-400'}`}>
                        {idx + 1}
                      </div>
                      <div>
                        <span className={`text-sm font-medium block leading-tight ${u.id === user?.id ? 'text-saffron' : 'text-white'}`}>
                          {u.name || "वापरकर्ता"} {u.id === user?.id && "(तुम्ही)"}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 bg-dark-card px-2 py-1.5 rounded-lg border border-dark-border">
                      <Medal size={12} className="text-saffron" />
                      <span className="text-xs font-bold text-white">{u.leaderboard_points || 0}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      ) : (
        <>
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
                {profile?.is_donor && (
                  <div className="flex items-center gap-1 mt-1.5 px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 rounded-full w-fit">
                    <Heart size={10} className="text-blue-400 fill-blue-400" />
                    <span className="text-[10px] font-bold text-blue-400">App Supporter</span>
                  </div>
                )}
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

      {/* Support CTA */}
      <section className="mb-5 animate-slide-up" style={{ animationDelay: "0.1s" }}>
        <button
          onClick={() => router.push("/support")}
          className="w-full relative overflow-hidden rounded-xl bg-gradient-to-r from-blue-500/10 via-dark-card to-blue-500/5 p-4 border border-blue-500/20 text-left transition-all hover:border-blue-500/40 active:scale-[0.98]"
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <Heart size={22} className="text-blue-400 fill-blue-400" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-bold text-white">
                💙 Support करा
              </h4>
              <p className="text-[10px] text-gray-400 mt-0.5">
                App चा Server खर्च भागवण्यासाठी मदत करा
              </p>
            </div>
            <div className="bg-blue-500 text-white text-[11px] font-bold px-3 py-1.5 rounded-xl flex items-center gap-1">
              Donate <ChevronRight size={12} />
            </div>
          </div>
        </button>
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
      </>
      )}
    </div>
  );
}
