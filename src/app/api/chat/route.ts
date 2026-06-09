/**
 * /api/chat — KrishiAI Chat API
 *
 * Uses z-ai-web-dev-sdk for AI-powered agricultural chat responses.
 * Provides Bengali-first responses with agricultural context.
 */

import { NextRequest, NextResponse } from "next/server";

// ── CORS ────────────────────────────────────────────────────────────────────
const ALLOWED_ORIGINS = [
  "https://krishiai.live",
  "https://www.krishiai.live",
  "https://web.krishiai.live",
];

function corsHeaders(origin: string | null) {
  const allowed = !origin || origin.includes("localhost") || origin.includes("127.0.0.1") || ALLOWED_ORIGINS.includes(origin);
  return {
    "Access-Control-Allow-Origin": allowed ? (origin || "*") : "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(request.headers.get("origin")),
  });
}

// ── Dynamic season context ──────────────────────────────────────────────────
function getSeasonContext(): string {
  const now = new Date();
  const m = now.getMonth() + 1;
  const monthNames = ["জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"];

  let season: string, tasks: string, upcoming: string;

  if (m >= 11 || m <= 2) {
    season = "রবি মৌসুম";
    tasks = "আলু, সরিষা, গম চাষ, বোরো বীজতলা প্রস্তুত";
    upcoming = "প্রাক-খরিফ / বোরো কাটার মৌসুম (মার্চ-এপ্রিল)";
  } else if (m >= 3 && m <= 5) {
    season = "প্রাক-খরিফ / বোরো কাটার মৌসুম";
    tasks = "বোরো ধান কাটা, আউশ বীজতলা, গ্রীষ্মকালীন সবজি";
    upcoming = "খরিফ-১ / আউশ মৌসুম (মে-জুন)";
  } else if (m >= 6 && m <= 8) {
    season = "খরিফ-১/২ / আউশ-আমন মৌসুম";
    tasks = "আউশ ধান রোপণ, পাট চাষ, আমন রোপণ, বর্ষাকালীন সবজি";
    upcoming = "আমন মৌসুম (মধ্য) / রবি প্রস্তুতি (সেপ্টেম্বর-অক্টোবর)";
  } else {
    season = "আমন মৌসুম (মধ্য) / রবি প্রস্তুতি";
    tasks = "আমন ধান রক্ষা, রবি বীজতলা, পেঁয়াজ বীজতলা";
    upcoming = "রবি মৌসুম (নভেম্বর-ফেব্রুয়ারি)";
  }

  return `মৌসুমের তথ্য (${monthNames[m - 1]} ${now.getFullYear()}):
- বর্তমান মৌসুম: ${season}
- চলতি কাজ: ${tasks}
- আগামী: ${upcoming}`;
}

// ── Input validation ────────────────────────────────────────────────────────
const MAX_MESSAGE_LENGTH = 5000;
const MAX_MESSAGES = 20;

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");

  try {
    const body = await request.json();
    const { messages } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { ok: false, error: "messages প্রয়োজন" },
        { status: 400, headers: corsHeaders(origin) }
      );
    }

    if (messages.length > MAX_MESSAGES) {
      return NextResponse.json(
        { ok: false, error: `সর্বোচ্চ ${MAX_MESSAGES} টি বার্তা পাঠানো যায়` },
        { status: 400, headers: corsHeaders(origin) }
      );
    }

    // Validate message content lengths
    for (const msg of messages) {
      if (msg.content && msg.content.length > MAX_MESSAGE_LENGTH) {
        return NextResponse.json(
          { ok: false, error: "বার্তা অত্যন্ত দীর্ঘ" },
          { status: 400, headers: corsHeaders(origin) }
        );
      }
    }

    const seasonContext = getSeasonContext();
    const systemPrompt = `তুমি কৃষি AI সহকারী — বাংলাদেশের কৃষকদের জন্য একটি বিশেষজ্ঞ কৃষি পরামর্শদাতা।

তোমার বৈশিষ্ট্য:
- বাংলায় উত্তর দাও (ইংরেজি শব্দ ব্যবহার করতে পারো কিন্তু প্রধান ভাষা বাংলা)
- কৃষি বিষয়ে বিশেষজ্ঞ: ফসলের রোগ, সারের মাত্রা, আবহাওয়া, বাজার মূল্য, চাষ পদ্ধতি
- বাংলাদেশের প্রেক্ষাপটে পরামর্শ দাও (জলবায়ু, মাটি, মৌসুম অনুযায়ী)
- সহজ ভাষায় ব্যাখ্যা করো যাতে সাধারণ কৃষক বুঝতে পারে
- প্রয়োজনে ধাপে ধাপে নির্দেশনা দাও
- ফসলের রোগ চিহ্নিত করতে সাহায্য করো
- সরকারি সেবা ও ভর্তুকির তথ্য দাও
- যদি প্রশ্ন কৃষি সম্পর্কিত না হয়, তাহলে বিনয়ে জানাও যে তুমি কেবল কৃষি বিষয়ে সাহায্য করতে পারো

${seasonContext}`;

    // Import z-ai-web-dev-sdk dynamically
    const ZAI = (await import("z-ai-web-dev-sdk")).default;
    const zai = await ZAI.create();

    // Build conversation with system prompt
    const chatMessages = [
      { role: "system" as const, content: systemPrompt },
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
    }, {
      headers: corsHeaders(origin),
    });
  } catch (e) {
    console.error("[chat] Error:", e);
    return NextResponse.json(
      {
        ok: false,
        error: "AI সহকারী এখন উপলব্ধ নয়",
        reply: "দুঃখিত, আমি এই মুহূর্তে উত্তর দিতে পারছি না। কিছুক্ষণ পর আবার চেষ্টা করুন।",
      },
      { status: 503, headers: corsHeaders(origin) }
    );
  }
}
