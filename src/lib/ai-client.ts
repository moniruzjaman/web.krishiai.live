import {
  isInCooldown,
  markSuccess,
  markFailure,
  markRateLimited,
  parseRetryAfter,
  cooldownRemainingMs,
} from './providerCooldown';
import { cacheGet, cacheSet, buildCacheKey } from './requestCache';

export interface AIMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface AICallOptions {
  temperature?: number
  maxTokens?: number
  feature: string
  userId?: string
  noCache?: boolean
}

export interface AIResponse {
  text: string
  provider: string
  model: string
  tokensUsed: number
  quotaRemaining: number
  cached?: boolean
}

async function callGemini(messages: AIMessage[], options: AICallOptions): Promise<AIResponse | null> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return null

  if (isInCooldown('gemini')) {
    console.warn(`[ai] Gemini skipped — cooldown ${cooldownRemainingMs('gemini')}ms remaining`)
    return null
  }

  try {
    const systemMsg = messages.find(m => m.role === 'system')
    const userMsgs = messages.filter(m => m.role !== 'system')

    const contents = userMsgs.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }))

    const res = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify({
          contents,
          systemInstruction: systemMsg ? { parts: [{ text: systemMsg.content }] } : undefined,
          generationConfig: {
            temperature: options.temperature ?? 0.7,
            maxOutputTokens: options.maxTokens ?? 1024,
          }
        })
      }
    )

    if (res.status === 429) {
      const retryAfter = parseRetryAfter(res.headers.get('retry-after'));
      markRateLimited('gemini', { retryAfterSeconds: retryAfter, status: 429 });
      console.warn(`[ai] Gemini 429 — cooldown applied (retry-after=${retryAfter ?? 'auto'}s)`);
      return null;
    }

    if (res.status >= 500) {
      markFailure('gemini', { status: res.status, reason: `upstream ${res.status}` });
      console.warn(`[ai] Gemini upstream ${res.status}`);
      return null;
    }

    if (!res.ok) {
      markFailure('gemini', { status: res.status, reason: `http ${res.status}` });
      console.warn('[ai] Gemini failed:', res.status);
      return null;
    }

    const data = await res.json()
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || ''

    if (!text) {
      markFailure('gemini', { status: res.status, reason: 'empty response' });
      return null;
    }

    markSuccess('gemini');

    return {
      text,
      provider: 'Gemini',
      model: 'gemini-2.5-flash',
      tokensUsed: data?.usageMetadata?.totalTokenCount || 0,
      quotaRemaining: 0
    }
  } catch (e: any) {
    markFailure('gemini', { status: -1, reason: e?.message ?? 'network error' });
    console.warn('[ai] Gemini error:', e?.message ?? e);
    return null
  }
}

async function callOpenRouter(messages: AIMessage[], options: AICallOptions): Promise<AIResponse | null> {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) return null

  if (isInCooldown('openrouter')) {
    console.warn(`[ai] OpenRouter skipped — cooldown ${cooldownRemainingMs('openrouter')}ms remaining`)
    return null;
  }

  try {
    const model = process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini';

    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://web.krishiai.live',
        'X-Title': 'KrishiAI'
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 1024
      })
    })

    if (res.status === 429) {
      const retryAfter = parseRetryAfter(res.headers.get('retry-after'));
      markRateLimited('openrouter', { retryAfterSeconds: retryAfter, status: 429 });
      console.warn(`[ai] OpenRouter 429 — cooldown applied (retry-after=${retryAfter ?? 'auto'}s)`);
      return null;
    }

    if (res.status >= 500) {
      markFailure('openrouter', { status: res.status, reason: `upstream ${res.status}` });
      console.warn('[ai] OpenRouter upstream', res.status);
      return null;
    }

    if (!res.ok) {
      markFailure('openrouter', { status: res.status, reason: `http ${res.status}` });
      console.warn('[ai] OpenRouter failed:', res.status);
      return null;
    }

    const data = await res.json()
    const text = data?.choices?.[0]?.message?.content || ''

    if (!text) {
      markFailure('openrouter', { status: res.status, reason: 'empty response' });
      return null;
    }

    markSuccess('openrouter');

    return {
      text,
      provider: 'OpenRouter',
      model: data?.model || model,
      tokensUsed: data?.usage?.total_tokens || 0,
      quotaRemaining: 0
    }
  } catch (e: any) {
    markFailure('openrouter', { status: -1, reason: e?.message ?? 'network error' });
    console.warn('[ai] OpenRouter error:', e?.message ?? e);
    return null
  }
}

async function callGroq(messages: AIMessage[], options: AICallOptions): Promise<AIResponse | null> {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) return null

  if (isInCooldown('groq')) {
    console.warn(`[ai] Groq skipped — cooldown ${cooldownRemainingMs('groq')}ms remaining`)
    return null;
  }

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || 'llama-3.1-8b-instant',
        messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 1024
      })
    })

    if (res.status === 429) {
      const retryAfter = parseRetryAfter(res.headers.get('retry-after'));
      markRateLimited('groq', { retryAfterSeconds: retryAfter, status: 429 });
      console.warn(`[ai] Groq 429 — cooldown applied (retry-after=${retryAfter ?? 'auto'}s)`);
      return null;
    }

    if (res.status >= 500) {
      markFailure('groq', { status: res.status, reason: `upstream ${res.status}` });
      console.warn('[ai] Groq upstream', res.status);
      return null;
    }

    if (!res.ok) {
      markFailure('groq', { status: res.status, reason: `http ${res.status}` });
      console.warn('[ai] Groq failed:', res.status);
      return null;
    }

    const data = await res.json()
    const text = data?.choices?.[0]?.message?.content || ''

    if (!text) {
      markFailure('groq', { status: res.status, reason: 'empty response' });
      return null;
    }

    markSuccess('groq');

    return {
      text,
      provider: 'Groq',
      model: process.env.GROQ_MODEL || 'llama-3.1-8b-instant',
      tokensUsed: data?.usage?.total_tokens || 0,
      quotaRemaining: 0
    }
  } catch (e: any) {
    markFailure('groq', { status: -1, reason: e?.message ?? 'network error' });
    console.warn('[ai] Groq error:', e?.message ?? e);
    return null
  }
}

export async function callAI(
  messages: AIMessage[],
  options: AICallOptions
): Promise<AIResponse> {
  const cacheKey = options.noCache
    ? ''
    : buildCacheKey([options.feature, options.temperature ?? 0.7, options.maxTokens ?? 1024, messages]);

  if (cacheKey) {
    const cached = cacheGet<AIResponse>(cacheKey);
    if (cached) {
      return { ...cached, cached: true };
    }
  }

  let quotaResult = { allowed: true as boolean, status: { used: 0, dailyLimit: 10, monthlyLimit: 100, remaining: 10, isExceeded: false } }
  try {
    const { checkQuota } = await import('./supabase/quota')
    quotaResult = await checkQuota(options.feature, options.userId)

    if (!quotaResult.allowed) {
      return {
        text: `আপনার দৈনিক কোটা শেষ হয়ে গেছে (${quotaResult.status.used}/${quotaResult.status.dailyLimit})। আগামীকাল আবার চেষ্টা করুন।`,
        provider: 'quota-exceeded',
        model: 'none',
        tokensUsed: 0,
        quotaRemaining: 0
      }
    }
  } catch (e) {
    console.warn('[ai] Quota check failed, allowing request:', e)
  }

  const providers = [callGemini, callOpenRouter, callGroq]

  for (const provider of providers) {
    const result = await provider(messages, options)
    if (result) {
      try {
        const { logUsage } = await import('./supabase/quota')
        await logUsage(options.feature, result.provider, result.model, result.tokensUsed, options.userId)
      } catch { }
      result.quotaRemaining = quotaResult.status.remaining - 1

      if (cacheKey) cacheSet(cacheKey, result);

      return result
    }
  }

  const offlineText = getOfflineFallback(options.feature, messages)
  return {
    text: offlineText,
    provider: 'offline',
    model: 'none',
    tokensUsed: 0,
    quotaRemaining: quotaResult.status.remaining
  }
}

export async function aiChat(
  systemPrompt: string,
  userMessage: string,
  options: Partial<AICallOptions> = {}
): Promise<AIResponse> {
  return callAI(
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage }
    ],
    { feature: 'chat', temperature: 0.7, maxTokens: 1024, ...options }
  )
}

export async function aiChatFull(
  messages: AIMessage[],
  options: Partial<AICallOptions> = {}
): Promise<AIResponse> {
  return callAI(messages, { feature: 'chat', temperature: 0.7, maxTokens: 1024, ...options })
}

function getOfflineFallback(feature: string, messages: AIMessage[]): string {
  const _userMsg = messages.find(m => m.role === 'user')?.content || ''

  switch (feature) {
    case 'chat':
      return 'দুঃখিত, AI সহকারী এখন উপলব্ধ নয়। কিছুক্ষণ পর আবার চেষ্টা করুন। জরুরি প্রয়োজনে আপনার নিকটস্থ কৃষি সম্প্রসারণ অফিসে যোগাযোগ করুন।'
    case 'diagnose':
      return 'রোগ নির্ণয় সেবা সাময়িকভাবে অনুপলব্ধ। দয়া করে আপনার এলাকার কৃষি অফিসারের সাথে পরামর্শ করুন অথবা কিছুক্ষণ পর আবার চেষ্টা করুন।'
    case 'soil_analysis':
      return 'মাটি বিশ্লেষণ সেবা সাময়িকভাবে অনুপলব্ধ। আপনার নিকটস্থ মাটি পরীক্ষা কেন্দ্রে যোগাযোগ করুন।'
    case 'crop_database':
      return 'ফসল তথ্য সেবা সাময়িকভাবে অনুপলব্ধ। কিছুক্ষণ পর আবার চেষ্টা করুন।'
    case 'news_bulletin':
      return 'কৃষি বার্তা সেবা সাময়িকভাবে অনুপলব্ধ।'
    default:
      return 'সেবা সাময়িকভাবে অনুপলব্ধ। কিছুক্ষণ পর আবার চেষ্টা করুন।'
  }
}
