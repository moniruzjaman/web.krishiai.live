/**
 * Cline — file editor + DB schema agent.
 *
 * Best-assigned-task: safe read/write under src/, public/, .graphify/,
 * meta-mcp-hub/; generates and syncs the PWA DB schema.
 *
 * Provides safe read/write helpers for repo files and a minimal
 * SQLite-style schema descriptor used by the krishiai.live PWA
 * (deficiency, disease, pest, crop reference data).
 */

const fs = require('node:fs');
const path = require('node:path');

const ALLOWED_ROOTS = ['src', 'public', '.graphify', 'meta-mcp-hub'];

function resolveSafe(relPath, hubRoot) {
  const repoRoot = path.resolve(hubRoot, '..');
  const abs = path.resolve(repoRoot, relPath);
  if (!ALLOWED_ROOTS.some((root) => abs.startsWith(path.join(repoRoot, root)))) {
    throw new Error(`Refused to access path outside allowed roots: ${relPath}`);
  }
  return abs;
}

function readFile(payload, ctx) {
  const abs = resolveSafe(payload.path, ctx.hubRoot);
  return { path: payload.path, content: fs.readFileSync(abs, 'utf8') };
}

function writeFile(payload, ctx) {
  const abs = resolveSafe(payload.path, ctx.hubRoot);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, payload.content ?? '', 'utf8');
  return { path: payload.path, bytes: Buffer.byteLength(payload.content ?? '') };
}

// Minimal schema descriptor for the PWA reference DB
const SCHEMA = {
  version: 1,
  tables: {
    crops: {
      pk: 'id',
      columns: ['id', 'name_en', 'name_bn', 'scientific', 'family'],
    },
    deficiency: {
      pk: 'id',
      columns: ['id', 'crop_id', 'nutrient', 'symptoms', 'remedy', 'image'],
    },
    disease: {
      pk: 'id',
      columns: ['id', 'crop_id', 'name', 'pathogen', 'symptoms', 'treatment', 'image'],
    },
    pest: {
      pk: 'id',
      columns: ['id', 'crop_id', 'name', 'symptoms', 'control', 'image'],
    },
  },
};

function syncSchema(payload) {
  // The PWA DB is currently described (declarative); a real deployment
  // would generate SQL DDL from SCHEMA and apply it. Here we emit a
  // sync plan that downstream tools (Kilo / CI) can execute.
  const tables = Object.keys(SCHEMA.tables);
  const ddl = tables
    .map((t) => {
      const def = SCHEMA.tables[t];
      return `CREATE TABLE IF NOT EXISTS ${t} (${def.columns.map((c) => `${c} TEXT`).join(', ')}, PRIMARY KEY(${def.pk}));`;
    })
    .join('\n');
  return {
    ok: true,
    version: SCHEMA.version,
    tables,
    ddl,
    target: payload.target || 'pwa',
    mode: payload.mode || 'plan', // 'plan' | 'apply'
  };
}

module.exports = {
  name: 'cline',
  role: 'file-editor',
  bestAssignedTask:
    'Safe read/write under src/, public/, .graphify/, meta-mcp-hub/; generates and syncs DB schema',
  freeAccess: true,
  schema: SCHEMA,
  readFile,
  writeFile,
  syncSchema,
  handle: async (payload, ctx) => {
    const op = payload.op || 'readFile';
    if (op === 'readFile') return readFile(payload, ctx);
    if (op === 'writeFile') return writeFile(payload, ctx);
    if (op === 'describeSchema') return SCHEMA;
    if (op === 'syncSchema') return syncSchema(payload);
    throw new Error(`Unknown cline op: ${op}`);
  },
};
