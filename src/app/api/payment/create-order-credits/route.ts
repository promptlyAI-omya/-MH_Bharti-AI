import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });


    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    const options = {
      amount: 5900, // ₹59 in paise
      currency: "INR",
      receipt: `cred_${String(userId).slice(0, 10)}_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);
    return NextResponse.json({ 
      orderId: order.id, 
      amount: options.amount,
      key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
    });
  } catch (error) {
    console.error("Error creating credit order:", error);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}
