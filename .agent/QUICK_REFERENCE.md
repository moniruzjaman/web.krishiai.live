# Quick Reference Card — After Restructuring

## 📍 Where Things Are Now

| What | Before | After |
|------|--------|-------|
| **Documentation** | `.graphify/` | `.agent/docs/` |
| **Agent Orchestration** | `meta-mcp-hub/` | `.agent/orchestration/` |
| **Agent Definitions** | `meta-mcp-hub/agents/` | `.agent/orchestration/agents/` |
| **CI/CD Workflows** | `meta-mcp-hub/workflows/` | `.agent/orchestration/workflows/` |
| **Agent Registry** | `meta-mcp-hub/agentic.json` | `.agent/orchestration/agentic.json` |
| **App Code** | `src/` | `src/` (UNCHANGED) |
| **PWA Setup** | PWA files in `src/` | PWA files in `src/` (UNCHANGED) |

## 🚀 Quick Commands

### View Documentation Index
```bash
cat .agent/INDEX.md
```

### View PWA Setup
```bash
cat .agent/docs/pwa.md
```

### View Agent Registry
```bash
cat .agent/orchestration/agentic.json | jq .
```

### Validate Agent Hub
```bash
node .agent/orchestration/agents/openprovider.js \
  '{"intent":"validate","payload":{"checklist":".agent/orchestration/validation.md"}}'
```

### View All Documentation Files
```bash
ls -la .agent/docs/
```

### View All Agent Files
```bash
ls -la .agent/orchestration/agents/
```

### View All Workflows
```bash
ls -la .agent/orchestration/workflows/
```

## 📋 Folder Structure Reference

```
.agent/
├── README.md                    # Hub overview (START HERE)
├── INDEX.md                     # Navigation index
├── RESTRUCTURING_SUMMARY.md     # Restructuring details
│
├── docs/                        # DOCUMENTATION (18 files)
│   ├── pwa.md                  # PWA configuration ⭐
│   ├── architecture.md
│   ├── api-routes.md
│   ├── api-contracts.md
│   ├── deployment.md
│   ├── env-vars.md
│   ├── config.md
│   ├── components.md
│   ├── dependencies.md
│   ├── orchestration.md
│   ├── overview.md
│   ├── routes.md
│   ├── agri-domain.md
│   ├── data-sources.md
│   ├── location-system.md
│   ├── gotchas.md
│   ├── README.md
│   └── INDEX.md
│
└── orchestration/               # AGENT ORCHESTRATION & CI/CD
    ├── agentic.json            # Agent registry ⭐
    ├── validation.md
    ├── focus_chain_task.md
    ├── .env.example
    ├── README.md
    ├── agents/
    │   ├── openprovider.js
    │   ├── cline.js
    │   ├── kilo.js
    │   ├── opencode.js
    │   ├── graphify.js
    │   └── external.js
    └── workflows/
        ├── github-ci.yml
        ├── github-deploy.yml
        └── vercel-preview.yml
```

## ✅ What's Unchanged

- ✅ `src/` — All app code
- ✅ `src/app/api/` — All API routes
- ✅ `src/components/` — All components
- ✅ `public/manifest.json` — PWA manifest
- ✅ `src/app/layout.tsx` — PWA meta tags
- ✅ `next.config.ts` — Next.js config
- ✅ `package.json` — Dependencies
- ✅ Build process — Everything works

## ❌ What Was Removed

- ❌ `.graphify/` — Deleted (moved to `.agent/docs/`)
- ❌ `meta-mcp-hub/` — Deleted (moved to `.agent/orchestration/`)
- ❌ `.sixth/` — Deleted (empty)
- ❌ `.vibe/` — Deleted (empty)

## 🔑 Key Files

**Most Important**:
1. `.agent/README.md` — Start here
2. `.agent/docs/pwa.md` — PWA configuration
3. `.agent/orchestration/agentic.json` — Agent routing

**For Developers**:
- `.agent/docs/architecture.md` — System design
- `.agent/docs/api-routes.md` — API endpoints
- `.agent/docs/env-vars.md` — Environment setup

**For DevOps**:
- `.agent/orchestration/validation.md` — Health checks
- `.agent/orchestration/workflows/` — CI/CD pipelines
- `.agent/orchestration/README.md` — Orchestration guide

## 🎯 Navigation Quick Links

### By Role

**Developers**:
```
.agent/docs/architecture.md     → System design
.agent/docs/components.md       → UI components
.agent/docs/api-routes.md       → API endpoints
.agent/docs/api-contracts.md    → Request/response
```

**DevOps/Operations**:
```
.agent/docs/deployment.md               → Deploy guide
.agent/orchestration/validation.md      → Health checks
.agent/orchestration/workflows/         → GitHub Actions
```

**Data Integration**:
```
.agent/docs/data-sources.md     → External APIs
.agent/docs/agri-domain.md      → Domain knowledge
.agent/docs/location-system.md  → Geolocation
```

**Troubleshooting**:
```
.agent/docs/gotchas.md          → Common issues
.agent/docs/config.md           → Configuration
.agent/docs/env-vars.md         → Environment setup
```

## 📞 Support

- **Overview**: See `.agent/README.md`
- **Navigation**: See `.agent/INDEX.md`
- **Specific topic**: Check `.agent/docs/` for 18 documentation files
- **Agent setup**: See `.agent/orchestration/README.md`

---

**Last Updated**: 2025-06-09
**Status**: ✅ Complete and verified
