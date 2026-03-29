import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import Groq from "groq-sdk";
import crypto from "crypto";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || '' });

function hashQuestion(text: string): string {
  return crypto.createHash("md5").update(text.trim().toLowerCase()).digest("hex");
}

function chooseModel(question: string): string {
  const wordCount = question.split(/\\s+/).length;
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
      const users = await sql`SELECT ai_credits, plan FROM users WHERE id = ${user_id}`;
      const user = users.length > 0 ? users[0] : null;

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
    let cached = null;
    try {
      const cacheRows = await sql`
        SELECT response, model_used, hit_count 
        FROM ai_cache 
        WHERE question_hash = ${questionHash}
      `;
      cached = cacheRows.length > 0 ? cacheRows[0] : null;
    } catch {} // Ignore cache failure

    let aiResponse: string;
    let model: string;
    let fromCache = false;

    if (cached) {
      aiResponse = cached.response;
      model = cached.model_used;
      fromCache = true;

      // Update hit count
      try {
        await sql`
          UPDATE ai_cache 
          SET hit_count = COALESCE(hit_count, 1) + 1, last_accessed = NOW()
          WHERE question_hash = ${questionHash}
        `;
      } catch {}
    } else {
      // Call Groq
      model = chooseModel(message);
      let activeSystemPrompt = SYSTEM_PROMPT;
      
      // Override system prompt if context (ctx) is provided from practice pages
      if (ctx) {
        activeSystemPrompt = `Tu MH_Bharti AI cha Marathi coach aahes. User ek topic shikto aahe.\\n\\n${ctx}\\n\\nExplain khar tar Marathi madhe, simple language madhe, step by step.`;
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
        await sql`
          INSERT INTO ai_cache (question_hash, question_text, response, model_used)
          VALUES (${questionHash}, ${message}, ${aiResponse}, ${model})
        `;
      } catch {
        // Cache insert failure is non-critical
      }
    }

    // Decrement credits
    if (user_id) {
      try {
        const currentUserRows = await sql`SELECT ai_credits, plan FROM users WHERE id = ${user_id}`;
        const currentUser = currentUserRows.length > 0 ? currentUserRows[0] : null;

        if (currentUser) {
          const newCredits = Math.max(0, currentUser.ai_credits - 1);
          await sql`UPDATE users SET ai_credits = ${newCredits} WHERE id = ${user_id}`;
          remaining = newCredits;
        }
      } catch {}
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
