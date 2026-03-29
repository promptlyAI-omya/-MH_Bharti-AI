import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { sql } from "@/lib/db";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

async function persistMockQuestion(question: Record<string, unknown>) {
  try {
    await sql`
      INSERT INTO questions (
        exam, topic, question_marathi, options, correct_answer,
        explanation_marathi, trick_used, difficulty, is_ai_variation, svg_visual
      ) VALUES (
        ${String(question.exam || "police")},
        ${String(question.topic || "")},
        ${String(question.question_marathi || "")},
        ${question.options as Record<string, string>},
        ${String(question.correct_answer || "")},
        ${String(question.explanation_marathi || "")},
        ${question.trick_used ? String(question.trick_used) : null},
        ${String(question.difficulty || "कठीण")},
        true,
        ${question.svg_visual ? String(question.svg_visual) : null}
      )
    `;
  } catch (insertError: unknown) {
    const message = insertError instanceof Error ? insertError.message : String(insertError);
    const isSchemaMismatch =
      message.includes('column "trick_used"') ||
      message.includes('column "svg_visual"');

    if (!isSchemaMismatch) {
      throw insertError;
    }

    await sql`
      INSERT INTO questions (
        exam, topic, question_marathi, options, correct_answer,
        explanation_marathi, difficulty, is_ai_variation
      ) VALUES (
        ${String(question.exam || "police")},
        ${String(question.topic || "")},
        ${String(question.question_marathi || "")},
        ${question.options as Record<string, string>},
        ${String(question.correct_answer || "")},
        ${String(question.explanation_marathi || "")},
        ${String(question.difficulty || "कठीण")},
        true
      )
    `;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId, subjects, count = 25 } = await req.json();

    if (!userId || !subjects || !Array.isArray(subjects) || subjects.length === 0) {
      return NextResponse.json(
        { error: "userId and subjects array required" },
        { status: 400 }
      );
    }

    const users = await sql`SELECT ai_credits FROM users WHERE id = ${userId}`;
    const userData = users?.length > 0 ? users[0] : null;

    if (!userData) {
      console.error("User lookup failed for ID:", userId);
      return NextResponse.json({ error: "User not found", userId }, { status: 404 });
    }

    if (userData.ai_credits <= 0) {
      return NextResponse.json({ error: "Insufficient AI credits" }, { status: 403 });
    }

    const finalCount = Math.min(count, userData.ai_credits);
    const perSubject = Math.floor(finalCount / subjects.length);
    const remainder = finalCount % subjects.length;
    const allQuestions: Record<string, unknown>[] = [];

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

        let parsed: Record<string, unknown>[] = [];
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
      }
    }

    if (allQuestions.length === 0) {
      return NextResponse.json(
        { error: "Failed to generate AI questions" },
        { status: 500 }
      );
    }

    for (const question of allQuestions) {
      try {
        await persistMockQuestion(question);
      } catch (insertError: unknown) {
        console.error("Failed to insert mock questions to DB:", insertError);
      }
    }

    const shuffled = [...allQuestions].sort(() => 0.5 - Math.random());

    return NextResponse.json({
      questions: shuffled.slice(0, finalCount),
    });
  } catch (error) {
    console.error("Generate mock questions API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
