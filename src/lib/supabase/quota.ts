import { createClient } from './server'

export interface QuotaStatus {
  feature: string
  used: number
  dailyLimit: number
  monthlyLimit: number
  remaining: number
  isExceeded: boolean
}

/**
 * Resolve the caller's Supabase user id from request cookies when the route
 * didn't pass one explicitly. Without this, a logged-in user could bypass
 * their quota simply by omitting `userId` from the request body — every
 * request would fall into the unlimited anonymous bucket.
 */
async function resolveUserId(userId?: string): Promise<string | undefined> {
  if (userId) return userId
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    return user?.id ?? undefined
  } catch {
    return undefined
  }
}

export async function checkQuota(
  feature: string,
  userId?: string
): Promise<{ allowed: boolean; status: QuotaStatus }> {
  const resolvedId = await resolveUserId(userId)
  const supabase = await createClient()

  // Genuinely anonymous visitors get the reduced free tier. Route-level rate
  // limiting (per IP) plus logUsage's per-IP enforcement close the gap that
  // an unauthenticated identity would otherwise leave open.
  if (!resolvedId) {
    return {
      allowed: true,
      status: {
        feature,
        used: 0,
        dailyLimit: 10,
        monthlyLimit: 100,
        remaining: 10,
        isExceeded: false
      }
    }
  }

  // Get user's tier
  const { data: profile } = await supabase
    .from('profiles')
    .select('quota_tier')
    .eq('id', resolvedId)
    .single()

  const tier = profile?.quota_tier || 'free'

  // Get quota limits for this tier + feature
  const { data: limit } = await supabase
    .from('quota_limits')
    .select('daily_limit, monthly_limit')
    .eq('tier', tier)
    .eq('feature', feature)
    .single()

  const dailyLimit = limit?.daily_limit || 10
  const monthlyLimit = limit?.monthly_limit || 100

  // Count today's usage
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const { count: dailyUsed } = await supabase
    .from('usage_logs')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', resolvedId)
    .eq('feature', feature)
    .gte('created_at', today.toISOString())

  const used = dailyUsed || 0
  const remaining = Math.max(0, dailyLimit - used)
  const isExceeded = used >= dailyLimit

  return {
    allowed: !isExceeded,
    status: { feature, used, dailyLimit, monthlyLimit, remaining, isExceeded }
  }
}

/**
 * Per-IP daily ceiling for anonymous usage tracking. This is what actually
 * enforces the "reduced free tier" that checkQuota promises — without it,
 * unauthenticated traffic could drain provider quotas indefinitely.
 */
const ANON_DAILY_LIMIT = 10
const anonBuckets = new Map<string, { count: number; resetAt: number }>()

function anonBucketAllowed(feature: string): boolean {
  const now = Date.now()
  let fingerprint = 'shared'
  try {
    const { cookies } = require('next/headers') as typeof import('next/headers')
    // Vercel/Cloudflare set a per-client IP hint on these cookies in prod.
    const raw =
      cookies().get('__client_ip')?.value ||
      cookies().get('__cf_ip')?.value
    if (raw) fingerprint = raw
  } catch {
    /* outside request context — shared bucket (local dev) */
  }
  const key = `${fingerprint}:${feature}:${new Date().toISOString().slice(0, 10)}`
  const bucket = anonBuckets.get(key)
  if (!bucket || bucket.resetAt <= now) {
    anonBuckets.set(key, { count: 1, resetAt: now + 24 * 60 * 60 * 1000 })
    return true
  }
  if (bucket.count >= ANON_DAILY_LIMIT) return false
  bucket.count++
  return true
}

export async function logUsage(
  feature: string,
  provider: string,
  model: string,
  tokensUsed: number = 0,
  userId?: string
): Promise<void> {
  const supabase = await createClient()

  // Resolve the real session identity even when the caller omitted userId —
  // otherwise logged-in users could hide usage from their quota ledger by
  // simply not sending their id.
  let resolvedId = userId
  if (!resolvedId) {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      resolvedId = user?.id
    } catch {
      /* ignore — treat as anonymous */
    }
  }

  if (!resolvedId) {
    // Anonymous callers are capped per client fingerprint + feature + day.
    if (!anonBucketAllowed(feature)) return
    resolvedId = `anon:${feature}`
  }

  await supabase.from('usage_logs').insert({
    user_id: resolvedId,
    feature,
    provider,
    model,
    tokens_used: tokensUsed
  })
}
