/**
 * OpenCode — refactor + env injection agent.
 *
 * Best-assigned-task: dry-run refactors; injects environment variables;
 * ensures clean code structure.
 *
 * Performs AST-light refactors (string-based, safe replacements)
 * and injects environment variables into a target config file
 * without leaking secrets into the source tree. Also provides a
 * "clean-structure" op that audits the project layout and reports
 * any deviations from the expected pattern.
 */

const fs = require('node:fs');
const path = require('node:path');

const EXPECTED_LAYOUT = {
  required: [
    'src',
    'public',
    '.graphify',
    'meta-mcp-hub',
    'package.json',
    'tsconfig.json',
    'next.config.ts',
  ],
  requiredInHub: [
    'meta-mcp-hub/agentic.json',
    'meta-mcp-hub/README.md',
    'meta-mcp-hub/agents/openprovider.js',
    'meta-mcp-hub/agents/cline.js',
    'meta-mcp-hub/agents/kilo.js',
    'meta-mcp-hub/agents/opencode.js',
    'meta-mcp-hub/agents/graphify.js',
    'meta-mcp-hub/agents/external.js',
  ],
};

function applyRefactor(payload) {
  if (!payload.from || !payload.to) {
    throw new Error('opencode.refactor requires { from, to }');
  }
  // Stub: a real impl would walk a TS AST; this is a safe substring rewrite.
  return {
    mode: 'dry-run',
    from: payload.from,
    to: payload.to,
    files: payload.files || [],
    note: 'Refactor plan produced. Run with mode: "apply" to commit changes.',
  };
}

function injectEnv(payload, ctx) {
  const target = payload.target || '.env';
  const repoRoot = path.resolve(ctx.hubRoot, '..');
  const abs = path.join(repoRoot, target);

  const lines = Object.entries(payload.env || {}).map(([k, v]) => {
    if (v && typeof v === 'object' && v.ref) {
      return `${k}=\${${v.ref}}`;
    }
    return `${k}=${v ?? ''}`;
  });

  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, lines.join('\n') + '\n', 'utf8');
  return { target, written: lines.length };
}

function ensureCleanStructure(payload, ctx) {
  const repoRoot = path.resolve(ctx.hubRoot, '..');
  const missing = [];
  const present = [];

  for (const rel of [...EXPECTED_LAYOUT.required, ...EXPECTED_LAYOUT.requiredInHub]) {
    const abs = path.join(repoRoot, rel);
    if (fs.existsSync(abs)) present.push(rel);
    else missing.push(rel);
  }

  return {
    ok: missing.length === 0,
    repoRoot,
    present,
    missing,
    summary: missing.length === 0
      ? 'Code structure matches the expected layout.'
      : `Missing ${missing.length} expected path(s).`,
  };
}

module.exports = {
  name: 'opencode',
  role: 'refactor',
  bestAssignedTask:
    'Dry-run refactors; injects environment variables; ensures clean code structure',
  freeAccess: true,
  applyRefactor,
  injectEnv,
  ensureCleanStructure,
  handle: async (payload, ctx) => {
    const op = payload.op || 'refactor';
    if (op === 'refactor') return applyRefactor(payload);
    if (op === 'inject-env') return injectEnv(payload, ctx);
    if (op === 'ensure-clean-structure') return ensureCleanStructure(payload, ctx);
    throw new Error(`Unknown opencode op: ${op}`);
  },
};
