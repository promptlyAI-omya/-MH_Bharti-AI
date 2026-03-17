import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import Groq from "groq-sdk";
import crypto from "crypto";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || '' });

function hashQuestion(text: string): string {
  return crypto.createHash("md5").update(text.trim().toLowerCase()).digest("hex");
}

function chooseModel(question: string): string {
  const wordCount = question.split(/\s+/).length;
  const complexIndicators = [
    "explain", "विश्लेषण", "compare", "तुलना", "difference", "फरक",
    "why", "का", "how", "कसे", "elaborate", "सविस्तर", "detail",
  ];
  const isComplex =
    wordCount > 20 ||
    complexIndicators.some((w) => question.toLowerCase().includes(w));
  return isComplex ? "llama-3.3-70b-versatile" : "llama-3.1-8b-instant";
}

const SYSTEM_PROMPT = `तुम्ही MH_Bharti AI चे स्मार्ट शिक्षक आहात. तुम्ही महाराष्ट्र सरकारी परीक्षांसाठी (Police Bharti, MPSC, Talathi, Gramsevak) विद्यार्थ्यांना मदत करता.

नियम:
1. मराठी मध्ये उत्तर द्या (इंग्रजी टर्म्स ठेवा)
2. उत्तरे स्पष्ट आणि संक्षिप्त ठेवा
3. उदाहरणे द्या जिथे शक्य असेल
4. परीक्षेशी संबंधित टिप्स द्या
5. विद्यार्थ्यांना प्रोत्साहन द्या`;

export async function POST(request: NextRequest) {
  const supabase = createServerClient();

  try {
    const body = await request.json();
    const { message, user_id, ctx } = body;

    if (!message) {
      return NextResponse.json({ error: "Message required" }, { status: 400 });
    }

    // Check and decrement user credits if logged in
    let remaining: number | null = null;
    let userPlan: string = "free";
    if (user_id) {
      const { data: user } = await supabase
        .from("users")
        .select("ai_credits, plan")
        .eq("id", user_id)
        .single();

      if (user) {
        userPlan = user.plan || "free";
      }

      // Only block free users when credits are exhausted
      if (user && userPlan === "free" && user.ai_credits <= 0) {
        return NextResponse.json(
          {
            error: "credits_exhausted",
            message: "तुमचे आजचे Free AI चॅट संपले आहेत. Premium घ्या! 🚀",
            remaining: 0,
          },
          { status: 429 }
        );
      }
    }

    // Check cache
    const questionHash = hashQuestion(message);
    const { data: cached } = await supabase
      .from("ai_cache")
      .select("response, model_used, hit_count")
      .eq("question_hash", questionHash)
      .single();

    let aiResponse: string;
    let model: string;
    let fromCache = false;

    if (cached) {
      aiResponse = cached.response;
      model = cached.model_used;
      fromCache = true;

      // Update hit count
      await supabase
        .from("ai_cache")
        .update({
          hit_count: (cached.hit_count || 1) + 1,
          last_accessed: new Date().toISOString(),
        })
        .eq("question_hash", questionHash);
    } else {
      // Call Groq
      model = chooseModel(message);
      let activeSystemPrompt = SYSTEM_PROMPT;
      
      // Override system prompt if context (ctx) is provided from practice pages
      if (ctx) {
        activeSystemPrompt = `Tu MH_Bharti AI cha Marathi coach aahes. User ek topic shikto aahe.\n\n${ctx}\n\nExplain khar tar Marathi madhe, simple language madhe, step by step.`;
      }

      const completion = await groq.chat.completions.create({
        messages: [
          { role: "system", content: activeSystemPrompt },
          { role: "user", content: message },
        ],
        model,
        temperature: 0.7,
        max_tokens: 1024,
      });

      aiResponse = completion.choices[0]?.message?.content || "उत्तर मिळवता आले नाही.";

      // Cache response (non-critical, ignore errors)
      try {
        await supabase
          .from("ai_cache")
          .insert({
            question_hash: questionHash,
            question_text: message,
            response: aiResponse,
            model_used: model,
          });
      } catch {
        // Cache insert failure is non-critical
      }
    }

    // Decrement credits (only for free users, premium users have 50 credits/day)
    if (user_id) {
      const { data: currentUser } = await supabase
        .from("users")
        .select("ai_credits, plan")
        .eq("id", user_id)
        .single();

      if (currentUser) {
        if (currentUser.plan === "premium") {
          // Premium users: deduct from their 50 credits
          const newCredits = Math.max(0, currentUser.ai_credits - 1);
          await supabase
            .from("users")
            .update({ ai_credits: newCredits })
            .eq("id", user_id);
          remaining = newCredits;
        } else {
          // Free users: deduct from their 5 credits
          const newCredits = Math.max(0, currentUser.ai_credits - 1);
          await supabase
            .from("users")
            .update({ ai_credits: newCredits })
            .eq("id", user_id);
          remaining = newCredits;
        }
      }
    }

    return NextResponse.json({
      response: aiResponse,
      model,
      cached: fromCache,
      remaining,
    });
  } catch (err: unknown) {
    console.error("AI Chat error:", err);
    return NextResponse.json(
      { error: "AI सेवा सध्या उपलब्ध नाही. पुन्हा प्रयत्न करा." },
      { status: 500 }
    );
  }
}
