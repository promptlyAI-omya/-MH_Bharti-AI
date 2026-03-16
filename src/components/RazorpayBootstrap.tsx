"use client";

import { useEffect } from "react";
import { loadRazorpayScript, scheduleRazorpayPreload } from "@/lib/razorpay-client";

export default function RazorpayBootstrap() {
  useEffect(() => {
    void loadRazorpayScript();
    return scheduleRazorpayPreload();
  }, []);

  return null;
}
