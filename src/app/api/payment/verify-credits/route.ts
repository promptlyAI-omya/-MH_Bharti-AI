import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { sql } from "@/lib/db";

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

    // 2. Add 111 credits
    try {
      // First fetch to know the new total exactly for the response (or we can just DO UPDATE RETURNING)
      const users = await sql`
        UPDATE users 
        SET ai_credits = COALESCE(ai_credits, 0) + 111 
        WHERE id = ${userId}
        RETURNING ai_credits
      `;
      
      const newCredits = users[0]?.ai_credits || 111;

      return NextResponse.json({ success: true, newCredits });
    } catch (updateError) {
      console.error("Failed to update AI credits:", updateError);
      return NextResponse.json({ error: "Failed to update credits" }, { status: 500 });
    }

  } catch (error) {
    console.error("Payment verification error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
