import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, question_id, is_correct } = body;

    if (!user_id || !question_id || typeof is_correct !== "boolean") {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Upsert the tracking record
    await sql`
      INSERT INTO user_question_history (user_id, question_id, correct, attempts, last_seen_at)
      VALUES (${user_id}, ${question_id}, ${is_correct}, 1, NOW())
      ON CONFLICT (user_id, question_id) 
      DO UPDATE SET 
        correct = EXCLUDED.correct,
        attempts = user_question_history.attempts + 1,
        last_seen_at = NOW();
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Track question error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
