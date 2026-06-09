# Orchestration Hub — OpenProvider Visual Graph

## Overview

OpenProvider is the central orchestrator for KrishiAI, routing AI tasks dynamically across providers based on task type, provider health, and quota availability. This document provides the Graphify-style visualization of the orchestration architecture.

## Orchestration Graph

```
┌─────────────────────────────────────────────────────────────────────┐
│                       OpenProvider (Central)                         │
│              Routes tasks dynamically by classification              │
│                     src/lib/openprovider.ts                          │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
          ┌────────────────────┼────────────────────┐
          │                    │                     │
    ┌─────┴─────┐       ┌─────┴─────┐        ┌─────┴──────┐
    │  Cline    │       │   Kilo    │        │  Opencode  │
    │  Schema   │       │  Infra    │        │  Refactor  │
    │Migration  │       │  CI/CD    │        │  Env Vars  │
    └─────┬─────┘       └─────┬─────┘        └─────┬──────┘
          │                    │                     │
          ▼                    ▼                     ▼
    DB Schema Gen        Deploy Checks         Config Updates
          │                    │                     │
          └────────────────────┼─────────────────────┘
                               │
          ┌────────────────────┼────────────────────┐
          │                    │                     │
    ┌─────┴──────┐      ┌─────┴──────┐       ┌─────┴──────┐
    │  Claude    │      │   Kimi     │       │   Z.ai     │
    │Validation  │      │   Polish   │       │Automation  │
    │Compliance  │      │  Bilingual │       │ Structured │
    └─────┬──────┘      └─────┬──────┘       └─────┬──────┘
          │                    │                     │
          ▼                    ▼                     ▼
    Reasoning QA       Bengali Formatting     Content Generation
          │                    │                     │
          └────────────────────┼─────────────────────┘
                               │
                        ┌──────▼──────┐
                        │   Vercel    │
                        │  Deploy     │
                        │  (hkg1)     │
                        └─────────────┘
```

## Agent Role Definitions

| Agent | Role | Task Types | Preferred Provider | Module |
|-------|------|-----------|-------------------|--------|
| **Cline** | Schema & Migration | `schema` | Gemini | `src/lib/supabase/schema.sql` |
| **Kilo** | Infrastructure & CI/CD | `infra` | Groq | `.github/workflows/validate.yml` |
| **Opencode** | Refactor & Environment | `refactor` | Gemini | `next.config.ts` |
| **Claude** | Validation & Compliance | `validation` | Gemini | `src/lib/ai-client.ts` |
| **Kimi** | Polish & Bilingual | `polish` | Groq | `src/lib/cabi/bengaliKeywords.ts` |
| **Z.ai** | Automation & Structured Content | `automation` | Gemini | `src/lib/openprovider.ts` |

## Task Routing Map

Each task category has a preferred provider chain. The orchestrator tries providers in order, skipping "down" providers:

```
┌─────────────────┬─────────────────────────────────────────┐
│ Task            │ Provider Priority Chain                  │
├─────────────────┼─────────────────────────────────────────┤
│ chat            │ Gemini → OpenRouter → Groq               │
│ diagnose        │ Gemini → OpenRouter → Groq               │
│ soil_analysis   │ Gemini → Groq                            │
│ crop_database   │ Gemini → OpenRouter                      │
│ news_bulletin   │ Groq → Gemini                            │
│ schema          │ Gemini                                   │
│ infra           │ Groq → Gemini                            │
│ refactor        │ Gemini → Groq                            │
│ validation      │ Gemini → OpenRouter                      │
│ polish          │ Groq → Gemini                            │
│ automation      │ Gemini → Groq                            │
└─────────────────┴─────────────────────────────────────────┘
```

## Provider Strengths

| Provider | Model | Strengths | Free Tier |
|----------|-------|-----------|-----------|
| **Gemini** | `gemini-2.5-flash` | Reasoning, multimodal, rich content | Yes |
| **OpenRouter** | `google/gemini-2.5-flash-preview-05-20` | Vision, Gemini proxy, wide model access | Yes |
| **Groq** | `llama-3.1-8b-instant` | Fast text, structured output, low latency | Yes |

## Flow: How Orchestration Enhances the System

1. **Visual Routing** → You see which agent handles which step
2. **Dependency Mapping** → Graphify shows Schema → CI/CD → Refactor → Reasoning → Deploy
3. **Dynamic Orchestration** → OpenProvider routes to free providers automatically
4. **Single Command** → `agentic.json` defines the entire graph for agent consumption

## Fallback Strategy

```
Provider call ──→ Success? ──→ Return result + log usage
       │
       └──→ Failure? ──→ Record failure + try next provider
                              │
                              └──→ All failed? ──→ Offline Bengali fallback
```

## Monitoring Dashboard

The orchestration hub includes a real-time monitoring dashboard at `/dashboard`:

- **Token Usage**: Per-provider token consumption with visual bar charts
- **DB Sync Status**: Supabase connection health and latency
- **Deployment Logs**: Recent Vercel deployments with commit history
- **Provider Health**: Live status of Gemini, OpenRouter, and Groq

API Endpoints:
- `/api/dashboard/status` — System status + provider health
- `/api/dashboard/usage` — Token usage + quota reference
- `/api/dashboard/deployments` — Deployment history

## Configuration

The orchestration graph is defined in `agentic.json` at the project root. This file:
- Maps agents to task types and preferred providers
- Defines the provider waterfall chains
- Specifies monitoring endpoints
- Links Graphify visualization files

```bash
# View the orchestration config
cat agentic.json | jq .taskRoutes
```
