import { NextResponse } from "next/server";
import Razorpay from "razorpay";

export async function POST(req: Request) {
  try {
    const { userId, amount } = await req.json();

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });


    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!amount || amount < 1) {
       return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    const options = {
      amount: amount * 100, // paise converter
      currency: "INR",
      receipt: `don_${String(userId).slice(0, 10)}_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    return NextResponse.json({ 
      orderId: order.id, 
      amount: options.amount,
      key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID 
    });
  } catch (error) {
    console.error("Donation processing error:", error);
    return NextResponse.json(
      { error: "Failed to create donation order" },
      { status: 500 }
    );
  }
}
