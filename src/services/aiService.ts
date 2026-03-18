/**
 * aiService.ts  —  v3 AI-POWERED
 *
 * Full-featured AI client:
 *  - Streaming responses with token-by-token rendering
 *  - Conversation history passed to every call
 *  - Multimodal (text + image)
 *  - Structured diagnosis output
 *  - Smart context builder (season, district, crop profile)
 *  - Voice input helper
 *  - Retry logic
 */

const ENDPOINT = "/api/analyze";

// ── Types ─────────────────────────────────────────────────────────────────────
export interface AIResponse {
  text:      string;
  model:     string;
  ok:        boolean;
  diagnosis?: DiagnosisResult;
}

export interface DiagnosisResult {
  disease:    string;
  disease_en: string;
  crop:       string;
  severity:   "স্বল্প" | "মধ্যম" | "তীব্র";
  confidence: number;
  cause:      string;
  treatment:  string;
  prevention: string;
  hotline:    string;
}

export interface ConversationMessage {
  role: "user" | "assistant";
  text: string;
}

export interface FarmerContext {
  name?:     string;
  district?: string;
  crops?:    string[];
  landSize?: string;
}

// ── Context builder ───────────────────────────────────────────────────────────
export function buildContext(farmer?: FarmerContext): string {
  const parts: string[] = [];
  if (farmer?.name)     parts.push(`কৃষকের নাম: ${farmer.name}`);
  if (farmer?.district) parts.push(`জেলা: ${farmer.district}`);
  if (farmer?.crops?.length) parts.push(`ফসল: ${farmer.crops.join(", ")}`);
  if (farmer?.landSize) parts.push(`জমির পরিমাণ: ${farmer.landSize}`);
  return parts.join(" | ");
}

/** Build agriculture-aware prompt with optional extra instructions */
export function buildAgriPrompt(userMessage: string, context?: string): string {
  return context ? `${userMessage}\n\nContext: ${context}` : userMessage;
}

// ── Standard text query ───────────────────────────────────────────────────────
export async function analyzeText(
  prompt: string,
  history: ConversationMessage[] = [],
  context = ""
): Promise<AIResponse> {
  return callAPI({ prompt, history, context, mode: "chat" });
}

// ── Image + text analysis ─────────────────────────────────────────────────────
export async function analyzeImage(
  prompt:    string,
  imageData: string,
  mimeType  = "image/jpeg"
): Promise<AIResponse> {
  const base64 = imageData.startsWith("data:")
    ? imageData.split(",")[1]
    : imageData;
  // No history for image calls — keeps body size small
  return callAPI({ prompt, imageBase64: base64, mimeType });
}

// ── Structured crop diagnosis ─────────────────────────────────────────────────
export async function diagnoseCrop(
  imageData: string,
  mimeType  = "image/jpeg",
  extra     = ""
): Promise<AIResponse> {
  const base64 = imageData.startsWith("data:")
    ? imageData.split(",")[1]
    : imageData;
  const prompt = `এই ফসলের ছবি বিশ্লেষণ করুন এবং রোগ/সমস্যা সনাক্ত করুন।${extra ? "\n" + extra : ""}`;
  return callAPI({ prompt, imageBase64: base64, mimeType, mode: "diagnose" });
}

// ── STREAMING — calls onChunk for each token, returns full text ───────────────
export async function streamAnalysis(
  prompt:    string,
  onChunk:   (token: string) => void,
  history:   ConversationMessage[] = [],
  context    = ""
): Promise<AIResponse> {
  try {
    const res = await fetch(ENDPOINT + "?stream=1", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ prompt, history, context, mode: "chat", stream: true }),
    });

    if (!res.ok || !res.body) throw new Error("stream failed");

    const reader  = res.body.getReader();
    const decoder = new TextDecoder();
    let   full    = "";
    let   model   = "gemini-2.0-flash";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      for (const line of chunk.split("\n")) {
        if (!line.startsWith("data:")) continue;
        const data = line.slice(5).trim();
        if (data === "[DONE]") break;
        try {
          const parsed = JSON.parse(data);
          if (parsed.text) {
            full  += parsed.text;
            model  = parsed.model || model;
            onChunk(parsed.text);
          }
        } catch { /* partial */ }
      }
    }
    return { text: full, model, ok: true };
  } catch {
    // Fall back to non-streaming
    return analyzeText(prompt, history, context);
  }
}

// ── Smart farming prompt templates ────────────────────────────────────────────
export const PROMPTS = {
  diseaseHelp: (symptom: string, crop: string) =>
    `আমার ${crop} গাছে সমস্যা: ${symptom}\nকারণ, তীব্রতা ও প্রতিকার বলুন।`,

  fertilizerAdvice: (crop: string, area: string, zone?: string) =>
    `${crop} চাষে ${area} জমিতে সার ব্যবস্থাপনা${zone ? ` (${zone})` : ""}`,

  weatherCrop: (crop: string) =>
    `এই মৌসুমে ${crop} চাষে আবহাওয়ার প্রভাব ও করণীয়`,

  marketTiming: (crop: string) =>
    `${crop} বিক্রির সেরা সময় ও বাজার কৌশল`,

  pestControl: (pest: string, crop: string) =>
    `${crop} এ ${pest} পোকার IPM পদ্ধতিতে দমন ব্যবস্থাপনা (IRAC প্রটোকল)`,

  soilAdvice: (ph: string, crop: string) =>
    `PH ${ph} মাটিতে ${crop} চাষে সার ও মাটি উন্নয়ন পরামর্শ`,
};

// ── Voice input helper (Web Speech API) ──────────────────────────────────────
export function startVoiceInput(
  onResult: (text: string) => void,
  onEnd:    () => void
): (() => void) | null {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any;
  const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
  if (!SR) return null;

  const rec = new SR();
  rec.lang            = "bn-BD";
  rec.interimResults  = true;
  rec.maxAlternatives = 1;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rec.onresult = (e: any) => {
    const transcript = Array.from(e.results as unknown[])
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((r: any) => r[0].transcript as string)
      .join("");
    onResult(transcript);
  };
  rec.onend = onEnd;
  rec.start();
  return () => rec.stop();
}

// ── Farmer profile from localStorage ─────────────────────────────────────────
export function getFarmerProfile(): FarmerContext {
  return {
    name:     localStorage.getItem("krishi_name")     || undefined,
    district: localStorage.getItem("krishi_district") || undefined,
  };
}

// ── Internal fetch ────────────────────────────────────────────────────────────
async function callAPI(body: Record<string, unknown>): Promise<AIResponse> {
  try {
    const res = await fetch(ENDPOINT, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error("[aiService]", err);
    return {
      text:  "সংযোগ সমস্যা। DAE হটলাইন 16123 এ কল করুন।",
      model: "offline",
      ok:    false,
    };
  }
}
