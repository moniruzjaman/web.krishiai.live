/**
 * Cloudflare Workers AI — Shared Utility Module
 *
 * Calls Cloudflare Workers AI REST API directly from Next.js API routes.
 * No edge gateway needed — Vercel handles security, routing, and rate limiting.
 *
 * Default model: @cf/meta/llama-3-8b-instruct
 *
 * Usage:
 *   import { callCloudflareAI } from "@/lib/cloudflareAI";
 *   const reply = await callCloudflareAI(messages, { temperature: 0.7 });
 */

const CF_ACCOUNT_ID = process.env.CF_ACCOUNT_ID || "";
const CF_API_TOKEN = process.env.CF_API_TOKEN || "";
const CF_BASE_URL = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/ai/run`;

export const CF_MODELS = {
  LLAMA3_8B: "@cf/meta/llama-3-8b-instruct",
  LLAMA3_70B: "@cf/meta/llama-3-70b-instruct",
  MISTRAL_7B: "@cf/mistral/mistral-7b-instruct",
} as const;

export type CFModel = (typeof CF_MODELS)[keyof typeof CF_MODELS];

export interface CFMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface CFCallOptions {
  model?: CFModel;
  temperature?: number;
  maxTokens?: number;
  timeout?: number;
}

export interface CFResponse {
  ok: boolean;
  reply: string;
  model: string;
  provider: string;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
}

export async function callCloudflareAI(
  messages: CFMessage[],
  options: CFCallOptions = {}
): Promise<CFResponse> {
  const {
    model = CF_MODELS.LLAMA3_8B,
    temperature = 0.7,
    maxTokens = 1000,
    timeout = 15000,
  } = options;

  if (!CF_ACCOUNT_ID || !CF_API_TOKEN) {
    throw new Error("Cloudflare AI not configured: set CF_ACCOUNT_ID and CF_API_TOKEN env vars");
  }

  const url = `${CF_BASE_URL}/${model}`;
  const body = { messages, temperature, max_tokens: maxTokens };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${CF_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const result = await response.json() as Record<string, unknown>;

    if (!response.ok) {
      const errors = result?.errors as Array<{ message?: string }> | undefined;
      const error = result?.error as { message?: string } | undefined;
      const errMsg = errors?.[0]?.message || error?.message || `CF AI HTTP ${response.status}`;
      throw new Error(errMsg);
    }

    let reply = "";
    const r = result?.result as Record<string, unknown> | undefined;

    if (r?.response && typeof r.response === "string") {
      reply = r.response;
    } else if (r?.choices && Array.isArray(r.choices)) {
      const choice = r.choices[0] as { message?: { content?: string } } | undefined;
      reply = choice?.message?.content || "";
    } else if (typeof result?.result === "string") {
      reply = result.result as string;
    } else if (result?.response && typeof result.response === "string") {
      reply = result.response;
    }

    return {
      ok: true,
      reply,
      model,
      provider: "Cloudflare Workers AI",
      usage: (r?.usage || result?.usage) as CFResponse["usage"],
    };
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Cloudflare AI request timed out");
    }
    throw error;
  }
}

export async function cfAIChat(
  systemPrompt: string,
  userPrompt: string,
  options: CFCallOptions = {}
): Promise<string | null> {
  try {
    const result = await callCloudflareAI(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      options
    );
    return result.reply || null;
  } catch (e) {
    console.warn("[cfAIChat] Cloudflare AI failed:", e instanceof Error ? e.message : String(e));
    return null;
  }
}

export async function cfAIChatFull(
  messages: CFMessage[],
  options: CFCallOptions = {}
): Promise<CFResponse | null> {
  try {
    return await callCloudflareAI(messages, options);
  } catch (e) {
    console.warn("[cfAIChatFull] Cloudflare AI failed:", e instanceof Error ? e.message : String(e));
    return null;
  }
}
