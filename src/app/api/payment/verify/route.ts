import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  const supabase = createServerClient();

  try {
    const body = await request.json();
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      user_id,
    } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !user_id) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Verify signature
    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      return NextResponse.json(
        { error: "Invalid payment signature" },
        { status: 400 }
      );
    }

    // Payment verified — update user to premium
    const now = new Date();
    const endDate = new Date(now);
    endDate.setDate(endDate.getDate() + 30); // 30-day subscription

    // Create subscription record
    const { error: subError } = await supabase.from("subscriptions").insert({
      user_id,
      plan: "premium",
      razorpay_payment_id,
      razorpay_subscription_id: razorpay_order_id,
      amount: 9900,
      start_date: now.toISOString(),
      end_date: endDate.toISOString(),
      is_active: true,
    });

    if (subError) {
      console.error("Subscription insert error:", subError);
    }

    // Update user plan + credits
    const { error: userError } = await supabase
      .from("users")
      .update({
        plan: "premium",
        ai_credits: 50,
      })
      .eq("id", user_id);

    if (userError) {
      console.error("User update error:", userError);
      return NextResponse.json(
        { error: "Payment verified but profile update failed" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Premium plan activated! 🎉",
      plan: "premium",
      ai_credits: 50,
      expires: endDate.toISOString(),
    });
  } catch (err: unknown) {
    console.error("Payment verification error:", err);
    return NextResponse.json(
      { error: "Payment verification failed" },
      { status: 500 }
    );
  }
}
