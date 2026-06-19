import { createClient } from './server'
import {
  checkRateLimit,
  WINDOW_MS,
  ANON_CHAT_RPM,
  type RateLimitResult,
} from '../rateLimit'

export interface QuotaStatus {
  feature: string
  used: number
  dailyLimit: number
  monthlyLimit: number
  remaining: number
  isExceeded: boolean
}

export interface QuotaCheckResult {
  allowed: boolean
  status: QuotaStatus
  rateLimited?: RateLimitResult
}

export async function checkQuota(
  feature: string,
  userId?: string,
  clientIp?: string,
): Promise<QuotaCheckResult> {
  if (!userId) {
    const rpm = feature === 'diagnose'
      ? Number(process.env.RATE_LIMIT_PER_MINUTE_DIAGNOSE ?? 8)
      : feature === 'chat'
        ? ANON_CHAT_RPM
        : 12;

    const ip = clientIp || 'unknown-ip';
    const rl = checkRateLimit({
      key: ip,
      namespace: `anon:${feature}`,
      maxRequests: rpm,
      windowMs: WINDOW_MS,
    });

    if (!rl.allowed) {
      return {
        allowed: false,
        status: {
          feature,
          used: rl.current,
          dailyLimit: rpm,
          monthlyLimit: rpm * 30,
          remaining: 0,
          isExceeded: true,
        },
        rateLimited: rl,
      };
    }

    return {
      allowed: true,
      status: {
        feature,
        used: rl.current,
        dailyLimit: rpm,
        monthlyLimit: rpm * 30,
        remaining: rl.remaining,
        isExceeded: false,
      },
    };
  }

  try {
    const supabase = await createClient()

    const tier = await getCachedTier(userId, supabase)
    const limits = await getCachedLimits(userId, tier, feature)

    const dailyLimit = limits.daily_limit ?? 10
    const monthlyLimit = limits.monthly_limit ?? 100

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const { count: dailyUsed } = await supabase
      .from('usage_logs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('feature', feature)
      .gte('created_at', today.toISOString())

    const used = dailyUsed || 0
    const remaining = Math.max(0, dailyLimit - used)
    const isExceeded = used >= dailyLimit

    return {
      allowed: !isExceeded,
      status: { feature, used, dailyLimit, monthlyLimit, remaining, isExceeded }
    }
  } catch (e) {
    console.warn('[quota] Supabase check failed, allowing:', e)
    return {
      allowed: true,
      status: {
        feature,
        used: 0,
        dailyLimit: 10,
        monthlyLimit: 100,
        remaining: 10,
        isExceeded: false,
      },
    }
  }
}

export async function logUsage(
  feature: string,
  provider: string,
  model: string,
  tokensUsed: number = 0,
  userId?: string
): Promise<void> {
  if (!userId) return

  try {
    const supabase = await createClient()
    await supabase.from('usage_logs').insert({
      user_id: userId,
      feature,
      provider,
      model,
      tokens_used: tokensUsed
    })
  } catch (e) {
    console.warn('[quota] logUsage failed:', e)
  }
}

interface CachedTier { tier: string; expiresAt: number }
interface CachedLimits { daily_limit: number | null; monthly_limit: number | null; expiresAt: number }

const tierCache = new Map<string, CachedTier>()
const limitsCache = new Map<string, CachedLimits>()
const CACHE_TTL_MS = 5 * 60_000

async function getCachedTier(userId: string, supabase: Awaited<ReturnType<typeof createClient>>): Promise<string> {
  const cached = tierCache.get(userId);
  if (cached && Date.now() < cached.expiresAt) return cached.tier;

  let tier = 'free';
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('quota_tier')
      .eq('id', userId)
      .single();
    tier = profile?.quota_tier || 'free';
  } catch {
  }

  tierCache.set(userId, { tier, expiresAt: Date.now() + CACHE_TTL_MS });
  return tier;
}

async function getCachedLimits(
  userId: string,
  tier: string,
  feature: string,
): Promise<{ daily_limit: number | null; monthly_limit: number | null }> {
  const cacheKey = `${userId}:${tier}:${feature}`;
  const cached = limitsCache.get(cacheKey);
  if (cached && Date.now() < cached.expiresAt) {
    return { daily_limit: cached.daily_limit, monthly_limit: cached.monthly_limit };
  }

  let result = { daily_limit: null as number | null, monthly_limit: null as number | null };
  try {
    const supabase = await createClient();
    const { data: limit } = await supabase
      .from('quota_limits')
      .select('daily_limit, monthly_limit')
      .eq('tier', tier)
      .eq('feature', feature)
      .single();
    if (limit) {
      result = { daily_limit: limit.daily_limit, monthly_limit: limit.monthly_limit };
    }
  } catch {
  }

  limitsCache.set(cacheKey, {
    ...result,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
  return result;
}
