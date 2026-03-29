"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ChevronRight,
  ChevronLeft,
  Trophy,
  Loader2,
  AlertCircle,
  Clock,
  Sparkles,
  Heart,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/components/FirebaseAuthProvider";
import { useToast } from "@/components/ToastProvider";

interface Question {
  id?: string;
  question_marathi: string;
  options: { a: string; b: string; c: string; d: string };
  correct_answer: string;
  explanation_marathi?: string;
  trick_used?: string;
  difficulty: string;
  topic?: string;
}

function AIMockTestPlayerContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, profile, refreshProfile, updateProfile } = useAuth();
  const { toast } = useToast();

  const subjectsParam = searchParams.get("subjects") || "";
  const subjects = subjectsParam.split(",").filter(Boolean);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [creditDeducted, setCreditDeducted] = useState<Record<number, boolean>>({});

  const TEST_DURATION = 20 * 60; // 20 minutes
  const [timeLeft, setTimeLeft] = useState(TEST_DURATION);

  const [testFinished, setTestFinished] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [startTime] = useState(Date.now());
  const [showDonationPrompt, setShowDonationPrompt] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    confirmText?: string;
    cancelText?: string;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
    confirmText: "होय",
    cancelText: "नाही",
  });

  const fetchQuestions = useCallback(async () => {
    if (!user || subjects.length === 0) {
      setError("विषय निवडले नाहीत");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/generate-mock-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          subjects,
          count: 25,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        const errorDetails = data.details ? ` (${JSON.stringify(data.details)})` : "";
        const userIdInfo = data.userId ? ` [ID: ${data.userId}]` : "";
        setError((data.error || "प्रश्न तयार करता आले नाहीत") + errorDetails + userIdInfo);
        setLoading(false);
        return;
      }

      if (data.questions && data.questions.length > 0) {
        setQuestions(data.questions);
      } else {
        setError("AI प्रश्न तयार करता आले नाहीत. कृपया पुन्हा प्रयत्न करा.");
      }
    } catch {
      setError("प्रश्न लोड करताना त्रुटी आली. कृपया पुन्हा प्रयत्न करा.");
    }
    setLoading(false);
  }, [user, subjects]);

  useEffect(() => {
    fetchQuestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currentQuestion = questions[currentIndex];

  const handleAnswerChange = async (answer: string) => {
    if (testFinished) return;

    setAnswers((prev) => ({
      ...prev,
      [currentIndex]: answer,
    }));

    // Deduct 1 credit if not already deducted for this question
    if (!creditDeducted[currentIndex] && user) {
      setCreditDeducted((prev) => ({ ...prev, [currentIndex]: true }));
      try {
        const res = await fetch("/api/deduct-credit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user.id }),
        });

        const data = await res.json();
        if (res.ok && typeof data.remaining === "number") {
          updateProfile({ ai_credits: data.remaining });
        } else {
          await refreshProfile();
        }
      } catch {
        // Silently continue
      }
    }
  };

  const calculateScore = useCallback(() => {
    let corr = 0;
    let wrg = 0;
    let unattempted = 0;

    questions.forEach((q, idx) => {
      const userAns = answers[idx];
      if (!userAns) {
        unattempted++;
      } else if (userAns === q.correct_answer) {
        corr++;
      } else {
        wrg++;
      }
    });

    return { correct: corr, wrong: wrg, unattempted };
  }, [questions, answers]);

  const handleCompleteTest = useCallback(async () => {
    setSubmitting(true);
    setTestFinished(true);
    const timeTaken = Math.round((Date.now() - startTime) / 1000);
    const stats = calculateScore();
    const scoreVal =
      questions.length > 0
        ? Math.round((stats.correct / questions.length) * 100)
        : 0;

    if (user) {
      try {
        await fetch("/api/results", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: user.id,
            exam: "police",
            topic: `AI Mock - ${subjects.slice(0, 3).join(", ")}${subjects.length > 3 ? "..." : ""}`,
            score: scoreVal,
            total_questions: questions.length,
            correct_answers: stats.correct,
            wrong_answers: stats.wrong,
            time_taken_seconds: timeTaken,
            is_mock_test: true,
          }),
        });
        toast("🏆 +15 गुण मिळाले!");
      } catch {
        // Continue
      }
    }

    const today = new Date().toDateString();
    const lastPrompt = localStorage.getItem("last_donation_prompt_date");
    if (lastPrompt !== today) {
      setTimeout(() => setShowDonationPrompt(true), 1500);
      localStorage.setItem("last_donation_prompt_date", today);
    }

    setSubmitting(false);
  }, [calculateScore, questions.length, startTime, subjects, user, toast]);

  // Timer
  useEffect(() => {
    if (loading || error || testFinished) return;
    if (questions.length === 0) return;

    if (timeLeft <= 0) {
      handleCompleteTest();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, loading, error, testFinished, handleCompleteTest, questions.length]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const getOptionStyle = (optionKey: string) => {
    const isSelected = answers[currentIndex] === optionKey;

    if (!testFinished) {
      if (isSelected) {
        return "bg-saffron/20 border-saffron text-white";
      }
      return "bg-dark-card border-dark-border hover:border-gray-500";
    }

    if (optionKey === currentQuestion.correct_answer) {
      return "bg-green-500/10 border-green-500/40 text-green-400";
    }
    if (isSelected && optionKey !== currentQuestion.correct_answer) {
      return "bg-red-500/10 border-red-500/40 text-red-400";
    }
    return "bg-dark-card border-dark-border opacity-50";
  };

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <div className="relative mb-6">
          <div className="w-16 h-16 rounded-2xl bg-saffron/10 flex items-center justify-center">
            <Sparkles size={28} className="text-saffron animate-pulse" />
          </div>
        </div>
        <Loader2 size={28} className="text-saffron animate-spin mb-4" />
        <p className="text-sm font-bold text-white mb-2">
          AI प्रश्न तयार होत आहेत...
        </p>
        <p className="text-xs text-gray-500 text-center max-w-[250px] leading-relaxed">
          {subjects.length} विषयांचे {Math.min(25, profile?.ai_credits || 25)} कठीण प्रश्न तयार होत आहेत. कृपया
          15-30 सेकंद प्रतीक्षा करा.
        </p>
      </div>
    );
  }

  // Error
  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
        <div className="w-16 h-16 rounded-3xl bg-dark-card border border-dark-border flex items-center justify-center mb-6">
          <AlertCircle size={32} className="text-gray-400" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">{error}</h2>
        <p className="text-sm text-gray-500 mb-8">
          कृपया पुन्हा प्रयत्न करा किंवा विषय बदला.
        </p>
        <Link href="/mock-test/ai-mock" className="btn-primary text-sm px-8">
          मागे जा
        </Link>
      </div>
    );
  }

  // Finished
  if (testFinished) {
    const stats = calculateScore();
    const scorePrc =
      questions.length > 0
        ? Math.round((stats.correct / questions.length) * 100)
        : 0;

    return (
      <div className="max-w-md mx-auto px-4 pt-6 pb-24 animate-fade-in">
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-saffron-gradient flex items-center justify-center mx-auto mb-3">
            <Trophy size={32} className="text-white" />
          </div>
          <h1 className="text-xl font-bold text-white">
            AI Mock Test पूर्ण! 🎉
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            तुमचा निकाल खालीलप्रमाणे आहे
          </p>
          <div className="flex flex-wrap justify-center gap-1 mt-2">
            {subjects.map((s) => (
              <span
                key={s}
                className="text-[9px] bg-saffron/10 text-saffron px-2 py-0.5 rounded-full"
              >
                {s}
              </span>
            ))}
          </div>
        </div>

        {/* Score */}
        <div className="glass rounded-2xl p-6 mb-4 text-center">
          <div className="relative w-28 h-28 mx-auto mb-4">
            <svg className="w-full h-full" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="42"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="8"
                fill="none"
              />
              <circle
                cx="50"
                cy="50"
                r="42"
                stroke={
                  scorePrc >= 70
                    ? "#22c55e"
                    : scorePrc >= 40
                    ? "#FF6B00"
                    : "#ef4444"
                }
                strokeWidth="8"
                fill="none"
                strokeDasharray="264"
                strokeDashoffset={264 - (264 * scorePrc) / 100}
                strokeLinecap="round"
                style={{
                  transform: "rotate(-90deg)",
                  transformOrigin: "center",
                }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center flex-col">
              <span className="text-2xl font-bold text-white leading-none">
                {scorePrc}%
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <p className="text-lg font-bold text-green-400">
                {stats.correct}
              </p>
              <p className="text-[10px] text-gray-400">बरोबर</p>
            </div>
            <div>
              <p className="text-lg font-bold text-red-400">{stats.wrong}</p>
              <p className="text-[10px] text-gray-400">चुकीचे</p>
            </div>
            <div>
              <p className="text-lg font-bold text-gray-400">
                {stats.unattempted}
              </p>
              <p className="text-[10px] text-gray-400">सोडलेले</p>
            </div>
          </div>
        </div>

        {/* Review Section */}
        <div className="mb-6">
          <h3 className="text-sm font-bold text-white mb-3">
            उत्तरे तपासा:
          </h3>
          <div className="glass rounded-2xl p-5 mb-4 border-l-4 border-saffron">
            <div className="mb-3 flex justify-between items-center text-xs">
              <span className="text-gray-400">
                प्रश्न {currentIndex + 1}
                {currentQuestion?.topic && (
                  <span className="text-saffron ml-1">
                    ({currentQuestion.topic})
                  </span>
                )}
              </span>
              <span
                className={
                  answers[currentIndex] === currentQuestion?.correct_answer
                    ? "text-green-400"
                    : answers[currentIndex]
                    ? "text-red-400"
                    : "text-gray-500"
                }
              >
                {answers[currentIndex] === currentQuestion?.correct_answer
                  ? "बरोबर"
                  : answers[currentIndex]
                  ? "चूक"
                  : "सोडवलेला नाही"}
              </span>
            </div>
            <p className="text-sm text-white mb-4">
              {currentQuestion?.question_marathi}
            </p>

            <div className="space-y-2 mb-4">
              {(["a", "b", "c", "d"] as const).map((key) => (
                <div
                  key={key}
                  className={`text-xs p-3 rounded-lg border flex items-center gap-3 ${getOptionStyle(key)}`}
                >
                  <span className="uppercase w-5 h-5 flex items-center justify-center font-bold bg-black/20 rounded-md">
                    {key}
                  </span>
                  <span className="flex-1">
                    {currentQuestion?.options[key]}
                  </span>
                </div>
              ))}
            </div>

            {/* Explanation */}
            {currentQuestion?.explanation_marathi && (
              <div className="bg-dark-bg rounded-lg p-3 border border-dark-border/50 mb-3">
                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">
                  स्पष्टीकरण
                </p>
                <p className="text-xs text-gray-300 whitespace-pre-line">
                  {currentQuestion.explanation_marathi}
                </p>
              </div>
            )}

            <div className="flex justify-between items-center pt-2">
              <button
                onClick={() =>
                  setCurrentIndex(Math.max(0, currentIndex - 1))
                }
                disabled={currentIndex === 0}
                className="text-xs text-gray-400 hover:text-white disabled:opacity-30 flex items-center gap-1"
              >
                <ChevronLeft size={14} /> मागील
              </button>
              <button
                onClick={() =>
                  setCurrentIndex(
                    Math.min(questions.length - 1, currentIndex + 1)
                  )
                }
                disabled={currentIndex === questions.length - 1}
                className="text-xs text-saffron hover:text-white disabled:opacity-30 flex items-center gap-1"
              >
                पुढील <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-2 mb-8">
          <Link
            href="/mock-test/ai-mock"
            className="w-full btn-primary block text-center py-3"
          >
            <Sparkles size={14} className="inline mr-2" />
            पुन्हा AI Mock Test द्या
          </Link>
          <Link
            href="/mock-test"
            className="w-full btn-secondary block text-center py-3"
          >
            मॉक टेस्ट डॅशबोर्ड वर जा
          </Link>
        </div>

        {/* Donation */}
        {showDonationPrompt && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-md bg-[#1a1a1a] border-t sm:border border-saffron/20 sm:rounded-2xl rounded-t-3xl p-6 shadow-[0_-10px_40px_-15px_rgba(255,107,0,0.15)] animate-slide-up transform transition-all pb-safe">
              <div className="flex items-center gap-4 mb-5">
                <div className="p-3 bg-blue-500/10 rounded-2xl">
                  <Heart
                    size={28}
                    className="text-blue-400 fill-blue-400"
                  />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white leading-tight">
                    💙 App आवडला का?
                  </h3>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    Server खर्चासाठी छोटी मदत करा
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-4">
                {[10, 30, 50].map((amt) => (
                  <button
                    key={amt}
                    onClick={() => router.push("/support")}
                    className="bg-dark-card border border-white/10 hover:border-saffron/50 hover:bg-saffron/10 text-white font-bold py-3.5 rounded-xl transition-all shadow-sm flex items-center justify-center"
                  >
                    ₹{amt}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setShowDonationPrompt(false)}
                className="w-full py-3.5 bg-white/5 text-gray-400 text-sm font-medium rounded-xl hover:bg-white/10 hover:text-white transition-colors border border-transparent"
              >
                नको, पुढच्या वेळी
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Active Test UI
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="max-w-md mx-auto min-h-screen flex flex-col bg-dark-bg">
      {/* Top Bar */}
      <div className="sticky top-0 z-10 glass border-b border-dark-border px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => {
            setConfirmModal({
              isOpen: true,
              title: "टेस्ट थांबवायची?",
              message: "तुम्हाला नक्की टेस्ट थांबवायची आहे का? तुमचा प्रोग्रेस नष्ट होईल.",
              confirmText: "थांबवा",
              cancelText: "रद्द करा",
              onConfirm: () => {
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
                router.push("/mock-test/ai-mock");
              }
            });
          }}
          className="text-gray-400 hover:text-white"
        >
          <ArrowLeft size={18} />
        </button>

        <div className="flex flex-col items-center">
          <div className="flex items-center gap-1.5">
            <Sparkles size={10} className="text-saffron" />
            <span className="text-[9px] text-saffron font-bold">
              AI Mock
            </span>
          </div>
          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold font-mono ${
              timeLeft <= 120
                ? "text-red-400 bg-red-500/10"
                : "text-saffron bg-saffron/10"
            }`}
          >
            <Clock size={12} /> {formatTime(timeLeft)}
          </div>
        </div>

        <button
          onClick={() => {
            setConfirmModal({
              isOpen: true,
              title: "टेस्ट सबमिट करायची?",
              message: "तुम्हाला नक्की टेस्ट सबमिट करायची आहे का?",
              confirmText: "सबमिट करा",
              cancelText: "रद्द करा",
              onConfirm: () => {
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
                handleCompleteTest();
              }
            });
          }}
          className="text-xs font-bold text-white bg-green-500/20 px-3 py-1.5 rounded-lg border border-green-500/30"
          disabled={submitting}
        >
          {submitting ? "Loading..." : "Submit"}
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 px-4 py-6 overflow-y-auto">
        <div className="mb-4 flex items-center justify-between text-xs text-gray-500">
          <span>
            प्रश्न {currentIndex + 1} of {questions.length}
          </span>
          <span className="text-saffron">Answered: {answeredCount}</span>
        </div>

        {/* Subject tag */}
        {currentQuestion?.topic && (
          <div className="mb-3">
            <span className="text-[9px] bg-saffron/10 text-saffron px-2 py-0.5 rounded-full font-medium">
              {currentQuestion.topic}
            </span>
          </div>
        )}

        {/* Question */}
        <div className="mb-6">
          <p className="text-base text-white font-medium leading-relaxed">
            {currentQuestion?.question_marathi}
          </p>
        </div>

        {/* Options */}
        <div className="space-y-3 mb-8">
          {(["a", "b", "c", "d"] as const).map((key, idx) => (
            <button
              key={key}
              onClick={() => handleAnswerChange(key)}
              className={`w-full flex items-center gap-3 rounded-xl p-4 border transition-colors text-left ${getOptionStyle(key)}`}
            >
              <span className="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-lg bg-black/20 text-sm font-bold">
                {String.fromCharCode(65 + idx)}
              </span>
              <span className="text-sm font-medium leading-snug">
                {currentQuestion?.options[key]}
              </span>
            </button>
          ))}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6">
          <button
            onClick={() => setCurrentIndex((p) => Math.max(0, p - 1))}
            disabled={currentIndex === 0}
            className="flex items-center gap-1.5 px-6 py-3 rounded-xl bg-dark-card border border-dark-border text-sm font-bold text-gray-300 disabled:opacity-30 hover:bg-dark-surface transition-colors"
          >
            <ChevronLeft size={18} /> आधीची
          </button>

          <button
            onClick={() => {
              if (currentIndex === questions.length - 1) {
                setConfirmModal({
                  isOpen: true,
                  title: "टेस्ट सबमिट करायची?",
                  message: "ही शेवटची प्रश्न आहे. तुम्हाला नक्की टेस्ट सबमिट करायची आहे का?",
                  confirmText: "सबमिट करा",
                  cancelText: "रद्द करा",
                  onConfirm: () => {
                    setConfirmModal(prev => ({ ...prev, isOpen: false }));
                    handleCompleteTest();
                  }
                });
              } else {
                setCurrentIndex((p) =>
                  Math.min(questions.length - 1, p + 1)
                );
              }
            }}
            className="flex items-center gap-1.5 px-6 py-3 rounded-xl btn-primary text-sm w-auto shadow-saffron-glow"
          >
            {currentIndex === questions.length - 1
              ? "सबमिट करा"
              : "पुढील"}
            {currentIndex !== questions.length - 1 && (
              <ChevronRight size={18} />
            )}
          </button>
        </div>

        {/* Question Palette */}
        <div className="mt-6 glass rounded-xl p-4">
          <p className="text-[10px] text-gray-500 mb-2 font-bold uppercase tracking-wider">
            प्रश्न नॅव्हिगेशन
          </p>
          <div className="grid grid-cols-10 gap-1.5">
            {questions.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`w-7 h-7 rounded-md text-[10px] font-bold transition-colors ${
                  idx === currentIndex
                    ? "bg-saffron text-white"
                    : answers[idx]
                    ? "bg-green-500/20 text-green-400 border border-green-500/30"
                    : "bg-dark-bg text-gray-500 border border-dark-border"
                }`}
              >
                {idx + 1}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Custom Confirm Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in px-4">
          <div className="w-full max-w-sm bg-[#1a1a1a] border border-dark-border rounded-2xl p-6 shadow-2xl animate-scale-in">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-saffron/10 rounded-full shrink-0">
                <AlertCircle size={24} className="text-saffron" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white leading-tight">
                  {confirmModal.title}
                </h3>
              </div>
            </div>
            
            <p className="text-sm text-gray-400 mb-6 leading-relaxed">
              {confirmModal.message}
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                className="flex-1 py-3 px-4 bg-dark-card border border-dark-border text-gray-300 text-sm font-bold rounded-xl hover:bg-white/5 transition-colors"
              >
                {confirmModal.cancelText || "नाही"}
              </button>
              <button
                onClick={confirmModal.onConfirm}
                className="flex-1 py-3 px-4 bg-saffron hover:bg-saffron/90 text-white text-sm font-bold rounded-xl transition-colors shadow-saffron-glow"
              >
                {confirmModal.confirmText || "होय"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AIMockTestPlayer() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col items-center justify-center">
          <Loader2 size={32} className="text-saffron animate-spin mb-4" />
          <p className="text-sm text-gray-400">लोड होत आहे...</p>
        </div>
      }
    >
      <AIMockTestPlayerContent />
    </Suspense>
  );
}
