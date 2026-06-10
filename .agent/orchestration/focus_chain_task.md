# Focus Chain List for Task 1780984068630

<!-- Edit this markdown file to update your focus chain list -->
<!-- Use the format: - [ ] for incomplete items and - [x] for completed items -->

- [x] Create `meta-mcp-hub` root folder
- [x] Create `agentic.json` orchestration config
- [x] Create `/agents/openprovider.js` orchestrator wrapper
- [x] Create `/agents/cline.js` file editor + DB schema
- [x] Create `/agents/kilo.js` infra + CI/CD setup
- [x] Create `/agents/opencode.js` refactor + env injection
- [x] Create `/agents/graphify.js` visualization layer
- [x] Create `/.env.example` with placeholders
- [x] Create `/README.md` with run instructions
- [x] Create `/workflows/` CI/CD YAML files (GitHub Actions, Vercel)
- [x] Place `meta-mcp-hub/` at project root, just below `.graphify/`
- [x] Register free external models (Claude / Kimi / Z.ai) in `agentic.json`
- [x] Add `/agents/external.js` free-tier model router
- [x] Wire OpenProvider to free-route by role (reasoning → Claude, presentation → Kimi, automation → Z.ai)
- [x] Add Cline `syncSchema` op (generates + syncs DB schema)
- [x] Add OpenCode `ensure-clean-structure` op (audits repo layout)
- [x] Update `.env.example` with `ANTHROPIC_API_KEY` / `KIMI_API_KEY` / `ZAI_API_KEY`
- [x] Verify all 8 agents route through OpenProvider
- [x] Create `meta-mcp-hub/validation.md` with the validation + auto-fix checklist
- [x] Add `Validate meta-mcp-hub` step to `meta-mcp-hub/workflows/github-ci.yml`
- [x] Add `Run validation and auto-fix` step to `meta-mcp-hub/workflows/github-deploy.yml`
- [x] Add free `routing` block (`provider: openprovider-agent`, `mode: free`) to `agentic.json`
- [x] Add `Validation + Auto-Fix: Passing` status badge to `meta-mcp-hub/README.md`

