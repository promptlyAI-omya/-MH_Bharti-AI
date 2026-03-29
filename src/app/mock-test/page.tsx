"use client";

import {
  FileText,
  Clock,
  Lock,
  CheckCircle,
  Trophy,
  Star,
  ChevronRight,
  Zap,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/components/FirebaseAuthProvider";

const mockTests = [
  {
    id: 1,
    title: "पोलीस भरती - पूर्ण सराव",
    subtitle: "Police Bharti Full Mock",
    questions: 100,
    duration: "90 मिनिटे",
    difficulty: "मध्यम",
    free: true,
    attempted: false,
    score: null,
    gradient: "from-orange-600 to-red-700",
  },
  {
    id: 2,
    title: "MPSC Prelims - सराव पेपर 1",
    subtitle: "Paper 1 - GS",
    questions: 100,
    duration: "120 मिनिटे",
    difficulty: "कठीण",
    free: true,
    attempted: true,
    score: 72,
    gradient: "from-blue-600 to-indigo-800",
  },
  {
    id: 3,
    title: "तलाठी - पूर्ण पेपर",
    subtitle: "Talathi Full Paper",
    questions: 80,
    duration: "60 मिनिटे",
    difficulty: "सोपे",
    free: false,
    attempted: false,
    score: null,
    gradient: "from-emerald-600 to-teal-800",
  },
  {
    id: 4,
    title: "ग्रामसेवक - मॉक टेस्ट",
    subtitle: "Gramsevak Mock",
    questions: 80,
    duration: "60 मिनिटे",
    difficulty: "मध्यम",
    free: false,
    attempted: false,
    score: null,
    gradient: "from-purple-600 to-violet-800",
  },
  {
    id: 5,
    title: "MPSC Prelims - सराव पेपर 2",
    subtitle: "Paper 2 - CSAT",
    questions: 80,
    duration: "120 मिनिटे",
    difficulty: "कठीण",
    free: false,
    attempted: false,
    score: null,
    gradient: "from-blue-600 to-indigo-800",
  },
  {
    id: 6,
    title: "पोलीस भरती - बुद्धिमत्ता चाचणी",
    subtitle: "Reasoning Special",
    questions: 50,
    duration: "45 मिनिटे",
    difficulty: "कठीण",
    free: false,
    attempted: false,
    score: null,
    gradient: "from-orange-600 to-red-700",
  },
];

function getDifficultyColor(difficulty: string) {
  switch (difficulty) {
    case "सोपे":
      return "text-green-400 bg-green-400/10";
    case "मध्यम":
      return "text-yellow-400 bg-yellow-400/10";
    case "कठीण":
      return "text-red-400 bg-red-400/10";
    default:
      return "text-gray-400 bg-gray-400/10";
  }
}

export default function MockTestPage() {
  const { profile } = useAuth();
  const isPremium = profile?.plan === "premium";

  return (
    <div className="max-w-md mx-auto px-4 pt-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-saffron-gradient flex items-center justify-center">
          <FileText size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-white">मॉक टेस्ट</h1>
          <p className="text-[11px] text-gray-400">
            वास्तविक परीक्षेसारखा अनुभव
          </p>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="glass rounded-xl p-3 text-center">
          <p className="text-lg font-bold text-white">6</p>
          <p className="text-[10px] text-gray-400">एकूण टेस्ट</p>
        </div>
        <div className="glass rounded-xl p-3 text-center">
          <p className="text-lg font-bold text-saffron">1</p>
          <p className="text-[10px] text-gray-400">पूर्ण केले</p>
        </div>
        <div className="glass rounded-xl p-3 text-center">
          <p className="text-lg font-bold text-green-400">72%</p>
          <p className="text-[10px] text-gray-400">सरासरी स्कोर</p>
        </div>
      </div>

      {/* AI-Powered Mock Test */}
      <section className="mb-5">
        <Link href="/mock-test/ai-mock">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 via-purple-700 to-indigo-900 p-5 card-hover">
            <div className="absolute top-0 right-0 w-28 h-28 bg-white/5 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-16 h-16 bg-saffron/10 rounded-full blur-2xl" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles size={16} className="text-yellow-300" />
                <span className="text-xs font-bold text-yellow-200/80">
                  AI-Powered ⚡
                </span>
              </div>
              <h3 className="text-base font-bold text-white mb-1">
                AI Mock Test 🤖
              </h3>
              <p className="text-[11px] text-white/60 mb-3">
                विषय निवडा → AI कठीण प्रश्न तयार करेल → 25 प्रश्न · 20 मिनिटे
              </p>
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white font-bold text-xs px-5 py-2 rounded-xl border border-white/20">
                विषय निवडा
                <ChevronRight size={14} />
              </div>
            </div>
          </div>
        </Link>
      </section>

      {/* Featured Test */}
      <section className="mb-5">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-saffron via-saffron-600 to-orange-800 p-5">
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full blur-2xl" />
          <div className="flex items-center gap-2 mb-2">
            <Zap size={16} className="text-white" />
            <span className="text-xs font-bold text-white/80">
              आजचा विशेष
            </span>
          </div>
          <h3 className="text-base font-bold text-white mb-1">
            पोलीस भरती - Speed Test 🏃‍♂️
          </h3>
          <p className="text-[11px] text-white/60 mb-3">
            100 प्रश्न • 90 मिनिटे • वेळेत सोडवा
          </p>
          <Link
            href="/mock-test/speed"
            className="inline-flex items-center gap-2 bg-white text-saffron-600 font-bold text-xs px-5 py-2 rounded-xl hover:bg-gray-100 transition-colors"
          >
            सुरू करा
            <ChevronRight size={14} />
          </Link>
        </div>
      </section>

      {/* Mock Test List */}
      <section className="mb-24">
        <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
          <Star size={14} className="text-saffron" />
          उपलब्ध मॉक टेस्ट
        </h3>
        <div className="space-y-3">
          {mockTests.map((test) => {
            const isAccessible = test.free || isPremium;
            return (
            <Link
              key={test.id}
              href={
                isAccessible ? `/mock-test/${test.id}` : "#"
              }
            >
              <div className="glass rounded-xl p-4 card-hover relative overflow-hidden">
                {!isAccessible && (
                  <div className="absolute top-3 right-3">
                    <Lock size={14} className="text-gray-500" />
                  </div>
                )}
                {test.attempted && test.score !== null && (
                  <div className="absolute top-3 right-3 flex items-center gap-1">
                    <CheckCircle size={12} className="text-green-400" />
                    <span className="text-[10px] text-green-400 font-bold">
                      {test.score}%
                    </span>
                  </div>
                )}
                <div className="flex items-start gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl bg-gradient-to-br ${test.gradient} flex items-center justify-center flex-shrink-0`}
                  >
                    <Trophy size={18} className="text-white/80" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-white truncate">
                      {test.title}
                    </h4>
                    <p className="text-[10px] text-gray-500 mt-0.5">
                      {test.subtitle}
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-[10px] text-gray-400 flex items-center gap-1">
                        <FileText size={10} />
                        {test.questions} प्रश्न
                      </span>
                      <span className="text-[10px] text-gray-400 flex items-center gap-1">
                        <Clock size={10} />
                        {test.duration}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${getDifficultyColor(
                          test.difficulty
                        )}`}
                      >
                        {test.difficulty}
                      </span>
                    </div>
                  </div>
                </div>
                {!isAccessible && (
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-[10px] text-saffron bg-saffron/10 px-2 py-0.5 rounded-full font-medium">
                      🔒 Premium Only
                    </span>
                  </div>
                )}
              </div>
            </Link>
          );
          })}
        </div>
      </section>
    </div>
  );
}
