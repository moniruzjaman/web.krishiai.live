/**
 * OpenRouter — Central Orchestrator for KrishiAI
 *
 * Dynamically routes AI tasks across providers based on task type,
 * provider health, and quota availability. Inspired by the
 * orchestration hub pattern: tasks flow through classified routes
 * to the optimal AI provider, with graceful fallback chains.
 *
 * ┌───────────────┐
 * │ OpenRouter     │  ← central orchestrator
 * └───────┬───────┘
 *         │
 *    ┌────┼──────────┐
 *    │    │           │
 *  Schema  Infra    Refactor  ← task categories
 *    │    │           │
 *    └────┼──────────┘
 *         │
 *  ┌──────┴──────┐
 *  │ Claude/Kimi/Z│  ← provider routing
 *  └──────┬──────┘
 *         │
 *    ┌────▼────┐
 *    │ Vercel  │  ← deployment target
 *    └─────────┘
 */

import { callAI, aiChat, aiChatFull, type AIMessage, type AICallOptions, type AIResponse } from './ai-client'

// ── Task Classification ─────────────────────────────────────────────────────

export type TaskCategory =
  | 'chat'            // General agricultural Q&A
  | 'diagnose'        // Disease diagnosis (reasoning-heavy)
  | 'soil_analysis'   // Soil classification (structured)
  | 'crop_database'   // Crop info generation (rich content)
  | 'news_bulletin'   // News summary (fast text)
  | 'schema'          // DB schema generation (Cline role)
  | 'infra'           // CI/CD + deployment checks (Kilo role)
  | 'refactor'        // Code/env injection (Opencode role)
  | 'validation'      // Reasoning + compliance (Claude role)
  | 'polish'          // Bilingual formatting (Kimi role)
  | 'automation'      // Structured content + cloning (Z.ai role)

/**
 * Maps each task category to its preferred provider route.
 * This implements the "dynamic orchestration" pattern:
 * different task types prefer different provider strengths.
 *
 * Gemini  → best for reasoning, rich content, multimodal
 * OpenRouter → best for vision + Gemini proxy
 * Groq    → best for fast text, structured output
 */
const TASK_PROVIDER_PRIORITY: Record<TaskCategory, string[]> = {
  // ── User-facing features ─────────────────────────────────────────────────
  chat:           ['gemini', 'openrouter', 'groq'],
  diagnose:       ['gemini', 'openrouter', 'groq'],     // Gemini primary, OpenRouter fallback on quota
  soil_analysis:  ['gemini', 'openrouter'],              // structured classification with consensus
  crop_database:  ['gemini', 'openrouter'],            // rich content generation
  news_bulletin:  ['groq', 'gemini'],                  // fast text summary

  // ── Orchestration / agent tasks ──────────────────────────────────────────
  schema:         ['gemini'],                          // structured JSON generation
  infra:          ['groq', 'gemini'],                  // quick status checks
  refactor:       ['gemini', 'groq'],                  // code generation
  validation:     ['gemini', 'openrouter'],            // reasoning + compliance
  polish:         ['groq', 'gemini'],                  // fast bilingual formatting
  automation:     ['gemini', 'groq'],                  // structured content
}

// ── Provider Health Tracking ────────────────────────────────────────────────

interface ProviderHealth {
  name: string
  status: 'healthy' | 'degraded' | 'down'
  lastSuccess: number | null
  lastFailure: number | null
  consecutiveFailures: number
  totalCalls: number
  totalTokens: number
  avgLatencyMs: number
}

const providerHealthMap = new Map<string, ProviderHealth>()

function getProviderHealth(name: string): ProviderHealth {
  if (!providerHealthMap.has(name)) {
    providerHealthMap.set(name, {
      name,
      status: 'healthy',
      lastSuccess: null,
      lastFailure: null,
      consecutiveFailures: 0,
      totalCalls: 0,
      totalTokens: 0,
      avgLatencyMs: 0,
    })
  }
  return providerHealthMap.get(name)!
}

function recordProviderSuccess(name: string, tokens: number, latencyMs: number) {
  const health = getProviderHealth(name)
  health.lastSuccess = Date.now()
  health.consecutiveFailures = 0
  health.totalCalls++
  health.totalTokens += tokens
  // Running average of latency
  health.avgLatencyMs = health.totalCalls === 1
    ? latencyMs
    : Math.round((health.avgLatencyMs * (health.totalCalls - 1) + latencyMs) / health.totalCalls)
  // Upgrade from degraded if healthy
  if (health.status === 'degraded') health.status = 'healthy'
  if (health.status === 'down' && health.consecutiveFailures === 0) health.status = 'degraded'
}

function recordProviderFailure(name: string) {
  const health = getProviderHealth(name)
  health.lastFailure = Date.now()
  health.consecutiveFailures++
  health.totalCalls++
  if (health.consecutiveFailures >= 3) health.status = 'down'
  else if (health.consecutiveFailures >= 1) health.status = 'degraded'
}

// ── Orchestration Result ────────────────────────────────────────────────────

export interface OrchestrationResult {
  response: AIResponse
  task: TaskCategory
  routedProvider: string
  routingDecision: string    // Why this provider was chosen
  latencyMs: number
  fallbackChain: string[]   // The full chain attempted
}

// ── Main OpenRouter Router ────────────────────────────────────────────────

/**
 * Routes an AI task through the OpenRouter orchestration hub.
 *
 * 1. Classifies the task type
 * 2. Looks up the preferred provider chain for that task
 * 3. Skips providers that are "down"
 * 4. Falls back through the chain on failure
 * 5. Records health + usage telemetry
 *
 * Wraps the existing `callAI()` from ai-client.ts for backward compatibility.
 */
export async function orchestrate(
  messages: AIMessage[],
  task: TaskCategory,
  options: Partial<AICallOptions> = {}
): Promise<OrchestrationResult> {
  const startTime = Date.now()

  // Get the provider priority chain for this task
  const preferredChain = TASK_PROVIDER_PRIORITY[task] || ['gemini', 'openrouter', 'groq']

  // Filter out "down" providers (keep degraded as they may still work)
  const activeChain = preferredChain.filter(p => {
    const health = getProviderHealth(p)
    return health.status !== 'down'
  })

  // If all preferred providers are down, fall back to full chain
  const routingChain = activeChain.length > 0 ? activeChain : ['gemini', 'openrouter', 'groq']

  const routingDecision = routingChain.length < preferredChain.length
    ? `Skipped down providers: ${preferredChain.filter(p => !routingChain.includes(p)).join(', ')}`
    : `Full preferred chain for task "${task}"`

  // Delegate to the existing quota-aware AI client
  // (which already handles the Gemini → OR → Groq waterfall internally)
  const feature = mapTaskToFeature(task)
  const result = await callAI(messages, {
    feature,
    temperature: options.temperature ?? getDefaultTemperature(task),
    maxTokens: options.maxTokens ?? getDefaultMaxTokens(task),
    ...options,
  })

  const latencyMs = Date.now() - startTime

  // Record telemetry
  if (result.provider && result.provider !== 'offline' && result.provider !== 'quota-exceeded') {
    recordProviderSuccess(result.provider, result.tokensUsed, latencyMs)
  } else if (result.provider === 'offline') {
    // All providers failed
    for (const p of ['gemini', 'openrouter', 'groq']) {
      recordProviderFailure(p)
    }
  }

  return {
    response: result,
    task,
    routedProvider: result.provider,
    routingDecision,
    latencyMs,
    fallbackChain: preferredChain,
  }
}

// ── Convenience wrappers ────────────────────────────────────────────────────

/** Quick chat through the orchestrator */
export async function opChat(
  systemPrompt: string,
  userMessage: string,
  task: TaskCategory = 'chat',
  options: Partial<AICallOptions> = {}
): Promise<OrchestrationResult> {
  return orchestrate(
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage }
    ],
    task,
    { feature: mapTaskToFeature(task), ...options }
  )
}

/** Full message array through the orchestrator */
export async function opChatFull(
  messages: AIMessage[],
  task: TaskCategory = 'chat',
  options: Partial<AICallOptions> = {}
): Promise<OrchestrationResult> {
  return orchestrate(messages, task, {
    feature: mapTaskToFeature(task),
    ...options
  })
}

// ── Telemetry / Dashboard API ───────────────────────────────────────────────

export interface OrchestrationStats {
  providers: ProviderHealth[]
  totalCalls: number
  totalTokens: number
  healthyProviders: number
  degradedProviders: number
  downProviders: number
  taskRoutingMap: Record<TaskCategory, string[]>
}

/** Get current orchestration stats for the dashboard */
export function getOrchestrationStats(): OrchestrationStats {
  const providers = Array.from(providerHealthMap.values())
  const providersOrDefault = providers.length > 0 ? providers : [
    getProviderHealth('gemini'),
    getProviderHealth('openrouter'),
    getProviderHealth('groq'),
  ]

  return {
    providers: providersOrDefault,
    totalCalls: providersOrDefault.reduce((sum, p) => sum + p.totalCalls, 0),
    totalTokens: providersOrDefault.reduce((sum, p) => sum + p.totalTokens, 0),
    healthyProviders: providersOrDefault.filter(p => p.status === 'healthy').length,
    degradedProviders: providersOrDefault.filter(p => p.status === 'degraded').length,
    downProviders: providersOrDefault.filter(p => p.status === 'down').length,
    taskRoutingMap: TASK_PROVIDER_PRIORITY,
  }
}

/** Get the full task routing map (for Graphify visualization) */
export function getTaskRoutingMap(): Record<TaskCategory, string[]> {
  return TASK_PROVIDER_PRIORITY
}

// ── Internal helpers ────────────────────────────────────────────────────────

function mapTaskToFeature(task: TaskCategory): string {
  const mapping: Record<TaskCategory, string> = {
    chat: 'chat',
    diagnose: 'diagnose',
    soil_analysis: 'soil_analysis',
    crop_database: 'crop_database',
    news_bulletin: 'news_bulletin',
    schema: 'chat',
    infra: 'chat',
    refactor: 'chat',
    validation: 'chat',
    polish: 'chat',
    automation: 'chat',
  }
  return mapping[task] || 'chat'
}

function getDefaultTemperature(task: TaskCategory): number {
  switch (task) {
    case 'diagnose':
    case 'validation':
    case 'schema':
      return 0.3   // More deterministic for reasoning/structure
    case 'polish':
    case 'automation':
      return 0.5   // Moderate creativity
    case 'chat':
    case 'news_bulletin':
    default:
      return 0.7   // Default conversational
  }
}

function getDefaultMaxTokens(task: TaskCategory): number {
  switch (task) {
    case 'schema':
    case 'infra':
      return 2048   // Structured output needs more tokens
    case 'news_bulletin':
    case 'polish':
      return 512    // Short summaries
    case 'diagnose':
    case 'validation':
      return 1536   // Detailed reasoning
    default:
      return 1024
  }
}
