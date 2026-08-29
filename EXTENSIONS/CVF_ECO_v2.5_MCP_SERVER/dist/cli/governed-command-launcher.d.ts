/** Delta-T3 static-profile governed command launcher. */
import type { GuardRuntimeEngine } from 'cvf-guard-contract';
import type { CVFRiskLevel } from '../guards/types.js';
import type { PreflightPersistencePort } from '../tools/governance-action-preflight.js';
import type { ReceiptConsumptionStore } from '../persistence/json-receipt-consumption.store.js';
import { type GovernedExecutionStore } from '../persistence/json-governed-execution.store.js';
import { APPROVAL_MARKER_TARGET_RELATIVE_PATH, type MutatingProfileApprovalPolicy } from './mutating-profile-approval.js';
export declare const GOVERNED_COMMAND_LAUNCHER_CONTRACT: "cvf.delta.governedCommandLauncher.v1";
export declare const MAX_CAPTURE_BYTES = 65536;
export declare const DEFAULT_COMMAND_TIMEOUT_MS = 600000;
export declare const GOVERNED_COMMAND_PROFILE_IDS: readonly ["git-status", "git-diff-check", "approval-marker-write"];
export type GovernedCommandProfileId = (typeof GOVERNED_COMMAND_PROFILE_IDS)[number];
export interface GovernedCommandProfile {
    id: GovernedCommandProfileId;
    executable: string;
    args: readonly string[];
    riskLevel: CVFRiskLevel;
    mutatingTargetRelativePath?: typeof APPROVAL_MARKER_TARGET_RELATIVE_PATH;
}
export declare function getGovernedCommandProfile(profileId: string): GovernedCommandProfile | null;
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
export declare class DirectGovernedCommandRunner implements GovernedCommandRunner {
    run(request: GovernedCommandRunRequest): Promise<GovernedCommandRunResult>;
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
    error?: {
        code: string;
        message: string;
        retryable: boolean;
    };
}
/**
 * Truthful CVF phase/role pairing for this profile's declared action intent.
 *
 * Read-only profiles (git-status, git-diff-check) genuinely inspect and
 * produce no mutation, so they are labeled with the canonical read-only
 * action-intent vocabulary (`read`) rather than an allow-listed authoring
 * verb chosen only to dodge ai_commit/build_authority. Role AI_AGENT is
 * canonically restricted by phase_gate.PHASE_ROLE_MATRIX to phase BUILD
 * only (AI_AGENT does not appear in the REVIEW phase's allowed-role list),
 * and authority_gate's AI_AGENT.BUILD cell authorizes only authoring verbs
 * (create, modify, build, implement, code, write) - it does not include
 * `read`. So under the current canonical contract there is no phase/role
 * cell where AI_AGENT can truthfully perform a `read` action: labeling it
 * honestly means phase_gate or authority_gate genuinely BLOCKs it. That is
 * the correct, intended outcome here, not a defect: a real read-only
 * inspection command must remain blocked for this role rather than be
 * relabeled to something the guard happens to allow.
 *
 * The one profile with a fixed mutatingTargetRelativePath genuinely mutates,
 * so it is labeled "write" at role AI_AGENT in phase BUILD - the truthful
 * phase/role cell for a BUILD-phase mutation
 * (AUTHORITY_MATRIX.AI_AGENT.BUILD includes 'write'). "write" carries modify
 * intent, so it correctly requires ai_commit and build_authority evidence.
 * This launcher does not fabricate that evidence (see launchGovernedCommand):
 * without an independently sourced accepted SPEC and valid WORK ORDER, the
 * mutating profile fails closed at the guard, before the runner is invoked
 * or the marker file is written.
 */
export declare function buildGovernedCommandPhaseAndRole(profile: GovernedCommandProfile): {
    phase: 'BUILD';
    role: 'AI_AGENT';
    verb: 'read' | 'write';
};
export declare function buildGovernedCommandAction(profile: GovernedCommandProfile, relativeCwd: string): string;
export declare function launchGovernedCommand(input: GovernedCommandLauncherInput, dependencies: GovernedCommandLauncherDependencies): Promise<GovernedCommandLauncherResponse>;
//# sourceMappingURL=governed-command-launcher.d.ts.map