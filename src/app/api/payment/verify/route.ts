import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
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

    if (!keySecret) {
      console.error("Missing RAZORPAY_KEY_SECRET for verification");
      return NextResponse.json(
        { error: "Payment verification is not configured" },
        { status: 500 },
      );
    }

    const generatedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      return NextResponse.json(
        { error: "Invalid payment signature" },
        { status: 400 },
      );
    }

    const now = new Date();
    const endDate = new Date(now);
    endDate.setDate(endDate.getDate() + 30);

    try {
      await sql`
        INSERT INTO subscriptions (
          user_id, plan, razorpay_payment_id, razorpay_subscription_id, 
          amount, start_date, end_date, is_active
        ) VALUES (
          ${user_id}, 'premium', ${razorpay_payment_id}, ${razorpay_order_id}, 
          9900, ${now.toISOString()}, ${endDate.toISOString()}, true
        )
      `;
    } catch (subError) {
      console.error("Subscription insert error:", subError);
    }

    try {
      await sql`
        UPDATE users 
        SET plan = 'premium', ai_credits = 50 
        WHERE id = ${user_id}
      `;
    } catch (userError) {
      console.error("User update error:", userError);
      return NextResponse.json(
        { error: "Payment verified but profile update failed" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Premium plan activated!",
      plan: "premium",
      ai_credits: 50,
      expires: endDate.toISOString(),
    });
  } catch (error: unknown) {
    console.error("Payment verification error:", error);
    return NextResponse.json(
      { error: "Payment verification failed" },
      { status: 500 },
    );
  }
}
