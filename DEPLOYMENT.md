# Krishi AI — Vercel Deployment Guide

## What This Patch Fixes

| Problem | Root Cause | Fix |
|---|---|---|
| `krishiai-three.vercel.app` returns 404 | Missing SPA rewrite rules | `vercel.json` rewrites `/*` → `/index.html` |
| AI calls return `analysis failed` | Netlify functions don't run on Vercel | New `api/analyze.js` Vercel serverless function |
| `tsc` build fails | `tsconfig.json` included Expo/backend folders | Excluded `krishi-ai-expo`, `backend`, `project_backup` |
| Blank page on refresh | No SPA fallback routing | Vercel rewrite rule added |
| Bengali text renders with system font | No font loaded | Hind Siliguri loaded in `index.html` |

---

## 1. Apply the Patch to the Repo

Copy every file from this patch into the repo root, **overwriting** the files listed below:

```
vercel.json          ← replaces existing
vite.config.ts       ← replaces existing
package.json         ← replaces existing
tsconfig.json        ← replaces existing
index.html           ← replaces existing
vite-env.d.ts        ← replaces existing
.env.example         ← replaces existing
.gitignore           ← replaces existing

api/analyze.js       ← NEW (create api/ folder if missing)

src/main.tsx         ← NEW (replaces root-level index.tsx)
src/App.tsx          ← NEW
src/index.css        ← NEW

src/services/
  aiService.ts       ← NEW (replaces any existing AI service files)

src/components/
  Layout.tsx         ← NEW
  Layout.module.css  ← NEW

src/pages/
  Home.tsx           ← NEW
  Home.module.css    ← NEW
  Chat.tsx           ← NEW
  Chat.module.css    ← NEW
  Analyzer.tsx       ← NEW
  Analyzer.module.css← NEW
  NotFound.tsx       ← NEW

public/
  manifest.json      ← replaces existing
  favicon.svg        ← replaces existing
  sw.js              ← replaces existing
```

**Remove** if present (not needed on Vercel):
```
netlify/             ← delete entire folder
netlify.toml         ← delete if present
```

---

## 2. Install Dependencies

```bash
npm install
```

---

## 3. Test Locally

```bash
npm run dev
```

Open `http://localhost:5173` — verify:
- [ ] Home page loads
- [ ] `/chat` loads
- [ ] `/analyzer` loads
- [ ] Refreshing any route stays on that page (no 404)

> **AI calls in local dev** will hit the Vite proxy (`/api` → `localhost:3001`).
> To test the full AI path locally, run a local Node server or use `vercel dev`.

---

## 4. Add Environment Variables in Vercel

In your Vercel dashboard:
`Project → Settings → Environment Variables`

| Name | Value | Required |
|---|---|---|
| `GEMINI_API_KEY` | Your Google AI Studio key | Recommended |
| `OPENROUTER_API_KEY` | Your OpenRouter key | Optional fallback |

> Without any keys the app still works — the rule-based fallback responds in Bengali.

---

## 5. Deploy

```bash
git add .
git commit -m "fix: Vercel deployment — SPA routing, AI API, clean build"
git push origin main
```

Vercel auto-deploys on push. Watch the build log at:
`https://vercel.com/moniruzjaman/krishiai`

Build command Vercel will run: `npm run build`  
Output directory: `dist/`

---

## 6. Verify Deployment

After deploy completes, test:

```
https://krishiai-three.vercel.app/          → Home page
https://krishiai-three.vercel.app/chat      → AI Chat
https://krishiai-three.vercel.app/analyzer  → Crop Analyzer
https://krishiai-three.vercel.app/chat      → refresh → stays on /chat (not 404)
```

Post a message in `/chat` — should get a Bengali response via Gemini or rule-based fallback.

---

## Architecture

```
Browser
  │
  ├─ GET /            → dist/index.html  (Vite SPA build)
  ├─ GET /chat        → dist/index.html  (SPA rewrite)
  ├─ GET /analyzer    → dist/index.html  (SPA rewrite)
  │
  └─ POST /api/analyze
       │
       ├─ 1. Gemini 2.0 Flash   (GEMINI_API_KEY)
       ├─ 2. Gemini 1.5 Flash   (OPENROUTER_API_KEY, fallback)
       └─ 3. Rule-based Bengali (always works, zero cost)
```

---

## Keeping the Expo App Separate

The `krishi-ai-expo/` folder in this repo is the separate mobile app.
It is excluded from the web build via `tsconfig.json` and Vercel only
reads `dist/` — so there is no conflict.
