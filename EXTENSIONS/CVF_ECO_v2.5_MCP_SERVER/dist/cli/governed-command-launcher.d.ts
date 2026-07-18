/** Delta-T3 static-profile governed command launcher. */
import type { GuardRuntimeEngine } from '../guards/engine.js';
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
export declare function buildGovernedCommandAction(profile: GovernedCommandProfile, relativeCwd: string): string;
export declare function launchGovernedCommand(input: GovernedCommandLauncherInput, dependencies: GovernedCommandLauncherDependencies): Promise<GovernedCommandLauncherResponse>;
//# sourceMappingURL=governed-command-launcher.d.ts.map