import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, userId } = await req.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !userId) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    // Verify Signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    // Fetch payment amount from Razorpay to safely record the actual value
    const authString = Buffer.from(
      `${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`
    ).toString("base64");
    
    const rpRes = await fetch(
      `https://api.razorpay.com/v1/payments/${razorpay_payment_id}`,
      {
        headers: { Authorization: `Basic ${authString}` },
      }
    );
    const rpData = await rpRes.json();
    
    // Amount is in paise, convert to INR
    const finalAmount = rpData.amount ? rpData.amount / 100 : 0;

    // 1. Record the donation in the `donations` table
    const { error: donationError } = await supabaseAdmin
      .from("donations")
      .insert([
        {
          user_id: userId,
          amount: finalAmount,
          razorpay_payment_id: razorpay_payment_id,
        }
      ]);

    if (donationError) {
      console.error("Failed to insert donation record:", donationError);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    // 2. Fetch current donation total to safely add the new amount
    const { data: userRecord, error: fetchError } = await supabaseAdmin
      .from("users")
      .select("donation_total")
      .eq("id", userId)
      .single();

    if (fetchError) {
      console.error("Error fetching user total:", fetchError);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    const newTotal = (userRecord?.donation_total || 0) + finalAmount;

    // 3. Mark the user as a donor and update their total donations
    const { error: updateError } = await supabaseAdmin
      .from("users")
      .update({ 
        is_donor: true, 
        donation_total: newTotal
      })
      .eq("id", userId);

    if (updateError) throw updateError;

    return NextResponse.json({ success: true, amount: finalAmount });
  } catch (error) {
    console.error("Payment verification failed:", error);
    return NextResponse.json(
      { error: "Payment verification failed" },
      { status: 500 }
    );
  }
}
