# Environment Variables

## Required (set in Vercel)
| Variable | Purpose | Example |
|----------|---------|---------|
| `CF_ACCOUNT_ID` | Cloudflare account ID | `4a2230e3...` |
| `CF_API_TOKEN` | Cloudflare API token | `cfut_KH6a...` |

## Optional (enhance diagnose waterfall)
| Variable | Purpose | Provider |
|----------|---------|----------|
| `GEMINI_API_KEY` | Google Gemini 2.5 Flash | Vision-capable diagnosis |
| `GROQ_API_KEY` | Groq Llama 4 Scout | Text-only diagnosis |
| `OPENROUTER_API_KEY` | OpenRouter Qwen-VL | Vision-capable diagnosis |

## Local Development
Create `.env.local`:
```
CF_ACCOUNT_ID=your_account_id
CF_API_TOKEN=your_api_token
```

**Note:** `.env.local` is gitignored. Never commit credentials.

## Database
| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | SQLite path (local only, `file:/home/z/my-project/db/custom.db`) |
