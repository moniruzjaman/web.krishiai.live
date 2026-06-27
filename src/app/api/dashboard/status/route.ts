/**
 * /api/dashboard/status — System Status for OpenRouter Dashboard
 *
 * Returns provider health, DB connectivity, and orchestration stats.
 */

import { NextRequest } from 'next/server'
import { handleOptions, corsNextResponse } from '@/lib/cors'
import { getOrchestrationStats, getTaskRoutingMap } from '@/lib/openrouter'

export async function OPTIONS(request: NextRequest) {
  return handleOptions(request.headers.get('origin'), ['GET'])
}

export async function GET(request: NextRequest) {
  const origin = request.headers.get('origin')

  // Check Supabase connectivity
  let dbStatus = 'unknown'
  let dbLatency = 0
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (supabaseUrl) {
      const start = Date.now()
      const res = await fetch(`${supabaseUrl}/rest/v1/`, {
        method: 'HEAD',
        headers: {
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
        },
        signal: AbortSignal.timeout(5000),
      })
      dbLatency = Date.now() - start
      dbStatus = res.ok ? 'connected' : 'error'
    } else {
      dbStatus = 'not_configured'
    }
  } catch {
    dbStatus = 'unreachable'
  }

  // Check AI provider API key availability
  const providerKeys = {
    gemini: !!process.env.GEMINI_API_KEY,
    openrouter: !!process.env.OPENROUTER_API_KEY,
    groq: !!process.env.GROQ_API_KEY,
  }

  // Get orchestration stats (in-memory)
  const orchestration = getOrchestrationStats()
  const routingMap = getTaskRoutingMap()

  return corsNextResponse(
    {
      ok: true,
      timestamp: new Date().toISOString(),
      version: '4.0.2',
      database: {
        status: dbStatus,
        latencyMs: dbLatency,
        provider: 'supabase',
      },
      providers: {
        gemini: {
          keyConfigured: providerKeys.gemini,
          health: orchestration.providers.find(p => p.name === 'gemini')?.status || 'healthy',
          model: 'gemini-2.5-flash',
        },
        openrouter: {
          keyConfigured: providerKeys.openrouter,
          health: orchestration.providers.find(p => p.name === 'openrouter')?.status || 'healthy',
          model: 'google/gemini-2.5-flash-preview-05-20',
        },
        groq: {
          keyConfigured: providerKeys.groq,
          health: orchestration.providers.find(p => p.name === 'groq')?.status || 'healthy',
          model: 'llama-3.1-8b-instant',
        },
      },
      orchestration: {
        totalCalls: orchestration.totalCalls,
        totalTokens: orchestration.totalTokens,
        healthyProviders: orchestration.healthyProviders,
        degradedProviders: orchestration.degradedProviders,
        downProviders: orchestration.downProviders,
        taskRoutingMap: routingMap,
      },
      deployment: {
        platform: 'vercel',
        region: 'hkg1',
        framework: 'nextjs-16',
        runtime: 'bun',
      },
    },
    { origin, methods: ['GET'], headers: { 'Cache-Control': 'no-store' } }
  )
}
