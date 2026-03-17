import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { createServerClient } from "@/lib/supabase";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

function shuffleAndPick<T>(array: T[], count: number): T[] {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

const TOPIC_PROMPTS: Record<string, any> = {
  "आकृती मोजणी": {
    context: "Figure Counting for Maharashtra Police Bharti and MPSC",
    isVisual: true,
  },
  "संख्या मालिका": {
    context: "Number Series for Maharashtra Police Bharti and MPSC",
    isVisual: false,
  },
  "सादृश्यता": {
    context: "Analogy (Number, Word, Letter) for Maharashtra Police Bharti and MPSC",
    isVisual: false,
  },
  "दिशा ज्ञान": {
    context: "Direction Sense for Maharashtra Police Bharti and MPSC",
    isVisual: true,
  },
};

export async function POST(req: NextRequest) {
  try {
    const { topic, difficulty, count = 10, examType = "पोलीस भरती" } = await req.json();

    if (!topic || !difficulty) {
      return NextResponse.json({ error: "Topic and difficulty required" }, { status: 400 });
    }

    const supabase = createServerClient();
    const cacheKey = `${examType}_${topic}_${difficulty}`;

    // 1. Check cache first (for questions array)
    const { data: cached } = await supabase
      .from("ai_question_cache")
      .select("*")
      .eq("cache_key", cacheKey)
      .single();

    if (cached?.questions) {
      try {
        const questionsList = JSON.parse(cached.questions);
        
        // Update hit count
        await supabase
          .from("ai_question_cache")
          .update({ hit_count: (cached.hit_count || 0) + 1 })
          .eq("id", cached.id);

        if (questionsList.length >= count) {
          return NextResponse.json({ questions: shuffleAndPick(questionsList, count) });
        }
      } catch (e) {
        console.error("Cache parsing error:", e);
      }
    }

    // 2. Generate with Groq if cache miss or insufficient questions
    const topicInfo = TOPIC_PROMPTS[topic] || { context: topic, isVisual: false };
    
    let prompt = "";
    if (topicInfo.isVisual) {
      prompt = `
      Generate 30 Maharashtra ${examType} exam questions for topic: ${topic}.
      Context: ${topicInfo.context}
      Difficulty: ${difficulty}

      Return ONLY a valid JSON array matching this structure:
      [
        {
          "id": "unique-uuid-or-string",
          "question_marathi": "या आकृतीत किती त्रिकोण आहेत? (किंवा योग्य प्रश्न)",
          "svg_visual": "<svg viewBox=\\"0 0 200 200\\" class=\\"w-full max-w-[280px] mx-auto\\">...</svg>",
          "options": { "a": "पर्याय १", "b": "पर्याय २", "c": "पर्याय ३", "d": "पर्याय ४" },
          "correct_answer": "a",
          "explanation_marathi": "स्पष्टीकरण मराठीत",
          "trick_used": "short trick Marathi",
          "difficulty": "${difficulty}",
          "is_ai_variation": true
        }
      ]

      SVG Rules:
      - Use viewBox 0 0 200 200
      - stroke="#FF6B00", fill="none" (or appropriate)
      - Keep it simple and visible for mobile screens
      - Must be valid SVG code string inside "svg_visual" property
      
      Rules:
      - Pure Marathi language for questions and options
      - Accurate logic and answers
      - ${examType} difficulty level
      - Return ONLY JSON, no markdown formatting (\`\`\`json), no extra text.
      `;
    } else {
      prompt = `
      Generate 30 Maharashtra ${examType} exam questions for topic: ${topic}.
      Context: ${topicInfo.context}
      Difficulty: ${difficulty}

      Return ONLY a valid JSON array matching this structure:
      [
        {
          "id": "unique-uuid-or-string",
          "question_marathi": "प्रश्न मराठीत",
          "options": { "a": "पर्याय १", "b": "पर्याय २", "c": "पर्याय ३", "d": "पर्याय ४" },
          "correct_answer": "a",
          "explanation_marathi": "स्पष्टीकरण मराठीत",
          "trick_used": "short trick Marathi",
          "difficulty": "${difficulty}",
          "is_ai_variation": true
        }
      ]

      Rules:
      - Pure Marathi language for questions and explanations
      - Accurate logic and answers
      - ${examType} difficulty level
      - Return ONLY JSON, no markdown formatting (\`\`\`json), no extra text.
      `;
    }

    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
      max_tokens: 3000,
    });

    const responseText = completion.choices[0]?.message?.content || "[]";
    
    // Parse JSON safely
    let generatedQuestions = [];
    try {
      const cleanJson = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
      generatedQuestions = JSON.parse(cleanJson);
    } catch (parseError) {
      console.error("Failed to parse Groq response:", responseText);
      return NextResponse.json({ error: "Failed to generate questions" }, { status: 500 });
    }

    if (!Array.isArray(generatedQuestions)) {
      return NextResponse.json({ error: "Invalid response format from AI" }, { status: 500 });
    }

    // 3. Cache the generated questions
    await supabase.from("ai_question_cache").upsert(
      {
        cache_key: cacheKey,
        questions: JSON.stringify(generatedQuestions),
        hit_count: 1,
      },
      { onConflict: "cache_key" }
    );

    // 4. Return the requested count to the user
    return NextResponse.json({ 
      questions: shuffleAndPick(generatedQuestions, count) 
    });

  } catch (error) {
    console.error("Question generation API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
