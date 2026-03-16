/**
 * api/analyze.js  —  v3 AI-POWERED
 *
 * Full Gemini 2.0 Flash implementation with:
 *   - Streaming responses (SSE)
 *   - Multi-turn conversation history
 *   - Multimodal (text + image)
 *   - Structured JSON output for diagnosis
 *   - Farming context injection (season, district, crop)
 *   - Gemini 2.0 Flash → Gemini 1.5 Flash → rule-based fallback
 *
 * Endpoints:
 *   POST /api/analyze          — standard (JSON response)
 *   POST /api/analyze?stream=1 — streaming (SSE)
 */

export const config = { maxDuration: 60 };

// ── System prompt ─────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are কৃষি AI (Krishi AI), Bangladesh's most trusted AI agricultural advisor.

IDENTITY:
- Expert in BRRI, BARI, DAE, SRDI, BADC, and BARC guidelines
- Deep knowledge of Bangladesh agriculture: crops, soil, climate, pests, diseases
- Fluent in Bengali — always respond in Bengali (বাংলা) unless asked otherwise
- You know the 8 AEZ zones, 64 districts, seasonal calendars, and local market conditions

CAPABILITIES:
- Diagnose crop diseases from images with confidence scores
- Give fertilizer recommendations by crop, AEZ zone, and season
- Provide IPM-based pest control using IRAC/FRAC protocols
- Advise on soil health, irrigation, weather-based decisions
- Explain government schemes, subsidies, DAE services

STYLE:
- Practical, concise, actionable — farmers need clear steps
- Use Bengali crop/disease names first, then English in brackets
- Structure responses with numbers or bullets when listing steps
- Always mention severity (স্বল্প/মধ্যম/তীব্র) for disease diagnoses
- End diagnoses with treatment and DAE hotline 16123

KNOWLEDGE:
- Current season: determined by date
- Key crops: ধান (BRRI dhan28/29/50/81/89/92), গম, আলু, পাট, সবজি, ফল
- Common diseases: ব্লাস্ট, বাদামি দাগ, পাতা পোড়া, ধ্বসা, পানামা উইল্ট
- Fertilizers: ইউরিয়া, TSP, MOP, DAP, ZnSO4, বোরন
- Pesticides: DAE approved list only

CONSTRAINTS:
- Never recommend banned pesticides
- Always suggest consulting DAE extension officer for serious problems
- If unsure, say so — don't fabricate data
- Keep responses under 300 words unless a detailed analysis is requested`;

// ── CORS helper ───────────────────────────────────────────────────────────────
function setCORS(req, res) {
  const allowed = [
    "https://krishiai.live",
    "https://web.krishiai.live",
    "https://krishiai-three.vercel.app",
    "http://localhost:5173",
    "http://localhost:3000",
  ];
  const origin = req.headers.origin || "";
  if (allowed.includes(origin) || origin.endsWith(".krishiai.live")) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

// ── Current season helper ─────────────────────────────────────────────────────
function getBDSeason() {
  const m = new Date().getMonth() + 1;
  if (m >= 11 || m <= 2) return "রবি (শীতকালীন)";
  if (m >= 3  && m <= 5) return "প্রাক-খরিফ";
  if (m >= 6  && m <= 7) return "খরিফ-১";
  return "খরিফ-২ / আমন";
}

// ── Build Gemini request body ─────────────────────────────────────────────────
function buildGeminiBody({ prompt, imageBase64, mimeType, history, context, mode }) {
  const season = getBDSeason();
  const systemText = SYSTEM_PROMPT +
    `\n\nCURRENT CONTEXT:\n- Season: ${season}\n- Date: ${new Date().toLocaleDateString("bn-BD")}` +
    (context ? `\n- Farmer context: ${context}` : "");

  const contents = [];

  // Add conversation history
  if (history?.length) {
    for (const h of history) {
      contents.push({ role: h.role === "assistant" ? "model" : "user", parts: [{ text: h.text }] });
    }
  }

  // Build current user parts
  const parts = [];
  if (imageBase64 && mimeType) {
    parts.push({ inlineData: { mimeType, data: imageBase64 } });
  }

  // For diagnosis mode, add JSON instruction
  const finalPrompt = mode === "diagnose"
    ? prompt + "\n\nRespond with valid JSON only:\n{\"disease\":\"name\",\"disease_en\":\"name\",\"crop\":\"crop\",\"severity\":\"স্বল্প|মধ্যম|তীব্র\",\"confidence\":85,\"cause\":\"cause\",\"treatment\":\"treatment\",\"prevention\":\"prevention\",\"hotline\":\"16123\"}"
    : prompt;

  parts.push({ text: finalPrompt });
  contents.push({ role: "user", parts });

  return {
    system_instruction: { parts: [{ text: systemText }] },
    contents,
    generationConfig: {
      temperature:       mode === "diagnose" ? 0.2 : 0.7,
      topP:              0.95,
      topK:              40,
      maxOutputTokens:   mode === "diagnose" ? 512 : 1024,
      responseMimeType:  mode === "diagnose" ? "application/json" : "text/plain",
    },
    safetySettings: [
      { category: "HARM_CATEGORY_HARASSMENT",        threshold: "BLOCK_ONLY_HIGH" },
      { category: "HARM_CATEGORY_HATE_SPEECH",        threshold: "BLOCK_ONLY_HIGH" },
      { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",  threshold: "BLOCK_ONLY_HIGH" },
      { category: "HARM_CATEGORY_DANGEROUS_CONTENT",  threshold: "BLOCK_MEDIUM_AND_ABOVE" },
    ],
  };
}

// ── Gemini 2.0 Flash call ─────────────────────────────────────────────────────
async function callGemini2Flash(body, stream = false) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;

  const endpoint = stream
    ? `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:streamGenerateContent?alt=sse&key=${key}`
    : `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`;

  const resp = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!resp.ok) return null;
  return resp;
}

// ── Gemini 1.5 Flash via OpenRouter (fallback) ────────────────────────────────
async function callOpenRouter(prompt, imageBase64, mimeType) {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) return null;

  const content = [];
  if (imageBase64 && mimeType) {
    content.push({ type: "image_url", image_url: { url: `data:${mimeType};base64,${imageBase64}` } });
  }
  content.push({ type: "text", text: prompt });

  const resp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://krishiai.live",
      "X-Title": "Krishi AI Bangladesh",
    },
    body: JSON.stringify({
      model: "google/gemini-flash-1.5",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user",   content },
      ],
      max_tokens: 1024,
      temperature: 0.7,
    }),
  });

  if (!resp.ok) return null;
  const d = await resp.json();
  return d?.choices?.[0]?.message?.content || null;
}

// ── Rule-based fallback ───────────────────────────────────────────────────────
function ruleBasedResponse(prompt) {
  const p = prompt.toLowerCase();
  const season = getBDSeason();

  if (p.includes("blast") || p.includes("ব্লাস্ট"))
    return `ধানের ব্লাস্ট রোগ (Magnaporthe oryzae) সনাক্ত হয়েছে।\n\n**তীব্রতা:** মধ্যম-তীব্র\n\n**প্রতিকার:**\n১. Tricyclazole 75% WP @ 0.6g/L পানিতে মিশিয়ে ৭ দিন পর পর ২-৩ বার স্প্রে করুন\n২. Propiconazole 25% EC @ 1ml/L ব্যবহার করতে পারেন\n৩. আক্রান্ত জমিতে পটাশ সার বাড়ান\n৪. সন্ধ্যায় বা ভোরে স্প্রে করুন\n\nবিস্তারিত পরামর্শের জন্য DAE হটলাইন: 16123`;

  if (p.includes("বোরো") || p.includes("boro"))
    return `বোরো মৌসুমের পরামর্শ (${season}):\n\n**সার ব্যবস্থাপনা (প্রতি বিঘা):**\n- ইউরিয়া: ৫৫-৬০ কেজি (৩ ভাগে)\n- TSP: ২০-২৫ কেজি (রোপণের আগে)\n- MOP: ২০-২৫ কেজি (২ ভাগে)\n- জিংক সালফেট: ২ কেজি\n\n**সেচ:** ৩-৫ সেমি পানি রাখুন\n\nDAE হটলাইন: 16123`;

  if (p.includes("সার") || p.includes("fertilizer") || p.includes("ইউরিয়া"))
    return `সার ব্যবস্থাপনার সাধারণ নির্দেশিকা:\n\n বর্তমান মৌসুম: ${season}\n\n**মাটি পরীক্ষা করুন** — SRDI থেকে বিনামূল্যে মাটি পরীক্ষা করানো যায়।\n\nDAE হটলাইন: 16123`;

  if (p.includes("আবহাওয়া") || p.includes("বৃষ্টি") || p.includes("weather"))
    return `আবহাওয়া তথ্য:\n\nBMD (Bangladesh Meteorological Department): www.bmd.gov.bd\nDAE আবহাওয়া পরামর্শ: www.dae.gov.bd\n\nDAE হটলাইন: 16123`;

  return `আপনার প্রশ্নের জন্য ধন্যবাদ।\n\nবর্তমান মৌসুম: ${season}\n\nবিস্তারিত পরামর্শের জন্য স্থানীয় DAE উপজেলা কৃষি অফিসার অথবা হটলাইন 16123 এ যোগাযোগ করুন।`;
}

// ── Main handler ──────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  setCORS(req, res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const {
    prompt,
    imageBase64,
    mimeType    = "image/jpeg",
    history     = [],
    context     = "",
    mode        = "chat",    // "chat" | "diagnose" | "advisory"
    stream: wantStream = false,
  } = req.body || {};

  if (!prompt) return res.status(400).json({ error: "prompt is required" });

  const geminiBody = buildGeminiBody({ prompt, imageBase64, mimeType, history, context, mode });

  // ── STREAMING mode ────────────────────────────────────────────────────────
  if (wantStream) {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("X-Accel-Buffering", "no");

    try {
      const gemResp = await callGemini2Flash(geminiBody, true);
      if (!gemResp) throw new Error("Gemini unavailable");

      const reader = gemResp.body.getReader();
      const decoder = new TextDecoder();
      let model = "gemini-2.0-flash";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (!line.startsWith("data:")) continue;
          const data = line.slice(5).trim();
          if (data === "[DONE]") continue;
          try {
            const parsed = JSON.parse(data);
            const text = parsed?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
              res.write(`data: ${JSON.stringify({ text, model })}\n\n`);
            }
          } catch { /* partial chunk */ }
        }
      }
      res.write("data: [DONE]\n\n");
      return res.end();
    } catch (err) {
      res.write(`data: ${JSON.stringify({ text: ruleBasedResponse(prompt), model: "rule-based" })}\n\n`);
      res.write("data: [DONE]\n\n");
      return res.end();
    }
  }

  // ── STANDARD mode ─────────────────────────────────────────────────────────
  // 1. Gemini 2.0 Flash
  try {
    const gemResp = await callGemini2Flash(geminiBody, false);
    if (gemResp) {
      const d = await gemResp.json();
      const text = d?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        // For diagnose mode, parse JSON and enrich response
        if (mode === "diagnose") {
          try {
            const diagnosis = JSON.parse(text);
            return res.status(200).json({ text, diagnosis, model: "gemini-2.0-flash", ok: true });
          } catch { /* not JSON, fall through */ }
        }
        return res.status(200).json({ text, model: "gemini-2.0-flash", ok: true });
      }
    }
  } catch { /* fall through */ }

  // 2. Gemini 1.5 Flash via OpenRouter
  try {
    const orText = await callOpenRouter(prompt, imageBase64, mimeType);
    if (orText) return res.status(200).json({ text: orText, model: "gemini-1.5-flash", ok: true });
  } catch { /* fall through */ }

  // 3. Rule-based fallback
  return res.status(200).json({ text: ruleBasedResponse(prompt), model: "rule-based", ok: true });
}
