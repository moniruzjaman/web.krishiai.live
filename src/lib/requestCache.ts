interface CacheEntry<V> {
  value: V;
  expiresAt: number;
  seq: number;
}

const store = new Map<string, CacheEntry<unknown>>();
let seqCounter = 0;

function envInt(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

const TTL_MS = envInt('AI_CACHE_TTL_MS', 60_000);
const MAX_ENTRIES = envInt('AI_CACHE_MAX', 256);

export function cacheGet<V>(key: string): V | undefined {
  const entry = store.get(key);
  if (!entry) return undefined;
  if (Date.now() >= entry.expiresAt) {
    store.delete(key);
    return undefined;
  }
  entry.seq = ++seqCounter;
  return entry.value as V;
}

export function cacheSet<V>(key: string, value: V, ttlMs: number = TTL_MS): void {
  if (store.size >= MAX_ENTRIES) {
    gc();
    if (store.size >= MAX_ENTRIES) {
      let oldestKey: string | null = null;
      let oldestSeq = Infinity;
      for (const [k, v] of store.entries()) {
        if (v.seq < oldestSeq) {
          oldestSeq = v.seq;
          oldestKey = k;
        }
      }
      if (oldestKey) store.delete(oldestKey);
    }
  }

  store.set(key, {
    value,
    expiresAt: Date.now() + ttlMs,
    seq: ++seqCounter,
  });
}

export function gc(): number {
  let pruned = 0;
  const now = Date.now();
  for (const [k, v] of store.entries()) {
    if (now >= v.expiresAt) {
      store.delete(k);
      pruned++;
    }
  }
  return pruned;
}

export function cacheStats(): { size: number; maxEntries: number; ttlMs: number } {
  return { size: store.size, maxEntries: MAX_ENTRIES, ttlMs: TTL_MS };
}

export function buildCacheKey(parts: unknown[]): string {
  const json = stableJson(parts);
  return 'k:' + fnv1a(json);
}

function stableJson(v: unknown): string {
  if (v === null || typeof v !== 'object') return JSON.stringify(v);
  if (Array.isArray(v)) return '[' + v.map(stableJson).join(',') + ']';
  const obj = v as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return '{' + keys.map(k => JSON.stringify(k) + ':' + stableJson(obj[k])).join(',') + '}';
}

function fnv1a(str: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
  }
  return h.toString(36);
}
