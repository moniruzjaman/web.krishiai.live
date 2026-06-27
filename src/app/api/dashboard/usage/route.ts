/**
 * /api/dashboard/usage — Usage Statistics for OpenRouter Dashboard
 *
 * Returns aggregated token usage, feature breakdown, and quota info.
 * Pulls from Supabase usage_logs when available, otherwise returns
 * in-memory orchestration stats.
 */

import { NextRequest } from 'next/server'
import { handleOptions, corsNextResponse } from '@/lib/cors'
import { getOrchestrationStats } from '@/lib/openrouter'

export async function OPTIONS(request: NextRequest) {
  return handleOptions(request.headers.get('origin'), ['GET'])
}

export async function GET(request: NextRequest) {
  const origin = request.headers.get('origin')
  const { searchParams } = new URL(request.url)
  const period = searchParams.get('period') || 'today' // today | week | month

  // Get in-memory orchestration stats
  const orchestration = getOrchestrationStats()

  // Provider usage breakdown
  const providerBreakdown = orchestration.providers.map(p => ({
    name: p.name,
    totalCalls: p.totalCalls,
    totalTokens: p.totalTokens,
    avgLatencyMs: p.avgLatencyMs,
    status: p.status,
    lastSuccess: p.lastSuccess ? new Date(p.lastSuccess).toISOString() : null,
    lastFailure: p.lastFailure ? new Date(p.lastFailure).toISOString() : null,
  }))

  // Feature quota info (static reference for free tier)
  const quotaReference = {
    free: { chat: 30, diagnose: 15, soil_analysis: 20, crop_database: 30, news_bulletin: 50 },
    basic: { chat: 100, diagnose: 50, soil_analysis: 80, crop_database: 100, news_bulletin: 200 },
    pro: { chat: 500, diagnose: 200, soil_analysis: 300, crop_database: 500, news_bulletin: 1000 },
    anonymous: { chat: 10, diagnose: 5, soil_analysis: 10, crop_database: 10, news_bulletin: 20 },
  }

  // Calculate summary
  const totalCalls = providerBreakdown.reduce((s, p) => s + p.totalCalls, 0)
  const totalTokens = providerBreakdown.reduce((s, p) => s + p.totalTokens, 0)
  const healthyCount = providerBreakdown.filter(p => p.status === 'healthy').length

  return corsNextResponse(
    {
      ok: true,
      period,
      timestamp: new Date().toISOString(),
      summary: {
        totalCalls,
        totalTokens,
        healthyProviders: healthyCount,
        totalProviders: providerBreakdown.length,
      },
      providers: providerBreakdown,
      quotaReference,
      orchestration: {
        taskRoutingMap: orchestration.taskRoutingMap,
      },
    },
    { origin, methods: ['GET'], headers: { 'Cache-Control': 'no-store' } }
  )
}
