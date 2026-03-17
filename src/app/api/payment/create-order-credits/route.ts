import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    const options = {
      amount: 5900, // ₹59 in paise
      currency: "INR",
      receipt: `credits_${userId}_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);
    return NextResponse.json({ orderId: order.id, amount: options.amount });
  } catch (error) {
    console.error("Error creating credit order:", error);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}
