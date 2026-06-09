/**
 * External — free-tier model router for Claude, Kimi, and Z.ai.
 *
 * Exposes a single `handle(payload, ctx)` entrypoint that delegates to
 * the model named in payload.model (or the agent name passed via the
 * orchestrator). Real HTTP calls are stubbed so the hub can run offline;
 * a real deployment would swap `callProvider` for an HTTP client.
 *
 * Routing is always funneled through OpenProvider, which is why the
 * README lists these as "Claude (via OpenProvider)", etc.
 */

const fs = require('node:fs');
const path = require('node:path');

const REGISTRY_PATH = path.resolve(__dirname, '..', 'agentic.json');

function loadRegistry() {
  return JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf8'));
}

function pickModel(registry, hint) {
  // Resolve a hint like "claude", "kimi", "z-ai", or a role like
  // "reasoning"/"presentation"/"automation" to a registered model agent.
  if (!hint) return null;
  const lc = String(hint).toLowerCase();
  for (const [name, def] of Object.entries(registry.agents || {})) {
    if (!def.model) continue;
    if (name === lc) return { name, ...def };
  }
  for (const [name, def] of Object.entries(registry.agents || {})) {
    if (!def.model) continue;
    if (def.role === lc) return { name, ...def };
  }
  for (const [name, def] of Object.entries(registry.agents || {})) {
    if (!def.model) continue;
    if ((def.capabilities || []).includes(lc)) return { name, ...def };
  }
  return null;
}

/**
 * Stub call to the underlying provider. Replace with real fetch()
 * when the corresponding API key is set in the environment.
 */
async function callProvider(modelDef, prompt) {
  return {
    ok: true,
    mocked: true,
    provider: modelDef.provider,
    model: modelDef.model,
    promptBytes: Buffer.byteLength(prompt || ''),
    note: `Stub call to ${modelDef.provider}:${modelDef.model}. Wire fetch() to enable real traffic.`,
  };
}

async function handle(payload, ctx) {
  const registry = (ctx && ctx.registry) || loadRegistry();
  const hint = (payload && payload.model) || (payload && payload.agent);
  const target = pickModel(registry, hint) || pickModel(registry, payload && payload.role);

  if (!target) {
    return {
      ok: false,
      error: `No free-tier model matched hint: ${hint}. Try {model: "claude|kimi|z-ai"} or {role: "reasoning|presentation|automation"}.`,
    };
  }

  const prompt = (payload && payload.prompt) || (payload && payload.input) || '';
  const response = await callProvider(target, prompt);

  return {
    ok: true,
    agent: target.name,
    model: target.model,
    provider: target.provider,
    role: target.role,
    routedVia: target.routedVia || 'openprovider',
    freeAccess: target.freeAccess !== false,
    response,
  };
}

module.exports = {
  name: 'external',
  pickModel,
  handle,
};

// CLI: `node external.js '{"model":"claude","prompt":"hi"}'`
if (require.main === module) {
  const arg = process.argv[2] ? JSON.parse(process.argv[2]) : { model: 'claude', prompt: 'hello' };
  handle(arg, {})
    .then((r) => console.log(JSON.stringify(r, null, 2)))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
