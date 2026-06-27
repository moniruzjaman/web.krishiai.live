/**
 * Quota-Aware AI Client — Vercel + Supabase Architecture
 *
 * Provider waterfall: Gemini → OpenRouter → Groq → Offline fallback
 * Each call checks Supabase quota before proceeding.
 * Free platform — no user charges, just soft limits.
 */

export interface AIMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface AICallOptions {
  temperature?: number
  maxTokens?: number
  feature: string // 'chat' | 'diagnose' | 'soil_analysis' | 'crop_database' | 'news_bulletin'
  userId?: string
}

export interface AIResponse {
  text: string
  provider: string
  model: string
  tokensUsed: number
  quotaRemaining: number
}

// ── Provider implementations ─────────────────────────────────────────────────

async function callGemini(messages: AIMessage[], options: AICallOptions): Promise<AIResponse | null> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return null

  try {
    const systemMsg = messages.find(m => m.role === 'system')
    const userMsgs = messages.filter(m => m.role !== 'system')
    
    const contents = userMsgs.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }))

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

    if (!res.ok) {
      console.warn('[ai] Gemini failed:', res.status)
      return null
    }

    const data = await res.json()
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || ''
    
    if (!text) return null

    return {
      text,
      provider: 'Gemini',
      model: 'gemini-3.5-flash',
      tokensUsed: data?.usageMetadata?.totalTokenCount || 0,
      quotaRemaining: 0 // filled by caller
    }
  } catch (e) {
    console.warn('[ai] Gemini error:', e)
    return null
  }
}

async function callOpenRouter(messages: AIMessage[], options: AICallOptions): Promise<AIResponse | null> {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) return null

  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://web.krishiai.live',
        'X-Title': 'KrishiAI'
      },
      body: JSON.stringify({
        model: 'google/gemini-3.5-flash-preview-05-20',
        messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 1024
      })
    })

    if (!res.ok) {
      console.warn('[ai] OpenRouter failed:', res.status)
      return null
    }

    const data = await res.json()
    const text = data?.choices?.[0]?.message?.content || ''
    
    if (!text) return null

    return {
      text,
      provider: 'OpenRouter',
      model: 'google/gemini-3.5-flash-preview-05-20',
      tokensUsed: data?.usage?.total_tokens || 0,
      quotaRemaining: 0
    }
  } catch (e) {
    console.warn('[ai] OpenRouter error:', e)
    return null
  }
}

async function callGroq(messages: AIMessage[], options: AICallOptions): Promise<AIResponse | null> {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) return null

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 1024
      })
    })

    if (!res.ok) {
      console.warn('[ai] Groq failed:', res.status)
      return null
    }

    const data = await res.json()
    const text = data?.choices?.[0]?.message?.content || ''
    
    if (!text) return null

    return {
      text,
      provider: 'Groq',
      model: 'llama-3.1-8b-instant',
      tokensUsed: data?.usage?.total_tokens || 0,
      quotaRemaining: 0
    }
  } catch (e) {
    console.warn('[ai] Groq error:', e)
    return null
  }
}

// ── Main AI Call with Quota + Fallback ───────────────────────────────────────

export async function callAI(
  messages: AIMessage[],
  options: AICallOptions
): Promise<AIResponse> {
  // Check quota — wrap in try/catch to prevent Supabase errors from crashing
  let quotaResult = { allowed: true as boolean, status: { used: 0, dailyLimit: 10, monthlyLimit: 100, remaining: 10, isExceeded: false } }
  try {
    const { checkQuota, logUsage } = await import('./supabase/quota')
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

  // Provider waterfall: Gemini → OpenRouter → Groq → Offline
  const providers = [callGemini, callOpenRouter, callGroq]

  for (const provider of providers) {
    const result = await provider(messages, options)
    if (result) {
      // Log successful usage — best effort
      try {
        const { logUsage } = await import('./supabase/quota')
        await logUsage(options.feature, result.provider, result.model, result.tokensUsed, options.userId)
      } catch { /* ignore quota logging errors */ }
      result.quotaRemaining = quotaResult.status.remaining - 1
      return result
    }
  }

  // All providers failed — offline fallback
  return {
    text: getOfflineFallback(options.feature, messages),
    provider: 'offline',
    model: 'none',
    tokensUsed: 0,
    quotaRemaining: quotaResult.status.remaining
  }
}

// ── Convenience wrappers ─────────────────────────────────────────────────────

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

// ── Offline Fallback ─────────────────────────────────────────────────────────

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
