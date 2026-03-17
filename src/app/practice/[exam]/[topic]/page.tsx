"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Trophy,
  RotateCcw,
  Home,
  Loader2,
  AlertCircle,
  Sparkles,
  BookOpen,
  Lightbulb,
  PenTool,
  MessageCircle,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/components/SupabaseProvider";

interface Question {
  id: string;
  question_marathi: string;
  options: { a: string; b: string; c: string; d: string };
  correct_answer: string;
  explanation_marathi?: string;
  difficulty: string;
  step_by_step_solution?: string;
  trick_used?: string;
  question_purpose?: string;
  is_ai_variation?: boolean;
}

interface TopicContent {
  id: string;
  topic_name: string;
  concept_marathi: string;
  trick_marathi: string;
  example_q1: string;
  example_q1_steps: string;
  example_q2: string;
  example_q2_steps: string;
  svg_visual?: string;
}

type TabType = "learn" | "example" | "practice";

export default function QuizPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const exam = decodeURIComponent(params.exam as string);
  const topic = decodeURIComponent(params.topic as string);

  const [activeTab, setActiveTab] = useState<TabType>("learn");
  
  const [topicContent, setTopicContent] = useState<TopicContent | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState({ correct: 0, wrong: 0 });
  const [quizFinished, setQuizFinished] = useState(false);
  
  const [loadingContent, setLoadingContent] = useState(true);
  const [loadingQuestions, setLoadingQuestions] = useState(true);
  const [errorQuestions, setErrorQuestions] = useState("");
  const [startTime] = useState(Date.now());

  const fetchTopicContent = useCallback(async () => {
    try {
      const res = await fetch(`/api/topic-content?exam=${exam}&topic=${encodeURIComponent(topic)}`);
      const data = await res.json();
      if (data.data) {
        setTopicContent(data.data);
      }
    } catch (err) {
      console.error("माहिती लोड करताना त्रुटी आली:", err);
    }
    setLoadingContent(false);
  }, [exam, topic]);

  const fetchQuestions = useCallback(async () => {
    try {
      let url = `/api/questions?exam=${exam}&topic=${encodeURIComponent(topic)}&limit=10`;
      
      if (user) {
        url += `&userId=${user.id}`;
      } else {
        // Guest mode logic
        const localHistoryStr = localStorage.getItem("guest_history") || "[]";
        let localHistory = [];
        try {
          localHistory = JSON.parse(localHistoryStr);
          const seenIds = localHistory.map((h: {question_id: string}) => h.question_id).join(",");
          if (seenIds) url += `&seen_ids=${seenIds}`;
        } catch {}
      }

      const res = await fetch(url);
      const data = await res.json();
      if (data.questions && data.questions.length > 0) {
        setQuestions(data.questions);
      } else {
        setErrorQuestions("या विषयात अद्याप प्रश्न उपलब्ध नाहीत");
      }
    } catch {
      setErrorQuestions("प्रश्न लोड करताना त्रुटी आली");
    }
    setLoadingQuestions(false);
  }, [exam, topic, user]);

  useEffect(() => {
    fetchTopicContent();
    fetchQuestions();
  }, [fetchTopicContent, fetchQuestions]);

  const currentQuestion = questions[currentIndex];

  const handleAnswer = (answer: string) => {
    if (showResult) return;
    setSelectedAnswer(answer);
    setShowResult(true);

    const isCorrect = answer === currentQuestion?.correct_answer;

    if (isCorrect) {
      setScore((prev) => ({ ...prev, correct: prev.correct + 1 }));
    } else {
      setScore((prev) => ({ ...prev, wrong: prev.wrong + 1 }));
    }

    // --- Track Question History ---
    if (currentQuestion && !currentQuestion.is_ai_variation) {
      if (user) {
        fetch("/api/track-question", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: user.id,
            question_id: currentQuestion.id,
            is_correct: isCorrect
          })
        }).catch(() => {});
      } else {
        // Guest localStorage tracking
        try {
          const histStr = localStorage.getItem("guest_history") || "[]";
          const history = JSON.parse(histStr);
          const qIndex = history.findIndex((h: {question_id: string}) => h.question_id === currentQuestion.id);
          if (qIndex >= 0) {
            history[qIndex].attempts += 1;
            history[qIndex].correct = isCorrect;
          } else {
            history.push({ question_id: currentQuestion.id, correct: isCorrect, attempts: 1 });
          }
          localStorage.setItem("guest_history", JSON.stringify(history));
        } catch {}
      }
    }
  };

  const handleNext = useCallback(async () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      setQuizFinished(true);
      const timeTaken = Math.round((Date.now() - startTime) / 1000);

      if (user) {
        try {
          await fetch("/api/results", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              user_id: user.id,
              exam,
              topic,
              score: Math.round(
                ((score.correct + (selectedAnswer === currentQuestion?.correct_answer ? 1 : 0)) /
                  questions.length) *
                  100
              ),
              total_questions: questions.length,
              correct_answers:
                score.correct +
                (selectedAnswer === currentQuestion?.correct_answer ? 1 : 0),
              wrong_answers:
                score.wrong +
                (selectedAnswer !== currentQuestion?.correct_answer ? 1 : 0),
              time_taken_seconds: timeTaken,
              is_mock_test: false,
            }),
          });
        } catch {
          // Silently fail
        }
      }
    }
  }, [currentIndex, questions.length, score, user, exam, topic, startTime, selectedAnswer, currentQuestion]);

  const openAIChat = (customPrompt: string) => {
    const encodedContext = encodeURIComponent(
      `Context: ${topicContent?.concept_marathi || ''}\nTrick: ${topicContent?.trick_marathi || ''}\nQuestion: ${customPrompt}`
    );
    router.push(`/ai-chat?prefill=${encodeURIComponent(customPrompt)}&ctx=${encodedContext}`);
  };

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

  // Header & Tabs UI (Common)
  const renderHeader = () => (
    <>
      <div className="flex items-center justify-between mb-5">
        <Link
          href="/practice"
          className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={16} />
          मागे
        </Link>
        <div className="text-right">
          <p className="text-xs text-saffron font-medium uppercase tracking-wide">{exam}</p>
          <p className="text-sm font-bold text-white max-w-[200px] truncate">{topic}</p>
        </div>
      </div>

      <div className="flex gap-2 p-1 bg-dark-card/50 rounded-xl mb-6 border border-dark-border/50">
        <button
          onClick={() => setActiveTab("learn")}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex justify-center items-center gap-1.5 ${
            activeTab === "learn" ? "bg-saffron text-white shadow-lg shadow-saffron/20" : "text-gray-400 hover:text-gray-200 hover:bg-white/5"
          }`}
        >
          <BookOpen size={14} /> शिका
        </button>
        <button
          onClick={() => setActiveTab("example")}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex justify-center items-center gap-1.5 ${
            activeTab === "example" ? "bg-saffron text-white shadow-lg shadow-saffron/20" : "text-gray-400 hover:text-gray-200 hover:bg-white/5"
          }`}
        >
          <Lightbulb size={14} /> उदाहरण
        </button>
        <button
          onClick={() => setActiveTab("practice")}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex justify-center items-center gap-1.5 ${
            activeTab === "practice" ? "bg-saffron text-white shadow-lg shadow-saffron/20" : "text-gray-400 hover:text-gray-200 hover:bg-white/5"
          }`}
        >
          <PenTool size={14} /> सराव
        </button>
      </div>
    </>
  );

  if (activeTab === "learn") {
    return (
      <div className="max-w-md mx-auto px-4 pt-6 pb-24">
        {renderHeader()}
        
        {loadingContent ? (
          <div className="flex flex-col items-center pt-20">
            <Loader2 size={32} className="text-saffron animate-spin" />
            <p className="text-sm text-gray-400 mt-4">माहिती लोड होत आहे...</p>
          </div>
        ) : !topicContent ? (
          <div className="text-center pt-16 animate-fade-in">
            <div className="w-16 h-16 rounded-2xl bg-gray-800 flex items-center justify-center mx-auto mb-4">
              <BookOpen size={24} className="text-gray-500" />
            </div>
            <h2 className="text-base font-bold text-white mb-2">माहिती उपलब्ध नाही</h2>
            <p className="text-sm text-gray-400">या विषयाची शिकवणी लवकरच उपलब्ध होईल. तोपर्यंत तुम्ही सराव करू शकता.</p>
            <button
              onClick={() => setActiveTab("practice")}
              className="mt-6 px-6 py-2.5 bg-dark-card border border-dark-border rounded-xl text-sm font-medium hover:border-saffron/30 transition-colors"
            >
              सराव सुरू करा →
            </button>
          </div>
        ) : (
          <div className="space-y-5 animate-fade-in">
            {/* Concept Box */}
            <div className="glass rounded-2xl p-5 border border-dark-border">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                <BookOpen size={14} /> संकल्पना (Concept)
              </h3>
              <p className="text-sm text-white leading-relaxed whitespace-pre-line">
                {topicContent.concept_marathi}
              </p>
            </div>

            {/* Trick Box */}
            <div className="glass rounded-2xl p-5 border border-saffron/30 bg-saffron/5 shadow-[0_0_15px_rgba(255,107,0,0.05)]">
               <h3 className="text-xs font-bold text-saffron uppercase tracking-wider mb-2 flex items-center gap-2">
                <Sparkles size={14} /> शार्टकट / सूत्र (Trick)
              </h3>
              <p className="text-sm text-white leading-relaxed font-medium whitespace-pre-line">
                {topicContent.trick_marathi}
              </p>
            </div>

            {/* SVG Visual */}
            {topicContent.svg_visual && (
              <div className="glass rounded-2xl p-5 flex items-center justify-center">
                <div dangerouslySetInnerHTML={{ __html: topicContent.svg_visual }} className="text-saffron max-w-full" />
              </div>
            )}

            {/* Ask AI Button */}
            <button
              onClick={() => openAIChat(`${topic} मला अजून विस्तृतपणे समजावून सांगा`)}
              className="w-full mt-4 flex items-center justify-center gap-2 py-3.5 rounded-xl border border-saffron/30 text-saffron text-sm font-bold bg-dark-card hover:bg-saffron/10 transition-colors"
            >
              <MessageCircle size={18} />
              AI ला अजून विचारा
            </button>
          </div>
        )}
      </div>
    );
  }

  if (activeTab === "example") {
    return (
      <div className="max-w-md mx-auto px-4 pt-6 pb-24">
        {renderHeader()}
        
        {loadingContent ? (
          <div className="flex flex-col items-center pt-20">
            <Loader2 size={32} className="text-saffron animate-spin" />
            <p className="text-sm text-gray-400 mt-4">उदाहरणे लोड होत आहेत...</p>
          </div>
        ) : !topicContent ? (
          <div className="text-center pt-16 animate-fade-in">
            <div className="w-16 h-16 rounded-2xl bg-gray-800 flex items-center justify-center mx-auto mb-4">
              <Lightbulb size={24} className="text-gray-500" />
            </div>
            <h2 className="text-base font-bold text-white mb-2">उदाहरणे उपलब्ध नाहीत</h2>
            <p className="text-sm text-gray-400">लवकरच उदाहरणे जोडली जातील. तोपर्यंत सराव करा.</p>
            <button
              onClick={() => setActiveTab("practice")}
              className="mt-6 px-6 py-2.5 bg-dark-card border border-dark-border rounded-xl text-sm font-medium hover:border-saffron/30 transition-colors"
            >
              सराव सुरू करा →
            </button>
          </div>
        ) : (
          <div className="space-y-6 animate-fade-in">
            {/* Example 1 */}
            <div className="glass rounded-2xl overflow-hidden border border-dark-border">
              <div className="bg-white/5 px-4 py-3 border-b border-dark-border flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-saffron/20 flex items-center justify-center text-saffron text-xs font-bold">1</div>
                <h3 className="text-sm font-medium text-white">उदाहरण</h3>
              </div>
              <div className="p-4">
                <p className="text-sm font-semibold text-white mb-4 leading-relaxed">
                  {topicContent.example_q1}
                </p>
                <div className="bg-dark-bg rounded-xl p-4 border border-dark-border/50">
                  <h4 className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-2">स्पष्टीकरण (Solution)</h4>
                  <p className="text-sm text-gray-300 whitespace-pre-line leading-relaxed">
                    {topicContent.example_q1_steps}
                  </p>
                </div>
              </div>
            </div>

            {/* Example 2 */}
            <div className="glass rounded-2xl overflow-hidden border border-dark-border">
              <div className="bg-white/5 px-4 py-3 border-b border-dark-border flex items-center gap-2">
                 <div className="w-6 h-6 rounded-full bg-saffron/20 flex items-center justify-center text-saffron text-xs font-bold">2</div>
                <h3 className="text-sm font-medium text-white">उदाहरण</h3>
              </div>
              <div className="p-4">
                <p className="text-sm font-semibold text-white mb-4 leading-relaxed">
                  {topicContent.example_q2}
                </p>
                <div className="bg-dark-bg rounded-xl p-4 border border-dark-border/50">
                  <h4 className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-2">स्पष्टीकरण (Solution)</h4>
                  <p className="text-sm text-gray-300 whitespace-pre-line leading-relaxed">
                    {topicContent.example_q2_steps}
                  </p>
                </div>
              </div>
            </div>

            {/* Next Action */}
            <button
              onClick={() => setActiveTab("practice")}
              className="w-full btn-primary py-3.5 text-sm font-bold flex flex-col items-center justify-center gap-0.5"
            >
              <span>हे समजले? सराव करूया →</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  // --- PRACTICE TAB ---
  
  if (loadingQuestions) {
    return (
      <div className="max-w-md mx-auto px-4 pt-6 pb-24">
        {renderHeader()}
        <div className="flex flex-col items-center pt-20">
          <Loader2 size={32} className="text-saffron animate-spin" />
          <p className="text-sm text-gray-400 mt-4">प्रश्न लोड होत आहेत...</p>
        </div>
      </div>
    );
  }

  if (errorQuestions) {
    return (
      <div className="max-w-md mx-auto px-4 pt-6 pb-24">
        {renderHeader()}
        <div className="flex flex-col items-center pt-16 text-center animate-fade-in">
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center mb-4">
            <AlertCircle size={28} className="text-red-400" />
          </div>
          <h2 className="text-lg font-bold text-white mb-2">{errorQuestions}</h2>
          <Link href="/practice" className="btn-primary text-sm mt-4">
            ← मागे जा
          </Link>
        </div>
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
        {renderHeader()}
        
        <div className="text-center mb-6 mt-4">
          <div className="w-16 h-16 rounded-2xl bg-saffron-gradient flex items-center justify-center mx-auto mb-3">
            <Trophy size={32} className="text-white" />
          </div>
          <h1 className="text-xl font-bold text-white">सराव पूर्ण! 🎉</h1>
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
              <p className="text-xl font-bold text-blue-400">
                {minutes}:{seconds.toString().padStart(2, "0")}
              </p>
              <p className="text-[10px] text-gray-400">वेळ</p>
            </div>
          </div>
        </div>

        {percentage < 50 && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6 text-center animate-slide-up">
            <p className="text-sm font-medium text-red-400 mb-2">तुम्हाला या विषयात आणखी तयारीची गरज आहे</p>
            <button onClick={() => setActiveTab("learn")} className="text-xs text-white underline hover:text-saffron transition-colors">
              पुन्हा शिका टॅब वर जा
            </button>
          </div>
        )}

        <div className="space-y-2 mb-24 animate-slide-up" style={{ animationDelay: "0.2s" }}>
          <button
            onClick={() => {
              setCurrentIndex(0);
              setSelectedAnswer(null);
              setShowResult(false);
              setScore({ correct: 0, wrong: 0 });
              setQuizFinished(false);
              setLoadingQuestions(true);
              fetchQuestions();
            }}
            className="w-full btn-primary text-sm flex items-center justify-center gap-2"
          >
            <RotateCcw size={16} /> पुन्हा सराव करा
          </button>
          <Link href="/practice" className="w-full btn-secondary text-sm flex items-center justify-center gap-2 block text-center">
            <Home size={16} /> विषय निवडा
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 pt-6 pb-24">
      {renderHeader()}

      <div className="flex justify-between items-center mb-3">
        <p className="text-[10px] text-gray-500 font-medium tracking-wide uppercase">
          प्रश्न {currentIndex + 1} / {questions.length}
        </p>
        <div className="flex gap-3">
          <span className="text-[10px] text-green-400 flex items-center gap-1 font-bold">
            <CheckCircle2 size={12} /> {score.correct}
          </span>
          <span className="text-[10px] text-red-400 flex items-center gap-1 font-bold">
            <XCircle size={12} /> {score.wrong}
          </span>
        </div>
      </div>

      <div className="h-1 bg-dark-card rounded-full overflow-hidden mb-5">
        <div
          className="h-full bg-saffron-gradient transition-all duration-500 ease-out"
          style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
        />
      </div>

      <div className="glass rounded-2xl p-5 mb-5 animate-fade-in" key={currentQuestion?.id}>
        <div className="flex items-center gap-2 mb-3">
          <span
            className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
              currentQuestion?.difficulty === "easy"
                ? "text-green-400 bg-green-400/10"
                : currentQuestion?.difficulty === "hard"
                ? "text-red-400 bg-red-400/10"
                : "text-saffron bg-saffron/10"
            }`}
          >
            {currentQuestion?.difficulty === "easy" ? "सोपे" : currentQuestion?.difficulty === "hard" ? "कठीण" : "मध्यम"}
          </span>
        </div>
        <p className="text-[15px] text-white leading-relaxed font-medium">
          {currentQuestion?.question_marathi}
        </p>
      </div>

      <div className="space-y-2.5 mb-5">
        {(["a", "b", "c", "d"] as const).map((key, idx) => (
          <button
            key={key}
            onClick={() => handleAnswer(key)}
            disabled={showResult}
            className={`w-full flex items-center gap-3 rounded-xl p-3.5 border transition-all duration-300 text-left ${getOptionStyle(key)} ${
              !showResult ? "active:scale-[0.98]" : ""
            }`}
          >
            <span
              className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                showResult && key === currentQuestion.correct_answer
                  ? "bg-green-500/20 text-green-400"
                  : showResult && key === selectedAnswer
                  ? "bg-red-500/20 text-red-400"
                  : "bg-dark-bg text-gray-400"
              }`}
            >
              {String.fromCharCode(65 + idx)}
            </span>
            <span className="text-sm text-white flex-1">{currentQuestion?.options[key]}</span>
            {getOptionIcon(key)}
          </button>
        ))}
      </div>

      {showResult && (
        <div className="animate-slide-up space-y-4">
          
          {/* Answer Feedback / Trick box */}
          {selectedAnswer === currentQuestion?.correct_answer ? (
             <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
               <div className="flex items-center gap-2 mb-2 text-green-400">
                 <CheckCircle2 size={16} />
                 <h4 className="text-sm font-bold">बरोबर उत्तर!</h4>
               </div>
               {(currentQuestion?.trick_used || topicContent?.trick_marathi) && (
                 <div className="text-xs text-gray-300 bg-dark-bg p-3 rounded-lg border border-dark-border mt-2">
                   <span className="text-saffron font-bold block mb-1">लक्षात ठेवा (Trick):</span>
                   <p className="whitespace-pre-line">{currentQuestion?.trick_used || topicContent?.trick_marathi}</p>
                 </div>
               )}
             </div>
          ) : (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
               <div className="flex items-center gap-2 mb-2 text-red-400">
                 <XCircle size={16} />
                 <h4 className="text-sm font-bold">चुकले!</h4>
               </div>
               <p className="text-sm text-gray-300 mb-3">
                 योग्य उत्तर <span className="text-green-400 font-bold">{currentQuestion?.options[currentQuestion.correct_answer as keyof typeof currentQuestion.options]}</span> हे आहे.
               </p>
               
               {(currentQuestion?.trick_used || topicContent?.trick_marathi) && (
                 <div className="text-xs text-gray-300 bg-dark-bg p-3 rounded-lg border border-dark-border">
                   <span className="text-saffron font-bold block mb-1">योग्य पद्धत (Trick):</span>
                   <p className="whitespace-pre-line">{currentQuestion?.trick_used || topicContent?.trick_marathi}</p>
                 </div>
               )}
            </div>
          )}

          <div className="flex gap-3">
            <button
               onClick={() => openAIChat(`मला हा प्रश्न समजला नाही. कृपया समजावून सांगा: ${currentQuestion.question_marathi}`)}
               className="flex-1 py-3.5 rounded-xl border border-saffron/30 text-saffron text-sm font-bold bg-dark-card hover:bg-saffron/10 transition-colors flex items-center justify-center gap-2"
            >
               <MessageCircle size={16} /> AI मदत
            </button>

            <button
              onClick={handleNext}
              className="flex-1 btn-primary text-sm flex items-center justify-center gap-2"
            >
              {currentIndex < questions.length - 1 ? (
                <>पुढील <ChevronRight size={16} /></>
              ) : (
                <>निकाल <Trophy size={16} /></>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
