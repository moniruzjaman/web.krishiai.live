---
Task ID: 1
Agent: Main Agent
Task: Fix .gov.bd portal news display and ensure latest/today's news showing

Work Log:
- Analyzed current project: Vite + React (NOT Next.js), deployed on Vercel with serverless functions
- Identified core problem: All BD government portals (portal.gov.bd) and newspaper RSS feeds return 403 from datacenter IPs
- Rewrote api/news.js with smart multi-source architecture:
  - Google News RSS as primary source (aggregates from .gov.bd + all BD newspapers)
  - site:gov.bd queries for government agriculture news
  - Bengali queries for Bangla agriculture news
  - English queries for English agriculture news
  - Bing News as secondary source
  - Direct portal.gov.bd attempts (graceful 403 fallback)
  - AI daily bulletin via Gemini 2.5 Flash
  - Seasonal fallback from BD agricultural calendar
- Fixed keyword filter bugs:
  - Removed "সার" (matches "সারাদেশ" = whole country)
  - Removed "গম" (matches "গমিন" = name)
  - Removed "মৌসুম" (matches "ওমরাহ মৌসুম" = Umrah season)
  - Used compound words instead (e.g., "গম চাষ", "বোরো মৌসুম")
- Removed redundant direct Prothom Alo RSS (Google News already indexes it with better filtering)
- Updated NewsWidget with 4 tabs: Bulletin, সরকারি (Gov), বাংলা (Bangla), English
- Added freshness indicators (today/yesterday/recent/older badges)
- Added "আজ" (today) badge on items published today
- Added "সরকারি" (official) badge for government-sourced items
- Added source attribution with full organization names
- Added today's news count badges on tabs
- Updated CSS with new styles for badges, scrollable tabs, today's highlight
- Verified API returns: 25 Gov + 25 Bangla + 25 English items
- Build successful with Vite

Stage Summary:
- api/news.js completely rewritten with Google News RSS multi-source architecture
- HomeSections.tsx NewsWidget updated with 4 tabs and rich display
- HomeSections.module.css updated with new styles
- All agriculture news properly filtered, no non-agri articles leaking
- Auto-update daily: client caches in localStorage keyed by date + server 4hr edge cache
- Build verified: vite build succeeds
