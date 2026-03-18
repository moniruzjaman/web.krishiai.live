/**
 * functions/api/analyze.js
 * Cloudflare Pages Function — replaces api/analyze.js (Vercel format)
 *
 * Cloudflare Pages Functions:
 *  - Exported as { onRequest } or { onRequestPost, onRequestGet, onRequestOptions }
 *  - Use Web standard Request / Response (not Express req/res)
 *  - Env vars via context.env (not process.env)
 *  - Node.js compat via wrangler.jsonc compatibility_flags: ["nodejs_compat"]
 *
 * Route: /api/analyze  (Cloudflare Pages auto-maps functions/ to URL paths)
 */

const SYSTEM = `আপনি কৃষি AI — বাংলাদেশের সর্বোচ্চ বিশ্বস্ত কৃষি পরামর্শদাতা।
BRRI, BARI, DAE, SRDI, BADC ও BARC নির্দেশিকা কঠোরভাবে অনুসরণ করুন।
• সব উত্তর বাংলায় দিন
• সংক্ষিপ্ত, ব্যবহারিক ও কার্যকর পরামর্শ দিন
• রোগ নির্ণয়ে তীব্রতা (স্বল্প/মধ্যম/তীব্র) অবশ্যই উল্লেখ করুন
• DAE হটলাইন 16123 উল্লেখ করুন
• সর্বোচ্চ ২৫০ শব্দে উত্তর দিন`;

// Free vision models — verified March 2026
const OR_VISION_FREE = [
  "google/gemma-3-27b-instruct:free",
  "google/gemma-3-12b-instruct:free",
  "meta-llama/llama-4-maverick:free",
  "meta-llama/llama-4-scout:free",
  "mistralai/mistral-small-3.1-24b-instruct:free",
  "moonshotai/kimi-vl-a3b-thinking:free",
  "qwen/qwen2.5-vl-3b-instruct:free",
  "openrouter/free",
];

const OR_TEXT_FREE = [
  "meta-llama/llama-3.3-70b-instruct:free",
  "deepseek/deepseek-v3-base:free",
];

function season() {
  const m = new Date().getMonth() + 1;
  if (m >= 11 || m <= 2) return "রবি (শীতকালীন)";
  if (m >= 3  && m <= 5) return "প্রাক-খরিফ";
  if (m >= 6  && m <= 7) return "খরিফ-১";
  return "খরিফ-২ / আমন";
}

function corsHeaders(request) {
  const origin = request.headers.get("Origin") || "";
  const allowed = origin.endsWith(".krishiai.live") ||
                  origin === "https://krishiai.live" ||
                  origin.startsWith("http://localhost");
  return {
    "Access-Control-Allow-Origin":  allowed ? origin : "https://krishiai.live",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

function json(data, status = 200, request) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders(request) },
  });
}

// ── Gemini 2.0 Flash ──────────────────────────────────────────────────────────
async function callGemini(env, prompt, imageBase64, mimeType, history) {
  const key = env.GEMINI_API_KEY;
  if (!key) return null;

  const parts = [];
  if (imageBase64) parts.push({ inlineData: { mimeType: mimeType || "image/jpeg", data: imageBase64 } });
  parts.push({ text: prompt });

  const contents = [];
  for (const h of (history || [])) {
    contents.push({ role: h.role === "assistant" ? "model" : "user", parts: [{ text: h.text }] });
  }
  contents.push({ role: "user", parts });

  const resp = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: `${SYSTEM}\n\nমৌসুম: ${season()}` }] },
        contents,
        generationConfig: { temperature: imageBase64 ? 0.1 : 0.65, topP: 0.95, maxOutputTokens: 1024 },
        safetySettings: [
          { category: "HARM_CATEGORY_HARASSMENT",       threshold: "BLOCK_ONLY_HIGH" },
          { category: "HARM_CATEGORY_HATE_SPEECH",       threshold: "BLOCK_ONLY_HIGH" },
          { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_ONLY_HIGH" },
          { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
        ],
      }),
    }
  );

  if (!resp.ok) { console.error("[Gemini]", resp.status); return null; }
  const d = await resp.json();
  return d?.candidates?.[0]?.content?.parts?.[0]?.text || null;
}

// ── OpenRouter free vision cascade ────────────────────────────────────────────
async function callOpenRouter(env, prompt, imageBase64, mimeType) {
  const key = env.OPENROUTER_API_KEY;
  if (!key) return null;

  const hasImage = !!(imageBase64 && imageBase64.length > 50);
  const models   = hasImage ? OR_VISION_FREE : [...OR_TEXT_FREE, ...OR_VISION_FREE.slice(0, 3)];

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
            { role: "system", content: `${SYSTEM}\n\nমৌসুম: ${season()}` },
            { role: "user",   content: userContent },
          ],
          max_tokens:  900,
          temperature: hasImage ? 0.1 : 0.65,
        }),
      });

      if (!resp.ok) { console.warn(`[OR] ${model} → ${resp.status}`); continue; }
      const d    = await resp.json();
      const text = d?.choices?.[0]?.message?.content;
      if (text) { console.log(`[OR] ✓ ${model}`); return { text, model }; }
    } catch (e) { console.warn(`[OR] ${model}: ${e?.message}`); }
  }
  return null;
}

// ── Rule-based fallback ───────────────────────────────────────────────────────
function ruleBased(prompt, hasImage) {
  const p = prompt.toLowerCase();
  const s = season();
  if (hasImage) return JSON.stringify({
    disease:"বিশ্লেষণ সম্ভব হয়নি",disease_en:"Analysis unavailable",crop:"অজ্ঞাত",
    severity:"মধ্যম",confidence:15,
    cause:"সব AI মডেল এই মুহূর্তে অনুপলব্ধ।",
    treatment:"DAE হটলাইন 16123 এ ফোন করুন।",
    prevention:"পরে পুনরায় চেষ্টা করুন।",
  });
  if (p.includes("ব্লাস্ট")||p.includes("blast"))
    return "ধানের ব্লাস্ট:\n১. Tricyclazole 75% WP @ 0.6g/L\n২. ৭ দিন পর পর ২-৩ বার স্প্রে\n\nDAE হটলাইন: 16123";
  if (p.includes("ইউরিয়া")||p.includes("সার"))
    return `বোরো ধানে সার (প্রতি বিঘা):\nইউরিয়া: ৫৫-৬০ কেজি · TSP: ২০-২৫ কেজি · MOP: ২০-২৫ কেজি\n\nমৌসুম: ${s}\nDAE হটলাইন: 16123`;
  if (p.includes("আলু"))
    return "আলুর লেট ব্লাইট: Metalaxyl+Mancozeb @ 2.5g/L\n\nDAE হটলাইন: 16123";
  return `কৃষি পরামর্শ (${s})\nAI সাময়িক অনুপলব্ধ। DAE হটলাইন: 16123`;
}

// ── Main handler ──────────────────────────────────────────────────────────────
export async function onRequest(context) {
  const { request, env } = context;

  // OPTIONS preflight
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(request) });
  }

  // GET — health check
  if (request.method === "GET") {
    const hasGemini = !!env.GEMINI_API_KEY;
    const hasOR     = !!env.OPENROUTER_API_KEY;
    return json({
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
        ? "free OR vision (gemma-3, llama-4, mistral, kimi-vl, qwen-vl…) → rule-based"
        : "⚠️ rule-based only",
      freeVisionModels: OR_VISION_FREE,
    }, 200, request);
  }

  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, 405, request);
  }

  let body;
  try { body = await request.json(); }
  catch { return json({ error: "Invalid JSON body" }, 400, request); }

  const {
    prompt      = "",
    imageBase64,
    mimeType    = "image/jpeg",
    history     = [],
  } = body;

  if (!prompt) return json({ error: "prompt required", ok: false }, 400, request);

  const hasImage = !!(imageBase64 && imageBase64.length > 50);

  // 1. Gemini 2.0 Flash
  try {
    const text = await callGemini(env, prompt, imageBase64, mimeType, history);
    if (text) return json({ text, model: "gemini-2.0-flash", ok: true }, 200, request);
  } catch (e) { console.error("[gemini]", e?.message); }

  // 2. OpenRouter free vision
  try {
    const or = await callOpenRouter(env, prompt, imageBase64, mimeType);
    if (or?.text) return json({ text: or.text, model: or.model, ok: true }, 200, request);
  } catch (e) { console.error("[openrouter]", e?.message); }

  // 3. Rule-based
  return json({ text: ruleBased(prompt, hasImage), model: "rule-based", ok: true }, 200, request);
}
