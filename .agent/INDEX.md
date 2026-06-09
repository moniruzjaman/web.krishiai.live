# .agent Unified Hub — Complete Index

Welcome to the centralized documentation and orchestration hub for **KrishiAI PWA**.

## 📍 Navigation

### Docs Section (`.agent/docs/`)

#### Getting Started
- **[pwa.md](./docs/pwa.md)** — PWA configuration, manifest, service worker, install flow ⭐ **START HERE for PWA**
- **[overview.md](./docs/overview.md)** — High-level system overview and architecture
- **[deployment.md](./docs/deployment.md)** — How to deploy the app to production

#### Architecture & Design
- **[architecture.md](./docs/architecture.md)** — Detailed system architecture and component relationships
- **[components.md](./docs/components.md)** — UI component catalog and usage patterns
- **[orchestration.md](./docs/orchestration.md)** — Agent orchestration flow and task routing

#### API Documentation
- **[api-routes.md](./docs/api-routes.md)** — Complete list of API endpoints
- **[api-contracts.md](./docs/api-contracts.md)** — Request/response schemas and contracts

#### Configuration & Environment
- **[config.md](./docs/config.md)** — Configuration guide and options
- **[env-vars.md](./docs/env-vars.md)** — Environment variables reference
- **[dependencies.md](./docs/dependencies.md)** — Project dependencies and versions

#### Domain & Data
- **[agri-domain.md](./docs/agri-domain.md)** — Agricultural domain knowledge base
- **[data-sources.md](./docs/data-sources.md)** — External data source integrations
- **[location-system.md](./docs/location-system.md)** — Geolocation system details

#### Reference & Troubleshooting
- **[routes.md](./docs/routes.md)** — App routing and page structure
- **[gotchas.md](./docs/gotchas.md)** — Common issues and solutions
- **[README.md](./docs/README.md)** — Docs section intro

---

### Orchestration Section (`.agent/orchestration/`)

#### Core Files
- **[agentic.json](./orchestration/agentic.json)** — Agent registry and task routing configuration ⭐ **SOURCE OF TRUTH**
- **[validation.md](./orchestration/validation.md)** — Hub health checks and auto-fix checklist
- **[focus_chain_task.md](./orchestration/focus_chain_task.md)** — Task tracking and focus chain
- **[.env.example](./orchestration/.env.example)** — Environment template for agent hub
- **[README.md](./orchestration/README.md)** — Orchestration intro and quick start

#### Agents (`.agent/orchestration/agents/`)

| Agent | File | Role |
|-------|------|------|
| **OpenProvider** | `openprovider.js` | Central orchestrator & dispatcher |
| **Cline** | `cline.js` | File editor & DB schema sync |
| **Kilo** | `kilo.js` | Infrastructure & CI/CD setup |
| **OpenCode** | `opencode.js` | Code refactoring & env injection |
| **Graphify** | `graphify.js` | Knowledge graph visualization |
| **External** | `external.js` | Free-tier routing (Claude/Kimi/Z.ai) |

#### CI/CD Workflows (`.agent/orchestration/workflows/`)

- **[github-ci.yml](./orchestration/workflows/github-ci.yml)** — Lint, typecheck, test, build, validate
- **[github-deploy.yml](./orchestration/workflows/github-deploy.yml)** — Validation + auto-fix + Vercel deploy
- **[vercel-preview.yml](./orchestration/workflows/vercel-preview.yml)** — Vercel preview deployments

---

## 🚀 Quick Links

### For Developers
1. **Start with PWA docs**: Read `docs/pwa.md` for PWA setup
2. **Understand the system**: Review `docs/architecture.md`
3. **API reference**: Check `docs/api-routes.md`
4. **Environment setup**: Follow `docs/env-vars.md`

### For Ops/DevOps
1. **Deployment**: Read `docs/deployment.md`
2. **CI/CD workflows**: Review `orchestration/workflows/`
3. **Validation**: Check `orchestration/validation.md`
4. **Agent orchestration**: Review `orchestration/agentic.json`

### For Data Integration
1. **Data sources**: Read `docs/data-sources.md`
2. **Agricultural domain**: Review `docs/agri-domain.md`
3. **Location system**: Check `docs/location-system.md`

### For Troubleshooting
- **Common issues**: See `docs/gotchas.md`
- **API contracts**: Check `docs/api-contracts.md`
- **Hub health**: Run validation from `orchestration/validation.md`

---

## 📊 Structure at a Glance

```
.agent/
├── docs/              # 18 documentation files
│   ├── pwa.md        # ⭐ PWA setup
│   ├── architecture.md
│   ├── api-routes.md
│   ├── api-contracts.md
│   ├── overview.md
│   ├── orchestration.md
│   ├── components.md
│   ├── dependencies.md
│   ├── config.md
│   ├── deployment.md
│   ├── env-vars.md
│   ├── agri-domain.md
│   ├── data-sources.md
│   ├── location-system.md
│   ├── gotchas.md
│   ├── routes.md
│   ├── README.md
│   └── INDEX.md (this file)
│
├── orchestration/     # Agent hub and CI/CD
│   ├── agentic.json
│   ├── validation.md
│   ├── focus_chain_task.md
│   ├── .env.example
│   ├── README.md
│   ├── agents/
│   │   ├── openprovider.js
│   │   ├── cline.js
│   │   ├── kilo.js
│   │   ├── opencode.js
│   │   ├── graphify.js
│   │   └── external.js
│   └── workflows/
│       ├── github-ci.yml
│       ├── github-deploy.yml
│       └── vercel-preview.yml
│
└── README.md          # Hub intro

App Core (Independent):
├── src/app/           # Next.js pages & APIs
├── src/components/    # UI components
├── src/lib/          # Utilities & services
├── public/           # Static assets (icons, manifest)
└── next.config.ts    # Next.js config
```

---

## 🔗 Key Relationships

- **App PWA config** → `src/app/layout.tsx` + `public/manifest.json` (independent of `.agent/`)
- **Agent registry** → `agentic.json` (routing + task assignment)
- **CI/CD workflows** → GitHub Actions (deploy on every push)
- **Documentation** → Cross-referenced by developers and agents

---

## ✅ Health Check

To verify the hub is healthy:

```bash
# Validate hub configuration
node .agent/orchestration/agents/openprovider.js \
  '{"intent":"validate","payload":{"checklist":".agent/orchestration/validation.md"}}'

# Validate + auto-fix (for deployment)
node .agent/orchestration/agents/openprovider.js \
  '{"intent":"validate-and-fix","payload":{"checklist":".agent/orchestration/validation.md","hubRoot":".agent/orchestration"}}'
```

---

## 📝 History

**Restructured**: 2025-06-09
- Unified `.graphify/` + `meta-mcp-hub/` into single `.agent/` folder
- Removed unused `.sixth/` and `.vibe/` folders
- Simplified project root structure
- Updated all path references in `agentic.json` and CI/CD workflows

---

**Last Updated**: 2025-06-09
**Maintainer**: Automated by orchestration hub
