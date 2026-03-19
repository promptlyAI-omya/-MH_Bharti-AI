"use client";

import {
  Shield,
  Landmark,
  FileCheck,
  Users,
  Zap,
  MessageSquare,
  Trophy,
  Flame,
  ChevronRight,
  Sparkles,
  Target,
  Brain,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/SupabaseProvider";
import { useToast } from "@/components/ToastProvider";
import dynamic from "next/dynamic";

const ThemeToggle = dynamic(() => import("@/components/ThemeToggle"), { ssr: false });

const examCategories = [
  {
    title: "पोलीस भरती",
    subtitle: "Police Bharti",
    icon: Shield,
    href: "/practice?exam=police",
    gradient: "from-orange-600 to-red-700",
    questions: "5,000+",
    badge: "लोकप्रिय",
  },
  {
    title: "MPSC",
    subtitle: "महाराष्ट्र लोकसेवा आयोग",
    icon: Landmark,
    href: "/practice?exam=mpsc",
    gradient: "from-blue-600 to-indigo-800",
    questions: "8,000+",
    badge: "नवीन",
  },
  {
    title: "तलाठी",
    subtitle: "Talathi Exam",
    icon: FileCheck,
    href: "/practice?exam=talathi",
    gradient: "from-emerald-600 to-teal-800",
    questions: "3,500+",
    badge: "",
  },
  {
    title: "ग्रामसेवक",
    subtitle: "Gramsevak Exam",
    icon: Users,
    href: "/practice?exam=gramsevak",
    gradient: "from-purple-600 to-violet-800",
    questions: "4,200+",
    badge: "",
  },
];

export default function HomePage() {
  const { profile, user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const isPremium = profile?.plan === "premium";

  const quickStats = [
    {
      label: "आजचे प्रश्न",
      value: String(profile?.daily_question_count ?? 10),
      subtext: "शिल्लक",
      icon: Target,
      color: "text-saffron",
    },
    {
      label: "AI चॅट",
      value: String(profile?.ai_credits ?? 5),
      subtext: "शिल्लक",
      icon: Brain,
      color: "text-blue-400",
    },
    {
      label: "स्ट्रीक",
      value: String(profile?.streak_count ?? 0),
      subtext: "दिवस",
      icon: Flame,
      color: "text-orange-400",
    },
  ];

  const handleAIClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) {
      toast("AI सहाय्यक वापरण्यासाठी कृपया login करा");
      router.push("/login");
    } else {
      router.push("/ai-chat");
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 pt-safe">
      {/* ───────── Header ───────── */}
      <header className="pt-6 pb-4 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-saffron-gradient flex items-center justify-center animate-pulse-glow">
                <Zap size={22} className="text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white tracking-tight">
                  MH_Bharti AI
                </h1>
                <p className="text-[11px] text-gray-400 -mt-0.5">
                  महाराष्ट्राचं स्वतःचं Exam Prep AI
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <div
              className={`px-3 py-1.5 rounded-full border ${
                isPremium
                  ? "bg-yellow-400/10 border-yellow-400/20"
                  : "bg-saffron/10 border-saffron/20"
              }`}
            >
              <span
                className={`text-xs font-semibold ${
                  isPremium ? "text-yellow-400" : "text-saffron"
                }`}
              >
                {isPremium ? "✨ Premium" : "Free Plan"}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* ───────── Hero Banner ───────── */}
      <section className="mb-6 animate-slide-up">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-navy via-navy-500 to-saffron/20 p-5">
          <div className="absolute top-0 right-0 w-32 h-32 bg-saffron/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-navy-200/10 rounded-full blur-2xl" />
          <div className="relative z-10">
            <div className="flex items-center gap-1.5 mb-2">
              <Sparkles size={14} className="text-saffron" />
              <span className="text-[11px] font-medium text-saffron">
                AI-Powered Learning
              </span>
            </div>
            <h2 className="text-lg font-bold text-white mb-1">
              आजची तयारी सुरू करा! 🚀
            </h2>
            <p className="text-sm text-gray-300 mb-4 leading-relaxed">
              स्मार्ट AI सह अभ्यास करा, कमकुवत विषय ओळखा आणि परीक्षेत यशस्वी
              व्हा.
            </p>
            <Link
              href="/practice"
              className="inline-flex items-center gap-2 btn-primary text-sm"
            >
              सराव सुरू करा
              <ChevronRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ───────── Quick Stats ───────── */}
      <section className="mb-6 animate-slide-up" style={{ animationDelay: "0.1s" }}>
        <div className="grid grid-cols-3 gap-3">
          {quickStats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="glass rounded-xl p-3 text-center card-hover"
              >
                <Icon size={20} className={`mx-auto mb-1.5 ${stat.color}`} />
                <p className="text-xl font-bold text-white">{stat.value}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  {stat.label}
                </p>
                <p className="text-[9px] text-gray-500">{stat.subtext}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ───────── Exam Categories ───────── */}
      <section className="mb-6 animate-slide-up" style={{ animationDelay: "0.2s" }}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-bold text-white">परीक्षा निवडा</h3>
          <Link href="/practice" className="text-xs text-gray-500 hover:text-white transition-colors">सर्व पहा →</Link>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {examCategories.map((exam) => {
            const Icon = exam.icon;
            return (
              <Link key={exam.title} href={exam.href}>
                <div
                  className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${exam.gradient} p-4 card-hover min-h-[140px] flex flex-col justify-between`}
                >
                  {exam.badge && (
                    <span className="absolute top-2 right-2 bg-white/20 backdrop-blur-sm text-[9px] font-bold text-white px-2 py-0.5 rounded-full">
                      {exam.badge}
                    </span>
                  )}
                  <Icon size={28} className="text-white/80 mb-3" />
                  <div>
                    <h4 className="text-sm font-bold text-white leading-tight">
                      {exam.title}
                    </h4>
                    <p className="text-[10px] text-white/60 mt-0.5">
                      {exam.subtitle}
                    </p>
                    <p className="text-[10px] text-white/40 mt-1.5">
                      {exam.questions} प्रश्न
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ───────── AI Chat Preview ───────── */}
      <section className="mb-6 animate-slide-up" style={{ animationDelay: "0.3s" }}>
        <div className="glass rounded-xl p-4 card-hover border border-saffron/10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-saffron-gradient flex items-center justify-center">
              <MessageSquare size={20} className="text-white" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">AI सहाय्यक 🤖</h4>
              <p className="text-[10px] text-gray-400">
                मराठीत प्रश्न विचारा, AI उत्तर देईल
              </p>
            </div>
            <div className="ml-auto">
              <span className="text-[10px] text-saffron bg-saffron/10 px-2 py-1 rounded-full font-medium">
                {profile?.ai_credits ?? 5} चॅट शिल्लक
              </span>
            </div>
          </div>
          <div className="bg-dark-bg/50 rounded-lg p-3 border border-dark-border">
            <p className="text-xs text-gray-400 italic">
              &quot;MPSC Prelims साठी भारतीय राज्यघटनेचे महत्त्वाचे कलम
              सांगा...&quot;
            </p>
          </div>
          <button
            onClick={handleAIClick}
            className="mt-3 w-full btn-primary text-xs text-center block"
          >
            AI शी बोला →
          </button>
        </div>
      </section>

      {/* ───────── Daily Challenge ───────── */}
      <section className="mb-8 animate-slide-up" style={{ animationDelay: "0.4s" }}>
        <Link href="/practice?mode=daily-challenge" className="block relative overflow-hidden rounded-xl bg-gradient-to-r from-saffron/20 via-dark-card to-navy/20 p-4 border border-saffron/10 transition-all hover:border-saffron/30 hover:shadow-lg hover:shadow-saffron/5 group">
          <div className="absolute top-0 right-0 w-20 h-20 bg-saffron/5 rounded-full blur-2xl flex-shrink-0" />
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-12 h-12 rounded-xl bg-saffron/10 flex items-center justify-center shadow-inner">
              <Trophy size={24} className="text-saffron group-hover:scale-110 transition-transform" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-bold text-white">
                आजचे आव्हान 🏆
              </h4>
              <p className="text-[11px] text-gray-400 mt-0.5">
                10 प्रश्न सोडवा आणि बक्षीस मिळवा
              </p>
            </div>
            <div className="bg-saffron text-white text-xs font-bold px-4 py-2 rounded-xl group-hover:bg-saffron-600 transition-colors shadow-md">
              सुरू करा
            </div>
          </div>
        </Link>
      </section>

      {/* ───────── Premium Upgrade (only for free users) ───────── */}
      {!isPremium && (
        <section className="mb-24 animate-slide-up" style={{ animationDelay: "0.5s" }}>
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-navy via-navy-600 to-navy-800 p-5 border border-navy-200/10">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-saffron/10 rounded-full blur-3xl" />
            <div className="relative z-10">
              <span className="text-[10px] font-bold text-saffron bg-saffron/10 px-3 py-1 rounded-full">
                ✨ PREMIUM
              </span>
              <h4 className="text-base font-bold text-white mt-3">
                अनलिमिटेड अभ्यास करा
              </h4>
              <p className="text-xs text-gray-300 mt-1.5 mb-4 leading-relaxed">
                फक्त ₹99/महिना — अनलिमिटेड प्रश्न, 50 AI चॅट/दिवस, पूर्ण मॉक
                टेस्ट, AI कमकुवत विषय शोधक
              </p>
              <Link href="/profile">
                <button className="btn-primary text-sm w-full">
                  Premium घ्या — ₹99/महिना
                </button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ───────── Beta Support Card ───────── */}
      <section className="mb-8 animate-slide-up" style={{ animationDelay: "0.6s" }}>
        <div className="rounded-xl border border-white/10 p-4 bg-gradient-to-r from-dark-card to-black flex items-center justify-between gap-3 shadow-sm">
          <div>
            <div className="flex items-center gap-1.5 mb-1 text-gray-300">
               <span className="text-[10px] bg-saffron/10 text-saffron px-1.5 py-0.5 rounded font-bold">🔧 Beta App</span>
            </div>
            <h4 className="text-sm font-bold text-white leading-tight">Server support करा</h4>
            <p className="text-[10px] text-gray-500 mt-0.5">₹10 पासून सुरुवात</p>
          </div>
          <Link href="/support" className="flex-shrink-0">
             <button className="bg-white/10 hover:bg-white/15 text-white text-xs font-bold py-2 px-3 rounded-lg border border-white/5 transition-colors flex items-center gap-1">
               Support करा <ChevronRight size={12} className="text-gray-400" />
             </button>
          </Link>
        </div>
      </section>
    </div>
  );
}
