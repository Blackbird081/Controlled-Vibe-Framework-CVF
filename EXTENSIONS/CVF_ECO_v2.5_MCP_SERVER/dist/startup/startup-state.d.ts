/**
 * CVF Startup State Tools — Gamma
 *
 * Read-only helpers for MCP startup memory bootstrap. These helpers resolve
 * repo state from disk and return secret-redacted payloads for agents.
 */
export declare const STARTUP_STATE_CONTRACT_VERSION: "cvf.mcpStartupState.gamma.v1";
export interface ResolvedCvfRepo {
    repoRoot: string;
    sessionMemoryPath: string;
    activeStatePath: string;
}
export interface RedactedFileReadout {
    path: string;
    exists: boolean;
    sha256: string | null;
    bytes: number;
    truncated: boolean;
    content: string;
}
export interface StartupAcknowledgmentReadout {
    contractVersion: typeof STARTUP_STATE_CONTRACT_VERSION;
    currentMode: string | null;
    activeHandoff: string | null;
    nextAllowedMove: string | null;
    parkedCheckpoint: string;
    acknowledgment: string;
    repoRoot: string;
}
export interface GovernanceCheckReadout {
    contractVersion: typeof STARTUP_STATE_CONTRACT_VERSION;
    action: string;
    decision: 'ALLOW_WITH_GUARDS' | 'CLARIFY' | 'BLOCK';
    requiredRules: string[];
    requiredArtifacts: string[];
    safeMessage: string;
}
export declare function resolveCvfRepo(startDir?: string): ResolvedCvfRepo;
export declare function redactSensitiveText(input: string): string;
export declare function readRedactedFile(repoRoot: string, relativePath: string, maxChars?: number): RedactedFileReadout;
export declare function getSessionMemory(maxChars?: number, startDir?: string): RedactedFileReadout;
export declare function getSessionState(maxChars?: number, startDir?: string): RedactedFileReadout;
export declare function getActiveHandoff(maxChars?: number, startDir?: string): RedactedFileReadout;
export declare function buildStartupAcknowledgment(startDir?: string): StartupAcknowledgmentReadout;
export declare function getGovernanceRules(topic?: string, maxChars?: number, startDir?: string): {
    contractVersion: typeof STARTUP_STATE_CONTRACT_VERSION;
    topic: string;
    files: RedactedFileReadout[];
};
export declare function checkGovernanceAction(action: string): GovernanceCheckReadout;
//# sourceMappingURL=startup-state.d.ts.map