/**
 * Graphify — visualization layer for the .graphify knowledge graph.
 *
 * Reads JSONL nodes/edges from ../.graphify and exposes:
 *   - buildGraph(): aggregate into { nodes, edges }
 *   - queryGraph(): simple node/edge filter
 *   - exportForWeb(): shape for the PWA dashboard
 */

const fs = require('node:fs');
const path = require('node:path');

const DATA_DIRS = ['.graphify'];

function dataDir(hubRoot) {
  const repoRoot = path.resolve(hubRoot, '..');
  for (const d of DATA_DIRS) {
    const p = path.join(repoRoot, d);
    if (fs.existsSync(p)) return p;
  }
  return path.join(repoRoot, '.graphify');
}

function readJsonl(file) {
  if (!fs.existsSync(file)) return [];
  return fs
    .readFileSync(file, 'utf8')
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

function buildGraph(_, ctx) {
  const dir = dataDir(ctx.hubRoot);
  const nodes = readJsonl(path.join(dir, 'nodes.jsonl'));
  const edges = readJsonl(path.join(dir, 'edges.jsonl'));
  return { dir, nodes, edges, count: { nodes: nodes.length, edges: edges.length } };
}

function queryGraph(payload, ctx) {
  const g = buildGraph(null, ctx);
  const nodeFilter = payload.nodeFilter || (() => true);
  const edgeFilter = payload.edgeFilter || (() => true);
  return {
    nodes: g.nodes.filter(nodeFilter),
    edges: g.edges.filter(edgeFilter),
  };
}

function exportForWeb(_, ctx) {
  const g = buildGraph(null, ctx);
  return {
    servedAt: '/api/graphify',
    generatedAt: new Date().toISOString(),
    nodes: g.nodes.map((n) => ({ id: n.id, label: n.label, type: n.type })),
    edges: g.edges.map((e) => ({ source: e.source, target: e.target, kind: e.kind })),
  };
}

module.exports = {
  name: 'graphify',
  buildGraph,
  queryGraph,
  exportForWeb,
  handle: async (payload, ctx) => {
    const op = payload.op || 'export';
    if (op === 'build') return buildGraph(payload, ctx);
    if (op === 'query') return queryGraph(payload, ctx);
    if (op === 'export') return exportForWeb(payload, ctx);
    throw new Error(`Unknown graphify op: ${op}`);
  },
};
