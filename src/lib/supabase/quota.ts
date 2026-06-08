import { createClient } from './server'

export interface QuotaStatus {
  feature: string
  used: number
  dailyLimit: number
  monthlyLimit: number
  remaining: number
  isExceeded: boolean
}

export async function checkQuota(
  feature: string,
  userId?: string
): Promise<{ allowed: boolean; status: QuotaStatus }> {
  const supabase = await createClient()
  
  // Anonymous users get reduced free tier
  if (!userId) {
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
    .eq('id', userId)
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
}

export async function logUsage(
  feature: string,
  provider: string,
  model: string,
  tokensUsed: number = 0,
  userId?: string
): Promise<void> {
  if (!userId) return
  
  const supabase = await createClient()
  await supabase.from('usage_logs').insert({
    user_id: userId,
    feature,
    provider,
    model,
    tokens_used: tokensUsed
  })
}
