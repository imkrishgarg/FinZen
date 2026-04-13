import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  const { messages } = await req.json();
  const response = await openai.chat.completions.create({
    model: "gpt-4o", max_tokens: 400,
    messages: [
      { role: "system", content: `You are FinZen AI, a friendly financial co-pilot for Indian Gen-Z users. 
Rules:
- Only answer questions related to finance, investing, insurance, loans, taxes, banking, UPI, crypto, stocks
- If asked about non-finance topics, politely redirect to finance
- Use simple language, Indian examples, rupees
- Be direct and honest, not overly cautious
- Keep answers under 150 words
- Use Indian financial context: NSE, BSE, Zerodha, Groww, SEBI, RBI, UPI, NEFT, IMPS` },
      ...messages.map((m: { role: string; content: string }) => ({ role: m.role, content: m.content }))
    ]
  });
  return NextResponse.json({ reply: response.choices[0].message.content });
}