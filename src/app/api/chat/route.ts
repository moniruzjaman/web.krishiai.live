/**
 * /api/chat — KrishiAI Chat API (Multimodal)
 *
 * Supports text + image/PDF/doc attachments via Gemini 3.5 Flash.
 * Provider waterfall: Gemini (multimodal) → OpenRouter → Groq → Offline
 * Returns provider + model name for transparency.
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

// ── Multimodal Gemini call ──────────────────────────────────────────────────
interface ChatAttachment {
  type: string;
  mimeType: string;
  base64: string;
  name: string;
}

async function callGeminiMultimodal(
  contents: Array<{ role: string; content: string; attachment?: ChatAttachment }>,
  systemPrompt: string
): Promise<{ text: string; provider: string; model: string; tokensUsed: number } | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  try {
    const geminiContents = contents
      .filter((m) => m.role === "user")
      .map((m) => {
        const parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [];

        // Add text part
        if (m.content) {
          parts.push({ text: m.content || "এই ফাইলটি বিশ্লেষণ করুন।" });
        }

        // Add inline data for attachment (image or PDF)
        if (m.attachment) {
          parts.push({
            inlineData: {
              mimeType: m.attachment.mimeType,
              data: m.attachment.base64,
            },
          });
        }

        return { role: "user" as const, parts };
      });

    // If no user messages have attachments, fall back to text-only
    if (geminiContents.length === 0) return null;

    const body: Record<string, unknown> = {
      contents: geminiContents,
      systemInstruction: { parts: [{ text: systemPrompt }] },
      generationConfig: { temperature: 0.7, maxOutputTokens: 2048 },
    };

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );

    if (!res.ok) {
      console.warn("[chat/multimodal] Gemini failed:", res.status);
      return null;
    }

    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return null;

    return {
      text,
      provider: "Gemini",
      model: "gemini-3.5-flash",
      tokensUsed: data?.usageMetadata?.totalTokenCount || 0,
    };
  } catch (e) {
    console.warn("[chat/multimodal] Gemini error:", e instanceof Error ? e.message : String(e));
    return null;
  }
}

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

    // Check if the latest message has an attachment
    const lastMsg = messages[messages.length - 1];
    const hasAttachment = lastMsg?.attachment;

    let reply = "";
    let model = "";
    let provider = "";

    if (hasAttachment) {
      // ── Multimodal path: Gemini direct with inline data ──
      const userContents = messages
        .slice(-10)
        .map((m: { role: string; content: string; attachment?: ChatAttachment }) => ({
          role: m.role === "user" ? "user" : "assistant",
          content: m.content,
          attachment: m.attachment,
        }));

      const multimodalResult = await callGeminiMultimodal(userContents, systemPrompt);
      if (multimodalResult) {
        reply = multimodalResult.text;
        model = multimodalResult.model;
        provider = multimodalResult.provider;
      }
    } else {
      // ── Text-only path: standard AI client waterfall ──
      const chatMessages = [
        { role: "system" as const, content: systemPrompt },
        ...messages.slice(-10).map((m: { role: string; content: string }) => ({
          role: m.role === "user" ? ("user" as const) : ("assistant" as const),
          content: m.content,
        })),
      ];

      try {
        const { aiChatFull } = await import("@/lib/ai-client");
        const result = await aiChatFull(chatMessages, { feature: "chat" });
        if (result.provider !== "offline" && result.provider !== "quota-exceeded") {
          reply = result.text;
          model = result.model;
          provider = result.provider;
        } else if (result.provider === "quota-exceeded") {
          return corsNextResponse(
            { ok: false, error: result.text },
            { status: 429, origin }
          );
        }
      } catch (e) {
        console.warn("[chat] AI client failed:", e instanceof Error ? e.message : String(e));
      }
    }

    // Offline fallback
    if (!reply) {
      const m = new Date().getMonth() + 1;
      const seasonName = m >= 11 || m <= 2 ? "রবি" : m <= 5 ? "বোরো/প্রাক-খরিফ" : m <= 8 ? "খরিফ/আমন" : "আমন/রবি প্রস্তুতি";
      reply = `দুঃখিত, আমি এই মুহূর্তে উত্তর দিতে পারছি না। বর্তমানে ${seasonName} মৌসুম চলছে। কিছুক্ষণ পর আবার চেষ্টা করুন অথবা নিকটস্থ কৃষি অফিসে যোগাযোগ করুন।`;
      provider = "fallback";
    }

    return corsNextResponse(
      {
        ok: true,
        reply,
        model: model || "fallback",
        provider: provider || "fallback",
      },
      { origin, methods: ["POST"] }
    );
  } catch {
    return corsNextResponse(
      {
        ok: false,
        error: "AI সহকারী এখন উপলব্ধ নয়",
        reply: "দুঃখিত, আমি এই মুহূর্তে উত্তর দিতে পারছি না। কিছুক্ষণ পর আবার চেষ্টা করুন।",
        provider: "fallback",
      },
      { status: 503, origin }
    );
  }
}