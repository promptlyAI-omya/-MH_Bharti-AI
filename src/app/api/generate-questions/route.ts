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

interface TopicInfo {
  context: string;
  isVisual: boolean;
}

const TOPIC_PROMPTS: Record<string, TopicInfo> = {
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
    const { userId, topic, difficulty, count = 5, examType = "पोलीस भरती" } = await req.json();

    if (!topic || !userId) {
      return NextResponse.json({ error: "Topic and userId required" }, { status: 400 });
    }

    const supabase = createServerClient();

    // 0. Verify user has enough AI credits
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("ai_credits")
      .eq("id", userId)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (userData.ai_credits <= 0) {
      return NextResponse.json({ error: "Insufficient AI credits" }, { status: 403 });
    }

    // Adjust count based on available credits
    const finalCount = Math.min(count, userData.ai_credits);
    
    // 1. Check existing questions in the database for this topic
    const { data: dbQuestions, error: dbError } = await supabase
      .from("questions")
      .select("*")
      .eq("topic", topic)
      .eq("exam", examType)
      .eq("difficulty", difficulty);

    if (dbError) {
       console.error("Database query error:", dbError);
    }

    const existingCount = dbQuestions ? dbQuestions.length : 0;
    
    // Logic: 
    // If we have >= 1000 questions in DB, mix DB + newly generated.
    // If not, generate all requested count entirely new via AI.
    let generateCount = finalCount;
    let fallbackQuestions = [];

    if (existingCount >= 1000 && dbQuestions) {
       // Premium users (count<=10): mostly DB + 2 AI
       // Free users (count<=5): mostly DB + 1 AI
       const aiCount = finalCount > 5 ? 2 : 1;
       generateCount = aiCount;
       const dbPickCount = finalCount - aiCount;
       
       fallbackQuestions = shuffleAndPick(dbQuestions, dbPickCount);
    }

    // 2. Generate new questions with Groq
    const topicInfo = TOPIC_PROMPTS[topic] || { context: topic, isVisual: false };
    
    let prompt = "";
    if (topicInfo.isVisual) {
      prompt = `
      Generate exactly ${generateCount} valid, unique Maharashtra ${examType} exam questions for topic: ${topic}.
      Context: ${topicInfo.context}
      Difficulty: EXTREMELY HARD (Advanced MPSC Level)

      IMPORTANT: Do not generate easy 2nd or 3rd standard level questions. Make the logic convoluted, multi-step, and highly challenging to test top-tier candidates.

      Return ONLY a valid JSON array matching this exact structure structure:
      [
        {
          "question_marathi": "या आकृतीत किती त्रिकोण आहेत? (किंवा योग्य प्रश्न)",
          "svg_visual": "<svg viewBox=\\"0 0 200 200\\" class=\\"w-full max-w-[280px] mx-auto\\">...</svg>",
          "options": { "a": "पर्याय १", "b": "पर्याय २", "c": "पर्याय ३", "d": "पर्याय ४" },
          "correct_answer": "a",
          "explanation_marathi": "स्पष्टीकरण मराठीत",
          "trick_used": "short trick Marathi",
          "difficulty": "${difficulty}",
          "is_ai_variation": true,
          "topic": "${topic}",
          "exam": "${examType}"
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
      - Return ONLY a raw JSON array, no markdown formatting (\`\`\`json), no extra text.
      `;
    } else {
      prompt = `
      Generate exactly ${generateCount} valid, unique Maharashtra ${examType} exam questions for topic: ${topic}.
      Context: ${topicInfo.context}
      Difficulty: EXTREMELY HARD (Advanced MPSC Level)

      IMPORTANT: Do not generate easy 2nd or 3rd standard level questions. Make the logic convoluted, multi-step, and highly challenging to test top-tier candidates.

      Return ONLY a valid JSON array matching this exact structure:
      [
        {
          "question_marathi": "प्रश्न मराठीत",
          "options": { "a": "पर्याय १", "b": "पर्याय २", "c": "पर्याय ३", "d": "पर्याय ४" },
          "correct_answer": "a",
          "explanation_marathi": "स्पष्टीकरण मराठीत",
          "trick_used": "short trick Marathi",
          "difficulty": "${difficulty}",
          "is_ai_variation": true,
          "topic": "${topic}",
          "exam": "${examType}"
        }
      ]

      Rules:
      - Pure Marathi language for questions and explanations
      - Accurate logic and answers
      - ${examType} difficulty level
      - Return ONLY a raw JSON array, no markdown formatting (\`\`\`json), no extra text.
      `;
    }

    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
      temperature: 0.8,
      max_tokens: 3000,
    });

    const responseText = completion.choices[0]?.message?.content || "[]";
    
    // Parse JSON safely
    let generatedQuestions = [];
    try {
      const cleanJson = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
      generatedQuestions = JSON.parse(cleanJson);
    } catch {
      console.error("Failed to parse Groq response:", responseText);
      // Fallback: If we fail to parse and we have enough DB questions, return them.
      if (dbQuestions && dbQuestions.length >= count) {
         return NextResponse.json({ questions: shuffleAndPick(dbQuestions, count) });
      }
      return NextResponse.json({ error: "Failed to generate AI questions formatting" }, { status: 500 });
    }

    if (!Array.isArray(generatedQuestions)) {
      if (dbQuestions && dbQuestions.length >= count) {
         return NextResponse.json({ questions: shuffleAndPick(dbQuestions, count) });
      }
      return NextResponse.json({ error: "Invalid response format from AI" }, { status: 500 });
    }

    // 3. Store the globally generated questions PERMANENTLY into the database table
    if (generatedQuestions.length > 0) {
      // Map correctly to ensure no missing values before insert
       const toInsert = generatedQuestions.map(q => ({
          exam: q.exam || examType,
          topic: q.topic || topic,
          question_marathi: q.question_marathi,
          options: q.options,
          correct_answer: q.correct_answer,
          explanation_marathi: q.explanation_marathi,
          trick_used: q.trick_used,
          difficulty: q.difficulty || difficulty,
          is_ai_variation: true,
          svg_visual: q.svg_visual || null,
       }));
       
       const { error: insertError } = await supabase.from("questions").insert(toInsert);
       if (insertError) {
          console.error("Failed to insert generated questions to DB:", insertError);
       }
    }

    // Combine any DB random picks with the newly generated AI ones
    const finalMixedQuestions = [...fallbackQuestions, ...generatedQuestions];
    const pickedQuestions = shuffleAndPick(finalMixedQuestions, finalCount);

    // 4. Deduct the exact number of fetched questions from user ai_credits
    if (pickedQuestions.length > 0) {
        await supabase
          .from("users")
          .update({ ai_credits: userData.ai_credits - pickedQuestions.length })
          .eq("id", userId);
    }

    // Shuffle once more to blend them seamlessly
    return NextResponse.json({ 
      questions: pickedQuestions 
    });

  } catch (error) {
    console.error("Question generation API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
