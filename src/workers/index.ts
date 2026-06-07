/**
 * KrishiAI Edge AI Gateway — Cloudflare Worker
 *
 * Runs on CF's edge network with native Workers AI binding.
 * No REST overhead — AI binding is in-process on the edge.
 *
 * Routes:
 *   GET  /              → Health check
 *   GET  /health        → Health check
 *   POST /api/chat      → AI chat (Bengali agricultural assistant)
 *   POST /api/diagnose  → Crop disease diagnosis (CABI-based)
 *   POST /api/analyze   → General AI analysis (soil, crop, etc.)
 *
 * CORS: Allowed from web.krishiai.live + localhost dev
 */

// ── Type Definitions ─────────────────────────────────────────────────────────
import type { ExportedHandler } from "@cloudflare/workers-types";

interface Env {
  AI: Ai; // Workers AI binding (auto-injected by wrangler)
  ENVIRONMENT: string;
  ALLOWED_ORIGIN: string;
  DEFAULT_MODEL: string;
}

interface Ai {
  run(model: string, body: Record<string, unknown>): Promise<Record<string, unknown>>;
}

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

// ── CORS ─────────────────────────────────────────────────────────────────────

const ALLOWED_ORIGINS = [
  "https://krishiai.live",
  "https://www.krishiai.live",
  "https://web.krishiai.live",
];

function corsHeaders(origin: string | null): Record<string, string> {
  const allowed =
    !origin ||
    origin.includes("localhost") ||
    origin.includes("127.0.0.1") ||
    ALLOWED_ORIGINS.includes(origin);
  return {
    "Access-Control-Allow-Origin": allowed ? (origin || "*") : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
  };
}

// ── Season Context ───────────────────────────────────────────────────────────

function getSeasonContext(): string {
  const now = new Date();
  const m = now.getMonth() + 1;
  const monthNames = [
    "জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন",
    "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর",
  ];

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

// ── System Prompts ───────────────────────────────────────────────────────────

const CHAT_SYSTEM_PROMPT = `তুমি কৃষি AI সহকারী — বাংলাদেশের কৃষকদের জন্য একটি বিশেষজ্ঞ কৃষি পরামর্শদাতা।

তোমার বৈশিষ্ট্য:
- বাংলায় উত্তর দাও (ইংরেজি শব্দ ব্যবহার করতে পারো কিন্তু প্রধান ভাষা বাংলা)
- কৃষি বিষয়ে বিশেষজ্ঞ: ফসলের রোগ, সারের মাত্রা, আবহাওয়া, বাজার মূল্য, চাষ পদ্ধতি
- বাংলাদেশের প্রেক্ষাপটে পরামর্শ দাও (জলবায়ু, মাটি, মৌসুম অনুযায়ী)
- সহজ ভাষায় ব্যাখ্যা করো যাতে সাধারণ কৃষক বুঝতে পারে
- প্রয়োজনে ধাপে ধাপে নির্দেশনা দাও
- ফসলের রোগ চিহ্নিত করতে সাহায্য করো
- সরকারি সেবা ও ভর্তুকির তথ্য দাও
- যদি প্রশ্ন কৃষি সম্পর্কিত না হয়, তাহলে বিনয়ে জানাও যে তুমি কেবল কৃষি বিষয়ে সাহায্য করতে পারো`;

const DIAGNOSE_SYSTEM_PROMPT = `তুমি বাংলাদেশের কৃষকদের জন্য একজন বিশেষজ্ঞ ফসল রোগ নির্ণয়কারী AI। CABI Plantwise পদ্ধতি অনুসরণ করো।

বিশ্লেষণ পদ্ধতি:
১. অ্যাবায়োটিক নাকি বায়োটিক নির্ধারণ করো
২. বর্জন গেট প্রয়োগ করো (পোকা, ভাইরাস, ব্যাকটেরিয়া, ছত্রাক)
৩. রোগ ত্রিভুজ মূল্যায়ন করো
৪. IPM পরামর্শ দাও (কৃষি → জৈবিক → রাসায়নিক ক্রমে)

বাংলায় উত্তর দাও। আস্থার মাত্রা উল্লেখ করো। অর্থনৈতিক থ্রেশহোল্ড বিবেচনা করো।
কখনো Plantwise Red List কীটনাশক সুপারিশ করো না।`;

const ANALYZE_SYSTEM_PROMPT = `তুমি বাংলাদেশের কৃষি বিশেষজ্ঞ। মাটি, ফসল, সার, পানি সম্পর্কে বিশ্লেষণ ও পরামর্শ দাও। বাংলায় উত্তর দাও। সহজ ভাষায় ব্যাখ্যা করো।`;

// ── Core AI Call ─────────────────────────────────────────────────────────────

async function runAI(
  env: Env,
  messages: ChatMessage[],
  options: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
  } = {}
): Promise<{ reply: string; model: string }> {
  const model = options.model || env.DEFAULT_MODEL || "@cf/meta/llama-3-8b-instruct";
  const temperature = options.temperature ?? 0.7;
  const maxTokens = options.maxTokens ?? 1024;

  const result = await env.AI.run(model, {
    messages,
    temperature,
    max_tokens: maxTokens,
  });

  // Extract reply from Workers AI response format
  let reply = "";
  if (result?.response) {
    reply = result.response as string;
  } else if (result?.choices && Array.isArray(result.choices)) {
    reply = (result.choices[0] as { message?: { content?: string } })?.message?.content || "";
  }

  return { reply, model };
}

// ── Route Handlers ───────────────────────────────────────────────────────────

function handleHealth(): Response {
  return new Response(
    JSON.stringify({
      ok: true,
      service: "KrishiAI Edge AI Gateway",
      version: "2.0.0",
      runtime: "Cloudflare Workers",
      endpoints: ["/health", "/api/chat", "/api/diagnose", "/api/analyze"],
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
}

async function handleChat(request: Request, env: Env): Promise<Response> {
  const origin = request.headers.get("origin");
  const headers = { ...corsHeaders(origin), "Content-Type": "application/json" };

  try {
    const body = (await request.json()) as { messages?: ChatMessage[] };
    const { messages } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ ok: false, error: "messages প্রয়োজন" }),
        { status: 400, headers }
      );
    }

    if (messages.length > 20) {
      return new Response(
        JSON.stringify({ ok: false, error: "সর্বোচ্চ ২০ টি বার্তা পাঠানো যায়" }),
        { status: 400, headers }
      );
    }

    // Validate message content
    for (const msg of messages) {
      if (msg.content && msg.content.length > 5000) {
        return new Response(
          JSON.stringify({ ok: false, error: "বার্তা অত্যন্ত দীর্ঘ" }),
          { status: 400, headers }
        );
      }
    }

    const seasonContext = getSeasonContext();
    const systemPrompt = `${CHAT_SYSTEM_PROMPT}\n\n${seasonContext}`;

    const chatMessages: ChatMessage[] = [
      { role: "system", content: systemPrompt },
      ...messages.slice(-10).map((m) => ({
        role: (m.role === "user" ? "user" : "assistant") as "user" | "assistant",
        content: m.content,
      })),
    ];

    const { reply, model } = await runAI(env, chatMessages, {
      temperature: 0.7,
      maxTokens: 1024,
    });

    if (!reply) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: "AI সহকারী এখন উত্তর দিতে পারছে না",
          reply: "দুঃখিত, আমি এই মুহূর্তে উত্তর দিতে পারছি না। কিছুক্ষণ পর আবার চেষ্টা করুন।",
        }),
        { status: 503, headers }
      );
    }

    return new Response(
      JSON.stringify({ ok: true, reply, model, provider: "CF Workers AI (Edge)" }),
      { status: 200, headers }
    );
  } catch (error) {
    console.error("[chat] Error:", error);
    return new Response(
      JSON.stringify({
        ok: false,
        error: "AI সহকারী এখন উপলব্ধ নয়",
        reply: "দুঃখিত, আমি এই মুহূর্তে উত্তর দিতে পারছি না। কিছুক্ষণ পর আবার চেষ্টা করুন।",
      }),
      { status: 503, headers: corsHeaders(request.headers.get("origin")) }
    );
  }
}

async function handleDiagnose(request: Request, env: Env): Promise<Response> {
  const origin = request.headers.get("origin");
  const headers = { ...corsHeaders(origin), "Content-Type": "application/json" };

  try {
    const body = (await request.json()) as {
      symptoms?: string[];
      crop?: string;
      description?: string;
      weather?: { temp?: number; humidity?: number; rain24h?: number };
    };

    const { symptoms = [], crop, description, weather } = body;
    const symptomText = Array.isArray(symptoms) ? symptoms.join(", ") : "";
    const weatherContext = weather
      ? `আবহাওয়া: তাপমাত্রা ${weather.temp || "?"}°C, আর্দ্রতা ${weather.humidity || "?"}%, বৃষ্টি ${weather.rain24h || 0}মিমি/২৪ঘণ্টা`
      : "";
    const cropContext = crop ? `ফসল: ${crop}` : "";

    const userText = `এই ফসলের অবস্থা বিশ্লেষণ করুন।
${cropContext}
লক্ষণসমূহ: ${symptomText}
${description ? `অতিরিক্ত বর্ণনা: ${description}` : ""}
${weatherContext}

CABI Plantwise পদ্ধতিতে বিশ্লেষণ করুন। বর্জন গেট, রোগ ত্রিভুজ, এবং IPM পরামর্শ দিন।`;

    const messages: ChatMessage[] = [
      { role: "system", content: DIAGNOSE_SYSTEM_PROMPT },
      { role: "user", content: userText },
    ];

    const { reply, model } = await runAI(env, messages, {
      temperature: 0.3,
      maxTokens: 2048,
    });

    if (!reply) {
      return new Response(
        JSON.stringify({ ok: false, error: "রোগ নির্ণয় সেবা এখন উপলব্ধ নয়" }),
        { status: 503, headers }
      );
    }

    return new Response(
      JSON.stringify({
        ok: true,
        text: reply,
        model,
        provider: "CF Workers AI (Edge)",
      }),
      { status: 200, headers }
    );
  } catch (error) {
    console.error("[diagnose] Error:", error);
    return new Response(
      JSON.stringify({ ok: false, error: "রোগ নির্ণয় সেবা এখন উপলব্ধ নয়। কিছুক্ষণ পর আবার চেষ্টা করুন।" }),
      { status: 503, headers: corsHeaders(request.headers.get("origin")) }
    );
  }
}

async function handleAnalyze(request: Request, env: Env): Promise<Response> {
  const origin = request.headers.get("origin");
  const headers = { ...corsHeaders(origin), "Content-Type": "application/json" };

  try {
    const body = (await request.json()) as {
      prompt?: string;
      context?: string;
    };

    if (!body.prompt) {
      return new Response(
        JSON.stringify({ ok: false, error: "prompt প্রয়োজন" }),
        { status: 400, headers }
      );
    }

    const messages: ChatMessage[] = [
      { role: "system", content: ANALYZE_SYSTEM_PROMPT },
      { role: "user", content: body.context ? `${body.context}\n\n${body.prompt}` : body.prompt },
    ];

    const { reply, model } = await runAI(env, messages, {
      temperature: 0.5,
      maxTokens: 1500,
    });

    if (!reply) {
      return new Response(
        JSON.stringify({ ok: false, error: "বিশ্লেষণ সেবা এখন উপলব্ধ নয়" }),
        { status: 503, headers }
      );
    }

    return new Response(
      JSON.stringify({ ok: true, reply, model, provider: "CF Workers AI (Edge)" }),
      { status: 200, headers }
    );
  } catch (error) {
    console.error("[analyze] Error:", error);
    return new Response(
      JSON.stringify({ ok: false, error: "বিশ্লেষণ সেবা এখন উপলব্ধ নয়" }),
      { status: 503, headers: corsHeaders(request.headers.get("origin")) }
    );
  }
}

// ── Router ───────────────────────────────────────────────────────────────────

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(request.headers.get("origin")),
      });
    }

    // Routes
    if (path === "/" || path === "/health") {
      return handleHealth();
    }

    if (path === "/api/chat" && request.method === "POST") {
      return handleChat(request, env);
    }

    if (path === "/api/diagnose" && request.method === "POST") {
      return handleDiagnose(request, env);
    }

    if (path === "/api/analyze" && request.method === "POST") {
      return handleAnalyze(request, env);
    }

    // 404
    return new Response(
      JSON.stringify({
        ok: false,
        error: "Route not found",
        available: ["/health", "/api/chat", "/api/diagnose", "/api/analyze"],
      }),
      {
        status: 404,
        headers: { ...corsHeaders(request.headers.get("origin")), "Content-Type": "application/json" },
      }
    );
  },
} satisfies ExportedHandler<Env>;
