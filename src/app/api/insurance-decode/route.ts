import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  const { policyText } = await req.json();
  const response = await openai.chat.completions.create({
    model: "gpt-4o", max_tokens: 800,
    messages: [
      { role: "system", content: "You are an Indian insurance expert. Analyze policies and return ONLY valid JSON." },
      { role: "user", content: `Analyze this insurance policy text and return ONLY this JSON:
{
  "policyType": "Health/Life/Vehicle/etc",
  "insurer": "company name or Unknown",
  "covered": ["up to 6 things covered"],
  "notCovered": ["up to 6 things NOT covered - be specific"],
  "hiddenClauses": ["up to 4 hidden or tricky clauses"],
  "premiumWorth": "GOOD" or "AVERAGE" or "POOR",
  "overallRating": number 1-10,
  "plainSummary": "2-3 sentences in simple language",
  "redAlerts": ["up to 3 critical things user must know before signing"]
}

Policy text: ${policyText}` }
    ]
  });
  const text = response.choices[0].message.content || "{}";
  return NextResponse.json(JSON.parse(text.replace(/```json|```/g, "").trim()));
}