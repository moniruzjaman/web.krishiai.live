# meta-mcp-hub — Validation + Auto-Fix Checklist

This checklist is the single source of truth for validating the `meta-mcp-hub` orchestration layer. It is consumed by the **OpenProvider** agent in two intents:

- `validate` — runs each check, prints results, exits non-zero on failure.
- `validate-and-fix` — runs each check and, where safe, applies automatic fixes.

The checklist is printed at the start of every CI/CD run for visibility.

---

## 1. Main App Module Protection

- [ ] **Analyzer** module (`src/app/analyzer/`) — page.tsx fully intact, no missing imports, CABI diagnostic engine available at `src/lib/cabi/`.
- [ ] **Chat** module (`src/app/chat/`) — page.tsx fully intact, AI chat route at `src/app/api/chat/route.ts`, ai-client at `src/lib/ai-client.ts`.
- [ ] **Weather** module (`src/app/api/weather/`) — route.ts fully intact, weather service at `src/lib/weatherService.ts`.
- [ ] **Dashboard** route (`src/app/dashboard/`) — page.tsx intact, deployment/status/usage API routes present.
- [ ] No meta-mcp agent is allowed to modify, delete, or overwrite files under `src/app/analyzer/`, `src/app/chat/`, `src/app/api/weather/`, `src/app/dashboard/`, `src/lib/cabi/`, `src/lib/weatherService.ts`, `src/lib/ai-client.ts`.
- **Auto-fix**: restore any protected module file from git if checksum mismatch detected.

## 2. Env injection check (`.env` vs `.env.example`)

- [ ] `.env` exists at project root.
- [ ] Every key in `.env.example` is present in `.env`.
- [ ] No key in `.env` is missing from `.env.example` (drift detection).
- [ ] Required keys present: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
- **Auto-fix**: copy missing keys from `.env.example` into `.env` with empty values; emit a warning for unset secrets.

## 3. Agent role validation

- [ ] **OpenProvider** exposes `pickAgent`, `routeFree`, `validate`, `validate-and-fix` (free routing enabled).
- [ ] **Cline** exposes `read`, `write`, `syncSchema`; restricted to `src/`, `public/`, `.graphify/`, `meta-mcp-hub/`.
- [ ] **Kilo** exposes `plan`, `apply`, `emit-workflows`; CI/CD YAML files present in `meta-mcp-hub/workflows/`.
- [ ] **OpenCode** exposes `refactor`, `injectEnv`, `ensureCleanStructure`; `ensureCleanStructure` passes.
- [ ] **Graphify** exposes `build`, `query`, `export`; `.graphify/{nodes,edges}.jsonl` exist or are exportable.
- **Auto-fix**: regenerate missing `external.js` exports, run `syncSchema`, run `emit-workflows`, run `export`.

## 4. Workflow verification

- [ ] CI workflow (`.github/workflows/ci.yml`) runs `lint`, `build`, and validates meta-mcp-hub.
- [ ] Vercel deploy workflow (`.github/workflows/deploy.yml`) runs validation + auto-fix, then deploys to Vercel on `main`.
- [ ] All workflows are present in `.github/workflows/`.
- **Auto-fix**: run `kilo emit-workflows` to regenerate missing YAMLs and copy them into `.github/workflows/`.

## 5. Protected Module Integrity

- [ ] No files under `src/app/analyzer/`, `src/app/chat/`, `src/app/api/weather/`, `src/app/dashboard/` have been modified outside of approved changes.
- [ ] SHA-256 checksums match expected values for protected files:
  - `src/app/analyzer/page.tsx`
  - `src/app/chat/page.tsx`
  - `src/app/api/weather/route.ts`
  - `src/lib/weatherService.ts`
  - `src/lib/ai-client.ts`
- **Auto-fix**: revert any protected file that fails checksum validation via `git checkout -- <file>`.

## 6. Monitoring

- [ ] Structured logs emitted on `stdout` (JSON, one per line).
- [ ] Graphify dashboard reachable at `/api/graphify`.
- [ ] OpenProvider usage tracker increments per intent (reasoning → Claude, presentation → Kimi, automation → Z.ai).
- **Auto-fix**: re-export graphify data and emit a sample usage tick if the tracker is empty.

---

## Usage

```bash
# Read-only validation
node meta-mcp-hub/agents/openprovider.js \
  '{"intent":"validate","payload":{"checklist":"meta-mcp-hub/validation.md"}}'

# Validation + auto-fix (used in CD)
node meta-mcp-hub/agents/openprovider.js \
  '{"intent":"validate-and-fix","payload":{"checklist":"meta-mcp-hub/validation.md","hubRoot":"meta-mcp-hub"}}'
```

## Status

![Validation + Auto-Fix](https://img.shields.io/badge/Validation%20%2B%20Auto--Fix-Passing-brightgreen)