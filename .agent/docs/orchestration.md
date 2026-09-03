# Orchestration Hub — App AI Providers + Dev-Agent Meta Hub

> Synced to `README.md` and root `agentic.json` (v3.2.0) — last synced 2026-08-29.
> This file previously mixed the app's AI-provider waterfall with the dev-agent
> meta hub and referenced stale models (`gemini-2.5-flash`,
> `google/gemini-2.5-flash-preview-05-20`, `llama-3.1-8b-instant`) and a
> non-existent `src/lib/openprovider.ts` module. It has been split into the
> two real layers below, matching the actual code (`src/lib/openrouter.ts`).

## Layer 1 — App AI Provider Waterfall (farmer-facing)

Source of truth: root `agentic.json` · orchestrator module: `src/lib/openrouter.ts` (`orchestrate()`)

Three free-tier AI providers in a quota-aware waterfall. Order is chosen so the
strongest model is tried first; each fallback only fires on quota/error, so
normal traffic never loses quality:

| Priority | Provider | Model | Role |
|---|---|---|---|
| 1 (primary) | **Gemini** | `gemini-3.5-flash` | reasoning, multimodal (image/PDF/doc), vision |
| 2 (fallback) | **OpenRouter** | `qwen/qwen2.5-vl-72b-instruct:free` | vision, wide model access, consensus partner |
| 3 (fallback) | **Groq** | `llama-3.2-11b-vision-preview` | fast text, low latency, tiebreaker |

### Task routing (from `agentic.json.taskRoutes`)

```
chat            → gemini → openrouter → groq
diagnose        → gemini → openrouter → groq
soil_analysis   → gemini → openrouter
crop_database   → gemini → openrouter
news_bulletin   → groq   → gemini
```

### Fallback strategy

```
Provider call ──→ Success? ──→ Return result + log usage to Supabase
       │
       └──→ Quota/error? ──→ Record failure + try next provider in chain
                                   │
                                   └──→ All failed? ──→ Offline Bengali graceful degradation
                                                          ("quotaExceeded": daily limit message)
```

### Hybrid-analysis consensus (diagnosis only)

`src/lib/hybrid-analysis.ts` — used for `diagnose`, `soil_analysis`, `crop_database`:

1. Parallel vision inference: Gemini 3.5 Flash + OpenRouter Qwen2.5-VL-72B
2. Cross-validate disease classification, confidence, treatment overlap
3. Agreement ≥ 80% → merge into unified diagnosis
4. Agreement < 80% → Groq Llama-3.2-11B-Vision tiebreaker vote
5. Final synthesis: weighted confidence score + Bangla/English dual output
   (confidence threshold `0.8`, timeout `15s`)

### Monitoring

- Dashboard: `/dashboard`
- `/api/dashboard/status` — provider health
- `/api/dashboard/usage` — token/quota usage
- `/api/dashboard/deployments` — deploy history
- Refresh interval: 30s

## Layer 2 — Dev-Agent Meta Hub (codebase automation, not farmer-facing)

Source of truth: `.agent/orchestration/agentic.json` ("meta-mcp-hub") · entrypoint: `agents/openprovider.js`

This is a **separate** system used to automate work on the KrishiAI codebase
itself (schema sync, CI/CD, refactors, doc polish) — it never touches the
live farmer-facing chat/diagnosis flow above. It also uses free-tier routing:

| Agent | Role | Routes to | Best assigned task |
|---|---|---|---|
| `openprovider` | Orchestrator | — | routes intents to agents, fans out multi-agent tasks |
| `cline` | File-editor | local | DB schema generation + sync under `src/`, `public/`, `.agent/` |
| `kilo` | Infra | local | CI/CD workflow generation (`.github/workflows/`) |
| `opencode` | Refactor | local | dry-run refactors, env-var injection |
| `graphify` | Visualization | local | builds/exports the `.agent/docs` knowledge graph |
| `claude` (external) | Reasoning | Anthropic, free tier | compliance-sensitive validation |
| `kimi` (external) | Presentation | Moonshot, free tier | bilingual polish, report formatting |
| `z-ai` (external) | Automation | Z.ai, free tier | structured content, workflow cloning |

Run it with:
```bash
copilot-mcp login openprovider
copilot-mcp run .agent/orchestration/agentic.json
```

## Keeping this file in sync

Whenever `README.md`'s "AI প্রদানকারী আর্কিটেকচার" table changes model names or
provider order, update **root `agentic.json`** first (it is the machine-readable
source of truth for Layer 1), then update this file to match. Layer 2
(`​.agent/orchestration/agentic.json`) changes independently and only needs to
stay consistent with itself and `.agent/orchestration/README.md`.
