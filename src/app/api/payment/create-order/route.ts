import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, amount = 9900, currency = "INR" } = body;
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    const publicKeyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;

    if (!user_id) {
      return NextResponse.json({ error: "user_id required" }, { status: 400 });
    }

    if (!keyId || !keySecret || !publicKeyId) {
      console.error("Missing Razorpay environment variables", {
        hasKeyId: Boolean(keyId),
        hasKeySecret: Boolean(keySecret),
        hasPublicKeyId: Boolean(publicKeyId),
      });
      return NextResponse.json(
        { error: "Razorpay environment variables are not configured" },
        { status: 500 },
      );
    }

    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    const order = await razorpay.orders.create({
      amount,
      currency,
      receipt: `mhbharti_${user_id.slice(0, 8)}_${Date.now()}`,
      notes: {
        user_id,
        plan: "premium",
        app: "mh_bharti_ai",
      },
    });

    return NextResponse.json({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      key_id: publicKeyId,
    });
  } catch (error: unknown) {
    console.error("Razorpay order error:", error);
    return NextResponse.json(
      { error: "Payment order creation failed" },
      { status: 500 },
    );
  }
}
