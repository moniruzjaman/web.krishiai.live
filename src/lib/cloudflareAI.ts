/**
 * Cloudflare Workers AI — Shared Utility Module
 *
 * Provides a unified interface for calling Cloudflare Workers AI REST API.
 * Used as a primary or fallback AI provider across KrishiAI API routes.
 *
 * Account ID: 4a2230e358905ad039e6ee0014fc9ce1
 * Default model: @cf/meta/llama-3-8b-instruct
 *
 * Usage:
 *   import { callCloudflareAI } from "@/lib/cloudflareAI";
 *   const reply = await callCloudflareAI(messages, { temperature: 0.7 });
 */

// ── Configuration ─────────────────────────────────────────────────────────────
const CF_ACCOUNT_ID = process.env.CF_ACCOUNT_ID || "";
const CF_API_TOKEN = process.env.CF_API_TOKEN || "";
const CF_BASE_URL = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/ai/run`;

// Available models
export const CF_MODELS = {
  /** Fast, capable general-purpose model — good for chat, analysis, summaries */
  LLAMA3_8B: "@cf/meta/llama-3-8b-instruct",
  /** Larger model for more complex reasoning — if available on account */
  LLAMA3_70B: "@cf/meta/llama-3-70b-instruct",
  /** Mistral model for structured output */
  MISTRAL_7B: "@cf/mistral/mistral-7b-instruct",
} as const;

export type CFModel = (typeof CF_MODELS)[keyof typeof CF_MODELS];

// ── Types ─────────────────────────────────────────────────────────────────────
export interface CFMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface CFCallOptions {
  /** Model to use (default: llama-3-8b-instruct) */
  model?: CFModel;
  /** Temperature 0-2 (default: 0.7) */
  temperature?: number;
  /** Max tokens to generate (default: 1000) */
  maxTokens?: number;
  /** Timeout in milliseconds (default: 15000) */
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

// ── Main Function ─────────────────────────────────────────────────────────────
/**
 * Call Cloudflare Workers AI with a list of messages.
 * Returns a structured response or throws on error.
 */
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

  const body = {
    messages,
    temperature,
    max_tokens: maxTokens,
  };

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

    const result = await response.json();

    if (!response.ok) {
      const errMsg = result?.errors?.[0]?.message || result?.error?.message || `CF AI HTTP ${response.status}`;
      throw new Error(errMsg);
    }

    // Cloudflare Workers AI returns: { result: { response: "..." }, success: true, ... }
    // Or for chat completions: { result: { choices: [{ message: { content: "..." } }] } }
    let reply = "";

    if (result?.result?.response) {
      // Old-style response format
      reply = result.result.response;
    } else if (result?.result?.choices?.[0]?.message?.content) {
      // Chat completion format
      reply = result.result.choices[0].message.content;
    } else if (typeof result?.result === "string") {
      reply = result.result;
    } else if (result?.response) {
      reply = result.response;
    } else {
      // Try to extract any text content
      reply = result?.result?.response || result?.response || "";
    }

    return {
      ok: true,
      reply,
      model,
      provider: "Cloudflare Workers AI",
      usage: result?.result?.usage || result?.usage,
    };
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Cloudflare AI request timed out");
    }
    throw error;
  }
}

/**
 * Convenience: Call CF AI with system + user prompt.
 * Returns just the reply string, or null on error.
 */
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

/**
 * Convenience: Call CF AI with full message history (for chat).
 * Returns the full CFResponse or null on error.
 */
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
