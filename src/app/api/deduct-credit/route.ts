import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "userId required" }, { status: 400 });
    }

    const supabase = createServerClient();

    // Get current credits
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("ai_credits")
      .eq("id", userId)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (userData.ai_credits <= 0) {
      return NextResponse.json(
        { error: "No AI credits remaining", remaining: 0 },
        { status: 403 }
      );
    }

    // Deduct exactly 1 credit
    const newCredits = userData.ai_credits - 1;

    const { error: updateError } = await supabase
      .from("users")
      .update({ ai_credits: newCredits })
      .eq("id", userId);

    if (updateError) {
      console.error("Failed to deduct credit:", updateError);
      return NextResponse.json({ error: "Failed to deduct credit" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      remaining: newCredits,
    });
  } catch (error) {
    console.error("Deduct credit API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
