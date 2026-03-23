"use client";

import { useEffect } from "react";
import { scheduleRazorpayPreload } from "@/lib/razorpay-client";

export default function RazorpayBootstrap() {
  useEffect(() => {
    // Only preload during idle — actual loading happens on-demand when payment is initiated
    return scheduleRazorpayPreload();
  }, []);

  return null;
}
