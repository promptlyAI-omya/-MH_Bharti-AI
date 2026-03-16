"use client";

import { useState, useEffect, useCallback } from "react";
import {
  BarChart3,
  TrendingUp,
  Target,
  Award,
  Calendar,
  Flame,
  BookOpen,
  Brain,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/components/SupabaseProvider";
import Link from "next/link";

interface StatsData {
  totalQuestions: number;
  totalCorrect: number;
  overallScore: number;
  totalSessions: number;
  topicBreakdown: Record<string, { correct: number; total: number }>;
}

interface Result {
  id: string;
  exam: string;
  topic: string;
  score: number;
  total_questions: number;
  correct_answers: number;
  wrong_answers: number;
  date: string;
  is_mock_test: boolean;
}

const topicColors: Record<string, string> = {
  "gk": "bg-saffron",
  "math": "bg-blue-500",
  "marathi": "bg-green-500",
  "reasoning": "bg-purple-500",
  "science": "bg-pink-500",
  "default": "bg-yellow-500",
};

const topicLabels: Record<string, string> = {
  "gk": "सामान्य ज्ञान",
  "math": "गणित",
  "marathi": "मराठी",
  "reasoning": "बुद्धिमत्ता चाचणी",
  "science": "विज्ञान",
};

export default function ProgressPage() {
  const { user, profile } = useAuth();
  const [stats, setStats] = useState<StatsData | null>(null);
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProgress = useCallback(async () => {
    try {
      const res = await fetch(`/api/results?user_id=${user?.id}`);
      const data = await res.json();
      if (data.stats) {
        setStats(data.stats);
      }
      if (data.results) {
        setResults(data.results);
      }
    } catch {
      // Silently handle error
    }
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) {
      fetchProgress();
    } else {
      setLoading(false);
    }
  }, [user, fetchProgress]);

  const overallScore = stats?.overallScore ?? 0;
  const streak = profile?.streak_count ?? 0;

  const overviewStats = [
    {
      label: "एकूण प्रश्न",
      value: stats?.totalQuestions?.toString() || "0",
      icon: Target,
      color: "text-saffron",
      bgColor: "bg-saffron/10",
    },
    {
      label: "बरोबर उत्तरे",
      value: stats?.totalCorrect?.toString() || "0",
      icon: Award,
      color: "text-green-400",
      bgColor: "bg-green-400/10",
    },
    {
      label: "सराव दिवस",
      value: stats?.totalSessions?.toString() || "0",
      icon: Calendar,
      color: "text-blue-400",
      bgColor: "bg-blue-400/10",
    },
    {
      label: "स्ट्रीक",
      value: streak.toString(),
      icon: Flame,
      color: "text-orange-400",
      bgColor: "bg-orange-400/10",
    },
  ];

  // Build topic progress from real data
  const topicProgress = Object.entries(stats?.topicBreakdown || {}).map(
    ([topic, data]) => ({
      topic: topicLabels[topic] || topic,
      progress: data.correct,
      total: data.total,
      color: topicColors[topic] || topicColors["default"],
    })
  );

  // Default topics if no data
  const displayTopics =
    topicProgress.length > 0
      ? topicProgress
      : [
          { topic: "सामान्य ज्ञान", progress: 0, total: 0, color: "bg-saffron" },
          { topic: "गणित", progress: 0, total: 0, color: "bg-blue-500" },
          { topic: "मराठी", progress: 0, total: 0, color: "bg-green-500" },
          { topic: "बुद्धिमत्ता चाचणी", progress: 0, total: 0, color: "bg-purple-500" },
        ];

  // Recent results for activity
  const recentResults = results.slice(0, 5);

  if (loading) {
    return (
      <div className="max-w-md mx-auto px-4 pt-20 flex flex-col items-center">
        <Loader2 size={32} className="text-saffron animate-spin" />
        <p className="text-sm text-gray-400 mt-4">प्रगती लोड होत आहे...</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 pt-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-saffron-gradient flex items-center justify-center">
          <BarChart3 size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-white">तुमची प्रगती</h1>
          <p className="text-[11px] text-gray-400">
            तुमचा अभ्यास ट्रॅक करा
          </p>
        </div>
      </div>

      {/* Login prompt if not authenticated */}
      {!user && (
        <div className="glass rounded-2xl p-6 text-center mb-5 animate-slide-up">
          <Brain size={32} className="text-saffron mx-auto mb-3" />
          <h2 className="text-sm font-bold text-white mb-1">
            लॉगिन करा
          </h2>
          <p className="text-xs text-gray-400 mb-4">
            तुमची प्रगती पाहण्यासाठी कृपया लॉगिन करा
          </p>
          <Link href="/login" className="btn-primary text-xs inline-block">
            लॉगिन करा →
          </Link>
        </div>
      )}

      {/* Overall Score Card */}
      <section className="mb-5 animate-slide-up">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-navy via-navy-500 to-saffron/20 p-5">
          <div className="absolute top-0 right-0 w-28 h-28 bg-saffron/10 rounded-full blur-3xl" />
          <div className="relative z-10 flex items-center gap-5">
            <div className="relative">
              <svg className="w-20 h-20" viewBox="0 0 100 100">
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
                    overallScore >= 70
                      ? "#22c55e"
                      : overallScore >= 40
                      ? "#FF6B00"
                      : overallScore > 0
                      ? "#ef4444"
                      : "#FF6B00"
                  }
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray="264"
                  strokeDashoffset={264 - (264 * overallScore) / 100}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                  style={{ transform: "rotate(-90deg)", transformOrigin: "center" }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xl font-bold text-white">{overallScore}%</span>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">एकूण स्कोर</h3>
              <p className="text-[11px] text-gray-400 mt-0.5">
                {stats?.totalSessions
                  ? `${stats.totalSessions} सत्रे पूर्ण`
                  : "अभ्यास सुरू करा!"}
              </p>
              <div className="flex items-center gap-1.5 mt-2">
                <TrendingUp size={12} className={overallScore > 0 ? "text-green-400" : "text-gray-400"} />
                <span className="text-[10px] text-gray-400">
                  {overallScore > 0
                    ? `${stats?.totalCorrect}/${stats?.totalQuestions} बरोबर`
                    : "आज सुरुवात करा"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Grid */}
      <section className="mb-5 animate-slide-up" style={{ animationDelay: "0.1s" }}>
        <div className="grid grid-cols-2 gap-3">
          {overviewStats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="glass rounded-xl p-3.5 card-hover">
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className={`w-8 h-8 rounded-lg ${stat.bgColor} flex items-center justify-center`}
                  >
                    <Icon size={16} className={stat.color} />
                  </div>
                </div>
                <p className="text-xl font-bold text-white">{stat.value}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  {stat.label}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Topic-wise Progress */}
      <section className="mb-5 animate-slide-up" style={{ animationDelay: "0.2s" }}>
        <h3 className="text-sm font-bold text-white mb-3">
          विषयानुसार प्रगती
        </h3>
        <div className="glass rounded-xl p-4 space-y-3.5">
          {displayTopics.map((topic) => {
            const percentage =
              topic.total > 0
                ? Math.round((topic.progress / topic.total) * 100)
                : 0;
            return (
              <div key={topic.topic}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-white font-medium">
                    {topic.topic}
                  </span>
                  <span className="text-[10px] text-gray-400">
                    {topic.total > 0 ? `${topic.progress}/${topic.total} (${percentage}%)` : "—"}
                  </span>
                </div>
                <div className="h-2 bg-dark-bg rounded-full overflow-hidden">
                  <div
                    className={`h-full ${topic.color} rounded-full transition-all duration-700 ease-out`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Recent Activity */}
      <section className="mb-24 animate-slide-up" style={{ animationDelay: "0.3s" }}>
        <h3 className="text-sm font-bold text-white mb-3">अलीकडील क्रिया</h3>
        <div className="space-y-2">
          {recentResults.length > 0 ? (
            recentResults.map((result) => {
              const Icon = result.is_mock_test ? Target : BookOpen;
              const dateStr = new Date(result.date).toLocaleDateString("mr-IN", {
                day: "numeric",
                month: "short",
              });
              return (
                <div
                  key={result.id}
                  className="glass rounded-xl p-3.5 flex items-center gap-3 card-hover"
                >
                  <div className="w-9 h-9 rounded-lg bg-dark-bg flex items-center justify-center">
                    <Icon size={16} className="text-gray-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-white">
                      {topicLabels[result.topic] || result.topic}
                    </p>
                    <p className="text-[10px] text-gray-500">
                      {result.correct_answers}/{result.total_questions} बरोबर •{" "}
                      {result.score}%
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-gray-500">{dateStr}</span>
                    <ChevronRight size={12} className="text-gray-500" />
                  </div>
                </div>
              );
            })
          ) : (
            // Empty state
            <>
              {[
                { type: "practice", label: "सराव पूर्ण", detail: "अद्याप कोणताही सराव नाही", icon: BookOpen },
                { type: "test", label: "मॉक टेस्ट", detail: "अद्याप कोणताही टेस्ट नाही", icon: Target },
                { type: "ai", label: "AI चॅट", detail: "अद्याप कोणताही चॅट नाही", icon: Brain },
              ].map((activity) => {
                const Icon = activity.icon;
                return (
                  <div
                    key={activity.type}
                    className="glass rounded-xl p-3.5 flex items-center gap-3 card-hover"
                  >
                    <div className="w-9 h-9 rounded-lg bg-dark-bg flex items-center justify-center">
                      <Icon size={16} className="text-gray-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-medium text-white">
                        {activity.label}
                      </p>
                      <p className="text-[10px] text-gray-500">
                        {activity.detail}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-gray-500">--</span>
                      <ChevronRight size={12} className="text-gray-500" />
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      </section>
    </div>
  );
}
