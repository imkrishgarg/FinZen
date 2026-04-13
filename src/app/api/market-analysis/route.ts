import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { coin, symbol, price, change24h, change7d, trend, volatility, support, resistance, volumeToMcap, fromATH, investAmount } = body;

  const prompt = `Analyze ${coin} (${symbol.toUpperCase()}) for Indian retail investor and return ONLY valid JSON:
{
  "verdict": "BUY" or "HOLD" or "AVOID",
  "verdictReason": "one sentence",
  "scores": { "momentum": 1-10, "risk": 1-10, "liquidity": 1-10, "potential": 1-10 },
  "entryPrice": number in INR,
  "targetPrice": number in INR,
  "stopLoss": number in INR,
  "portfolioPercent": number,
  "taxOnGain": number (30% of gain if invest ${investAmount} hits target),
  "oneLineSummary": "punchy one line",
  "redFlags": ["max 3 short flags"],
  "greenFlags": ["max 3 short flags"]
}
Data: Price ₹${price}, 24h: ${change24h}%, 7d: ${change7d}%, Trend: ${trend}, Volatility: ${volatility}%, Support: ₹${support}, Resistance: ₹${resistance}, Vol/MCap: ${volumeToMcap}%, From ATH: ${fromATH}%`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    max_tokens: 600,
    messages: [
      { role: "system", content: "You are a senior crypto analyst. Return ONLY valid JSON, no markdown." },
      { role: "user", content: prompt }
    ]
  });

  const text = response.choices[0].message.content || "{}";
  const clean = text.replace(/```json|```/g, "").trim();
  return NextResponse.json(JSON.parse(clean));
}