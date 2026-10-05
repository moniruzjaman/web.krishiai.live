/**
 * Hybrid-analysis consensus engine
 *
 * Parallel vision/text inference: Gemini + OpenRouter Qwen-VL.
 * Agreement >= 80% merges results; otherwise Groq is the tiebreaker.
 * Used by diagnose / soil_analysis / crop_database when offline confidence is low.
 */

export interface HybridMessage {
  role: string;
  content: unknown;
}

export interface HybridAnalysisInput {
  messages: HybridMessage[];
  imageAttached: boolean;
  systemPrompt: string;
  timeoutMs?: number;
}

export interface HybridAnalysisResult {
  text: string;
  provider: string;
  structured: Record<string, unknown> | null;
  agreement: number;
  consensus: boolean;
  sources: string[];
}

interface ProviderResult {
  text: string;
  provider: string;
  structured: Record<string, unknown> | null;
}

const DEFAULT_TIMEOUT_MS = 8_000;
const AGREEMENT_THRESHOLD = 0.8;
const GEMINI_MODEL = "gemini-3.5-flash";
const OPENROUTER_VISION = "qwen/qwen2.5-vl-72b-instruct:free";
const OPENROUTER_TEXT = "qwen/qwen2.5-72b-instruct:free";
const GROQ_MODEL = "llama-3.1-8b-instant";

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("hybrid timeout")), ms),
    ),
  ]);
}

export function extractStructuredJson(text: string): Record<string, unknown> | null {
  try {
    const marker = "---JSON_SUMMARY---";
    const endMarker = "---END_JSON---";
    const startIdx = text.indexOf(marker);
    const endIdx = text.indexOf(endMarker);
    if (startIdx === -1 || endIdx === -1 || endIdx <= startIdx) {
      const fence = text.match(/```json\s*([\s\S]*?)```/i);
      if (fence) return JSON.parse(fence[1].trim()) as Record<string, unknown>;
      return null;
    }
    return JSON.parse(text.slice(startIdx + marker.length, endIdx).trim()) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function normalizeName(value: unknown): string {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9\u0980-\u09FF]+/g, " ")
    .trim();
}

function tokenSet(value: unknown): Set<string> {
  return new Set(normalizeName(value).split(" ").filter((t) => t.length > 2));
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 1;
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0;
  for (const t of a) if (b.has(t)) inter += 1;
  return inter / (a.size + b.size - inter);
}

function chemicalOverlap(a: Record<string, unknown> | null, b: Record<string, unknown> | null): number {
  const namesA = new Set(
    ((a?.chemical_options as Array<{ name_bn?: string; trade_name?: string }> | undefined) || [])
      .flatMap((c) => [normalizeName(c.name_bn), normalizeName(c.trade_name)])
      .filter(Boolean),
  );
  const namesB = new Set(
    ((b?.chemical_options as Array<{ name_bn?: string; trade_name?: string }> | undefined) || [])
      .flatMap((c) => [normalizeName(c.name_bn), normalizeName(c.trade_name)])
      .filter(Boolean),
  );
  return jaccard(namesA, namesB);
}

export function scoreAgreement(
  a: Record<string, unknown> | null,
  b: Record<string, unknown> | null,
): number {
  if (!a && !b) return 0;
  if (!a || !b) return 0.55;

  const nameScore = Math.max(
    jaccard(tokenSet(a.disease_name), tokenSet(b.disease_name)),
    jaccard(tokenSet(a.disease_name_bn), tokenSet(b.disease_name_bn)),
  );
  const causeScore = normalizeName(a.cause_type) === normalizeName(b.cause_type) ? 1 : 0;
  const bioticScore = normalizeName(a.biotic_abiotic) === normalizeName(b.biotic_abiotic) ? 1 : 0;
  const chemScore = chemicalOverlap(a, b);

  return Number((nameScore * 0.4 + causeScore * 0.25 + bioticScore * 0.15 + chemScore * 0.2).toFixed(3));
}

function mergeStructured(
  a: Record<string, unknown> | null,
  b: Record<string, unknown> | null,
  agreement: number,
): Record<string, unknown> | null {
  if (!a) return b;
  if (!b) return a;
  const confA = Number(a.confidence_pct) || 0;
  const confB = Number(b.confidence_pct) || 0;
  const primary = confA >= confB ? a : b;
  const secondary = confA >= confB ? b : a;
  const recs = Array.from(
    new Set([
      ...((primary.key_recommendations as string[]) || []),
      ...((secondary.key_recommendations as string[]) || []),
    ]),
  ).slice(0, 6);
  const blended = Math.round((confA + confB) / 2 * (0.85 + agreement * 0.15));
  return {
    ...primary,
    confidence_pct: Math.min(95, blended),
    key_recommendations: recs.length ? recs : primary.key_recommendations,
  };
}

function toGeminiParts(messages: HybridMessage[], withVision: boolean): unknown[] {
  const last = messages[messages.length - 1];
  const content = Array.isArray(last?.content)
    ? last.content
    : [{ type: "text", text: typeof last?.content === "string" ? last.content : "" }];
  const parts: unknown[] = [];
  for (const block of content as Array<Record<string, unknown>>) {
    const source = block.source as { type?: string; media_type?: string; data?: string } | undefined;
    if (block.type === "image" && source?.type === "base64" && withVision) {
      parts.push({ inlineData: { mimeType: source.media_type || "image/jpeg", data: source.data } });
    } else if (block.type === "text") {
      parts.push({ text: block.text });
    }
  }
  return parts;
}

function toOpenAIMessages(messages: HybridMessage[], systemPrompt: string, withVision: boolean) {
  const mapped = messages.map((m) => {
    if (typeof m.content === "string") return { role: m.role, content: m.content };
    if (Array.isArray(m.content)) {
      return {
        role: m.role,
        content: (m.content as Array<Record<string, unknown>>)
          .map((b) => {
            if (b.type === "text") return { type: "text", text: b.text };
            const source = b.source as { type?: string; media_type?: string; data?: string } | undefined;
            if (b.type === "image" && source?.type === "base64" && withVision) {
              return {
                type: "image_url",
                image_url: { url: `data:${source.media_type || "image/jpeg"};base64,${source.data}` },
              };
            }
            return null;
          })
          .filter(Boolean),
      };
    }
    return { role: m.role, content: "" };
  });
  return [{ role: "system", content: systemPrompt }, ...mapped];
}

async function callGemini(
  messages: HybridMessage[],
  systemPrompt: string,
  withVision: boolean,
): Promise<ProviderResult | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const parts = toGeminiParts(messages, withVision);
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
    {
      method: "POST",
      headers: { "x-goog-api-key": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: "user", parts }],
        generationConfig: { maxOutputTokens: 2500, temperature: 0.3 },
      }),
    },
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message || `Gemini HTTP ${res.status}`);
  const text =
    data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text || "").join("\n") || "";
  if (!text) return null;
  return {
    text,
    provider: withVision ? "Gemini 3.5 Flash (vision)" : "Gemini 3.5 Flash",
    structured: extractStructuredJson(text),
  };
}

async function callOpenRouter(
  messages: HybridMessage[],
  systemPrompt: string,
  withVision: boolean,
): Promise<ProviderResult | null> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return null;

  const modelId = withVision ? OPENROUTER_VISION : OPENROUTER_TEXT;
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": "https://krishiai.live",
      "X-Title": "KrishiAI Hybrid Analysis",
    },
    body: JSON.stringify({
      model: modelId,
      max_tokens: 2500,
      temperature: 0.3,
      messages: toOpenAIMessages(messages, systemPrompt, withVision),
    }),
  });
  const data = await res.json();
  if (!res.ok || data.error) throw new Error(data?.error?.message || `OpenRouter HTTP ${res.status}`);
  const text = data?.choices?.[0]?.message?.content || "";
  if (!text) return null;
  const resolved = (data?.model || modelId).split("/").pop()?.replace(":free", "") || modelId;
  return { text, provider: `OpenRouter / ${resolved}`, structured: extractStructuredJson(text) };
}

async function callGroqTiebreaker(
  systemPrompt: string,
  gemini: ProviderResult,
  openrouter: ProviderResult,
): Promise<ProviderResult | null> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;

  const payload = {
    gemini: gemini.structured || { raw: gemini.text.slice(0, 1200) },
    openrouter: openrouter.structured || { raw: openrouter.text.slice(0, 1200) },
  };

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      temperature: 0.2,
      max_tokens: 1800,
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content:
            "Two models disagreed on a crop diagnosis. Pick the more plausible result for Bangladesh field conditions, then output the mandatory dual-language CABI format including JSON_SUMMARY.\n\n" +
            JSON.stringify(payload),
        },
      ],
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message || `Groq HTTP ${res.status}`);
  const text = data?.choices?.[0]?.message?.content || "";
  if (!text) return null;
  return { text, provider: "Groq tiebreaker", structured: extractStructuredJson(text) };
}

function settledResult(result: PromiseSettledResult<ProviderResult | null>): ProviderResult | null {
  if (result.status !== "fulfilled") return null;
  return result.value;
}

export async function runHybridAnalysis(input: HybridAnalysisInput): Promise<HybridAnalysisResult | null> {
  const timeoutMs = input.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const { messages, imageAttached, systemPrompt } = input;

  const [geminiSettled, openrouterSettled] = await Promise.allSettled([
    withTimeout(callGemini(messages, systemPrompt, imageAttached), timeoutMs),
    withTimeout(callOpenRouter(messages, systemPrompt, imageAttached), timeoutMs),
  ]);

  const gemini = settledResult(geminiSettled);
  const openrouter = settledResult(openrouterSettled);

  if (!gemini && !openrouter) return null;

  if (gemini && !openrouter) {
    return {
      text: gemini.text,
      provider: gemini.provider,
      structured: gemini.structured,
      agreement: 0.65,
      consensus: false,
      sources: [gemini.provider],
    };
  }

  if (openrouter && !gemini) {
    return {
      text: openrouter.text,
      provider: openrouter.provider,
      structured: openrouter.structured,
      agreement: 0.65,
      consensus: false,
      sources: [openrouter.provider],
    };
  }

  const agreement = scoreAgreement(gemini!.structured, openrouter!.structured);

  if (agreement >= AGREEMENT_THRESHOLD) {
    const merged = mergeStructured(gemini!.structured, openrouter!.structured, agreement);
    return {
      text: gemini!.text,
      provider: `Hybrid consensus (${gemini!.provider} + ${openrouter!.provider})`,
      structured: merged,
      agreement,
      consensus: true,
      sources: [gemini!.provider, openrouter!.provider],
    };
  }

  let tie: ProviderResult | null = null;
  try {
    tie = await withTimeout(callGroqTiebreaker(systemPrompt, gemini!, openrouter!), Math.min(timeoutMs, 5000));
  } catch {
    tie = null;
  }

  if (tie) {
    return {
      text: tie.text,
      provider: `Hybrid + ${tie.provider}`,
      structured: tie.structured || mergeStructured(gemini!.structured, openrouter!.structured, agreement),
      agreement,
      consensus: false,
      sources: [gemini!.provider, openrouter!.provider, tie.provider],
    };
  }

  const fallback = (Number(gemini!.structured?.confidence_pct) || 0) >= (Number(openrouter!.structured?.confidence_pct) || 0)
    ? gemini!
    : openrouter!;

  return {
    text: fallback.text,
    provider: `${fallback.provider} (no consensus)`,
    structured: fallback.structured,
    agreement,
    consensus: false,
    sources: [gemini!.provider, openrouter!.provider],
  };
}
