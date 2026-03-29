import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { sql } from "@/lib/db";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { topic, examType = "पोलीस भरती" } = await req.json();

    if (!topic) {
      return NextResponse.json({ error: "Topic required" }, { status: 400 });
    }

    const cacheKey = `info_${examType}_${topic}`;

    // 1. Check cache first
    let cached = null;
    try {
      const cacheRows = await sql`SELECT questions FROM ai_question_cache WHERE cache_key = ${cacheKey}`;
      cached = cacheRows.length > 0 ? cacheRows[0] : null;
    } catch {}

    if (cached?.questions) {
      try {
        const info = JSON.parse(cached.questions);
        return NextResponse.json({ topicInfo: info });
      } catch (e) {
        console.error("Cache parsing error:", e);
      }
    }

    // 2. Generate with Groq
    const prompt = `
    Generate educational content for the topic "${topic}" for the Maharashtra ${examType} exam.
    You must provide theory, a golden trick, and exactly 2 detailed worked examples.

    Return ONLY a valid JSON object matching this exact structure:
    {
      "concept": "A 3-4 line explanation of what this topic is in very simple Marathi.",
      "trick": "🔑 Golden Trick:\\n Step 1:...\\n Step 2:...",
      "examples": [
        {
          "q": "Example question 1 here?",
          "a": "Step-by-step solution here covering why the answer is correct."
        },
        {
          "q": "Example question 2 here?",
          "a": "Detailed step-by-step solution."
        }
      ]
    }

    Rules:
    - Pure Marathi language.
    - Highly educational and encouraging tone.
    - Return ONLY the raw JSON object, no markdown formatting (\`\`\`json), no extra text.
    `;

    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
      temperature: 0.6,
      max_tokens: 1500,
    });

    const responseText = completion.choices[0]?.message?.content || "{}";
    
    // Parse JSON safely
    let generatedInfo = null;
    try {
      const cleanJson = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
      generatedInfo = JSON.parse(cleanJson);
    } catch {
      console.error("Failed to parse Groq topic info response:", responseText);
      return NextResponse.json({ error: "Failed to generate topic info" }, { status: 500 });
    }

    if (!generatedInfo || !generatedInfo.concept) {
      return NextResponse.json({ error: "Invalid response format from AI" }, { status: 500 });
    }

    // 3. Cache the generated info
    try {
      await sql`
        INSERT INTO ai_question_cache (cache_key, questions, hit_count)
        VALUES (${cacheKey}, ${JSON.stringify(generatedInfo)}, 1)
        ON CONFLICT (cache_key) 
        DO UPDATE SET questions = EXCLUDED.questions, hit_count = ai_question_cache.hit_count + 1
      `;
    } catch (e) {
      console.error("Cache DB insert error:", e);
    }

    return NextResponse.json({ topicInfo: generatedInfo });

  } catch (error) {
    console.error("Topic info generation API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
