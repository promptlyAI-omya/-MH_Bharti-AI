import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const uid = searchParams.get('uid');

    if (!uid) {
      return NextResponse.json({ error: "Missing uid" }, { status: 400 });
    }

    const users = await sql`SELECT * FROM users WHERE id = ${uid}`;

    if (users.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user: users[0] });
  } catch (error: unknown) {
    console.error("Fetch user error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { uid, name, phone, plan, ai_credits, daily_question_count, streak_count, is_donor, donation_total } = body;

    if (!uid) {
      return NextResponse.json({ error: "Missing uid" }, { status: 400 });
    }

    // Coalesce updates to avoid nullifying existing values if they're not sent
    // We do explicit field updates to prevent SQL injection or accidental overwrites
    await sql`
      UPDATE users 
      SET 
        name = COALESCE(${name ?? null}, name),
        phone = COALESCE(${phone ?? null}, phone),
        plan = COALESCE(${plan ?? null}, plan),
        ai_credits = COALESCE(${ai_credits ?? null}, ai_credits),
        daily_question_count = COALESCE(${daily_question_count ?? null}, daily_question_count),
        streak_count = COALESCE(${streak_count ?? null}, streak_count),
        is_donor = COALESCE(${is_donor ?? null}, is_donor),
        donation_total = COALESCE(${donation_total ?? null}, donation_total),
        updated_at = now()
      WHERE id = ${uid}
    `;

    const users = await sql`SELECT * FROM users WHERE id = ${uid}`;
    return NextResponse.json({ user: users[0] });
  } catch (error: unknown) {
    console.error("Update user error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
