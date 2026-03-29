"use client";

import { useState, Suspense, useEffect } from "react";
import {
  signUpWithEmail,
  loginWithEmail,
  loginWithGoogle,
  setupRecaptcha,
  sendPhoneCode,
  verifyPhoneCode
} from "@/lib/auth";
import { RecaptchaVerifier } from "firebase/auth";
import type { ConfirmationResult } from "firebase/auth";
import {
  Zap,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  Loader2,
  Phone
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/components/ToastProvider";

type AuthMode = "login" | "signup" | "phone";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlError = searchParams.get("error");
  const { toast } = useToast();

  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phone, setPhone] = useState("+91");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [recaptchaVerifier, setRecaptchaVerifier] = useState<RecaptchaVerifier | null>(null);

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(
    urlError === "auth_failed" ? "Login अयशस्वी. कृपया पुन्हा प्रयत्न करा." : ""
  );

  useEffect(() => {
    // Initialize recaptcha when in phone mode
    if (mode === "phone" && !recaptchaVerifier) {
      try {
        const verifier = setupRecaptcha("recaptcha-container");
        setRecaptchaVerifier(verifier);
      } catch (err) {
        console.error("Recaptcha setup error:", err);
      }
    }
  }, [mode, recaptchaVerifier]);

  // ── Google OAuth ──
  const handleGoogleLogin = async () => {
    setError("");
    setLoading(true);
    try {
      await loginWithGoogle();
      toast("यशस्वीरीत्या Login केले!");
      router.push("/");
      router.refresh();
    } catch (e) {
      const error = e as { code?: string };
      console.error(error);
      if (error.code === 'auth/popup-closed-by-user') {
        setError("Login रद्द केले.");
      } else {
        setError("Google Login अयशस्वी. पुन्हा प्रयत्न करा.");
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Email + Password ──
  const handleEmailAuth = async () => {
    setError("");

    if (!email.trim()) {
      setError("हे field भरणे आवश्यक आहे");
      return;
    }
    if (!password) {
      setError("हे field भरणे आवश्यक आहे");
      return;
    }

    if (mode === "signup") {
      if (password.length < 6) {
        setError("Password कमीत कमी 6 अक्षरे असावे");
        return;
      }
      if (password !== confirmPassword) {
        setError("Passwords जुळत नाहीत");
        return;
      }
    }

    setLoading(true);
    try {
      if (mode === "signup") {
        await signUpWithEmail(email.trim(), password);
        toast("🎉 खाते तयार झाले! Welcome to MH_Bharti AI");
        router.push("/");
        router.refresh();
      } else {
        // Login
        await loginWithEmail(email.trim(), password);
        toast("यशस्वीरीत्या Login केले!");
        router.push("/");
        router.refresh();
      }
    } catch (e) {
      const error = e as { code?: string };
      console.error(error);
      if (error.code === 'auth/email-already-in-use') {
        setError("❌ हा email आधीच वापरला आहे. Login करा.");
      } else if (error.code === 'auth/too-many-requests') {
        setError("⏳ खूप attempts झाले. थोड्या वेळाने प्रयत्न करा.");
      } else if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
        setError("❌ Email किंवा Password चुकीचे आहे");
      } else {
        setError("❌ काहीतरी चुकले. पुन्हा प्रयत्न करा.");
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Phone Auth ──
  const handleSendOtp = async () => {
    setError("");
    if (!phone || phone.length < 10) {
      setError("कृपया योग्य मोबाईल नंबर टाका");
      return;
    }

    setLoading(true);
    try {
      if (!recaptchaVerifier) throw new Error("Recaptcha not initialized");
      
      const result = await sendPhoneCode(phone, recaptchaVerifier);
      setConfirmationResult(result);
      setOtpSent(true);
      toast("OTP पाठवला आहे!");
    } catch (e) {
      const error = e as { code?: string };
      console.error("OTP Error:", error);
      if (error.code === 'auth/invalid-phone-number') {
        setError("मोबाईल नंबर चुकीचा आहे. (उदा: +919876543210)");
      } else {
        setError("कधीतरी चूक झाली. पुन्हा प्रयत्न करा.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setError("");
    if (!otp || otp.length !== 6) {
      setError("कृपया 6-अंकी OTP टाका");
      return;
    }

    setLoading(true);
    try {
      if (!confirmationResult) throw new Error("No confirmation result");
      await verifyPhoneCode(confirmationResult, otp);
      
      toast("यशस्वीरीत्या Login केले!");
      router.push("/");
      router.refresh();
    } catch (e) {
      const error = e as { code?: string };
      console.error("Verify Error:", error);
      if (error.code === 'auth/invalid-verification-code') {
        setError("OTP चुकीचा आहे.");
      } else if (error.code === 'auth/code-expired') {
        setError("OTP expired झाला आहे. पुन्हा प्रयत्न करा.");
      } else {
        setError("काहीतरी चूक झाली. पुन्हा प्रयत्न करा.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 min-h-screen flex flex-col">
      {/* Back Button */}
      <div className="pt-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={16} />
          मागे जा
        </Link>
      </div>

      {/* Logo + Title */}
      <div className="flex-1 flex flex-col items-center justify-center -mt-6">
        <div className="w-16 h-16 rounded-2xl bg-saffron-gradient flex items-center justify-center mb-4 animate-pulse-glow">
          <Zap size={32} className="text-white" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-1">MH_Bharti AI</h1>
        <p className="text-sm text-gray-400 mb-6">
          महाराष्ट्राचं स्वतःचं Exam Prep AI
        </p>

        {/* ── Google OAuth Button ── */}
        <div className="w-full animate-slide-up">
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 glass rounded-xl px-4 py-3.5 hover:bg-white/[0.04] transition-all active:scale-[0.98] disabled:opacity-50"
          >
            <svg width="18" height="18" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            <span className="text-sm font-medium text-white">
              Google ने Login करा
            </span>
          </button>
        </div>

        {/* ── OR Divider ── */}
        <div className="w-full flex items-center gap-3 my-5 animate-slide-up" style={{ animationDelay: "0.05s" }}>
          <div className="flex-1 h-px bg-dark-border" />
          <span className="text-xs text-gray-500 font-medium">किंवा</span>
          <div className="flex-1 h-px bg-dark-border" />
        </div>

        {/* ── Form Card ── */}
        <div className="w-full glass rounded-2xl p-5 animate-slide-up" style={{ animationDelay: "0.1s" }}>
          {/* Recaptcha container for Phone Auth */}
          <div id="recaptcha-container"></div>

          {mode === "phone" ? (
            /* ── Phone Auth Form ── */
            <>
              <div className="flex items-center gap-2 mb-4">
                <Phone size={18} className="text-saffron" />
                <h2 className="text-base font-bold text-white">
                  Phone ने Login करा
                </h2>
              </div>
              <p className="text-xs text-gray-400 mb-4">
                तुमच्या मोबाईल नंबरवर OTP पाठवला जाईल
              </p>

              {!otpSent ? (
                <>
                  <div className="relative mb-4">
                    <Phone
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                    />
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      placeholder="+919876543210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-dark-bg border border-dark-border rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-saffron/40 transition-colors"
                    />
                  </div>

                  {error && <p className="text-xs text-red-400 mb-3">{error}</p>}

                  <button
                    onClick={handleSendOtp}
                    disabled={loading || phone.length < 10}
                    className="w-full btn-primary text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <>OTP पाठवा →</>
                    )}
                  </button>
                </>
              ) : (
                <>
                  <div className="relative mb-4">
                    <Lock
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                    />
                    <input
                      id="otp"
                      name="otp"
                      type="text"
                      maxLength={6}
                      placeholder="6-Digit OTP"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      className="w-full bg-dark-bg border border-dark-border rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-saffron/40 transition-colors tracking-widest text-center"
                    />
                  </div>

                  {error && <p className="text-xs text-red-400 mb-3">{error}</p>}

                  <button
                    onClick={handleVerifyOtp}
                    disabled={loading || otp.length !== 6}
                    className="w-full btn-primary text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <>OTP Verify करा →</>
                    )}
                  </button>

                  <button
                    onClick={() => {
                      setOtpSent(false);
                      setOtp("");
                    }}
                    className="w-full text-center text-xs text-gray-500 mt-4 hover:text-white transition-colors"
                  >
                    नंबर बदला
                  </button>
                </>
              )}

              <button
                onClick={() => {
                  setMode("login");
                  setError("");
                }}
                className="w-full text-center text-xs text-gray-500 mt-4 hover:text-saffron transition-colors"
              >
                Email/Password ने Login करा
              </button>
            </>
          ) : (
            /* ── Email + Password Form ── */
            <>
              <div className="flex items-center gap-2 mb-4">
                <Mail size={18} className="text-saffron" />
                <h2 className="text-base font-bold text-white">
                  {mode === "signup" ? "नवीन Account बनवा" : "Email ने Login करा"}
                </h2>
              </div>

              {/* Email */}
              <div className="relative mb-3">
                <Mail
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-dark-bg border border-dark-border rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-saffron/40 transition-colors"
                />
              </div>

              {/* Password */}
              <div className="relative mb-3">
                <Lock
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-dark-bg border border-dark-border rounded-xl pl-10 pr-10 py-3 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-saffron/40 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {/* Confirm Password (signup only) */}
              {mode === "signup" && (
                <div className="relative mb-3">
                  <Lock
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                  />
                  <input
                    id="confirm-password"
                    name="confirm-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-dark-bg border border-dark-border rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-saffron/40 transition-colors"
                  />
                </div>
              )}

              {error && (
                <div className="mb-3">
                  <p className="text-xs text-red-400">{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                onClick={handleEmailAuth}
                disabled={loading || !email.trim() || !password}
                className="w-full btn-primary text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : mode === "signup" ? (
                  <>Account बनवा →</>
                ) : (
                  <>Login करा →</>
                )}
              </button>

              {/* Toggle login/signup */}
              <div className="flex items-center justify-between mt-3">
                <button
                  onClick={() => {
                    setMode(mode === "login" ? "signup" : "login");
                    setError("");
                    setConfirmPassword("");
                  }}
                  className="text-xs text-saffron hover:underline"
                >
                  {mode === "login"
                    ? "नवीन account बनवा →"
                    : "← आधीच account आहे? Login करा"}
                </button>
                <button
                  onClick={() => {
                    setMode("phone");
                    setError("");
                  }}
                  className="text-xs text-gray-500 hover:text-saffron transition-colors"
                >
                  Phone OTP Login
                </button>
              </div>
            </>
          )}
        </div>

        {/* Terms */}
        <p className="text-[10px] text-gray-600 mt-6 text-center max-w-[280px] leading-relaxed">
          Login करून तुम्ही आमच्या{" "}
          <Link href="/terms" className="text-saffron hover:underline">
            Terms
          </Link>{" "}
          आणि{" "}
          <Link href="/privacy" className="text-saffron hover:underline">
            Privacy Policy
          </Link>{" "}
          शी सहमत आहात
        </p>
      </div>
    </div>
  );
}
