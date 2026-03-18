/**
 * api/analyze.js  —  v4
 * Fixed: proper error propagation, image-aware rule-based fallback,
 * smaller request body handling, better JSON mode for diagnosis.
 */

export const config = { maxDuration: 60 };

const SYSTEM_PROMPT = `আপনি কৃষি AI — বাংলাদেশের কৃষকদের জন্য বিশেষজ্ঞ কৃষি পরামর্শদাতা।
BRRI, BARI, DAE, SRDI, BADC ও BARC নির্দেশিকা অনুসরণ করুন।
সব উত্তর বাংলায় দিন। সংক্ষিপ্ত, ব্যবহারিক ও কার্যকর পরামর্শ দিন।
রোগ নির্ণয়ে তীব্রতা (স্বল্প/মধ্যম/তীব্র) ও DAE হটলাইন 16123 উল্লেখ করুন।`;

function setCORS(req, res) {
  const origin = req.headers.origin || "";
  if (
    origin.endsWith(".krishiai.live") ||
    origin === "https://krishiai.live" ||
    origin === "http://localhost:5173" ||
    origin === "http://localhost:3000"
  ) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function getBDSeason() {
  const m = new Date().getMonth() + 1;
  if (m >= 11 || m <= 2) return "রবি (শীতকালীন)";
  if (m >= 3  && m <= 5) return "প্রাক-খরিফ";
  if (m >= 6  && m <= 7) return "খরিফ-১";
  return "খরিফ-২ / আমন";
}

// ── Gemini 2.0 Flash ──────────────────────────────────────────────────────────
async function callGemini(prompt, imageBase64, mimeType, history, stream) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;

  const parts = [];
  if (imageBase64 && mimeType) {
    parts.push({ inlineData: { mimeType, data: imageBase64 } });
  }
  parts.push({ text: prompt });

  const contents = [];
  if (history?.length) {
    for (const h of history) {
      contents.push({
        role: h.role === "assistant" ? "model" : "user",
        parts: [{ text: h.text }],
      });
    }
  }
  contents.push({ role: "user", parts });

  const body = {
    system_instruction: { parts: [{ text: SYSTEM_PROMPT + `\nمौসुম: ${getBDSeason()}` }] },
    contents,
    generationConfig: {
      temperature: imageBase64 ? 0.2 : 0.7,
      maxOutputTokens: 1024,
      topP: 0.95,
    },
    safetySettings: [
      { category: "HARM_CATEGORY_HARASSMENT",       threshold: "BLOCK_ONLY_HIGH" },
      { category: "HARM_CATEGORY_HATE_SPEECH",       threshold: "BLOCK_ONLY_HIGH" },
      { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_ONLY_HIGH" },
      { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
    ],
  };

  const model   = "gemini-2.0-flash";
  const action  = stream ? "streamGenerateContent?alt=sse" : "generateContent";
  const url     = `https://generativelanguage.googleapis.com/v1beta/models/${model}:${action}&key=${key}`;

  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const err = await resp.text().catch(() => "");
    console.error("Gemini error", resp.status, err.slice(0, 200));
    return null;
  }
  return resp;
}

// ── OpenRouter fallback (text only) ──────────────────────────────────────────
async function callOpenRouter(prompt) {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) return null;

  const resp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://krishiai.live",
    },
    body: JSON.stringify({
      model: "google/gemini-flash-1.5",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user",   content: prompt },
      ],
      max_tokens: 800,
      temperature: 0.7,
    }),
  });

  if (!resp.ok) return null;
  const d = await resp.json();
  return d?.choices?.[0]?.message?.content || null;
}

// ── Rule-based fallback ───────────────────────────────────────────────────────
function ruleBasedResponse(prompt, hasImage) {
  const p = prompt.toLowerCase();
  const season = getBDSeason();

  // Image scan fallback
  if (hasImage) {
    return JSON.stringify({
      disease:    "ছবি বিশ্লেষণ সম্ভব হয়নি",
      disease_en: "Analysis unavailable",
      crop:       "অজ্ঞাত",
      severity:   "মধ্যম",
      confidence: 30,
      cause:      "AI সংযোগ সমস্যার কারণে ছবি বিশ্লেষণ করা সম্ভব হয়নি।",
      treatment:  "সরাসরি DAE উপজেলা কৃষি অফিসে নিয়ে যান অথবা 16123 এ ফোন করুন।",
      prevention: "নিয়মিত ফসল পর্যবেক্ষণ করুন। সন্দেহজনক রোগ দেখলেই DAE-তে যোগাযোগ করুন।",
    });
  }

  if (p.includes("blast") || p.includes("ব্লাস্ট"))
    return `ধানের ব্লাস্ট রোগ (Magnaporthe oryzae):\n\n১. Tricyclazole 75% WP @ 0.6g/L\n২. Propiconazole 25% EC @ 1ml/L\n৭ দিন পর পর ২-৩ বার স্প্রে করুন।\n\nDAE হটলাইন: 16123`;

  if (p.includes("ইউরিয়া") || p.includes("সার"))
    return `বোরো ধানে সার (প্রতি বিঘা):\n\nইউরিয়া: ৫৫-৬০ কেজি (৩ ভাগে)\nTSP: ২০-২৫ কেজি (রোপণের আগে)\nMOP: ২০-২৫ কেজি (২ ভাগে)\n\nমৌসুম: ${season}\nDAE হটলাইন: 16123`;

  if (p.includes("আলু") || p.includes("potato"))
    return `আলুর রোগ ব্যবস্থাপনা:\n\nলেট ব্লাইট: Metalaxyl+Mancozeb @ 2.5g/L\nআর্লি ব্লাইট: Mancozeb 80% WP @ 2g/L\n\nDAE হটলাইন: 16123`;

  return `আপনার প্রশ্নের জন্য ধন্যবাদ।\n\nবর্তমান মৌসুম: ${season}\n\nবিস্তারিত পরামর্শের জন্য:\nDAE হটলাইন: 16123\nউপজেলা কৃষি অফিসার`;
}

// ── Main handler ──────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  setCORS(req, res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST")    return res.status(405).json({ error: "Method not allowed" });

  const {
    prompt       = "",
    imageBase64,
    mimeType     = "image/jpeg",
    history      = [],
    stream       = false,
  } = req.body || {};

  if (!prompt) return res.status(400).json({ error: "prompt required" });

  const hasImage = !!imageBase64;

  // ── STREAMING ───────────────────────────────────────────────────────────────
  if (stream) {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("X-Accel-Buffering", "no");

    try {
      const resp = await callGemini(prompt, imageBase64, mimeType, history, true);
      if (!resp) throw new Error("Gemini unavailable");

      const reader  = resp.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const lines = decoder.decode(value).split("\n");
        for (const line of lines) {
          if (!line.startsWith("data:")) continue;
          const data = line.slice(5).trim();
          if (data === "[DONE]") continue;
          try {
            const parsed = JSON.parse(data);
            const text   = parsed?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) res.write(`data: ${JSON.stringify({ text, model: "gemini-2.0-flash" })}\n\n`);
          } catch { /* partial chunk */ }
        }
      }
    } catch {
      const fallback = ruleBasedResponse(prompt, hasImage);
      res.write(`data: ${JSON.stringify({ text: fallback, model: "rule-based" })}\n\n`);
    }

    res.write("data: [DONE]\n\n");
    return res.end();
  }

  // ── STANDARD ────────────────────────────────────────────────────────────────

  // 1. Gemini 2.0 Flash
  try {
    const resp = await callGemini(prompt, imageBase64, mimeType, history, false);
    if (resp) {
      const d    = await resp.json();
      const text = d?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        return res.status(200).json({ text, model: "gemini-2.0-flash", ok: true });
      }
    }
  } catch (e) {
    console.error("Gemini call failed:", e?.message);
  }

  // 2. OpenRouter (text only — skip for image requests to avoid base64 issues)
  if (!hasImage) {
    try {
      const text = await callOpenRouter(prompt);
      if (text) return res.status(200).json({ text, model: "gemini-1.5-flash", ok: true });
    } catch (e) {
      console.error("OpenRouter failed:", e?.message);
    }
  }

  // 3. Rule-based fallback
  const text = ruleBasedResponse(prompt, hasImage);
  return res.status(200).json({ text, model: "rule-based", ok: true });
}
