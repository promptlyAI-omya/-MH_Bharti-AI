import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || '' });

function shuffleArray<T>(array: T[]): T[] {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const exam = searchParams.get("exam") || "police";
  const topic = searchParams.get("topic");
  const limit = parseInt(searchParams.get("limit") || "10");
  const userId = searchParams.get("userId");
  let guestSeenIds: string[] = [];

  try {
    const seenIdsParam = searchParams.get("seen_ids");
    if (seenIdsParam) {
      guestSeenIds = seenIdsParam.split(",").filter(Boolean);
    }
  } catch {
    // ignore parsing errors
  }

  let allQuestions: any[] /* eslint-disable-line @typescript-eslint/no-explicit-any */ = [];
  try {
    if (topic) {
      allQuestions = await sql`SELECT * FROM questions WHERE exam = ${exam} AND topic = ${topic}`;
    } else {
      allQuestions = await sql`SELECT * FROM questions WHERE exam = ${exam}`;
    }
  } catch (error: unknown) {
    return NextResponse.json({ error: (error instanceof Error ? error.message : null) || "Failed to fetch questions" }, { status: 500 });
  }

  // --- 1. Get User History ---
  let seenIds: string[] = [];
  const wrongIds: string[] = [];
  const historyMap: Record<string, { last_seen_at: string }> = {};

  if (userId) {
    try {
      const history = await sql`
        SELECT question_id, correct, last_seen_at FROM user_question_history
        WHERE user_id = ${userId}
      `;

      if (history) {
        history.forEach((h: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) => {
          seenIds.push(h.question_id);
          historyMap[h.question_id] = h;
          if (!h.correct) {
            wrongIds.push(h.question_id);
          }
        });
      }
    } catch (e) {
      console.error("Failed history DB fetch", e);
    }
  } else if (guestSeenIds.length > 0) {
    seenIds = guestSeenIds;
  }

  // --- 2. Filter Lists ---
  const unseen = allQuestions.filter((q) => !seenIds.includes(q.id));
  const wrong = allQuestions.filter((q) => wrongIds.includes(q.id));
  const seen = allQuestions.filter((q) => seenIds.includes(q.id) && !wrongIds.includes(q.id));

  // --- 3. Build Selection ---
  const selectedQuestions: unknown[] = [];

  // Priority 1: Unseen
  const shuffledUnseen = shuffleArray(unseen);
  selectedQuestions.push(...shuffledUnseen.splice(0, limit));

  // Priority 2: Wrong (oldest seen first)
  if (selectedQuestions.length < limit && wrong.length > 0) {
    wrong.sort((a, b) => {
      const timeA = historyMap[a.id]?.last_seen_at ? new Date(historyMap[a.id].last_seen_at).getTime() : 0;
      const timeB = historyMap[b.id]?.last_seen_at ? new Date(historyMap[b.id].last_seen_at).getTime() : 0;
      return timeA - timeB; // Oldest first
    });
    const needed = limit - selectedQuestions.length;
    selectedQuestions.push(...wrong.slice(0, needed));
  }

  // Priority 3: Seen (oldest seen first)
  if (selectedQuestions.length < limit && seen.length > 0) {
    seen.sort((a, b) => {
      const timeA = historyMap[a.id]?.last_seen_at ? new Date(historyMap[a.id].last_seen_at).getTime() : 0;
      const timeB = historyMap[b.id]?.last_seen_at ? new Date(historyMap[b.id].last_seen_at).getTime() : 0;
      return timeA - timeB; // Oldest first
    });
    const needed = limit - selectedQuestions.length;
    selectedQuestions.push(...seen.slice(0, needed));
  }

  // --- 4. Small Dataset Optimization (AI Variations) ---
  if (unseen.length < 5 && allQuestions.length > 0 && selectedQuestions.length > 0) {
    // Just try generating 1 AI variation to spice things up
    try {
      // Pick a random base question from the total pool
      const baseQ = allQuestions[Math.floor(Math.random() * allQuestions.length)];
      
      const aiPrompt = `
You are a Marathi Exam Question Generator.
I will give you an original question. I want you to create a NEW variation of this exact same question by changing ONLY the numbers, names, or places. The core concept, formula required, and difficulty MUST remain exactly the same.
Return ONLY valid JSON in this exact format, with NO Markdown wrappers, NO other text:
{
  "question_marathi": "New question text",
  "options": {
    "a": "Option 1",
    "b": "Option 2",
    "c": "Option 3",
    "d": "Option 4"
  },
  "correct_answer": "a", // must be a, b, c, or d
  "explanation_marathi": "Short explanation",
  "difficulty": "${baseQ.difficulty}"
}

Original Question: "${baseQ.question_marathi}"
Original Options: ${JSON.stringify(baseQ.options)}
Original Correct Answer: "${baseQ.correct_answer}"
      `.trim();

      const completion = await groq.chat.completions.create({
        messages: [{ role: "user", content: aiPrompt }],
        model: "llama-3.1-8b-instant",
        temperature: 0.8,
        max_tokens: 500,
        response_format: { type: "json_object" }
      });

      const responseText = completion.choices[0]?.message?.content;
      if (responseText) {
        const variationMessage = JSON.parse(responseText);
        const variationQ = {
          ...variationMessage,
          id: `dynamic-${Date.now()}`,
          topic: baseQ.topic,
          exam: baseQ.exam,
          is_ai_variation: true
        };
        // Replace the last item with the AI variation
        if (selectedQuestions.length > 0) {
            selectedQuestions[selectedQuestions.length - 1] = variationQ;
        } else {
            selectedQuestions.push(variationQ);
        }
      }
    } catch (e) {
      console.error("Failed to generate AI variation", e);
      // Suppress, fallback to the standard static questions
    }
  }

  // Final shuffle of the selected list to mix difficulty and sources randomly
  const finalQuestions = shuffleArray(selectedQuestions);

  return NextResponse.json({
    questions: finalQuestions,
    count: finalQuestions.length,
  });
}
