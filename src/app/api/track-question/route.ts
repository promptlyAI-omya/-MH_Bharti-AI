import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

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

    const supabase = createServerClient();

    // Fetch existing record if any to increment attempts
    const { data: existing } = await supabase
      .from("user_question_history")
      .select("attempts")
      .eq("user_id", user_id)
      .eq("question_id", question_id)
      .single();

    const attempts = existing ? existing.attempts + 1 : 1;

    // Upsert the tracking record
    const { error } = await supabase
      .from("user_question_history")
      .upsert({
        user_id,
        question_id,
        correct: is_correct,
        attempts,
        last_seen_at: new Date().toISOString()
      }, {
        onConflict: "user_id, question_id"
      });

    if (error) {
       console.error("Track question error:", error);
       return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Track question error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
