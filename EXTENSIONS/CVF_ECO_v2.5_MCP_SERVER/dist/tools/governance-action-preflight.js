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
import { z } from 'zod';
import { withMcpToolAudit } from '../audit/mcp-tool-audit.js';
export const PREFLIGHT_TOOL = 'cvf_preflight_governance_action';
export const PREFLIGHT_CONTRACT = 'cvf.delta.governanceActionPreflight.v1';
export const PREFLIGHT_ACTION_CLASSES = ['EDIT', 'RUN', 'COMMIT'];
const PHASE_VALUES = ['DISCOVERY', 'DESIGN', 'BUILD', 'REVIEW'];
const RISK_VALUES = ['R0', 'R1', 'R2', 'R3'];
const ROLE_VALUES = ['HUMAN', 'AI_AGENT', 'REVIEWER', 'OPERATOR'];
export const REDACTED_PLACEHOLDER = '[REDACTED]';
/**
 * Detects credential-bearing key names anywhere in a structured value.
 */
const SECRET_KEY = /^(?:api[_-]?key|authorization|credential(?:Ref(?:erence)?)?|password|passphrase|secret|(?:access|auth|bearer|session|refresh)[_-]?token)$/i;
/**
 * Detects inline credential assignments in free text, e.g.
 * `API_KEY=sk-abc...`, `password: hunter2`, or a bare `sk-`/`xoxb-` token.
 */
const SECRET_TEXT_PATTERNS = [
    /\b([A-Za-z0-9_]*(?:api[_-]?key|secret|token|password|passphrase|credential)[A-Za-z0-9_]*)\s*[:=]\s*\S+/gi,
    /\b(sk-[A-Za-z0-9_-]{12,})\b/g,
    /\b(xox[baprs]-[A-Za-z0-9-]{10,})\b/g,
    /\bBearer\s+[A-Za-z0-9._-]{12,}/gi,
];
/**
 * Serializes writes for adapters whose read-modify-write cycle is not itself
 * concurrency-safe. A failed write does not poison later queued writes.
 */
export function serializePreflightPersistence(persistence) {
    let tail = Promise.resolve();
    return {
        saveAuditEntry(entry) {
            const pending = tail.then(() => persistence.saveAuditEntry(entry));
            tail = pending.catch(() => undefined);
            return pending;
        },
    };
}
function containsCredentialMaterial(value) {
    if (Array.isArray(value)) {
        return value.some(containsCredentialMaterial);
    }
    if (typeof value === 'string') {
        return textContainsSecret(value);
    }
    if (!value || typeof value !== 'object') {
        return false;
    }
    return Object.entries(value).some(([key, nested]) => SECRET_KEY.test(key) || containsCredentialMaterial(nested));
}
/**
 * Returns true when free text looks like it embeds a raw secret value.
 */
export function textContainsSecret(text) {
    return SECRET_TEXT_PATTERNS.some((pattern) => {
        pattern.lastIndex = 0;
        return pattern.test(text);
    });
}
/**
 * Replaces inline credential material in free text with a placeholder so the
 * raw value never reaches the response, in-memory guard context, or audit JSON.
 */
export function redactText(text) {
    let redacted = text;
    for (const pattern of SECRET_TEXT_PATTERNS) {
        pattern.lastIndex = 0;
        redacted = redacted.replace(pattern, REDACTED_PLACEHOLDER);
    }
    return redacted;
}
function generateRequestId() {
    return `delta-preflight-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}
function rejected(code, message, retryable = false) {
    return {
        contractVersion: PREFLIGHT_CONTRACT,
        tool: PREFLIGHT_TOOL,
        accepted: false,
        actionClass: null,
        decision: null,
        receiptId: null,
        requestId: null,
        auditPersisted: false,
        governedActionClaimAllowed: false,
        rawSecretPrinted: false,
        error: { code, message, retryable },
    };
}
/**
 * Pure preflight handler. Evaluates the planned action through the injected
 * guard engine and persists a secret-safe audit entry through the injected
 * persistence port before returning a valid receipt.
 */
export async function preflightGovernanceAction(input, engine, persistence) {
    // Reject secrets in structured fields outright. Free-text action content is
    // handled separately so it can be redacted before evaluation and storage.
    const { action: _action, ...structuredInput } = input;
    if (containsCredentialMaterial(structuredInput)) {
        return rejected('RAW_CREDENTIAL_INPUT_REJECTED', 'Credential-bearing fields are not accepted by the governance-action preflight.');
    }
    const actionClass = input.actionClass;
    if (!PREFLIGHT_ACTION_CLASSES.includes(actionClass)) {
        return rejected('INVALID_ACTION_CLASS', 'actionClass must be one of EDIT, RUN, or COMMIT.');
    }
    const rawAction = typeof input.action === 'string' ? input.action.trim() : '';
    if (!rawAction) {
        return rejected('INVALID_PREFLIGHT_REQUEST', 'A non-empty action description is required.');
    }
    // Redact inline secrets before the value reaches the guard context,
    // the response, or the persisted audit JSON.
    const action = redactText(rawAction);
    const requestId = generateRequestId();
    const context = {
        requestId,
        phase: input.phase ?? 'BUILD',
        riskLevel: input.riskLevel ?? 'R2',
        role: input.role ?? 'AI_AGENT',
        agentId: input.agentId,
        action: `${actionClass}: ${action}`,
        targetFiles: input.targetFiles,
        mutationCount: input.mutationCount,
        traceHash: input.traceHash,
        scope: input.scope,
        metadata: { actionClass, contract: PREFLIGHT_CONTRACT },
    };
    const pipelineResult = engine.evaluate(context);
    const decision = pipelineResult.finalDecision;
    const auditEntry = {
        requestId,
        timestamp: pipelineResult.executedAt,
        context,
        pipelineResult,
    };
    let auditPersisted = false;
    try {
        await persistence.saveAuditEntry(auditEntry);
        auditPersisted = true;
    }
    catch {
        // Fail closed: persistence failure must not yield a valid receipt claim.
        return {
            contractVersion: PREFLIGHT_CONTRACT,
            tool: PREFLIGHT_TOOL,
            accepted: false,
            actionClass,
            decision,
            receiptId: null,
            requestId,
            auditPersisted: false,
            governedActionClaimAllowed: false,
            rawSecretPrinted: false,
            reason: pipelineResult.agentGuidance,
            error: {
                code: 'AUDIT_PERSISTENCE_FAILED',
                message: 'Preflight could not durably record the audit entry; no valid receipt was issued.',
                retryable: true,
            },
        };
    }
    const governedActionClaimAllowed = decision === 'ALLOW' && auditPersisted;
    return {
        contractVersion: PREFLIGHT_CONTRACT,
        tool: PREFLIGHT_TOOL,
        accepted: true,
        actionClass,
        decision,
        receiptId: requestId,
        requestId,
        auditPersisted,
        governedActionClaimAllowed,
        rawSecretPrinted: false,
        agentGuidance: pipelineResult.agentGuidance,
        reason: governedActionClaimAllowed
            ? 'Action evaluated ALLOW and the audit entry is durably persisted. You may proceed with the planned action. This receipt does not prove the action was executed or intercepted.'
            : 'Action did not pass cleanly or could not establish a proceed claim. Address the guard guidance before proceeding.',
    };
}
/**
 * Registers `cvf_preflight_governance_action` on the MCP server using the
 * injected guard engine and persistence port. Thin registration only.
 */
export function registerGovernanceActionPreflightTool(server, engine, persistence) {
    server.tool(PREFLIGHT_TOOL, 'Delta preflight: evaluate a planned EDIT, RUN, or COMMIT action through the CVF guard engine, durably record a secret-safe audit entry, and return a correlated receipt. A receipt proves only that the preflight evaluated the action and persisted the audit entry. It does not prove the action was executed or that any IDE, shell, git, or filesystem was intercepted.', {
        actionClass: z.enum(PREFLIGHT_ACTION_CLASSES).describe('Planned action class: EDIT, RUN, or COMMIT'),
        action: z.string().min(1).describe('Description of the planned action. Do not include raw secrets.'),
        phase: z.enum(PHASE_VALUES).optional().describe('CVF phase: DISCOVERY, DESIGN, BUILD, or REVIEW (default BUILD)'),
        riskLevel: z.enum(RISK_VALUES).optional().describe('Risk level: R0, R1, R2, or R3 (default R2)'),
        role: z.enum(ROLE_VALUES).optional().describe('Role: HUMAN, AI_AGENT, REVIEWER, or OPERATOR (default AI_AGENT)'),
        agentId: z.string().optional().describe('Agent identifier (recommended for AI_AGENT role)'),
        targetFiles: z.array(z.string()).optional().describe('Files the action will touch'),
        mutationCount: z.number().int().min(0).optional().describe('Mutations made so far this session'),
        traceHash: z.string().optional().describe('Trace hash for R2/R3 actions'),
        scope: z.string().optional().describe('Optional scope descriptor'),
    }, async (args) => withMcpToolAudit(PREFLIGHT_TOOL, args, async () => {
        const receipt = await preflightGovernanceAction(args, engine, persistence);
        return {
            content: [{ type: 'text', text: JSON.stringify(receipt, null, 2) }],
        };
    }));
}
//# sourceMappingURL=governance-action-preflight.js.map