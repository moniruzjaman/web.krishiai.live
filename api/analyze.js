/**
 * api/analyze.js  —  v6
 *
 * AI cascade (March 2026):
 *   1. Gemini 2.0 Flash  via Google AI Studio (GEMINI_API_KEY) — primary
 *   2. Free vision models via OpenRouter (OPENROUTER_API_KEY):
 *        a. google/gemma-3-27b-instruct:free   — Google, free, vision ✅
 *        b. google/gemma-3-12b-instruct:free   — Google, free, vision ✅
 *        c. meta-llama/llama-4-maverick:free   — Meta, free, vision ✅
 *        d. meta-llama/llama-4-scout:free      — Meta, free, vision ✅
 *        e. mistralai/mistral-small-3.1-24b-instruct:free — vision ✅
 *        f. moonshotai/kimi-vl-a3b-thinking:free — vision ✅
 *        g. qwen/qwen2.5-vl-3b-instruct:free  — vision ✅
 *        h. openrouter/free                   — auto-picks best free vision
 *   3. Rule-based Bengali fallback            — always works, zero cost
 *
 * All OpenRouter models use image_url format per OpenRouter multimodal docs.
 */

export const config = { maxDuration: 60 };

// ── System prompt ─────────────────────────────────────────────────────────────
const SYSTEM = `আপনি কৃষি AI — বাংলাদেশের সর্বোচ্চ বিশ্বস্ত কৃষি পরামর্শদাতা।
BRRI, BARI, DAE, SRDI, BADC ও BARC নির্দেশিকা কঠোরভাবে অনুসরণ করুন।
• সব উত্তর বাংলায় দিন
• সংক্ষিপ্ত, ব্যবহারিক ও কার্যকর পরামর্শ দিন
• রোগ নির্ণয়ে তীব্রতা (স্বল্প/মধ্যম/তীব্র) অবশ্যই উল্লেখ করুন
• DAE হটলাইন 16123 উল্লেখ করুন
• সর্বোচ্চ ২৫০ শব্দে উত্তর দিন`;

// ── Free vision models on OpenRouter (verified March 2026) ────────────────────
// All support image_url multimodal input
const OR_VISION_FREE = [
  "google/gemma-3-27b-instruct:free",     // Google Gemma 3 27B — vision, 128K ctx
  "google/gemma-3-12b-instruct:free",     // Google Gemma 3 12B — vision, 128K ctx
  "meta-llama/llama-4-maverick:free",     // Meta Llama 4 MoE   — vision, 1M ctx
  "meta-llama/llama-4-scout:free",        // Meta Llama 4 Scout — vision, 512K ctx
  "mistralai/mistral-small-3.1-24b-instruct:free", // Mistral — vision, 128K ctx
  "moonshotai/kimi-vl-a3b-thinking:free", // Kimi VL            — vision, 128K ctx
  "qwen/qwen2.5-vl-3b-instruct:free",    // Qwen VL            — vision
  "openrouter/free",                      // Auto-picks best free vision
];

// Text-only free fallbacks (no vision needed)
const OR_TEXT_FREE = [
  "meta-llama/llama-3.3-70b-instruct:free",
  "deepseek/deepseek-v3-base:free",
];

// ── CORS ──────────────────────────────────────────────────────────────────────
function cors(req, res) {
  const o = req.headers.origin || "";
  if (o.endsWith(".krishiai.live") || o === "https://krishiai.live" ||
      o.startsWith("http://localhost")) {
    res.setHeader("Access-Control-Allow-Origin", o);
  }
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

// ── BD season ─────────────────────────────────────────────────────────────────
function season() {
  const m = new Date().getMonth() + 1;
  if (m >= 11 || m <= 2) return "রবি (শীতকালীন)";
  if (m >= 3  && m <= 5) return "প্রাক-খরিফ";
  if (m >= 6  && m <= 7) return "খরিফ-১";
  return "খরিফ-২ / আমন";
}

// ── 1. Gemini 2.0 Flash via Google AI Studio ──────────────────────────────────
async function callGemini(prompt, imageBase64, mimeType, history, stream) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;

  const parts = [];
  if (imageBase64) parts.push({ inlineData: { mimeType: mimeType || "image/jpeg", data: imageBase64 } });
  parts.push({ text: prompt });

  const contents = [];
  for (const h of (history || [])) {
    contents.push({ role: h.role === "assistant" ? "model" : "user", parts: [{ text: h.text }] });
  }
  contents.push({ role: "user", parts });

  const action = stream ? "streamGenerateContent?alt=sse" : "generateContent";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:${action}&key=${key}`;

  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: `${SYSTEM}\n\nমৌসুম: ${season()}` }] },
      contents,
      generationConfig: {
        temperature: imageBase64 ? 0.1 : 0.65,
        topP: 0.95,
        maxOutputTokens: 1024,
      },
      safetySettings: [
        { category: "HARM_CATEGORY_HARASSMENT",       threshold: "BLOCK_ONLY_HIGH" },
        { category: "HARM_CATEGORY_HATE_SPEECH",       threshold: "BLOCK_ONLY_HIGH" },
        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_ONLY_HIGH" },
        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
      ],
    }),
  });

  if (!resp.ok) {
    const txt = await resp.text().catch(() => "");
    console.error("[Gemini]", resp.status, txt.slice(0, 200));
    return null;
  }
  return resp;
}

// ── 2. OpenRouter cascade ─────────────────────────────────────────────────────
async function callOpenRouter(prompt, imageBase64, mimeType) {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) return null;

  const hasImage = !!(imageBase64 && imageBase64.length > 50);
  const models   = hasImage ? OR_VISION_FREE : [...OR_TEXT_FREE, ...OR_VISION_FREE.slice(0, 3)];

  // Build user message content per OpenRouter multimodal docs
  const userContent = hasImage
    ? [
        { type: "image_url", image_url: { url: `data:${mimeType || "image/jpeg"};base64,${imageBase64}` } },
        { type: "text", text: prompt },
      ]
    : prompt;

  for (const model of models) {
    try {
      const resp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization":  `Bearer ${key}`,
          "Content-Type":   "application/json",
          "HTTP-Referer":   "https://krishiai.live",
          "X-Title":        "Krishi AI Bangladesh",
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: SYSTEM + `\n\nমৌসুম: ${season()}` },
            { role: "user",   content: userContent },
          ],
          max_tokens:  900,
          temperature: hasImage ? 0.1 : 0.65,
        }),
      });

      if (!resp.ok) {
        console.warn(`[OR] ${model} → ${resp.status}`);
        continue; // try next model
      }

      const d    = await resp.json();
      const text = d?.choices?.[0]?.message?.content;
      if (text) {
        console.log(`[OR] ✓ ${model}`);
        return { text, model };
      }
    } catch (e) {
      console.warn(`[OR] ${model} error: ${e?.message}`);
      continue;
    }
  }
  return null;
}

// ── 3. Rule-based fallback ────────────────────────────────────────────────────
function ruleBased(prompt, hasImage) {
  const p = prompt.toLowerCase();
  const s = season();

  if (hasImage) {
    return JSON.stringify({
      disease:    "বিশ্লেষণ সম্ভব হয়নি",
      disease_en: "Analysis unavailable",
      crop:       "অজ্ঞাত",
      severity:   "মধ্যম",
      confidence: 15,
      cause:      "সব AI মডেল এই মুহূর্তে অনুপলব্ধ। OPENROUTER_API_KEY সেট আছে কিনা যাচাই করুন।",
      treatment:  "ছবি তুলে রাখুন। DAE উপজেলা কৃষি অফিসে নিয়ে যান অথবা 16123 এ ফোন করুন।",
      prevention: "পুনরায় চেষ্টা করুন অথবা AI Chat-এ রোগের লক্ষণ বর্ণনা করুন।",
    });
  }

  if (p.includes("ব্লাস্ট") || p.includes("blast"))
    return "ধানের ব্লাস্ট রোগ (Magnaporthe oryzae):\n\n১. Tricyclazole 75% WP @ 0.6g/L\n২. ৭ দিন পর পর ২-৩ বার স্প্রে করুন\n৩. সন্ধ্যা বা ভোরে স্প্রে করুন\n৪. পটাশ সার বাড়ান\n\nDAE হটলাইন: 16123";

  if (p.includes("ইউরিয়া") || p.includes("সার") || p.includes("fertilizer"))
    return `বোরো ধানে সার (প্রতি বিঘা):\n\nইউরিয়া: ৫৫-৬০ কেজি (৩ ভাগে)\nTSP: ২০-২৫ কেজি (রোপণের আগে)\nMOP: ২০-২৫ কেজি (২ ভাগে)\nজিংক সালফেট: ২ কেজি\n\nমৌসুম: ${s}\nDAE হটলাইন: 16123`;

  if (p.includes("আলু") || p.includes("potato"))
    return "আলুর রোগ:\n\nলেট ব্লাইট: Metalaxyl+Mancozeb @ 2.5g/L\nআর্লি ব্লাইট: Mancozeb 80% WP @ 2g/L\n৭ দিন পর পর ৩ বার স্প্রে করুন\n\nDAE হটলাইন: 16123";

  if (p.includes("পানামা") || p.includes("কলা"))
    return "কলার পানামা উইল্ট:\n\n১. আক্রান্ত গাছ তুলে পুড়িয়ে ফেলুন\n২. BARI কলা-১ জাত ব্যবহার করুন\n৩. একই জমিতে ৩-৪ বছর কলা চাষ বন্ধ\n\nDAE হটলাইন: 16123";

  return `কৃষি পরামর্শ (${s})\n\nAI সার্ভার সাময়িকভাবে অনুপলব্ধ।\nবিস্তারিত: DAE হটলাইন 16123`;
}

// ── Health check ──────────────────────────────────────────────────────────────
function healthCheck(res) {
  const hasGemini = !!process.env.GEMINI_API_KEY;
  const hasOR     = !!process.env.OPENROUTER_API_KEY;
  return res.status(200).json({
    status: "ok",
    time:   new Date().toISOString(),
    season: season(),
    keys: {
      gemini:     hasGemini ? "✅ set" : "❌ not set",
      openrouter: hasOR     ? "✅ set" : "❌ not set",
    },
    cascade: hasGemini
      ? "gemini-2.0-flash → free OR vision → rule-based"
      : hasOR
      ? "free OR vision (gemma-3, llama-4, mistral, kimi-vl, qwen-vl) → rule-based"
      : "⚠️ rule-based only — no API keys set",
    freeVisionModels: OR_VISION_FREE,
  });
}

// ── Main handler ──────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  cors(req, res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method === "GET")     return healthCheck(res);
  if (req.method !== "POST")    return res.status(405).json({ error: "Method not allowed" });

  const {
    prompt      = "",
    imageBase64,
    mimeType    = "image/jpeg",
    history     = [],
    stream      = false,
  } = req.body || {};

  if (!prompt) return res.status(400).json({ error: "prompt required", ok: false });

  const hasImage = !!(imageBase64 && imageBase64.length > 50);

  // ── STREAMING ─────────────────────────────────────────────────────────────
  if (stream) {
    res.setHeader("Content-Type",     "text/event-stream");
    res.setHeader("Cache-Control",    "no-cache");
    res.setHeader("X-Accel-Buffering","no");
    res.setHeader("Connection",       "keep-alive");

    const send = (text, model) =>
      res.write(`data: ${JSON.stringify({ text, model })}\n\n`);

    try {
      const resp = await callGemini(prompt, imageBase64, mimeType, history, true);
      if (!resp) throw new Error("Gemini unavailable");
      const reader  = resp.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        for (const line of decoder.decode(value).split("\n")) {
          if (!line.startsWith("data:")) continue;
          const raw = line.slice(5).trim();
          if (raw === "[DONE]") continue;
          try {
            const t = JSON.parse(raw)?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (t) send(t, "gemini-2.0-flash");
          } catch { /* partial */ }
        }
      }
    } catch (e) {
      console.error("[stream]", e?.message);
      const or = await callOpenRouter(prompt, imageBase64, mimeType).catch(() => null);
      if (or?.text) send(or.text, or.model);
      else          send(ruleBased(prompt, hasImage), "rule-based");
    }

    res.write("data: [DONE]\n\n");
    return res.end();
  }

  // ── STANDARD ──────────────────────────────────────────────────────────────

  // 1. Gemini 2.0 Flash
  try {
    const resp = await callGemini(prompt, imageBase64, mimeType, history, false);
    if (resp) {
      const d    = await resp.json();
      const text = d?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) return res.status(200).json({ text, model: "gemini-2.0-flash", ok: true });
    }
  } catch (e) { console.error("[gemini]", e?.message); }

  // 2. OpenRouter — free vision cascade
  try {
    const or = await callOpenRouter(prompt, imageBase64, mimeType);
    if (or?.text) return res.status(200).json({ text: or.text, model: or.model, ok: true });
  } catch (e) { console.error("[openrouter]", e?.message); }

  // 3. Rule-based
  return res.status(200).json({ text: ruleBased(prompt, hasImage), model: "rule-based", ok: true });
}
