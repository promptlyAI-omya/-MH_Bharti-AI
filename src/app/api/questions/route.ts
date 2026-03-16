import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const exam = searchParams.get("exam") || "police";
  const topic = searchParams.get("topic");
  const limit = parseInt(searchParams.get("limit") || "10");
  const difficulty = searchParams.get("difficulty");

  const supabase = createServerClient();

  // Build query
  let query = supabase
    .from("questions")
    .select("*")
    .eq("exam", exam);

  if (topic) {
    query = query.eq("topic", topic);
  }

  if (difficulty && difficulty !== "सर्व") {
    const diffMap: Record<string, string> = {
      "सोपे": "easy",
      "मध्यम": "medium",
      "कठीण": "hard",
    };
    query = query.eq("difficulty", diffMap[difficulty] || difficulty);
  }

  // Random order for practice
  query = query.limit(limit);

  const { data: questions, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Shuffle questions for randomness
  const shuffled = (questions || []).sort(() => Math.random() - 0.5);

  return NextResponse.json({
    questions: shuffled,
    count: shuffled.length,
  });
}
