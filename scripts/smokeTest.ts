/**
 * Smoke test for the new utilities + offline CABI engine enhancements.
 *
 * Run with: npx tsx scripts/smokeTest.ts
 *
 * Verifies:
 *   1. Rate limiter blocks after N requests within the window
 *   2. Provider cooldown applies on 429 and expires
 *   3. Request cache deduplicates identical queries
 *   4. Offline engine produces a result for rice-blast symptoms
 *   5. Offline engine: "no webbing" no longer falsely triggers biotic
 *   6. Offline engine: infectedPart boosts root-rot candidates
 *   7. Offline engine: produces a result when no crop is provided
 *   8. Offline engine: cause_type detection works with suspect variants
 */

import { checkRateLimit, msToRetryAfterSeconds } from '../src/lib/rateLimit';
import {
  isInCooldown,
  markRateLimited,
  markSuccess,
  cooldownRemainingMs,
  parseRetryAfter,
} from '../src/lib/providerCooldown';
import { cacheGet, cacheSet, buildCacheKey, cacheStats } from '../src/lib/requestCache';
import { diagnoseOffline } from '../src/lib/cabi/diagnosticEngine';

let pass = 0;
let fail = 0;
function assert(cond: boolean, msg: string) {
  if (cond) { pass++; console.log(`  ✓ ${msg}`); }
  else { fail++; console.error(`  ✗ ${msg}`); }
}

console.log('\n══ 1. Rate limiter ══');
{
  const key = `test-${Date.now()}`;
  const r1 = checkRateLimit({ key, namespace: 'test', maxRequests: 3, windowMs: 60_000 });
  assert(r1.allowed, '1st request allowed');
  assert(r1.remaining === 2, '1st request: 2 remaining');
  const r2 = checkRateLimit({ key, namespace: 'test', maxRequests: 3, windowMs: 60_000 });
  assert(r2.allowed, '2nd request allowed');
  const r3 = checkRateLimit({ key, namespace: 'test', maxRequests: 3, windowMs: 60_000 });
  assert(r3.allowed, '3rd request allowed');
  const r4 = checkRateLimit({ key, namespace: 'test', maxRequests: 3, windowMs: 60_000 });
  assert(!r4.allowed, '4th request BLOCKED');
  assert(r4.retryAfterMs > 0, '4th request: retryAfterMs > 0');
  assert(msToRetryAfterSeconds(r4.retryAfterMs) >= 1, 'msToRetryAfterSeconds >= 1');
}

console.log('\n══ 2. Provider cooldown ══');
{
  markRateLimited('test-provider', { retryAfterSeconds: 2, status: 429 });
  assert(isInCooldown('test-provider'), 'test-provider in cooldown after 429');
  assert(cooldownRemainingMs('test-provider') > 0, 'cooldownRemainingMs > 0');
  markSuccess('test-provider');
  assert(!isInCooldown('test-provider'), 'cooldown cleared after markSuccess');

  assert(parseRetryAfter('30') === 30, 'parseRetryAfter("30") = 30');
  assert(parseRetryAfter(undefined) === undefined, 'parseRetryAfter(undefined) = undefined');
  assert(parseRetryAfter('garbage') === undefined, 'parseRetryAfter("garbage") = undefined');

  markRateLimited('test-provider', {});
  assert(isInCooldown('test-provider'), 'cooldown applied via backoff (no Retry-After)');
}

console.log('\n══ 3. Request cache ══');
{
  const key = buildCacheKey(['diagnose', 'rice', 'yellow leaves']);
  const before = cacheStats().size;
  cacheSet(key, { disease: 'rice blast' });
  assert(cacheStats().size === before + 1, 'cache size grew by 1 after set');
  const hit = cacheGet<{ disease: string }>(key);
  assert(hit?.disease === 'rice blast', 'cache hit returns stored value');
  const miss = cacheGet(buildCacheKey(['diagnose', 'rice', 'different']));
  assert(miss === undefined, 'cache miss returns undefined');
}

console.log('\n══ 4. Offline engine — rice blast scenario ══');
{
  const result = diagnoseOffline({
    symptoms: {
      mainSymptoms: 'পাতায় ধূসর মাকু আকৃতির দাগ (ব্লাস্ট), পাতায় বাদামি গোলাকার দাগ',
    },
    crop: 'ধান',
    envInfo: { humidity: 90, temp: 28 },
    infectedPart: 'পাতা',
  });
  assert(result.abioticBiotic !== 'abiotic', `rice blast NOT abiotic (got: ${result.abioticBiotic})`);
  assert(result.specificDisease !== null, 'specificDisease identified');
  assert(result.specificDisease?.name === 'Rice Blast', `specificDisease = Rice Blast (got: ${result.specificDisease?.name})`);
  assert(result.specificDisease?.confidence !== 'low', 'confidence is medium or high');
  assert(result.cropDiseaseMatches.length > 0, 'cropDiseaseMatches non-empty');
  assert(result.ipmRecommendations.cultural.length > 0, 'IPM cultural recs non-empty');
}

console.log('\n══ 5. Offline engine — "no webbing" bug fix ══');
{
  const result = diagnoseOffline({
    symptoms: {
      mainSymptoms: 'uniformly distributed, no webbing, no ooze, no insect presence',
    },
    crop: 'ধান',
  });
  assert(result.abioticBiotic === 'abiotic', `"no webbing/ooze/insect" → abiotic (got: ${result.abioticBiotic})`);
}

console.log('\n══ 6. Offline engine — infectedPart boost for root rot ══');
{
  const result = diagnoseOffline({
    symptoms: {
      mainSymptoms: 'শিকড় কালো ও পচা, গাছ দিনে নেতিয়ে পড়ে',
    },
    crop: 'ধান',
    infectedPart: 'root',
  });
  assert(result.cropDiseaseMatches.length > 0, 'root symptoms produced matches');
  const top = result.cropDiseaseMatches[0];
  const isRootRelated =
    top.name.toLowerCase().includes('root') ||
    top.nameBn.includes('শিকড়') ||
    top.nameBn.includes('পচা') ||
    top.pathogen.toLowerCase().includes('rhizoctonia') ||
    top.pathogen.toLowerCase().includes('fusarium') ||
    top.matchedSymptoms.some(s => s.includes('শিকড়'));
  assert(isRootRelated, `top match is root-related: ${top.name} / ${top.nameBn}`);
}

console.log('\n══ 7. Offline engine — no crop provided (fallback path) ══');
{
  const result = diagnoseOffline({
    symptoms: {
      mainSymptoms: 'পাতায় ধূসর মাকু আকৃতির দাগ (ব্লাস্ট)',
    },
  });
  assert(result.abioticBiotic !== undefined, 'abioticBiotic assessed');
  assert(result.excluded.length > 0 || result.suspects.length > 0, 'gates ran');
  assert(result.suspects.length > 0, 'suspects non-empty (fallback note added)');
  assert(result.diseaseTriangle !== null, 'disease triangle still produced');
  assert(result.ipmRecommendations !== null, 'IPM recs still produced');
}

console.log('\n══ 8. Offline engine — cause_type detection via suspects variants ══');
{
  const result = diagnoseOffline({
    symptoms: {
      mainSymptoms: 'পাতায় তেলতেলে, পানিভেজা কিনারা, আঠালো নিঃসরণ',
    },
    crop: 'ধান',
  });
  const hasBacteriaSuspect = result.suspects.some(s => s.toLowerCase().includes('bacteria'));
  assert(hasBacteriaSuspect, `bacteria suspect present: ${result.suspects.join(', ')}`);
}

console.log(`\n══ Summary: ${pass} passed, ${fail} failed ══`);
process.exit(fail === 0 ? 0 : 1);
