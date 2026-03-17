import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    const { error } = await supabase
      .from("user_question_history")
      .delete()
      .eq("user_id", userId);

    if (error) {
        console.error("Reset history error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
      console.error("Reset history error:", error);
      return NextResponse.json(
        { error: "Internal Server Error" },
        { status: 500 }
      );
  }
}
