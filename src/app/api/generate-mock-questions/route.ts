// Trigger rebuild
import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { createServerClient } from "@/lib/supabase";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { userId, subjects, count = 25 } = await req.json();

    if (!userId || !subjects || !Array.isArray(subjects) || subjects.length === 0) {
      return NextResponse.json(
        { error: "userId and subjects array required" },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Verify user has AI credits
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("ai_credits")
      .eq("id", userId)
      .single();

    if (userError || !userData) {
      console.error("User lookup failed:", userError, "for ID:", userId);
      return NextResponse.json({ error: "User not found", details: userError, userId }, { status: 404 });
    }

    if (userData.ai_credits <= 0) {
      return NextResponse.json({ error: "Insufficient AI credits" }, { status: 403 });
    }

    // Limit generation based on available credits
    const finalCount = Math.min(count, userData.ai_credits);

    // Distribute questions across subjects evenly
    const perSubject = Math.floor(finalCount / subjects.length);
    const remainder = finalCount % subjects.length;

    const allQuestions = [];
    
    for (let i = 0; i < subjects.length; i++) {
      const subjectCount = perSubject + (i < remainder ? 1 : 0);
      const subject = subjects[i];

      const prompt = `
      Generate exactly ${subjectCount} valid, unique Maharashtra competitive exam questions for topic: ${subject}.
      Context: Maharashtra State Competitive Exams (Police Bharti, MPSC, Talathi, Gramsevak)
      Difficulty: EXTREMELY HARD (Advanced Level)

      IMPORTANT: Make the questions very challenging, multi-step, and highly demanding. These should test top-tier candidates.

      Return ONLY a valid JSON array matching this exact structure:
      [
        {
          "question_marathi": "प्रश्न मराठीत",
          "options": { "a": "पर्याय १", "b": "पर्याय २", "c": "पर्याय ३", "d": "पर्याय ४" },
          "correct_answer": "a",
          "explanation_marathi": "स्पष्टीकरण मराठीत",
          "trick_used": "short trick Marathi",
          "difficulty": "कठीण",
          "is_ai_variation": true,
          "topic": "${subject}",
          "exam": "police"
        }
      ]

      Rules:
      - Pure Marathi language for questions and explanations
      - Accurate logic and answers
      - Advanced difficulty level
      - Return ONLY a raw JSON array, no markdown formatting (\`\`\`json), no extra text.
      `;

      try {
        const completion = await groq.chat.completions.create({
          messages: [{ role: "user", content: prompt }],
          model: "llama-3.3-70b-versatile",
          temperature: 0.85,
          max_tokens: 4000,
        });

        const responseText = completion.choices[0]?.message?.content || "[]";

        let parsed = [];
        try {
          const cleanJson = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
          parsed = JSON.parse(cleanJson);
        } catch {
          console.error(`Failed to parse Groq response for ${subject}:`, responseText);
          continue;
        }

        if (Array.isArray(parsed)) {
          allQuestions.push(...parsed);
        }
      } catch (err) {
        console.error(`Groq error for ${subject}:`, err);
        continue;
      }
    }

    if (allQuestions.length === 0) {
      return NextResponse.json(
        { error: "Failed to generate AI questions" },
        { status: 500 }
      );
    }

    // Save all generated questions permanently to DB for future reuse
    const toInsert = allQuestions.map((q) => ({
      exam: q.exam || "police",
      topic: q.topic,
      question_marathi: q.question_marathi,
      options: q.options,
      correct_answer: q.correct_answer,
      explanation_marathi: q.explanation_marathi,
      trick_used: q.trick_used,
      difficulty: q.difficulty || "कठीण",
      is_ai_variation: true,
      svg_visual: q.svg_visual || null,
    }));

    const { error: insertError } = await supabase.from("questions").insert(toInsert);
    if (insertError) {
      console.error("Failed to insert mock questions to DB:", insertError);
    }

    // Credits are deducted per-question when user answers (via /api/deduct-credit)

    // Shuffle questions for randomness
    const shuffled = [...allQuestions].sort(() => 0.5 - Math.random());

    return NextResponse.json({
      questions: shuffled.slice(0, finalCount),
    });
  } catch (error) {
    console.error("Generate mock questions API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
