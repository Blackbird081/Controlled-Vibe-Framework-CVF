/**
 * Deterministic local benchmark for service-token replay deduplication --
 * paired added-latency measurement.
 *
 * Baseline-equivalence method: the ledger-disabled control
 * (`_testOnlyResetReplayLedger({ enabled: false })`) executes the exact same
 * `verifyServiceTokenRequest` function and source file as the dispatch-head
 * implementation, taking the identical code path (token compare, timestamp
 * window check, HMAC signature compare) and skipping only the replay-ledger
 * block (`if (replayLedgerEnabled) { ... }`) that this change adds. No
 * separate pre-change build, git ref or duplicate source copy is required:
 * disabling the ledger is equivalent to "verifier behavior before this
 * change" because it isolates precisely the code this change introduces,
 * in the same process, same JIT warmup state, same call.
 *
 * Compares, as paired samples (the exact same input in each pair):
 *  1. Baseline: first-use valid verification with the ledger disabled.
 *  2. Changed: first-use valid verification with the ledger enabled.
 * Added latency per pair = changed - baseline.
 *
 * Also measures replay-rejection latency separately (not substituted for
 * added latency).
 *
 * Uses synthetic values only. No process.env reads beyond Node version,
 * no external requests, no server start, no provider calls.
 *
 * Run: npm exec --offline -- tsx scripts/benchmark-service-token-replay-dedupe.ts
 */

import { performance } from 'node:perf_hooks';

import {
  verifyServiceTokenRequest,
  computeServiceRequestSignature,
  _testOnlyResetReplayLedger,
} from '../src/lib/service-token-auth';

// ---------- Configuration ----------

const WARMUP_ITERATIONS = 30;
const SAMPLE_COUNT = 100; // >=50 paired samples required
const SYNTHETIC_TOKEN = 'benchmark-synthetic-token-2026';
const BASE_NOW = 3_000_000_000_000;

// ---------- Helpers ----------

function median(sorted: number[]): number {
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

function p95(sorted: number[]): number {
  const idx = Math.ceil(sorted.length * 0.95) - 1;
  return sorted[Math.min(idx, sorted.length - 1)];
}

/**
 * Build a unique, always-first-use, always-valid input. `tag` and `index`
 * combine to guarantee no two calls across the whole run (warmup, baseline,
 * changed, replay-prepopulation) ever collide on the same replay key, so
 * every "first use" measurement is a genuine first use.
 */
function makeInput(tag: string, index: number) {
  const ts = String(BASE_NOW + index);
  const body = `{"bench":"${tag}","i":${index}}`;
  const sig = computeServiceRequestSignature(SYNTHETIC_TOKEN, ts, body);
  return {
    configuredToken: SYNTHETIC_TOKEN,
    presentedToken: SYNTHETIC_TOKEN,
    signature: sig,
    timestamp: ts,
    body,
    now: BASE_NOW + index,
  };
}

console.log('=== Service-Token Replay Deduplication Benchmark ===');
console.log(`Node: ${process.version}`);
console.log(`Paired samples: ${SAMPLE_COUNT} (warmup: ${WARMUP_ITERATIONS} per branch)`);
console.log('Fixture: synthetic token + sequential timestamps + JSON body');
console.log('Baseline: ledger disabled (identical code path minus replay-ledger block)');
console.log('Changed: ledger enabled (dispatch-head implementation)');
console.log();

// ---------- Warmup (both branches, interleaved, discarded) ----------

let warmupCounter = 0;

_testOnlyResetReplayLedger({ enabled: false });
for (let i = 0; i < WARMUP_ITERATIONS; i++) {
  verifyServiceTokenRequest(makeInput('warmup-baseline', -(warmupCounter++ + 1)));
}

_testOnlyResetReplayLedger({ enabled: true });
for (let i = 0; i < WARMUP_ITERATIONS; i++) {
  verifyServiceTokenRequest(makeInput('warmup-changed', -(warmupCounter++ + 1)));
}

// ---------- Measurement: paired added latency (baseline vs changed) ----------
//
// Each pair uses the exact same input. Resetting the module-owned ledger before
// each branch makes the changed call a genuine first use. Branch order
// alternates per pair to reduce systematic timing bias.

const baselineTimes: number[] = [];
const changedTimes: number[] = [];
const addedTimes: number[] = [];

for (let i = 0; i < SAMPLE_COUNT; i++) {
  const input = makeInput('paired', i);

  const measure = (enabled: boolean, label: 'baseline' | 'changed'): number => {
    _testOnlyResetReplayLedger({ enabled });
    const start = performance.now();
    const result = verifyServiceTokenRequest(input);
    const elapsed = performance.now() - start;
    if (!result) {
      console.error(`FAIL: ${label} call ${i} returned false`);
      process.exit(1);
    }
    return elapsed;
  };

  const baselineFirst = i % 2 === 0;
  const baselineElapsed = baselineFirst
    ? measure(false, 'baseline')
    : 0;
  const changedElapsed = measure(true, 'changed');
  const finalBaselineElapsed = baselineFirst
    ? baselineElapsed
    : measure(false, 'baseline');

  baselineTimes.push(finalBaselineElapsed);
  changedTimes.push(changedElapsed);
  addedTimes.push(changedElapsed - finalBaselineElapsed);
}

// ---------- Measurement: replay rejection (changed branch only, separate) ----------

_testOnlyResetReplayLedger({ enabled: true });

const replayInputs = Array.from({ length: SAMPLE_COUNT }, (_, i) => makeInput('replay', i));

for (const input of replayInputs) {
  verifyServiceTokenRequest(input);
}

const replayTimes: number[] = [];

for (let i = 0; i < SAMPLE_COUNT; i++) {
  const start = performance.now();
  const result = verifyServiceTokenRequest(replayInputs[i]);
  const elapsed = performance.now() - start;
  if (result) {
    console.error(`FAIL: replay call ${i} returned true`);
    process.exit(1);
  }
  replayTimes.push(elapsed);
}

// ---------- Report ----------

const sortedBaseline = [...baselineTimes].sort((a, b) => a - b);
const sortedChanged = [...changedTimes].sort((a, b) => a - b);
const sortedAdded = [...addedTimes].sort((a, b) => a - b);
const sortedReplay = [...replayTimes].sort((a, b) => a - b);

const baselineMedian = median(sortedBaseline);
const baselineP95 = p95(sortedBaseline);
const changedMedian = median(sortedChanged);
const changedP95 = p95(sortedChanged);
const addedMedian = median(sortedAdded);
const addedP95 = p95(sortedAdded);
const replayMedian = median(sortedReplay);
const replayP95 = p95(sortedReplay);

console.log('--- Baseline (ledger disabled, first-use) ---');
console.log(`  Median: ${baselineMedian.toFixed(4)} ms`);
console.log(`  P95:    ${baselineP95.toFixed(4)} ms`);
console.log();
console.log('--- Changed (ledger enabled, first-use) ---');
console.log(`  Median: ${changedMedian.toFixed(4)} ms`);
console.log(`  P95:    ${changedP95.toFixed(4)} ms`);
console.log();
console.log('--- Paired added latency (changed - baseline, per pair) ---');
console.log(`  Median: ${addedMedian.toFixed(4)} ms`);
console.log(`  P95:    ${addedP95.toFixed(4)} ms`);
console.log();
console.log('--- Replay rejection (changed branch, informational only) ---');
console.log(`  Median: ${replayMedian.toFixed(4)} ms`);
console.log(`  P95:    ${replayP95.toFixed(4)} ms`);
console.log();

const MEDIAN_CEILING = 0.10;
const P95_CEILING = 0.25;

const addedMedianPass = addedMedian <= MEDIAN_CEILING;
const addedP95Pass = addedP95 <= P95_CEILING;

console.log('--- Acceptance (applies to paired added first-use latency only) ---');
console.log(`  Added median <= ${MEDIAN_CEILING} ms: ${addedMedianPass ? 'PASS' : 'FAIL'} (${addedMedian.toFixed(4)} ms)`);
console.log(`  Added P95    <= ${P95_CEILING} ms: ${addedP95Pass ? 'PASS' : 'FAIL'} (${addedP95.toFixed(4)} ms)`);
console.log();

if (!addedMedianPass || !addedP95Pass) {
  console.error('BENCHMARK FAIL: paired added latency exceeds acceptance ceiling.');
  process.exit(1);
}

console.log('BENCHMARK PASS');
