# Configuration — Build, Deploy & Settings

## Build Config

### package.json
- **Name**: krishiai
- **Runtime**: Bun
- **Scripts**: `dev` (port 3000), `build`, `start`, `lint`
- **Dependencies**: React 19, Next.js 16, Leaflet, shadcn/ui (Radix), Tailwind 4, Lucide icons, sonner, zod, react-markdown
- **DevDependencies**: @cloudflare/workers-types, @tailwindcss/postcss, bun-types, eslint, typescript

### next.config.ts
- **Output**: `standalone` (Docker-ready)
- **TypeScript**: `ignoreBuildErrors: true`
- **React Strict Mode**: disabled
- **Images**: unoptimized, remote patterns for Unsplash, Google
- **API Headers**: CORS (Access-Control-Allow-Origin: *), allowed methods

### wrangler.toml
- **Worker name**: krishiai-gateway
- **Entry point**: `src/workers/index.ts`
- **AI binding**: `[ai]` section with `binding = "AI"`
- **Compatibility date**: 2024-12-01
- **Vars**: ENVIRONMENT, ALLOWED_ORIGIN, DEFAULT_MODEL
- **Limits**: 5000ms CPU

### tsconfig.json
- **Target**: ES2017
- **Module**: esnext (bundler)
- **Path alias**: `@/*` → `./src/*`
- **NoEmit**: true
- **Excludes**: `node_modules`, `src/workers` (has own tsconfig)

### tsconfig.worker.json
- **Target**: ES2022
- **Types**: @cloudflare/workers-types
- **Include**: `src/workers/**/*.ts`
- **NoEmit**: true (wrangler handles compilation)

### vercel.json
- **Framework**: nextjs
- **Build**: `bun run build`
- **Install**: `bun install`
- **Region**: hkg1 (Hong Kong)
- **Security Headers**: X-Content-Type-Options, X-Frame-Options, HSTS, Referrer-Policy
- **API Headers**: no-store cache, CORS, nosniff

### tailwind.config.ts
- Uses Tailwind 4
- shadcn/ui compatible theme
- Custom CSS variables for theming

### postcss.config.mjs
- `@tailwindcss/postcss` plugin

### components.json
- shadcn/ui configuration for component generation

## Deployment

| Platform | What | Region |
|----------|------|--------|
| Vercel | Next.js app (all routes) | hkg1 |
| Cloudflare Workers | Edge AI gateway (krishiai-gateway) | Global edge |
| GitHub | Source repo (moniruzjaman/web.krishiai.live) | — |

### Vercel Build Flow
```
bun install → bun run build → .next/standalone output
```

### CF Worker Deploy Flow
```
GitHub Actions (main push) → bun install → wrangler deploy → krishiai-gateway.worker.dev
```

## Caddyfile
- Local dev reverse proxy config

## .gitignore Highlights
- `/skills/`, `/agent-ctx/`, `/upload/`, `/download/` excluded
- `.env*` excluded (env vars for CF AI, Gemini, Groq, OpenRouter)
- `/worklog.md` excluded
- `.wrangler/` excluded (worker dev state)

## Environment Variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `CF_ACCOUNT_ID` | unset | Cloudflare Workers AI account ID (required for REST path) |
| `CF_API_TOKEN` | unset | Cloudflare Workers AI API token (required for REST path) |
| `CF_GATEWAY_URL` | unset | Edge gateway URL (enables fast path, e.g., https://api.krishiai.live) |
| `DATABASE_URL` | `file:/home/z/my-project/db/custom.db` | SQLite path (unused in production) |
| `GEMINI_API_KEY` | unset | Gemini diagnosis fallback |
| `GROQ_API_KEY` | unset | Groq diagnosis fallback |
| `OPENROUTER_API_KEY` | unset | OpenRouter diagnosis fallback |

Primary AI (Cloudflare Workers AI) requires `CF_ACCOUNT_ID` + `CF_API_TOKEN`. The edge gateway path requires `CF_GATEWAY_URL` to be set in Vercel. Optional keys (Gemini, Groq, OpenRouter) enhance diagnosis waterfall but are not required.
