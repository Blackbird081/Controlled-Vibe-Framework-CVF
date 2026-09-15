import { mkdir, mkdtemp, readFile, rm, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createGuardEngine, type GuardRuntimeEngine } from 'cvf-guard-contract';
import type { GuardAuditEntry } from '../guards/types.js';
import type { ReceiptConsumptionMarker, ReceiptConsumptionStore } from '../persistence/json-receipt-consumption.store.js';
import type {
  GovernedExecutionFinalization,
  GovernedExecutionReceipt,
  GovernedExecutionStore,
} from '../persistence/json-governed-execution.store.js';
import type { PreflightPersistencePort } from '../tools/governance-action-preflight.js';
import { parseGovernedExecArgs } from './governed-exec.js';
import {
  APPROVAL_MARKER_PROFILE_ID,
  APPROVAL_MARKER_TARGET_RELATIVE_PATH,
  type MutatingProfileApprovalPolicy,
  type MutatingProfileApprovalVerdict,
} from './mutating-profile-approval.js';
import {
  buildGovernedCommandAction,
  getGovernedCommandProfile,
  launchGovernedCommand,
  MAX_CAPTURE_BYTES,
  type GovernedCommandLauncherDependencies,
  type GovernedCommandRunRequest,
  type GovernedCommandRunResult,
  type GovernedCommandRunner,
} from './governed-command-launcher.js';

const tempDirs: string[] = [];

async function workspace(): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), 'cvf-delta-t3-launcher-'));
  tempDirs.push(dir);
  await mkdir(join(dir, 'package'));
  return dir;
}

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

class MemoryAdmissionStore implements PreflightPersistencePort, ReceiptConsumptionStore {
  entries: GuardAuditEntry[] = [];
  markers: ReceiptConsumptionMarker[] = [];
  failPersistence = false;
  claimResult = true;

  async saveAuditEntry(entry: GuardAuditEntry): Promise<void> {
    if (this.failPersistence) throw new Error('persistence failed');
    this.entries.push(entry);
  }

  async getPreflightAuditEntries(receiptId: string): Promise<GuardAuditEntry[]> {
    return this.entries.filter((entry) => entry.requestId === receiptId);
  }

  async claimReceipt(marker: ReceiptConsumptionMarker): Promise<boolean> {
    if (this.claimResult) this.markers.push(marker);
    return this.claimResult;
  }
}

class MemoryExecutionStore implements GovernedExecutionStore {
  intent: GovernedExecutionReceipt | null = null;
  finalization: GovernedExecutionFinalization | null = null;
  beginResult = true;
  failBegin = false;

  async beginExecution(receipt: GovernedExecutionReceipt): Promise<boolean> {
    if (this.failBegin) throw new Error('intent failed');
    this.intent = receipt;
    return this.beginResult;
  }

  async finalizeExecution(
    _consumptionId: string,
    finalization: GovernedExecutionFinalization
  ): Promise<GovernedExecutionReceipt> {
    this.finalization = finalization;
    return { ...this.intent!, ...finalization, externalInterceptionProved: false };
  }
}

class MemoryApprovalPolicy implements MutatingProfileApprovalPolicy {
  verdict: MutatingProfileApprovalVerdict = {
    approved: true,
    approvalId: 'approval-1',
    targetRelativePath: APPROVAL_MARKER_TARGET_RELATIVE_PATH,
    actionHash: 'hash-1',
    diagnosticCode: null,
  };
  requests: unknown[] = [];

  async evaluate(request: unknown): Promise<MutatingProfileApprovalVerdict> {
    this.requests.push(request);
    return this.verdict;
  }
}

function successfulRun(overrides: Partial<GovernedCommandRunResult> = {}): GovernedCommandRunResult {
  return {
    started: true,
    startedAt: '2026-06-19T00:00:01.000Z',
    completedAt: '2026-06-19T00:00:02.000Z',
    exitCode: 0,
    signal: null,
    stdout: 'ok',
    stderr: '',
    diagnosticCode: null,
    ...overrides,
  };
}

function setup(runResult = successfulRun(), engine: Pick<GuardRuntimeEngine, 'evaluate'> = createGuardEngine()) {
  const admission = new MemoryAdmissionStore();
  const execution = new MemoryExecutionStore();
  const run = vi.fn(async (_request: GovernedCommandRunRequest) => runResult);
  const runner: GovernedCommandRunner = { run };
  const approval = new MemoryApprovalPolicy();
  return {
    admission,
    execution,
    approval,
    run,
    dependencies: {
      engine: engine as GuardRuntimeEngine,
      preflightPersistence: admission,
      receiptStore: admission,
      executionStore: execution,
      runner,
      approvalPolicy: approval,
      generateConsumptionId: () => 'delta-consumption-1000-abcd',
    },
  };
}

/**
 * Test-only mock engine that always returns ALLOW, used solely to isolate
 * T1/T2/T3 persistence-ordering mechanics from the real canonical
 * authority_gate decision. This is legitimate test infrastructure, not
 * production action-label laundering: it never ships, and the real
 * `createGuardEngine()` is still used directly wherever a test needs to
 * prove genuine canonical-engine authorization (see the read-only-blocked
 * and mutating-fails-closed tests below, which use the real engine on
 * purpose).
 */
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

describe('Delta-T3/T4A governed command launcher', () => {
  it('publishes only the frozen profiles', () => {
    expect(getGovernedCommandProfile('git-status')?.args).toEqual([
      '-c',
      'core.fsmonitor=false',
      '-c',
      'core.untrackedCache=false',
      'status',
      '--short',
    ]);
    expect(getGovernedCommandProfile('git-diff-check')?.args).toEqual([
      '--no-pager',
      'diff',
      '--no-ext-diff',
      '--no-textconv',
      '--check',
    ]);
    expect(getGovernedCommandProfile(APPROVAL_MARKER_PROFILE_ID)).toMatchObject({
      executable: 'node',
      args: ['--version'],
      mutatingTargetRelativePath: APPROVAL_MARKER_TARGET_RELATIVE_PATH,
    });
    expect(getGovernedCommandProfile('npm-test')).toBeNull();
    expect(getGovernedCommandProfile('npm-build')).toBeNull();
    expect(getGovernedCommandProfile('npm-check')).toBeNull();
    expect(getGovernedCommandProfile('powershell')).toBeNull();
  });

  it('runs the exact profile only after T1, T2, and T3 durable stages (isolated from the real authority_gate decision)', async () => {
    // Uses alwaysAllowEngine() to isolate T1 (preflight+audit persistence),
    // T2 (receipt consumption), and T3 (execution intent persistence)
    // ordering mechanics from the real canonical engine's role/action
    // decision, which is proved independently below.
    const root = await workspace();
    const state = setup(successfulRun(), alwaysAllowEngine());
    const response = await launchGovernedCommand(
      { profileId: 'git-status', workspaceRoot: root, cwd: 'package' },
      state.dependencies
    );

    expect(response.accepted).toBe(true);
    expect(state.admission.entries).toHaveLength(1);
    expect(state.admission.markers).toHaveLength(1);
    expect(state.execution.intent?.status).toBe('ADMITTED');
    expect(state.run).toHaveBeenCalledTimes(1);
    expect(state.run.mock.calls[0][0]).toMatchObject({
      executable: 'git',
      args: [
        '-c',
        'core.fsmonitor=false',
        '-c',
        'core.untrackedCache=false',
        'status',
        '--short',
      ],
      cwd: join(root, 'package'),
    });
    expect(state.execution.finalization?.status).toBe('COMPLETED');
    expect(response.externalInterceptionProved).toBe(false);
  });

  it('uses one canonical relative action for preflight and consumption', async () => {
    const root = await workspace();
    const state = setup(successfulRun(), alwaysAllowEngine());
    await launchGovernedCommand(
      { profileId: 'git-diff-check', workspaceRoot: root, cwd: 'package' },
      state.dependencies
    );
    const profile = getGovernedCommandProfile('git-diff-check')!;
    expect(state.admission.entries[0].context.action).toBe(
      `RUN: ${buildGovernedCommandAction(profile, 'package')}`
    );
  });

  it('the real canonical engine genuinely blocks read-only git-status/git-diff-check for role AI_AGENT, not laundered through a "code" token', async () => {
    // Under the canonical AUTHORITY_MATRIX, AI_AGENT's only authorized
    // BUILD-phase verbs are authoring verbs (create, modify, build,
    // implement, code, write); phase_gate additionally restricts AI_AGENT to
    // phase BUILD only, so there is no phase/role cell where AI_AGENT can
    // truthfully perform a `read` action. Labeling the action honestly as
    // "read" therefore genuinely blocks it via the real, unmocked engine -
    // this proves admission is not secretly depending on a "code" token to
    // reach ALLOW, and that the launcher does not relabel to dodge the
    // guard.
    const state = setup(successfulRun(), createGuardEngine());
    const response = await launchGovernedCommand(
      { profileId: 'git-status', workspaceRoot: await workspace() },
      state.dependencies
    );
    expect(response.accepted).toBe(false);
    expect(state.admission.entries[0].context.action).toMatch(/\bread\b/);
    expect(state.admission.entries[0].context.action).not.toMatch(/\bcode\b/);
    expect(state.run).not.toHaveBeenCalled();
  });

  it('writes the fixed marker only after T1, T2, T3, T4A approval, and runner success (isolated from the real authority_gate/build_authority decision)', async () => {
    const root = await workspace();
    const state = setup(successfulRun(), alwaysAllowEngine());
    const response = await launchGovernedCommand(
      { profileId: APPROVAL_MARKER_PROFILE_ID, workspaceRoot: root },
      state.dependencies
    );

    expect(response.accepted).toBe(true);
    expect(response.approvalBackedMutationProved).toBe(true);
    expect(state.admission.entries[0].context.targetFiles).toEqual([
      APPROVAL_MARKER_TARGET_RELATIVE_PATH,
    ]);
    expect(state.admission.markers).toHaveLength(1);
    expect(state.execution.intent?.status).toBe('ADMITTED');
    expect(state.approval.requests).toHaveLength(1);
    expect(state.run).toHaveBeenCalledTimes(1);
    expect(state.run.mock.calls[0][0]).toMatchObject({
      executable: 'node',
      args: ['--version'],
      cwd: root,
    });
    const marker = JSON.parse(
      await readFile(join(root, APPROVAL_MARKER_TARGET_RELATIVE_PATH), 'utf-8')
    ) as { approvalId: string; consumptionId: string };
    expect(marker).toMatchObject({
      approvalId: 'approval-1',
      consumptionId: 'delta-consumption-1000-abcd',
    });
    expect(state.execution.finalization?.status).toBe('COMPLETED');
  });

  it('the mutating marker profile fails closed with the real canonical engine: no independent SPEC/WORK-ORDER evidence means no marker write and no runner call', async () => {
    // This is the R7A-F2 repair proof: launchGovernedCommand no longer
    // fabricates aiCommit/buildAuthority evidence for the mutating profile.
    // Against the real, unmocked engine, the "write" action genuinely
    // carries modify intent, so build_authority BLOCKs it at preflight
    // (missing buildAuthority evidence) before the T4A approval check, the
    // runner, or the marker file write are ever reached.
    const root = await workspace();
    const state = setup(successfulRun(), createGuardEngine());
    const response = await launchGovernedCommand(
      { profileId: APPROVAL_MARKER_PROFILE_ID, workspaceRoot: root },
      state.dependencies
    );

    expect(response.accepted).toBe(false);
    expect(response.approvalBackedMutationProved).toBe(false);
    expect(state.admission.markers).toHaveLength(0);
    expect(state.execution.intent).toBeNull();
    expect(state.approval.requests).toHaveLength(0);
    expect(state.run).not.toHaveBeenCalled();
    await expect(
      readFile(join(root, APPROVAL_MARKER_TARGET_RELATIVE_PATH), 'utf-8')
    ).rejects.toThrow();
  });

  it('a T4A approval verdict alone cannot satisfy build_authority: even a granted T4A approval does not let the real engine reach ALLOW', async () => {
    // Proves the T4A mutating-profile-approval policy is a separate,
    // downstream approval check, not a substitute for the canonical
    // build_authority prerequisite. The MemoryApprovalPolicy default always
    // approves, yet with the real engine and no buildAuthority evidence the
    // request never reaches the approval policy at all, because preflight
    // itself blocks first.
    const root = await workspace();
    const state = setup(successfulRun(), createGuardEngine());
    state.approval.verdict = {
      approved: true,
      approvalId: 'approval-would-have-been-granted',
      targetRelativePath: APPROVAL_MARKER_TARGET_RELATIVE_PATH,
      actionHash: 'irrelevant-hash',
      diagnosticCode: null,
    };
    const response = await launchGovernedCommand(
      { profileId: APPROVAL_MARKER_PROFILE_ID, workspaceRoot: root },
      state.dependencies
    );

    expect(response.accepted).toBe(false);
    expect(response.error?.code).not.toBe('APPROVAL_RECORD_NOT_FOUND');
    expect(state.approval.requests).toHaveLength(0);
    expect(state.run).not.toHaveBeenCalled();
  });

  it('does not call the runner for unknown profiles', async () => {
    const state = setup();
    const response = await launchGovernedCommand(
      { profileId: 'node-eval', workspaceRoot: await workspace() },
      state.dependencies
    );
    expect(response.error?.code).toBe('UNKNOWN_COMMAND_PROFILE');
    expect(state.run).not.toHaveBeenCalled();
  });

  it('fails closed after T3 intent and before runner when approval is missing', async () => {
    const state = setup(successfulRun(), alwaysAllowEngine());
    state.approval.verdict = {
      approved: false,
      approvalId: null,
      targetRelativePath: null,
      actionHash: null,
      diagnosticCode: 'APPROVAL_RECORD_NOT_FOUND',
    };
    const response = await launchGovernedCommand(
      { profileId: APPROVAL_MARKER_PROFILE_ID, workspaceRoot: await workspace() },
      state.dependencies
    );
    expect(response.error?.code).toBe('APPROVAL_RECORD_NOT_FOUND');
    expect(state.execution.intent?.status).toBe('ADMITTED');
    expect(state.execution.finalization?.status).toBe('FAILED');
    expect(state.execution.finalization?.diagnosticCode).toBe('APPROVAL_RECORD_NOT_FOUND');
    expect(state.run).not.toHaveBeenCalled();
  });

  it('fails closed before runner when the approval policy is absent', async () => {
    const state = setup(successfulRun(), alwaysAllowEngine());
    const dependencies = { ...state.dependencies, approvalPolicy: undefined };
    const response = await launchGovernedCommand(
      { profileId: APPROVAL_MARKER_PROFILE_ID, workspaceRoot: await workspace() },
      dependencies
    );
    expect(response.error?.code).toBe('APPROVAL_POLICY_MISSING');
    expect(state.execution.finalization?.status).toBe('FAILED');
    expect(state.run).not.toHaveBeenCalled();
  });

  it('fails closed before consumption and execution when T1 persistence fails', async () => {
    const state = setup(successfulRun(), alwaysAllowEngine());
    state.admission.failPersistence = true;
    const response = await launchGovernedCommand(
      { profileId: 'git-status', workspaceRoot: await workspace() },
      state.dependencies
    );
    expect(response.error?.code).toBe('AUDIT_PERSISTENCE_FAILED');
    expect(state.admission.markers).toHaveLength(0);
    expect(state.execution.intent).toBeNull();
    expect(state.run).not.toHaveBeenCalled();
  });

  it('fails closed before execution when T2 claim is rejected', async () => {
    const state = setup(successfulRun(), alwaysAllowEngine());
    state.admission.claimResult = false;
    const response = await launchGovernedCommand(
      { profileId: 'git-status', workspaceRoot: await workspace() },
      state.dependencies
    );
    expect(response.error?.code).toBe('RECEIPT_ALREADY_CONSUMED');
    expect(state.execution.intent).toBeNull();
    expect(state.run).not.toHaveBeenCalled();
  });

  it('fails closed before execution when T3 intent persistence fails', async () => {
    const state = setup(successfulRun(), alwaysAllowEngine());
    state.execution.failBegin = true;
    const response = await launchGovernedCommand(
      { profileId: 'git-status', workspaceRoot: await workspace() },
      state.dependencies
    );
    expect(response.error?.code).toBe('EXECUTION_INTENT_PERSISTENCE_FAILED');
    expect(state.run).not.toHaveBeenCalled();
  });

  it('rejects lexical cwd escape before preflight', async () => {
    const root = await workspace();
    const state = setup(successfulRun(), alwaysAllowEngine());
    const response = await launchGovernedCommand(
      { profileId: 'git-status', workspaceRoot: join(root, 'package'), cwd: '..' },
      state.dependencies
    );
    expect(response.error?.code).toBe('CWD_OUTSIDE_WORKSPACE');
    expect(state.admission.entries).toHaveLength(0);
    expect(state.run).not.toHaveBeenCalled();
  });

  it('rejects symlink cwd escape when the platform permits symlinks', async () => {
    const root = await workspace();
    const outside = await workspace();
    try {
      await symlink(outside, join(root, 'outside-link'), 'dir');
    } catch {
      return;
    }
    const state = setup(successfulRun(), alwaysAllowEngine());
    const response = await launchGovernedCommand(
      { profileId: 'git-status', workspaceRoot: root, cwd: 'outside-link' },
      state.dependencies
    );
    expect(response.error?.code).toBe('CWD_OUTSIDE_WORKSPACE');
    expect(state.run).not.toHaveBeenCalled();
  });

  it('finalizes runner failure and redacts known credential patterns', async () => {
    const state = setup(
      successfulRun({
        exitCode: 1,
        stdout: 'API_KEY=super-secret-value',
        stderr: 'password: hunter2',
        diagnosticCode: 'COMMAND_EXIT_NONZERO',
      }),
      alwaysAllowEngine()
    );
    const response = await launchGovernedCommand(
      { profileId: 'git-status', workspaceRoot: await workspace() },
      state.dependencies
    );
    expect(response.accepted).toBe(false);
    expect(response.stdout).toContain('[REDACTED]');
    expect(response.stderr).toContain('[REDACTED]');
    expect(response.stdout).not.toContain('super-secret-value');
    expect(response.stderr).not.toContain('hunter2');
    expect(state.execution.finalization?.status).toBe('FAILED');
  });

  it('masks a trusted caller-supplied known value composed through launchGovernedCommand', async () => {
    const state = setup(
      successfulRun({ stdout: 'deploy token abcdefgh12345 accepted', stderr: 'retry abcdefgh12345 later' }),
      alwaysAllowEngine()
    );
    const response = await launchGovernedCommand(
      { profileId: 'git-status', workspaceRoot: await workspace() },
      { ...state.dependencies, knownSecretValues: ['abcdefgh12345'] }
    );
    expect(response.accepted).toBe(true);
    expect(response.stdout).toContain('[REDACTED]');
    expect(response.stderr).toContain('[REDACTED]');
    expect(response.stdout).not.toContain('abcdefgh12345');
    expect(response.stderr).not.toContain('abcdefgh12345');
  });

  it('masks an encoded occurrence of a known value composed through launchGovernedCommand', async () => {
    const raw = 'secret value/with space';
    const encoded = encodeURIComponent(raw);
    const state = setup(successfulRun({ stdout: `query=${encoded}`, stderr: '' }), alwaysAllowEngine());
    const response = await launchGovernedCommand(
      { profileId: 'git-status', workspaceRoot: await workspace() },
      { ...state.dependencies, knownSecretValues: [raw] }
    );
    expect(response.stdout).toContain('[REDACTED]');
    expect(response.stdout).not.toContain(encoded);
  });

  it('preserves prior behavior when knownSecretValues is missing', async () => {
    const state = setup(successfulRun({ stdout: 'plain ok output', stderr: '' }), alwaysAllowEngine());
    const response = await launchGovernedCommand(
      { profileId: 'git-status', workspaceRoot: await workspace() },
      state.dependencies
    );
    expect(response.accepted).toBe(true);
    expect(response.stdout).toBe('plain ok output');
  });

  it('preserves prior behavior when knownSecretValues is an empty list', async () => {
    const state = setup(successfulRun({ stdout: 'plain ok output', stderr: '' }), alwaysAllowEngine());
    const response = await launchGovernedCommand(
      { profileId: 'git-status', workspaceRoot: await workspace() },
      { ...state.dependencies, knownSecretValues: [] }
    );
    expect(response.accepted).toBe(true);
    expect(response.stdout).toBe('plain ok output');
  });

  it('rejects an invalid knownSecretValues configuration before the runner executes, without echoing values, and before any persistence side effect', async () => {
    const state = setup(successfulRun(), alwaysAllowEngine());
    const response = await launchGovernedCommand(
      { profileId: 'git-status', workspaceRoot: await workspace() },
      { ...state.dependencies, knownSecretValues: ['short'] }
    );
    expect(response.accepted).toBe(false);
    expect(response.error?.code).toBe('KNOWN_VALUE_TOO_SHORT');
    expect(state.run).not.toHaveBeenCalled();
    expect(JSON.stringify(response)).not.toContain('short');
    // Rejected before ANY side effect: no preflight audit entry persisted,
    // no receipt marker claimed, no execution intent begun. This is the
    // "before side effects/runner execution" ordering the work order's
    // Required Implementation Contract item 2 requires, not merely
    // "runner not called".
    expect(state.admission.entries).toHaveLength(0);
    expect(state.admission.markers).toHaveLength(0);
    expect(state.execution.intent).toBeNull();
  });

  it('masks known-value occurrences at the exact MAX_CAPTURE_BYTES capture boundary, both fully inside and truncated by the runner', async () => {
    // The response is redactText(maskKnownValues(runResult.stdout, ...)).slice(0, MAX_CAPTURE_BYTES).
    // In real use, `runResult.stdout` itself is already runner-truncated to
    // at most MAX_CAPTURE_BYTES BEFORE masking ever sees it (DirectGovernedCommandRunner's
    // appendBounded enforces this at the child-process pipe). The test
    // fixture bypasses the real runner, so it must reproduce that same
    // pre-truncation explicitly to exercise the real boundary, rather than
    // handing the launcher a longer string than any real runner would ever
    // produce (which would let masking see bytes that never actually reach
    // it in production, silently proving nothing about the ceiling).
    const knownValue = 'boundary-secret-value-9x'; // 24 chars
    const prefixLength = MAX_CAPTURE_BYTES - knownValue.length - 5;
    const runnerTruncatedInside = ('p'.repeat(prefixLength) + knownValue + 'TAIL').slice(0, MAX_CAPTURE_BYTES);
    const stateInside = setup(
      successfulRun({ stdout: runnerTruncatedInside, stderr: '' }),
      alwaysAllowEngine()
    );
    const responseInside = await launchGovernedCommand(
      { profileId: 'git-status', workspaceRoot: await workspace() },
      { ...stateInside.dependencies, knownSecretValues: [knownValue] }
    );
    expect(responseInside.stdout.length).toBeLessThanOrEqual(MAX_CAPTURE_BYTES);
    expect(responseInside.stdout).toContain('[REDACTED]');
    expect(responseInside.stdout).not.toContain(knownValue);
    expect(responseInside.stdout.endsWith('TAIL')).toBe(true);

    // The value's occurrence starts 12 characters before the runner's own
    // MAX_CAPTURE_BYTES cutoff, so only its first 12 characters are ever
    // captured; the runner-truncated fragment the launcher actually
    // receives never contains the complete value.
    const halfValueLength = Math.floor(knownValue.length / 2);
    const straddlePrefixLength = MAX_CAPTURE_BYTES - halfValueLength;
    const runnerTruncatedStraddle = ('q'.repeat(straddlePrefixLength) + knownValue).slice(0, MAX_CAPTURE_BYTES);
    expect(runnerTruncatedStraddle.length).toBe(MAX_CAPTURE_BYTES);
    expect(runnerTruncatedStraddle).not.toContain(knownValue); // sanity: fixture itself is truncated mid-value
    const stateStraddle = setup(
      successfulRun({ stdout: runnerTruncatedStraddle, stderr: '' }),
      alwaysAllowEngine()
    );
    const responseStraddle = await launchGovernedCommand(
      { profileId: 'git-status', workspaceRoot: await workspace() },
      { ...stateStraddle.dependencies, knownSecretValues: [knownValue] }
    );
    // A value whose occurrence is only partially captured (the runner cut
    // if off mid-value) is not a complete represented value within the
    // captured output, so it is not masked and passes through unchanged --
    // exactly the work order's stated limit ("Limits cover complete
    // represented values ... A capture-truncated fragment is not
    // automatically covered"), not a silently missed guarantee.
    expect(responseStraddle.stdout.length).toBe(MAX_CAPTURE_BYTES);
    expect(responseStraddle.stdout).toBe(runnerTruncatedStraddle);
    expect(responseStraddle.stdout).not.toContain('[REDACTED]');
  });

  it('is unaffected by caller mutation of the knownSecretValues array while the launcher invocation is in flight', async () => {
    // Required Implementation Contract item 2: "Caller-owned array mutation
    // after entry cannot change this invocation." A prior test proved this
    // for the synchronous snapshot step; this test proves it holds across
    // a real awaited invocation, by mutating the SAME array reference the
    // caller passed in while the runner's promise is still pending.
    const knownValue = 'in-flight-mutation-secret1';
    let markRunnerEntered!: () => void;
    const runnerEntered = new Promise<void>(resolve => { markRunnerEntered = resolve; });
    let releaseRunner: (() => void) | null = null;
    const pendingRun = new Promise<void>((resolve) => {
      releaseRunner = resolve;
    });
    const admission = new MemoryAdmissionStore();
    const execution = new MemoryExecutionStore();
    const approval = new MemoryApprovalPolicy();
    const run = vi.fn(async (_request: GovernedCommandRunRequest) => {
      markRunnerEntered();
      await pendingRun;
      return successfulRun({ stdout: `plain ${knownValue} end`, stderr: 'plain a-second-value-added-later end' });
    });
    const runner: GovernedCommandRunner = { run };
    const dependencies: GovernedCommandLauncherDependencies = {
      engine: alwaysAllowEngine() as GuardRuntimeEngine,
      preflightPersistence: admission,
      receiptStore: admission,
      executionStore: execution,
      runner,
      approvalPolicy: approval,
      generateConsumptionId: () => 'in-flight-mutation-consumption',
    };

    const callerArray = [knownValue];
    const responsePromise = launchGovernedCommand(
      { profileId: 'git-status', workspaceRoot: await workspace() },
      { ...dependencies, knownSecretValues: callerArray }
    );

    // Mutate the array the launcher was handed WHILE its invocation is
    // still pending on the runner.
    await runnerEntered;
    expect(run).toHaveBeenCalledOnce();
    callerArray.push('a-second-value-added-later');
    callerArray[0] = 'mutated-out-from-under-the-call';

    releaseRunner!();
    const response = await responsePromise;

    expect(response.stdout).toContain('[REDACTED]');
    expect(response.stdout).not.toContain(knownValue);
    expect(response.stdout).toBe('plain [REDACTED] end');
    expect(response.stderr).toBe('plain a-second-value-added-later end');
  });

  it('applies known-value masking before existing shape-based credential redaction (composed order, not either pass alone)', async () => {
    // The known value is masked first (abcdefgh12345 -> [REDACTED]); the
    // existing shape pass then runs SECOND against that already-masked
    // text and additionally collapses the whole `API_KEY=[REDACTED]` span
    // per its own key=value pattern. Both passes ran, in the required
    // order, on real launcher output -- this is what the acceptance table's
    // "known-value masking FIRST, redactText SECOND" row requires evidence
    // for, not string-inclusion helper timings.
    const state = setup(
      successfulRun({
        exitCode: 1,
        stdout: 'API_KEY=abcdefgh12345',
        stderr: '',
        diagnosticCode: 'COMMAND_EXIT_NONZERO',
      }),
      alwaysAllowEngine()
    );
    const response = await launchGovernedCommand(
      { profileId: 'git-status', workspaceRoot: await workspace() },
      { ...state.dependencies, knownSecretValues: ['abcdefgh12345'] }
    );
    expect(response.stdout).toBe('[REDACTED]');
    expect(response.stdout).not.toContain('abcdefgh12345');
  });

  it('masks a known value that shape-based redaction alone would miss (no key= prefix)', async () => {
    const state = setup(
      successfulRun({ stdout: 'plain: abcdefgh12345 with no key prefix', stderr: '' }),
      alwaysAllowEngine()
    );
    const withoutKnownValue = await launchGovernedCommand(
      { profileId: 'git-status', workspaceRoot: await workspace() },
      state.dependencies
    );
    expect(withoutKnownValue.stdout).toContain('abcdefgh12345');

    const withKnownValue = await launchGovernedCommand(
      { profileId: 'git-status', workspaceRoot: await workspace() },
      { ...state.dependencies, knownSecretValues: ['abcdefgh12345'] }
    );
    expect(withKnownValue.stdout).not.toContain('abcdefgh12345');
    expect(withKnownValue.stdout).toContain('[REDACTED]');
  });
});

describe('cvf-governed-exec parser', () => {
  it('accepts only profile/workspace/cwd/json arguments', () => {
    expect(
      parseGovernedExecArgs([
        '--profile',
        'git-status',
        '--workspace',
        'repo',
        '--cwd',
        'package',
        '--json',
      ])
    ).toEqual({ profileId: 'git-status', workspaceRoot: 'repo', cwd: 'package', json: true });
  });

  it('rejects executable and arbitrary argument surfaces', () => {
    expect(() => parseGovernedExecArgs(['--profile', 'git-status', '--exec', 'cmd'])).toThrow(
      'Unsupported argument'
    );
    expect(() => parseGovernedExecArgs(['--profile', 'git-status', '--', 'rm'])).toThrow(
      'Unsupported argument'
    );
  });
});
