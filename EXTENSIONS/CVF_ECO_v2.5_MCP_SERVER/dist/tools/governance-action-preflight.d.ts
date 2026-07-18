/**
 * Delta-T1 Governance Action Preflight Receipt tool.
 *
 * Adds the modular MCP tool `cvf_preflight_governance_action`. It evaluates a
 * planned EDIT, RUN, or COMMIT action through the existing guard engine,
 * persists a secret-safe audit entry through the existing persistence port, and
 * returns a correlated receipt only after durable persistence succeeds.
 *
 * Boundary: this tool proves only that an invoked preflight evaluated a planned
 * action and durably recorded a secret-safe audit entry. It does not prove that
 * any agent, IDE, shell, git, or filesystem was forced to call it, that an
 * action was executed, that a wrapper consumed the receipt, or that all coding
 * actions are governed.
 *
 * @module tools/governance-action-preflight
 */
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { GuardRuntimeEngine } from '../guards/engine.js';
import type { CVFPhase, CVFRiskLevel, CVFRole, GuardAuditEntry } from '../guards/types.js';
export declare const PREFLIGHT_TOOL: "cvf_preflight_governance_action";
export declare const PREFLIGHT_CONTRACT: "cvf.delta.governanceActionPreflight.v1";
export declare const PREFLIGHT_ACTION_CLASSES: readonly ["EDIT", "RUN", "COMMIT"];
export type PreflightActionClass = (typeof PREFLIGHT_ACTION_CLASSES)[number];
export declare const REDACTED_PLACEHOLDER = "[REDACTED]";
export interface PreflightInput {
    actionClass: PreflightActionClass;
    action: string;
    phase?: CVFPhase;
    riskLevel?: CVFRiskLevel;
    role?: CVFRole;
    agentId?: string;
    targetFiles?: string[];
    mutationCount?: number;
    traceHash?: string;
    scope?: string;
}
export interface PreflightReceipt {
    contractVersion: typeof PREFLIGHT_CONTRACT;
    tool: typeof PREFLIGHT_TOOL;
    accepted: boolean;
    actionClass: PreflightActionClass | null;
    decision: 'ALLOW' | 'BLOCK' | 'ESCALATE' | null;
    receiptId: string | null;
    requestId: string | null;
    auditPersisted: boolean;
    governedActionClaimAllowed: false | true;
    rawSecretPrinted: false;
    agentGuidance?: string;
    reason?: string;
    error?: {
        code: string;
        message: string;
        retryable: boolean;
    };
}
/**
 * Minimal persistence port used by the pure handler. The full
 * `PersistenceAdapter` satisfies this shape; tests can supply a fake.
 */
export interface PreflightPersistencePort {
    saveAuditEntry(entry: GuardAuditEntry): Promise<void>;
}
/**
 * Serializes writes for adapters whose read-modify-write cycle is not itself
 * concurrency-safe. A failed write does not poison later queued writes.
 */
export declare function serializePreflightPersistence(persistence: PreflightPersistencePort): PreflightPersistencePort;
/**
 * Returns true when free text looks like it embeds a raw secret value.
 */
export declare function textContainsSecret(text: string): boolean;
/**
 * Replaces inline credential material in free text with a placeholder so the
 * raw value never reaches the response, in-memory guard context, or audit JSON.
 */
export declare function redactText(text: string): string;
/**
 * Pure preflight handler. Evaluates the planned action through the injected
 * guard engine and persists a secret-safe audit entry through the injected
 * persistence port before returning a valid receipt.
 */
export declare function preflightGovernanceAction(input: PreflightInput, engine: GuardRuntimeEngine, persistence: PreflightPersistencePort): Promise<PreflightReceipt>;
/**
 * Registers `cvf_preflight_governance_action` on the MCP server using the
 * injected guard engine and persistence port. Thin registration only.
 */
export declare function registerGovernanceActionPreflightTool(server: McpServer, engine: GuardRuntimeEngine, persistence: PreflightPersistencePort): void;
//# sourceMappingURL=governance-action-preflight.d.ts.map