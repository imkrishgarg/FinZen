import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(req: NextRequest) {
  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const { upiId } = await req.json();

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      max_tokens: 700,
      messages: [
        {
          role: "system",
          content: `You are an expert Indian UPI fraud detection AI with deep knowledge of Indian payment systems. 
Analyze UPI IDs with high accuracy. Give DIFFERENT trust scores for different UPI IDs based on actual risk analysis.

Known SAFE patterns (high trust 75-95):
- Major apps: zomato@zomato, swiggy@icici, amazon@apl, flipkart@axisbank, phonepe@ybl, paytm@paytm
- Known banks: @okicici, @oksbi, @okaxis, @okhdfcbank, @ybl, @apl
- Business accounts with proper names

Known SUSPICIOUS patterns (medium trust 35-65):
- Random numbers in name before @
- Very short names (under 4 chars)
- Uncommon VPA handles
- New/unknown payment handles

Known DANGEROUS patterns (low trust 5-30):
- Multiple random numbers
- Misspelled versions of known brands (amazonn, flipkartt)
- Unusual handles not registered with any known bank
- Patterns used in known scams

Be VERY specific and ACCURATE. Different UPI IDs must get meaningfully different scores.`
        },
        {
          role: "user",
          content: `Analyze this UPI ID thoroughly: "${upiId}"

Break down the UPI ID parts (name@handle) and analyze:
1. Is the name part legitimate or suspicious?
2. Is the @handle a known Indian bank/payment app?
3. Are there any fraud patterns?
4. What type of merchant could this be?

Return ONLY this exact JSON (no markdown, no explanation):
{
  "trustScore": <number 0-100 based on actual analysis>,
  "verdict": <"SAFE" if score>=70, "SUSPICIOUS" if 35-69, "DANGEROUS" if <35>,
  "merchantName": "<likely merchant/person name>",
  "merchantType": "<Personal/Business/Food/E-commerce/Unknown>",
  "bankName": "<identified bank or Unknown>",
  "accountAge": "<Established/New/Unknown>",
  "riskFactors": ["<specific risk based on THIS UPI ID>", ...up to 4],
  "safeIndicators": ["<specific safe sign based on THIS UPI ID>", ...up to 4],
  "recommendation": "<clear one sentence: pay/don't pay and why>",
  "detailedAnalysis": "<2-3 sentences specific to this UPI ID>",
  "shouldPay": <true if score>=70>
}`
        }
      ]
    });

    const text = response.choices[0].message.content || "{}";
    const clean = text.replace(/```json|```/g, "").trim();
    return NextResponse.json(JSON.parse(clean));
  } catch (error) {
    console.error("UPI analyze error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}