import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  const supabase = createServerClient();

  try {
    const body = await request.json();
    const { user_id, exam, topic, score, total_questions, correct_answers, wrong_answers, time_taken_seconds, is_mock_test } = body;

    if (!user_id || !exam || !topic) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { data, error } = await supabase.from("results").insert({
      user_id,
      exam,
      topic,
      score,
      total_questions,
      correct_answers,
      wrong_answers,
      time_taken_seconds: time_taken_seconds || null,
      is_mock_test: is_mock_test || false,
    }).select().single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Update user streak
    try {
      await supabase.rpc("update_streak_if_needed", { p_user_id: user_id });
    } catch {
      // Streak RPC may not exist yet, ignore
    }

    return NextResponse.json({ result: data });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("user_id");

  if (!userId) {
    return NextResponse.json({ error: "user_id required" }, { status: 400 });
  }

  const supabase = createServerClient();

  const { data: results, error } = await supabase
    .from("results")
    .select("*")
    .eq("user_id", userId)
    .order("date", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Calculate stats
  const totalQuestions = results?.reduce((acc, r) => acc + r.total_questions, 0) || 0;
  const totalCorrect = results?.reduce((acc, r) => acc + r.correct_answers, 0) || 0;
  const overallScore = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

  // Topic-wise breakdown
  const topicMap: Record<string, { correct: number; total: number }> = {};
  results?.forEach((r) => {
    if (!topicMap[r.topic]) topicMap[r.topic] = { correct: 0, total: 0 };
    topicMap[r.topic].correct += r.correct_answers;
    topicMap[r.topic].total += r.total_questions;
  });

  return NextResponse.json({
    results,
    stats: {
      totalQuestions,
      totalCorrect,
      overallScore,
      totalSessions: results?.length || 0,
      topicBreakdown: topicMap,
    },
  });
}
