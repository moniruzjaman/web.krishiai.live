# meta-mcp-hub

A lightweight orchestration layer for the `web.krishiai.live` PWA. It coordinates a small fleet of agents — `openprovider`, `cline`, `kilo`, `opencode`, `graphify`, and the free external models `Claude`, `Kimi`, `Z.ai` — around a single registry (`agentic.json`) and exposes them through one MCP-compatible entrypoint.

![Validation + Auto-Fix](https://img.shields.io/badge/Validation%20%2B%20Auto--Fix-Passing-brightgreen)

## Layout

```
meta-mcp-hub/
├── agentic.json           # agent registry + workflow pointers
├── .env.example           # placeholder env vars
├── validation.md          # validation + auto-fix checklist
├── README.md              # this file
├── focus_chain_task.md    # focus-chain / task ledger
├── agents/
│   ├── openprovider.js    # orchestrator / dispatcher
│   ├── cline.js           # file editor + DB schema
│   ├── kilo.js            # infra + CI/CD
│   ├── opencode.js        # refactor + env injection
│   ├── graphify.js        # .graphify visualization layer
│   └── external.js        # free-tier model router (Claude/Kimi/Z.ai)
└── workflows/
    ├── github-ci.yml      # GitHub Actions CI
    ├── github-deploy.yml  # GitHub Actions CD
    └── vercel-preview.yml # Vercel preview deploy
```

The hub lives at the project root, just below `.graphify/`.

## Quick start

```bash
# 1. One-time login to OpenProvider (handles Claude / Kimi / Z.ai free routing)
copilot-mcp login openprovider

# 2. Run the entire hub (validation + auto-fix + agent orchestration)
copilot-mcp run meta-mcp-hub/agentic.json
```

That's it — one login, one command, and the hub validates the DB, injects env, syncs the schema, exports the graph, and runs the configured agents end-to-end.

## Agents

| Agent | Role | Best Assigned Task | Free Access |
| --- | --- | --- | --- |
| **openprovider** | Orchestrator | Central controller; routes intents to agents; fans out multi-agent tasks; handles free routing to Claude/Kimi/Z.ai | ✅ |
| **cline** | File-editor | Safe read/write under `src/`, `public/`, `.graphify/`, `meta-mcp-hub/`; generates and syncs DB schema | ✅ |
| **kilo** | Infra | Plans infra; emits GitHub Actions workflows (`ci.yml`, `deploy.yml`); sets up CI/CD pipelines | ✅ |
| **opencode** | Refactor | Dry-run refactors; injects environment variables; ensures clean code structure | ✅ |
| **graphify** | Visualization | Builds/queries/exports the `.graphify` knowledge graph; provides orchestration dashboard | ✅ |
| **Claude (via OpenProvider)** | Reasoning | Compliance-sensitive validation; structured reasoning for complex workflows | ✅ |
| **Kimi (via OpenProvider)** | Presentation | Polishes outputs; bilingual formatting; professional design for reports/docs | ✅ |
| **Z.ai (via OpenProvider)** | Automation | Automates structured content; clones workflows; integrates with broader pipelines | ✅ |

All agents — including the DB agent, reasoning agent, polish agent, and automation agent — are free and best-assigned automatically via `agentic.json` `routing.mode: "free"`.

## Registry

`agentic.json` is the source of truth. `openprovider.pickAgent()` matches on `role` first, then on `capabilities`. The `routing` block declares:

```json
"routing": { "provider": "openprovider-agent", "mode": "free" }
```

so every agent (DB, reasoning, polish, automation) is free and best-assigned automatically. Add a new agent by dropping a file under `agents/` and registering it there.

## Validation + auto-fix

`validation.md` is the single source of truth for the hub's health. OpenProvider exposes two intents:

```bash
# Read-only validation
node meta-mcp-hub/agents/openprovider.js \
  '{"intent":"validate","payload":{"checklist":"meta-mcp-hub/validation.md"}}'

# Validation + auto-fix (DB migrate, env inject, workflow regen, etc.)
node meta-mcp-hub/agents/openprovider.js \
  '{"intent":"validate-and-fix","payload":{"checklist":"meta-mcp-hub/validation.md","hubRoot":"meta-mcp-hub"}}'
```

The CI workflow runs `validate` on every push/PR; the CD workflow runs `validate-and-fix` before deploying to production.

## CI/CD

- **GitHub Actions CI** (`workflows/github-ci.yml`) — lint, typecheck, test, build, plus **Validate meta-mcp-hub** step.
- **GitHub Actions CD** (`workflows/github-deploy.yml`) — runs **Run validation and auto-fix** on `main`, then deploys to Vercel.
- **Vercel preview** (`workflows/vercel-preview.yml`) — preview deploys per PR.

Copy or symlink the GitHub workflows into `.github/workflows/` (or run the `kilo` `emit-workflows` op) to activate them.

## Graphify integration

The graphify agent reads `../.graphify/{nodes,edges}.jsonl` and exports a flat shape consumable by the PWA at `/api/graphify`.
