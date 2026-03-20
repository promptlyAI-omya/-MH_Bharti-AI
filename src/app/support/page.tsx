"use client";

import { useState } from "react";
import { ArrowLeft, Loader2, Heart, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/SupabaseProvider";
import { useToast } from "@/components/ToastProvider";

const FIXED_AMOUNTS = [
  { value: 10, label: "एक चहा ☕" },
  { value: 30, label: "मित्राची मदत 🙏" },
  { value: 50, label: "छोटी मदत ❤️" },
  { value: 100, label: "मोठी मदत ⭐" },
  { value: 1000, label: "Super Support 🚀" },
];

export default function SupportPage() {
  const router = useRouter();
  const { user, profile, refreshProfile } = useAuth();
  const { toast } = useToast();

  const [selectedAmount, setSelectedAmount] = useState<number>(30);
  const [customAmount, setCustomAmount] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleAmountSelect = (val: number) => {
    setSelectedAmount(val);
    setCustomAmount("");
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (/^\d*$/.test(val)) {
      setCustomAmount(val);
      if (val) setSelectedAmount(parseInt(val, 10));
    }
  };

  const currentAmount = customAmount ? parseInt(customAmount, 10) : selectedAmount;

  const handleDonate = async () => {
    if (!user) {
      toast("Support करण्यासाठी कृपया Login करा.");
      router.push("/login?redirect=/support");
      return;
    }
    
    if (!currentAmount || currentAmount < 1) {
      toast("कृपया योग्य रक्कम निवडा");
      return;
    }

    setIsProcessing(true);
    try {
      const { loadRazorpayScript } = await import("@/lib/razorpay-client");
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        toast("Payment gateway load होऊ शकले नाही.");
        setIsProcessing(false);
        return;
      }

      const res = await fetch("/api/payment/create-donation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, amount: currentAmount }),
      });
      const data = await res.json();
      
      if (!data.orderId) throw new Error("Could not construct payment order");

      const options = {
        key: data.key_id || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: data.amount,
        currency: "INR",
        name: "MH Bharti AI",
        description: "App Support & Server Fund",
        order_id: data.orderId,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        handler: async (response: any) => {
          try {
            const verifyRes = await fetch("/api/payment/verify-donation", {
               method: "POST",
               headers: { "Content-Type": "application/json" },
               body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  userId: user.id
               })
            });
            const verifyData = await verifyRes.json();
            if (verifyData.success) {
               await refreshProfile();
               setShowSuccess(true);
            } else {
               toast("Payment verify होऊ शकले नाही. सपोर्ट ला संपर्क करा.");
            }
          } catch(err) {
            console.error("Verification err:", err);
            toast("Error verifying payment");
          }
        },
        prefill: {
          name: profile?.name || "",
          email: user?.email || "",
          contact: profile?.phone || ""
        },
        theme: {
          color: "#FF6B00"
        }
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (e) {
      console.error(e);
      toast("Something went wrong");
    } finally {
      setIsProcessing(false);
    }
  };

  // Success Screen
  if (showSuccess) {
    return (
      <div className="fixed inset-0 z-50 bg-[#0a0a0a] flex flex-col items-center justify-center p-6 text-center animate-fade-in">
        <div className="w-24 h-24 bg-saffron/10 rounded-full flex items-center justify-center mb-6 animate-scale-up">
          <Heart size={48} className="text-saffron fill-saffron animate-pulse" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-4">खूप खूप धन्यवाद! 🎉</h1>
        <p className="text-gray-300 text-lg mb-8 max-w-sm leading-relaxed">
          ₹{currentAmount} मुळे आम्ही app अजून चांगला बनवू शकतो! <br/><br/>
          तुम्ही आमचे <b>&quot;💙 App Hero&quot;</b> आहात!
        </p>
        <button 
          onClick={() => router.push("/")}
          className="btn-primary w-full max-w-[280px] py-4 rounded-xl text-lg flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,107,0,0.4)]"
        >
          होम वर जा
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center gap-4 px-4 h-16 max-w-md mx-auto">
          <button 
            onClick={() => router.back()} 
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-lg font-bold text-white">Support & Donate</h1>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 pt-6 space-y-6">
        
        {/* Section 1: Hero */}
        <div className="bg-[#1a1a1a] rounded-2xl p-6 border border-saffron/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-saffron/10 rounded-full blur-3xl -mr-10 -mt-10" />
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2 relative z-10">
            <Heart className="text-saffron fill-saffron" size={24} /> App ला Support करा
          </h2>
          <div className="space-y-3 relative z-10">
            <p className="text-sm text-gray-300 leading-relaxed">
              महाराष्ट्राचा पहिला <b>AI Exam Prep App</b> तुमच्यासाठी मोफत बनवत आहोत.
            </p>
            <div className="bg-black/30 rounded-lg p-3 border border-white/5">
              <p className="text-sm text-gray-400">Server + AI खर्च:</p>
              <p className="text-lg font-bold text-white">₹5,000-10,000/महिना</p>
            </div>
            <p className="text-sm text-gray-300 leading-relaxed">
              तुमची मदत असेल तर app आणखी चांगला होईल! 🙏
            </p>
          </div>
        </div>

        {/* Section 2: Amounts */}
        <div className="bg-[#1a1a1a] rounded-2xl p-6 border border-white/5">
          <h3 className="text-base font-bold text-white mb-4">किती Support करायचे?</h3>
          
          <div className="grid grid-cols-2 gap-3 mb-4">
            {FIXED_AMOUNTS.map((amt) => (
              <button
                key={amt.value}
                onClick={() => handleAmountSelect(amt.value)}
                className={`p-3 rounded-xl border text-sm font-bold transition-all duration-300 ${
                  currentAmount === amt.value && !customAmount
                    ? "bg-saffron/20 border-saffron text-saffron scale-[1.02] shadow-[0_0_15px_rgba(255,107,0,0.15)]"
                    : "bg-black/40 border-white/10 text-gray-400 hover:border-white/20"
                } ${amt.value === 1000 ? "col-span-2" : ""}`}
              >
                {amt.label}
              </button>
            ))}
          </div>

          <div className="mb-6">
            <p className="text-xs text-gray-500 mb-2 pl-1 font-medium tracking-wide">CUSTOM AMOUNT</p>
            <div className={`flex items-center bg-black/40 border rounded-xl px-4 py-3 transition-colors ${customAmount ? "border-saffron bg-saffron/5" : "border-white/10 focus-within:border-white/30"}`}>
              <span className={`text-lg font-bold mr-2 ${customAmount ? "text-saffron" : "text-gray-500"}`}>₹</span>
              <input
                type="text"
                inputMode="numeric"
                value={customAmount}
                onChange={handleCustomChange}
                placeholder="इतर रक्कम टाका"
                className="bg-transparent border-none text-white text-lg font-bold w-full focus:outline-none placeholder:text-gray-600 placeholder:font-normal"
              />
            </div>
          </div>

          <button
            onClick={handleDonate}
            disabled={isProcessing || !currentAmount}
            className="w-full btn-primary py-4 rounded-xl flex items-center justify-center gap-2 text-base font-bold shadow-[0_0_20px_rgba(255,107,0,0.3)] disabled:opacity-50 disabled:shadow-none"
          >
            {isProcessing ? <Loader2 size={20} className="animate-spin" /> : <Heart size={20} className="fill-white" />}
            Razorpay ने ₹{currentAmount || 0} द्या
          </button>

          <div className="mt-5 text-center px-4">
            <p className="text-[11px] text-gray-500 italic bg-black/20 py-2 rounded-lg border border-white/5">
              ⭐ &quot;देणे ऐच्छिक आहे (Donation is optional) — app वापरणे कायम मोफत राहील!&quot; 😊
            </p>
          </div>
        </div>

        {/* Section 3: Founder Message */}
        <div className="bg-[#1a1a1a] rounded-2xl p-6 border border-white/5 relative bg-gradient-to-b from-transparent to-[#1a1a1a]">
          <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
            <User size={18} className="text-saffron" /> Founder कडून...
          </h3>
          <div className="space-y-3 text-sm text-gray-300 leading-relaxed">
            <p>नमस्कार!</p>
            <p>
              मी <span className="text-saffron font-bold">Omkar Khedkar</span> — MH_Bharti AI चा Founder.
            </p>
            <p>
              महाराष्ट्रातील लाखो तरुण सरकारी नोकरीसाठी मेहनत करतात — त्यांच्यासाठी आणि त्यांच्या स्वप्नांसाठी हे app मी एकट्याने बनवत आहे.
            </p>
            <p>
              तुमचा वेळ आणि बहुमूल्य support दोन्हींसाठी मनापासून धन्यवाद! 🙏
            </p>
            <p className="text-saffron font-medium pt-2">— Omkar Khedkar</p>
            
            <div className="mt-4 pt-4 border-t border-white/5 flex flex-col gap-1">
              <p className="text-xs text-gray-500">📬 संपर्क करा:</p>
              <a 
                href="https://www.omkhedkar.in" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-saffron text-sm font-medium hover:underline inline-block"
              >
                www.omkhedkar.in
              </a>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
