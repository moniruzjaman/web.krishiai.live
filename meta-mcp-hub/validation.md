# meta-mcp-hub — Validation + Auto-Fix Checklist

This checklist is the single source of truth for validating the `meta-mcp-hub` orchestration layer. It is consumed by the **OpenProvider** agent in two intents:

- `validate` — runs each check, prints results, exits non-zero on failure.
- `validate-and-fix` — runs each check and, where safe, applies automatic fixes (e.g. injecting missing env keys, syncing DB schema, regenerating workflows).

The checklist is printed at the start of every CI/CD run for visibility.

---

## 1. DB schema check

- [ ] `prisma migrate status` reports the database is up to date.
- [ ] No pending migrations in `prisma/migrations/`.
- [ ] Generated client matches the schema (`prisma generate` succeeds).
- **Auto-fix**: run `prisma migrate deploy` and `prisma generate`.

## 2. Env injection check (`.env` vs `.env.example`)

- [ ] `meta-mcp-hub/.env` exists.
- [ ] Every key in `meta-mcp-hub/.env.example` is present in `meta-mcp-hub/.env`.
- [ ] No key in `.env` is missing from `.env.example` (drift detection).
- [ ] Required keys present: `DATABASE_URL`, `NEXTAUTH_SECRET`, `API_KEY`, `ANTHROPIC_API_KEY`, `KIMI_API_KEY`, `ZAI_API_KEY`.
- **Auto-fix**: copy missing keys from `.env.example` into `.env` with empty values; emit a warning for unset secrets.

## 3. DB connection health check (`SELECT 1`)

- [ ] Postgres reachable on `DATABASE_URL`.
- [ ] `SELECT 1` returns 1.
- [ ] Connection pool responds within 2s.
- **Auto-fix**: none (fail loudly if unreachable).

## 4. Agent role validation

- [ ] **OpenProvider** exposes `pickAgent`, `routeFree`, `validate`, `validate-and-fix` (free routing enabled).
- [ ] **Cline** exposes `read`, `write`, `syncSchema`; restricted to `src/`, `public/`, `.graphify/`, `meta-mcp-hub/`.
- [ ] **Kilo** exposes `plan`, `apply`, `emit-workflows`; CI/CD YAML files present in `meta-mcp-hub/workflows/`.
- [ ] **OpenCode** exposes `refactor`, `injectEnv`, `ensureCleanStructure`; `ensureCleanStructure` passes.
- [ ] **Graphify** exposes `build`, `query`, `export`; `.graphify/{nodes,edges}.jsonl` exist or are exportable.
- **Auto-fix**: regenerate missing `external.js` exports, run `syncSchema`, run `emit-workflows`, run `export`.

## 5. Workflow verification

- [ ] CI workflow (`meta-mcp-hub/workflows/github-ci.yml`) runs `lint`, `typecheck`, `test`, `build`, and the **Validate meta-mcp-hub** step.
- [ ] CD workflow (`meta-mcp-hub/workflows/github-deploy.yml`) runs **Run validation and auto-fix** before deploy on `main`.
- [ ] Vercel preview workflow (`meta-mcp-hub/workflows/vercel-preview.yml`) deploys a preview per PR.
- [ ] All three workflows are symlinked/copied into `.github/workflows/`.
- **Auto-fix**: run `kilo emit-workflows` to regenerate missing YAMLs and copy them into `.github/workflows/`.

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
