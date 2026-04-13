import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  const { amount, years, riskLevel, best, expected, worst } = await req.json();
  const response = await openai.chat.completions.create({
    model: "gpt-4o", max_tokens: 250,
    messages: [
      { role: "system", content: "You are an Indian investment advisor. Return JSON only." },
      { role: "user", content: `Investment: ₹${amount}, ${years} years, ${riskLevel} risk. Best: ₹${best}, Expected: ₹${expected}, Worst: ₹${worst}. Return: {"verdict": "short verdict", "risk": "${riskLevel}", "suggestion": "2-3 sentence advice for Indian investor"}` }
    ]
  });
  const text = response.choices[0].message.content || "{}";
  return NextResponse.json(JSON.parse(text.replace(/```json|```/g, "").trim()));
}