import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createServerClient } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, userId } = await req.json();

    // 1. Verify Signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 });
    }

    const supabase = createServerClient();

    // 2. Fetch current credits
    const { data: userData, error: fetchError } = await supabase
      .from("users")
      .select("ai_credits")
      .eq("id", userId)
      .single();

    if (fetchError || !userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 3. Add 111 credits
    const newCredits = (userData.ai_credits || 0) + 111;

    const { error: updateError } = await supabase
      .from("users")
      .update({ ai_credits: newCredits })
      .eq("id", userId);

    if (updateError) {
      console.error("Failed to update AI credits:", updateError);
      return NextResponse.json({ error: "Failed to update credits" }, { status: 500 });
    }

    return NextResponse.json({ success: true, newCredits });
  } catch (error) {
    console.error("Payment verification error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
