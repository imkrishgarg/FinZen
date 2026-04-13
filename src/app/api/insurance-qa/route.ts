import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  const { policyText, question } = await req.json();
  const response = await openai.chat.completions.create({
    model: "gpt-4o", max_tokens: 300,
    messages: [
      { role: "system", content: "You are an Indian insurance advisor. Answer questions about insurance policies in simple plain language. Be honest and direct." },
      { role: "user", content: `Policy: ${policyText}\n\nQuestion: ${question}\n\nAnswer in 2-3 simple sentences.` }
    ]
  });
  return NextResponse.json({ answer: response.choices[0].message.content });
}