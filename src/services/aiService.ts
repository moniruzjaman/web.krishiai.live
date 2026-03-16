/**
 * src/services/aiService.ts
 *
 * Single entry-point for all AI calls in the web app.
 * Sends POST /api/analyze  →  Vercel serverless function (api/analyze.js)
 * which internally runs the Gemini 2.0 Flash → Gemini 1.5 Flash → rule-based cascade.
 *
 * Usage:
 *   import { analyzeText, analyzeImage } from "@/services/aiService";
 *   const { text, model } = await analyzeText("আমার ধান গাছে দাগ দেখা যাচ্ছে");
 */

const ENDPOINT = "/api/analyze";

export interface AIResponse {
  text: string;
  model: string;
  ok: boolean;
}

/** Send a plain-text prompt */
export async function analyzeText(prompt: string): Promise<AIResponse> {
  return callAPI({ prompt });
}

/**
 * Send a prompt + image (base64).
 * imageData can be a data-URL ("data:image/jpeg;base64,...") or raw base64.
 */
export async function analyzeImage(
  prompt: string,
  imageData: string,
  mimeType = "image/jpeg"
): Promise<AIResponse> {
  // Strip the data-URL prefix if present
  const base64 = imageData.startsWith("data:")
    ? imageData.split(",")[1]
    : imageData;
  return callAPI({ prompt, imageBase64: base64, mimeType });
}

/** Build the agriculture-aware system prompt */
export function buildAgriPrompt(userMessage: string, context?: string): string {
  const ctx = context ? `\nContext: ${context}` : "";
  return `You are কৃষি AI, an expert agricultural advisor for Bangladesh farmers.
You follow BRRI, BARI, DAE, and SRDI guidelines.
Respond in Bengali (বাংলা) by default. Keep answers practical and under 200 words.
Always end with: "বিস্তারিত পরামর্শের জন্য DAE হটলাইন: 16123"${ctx}

Farmer's question: ${userMessage}`;
}

// ── internal ─────────────────────────────────────────────────────────────────

async function callAPI(body: Record<string, unknown>): Promise<AIResponse> {
  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.text().catch(() => "unknown error");
      throw new Error(`API ${res.status}: ${err}`);
    }

    const data: AIResponse = await res.json();
    return data;
  } catch (err) {
    console.error("[aiService] error:", err);
    return {
      text: "সংযোগ সমস্যা। অনুগ্রহ করে পুনরায় চেষ্টা করুন অথবা DAE হটলাইন 16123 এ কল করুন।",
      model: "offline-fallback",
      ok: false,
    };
  }
}
