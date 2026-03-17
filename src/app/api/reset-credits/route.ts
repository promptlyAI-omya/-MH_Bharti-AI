import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

export async function GET(request: Request) {
  // Check authorization header for vercel cron
  const authHeader = request.headers.get('authorization');
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServerClient();

  try {
    // Reset free users
    await supabase
      .from("users")
      .update({ ai_credits: 10 })
      .eq("plan", "free");

    // Reset premium users
    await supabase
      .from("users")
      .update({ ai_credits: 50 })
      .eq("plan", "premium");

    return NextResponse.json({ success: true, message: "AI Credits reset successfully" });
  } catch (error) {
    console.error("Error resetting AI credits:", error);
    return NextResponse.json({ error: "Failed to reset credits" }, { status: 500 });
  }
}
