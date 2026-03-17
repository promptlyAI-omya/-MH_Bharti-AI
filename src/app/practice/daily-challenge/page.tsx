"use client";

import { useState, useEffect, useCallback } from "react";

import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Trophy,
  Home,
  Loader2,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/components/SupabaseProvider";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ToastProvider";

interface Question {
  id: string;
  question_marathi: string;
  options: { a: string; b: string; c: string; d: string };
  correct_answer: string;
  explanation_marathi?: string;
  difficulty: string;
}

export default function DailyChallengePage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState({ correct: 0, wrong: 0 });
  const [quizFinished, setQuizFinished] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [startTime] = useState(Date.now());
  const [pointsAwarded, setPointsAwarded] = useState(false);

  const fetchQuestions = useCallback(async () => {
    try {
      const res = await fetch("/api/questions?limit=10");
      const data = await res.json();
      if (data.questions && data.questions.length > 0) {
        setQuestions(data.questions);
      } else {
        setError("प्रश्न उपलब्ध नाहीत");
      }
    } catch {
      setError("प्रश्न लोड करताना त्रुटी आली");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  const currentQuestion = questions[currentIndex];

  const handleAnswer = (answer: string) => {
    if (showResult) return;
    setSelectedAnswer(answer);
    setShowResult(true);

    if (answer === currentQuestion?.correct_answer) {
      setScore((prev) => ({ ...prev, correct: prev.correct + 1 }));
    } else {
      setScore((prev) => ({ ...prev, wrong: prev.wrong + 1 }));
    }
  };

  const handleNext = useCallback(async () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      setQuizFinished(true);

      if (user && !pointsAwarded) {
        setPointsAwarded(true);
        try {
          // Fetch current points safely
          const { data: userData } = await supabase
            .from("users")
            .select("leaderboard_points")
            .eq("id", user.id)
            .single();

          const currentPoints = userData?.leaderboard_points || 0;

          // Award 10 points
          const { error: updateError } = await supabase
            .from("users")
            .update({ leaderboard_points: currentPoints + 10 })
            .eq("id", user.id);

          if (!updateError) {
            toast("🏆 +10 गुण मिळाले!");
          }
        } catch (err) {
          console.error("Error awarding points:", err);
        }
      }
    }
  }, [currentIndex, questions.length, user, pointsAwarded, toast]);

  const getOptionStyle = (optionKey: string) => {
    if (!showResult) {
      return "bg-dark-card border-dark-border hover:border-saffron/30 hover:bg-saffron/5";
    }
    if (optionKey === currentQuestion?.correct_answer) {
      return "bg-green-500/10 border-green-500/40 text-green-400";
    }
    if (optionKey === selectedAnswer && optionKey !== currentQuestion?.correct_answer) {
      return "bg-red-500/10 border-red-500/40 text-red-400";
    }
    return "bg-dark-card border-dark-border opacity-50";
  };

  const getOptionIcon = (optionKey: string) => {
    if (!showResult) return null;
    if (optionKey === currentQuestion?.correct_answer) {
      return <CheckCircle2 size={18} className="text-green-400 flex-shrink-0" />;
    }
    if (optionKey === selectedAnswer && optionKey !== currentQuestion?.correct_answer) {
      return <XCircle size={18} className="text-red-400 flex-shrink-0" />;
    }
    return null;
  };

  if (loading) {
    return (
      <div className="max-w-md mx-auto px-4 pt-20 flex flex-col items-center">
        <Loader2 size={32} className="text-saffron animate-spin" />
        <p className="text-sm text-gray-400 mt-4">प्रश्न लोड होत आहेत...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto px-4 pt-16 flex flex-col items-center text-center">
        <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center mb-4">
          <AlertCircle size={28} className="text-red-400" />
        </div>
        <h2 className="text-lg font-bold text-white mb-2">{error}</h2>
        <Link href="/" className="btn-primary text-sm mt-4">
          ← मागे जा
        </Link>
      </div>
    );
  }

  if (quizFinished) {
    const finalCorrect = score.correct + (selectedAnswer === currentQuestion?.correct_answer ? 1 : 0);
    const finalWrong = score.wrong + (selectedAnswer !== currentQuestion?.correct_answer ? 1 : 0);
    const percentage = Math.round((finalCorrect / questions.length) * 100);
    const timeTaken = Math.round((Date.now() - startTime) / 1000);
    const minutes = Math.floor(timeTaken / 60);
    const seconds = timeTaken % 60;

    return (
      <div className="max-w-md mx-auto px-4 pt-6">
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-saffron-gradient flex items-center justify-center mx-auto mb-3">
            <Trophy size={32} className="text-white" />
          </div>
          <h1 className="text-xl font-bold text-white">आव्हान पूर्ण! 🎉</h1>
          <p className="text-sm text-gray-400 mt-1">आजचे आव्हान</p>
        </div>

        <div className="glass rounded-2xl p-6 mb-4 text-center animate-slide-up">
          <div className="relative w-28 h-28 mx-auto mb-4">
            <svg className="w-full h-full" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" stroke="rgba(255,255,255,0.1)" strokeWidth="8" fill="none" />
              <circle
                cx="50"
                cy="50"
                r="42"
                stroke={percentage >= 70 ? "#22c55e" : percentage >= 40 ? "#FF6B00" : "#ef4444"}
                strokeWidth="8"
                fill="none"
                strokeDasharray="264"
                strokeDashoffset={264 - (264 * percentage) / 100}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
                style={{ transform: "rotate(-90deg)", transformOrigin: "center" }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl font-bold text-white">{percentage}%</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <p className="text-xl font-bold text-green-400">{finalCorrect}</p>
              <p className="text-[10px] text-gray-400">बरोबर ✓</p>
            </div>
            <div>
              <p className="text-xl font-bold text-red-400">{finalWrong}</p>
              <p className="text-[10px] text-gray-400">चुकीचे ✗</p>
            </div>
            <div>
              <p className="text-xl font-bold text-blue-400">{minutes}:{seconds.toString().padStart(2, "0")}</p>
              <p className="text-[10px] text-gray-400">वेळ</p>
            </div>
          </div>
        </div>

        <div className="space-y-2 mb-24 animate-slide-up" style={{ animationDelay: "0.2s" }}>
          <Link href="/profile" className="w-full btn-primary text-sm flex items-center justify-center gap-2 block text-center">
            <Trophy size={16} /> लीडरबोर्ड पहा
          </Link>
          <Link href="/" className="w-full btn-secondary text-sm flex items-center justify-center gap-2 block text-center">
            <Home size={16} /> होम
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 pt-6 pb-24">
      <div className="flex items-center justify-between mb-5">
        <Link href="/" className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors">
          <ArrowLeft size={16} /> मागे
        </Link>
        <div className="text-right">
          <p className="text-xs text-gray-400">आजचे आव्हान</p>
          <p className="text-[10px] text-gray-500">{currentIndex + 1} / {questions.length}</p>
        </div>
      </div>

      <div className="h-1.5 bg-dark-card rounded-full overflow-hidden mb-5">
        <div
          className="h-full bg-saffron-gradient rounded-full transition-all duration-500 ease-out"
          style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
        />
      </div>

      <div className="flex items-center justify-center gap-4 mb-5">
        <span className="text-xs text-green-400 flex items-center gap-1"><CheckCircle2 size={12} /> {score.correct}</span>
        <span className="text-xs text-red-400 flex items-center gap-1"><XCircle size={12} /> {score.wrong}</span>
      </div>

      <div className="glass rounded-2xl p-5 mb-5 animate-fade-in" key={currentQuestion?.id}>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full text-saffron bg-saffron/10">
            दैनिक
          </span>
          <span className="text-[9px] text-gray-500">प्रश्न {currentIndex + 1}</span>
        </div>
        <p className="text-sm text-white leading-relaxed font-medium">
          {currentQuestion?.question_marathi}
        </p>
      </div>

      <div className="space-y-2.5 mb-5">
        {(["a", "b", "c", "d"] as const).map((key, idx) => (
          <button
            key={key}
            onClick={() => handleAnswer(key)}
            disabled={showResult}
            className={`w-full flex items-center gap-3 rounded-xl p-3.5 border transition-all duration-300 text-left ${getOptionStyle(key)} ${!showResult ? "active:scale-[0.98]" : ""}`}
          >
            <span
              className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${showResult && key === currentQuestion?.correct_answer ? "bg-green-500/20 text-green-400" : showResult && key === selectedAnswer ? "bg-red-500/20 text-red-400" : "bg-dark-bg text-gray-400"}`}
            >
              {String.fromCharCode(65 + idx)}
            </span>
            <span className="text-sm text-white flex-1">{currentQuestion?.options[key]}</span>
            {getOptionIcon(key)}
          </button>
        ))}
      </div>

      {showResult && (
        <button onClick={handleNext} className="w-full btn-primary text-sm flex items-center justify-center gap-2 animate-slide-up">
          {currentIndex < questions.length - 1 ? (
            <>पुढील प्रश्न <ChevronRight size={16} /></>
          ) : (
            <>आव्हान पूर्ण करा <Trophy size={16} /></>
          )}
        </button>
      )}
    </div>
  );
}
