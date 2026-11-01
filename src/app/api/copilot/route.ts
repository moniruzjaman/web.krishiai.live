/**
 * /api/copilot — KrishiAI Copilot chat endpoint
 *
 * Security hardening:
 *  - Rate-limited per authenticated user (or IP for anonymous visitors) to
 *    prevent quota drain on the Gemini key.
 *  - Input size limits on message count/length.
 *  - Provider error details are NEVER echoed to clients (they can leak API
 *    key fragments, request URLs, or internal infra info); logged server-side
 *    and replaced with a generic localized message.
 */

import { NextRequest, NextResponse } from "next/server";
import { corsHeaders } from "@/lib/cors";
import { checkRateLimit } from "@/lib/rate-limit";

const MAX_MESSAGES = 20;
const MAX_MESSAGE_LENGTH = 5000;

export async function OPTIONS(req: NextRequest) {
  return new Response(null, {
    status: 204,
    headers: { ...corsHeaders(req.headers.get("origin"), ["POST"]), "Allow": "POST, OPTIONS" },
  });
}

function json(body: unknown, init?: { status?: number; origin?: string | null }) {
  const { status = 200, origin = null } = init ?? {};
  return NextResponse.json(body, { status, headers: corsHeaders(origin, ["POST"]) });
}

export async function POST(req: NextRequest) {
  const origin = req.headers.get("origin");

  try {
    // ── Rate limit: 15 copilot requests / 10 min per caller ──
    const limit = await checkRateLimit(req, "copilot", 15, 10 * 60 * 1000);
    if (!limit.ok) {
      return json(
        { ok: false, error: "অনুরোধের সীমা অতিক্রম করেছে। অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন।" },
        { status: 429, origin }
      );
    }

    const { messages = [] } = await req.json();

    if (!Array.isArray(messages) || !messages.length) {
      return json({ ok: false, error: "Messages are required" }, { status: 400, origin });
    }

    if (messages.length > MAX_MESSAGES) {
      return json({ ok: false, error: `সর্বোচ্চ ${MAX_MESSAGES} টি বার্তা পাঠানো যায়` }, { status: 400, origin });
    }
    for (const m of messages) {
      if (typeof m?.content !== "string" || m.content.length > MAX_MESSAGE_LENGTH) {
        return json({ ok: false, error: "অবৈধ বার্তা" }, { status: 400, origin });
      }
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      // Offline rule fallback inside copilot if no API key is available
      return json({
        ok: true,
        text: "দুঃখিত, ইন্টারনেট বা এপিআই সংযোগ না থাকায় আমি সরাসরি উত্তর দিতে পারছি না। তবে আপনি ফসল ক্যালেন্ডার এবং লাইভ বাজার মূল্য ট্যাগগুলো দেখতে পারেন!",
      }, { origin });
    }

    // Call Gemini API for chat response
    const systemInstruction = `
      You are KrishiAI Copilot, a helpful AI assistant for Bangladeshi farmers.
      You answer in warm, clear, localized Bengali.
      Help with planting seasons, weather alerts, pest guides, and fertilizer dosage.
      Keep answers concise and clear so they are easily understood when read aloud.
    `;

    const contents = messages.map((m: { role: string; content: string }) => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.content }],
    }));

    const body = {
      system_instruction: { parts: [{ text: systemInstruction }] },
      contents,
      generationConfig: { maxOutputTokens: 1000, temperature: 0.5 },
    };

    // API key travels in the x-goog-api-key header — never in the URL, where
    // it would end up in access logs / proxies / error strings.
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "x-goog-api-key": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15000),
    });

    const data = await res.json().catch(() => null);
    if (!res.ok) {
      // Log provider detail server-side only; never return it to the client.
      console.error(`[copilot] Gemini HTTP ${res.status}: ${data?.error?.status ?? ""}`);
      throw new Error("provider_error");
    }

    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || "কোনো উত্তর পাওয়া যায়নি।";
    return json({ ok: true, text: reply }, { origin });
  } catch (error) {
    // Generic, non-leaky failure message (client keeps its graceful UX).
    console.error("[copilot] Error:", error instanceof Error ? error.message : error);
    return json(
      { ok: true, text: "দুঃখিত, উত্তর জেনারেট করতে সমস্যা হচ্ছে। কিছুক্ষণ পর আবার চেষ্টা করুন।" },
      { origin }
    );
  }
}
