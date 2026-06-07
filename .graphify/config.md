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
- **React Strict Mode**: true
- **Images**: unoptimized, remote patterns for Unsplash, Google
- **API Headers**: CORS (Access-Control-Allow-Origin: https://krishiai.live), allowed methods
- **SW Headers**: Cache-Control + Service-Worker-Allowed for /sw.js

### tsconfig.json
- **Target**: ES2017
- **Module**: esnext (bundler)
- **Path alias**: `@/*` → `./src/*`
- **NoEmit**: true

### vercel.json
- **Framework**: nextjs
- **Build**: `bun run build`
- **Install**: `bun install`
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
| Vercel | Next.js app (all routes) | iad1 (auto) |
| GitHub | Source repo (moniruzjaman/web.krishiai.live) | — |

### Vercel Build Flow
```
bun install → bun run build → .next output
Vercel Git integration auto-deploys from v4.0 branch
```

## .gitignore Highlights
- `/skills/`, `/agent-ctx/`, `/upload/`, `/download/` excluded
- `.env*` excluded (env vars for CF AI, Gemini, Groq, OpenRouter)
- `/worklog.md` excluded

## Environment Variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `CF_ACCOUNT_ID` | unset | Cloudflare Workers AI account ID (required for REST path) |
| `CF_API_TOKEN` | unset | Cloudflare Workers AI API token (required for REST path) |
| `DATABASE_URL` | `file:/home/z/my-project/db/custom.db` | SQLite path (unused in production) |
| `GEMINI_API_KEY` | unset | Gemini diagnosis fallback |
| `GROQ_API_KEY` | unset | Groq diagnosis fallback |
| `OPENROUTER_API_KEY` | unset | OpenRouter diagnosis fallback |

Primary AI (Cloudflare Workers AI) requires `CF_ACCOUNT_ID` + `CF_API_TOKEN`. Optional keys (Gemini, Groq, OpenRouter) enhance diagnosis waterfall but are not required.
