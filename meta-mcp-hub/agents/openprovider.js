/**
 * OpenProvider — top-level orchestrator wrapper for the meta-mcp-hub.
 *
 * Responsibilities:
 *   - Load the agentic.json registry
 *   - Route incoming tasks to the correct local agent
 *   - Fan out multi-agent tasks and aggregate results
 *   - Route free-tier external model calls to Claude, Kimi, and Z.ai
 *   - Provide a single MCP-compatible entrypoint
 *
 * Free routing rules:
 *   - Intent "reasoning"      → claude
 *   - Intent "presentation"   → kimi
 *   - Intent "automation"     → z-ai
 *   - Intent "model" with payload.model / payload.agent picks that model
 *   - Capability hints (e.g. "compliance-check") also resolve a model
 */

const fs = require('node:fs');
const path = require('node:path');

const HUB_ROOT = path.resolve(__dirname, '..');
const REGISTRY_PATH = path.join(HUB_ROOT, 'agentic.json');
const EXTERNAL_MODULE = require('./external.js');

const FREE_MODEL_ROLES = {
  reasoning: 'claude',
  presentation: 'kimi',
  automation: 'z-ai',
};

function loadRegistry() {
  const raw = fs.readFileSync(REGISTRY_PATH, 'utf8');
  return JSON.parse(raw);
}

function pickAgent(registry, intent) {
  const agents = registry.agents || {};
  // Skip external models — they have their own pickModel()
  for (const [name, def] of Object.entries(agents)) {
    if (def.model) continue;
    if (def.role === intent) return { name, ...def };
  }
  for (const [name, def] of Object.entries(agents)) {
    if (def.model) continue;
    if ((def.capabilities || []).includes(intent)) return { name, ...def };
  }
  return null;
}

function pickFreeModel(registry, intent) {
  if (!intent) return null;
  const byRole = FREE_MODEL_ROLES[intent];
  if (byRole) {
    const def = (registry.agents || {})[byRole];
    if (def) return { name: byRole, ...def };
  }
  return EXTERNAL_MODULE.pickModel(registry, intent);
}

async function dispatch(task) {
  const registry = loadRegistry();
  const intent = task && task.intent;

  // Free external model routing
  const freeModel = pickFreeModel(registry, intent);
  if (freeModel) {
    const result = await EXTERNAL_MODULE.handle(
      { ...(task.payload || {}), model: freeModel.name, role: freeModel.role },
      { registry, hubRoot: HUB_ROOT }
    );
    return { agent: freeModel.name, intent, routedVia: 'openprovider', result };
  }

  // Local agent routing
  const target = pickAgent(registry, intent);
  if (!target) {
    throw new Error(`No agent registered for intent: ${intent}`);
  }
  const agentPath = path.join(HUB_ROOT, target.file);
  const agent = require(agentPath);
  const result = await agent.handle(task.payload || {}, { registry, hubRoot: HUB_ROOT });
  return { agent: target.name, intent, result };
}

async function fanout(tasks) {
  const results = await Promise.all(tasks.map((t) => dispatch(t)));
  return { count: results.length, results };
}

module.exports = {
  name: 'openprovider',
  loadRegistry,
  pickAgent,
  pickFreeModel,
  dispatch,
  fanout,
  handle: async (payload, ctx) => {
    if (payload && Array.isArray(payload.tasks)) {
      return fanout(payload.tasks);
    }
    const intent = (payload && payload.intent) || 'orchestrator';
    return dispatch({ intent, payload });
  },
};

if (require.main === module) {
  const taskArg = process.argv[2] ? JSON.parse(process.argv[2]) : { intent: 'graph-build' };
  dispatch(taskArg)
    .then((r) => console.log(JSON.stringify(r, null, 2)))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
