/**
 * /api/chat — KrishiAI Chat API
 *
 * Uses z-ai-web-dev-sdk for AI-powered agricultural chat responses.
 * Provides Bengali-first responses with agricultural context.
 */

import { NextRequest, NextResponse } from "next/server";

const SYSTEM_PROMPT = `তুমি কৃষি AI সহকারী — বাংলাদেশের কৃষকদের জন্য একটি বিশেষজ্ঞ কৃষি পরামর্শদাতা।

তোমার বৈশিষ্ট্য:
- বাংলায় উত্তর দাও (ইংরেজি শব্দ ব্যবহার করতে পারো কিন্তু প্রধান ভাষা বাংলা)
- কৃষি বিষয়ে বিশেষজ্ঞ: ফসলের রোগ, সারের মাত্রা, আবহাওয়া, বাজার মূল্য, চাষ পদ্ধতি
- বাংলাদেশের প্রেক্ষাপটে পরামর্শ দাও (জলবায়ু, মাটি, মৌসুম অনুযায়ী)
- সহজ ভাষায় ব্যাখ্যা করো যাতে সাধারণ কৃষক বুঝতে পারে
- প্রয়োজনে ধাপে ধাপে নির্দেশনা দাও
- ফসলের রোগ চিহ্নিত করতে সাহায্য করো
- সরকারি সেবা ও ভর্তুকির তথ্য দাও
- যদি প্রশ্ন কৃষি সম্পর্কিত না হয়, তাহলে বিনয়ে জানাও যে তুমি কেবল কৃষি বিষয়ে সাহায্য করতে পারো

মৌসুমের তথ্য (জুন ২০২৬):
- বর্তমান মৌসুম: খরিফ-১ / আউশ
- চলতি কাজ: আউশ ধান রোপণ, পাট চাষ, গ্রীষ্মকালীন সবজি
- আগামী: খরিফ-২ / আমন মৌসুম (জুলাই-আগস্ট)`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { ok: false, error: "messages প্রয়োজন" },
        { status: 400 }
      );
    }

    // Import z-ai-web-dev-sdk dynamically
    const ZAI = (await import("z-ai-web-dev-sdk")).default;
    const zai = await ZAI.create();

    // Build conversation with system prompt
    const chatMessages = [
      { role: "system" as const, content: SYSTEM_PROMPT },
      ...messages.slice(-10).map((m: { role: string; content: string }) => ({
        role: m.role === "user" ? "user" as const : "assistant" as const,
        content: m.content,
      })),
    ];

    const completion = await zai.chat.completions.create({
      messages: chatMessages,
      temperature: 0.7,
      max_tokens: 1000,
    });

    const reply = completion.choices?.[0]?.message?.content || "দুঃখিত, আমি এই মুহূর্তে উত্তর দিতে পারছি না। আবার চেষ্টা করুন।";

    return NextResponse.json({
      ok: true,
      reply,
      model: "z-ai",
    });
  } catch (e) {
    console.error("[chat] Error:", e);
    return NextResponse.json(
      {
        ok: false,
        error: "AI সহকারী এখন উপলব্ধ নয়",
        reply: "দুঃখিত, আমি এই মুহূর্তে উত্তর দিতে পারছি না। কিছুক্ষণ পর আবার চেষ্টা করুন। 🌾",
      },
      { status: 503 }
    );
  }
}
