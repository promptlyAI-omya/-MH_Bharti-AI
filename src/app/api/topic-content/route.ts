import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const exam = searchParams.get("exam");
  const topic = searchParams.get("topic");

  if (!exam || !topic) {
    return NextResponse.json({ error: "Exam and topic required" }, { status: 400 });
  }

  try {
    const rows = await sql`
      SELECT * FROM topic_content 
      WHERE exam = ${exam} AND topic_name = ${topic}
      LIMIT 1
    `;

    const data = rows.length > 0 ? rows[0] : null;

    if (!data) {
      // 0 rows returned - perfectly valid, just no content available
      return NextResponse.json({ data: null }, { status: 200 });
    }

    return NextResponse.json({ data });
  } catch (error: unknown) {
    console.error("Topic content error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
