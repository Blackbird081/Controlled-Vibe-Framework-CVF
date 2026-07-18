/** Delta-T3 static-profile governed command launcher. */

import { spawn } from 'node:child_process';
import { realpath } from 'node:fs/promises';
import { isAbsolute, relative, resolve } from 'node:path';
import type { GuardRuntimeEngine } from '../guards/engine.js';
import type { CVFRiskLevel } from '../guards/types.js';
import type { PreflightPersistencePort } from '../tools/governance-action-preflight.js';
import {
  preflightGovernanceAction,
  redactText,
} from '../tools/governance-action-preflight.js';
import type { ReceiptConsumptionStore } from '../persistence/json-receipt-consumption.store.js';
import { consumeGovernanceActionReceipt } from '../tools/governance-action-receipt-consumer.js';
import {
  GOVERNED_EXECUTION_RECEIPT_CONTRACT,
  type GovernedExecutionReceipt,
  type GovernedExecutionStore,
} from '../persistence/json-governed-execution.store.js';
import {
  APPROVAL_MARKER_PROFILE_ID,
  APPROVAL_MARKER_TARGET_RELATIVE_PATH,
  validateApprovalMarkerTarget,
  writeApprovalMarkerFile,
  type MutatingProfileApprovalPolicy,
} from './mutating-profile-approval.js';

export const GOVERNED_COMMAND_LAUNCHER_CONTRACT =
  'cvf.delta.governedCommandLauncher.v1' as const;
export const MAX_CAPTURE_BYTES = 65_536;
export const DEFAULT_COMMAND_TIMEOUT_MS = 600_000;

export const GOVERNED_COMMAND_PROFILE_IDS = [
  'git-status',
  'git-diff-check',
  APPROVAL_MARKER_PROFILE_ID,
] as const;
export type GovernedCommandProfileId = (typeof GOVERNED_COMMAND_PROFILE_IDS)[number];

export interface GovernedCommandProfile {
  id: GovernedCommandProfileId;
  executable: string;
  args: readonly string[];
  riskLevel: CVFRiskLevel;
  mutatingTargetRelativePath?: typeof APPROVAL_MARKER_TARGET_RELATIVE_PATH;
}

export function getGovernedCommandProfile(
  profileId: string
): GovernedCommandProfile | null {
  const profiles: Record<GovernedCommandProfileId, GovernedCommandProfile> = {
    'git-status': {
      id: 'git-status',
      executable: 'git',
      args: ['-c', 'core.fsmonitor=false', '-c', 'core.untrackedCache=false', 'status', '--short'],
      riskLevel: 'R0',
    },
    'git-diff-check': {
      id: 'git-diff-check',
      executable: 'git',
      args: ['--no-pager', 'diff', '--no-ext-diff', '--no-textconv', '--check'],
      riskLevel: 'R0',
    },
    'approval-marker-write': {
      id: APPROVAL_MARKER_PROFILE_ID,
      executable: 'node',
      args: ['--version'],
      riskLevel: 'R1',
      mutatingTargetRelativePath: APPROVAL_MARKER_TARGET_RELATIVE_PATH,
    },
  };
  return profiles[profileId as GovernedCommandProfileId] ?? null;
}

export interface GovernedCommandRunRequest {
  executable: string;
  args: readonly string[];
  cwd: string;
  timeoutMs: number;
  maxCaptureBytes: number;
}

export interface GovernedCommandRunResult {
  started: boolean;
  startedAt: string | null;
  completedAt: string;
  exitCode: number | null;
  signal: string | null;
  stdout: string;
  stderr: string;
  diagnosticCode: string | null;
}

export interface GovernedCommandRunner {
  run(request: GovernedCommandRunRequest): Promise<GovernedCommandRunResult>;
}

function appendBounded(chunks: Buffer[], chunk: Buffer, maxBytes: number): void {
  const used = chunks.reduce((total, item) => total + item.length, 0);
  if (used >= maxBytes) return;
  chunks.push(chunk.subarray(0, maxBytes - used));
}

export class DirectGovernedCommandRunner implements GovernedCommandRunner {
  run(request: GovernedCommandRunRequest): Promise<GovernedCommandRunResult> {
    return new Promise((resolveRun) => {
      const stdout: Buffer[] = [];
      const stderr: Buffer[] = [];
      let started = false;
      let startedAt: string | null = null;
      let settled = false;
      let timedOut = false;

      const child = spawn(request.executable, [...request.args], {
        cwd: request.cwd,
        shell: false,
        detached: false,
        windowsHide: true,
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      child.stdout.on('data', (chunk: Buffer) =>
        appendBounded(stdout, chunk, request.maxCaptureBytes)
      );
      child.stderr.on('data', (chunk: Buffer) =>
        appendBounded(stderr, chunk, request.maxCaptureBytes)
      );
      child.once('spawn', () => {
        started = true;
        startedAt = new Date().toISOString();
      });

      const timer = setTimeout(() => {
        timedOut = true;
        child.kill();
      }, request.timeoutMs);

      const finish = (
        exitCode: number | null,
        signal: NodeJS.Signals | null,
        diagnosticCode: string | null
      ) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolveRun({
          started,
          startedAt,
          completedAt: new Date().toISOString(),
          exitCode,
          signal,
          stdout: Buffer.concat(stdout).toString('utf-8'),
          stderr: Buffer.concat(stderr).toString('utf-8'),
          diagnosticCode: timedOut ? 'COMMAND_TIMEOUT' : diagnosticCode,
        });
      };

      child.once('error', (error: NodeJS.ErrnoException) =>
        finish(null, null, error.code ?? 'PROCESS_START_FAILED')
      );
      child.once('close', (code, signal) =>
        finish(code, signal, code === 0 && !timedOut ? null : 'COMMAND_EXIT_NONZERO')
      );
    });
  }
}

export interface GovernedCommandLauncherInput {
  profileId: string;
  workspaceRoot: string;
  cwd?: string;
  agentId?: string;
}

export interface GovernedCommandLauncherDependencies {
  engine: GuardRuntimeEngine;
  preflightPersistence: PreflightPersistencePort;
  receiptStore: ReceiptConsumptionStore;
  executionStore: GovernedExecutionStore;
  runner: GovernedCommandRunner;
  approvalPolicy?: MutatingProfileApprovalPolicy;
  now?: () => number;
  generateConsumptionId?: () => string;
}

export interface GovernedCommandLauncherResponse {
  contractVersion: typeof GOVERNED_COMMAND_LAUNCHER_CONTRACT;
  accepted: boolean;
  profileId: string | null;
  receiptId: string | null;
  consumptionId: string | null;
  bindingHash: string | null;
  executionStarted: boolean;
  executionCompleted: boolean;
  exitCode: number | null;
  signal: string | null;
  stdout: string;
  stderr: string;
  knownCredentialPatternsRedacted: true;
  externalInterceptionProved: false;
  approvalBackedMutationProved: boolean;
  error?: { code: string; message: string; retryable: boolean };
}

function rejected(
  code: string,
  message: string,
  profileId: string | null = null,
  retryable = false
): GovernedCommandLauncherResponse {
  return {
    contractVersion: GOVERNED_COMMAND_LAUNCHER_CONTRACT,
    accepted: false,
    profileId,
    receiptId: null,
    consumptionId: null,
    bindingHash: null,
    executionStarted: false,
    executionCompleted: false,
    exitCode: null,
    signal: null,
    stdout: '',
    stderr: '',
    knownCredentialPatternsRedacted: true,
    externalInterceptionProved: false,
    approvalBackedMutationProved: false,
    error: { code, message, retryable },
  };
}

async function resolveWorkspaceCwd(workspaceRoot: string, cwd?: string): Promise<{
  workspace: string;
  cwd: string;
  relativeCwd: string;
}> {
  if (!workspaceRoot.trim()) throw new Error('WORKSPACE_REQUIRED');
  if (cwd && isAbsolute(cwd)) throw new Error('ABSOLUTE_CWD_REJECTED');
  const workspace = await realpath(resolve(workspaceRoot));
  const resolvedCwd = await realpath(resolve(workspace, cwd?.trim() || '.'));
  const relativeCwd = relative(workspace, resolvedCwd).replace(/\\/g, '/');
  if (relativeCwd === '..' || relativeCwd.startsWith('../') || isAbsolute(relativeCwd)) {
    throw new Error('CWD_OUTSIDE_WORKSPACE');
  }
  return { workspace, cwd: resolvedCwd, relativeCwd: relativeCwd || '.' };
}

export function buildGovernedCommandAction(
  profile: GovernedCommandProfile,
  relativeCwd: string
): string {
  const target = profile.mutatingTargetRelativePath
    ? `; target=${profile.mutatingTargetRelativePath}`
    : '';
  return `profile=${profile.id}; executable=${profile.executable}; args=${JSON.stringify(profile.args)}; cwd=${relativeCwd}${target}`;
}

async function finalizeFailedIntent(
  dependencies: GovernedCommandLauncherDependencies,
  consumptionId: string,
  diagnosticCode: string
): Promise<void> {
  await dependencies.executionStore.finalizeExecution(consumptionId, {
    status: 'FAILED',
    startedAt: null,
    completedAt: new Date((dependencies.now ?? Date.now)()).toISOString(),
    exitCode: null,
    signal: null,
    diagnosticCode,
    executionStarted: false,
    executionCompleted: false,
  });
}

export async function launchGovernedCommand(
  input: GovernedCommandLauncherInput,
  dependencies: GovernedCommandLauncherDependencies
): Promise<GovernedCommandLauncherResponse> {
  const profile = getGovernedCommandProfile(input.profileId);
  if (!profile) {
    return rejected('UNKNOWN_COMMAND_PROFILE', 'Only registered CVF command profiles may run.');
  }

  let paths;
  try {
    paths = await resolveWorkspaceCwd(input.workspaceRoot, input.cwd);
  } catch (error) {
    return rejected(
      error instanceof Error ? error.message : 'WORKSPACE_RESOLUTION_FAILED',
      'The working directory must resolve inside the governed workspace.',
      profile.id
    );
  }

  const action = buildGovernedCommandAction(profile, paths.relativeCwd);
  const targetFiles = profile.mutatingTargetRelativePath
    ? [profile.mutatingTargetRelativePath]
    : undefined;
  const preflight = await preflightGovernanceAction(
    {
      actionClass: 'RUN',
      action,
      phase: 'BUILD',
      riskLevel: profile.riskLevel,
      role: 'AI_AGENT',
      agentId: input.agentId?.trim() || 'cvf-governed-exec',
      scope: `workspace:${paths.relativeCwd}`,
      targetFiles,
      mutationCount: profile.mutatingTargetRelativePath ? 1 : undefined,
    },
    dependencies.engine,
    dependencies.preflightPersistence
  );
  if (!preflight.governedActionClaimAllowed || !preflight.receiptId) {
    return rejected(
      preflight.error?.code ?? 'PREFLIGHT_NOT_ALLOWED',
      'Governance preflight did not issue an ALLOW receipt.',
      profile.id,
      preflight.error?.retryable ?? false
    );
  }

  const consumption = await consumeGovernanceActionReceipt(
    { receiptId: preflight.receiptId, actionClass: 'RUN', action, targetFiles },
    dependencies.receiptStore,
    {
      now: dependencies.now,
      generateConsumptionId: dependencies.generateConsumptionId,
    }
  );
  if (
    !consumption.executionAdmissionEligible ||
    !consumption.consumptionId ||
    !consumption.bindingHash
  ) {
    return rejected(
      consumption.error?.code ?? 'RECEIPT_CONSUMPTION_FAILED',
      'Receipt consumption did not establish execution admission.',
      profile.id,
      consumption.error?.retryable ?? false
    );
  }

  const admittedAt = new Date((dependencies.now ?? Date.now)()).toISOString();
  const intent: GovernedExecutionReceipt = {
    contractVersion: GOVERNED_EXECUTION_RECEIPT_CONTRACT,
    consumptionId: consumption.consumptionId,
    receiptId: preflight.receiptId,
    profileId: profile.id,
    bindingHash: consumption.bindingHash,
    status: 'ADMITTED',
    admittedAt,
    startedAt: null,
    completedAt: null,
    exitCode: null,
    signal: null,
    diagnosticCode: null,
    executionStarted: false,
    executionCompleted: false,
    externalInterceptionProved: false,
  };

  let began;
  try {
    began = await dependencies.executionStore.beginExecution(intent);
  } catch {
    return rejected(
      'EXECUTION_INTENT_PERSISTENCE_FAILED',
      'Execution intent persistence failed closed.',
      profile.id,
      true
    );
  }
  if (!began) {
    return rejected('EXECUTION_INTENT_ALREADY_EXISTS', 'Execution intent already exists.', profile.id);
  }

  let approvalId: string | null = null;
  if (profile.mutatingTargetRelativePath) {
    const target = validateApprovalMarkerTarget(profile.mutatingTargetRelativePath);
    if (!target.valid) {
      await finalizeFailedIntent(
        dependencies,
        consumption.consumptionId,
        'APPROVAL_TARGET_MISMATCH'
      );
      return {
        ...rejected('APPROVAL_TARGET_MISMATCH', 'The mutating profile target is not fixed.', profile.id),
        receiptId: preflight.receiptId,
        consumptionId: consumption.consumptionId,
        bindingHash: consumption.bindingHash,
      };
    }
    if (!dependencies.approvalPolicy) {
      await finalizeFailedIntent(
        dependencies,
        consumption.consumptionId,
        'APPROVAL_POLICY_MISSING'
      );
      return {
        ...rejected(
          'APPROVAL_POLICY_MISSING',
          'The mutating profile requires a T4A approval policy.',
          profile.id
        ),
        receiptId: preflight.receiptId,
        consumptionId: consumption.consumptionId,
        bindingHash: consumption.bindingHash,
      };
    }

    const approval = await dependencies.approvalPolicy.evaluate({
      profileId: profile.id,
      targetRelativePath: profile.mutatingTargetRelativePath,
      action,
      bindingHash: consumption.bindingHash,
      nowMs: (dependencies.now ?? Date.now)(),
    });
    if (!approval.approved || !approval.approvalId) {
      const diagnosticCode = approval.diagnosticCode ?? 'APPROVAL_NOT_GRANTED';
      await finalizeFailedIntent(dependencies, consumption.consumptionId, diagnosticCode);
      return {
        ...rejected(
          diagnosticCode,
          'The mutating profile approval evidence did not authorize execution.',
          profile.id
        ),
        receiptId: preflight.receiptId,
        consumptionId: consumption.consumptionId,
        bindingHash: consumption.bindingHash,
      };
    }
    approvalId = approval.approvalId;
  }

  const runResult = await dependencies.runner.run({
    executable: profile.executable,
    args: profile.args,
    cwd: paths.cwd,
    timeoutMs: DEFAULT_COMMAND_TIMEOUT_MS,
    maxCaptureBytes: MAX_CAPTURE_BYTES,
  });
  const success = runResult.started && runResult.exitCode === 0;
  let markerWritten = false;
  let diagnosticCode = runResult.diagnosticCode;
  if (success && profile.mutatingTargetRelativePath) {
    try {
      await writeApprovalMarkerFile({
        workspaceRoot: paths.workspace,
        targetRelativePath: profile.mutatingTargetRelativePath,
        approvalId: approvalId!,
        profileId: APPROVAL_MARKER_PROFILE_ID,
        bindingHash: consumption.bindingHash,
        consumptionId: consumption.consumptionId,
        completedAt: runResult.completedAt,
      });
      markerWritten = true;
    } catch {
      diagnosticCode = 'APPROVAL_MARKER_WRITE_FAILED';
    }
  }
  const finalSuccess = success && (!profile.mutatingTargetRelativePath || markerWritten);

  try {
    await dependencies.executionStore.finalizeExecution(consumption.consumptionId, {
      status: finalSuccess ? 'COMPLETED' : 'FAILED',
      startedAt: runResult.startedAt,
      completedAt: runResult.completedAt,
      exitCode: runResult.exitCode,
      signal: runResult.signal,
      diagnosticCode,
      executionStarted: runResult.started,
      executionCompleted: true,
    });
  } catch {
    return {
      ...rejected(
        'EXECUTION_FINALIZATION_FAILED',
        'The process returned but its execution receipt could not be finalized.',
        profile.id,
        true
      ),
      receiptId: preflight.receiptId,
      consumptionId: consumption.consumptionId,
      bindingHash: consumption.bindingHash,
      executionStarted: runResult.started,
      exitCode: runResult.exitCode,
      signal: runResult.signal,
    };
  }

  const stdout = redactText(runResult.stdout).slice(0, MAX_CAPTURE_BYTES);
  const stderr = redactText(runResult.stderr).slice(0, MAX_CAPTURE_BYTES);
  return {
    contractVersion: GOVERNED_COMMAND_LAUNCHER_CONTRACT,
    accepted: finalSuccess,
    profileId: profile.id,
    receiptId: preflight.receiptId,
    consumptionId: consumption.consumptionId,
    bindingHash: consumption.bindingHash,
    executionStarted: runResult.started,
    executionCompleted: true,
    exitCode: runResult.exitCode,
    signal: runResult.signal,
    stdout,
    stderr,
    knownCredentialPatternsRedacted: true,
    externalInterceptionProved: false,
    approvalBackedMutationProved:
      profile.mutatingTargetRelativePath === APPROVAL_MARKER_TARGET_RELATIVE_PATH && markerWritten,
    ...(finalSuccess
      ? {}
      : {
          error: {
            code: diagnosticCode ?? 'COMMAND_FAILED',
            message: 'The governed command did not complete successfully.',
            retryable: false,
          },
        }),
  };
}
