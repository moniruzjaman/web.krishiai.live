type ProviderName = string;

interface CooldownState {
  cooldownUntil: number;
  reason: string;
  consecutive429s: number;
  lastStatus: number;
  updatedAt: number;
}

const states = new Map<ProviderName, CooldownState>();

const BACKOFF_MS = [
  5_000,
  15_000,
  30_000,
  60_000,
  120_000,
];

const MAX_COOLDOWN_MS = 5 * 60_000;

export function isInCooldown(provider: ProviderName): boolean {
  const state = states.get(provider);
  if (!state) return false;
  if (Date.now() >= state.cooldownUntil) return false;
  return true;
}

export function cooldownRemainingMs(provider: ProviderName): number {
  const state = states.get(provider);
  if (!state) return 0;
  return Math.max(0, state.cooldownUntil - Date.now());
}

export function markRateLimited(
  provider: ProviderName,
  opts?: { retryAfterSeconds?: number; status?: number },
): void {
  const now = Date.now();
  const prev = states.get(provider);
  const consecutive = (prev?.consecutive429s ?? 0) + 1;

  let cooldownMs: number;
  let reason: string;

  const retryAfter = opts?.retryAfterSeconds;
  if (retryAfter && retryAfter > 0 && retryAfter <= 300) {
    cooldownMs = Math.min(retryAfter * 1000, MAX_COOLDOWN_MS);
    reason = `429 (Retry-After=${retryAfter}s)`;
  } else {
    const idx = Math.min(consecutive - 1, BACKOFF_MS.length - 1);
    cooldownMs = Math.min(BACKOFF_MS[idx], MAX_COOLDOWN_MS);
    reason = `429 (backoff=${cooldownMs}ms, consecutive=${consecutive})`;
  }

  states.set(provider, {
    cooldownUntil: now + cooldownMs,
    reason,
    consecutive429s: consecutive,
    lastStatus: opts?.status ?? 429,
    updatedAt: now,
  });

  console.warn(`[providerCooldown] ${provider} cooldown ${cooldownMs}ms — ${reason}`);
}

export function markFailure(
  provider: ProviderName,
  opts?: { status?: number; reason?: string },
): void {
  const now = Date.now();
  const prev = states.get(provider);

  const status = opts?.status ?? -1;
  if (status === 429) {
    markRateLimited(provider, opts);
    return;
  }

  const consecutive = (prev?.consecutive429s ?? 0) + 1;
  if (consecutive >= 3) {
    states.set(provider, {
      cooldownUntil: now + 15_000,
      reason: `consecutive failures (${consecutive}) — ${opts?.reason ?? 'unknown'}`,
      consecutive429s: consecutive,
      lastStatus: status,
      updatedAt: now,
    });
    console.warn(`[providerCooldown] ${provider} soft cooldown 15s — ${consecutive} consecutive failures`);
  } else {
    states.set(provider, {
      cooldownUntil: 0,
      reason: opts?.reason ?? `failure #${consecutive}`,
      consecutive429s: consecutive,
      lastStatus: status,
      updatedAt: now,
    });
  }
}

export function markSuccess(provider: ProviderName): void {
  const prev = states.get(provider);
  if (!prev || prev.consecutive429s === 0) return;
  states.set(provider, {
    cooldownUntil: 0,
    reason: 'recovered',
    consecutive429s: 0,
    lastStatus: 200,
    updatedAt: Date.now(),
  });
}

export function getProviderStates(): Array<{
  provider: string;
  inCooldown: boolean;
  remainingMs: number;
  reason: string;
  consecutive429s: number;
  lastStatus: number;
}> {
  const now = Date.now();
  return Array.from(states.entries()).map(([provider, s]) => ({
    provider,
    inCooldown: now < s.cooldownUntil,
    remainingMs: Math.max(0, s.cooldownUntil - now),
    reason: s.reason,
    consecutive429s: s.consecutive429s,
    lastStatus: s.lastStatus,
  }));
}

export function parseRetryAfter(headerValue: string | null | undefined): number | undefined {
  if (!headerValue) return undefined;
  const trimmed = headerValue.trim();

  const asNum = Number(trimmed);
  if (Number.isFinite(asNum) && asNum >= 0) return Math.floor(asNum);

  const asDate = Date.parse(trimmed);
  if (!Number.isNaN(asDate)) {
    const diffSec = Math.ceil((asDate - Date.now()) / 1000);
    return diffSec > 0 ? diffSec : 0;
  }

  return undefined;
}
