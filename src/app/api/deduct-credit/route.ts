import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "userId required" }, { status: 400 });
    }

    const updatedRows = await sql`
      UPDATE users
      SET ai_credits = ai_credits - 1
      WHERE id = ${userId} AND ai_credits > 0
      RETURNING ai_credits
    `;

    if (updatedRows.length === 0) {
      const users = await sql`SELECT ai_credits FROM users WHERE id = ${userId}`;
      const userData = users[0];

      if (!userData) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      return NextResponse.json(
        { error: "No AI credits remaining", remaining: 0 },
        { status: 403 }
      );
    }

    const newCredits = updatedRows[0].ai_credits;

    return NextResponse.json({
      success: true,
      remaining: newCredits,
    });
  } catch (error) {
    console.error("Deduct credit API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
