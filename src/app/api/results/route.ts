import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, exam, topic, score, total_questions, correct_answers, wrong_answers, time_taken_seconds, is_mock_test } = body;

    if (!user_id || !exam || !topic) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const result = await sql`
      INSERT INTO results (
        user_id, exam, topic, score, 
        total_questions, correct_answers, wrong_answers, 
        time_taken_seconds, is_mock_test
      ) VALUES (
        ${user_id}, ${exam}, ${topic}, ${score}, 
        ${total_questions}, ${correct_answers}, ${wrong_answers}, 
        ${time_taken_seconds || null}, ${is_mock_test || false}
      )
      RETURNING *
    `;
    
    const data = result[0];

    return NextResponse.json({ result: data });
  } catch (error: unknown) {
    console.error("Results API POST error:", error);
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("user_id");

  if (!userId) {
    return NextResponse.json({ error: "user_id required" }, { status: 400 });
  }

  try {
    const results = await sql`
      SELECT * FROM results 
      WHERE user_id = ${userId}
      ORDER BY date DESC
      LIMIT 50
    `;

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
  } catch (error: unknown) {
    console.error("Results API GET error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
