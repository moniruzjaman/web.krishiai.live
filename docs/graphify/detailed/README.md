# .graphify — KrishiAI Codebase Insight Graph

> **Purpose**: Modular, token-efficient insight files for any AI agent to instantly understand this codebase without reading source code. Each file is self-contained and focused on one domain.

## Quick Start for Agents

1. Read `INDEX.md` for the full map of all insight files
2. Read only the files relevant to your task
3. Each file contains: architecture, data flow, key decisions, file references, and gotchas

## File Inventory

| File | What It Covers | When to Read |
|------|---------------|-------------|
| `INDEX.md` | Full project map, all files, all routes | Always read first |
| `architecture.md` | System architecture, deployment, data flow | Understanding how everything connects |
| `routes.md` | All 25 routes with params, methods, caching | Modifying any page or API |
| `components.md` | All React components, props, dependencies | Modifying UI or adding features |
| `api-contracts.md` | Every API endpoint: request/response shapes | Working on API routes or frontend calls |
| `data-sources.md` | All external APIs, keys, fallbacks, caching | Changing data fetching or adding sources |
| `location-system.md` | GPS/geolocation, permissions, reverse geocoding | Anything involving user location |
| `pwa.md` | PWA install, manifest, service worker | Install button, offline, app behavior |
| `agri-domain.md` | Bangladesh agriculture domain knowledge in code | Modifying crop data, seasons, prices, NDVI |
| `config.md` | All config files, env vars, build settings | Changing deployment, build, or config |
| `dependencies.md` | All 19 deps, why each exists, alternatives | Adding/removing packages |
| `gotchas.md` | Known issues, pitfalls, non-obvious behaviors | Before making changes |

## Design Principles

- **Token-efficient**: Each file <200 lines, dense with structured data
- **Self-contained**: No need to cross-reference source files for basic understanding
- **Agent-first**: Written in a format agents parse instantly (structured markdown)
- **Living docs**: Update when code changes — these ARE the documentation
