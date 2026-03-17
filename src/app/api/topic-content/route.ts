import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const exam = searchParams.get("exam");
  const topic = searchParams.get("topic");

  if (!exam || !topic) {
    return NextResponse.json({ error: "Exam and topic required" }, { status: 400 });
  }

  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("topic_content")
    .select("*")
    .eq("exam", exam)
    .eq("topic_name", topic)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // 0 rows returned - perfectly valid, just no content available
      return NextResponse.json({ data: null }, { status: 200 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}
