import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  const { image } = await req.json();

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    max_tokens: 200,
    messages: [
      { role: "system", content: "You are a QR code reader. Extract UPI IDs from QR code images. Return ONLY JSON." },
      { role: "user", content: [
        { type: "text", text: 'Read this QR code and extract the UPI ID. Return ONLY: {"upiId": "extracted-upi-id"} or {"error": "Could not read QR"}' },
        { type: "image_url", image_url: { url: image } }
      ]}
    ]
  });

  const text = response.choices[0].message.content || "{}";
  return NextResponse.json(JSON.parse(text.replace(/```json|```/g, "").trim()));
}