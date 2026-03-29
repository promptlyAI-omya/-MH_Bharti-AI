import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function GET(request: Request) {
  // Check authorization header for vercel cron
  const authHeader = request.headers.get('authorization');
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Reset free users
    await sql`UPDATE users SET ai_credits = 10 WHERE plan = 'free'`;

    // Reset premium users
    await sql`UPDATE users SET ai_credits = 50 WHERE plan = 'premium'`;

    return NextResponse.json({ success: true, message: "AI Credits reset successfully" });
  } catch (error) {
    console.error("Error resetting AI credits:", error);
    return NextResponse.json({ error: "Failed to reset credits" }, { status: 500 });
  }
}
