"use client";

import {
  BookOpen,
  Shield,
  Landmark,
  FileCheck,
  Users,
  ChevronRight,
  Filter,
  Search,
  Lock,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/components/SupabaseProvider";

const topics = [
  {
    exam: "police",
    name: "पोलीस भरती",
    icon: Shield,
    color: "from-orange-600 to-red-700",
    subjects: [
      { name: "मराठी व्याकरण", questions: 350, free: true },
      { name: "गणित", questions: 420, free: true },
      { name: "बुद्धिमत्ता चाचणी", questions: 280, free: true },
      { name: "सामान्य ज्ञान", questions: 510, free: false },
      { name: "कायदे व नियम", questions: 200, free: false },
      { name: "चालू घडामोडी", questions: 300, free: false },
    ],
  },
  {
    exam: "mpsc",
    name: "MPSC",
    icon: Landmark,
    color: "from-blue-600 to-indigo-800",
    subjects: [
      { name: "भारतीय राज्यघटना", questions: 600, free: true },
      { name: "इतिहास", questions: 450, free: true },
      { name: "भूगोल", questions: 380, free: true },
      { name: "अर्थशास्त्र", questions: 320, free: false },
      { name: "विज्ञान", questions: 410, free: false },
      { name: "पर्यावरण", questions: 250, free: false },
    ],
  },
  {
    exam: "talathi",
    name: "तलाठी",
    icon: FileCheck,
    color: "from-emerald-600 to-teal-800",
    subjects: [
      { name: "महसूल कायदा", questions: 280, free: true },
      { name: "ग्रामीण विकास", questions: 200, free: true },
      { name: "संगणक ज्ञान", questions: 150, free: false },
      { name: "मराठी", questions: 300, free: true },
    ],
  },
  {
    exam: "gramsevak",
    name: "ग्रामसेवक",
    icon: Users,
    color: "from-purple-600 to-violet-800",
    subjects: [
      { name: "पंचायत राज", questions: 350, free: true },
      { name: "कृषी", questions: 280, free: true },
      { name: "समाजशास्त्र", questions: 200, free: false },
      { name: "ग्रामीण अर्थव्यवस्था", questions: 180, free: false },
    ],
  },
];

const difficulties = ["सर्व", "सोपे", "मध्यम", "कठीण"];

export default function PracticePage() {
  const { profile } = useAuth();
  const isPremium = profile?.plan === "premium";
  const [selectedExam, setSelectedExam] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState("सर्व");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTopics = selectedExam
    ? topics.filter((t) => t.exam === selectedExam)
    : topics;

  return (
    <div className="max-w-md mx-auto px-4 pt-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-saffron-gradient flex items-center justify-center">
          <BookOpen size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-white">सराव करा</h1>
          <p className="text-[11px] text-gray-400">
            विषय निवडा आणि सराव सुरू करा
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
        />
        <input
          type="text"
          placeholder="विषय शोधा..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-dark-card border border-dark-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-saffron/30 transition-colors"
        />
      </div>

      {/* Exam Filter Chips */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-4 scrollbar-hide">
        <button
          onClick={() => setSelectedExam(null)}
          className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
            !selectedExam
              ? "bg-saffron text-white"
              : "bg-dark-card text-gray-400 border border-dark-border"
          }`}
        >
          सर्व परीक्षा
        </button>
        {topics.map((topic) => (
          <button
            key={topic.exam}
            onClick={() =>
              setSelectedExam(selectedExam === topic.exam ? null : topic.exam)
            }
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
              selectedExam === topic.exam
                ? "bg-saffron text-white"
                : "bg-dark-card text-gray-400 border border-dark-border"
            }`}
          >
            {topic.name}
          </button>
        ))}
      </div>

      {/* Difficulty Filter */}
      <div className="flex items-center gap-2 mb-5">
        <Filter size={14} className="text-gray-500" />
        <div className="flex gap-1.5">
          {difficulties.map((diff) => (
            <button
              key={diff}
              onClick={() => setSelectedDifficulty(diff)}
              className={`px-3 py-1 rounded-lg text-[10px] font-medium transition-all ${
                selectedDifficulty === diff
                  ? "bg-navy text-white"
                  : "bg-dark-card text-gray-500 border border-dark-border"
              }`}
            >
              {diff}
            </button>
          ))}
        </div>
      </div>

      {/* Topic Cards */}
      <div className="space-y-4 mb-24">
        {filteredTopics.map((topic) => {
          const Icon = topic.icon;
          const filteredSubjects = searchQuery
            ? topic.subjects.filter((s) =>
                s.name.includes(searchQuery)
              )
            : topic.subjects;

          if (filteredSubjects.length === 0) return null;

          return (
            <div key={topic.exam} className="animate-fade-in">
              <div className="flex items-center gap-2 mb-2">
                <div
                  className={`w-6 h-6 rounded-lg bg-gradient-to-br ${topic.color} flex items-center justify-center`}
                >
                  <Icon size={14} className="text-white" />
                </div>
                <h3 className="text-sm font-bold text-white">{topic.name}</h3>
              </div>
              <div className="grid gap-2">
                {filteredSubjects.map((subject) => {
                  const isAccessible = subject.free || isPremium;
                  return (
                    <Link
                      key={subject.name}
                      href={
                        isAccessible
                          ? `/practice/${topic.exam}/${encodeURIComponent(subject.name)}`
                          : "#"
                      }
                    >
                      <div className="glass rounded-xl p-3 flex items-center justify-between card-hover">
                        <div className="flex items-center gap-3">
                          {!isAccessible && (
                            <Lock size={14} className="text-gray-500" />
                          )}
                          <div>
                            <p className="text-sm font-medium text-white">
                              {subject.name}
                            </p>
                            <p className="text-[10px] text-gray-500">
                              {subject.questions} प्रश्न
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {!isAccessible && (
                            <span className="text-[9px] bg-saffron/10 text-saffron px-2 py-0.5 rounded-full font-medium">
                              Premium
                            </span>
                          )}
                          <ChevronRight size={16} className="text-gray-500" />
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

