/**
 * api/analyze.js
 * Vercel Serverless Function — AI Analysis endpoint
 *
 * Hybrid cascade (same strategy as the Expo app):
 *   1. Gemini 2.0 Flash  (Google AI Studio — GEMINI_API_KEY)
 *   2. Gemini 1.5 Flash  (OpenRouter fallback — OPENROUTER_API_KEY)
 *   3. Rule-based stub   (always works, zero cost)
 *
 * All AI calls are POST /api/analyze  { prompt, imageBase64?, mimeType? }
 * Response: { text, model, ok }
 */

export default async function handler(req, res) {
  // ── CORS (allow krishiai.live + localhost dev) ──────────────────────────
  const allowed = [
    "https://krishiai.live",
    "https://krishiai-three.vercel.app",
    "http://localhost:5173",
    "http://localhost:3001",
  ];
  const origin = req.headers.origin || "";
  if (allowed.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  // ── parse body ──────────────────────────────────────────────────────────
  const { prompt, imageBase64, mimeType } = req.body || {};
  if (!prompt)
    return res.status(400).json({ error: "prompt is required" });

  // ── 1. Gemini 2.0 Flash ─────────────────────────────────────────────────
  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey) {
    try {
      const parts = [{ text: prompt }];
      if (imageBase64 && mimeType) {
        parts.unshift({ inlineData: { mimeType, data: imageBase64 } });
      }
      const gRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents: [{ parts }] }),
        }
      );
      if (gRes.ok) {
        const gData = await gRes.json();
        const text =
          gData?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
        if (text) {
          return res.status(200).json({ text, model: "gemini-2.0-flash", ok: true });
        }
      }
    } catch (_) {
      // fall through to next model
    }
  }

  // ── 2. Gemini 1.5 Flash via OpenRouter ──────────────────────────────────
  const orKey = process.env.OPENROUTER_API_KEY;
  if (orKey) {
    try {
      const messages = [{ role: "user", content: prompt }];
      if (imageBase64 && mimeType) {
        messages[0].content = [
          { type: "image_url", image_url: { url: `data:${mimeType};base64,${imageBase64}` } },
          { type: "text", text: prompt },
        ];
      }
      const orRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${orKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://krishiai.live",
        },
        body: JSON.stringify({
          model: "google/gemini-flash-1.5",
          messages,
          max_tokens: 800,
        }),
      });
      if (orRes.ok) {
        const orData = await orRes.json();
        const text = orData?.choices?.[0]?.message?.content ?? "";
        if (text) {
          return res.status(200).json({ text, model: "gemini-1.5-flash-or", ok: true });
        }
      }
    } catch (_) {
      // fall through to rule-based
    }
  }

  // ── 3. Rule-based stub (zero dependency, always works) ───────────────────
  const stub = ruleBasedResponse(prompt);
  return res.status(200).json({ text: stub, model: "rule-based", ok: true });
}

/** Minimal rule-based fallback for common agricultural queries */
function ruleBasedResponse(prompt) {
  const p = prompt.toLowerCase();
  if (p.includes("blast") || p.includes("ব্লাস্ট"))
    return "Rice blast সন্দেহ হলে tricyclazole (75% WP) @ 0.6g/L পানিতে মিশিয়ে স্প্রে করুন। DAE হটলাইন: 16123।";
  if (p.includes("blight") || p.includes("পাতা পোড়া"))
    return "Late blight এর জন্য mancozeb @ 2g/L স্প্রে করুন। আক্রান্ত পাতা সরিয়ে ফেলুন।";
  if (p.includes("fertilizer") || p.includes("সার"))
    return "বোরো ধানে: ইউরিয়া ৬০ kg/বিঘা, TSP ২০ kg/বিঘা, MOP ২০ kg/বিঘা। তিন ভাগে প্রয়োগ করুন।";
  if (p.includes("weather") || p.includes("আবহাওয়া"))
    return "আবহাওয়ার তথ্যের জন্য BMD (www.bmd.gov.bd) বা DAE হটলাইন 16123 এ যোগাযোগ করুন।";
  if (p.includes("price") || p.includes("দাম") || p.includes("বাজার"))
    return "বাজার মূল্যের জন্য DAE-এর কৃষি বাজার তথ্য সিস্টেম (AMIS) দেখুন অথবা স্থানীয় উপজেলা কৃষি অফিসে যোগাযোগ করুন।";
  return "আপনার প্রশ্নের জন্য ধন্যবাদ। বিস্তারিত পরামর্শের জন্য স্থানীয় DAE উপজেলা কৃষি অফিসার অথবা হটলাইন 16123 এ যোগাযোগ করুন।";
}
