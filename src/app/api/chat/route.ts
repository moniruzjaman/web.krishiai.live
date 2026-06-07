/**
 * /api/chat — KrishiAI Chat API
 *
 * Uses Cloudflare Workers AI (Llama 3 8B) for AI-powered agricultural chat.
 * Provides Bengali-first responses with agricultural context.
 * Offline fallback when AI is unavailable.
 */

import { NextRequest } from "next/server";
import { corsHeaders, corsNextResponse } from "@/lib/cors";

export async function OPTIONS(request: NextRequest) {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(request.headers.get("origin"), ["POST"]),
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
      return corsNextResponse(
        { ok: false, error: "messages প্রয়োজন" },
        { status: 400, origin }
      );
    }

    if (messages.length > MAX_MESSAGES) {
      return corsNextResponse(
        { ok: false, error: `সর্বোচ্চ ${MAX_MESSAGES} টি বার্তা পাঠানো যায়` },
        { status: 400, origin }
      );
    }

    // Validate message content lengths
    for (const msg of messages) {
      if (msg.content && msg.content.length > MAX_MESSAGE_LENGTH) {
      return corsNextResponse(
        { ok: false, error: "বার্তা অত্যন্ত দীর্ঘ" },
        { status: 400, origin }
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

    // Build conversation with system prompt
    const chatMessages = [
      { role: "system" as const, content: systemPrompt },
      ...messages.slice(-10).map((m: { role: string; content: string }) => ({
        role: m.role === "user" ? "user" as const : "assistant" as const,
        content: m.content,
      })),
    ];

    let reply = "";
    let model = "";

    // 1. Primary: Cloudflare Workers AI (Llama 3 8B Instruct)
    try {
      const { cfAIChatFull } = await import("@/lib/cloudflareAI");
      const cfResult = await cfAIChatFull(chatMessages, {
        temperature: 0.7,
        maxTokens: 1000,
      });
      if (cfResult?.ok && cfResult.reply) {
        reply = cfResult.reply;
        model = cfResult.model;
      }
    } catch (e) {
      console.warn("[chat] Cloudflare AI failed:", e instanceof Error ? e.message : String(e));
    }

    // 2. Offline fallback: Season-aware generic response
    if (!reply) {
      const m = new Date().getMonth() + 1;
      const seasonName = m >= 11 || m <= 2 ? "রবি" : m <= 5 ? "বোরো/প্রাক-খরিফ" : m <= 8 ? "খরিফ/আমন" : "আমন/রবি প্রস্তুতি";
      reply = `দুঃখিত, আমি এই মুহূর্তে উত্তর দিতে পারছি না। বর্তমানে ${seasonName} মৌসুম চলছে। কিছুক্ষণ পর আবার চেষ্টা করুন অথবা নিকটস্থ কৃষি অফিসে যোগাযোগ করুন।`;
    }

    return corsNextResponse({
      ok: true,
      reply,
      model: model || "fallback",
    }, {
      origin,
      methods: ["POST"],
    });
  } catch (e) {
    return corsNextResponse(
      {
        ok: false,
        error: "AI সহকারী এখন উপলব্ধ নয়",
        reply: "দুঃখিত, আমি এই মুহূর্তে উত্তর দিতে পারছি না। কিছুক্ষণ পর আবার চেষ্টা করুন।",
      },
      { status: 503, origin }
    );
  }
}
