/** Paired pinned pre-change CVF launcher versus current launcher; synthetic runner only. */
import { execFileSync } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { performance } from 'node:perf_hooks';
import { type GuardRuntimeEngine } from 'cvf-guard-contract';
import type { GuardAuditEntry } from '../src/guards/types.js';
import type {
  ReceiptConsumptionMarker,
  ReceiptConsumptionStore,
} from '../src/persistence/json-receipt-consumption.store.js';
import type {
  GovernedExecutionFinalization,
  GovernedExecutionReceipt,
  GovernedExecutionStore,
} from '../src/persistence/json-governed-execution.store.js';
import type { PreflightPersistencePort } from '../src/tools/governance-action-preflight.js';
import {
  launchGovernedCommand,
  type GovernedCommandLauncherDependencies,
  type GovernedCommandRunRequest,
  type GovernedCommandRunResult,
  type GovernedCommandRunner,
} from '../src/cli/governed-command-launcher.js';
import { maskKnownValues, snapshotKnownValues } from '../src/tools/known-value-redaction.js';

const WARMUP_ITERATIONS = 10;
const SAMPLE_COUNT = 40; // >= 30 required

class MemoryAdmissionStore implements PreflightPersistencePort, ReceiptConsumptionStore {
  entries: GuardAuditEntry[] = [];
  markers: ReceiptConsumptionMarker[] = [];
  async saveAuditEntry(entry: GuardAuditEntry): Promise<void> {
    this.entries.push(entry);
  }
  async getPreflightAuditEntries(receiptId: string): Promise<GuardAuditEntry[]> {
    return this.entries.filter((entry) => entry.requestId === receiptId);
  }
  async claimReceipt(marker: ReceiptConsumptionMarker): Promise<boolean> {
    this.markers.push(marker);
    return true;
  }
}

class MemoryExecutionStore implements GovernedExecutionStore {
  intent: GovernedExecutionReceipt | null = null;
  async beginExecution(receipt: GovernedExecutionReceipt): Promise<boolean> {
    this.intent = receipt;
    return true;
  }
  async finalizeExecution(
    _consumptionId: string,
    finalization: GovernedExecutionFinalization
  ): Promise<GovernedExecutionReceipt> {
    return { ...this.intent!, ...finalization, externalInterceptionProved: false };
  }
}

function alwaysAllowEngine(): Pick<GuardRuntimeEngine, 'evaluate'> {
  return {
    evaluate: (context) => ({
      requestId: context.requestId,
      finalDecision: 'ALLOW',
      results: [],
      executedAt: new Date().toISOString(),
      durationMs: 0,
    }),
  };
}

function buildKnownValues(count: number): string[] {
  return Array.from({ length: count }, (_, i) => `known-secret-value-${i.toString().padStart(4, '0')}-x`);
}

/** Cycle actual matches and near misses before truncation; assert represented hits. */
function buildOutputText(sizeBytes: number, knownValues: readonly string[]): string {
  const filler = 'benign output text ';
  const represented = knownValues.slice(0, sizeBytes === 1024 ? 4 : knownValues.length);
  const cycle = represented.length
    ? represented.map(v => `hit:${v} again:${v} near:${v.slice(0, -1)}Z `).join('')
    : filler;
  const text = cycle.repeat(Math.ceil(sizeBytes / cycle.length)).slice(0, sizeBytes);
  if (represented.length && !represented.every(v => text.split(v).length - 1 >= 2)) {
    throw new Error('Benchmark fixture lost repeated matches during capture truncation.');
  }
  return text;
}

async function makeWorkspace(): Promise<{ root: string; cleanup: () => Promise<void> }> {
  const dir = await mkdtemp(join(tmpdir(), 'cvf-t1-bench-'));
  await mkdir(join(dir, 'package'));
  return { root: dir, cleanup: () => rm(dir, { recursive: true, force: true }) };
}

/** Baseline: omits knownSecretValues entirely (not set to undefined explicitly, not set to []). */
function buildBaselineDependencies(outputText: string): GovernedCommandLauncherDependencies {
  const admission = new MemoryAdmissionStore();
  const execution = new MemoryExecutionStore();
  const runResult: GovernedCommandRunResult = {
    started: true,
    startedAt: '2026-09-14T00:00:01.000Z',
    completedAt: '2026-09-14T00:00:02.000Z',
    exitCode: 0,
    signal: null,
    stdout: outputText,
    stderr: outputText,
    diagnosticCode: null,
  };
  const runner: GovernedCommandRunner = {
    run: async (_request: GovernedCommandRunRequest) => runResult,
  };
  const dependencies: GovernedCommandLauncherDependencies = {
    engine: alwaysAllowEngine() as GuardRuntimeEngine,
    preflightPersistence: admission,
    receiptStore: admission,
    executionStore: execution,
    runner,
    generateConsumptionId: () => `bench-consumption-${Math.random().toString(36).slice(2)}`,
  };
  return dependencies;
}

function buildChangedDependencies(
  outputText: string,
  knownSecretValues: readonly string[]
): GovernedCommandLauncherDependencies {
  return { ...buildBaselineDependencies(outputText), knownSecretValues };
}

interface Stats {
  median: number;
  p95: number;
  min: number;
  max: number;
  n: number;
}

function computeStats(samplesMs: number[]): Stats {
  const sorted = [...samplesMs].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
  const p95Index = Math.min(sorted.length - 1, Math.ceil(sorted.length * 0.95) - 1);
  return {
    median,
    p95: sorted[p95Index],
    min: sorted[0],
    max: sorted[sorted.length - 1],
    n: sorted.length,
  };
}

function fmt(stats: Stats): string {
  return `median=${stats.median.toFixed(4)}ms p95=${stats.p95.toFixed(4)}ms (n=${stats.n})`;
}

async function timeLauncherInvocation(
  launcher: typeof launchGovernedCommand,
  root: string,
  dependencies: GovernedCommandLauncherDependencies
): Promise<number> {
  const start = performance.now();
  const response = await launcher({ profileId: 'git-status', workspaceRoot: root, cwd: 'package' }, dependencies);
  const elapsed = performance.now() - start;
  if (!response.accepted) throw new Error('Synthetic launcher fixture was rejected.');
  return elapsed;
}

/** Times ONLY snapshotKnownValues (construction), isolated from the launcher. */
function timeConstruction(knownValues: readonly string[] | undefined): number {
  const start = performance.now();
  snapshotKnownValues(knownValues);
  return performance.now() - start;
}

/** Times ONLY maskKnownValues applied to stdout then stderr (application), isolated from the launcher. */
function timeApplication(outputText: string, variants: readonly string[]): number {
  const start = performance.now();
  maskKnownValues(outputText, variants);
  maskKnownValues(outputText, variants);
  return performance.now() - start;
}

interface ScenarioResult {
  label: string;
  launcherBaseline: Stats;
  launcherChanged: Stats;
  addedLauncherMedianMs: number;
  addedLauncherP95Ms: number;
  constructionOnly: Stats;
  applicationOnly: Stats;
}

async function runScenario(
  baselineLauncher: typeof launchGovernedCommand,
  label: string,
  outputSizeBytes: number,
  knownValueCount: number
): Promise<ScenarioResult> {
  const { root, cleanup } = await makeWorkspace();
  try {
    const knownValues = buildKnownValues(knownValueCount);
    const outputText = buildOutputText(outputSizeBytes, knownValues);
    const snapshot = snapshotKnownValues(knownValues.length > 0 ? knownValues : undefined);
    const variants = snapshot.variants ?? [];

    for (let i = 0; i < WARMUP_ITERATIONS; i++) {
      await timeLauncherInvocation(baselineLauncher, root, buildBaselineDependencies(outputText));
      await timeLauncherInvocation(launchGovernedCommand, root, buildChangedDependencies(outputText, knownValues));
      timeConstruction(knownValues.length > 0 ? knownValues : undefined);
      timeApplication(outputText, variants);
    }

    const launcherBaselineSamples: number[] = [];
    const launcherChangedSamples: number[] = [];
    const constructionSamples: number[] = [];
    const applicationSamples: number[] = [];
    for (let i = 0; i < SAMPLE_COUNT; i++) {
      const baseline = () => timeLauncherInvocation(baselineLauncher, root, buildBaselineDependencies(outputText));
      const changed = () => timeLauncherInvocation(launchGovernedCommand, root, buildChangedDependencies(outputText, knownValues));
      // Alternate ordering to avoid systematic warm-cache bias.
      if (i % 2 === 0) {
        launcherBaselineSamples.push(await baseline());
        launcherChangedSamples.push(await changed());
      } else {
        launcherChangedSamples.push(await changed());
        launcherBaselineSamples.push(await baseline());
      }
      constructionSamples.push(timeConstruction(knownValues.length > 0 ? knownValues : undefined));
      applicationSamples.push(timeApplication(outputText, variants));
    }

    const launcherBaseline = computeStats(launcherBaselineSamples);
    const launcherChanged = computeStats(launcherChangedSamples);
    return {
      label,
      launcherBaseline,
      launcherChanged,
      addedLauncherMedianMs: computeStats(launcherChangedSamples.map((v, i) => v - launcherBaselineSamples[i])).median,
      addedLauncherP95Ms: computeStats(launcherChangedSamples.map((v, i) => v - launcherBaselineSamples[i])).p95,
      constructionOnly: computeStats(constructionSamples),
      applicationOnly: computeStats(applicationSamples),
    };
  } finally {
    await cleanup();
  }
}

async function measure(baselineLauncher: typeof launchGovernedCommand): Promise<void> {
  const scenarios: Array<{ label: string; sizeBytes: number; knownValueCount: number }> = [
    { label: '1KiB output, 0 known values (no-secret)', sizeBytes: 1024, knownValueCount: 0 },
    { label: '1KiB output, 1 known value', sizeBytes: 1024, knownValueCount: 1 },
    { label: '1KiB output, 8 known values', sizeBytes: 1024, knownValueCount: 8 },
    { label: '1KiB output, 32 known values', sizeBytes: 1024, knownValueCount: 32 },
    { label: '64KiB output, 0 known values (no-secret)', sizeBytes: 65536, knownValueCount: 0 },
    { label: '64KiB output, 1 known value', sizeBytes: 65536, knownValueCount: 1 },
    { label: '64KiB output, 8 known values', sizeBytes: 65536, knownValueCount: 8 },
    { label: '64KiB output, 32 known values', sizeBytes: 65536, knownValueCount: 32 },
  ];

  const results: ScenarioResult[] = [];
  for (const s of scenarios) {
    results.push(await runScenario(baselineLauncher, s.label, s.sizeBytes, s.knownValueCount));
  }

  const lines: string[] = [];
  lines.push('host: ' + process.platform + ' ' + process.arch);
  lines.push('node: ' + process.version);
  lines.push('sampleCount: ' + SAMPLE_COUNT + ' (warmup ' + WARMUP_ITERATIONS + ' excluded)');
  lines.push('');
  lines.push('=== Full composed launchGovernedCommand invocation (baseline is pinned pre-change source; added stats are paired differences) ===');
  lines.push('scenario | baseline | changed | added median (ms) | added p95 (ms)');
  lines.push('--- | --- | --- | --- | ---');
  for (const r of results) {
    lines.push(
      [
        r.label,
        fmt(r.launcherBaseline),
        fmt(r.launcherChanged),
        r.addedLauncherMedianMs.toFixed(4),
        r.addedLauncherP95Ms.toFixed(4),
      ].join(' | ')
    );
  }

  lines.push('');
  lines.push('=== Isolated phase timings (construction = snapshotKnownValues once; application = maskKnownValues x2, stdout+stderr) ===');
  lines.push('scenario | construction only | application only');
  lines.push('--- | --- | ---');
  for (const r of results) {
    lines.push([r.label, fmt(r.constructionOnly), fmt(r.applicationOnly)].join(' | '));
  }

  const noSecret1KiB = results.find((r) => r.label === '1KiB output, 0 known values (no-secret)')!;
  const noSecret64KiB = results.find((r) => r.label === '64KiB output, 0 known values (no-secret)')!;
  const worst32x64 = results.find((r) => r.label === '64KiB output, 32 known values')!;

  lines.push('');
  lines.push('Proposed acceptance ceilings (not measured results or a universal SLA):');
  lines.push('  no-secret added: median <= 0.10 ms, p95 <= 0.25 ms');
  lines.push('  32 secrets / two 64 KiB strings added: median <= 5 ms, p95 <= 10 ms');
  lines.push('');

  function verdict(name: string, r: ScenarioResult, medianCeiling: number, p95Ceiling: number): string {
    const within = r.addedLauncherMedianMs <= medianCeiling && r.addedLauncherP95Ms <= p95Ceiling;
    return (
      name +
      ' added median = ' +
      r.addedLauncherMedianMs.toFixed(4) +
      ' ms, added p95 = ' +
      r.addedLauncherP95Ms.toFixed(4) +
      ' ms -> ' +
      (within ? 'WITHIN_CEILING' : 'EXCEEDS_CEILING')
    );
  }

  lines.push(verdict('1KiB no-secret scenario', noSecret1KiB, 0.1, 0.25));
  lines.push(verdict('64KiB no-secret scenario', noSecret64KiB, 0.1, 0.25));
  lines.push(verdict('64KiB/32-known-values scenario', worst32x64, 5, 10));

  // eslint-disable-next-line no-console
  console.log(lines.join('\n'));
  if ([noSecret1KiB, noSecret64KiB].some(r => r.addedLauncherMedianMs > 0.1 || r.addedLauncherP95Ms > 0.25) || worst32x64.addedLauncherMedianMs > 5 || worst32x64.addedLauncherP95Ms > 10) process.exitCode = 1;
}

async function main(): Promise<void> {
  const pin = 'bdd8329aa7d9d61d7fb8cc98de6def13e6697647';
  const sourcePath = 'EXTENSIONS/CVF_ECO_v2.5_MCP_SERVER/src/cli/governed-command-launcher.ts';
  const source = execFileSync('git', ['show', `${pin}:${sourcePath}`], { cwd: fileURLToPath(new URL('..', import.meta.url)), maxBuffer: 1024 * 1024 });
  const digest = createHash('sha256').update(source).digest('hex');
  if (digest !== 'a0f2be2810ae461394c11a931007f79d32f11437a7d9c11737e52f0bb3f31f4b') throw new Error('Pinned baseline bytes do not match.');
  // Adjacent temporary module preserves original relative imports; never overwrite a source file.
  const baselineUrl = new URL(`../src/cli/.output-redaction-baseline-${randomUUID()}.ts`, import.meta.url);
  await writeFile(baselineUrl, source, { flag: 'wx' });
  try {
    const baseline = await import(baselineUrl.href);
    console.log(`baselinePin: ${pin}; baselineSha256: ${digest}`);
    console.log('1KiB fixtures repeat up to four represented values; 64KiB fixtures repeat all supplied values.');
    await measure(baseline.launchGovernedCommand);
  } finally {
    await rm(baselineUrl);
  }
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exitCode = 1;
});
