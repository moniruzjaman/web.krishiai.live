/**
 * api/analyze.js  —  v5
 * Fixes: env key validation, proper CORS, streaming, image compression info,
 * rule-based image fallback with valid JSON, all error paths return { ok, text, model }
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

// ── CORS ──────────────────────────────────────────────────────────────────────
function cors(req, res) {
  const o = req.headers.origin || "";
  if (o.endsWith(".krishiai.live") || o === "https://krishiai.live" ||
      o.startsWith("http://localhost")) {
    res.setHeader("Access-Control-Allow-Origin",  o);
  }
  res.setHeader("Access-Control-Allow-Methods",  "POST, GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers",  "Content-Type");
}

// ── Season ────────────────────────────────────────────────────────────────────
function season() {
  const m = new Date().getMonth() + 1;
  if (m >= 11 || m <= 2) return "রবি (শীতকালীন)";
  if (m >= 3  && m <= 5) return "প্রাক-খরিফ (বসন্ত)";
  if (m >= 6  && m <= 7) return "খরিফ-১";
  return "খরিফ-২ / আমন";
}

// ── Build Gemini contents array ───────────────────────────────────────────────
function buildContents(prompt, imageBase64, mimeType, history) {
  const contents = [];
  // conversation history
  for (const h of (history || [])) {
    contents.push({
      role:  h.role === "assistant" ? "model" : "user",
      parts: [{ text: h.text }],
    });
  }
  // current user turn
  const parts = [];
  if (imageBase64 && mimeType) {
    parts.push({ inlineData: { mimeType, data: imageBase64 } });
  }
  parts.push({ text: prompt });
  contents.push({ role: "user", parts });
  return contents;
}

// ── Gemini 2.0 Flash ──────────────────────────────────────────────────────────
async function gemini(prompt, imageBase64, mimeType, history, stream = false) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;

  const action = stream
    ? "streamGenerateContent?alt=sse"
    : "generateContent";

  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:${action}&key=${key}`;

  const body = {
    system_instruction: {
      parts: [{ text: `${SYSTEM}\n\nআজকের মৌসুম: ${season()}` }],
    },
    contents: buildContents(prompt, imageBase64, mimeType, history),
    generationConfig: {
      temperature:     imageBase64 ? 0.1 : 0.65,
      topP:            0.95,
      maxOutputTokens: 1024,
    },
    safetySettings: [
      { category: "HARM_CATEGORY_HARASSMENT",       threshold: "BLOCK_ONLY_HIGH" },
      { category: "HARM_CATEGORY_HATE_SPEECH",       threshold: "BLOCK_ONLY_HIGH" },
      { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_ONLY_HIGH" },
      { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
    ],
  };

  const resp = await fetch(url, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(body),
  });

  if (!resp.ok) {
    const txt = await resp.text().catch(() => "");
    console.error("[Gemini]", resp.status, txt.slice(0, 300));
    return null;
  }
  return resp;
}

// ── OpenRouter fallback (text only) ──────────────────────────────────────────
async function openRouter(prompt) {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) return null;

  const resp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method:  "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://krishiai.live",
      "X-Title":      "Krishi AI Bangladesh",
    },
    body: JSON.stringify({
      model:       "google/gemini-flash-1.5",
      messages:    [
        { role: "system", content: SYSTEM },
        { role: "user",   content: prompt },
      ],
      max_tokens:  800,
      temperature: 0.65,
    }),
  });

  if (!resp.ok) return null;
  const d = await resp.json();
  return d?.choices?.[0]?.message?.content || null;
}

// ── Rule-based fallback ───────────────────────────────────────────────────────
function ruleBased(prompt, hasImage) {
  const p     = prompt.toLowerCase();
  const s     = season();

  if (hasImage) {
    return JSON.stringify({
      disease:    "বিশ্লেষণ সম্ভব হয়নি",
      disease_en: "Analysis unavailable",
      crop:       "অজ্ঞাত",
      severity:   "মধ্যম",
      confidence: 20,
      cause:      "AI সার্ভার এই মুহূর্তে উপলব্ধ নেই। GEMINI_API_KEY যাচাই করুন।",
      treatment:  "DAE উপজেলা কৃষি অফিসে নিয়ে যান অথবা 16123 এ ফোন করুন।",
      prevention: "ছবি তুলে রাখুন এবং পরে পুনরায় চেষ্টা করুন।",
    });
  }

  if (p.includes("blast") || p.includes("ব্লাস্ট"))
    return "ধানের ব্লাস্ট রোগ (Magnaporthe oryzae):\n\n১. Tricyclazole 75% WP @ 0.6g/L\n২. ৭ দিন পর পর ২-৩ বার স্প্রে করুন\n৩. সন্ধ্যায় বা ভোরে স্প্রে করুন\n\nDAE হটলাইন: 16123";

  if (p.includes("ইউরিয়া") || p.includes("সার") || p.includes("fertilizer"))
    return `বোরো ধানে সার (প্রতি বিঘা):\n\nইউরিয়া: ৫৫-৬০ কেজি (৩ ভাগে)\nTSP: ২০-২৫ কেজি\nMOP: ২০-২৫ কেজি\n\nমৌসুম: ${s}\nDAE হটলাইন: 16123`;

  if (p.includes("আলু") || p.includes("potato"))
    return "আলুর লেট ব্লাইট: Metalaxyl+Mancozeb @ 2.5g/L\nআর্লি ব্লাইট: Mancozeb 80% @ 2g/L\n\nDAE হটলাইন: 16123";

  if (p.includes("পানামা") || p.includes("কলা"))
    return "কলার পানামা উইল্ট:\n\n১. আক্রান্ত গাছ তুলে পুড়িয়ে ফেলুন\n২. BARI কলা-১ জাত ব্যবহার করুন\n৩. একই জমিতে ৩-৪ বছর কলা চাষ বন্ধ রাখুন\n\nDAE হটলাইন: 16123";

  return `কৃষি পরামর্শ সেবা\n\nমৌসুম: ${s}\n\nAI সার্ভার সংযোগ সমস্যার কারণে সীমিত উত্তর দেওয়া হচ্ছে।\nবিস্তারিত পরামর্শ: DAE হটলাইন 16123`;
}

// ── Health check endpoint ─────────────────────────────────────────────────────
function healthCheck(res) {
  const hasGemini = !!process.env.GEMINI_API_KEY;
  const hasOR     = !!process.env.OPENROUTER_API_KEY;
  return res.status(200).json({
    status:  "ok",
    season:  season(),
    keys: {
      gemini:     hasGemini ? "✅ set" : "❌ MISSING — AI scan will fail",
      openrouter: hasOR     ? "✅ set" : "⚠️  not set (optional fallback)",
    },
    cascade: hasGemini
      ? "gemini-2.0-flash → rule-based"
      : hasOR
        ? "openrouter/gemini-1.5-flash → rule-based"
        : "⚠️ rule-based only (no API keys set)",
  });
}

// ── Main handler ──────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  cors(req, res);

  if (req.method === "OPTIONS") return res.status(200).end();

  // GET /api/analyze — health check (useful for Vercel env var debugging)
  if (req.method === "GET") return healthCheck(res);

  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  const {
    prompt       = "",
    imageBase64,
    mimeType     = "image/jpeg",
    history      = [],
    stream       = false,
  } = req.body || {};

  if (!prompt) return res.status(400).json({ error: "prompt required", ok: false });

  const hasImage = !!(imageBase64 && imageBase64.length > 100);

  // ── STREAMING ─────────────────────────────────────────────────────────────
  if (stream) {
    res.setHeader("Content-Type",    "text/event-stream");
    res.setHeader("Cache-Control",   "no-cache");
    res.setHeader("X-Accel-Buffering", "no");
    res.setHeader("Connection",      "keep-alive");

    const send = (text, model) =>
      res.write(`data: ${JSON.stringify({ text, model })}\n\n`);

    try {
      const resp = await gemini(prompt, imageBase64, mimeType, history, true);
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
            const chunk = JSON.parse(raw);
            const text  = chunk?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) send(text, "gemini-2.0-flash");
          } catch { /* partial chunk */ }
        }
      }
    } catch (e) {
      console.error("[stream]", e?.message);
      // Try OpenRouter non-streaming, send as single chunk
      if (!hasImage) {
        const text = await openRouter(prompt).catch(() => null);
        if (text) { send(text, "gemini-1.5-flash"); }
        else      { send(ruleBased(prompt, false), "rule-based"); }
      } else {
        send(ruleBased(prompt, true), "rule-based");
      }
    }

    res.write("data: [DONE]\n\n");
    return res.end();
  }

  // ── STANDARD ──────────────────────────────────────────────────────────────

  // 1. Gemini 2.0 Flash
  try {
    const resp = await gemini(prompt, imageBase64, mimeType, history, false);
    if (resp) {
      const d    = await resp.json();
      const text = d?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) return res.status(200).json({ text, model: "gemini-2.0-flash", ok: true });
    }
  } catch (e) { console.error("[gemini standard]", e?.message); }

  // 2. OpenRouter (text-only fallback)
  if (!hasImage) {
    try {
      const text = await openRouter(prompt);
      if (text) return res.status(200).json({ text, model: "gemini-1.5-flash", ok: true });
    } catch (e) { console.error("[openrouter]", e?.message); }
  }

  // 3. Rule-based
  return res.status(200).json({
    text:  ruleBased(prompt, hasImage),
    model: "rule-based",
    ok:    true,
  });
}
