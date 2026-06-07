# Environment Variables

## Required (set in Vercel)
| Variable | Purpose | Example |
|----------|---------|---------|
| `CF_ACCOUNT_ID` | Cloudflare account ID (for REST API path) | `4a2230e3...` |
| `CF_API_TOKEN` | Cloudflare API token (for REST API path) | `cfut_KH6a...` |

## Optional (AI routing)
| Variable | Purpose | Notes |
|----------|---------|-------|
| `CF_GATEWAY_URL` | Edge gateway URL (enables fast path) | e.g., `https://webkrishiailive.krishiai.live` or `https://webkrishiailive.xxx.workers.dev` |

## Optional (enhance diagnose waterfall)
| Variable | Purpose | Provider |
|----------|---------|----------|
| `GEMINI_API_KEY` | Google Gemini 2.5 Flash | Vision-capable diagnosis |
| `GROQ_API_KEY` | Groq Llama 4 Scout | Text-only diagnosis |
| `OPENROUTER_API_KEY` | OpenRouter Qwen-VL | Vision-capable diagnosis |

## GitHub Secrets (for CI/CD)
| Secret | Purpose |
|--------|---------|
| `CLOUDFLARE_API_TOKEN` | Used by `wrangler deploy` in GitHub Actions |

## Local Development
Create `.env.local`:
```
CF_ACCOUNT_ID=your_account_id
CF_API_TOKEN=your_api_token
CF_GATEWAY_URL=http://localhost:8787  # for wrangler dev
```

**Note:** `.env.local` is gitignored. Never commit credentials.

## Database
| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | SQLite path (local only, `file:/home/z/my-project/db/custom.db`) |

## AI Routing Logic
```
if CF_GATEWAY_URL is set:
  1. Try CF Gateway (native AI binding, fast) → POST CF_GATEWAY_URL/api/chat
  2. On failure → fall back to direct REST API
else:
  1. Direct REST API only → POST api.cloudflare.com/.../ai/run
```
