# .agent — Unified Documentation & Orchestration Hub

Centralized repository for **PWA documentation**, **agent orchestration**, and **CI/CD workflows** for the KrishiAI platform.

## Structure

```
.agent/
├── docs/                         # Complete PWA documentation
│   ├── INDEX.md                 # Navigation hub
│   ├── pwa.md                   # PWA setup, manifest, service worker ⭐
│   ├── architecture.md          # System design
│   ├── api-routes.md            # API endpoint documentation
│   ├── api-contracts.md         # Request/response schemas
│   ├── overview.md              # High-level architecture
│   ├── orchestration.md         # Agent orchestration flow
│   ├── components.md            # UI component catalog
│   ├── dependencies.md          # Dependency reference
│   ├── config.md                # Configuration guide
│   ├── deployment.md            # Deployment procedures
│   ├── env-vars.md              # Environment variables reference
│   ├── agri-domain.md           # Agricultural domain knowledge
│   ├── data-sources.md          # Data source integrations
│   ├── location-system.md       # Geolocation system
│   ├── gotchas.md               # Common issues & solutions
│   ├── routes.md                # Routing documentation
│   ├── README.md                # Docs intro
│   └── INDEX.md                 # Docs navigation
│
└── orchestration/               # Agent orchestration & CI/CD
    ├── agentic.json            # Agent registry & task routing ⭐
    ├── validation.md            # Health checks & auto-fix checklist
    ├── focus_chain_task.md      # Task tracking & focus chain
    ├── .env.example             # Environment template
    ├── README.md                # Orchestration intro
    │
    ├── agents/                  # MCP-compatible agent definitions
    │   ├── openprovider.js      # Central orchestrator/dispatcher
    │   ├── cline.js             # File editor + DB schema sync
    │   ├── kilo.js              # Infrastructure & CI/CD
    │   ├── opencode.js          # Code refactoring & env injection
    │   ├── graphify.js          # Knowledge graph visualization
    │   └── external.js          # Free-tier routing (Claude/Kimi/Z.ai)
    │
    └── workflows/               # GitHub Actions CI/CD
        ├── github-ci.yml        # Lint, type-check, build, validate
        ├── github-deploy.yml    # Validation + auto-fix + deploy
        └── vercel-preview.yml   # Vercel preview deployments
```

## Quick Start

### 1. Development & Documentation
```bash
# View PWA documentation
cat .agent/docs/pwa.md

# View orchestration setup
cat .agent/orchestration/README.md
```

### 2. Agent Orchestration
```bash
# Initialize agent environment
export ANTHROPIC_API_KEY=...
export GEMINI_API_KEY=...
export GROQ_API_KEY=...

# Validate hub health
node .agent/orchestration/agents/openprovider.js \
  '{"intent":"validate","payload":{"checklist":".agent/orchestration/validation.md"}}'

# Run validation + auto-fix (deployment only)
node .agent/orchestration/agents/openprovider.js \
  '{"intent":"validate-and-fix","payload":{"checklist":".agent/orchestration/validation.md","hubRoot":".agent/orchestration"}}'
```

### 3. Deployment
```bash
# Copy workflows to .github/workflows/
cp .agent/orchestration/workflows/*.yml .github/workflows/

# GitHub Actions will automatically run CI/CD on push
```

## Key Files

| File | Purpose |
|------|---------|
| `.agent/docs/pwa.md` | PWA manifest, service worker, install flow configuration |
| `.agent/orchestration/agentic.json` | Central registry for all agents and task routing |
| `.agent/orchestration/validation.md` | Health checks for agent hub and app configuration |
| `.agent/orchestration/workflows/github-ci.yml` | Lint, typecheck, test, build, validate |
| `.agent/orchestration/workflows/github-deploy.yml` | Validation + auto-fix + Vercel deployment |

## Agents

| Agent | Role | Access |
|-------|------|--------|
| **openprovider** | Central orchestrator & dispatcher | Free |
| **cline** | File editor + DB schema sync | Free |
| **kilo** | Infrastructure & CI/CD setup | Free |
| **opencode** | Code refactoring & env injection | Free |
| **graphify** | Knowledge graph visualization | Free |
| **claude** (via openprovider) | Reasoning & compliance | Free |
| **kimi** (via openprovider) | Bilingual formatting & polish | Free |
| **z-ai** (via openprovider) | Workflow automation | Free |

All agents are free and automatically best-assigned via `agentic.json`.

## How It Works

1. **Documentation Layer** (`.agent/docs/`)
   - Comprehensive guides for PWA, API, deployment, troubleshooting
   - Single source of truth for architectural decisions
   - Referenced by developers and agents

2. **Orchestration Layer** (`.agent/orchestration/`)
   - `agentic.json` defines which agents handle which tasks
   - Agents work in parallel or sequentially based on routing
   - `validation.md` ensures hub + app health before deployment

3. **CI/CD Layer** (`.agent/orchestration/workflows/`)
   - GitHub Actions runs on every push
   - Lint, typecheck, test, then validate agent hub
   - Only deploy to Vercel if all checks pass

## Integration Points

- **App Core**: No dependencies on `.agent/` at runtime
- **Build Process**: `next.config.ts` is independent
- **APIs**: All API routes in `src/app/api/` are independent
- **PWA**: PWA configuration in `public/manifest.json` + `src/app/layout.tsx` is independent

The `.agent/` folder is purely for developer tools, orchestration, and documentation.

---

**Last Updated**: 2025-06-09 (Unified from `.graphify/` + `meta-mcp-hub/`)
