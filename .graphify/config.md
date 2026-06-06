# Configuration — Build, Deploy & Settings

## Build Config

### package.json
- **Name**: krishiai
- **Runtime**: Bun
- **Scripts**: `dev` (port 3000), `build`, `start`, `lint`
- **19 dependencies**: React 19, Next.js 16, Leaflet, z-ai-web-dev-sdk, shadcn/ui (Radix), Tailwind 4, Lucide icons, sonner, zod, react-markdown

### next.config.ts
- **Output**: `standalone` (Docker-ready)
- **TypeScript**: `ignoreBuildErrors: true`
- **React Strict Mode**: disabled
- **Images**: unoptimized, remote patterns for Unsplash, Google
- **API Headers**: CORS (Access-Control-Allow-Origin: *), allowed methods

### vercel.json
- **Framework**: nextjs
- **Build**: `bun run build`
- **Install**: `bun install`
- **Region**: hkg1 (Hong Kong)
- **Security Headers**: X-Content-Type-Options, X-Frame-Options, HSTS, Referrer-Policy
- **API Headers**: no-store cache, CORS, nosniff

### tsconfig.json
- **Target**: ES2017
- **Module**: esnext (bundler)
- **Path alias**: `@/*` → `./src/*`
- **NoEmit**: true
- **NoImplicitAny**: false (relaxed)

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
| Cloudflare Workers | API gateway (api.krishiai.live) | Global edge |
| GitHub | Source repo (moniruzjaman/web.krishiai.live) | — |

### Vercel Build Flow
```
bun install → bun run build → .next/standalone output
```

## Caddyfile
- Local dev reverse proxy config

## wrangler.toml
- Cloudflare Workers deployment config for API gateway

## .gitignore Highlights
- `/skills/`, `/agent-ctx/`, `/upload/`, `/download/` excluded
- `.env*` excluded (DATABASE_URL only env var)
- `/worklog.md` excluded

## Environment Variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `DATABASE_URL` | `file:/home/z/my-project/db/custom.db` | SQLite path (unused in production) |
| `GEMINI_API_KEY` | unset | Gemini diagnosis fallback |
| `GROQ_API_KEY` | unset | Groq diagnosis fallback |
| `OPENROUTER_API_KEY` | unset | OpenRouter diagnosis fallback |

All features work WITHOUT any env variables set. Optional keys only enhance the diagnosis waterfall.
