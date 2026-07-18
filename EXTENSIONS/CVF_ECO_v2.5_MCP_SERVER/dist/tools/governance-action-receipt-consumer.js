/**
 * Delta-T2 governance-action receipt consumer.
 *
 * Validates one fresh Delta-T1 ALLOW receipt against an exact action binding,
 * then atomically claims a secret-safe one-time marker. It never executes the
 * action and does not prove external interception or mandatory invocation.
 */
import { createHash } from 'node:crypto';
import { z } from 'zod';
import { withMcpToolAudit } from '../audit/mcp-tool-audit.js';
import { RECEIPT_ID_PATTERN } from '../persistence/json-receipt-consumption.store.js';
import { PREFLIGHT_ACTION_CLASSES, PREFLIGHT_CONTRACT, textContainsSecret, } from './governance-action-preflight.js';
export const RECEIPT_CONSUMER_TOOL = 'cvf_consume_governance_action_receipt';
export const RECEIPT_CONSUMER_CONTRACT = 'cvf.delta.governanceActionReceiptConsumption.v1';
export const DEFAULT_RECEIPT_TTL_MS = 300_000;
export const MIN_RECEIPT_TTL_SECONDS = 30;
export const MAX_RECEIPT_TTL_SECONDS = 3_600;
const DEFAULT_FUTURE_SKEW_MS = 30_000;
export function resolveReceiptTtlMs(rawSeconds) {
    if (!rawSeconds)
        return DEFAULT_RECEIPT_TTL_MS;
    const seconds = Number(rawSeconds);
    if (!Number.isInteger(seconds))
        return DEFAULT_RECEIPT_TTL_MS;
    if (seconds < MIN_RECEIPT_TTL_SECONDS || seconds > MAX_RECEIPT_TTL_SECONDS) {
        return DEFAULT_RECEIPT_TTL_MS;
    }
    return seconds * 1_000;
}
function rejected(code, message, options = {}) {
    return {
        contractVersion: RECEIPT_CONSUMER_CONTRACT,
        tool: RECEIPT_CONSUMER_TOOL,
        accepted: false,
        receiptId: options.receiptId ?? null,
        actionClass: options.actionClass ?? null,
        receiptValid: options.receiptValid ?? false,
        receiptConsumed: false,
        executionAdmissionEligible: false,
        consumptionId: null,
        bindingHash: null,
        actionExecutionProved: false,
        externalInterceptionProved: false,
        rawSecretPrinted: false,
        error: { code, message, retryable: options.retryable ?? false },
    };
}
function normalizeTargets(targetFiles) {
    return [...new Set((targetFiles ?? []).map((target) => target.trim().replace(/\\/g, '/')))]
        .filter(Boolean)
        .sort();
}
function sameStrings(left, right) {
    return left.length === right.length && left.every((value, index) => value === right[index]);
}
function bindingHash(input) {
    return createHash('sha256')
        .update(JSON.stringify({
        receiptId: input.receiptId,
        actionClass: input.actionClass,
        action: input.action,
        targetFiles: input.targetFiles,
    }))
        .digest('hex');
}
function defaultConsumptionId() {
    return `delta-consumption-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}
export async function consumeGovernanceActionReceipt(input, store, options = {}) {
    const receiptId = typeof input.receiptId === 'string' ? input.receiptId.trim() : '';
    if (!RECEIPT_ID_PATTERN.test(receiptId)) {
        return rejected('INVALID_RECEIPT_ID', 'A valid Delta preflight receipt id is required.');
    }
    if (!PREFLIGHT_ACTION_CLASSES.includes(input.actionClass)) {
        return rejected('INVALID_ACTION_CLASS', 'actionClass must be EDIT, RUN, or COMMIT.', {
            receiptId,
        });
    }
    const action = typeof input.action === 'string' ? input.action.trim() : '';
    const requestedTargets = normalizeTargets(input.targetFiles);
    if (!action) {
        return rejected('INVALID_CONSUMPTION_REQUEST', 'A non-empty action description is required.', {
            receiptId,
            actionClass: input.actionClass,
        });
    }
    if (textContainsSecret(action) || requestedTargets.some(textContainsSecret)) {
        return rejected('RAW_CREDENTIAL_INPUT_REJECTED', 'Credential-bearing values are not accepted by the receipt consumer.', { receiptId, actionClass: input.actionClass });
    }
    let entries;
    try {
        entries = await store.getPreflightAuditEntries(receiptId);
    }
    catch {
        return rejected('RECEIPT_LOOKUP_FAILED', 'Receipt audit lookup failed closed.', {
            receiptId,
            actionClass: input.actionClass,
            retryable: true,
        });
    }
    if (entries.length === 0) {
        return rejected('RECEIPT_NOT_FOUND', 'No persisted preflight audit matches this receipt.', {
            receiptId,
            actionClass: input.actionClass,
        });
    }
    if (entries.length !== 1) {
        return rejected('RECEIPT_AMBIGUOUS', 'Receipt audit lookup did not resolve exactly one entry.', {
            receiptId,
            actionClass: input.actionClass,
        });
    }
    const entry = entries[0];
    const metadata = entry.context.metadata ?? {};
    const persistedActionClass = metadata.actionClass;
    const persistedContract = metadata.contract;
    const idsMatch = entry.requestId === receiptId &&
        entry.context.requestId === receiptId &&
        entry.pipelineResult.requestId === receiptId;
    if (!idsMatch ||
        persistedContract !== PREFLIGHT_CONTRACT ||
        persistedActionClass !== input.actionClass ||
        entry.timestamp !== entry.pipelineResult.executedAt) {
        return rejected('RECEIPT_AUTHORITY_INVALID', 'Receipt audit authority fields are invalid.', {
            receiptId,
            actionClass: input.actionClass,
        });
    }
    if (entry.pipelineResult.finalDecision !== 'ALLOW') {
        return rejected('RECEIPT_DECISION_NOT_ALLOW', 'Only an ALLOW preflight receipt can be consumed.', {
            receiptId,
            actionClass: input.actionClass,
        });
    }
    const expectedAction = `${input.actionClass}: ${action}`;
    const persistedTargets = normalizeTargets(entry.context.targetFiles);
    if (entry.context.action !== expectedAction || !sameStrings(persistedTargets, requestedTargets)) {
        return rejected('RECEIPT_BINDING_MISMATCH', 'Receipt action binding does not match the request.', {
            receiptId,
            actionClass: input.actionClass,
        });
    }
    const nowMs = (options.now ?? Date.now)();
    const issuedAtMs = Date.parse(entry.timestamp);
    const maxReceiptAgeMs = options.maxReceiptAgeMs ?? DEFAULT_RECEIPT_TTL_MS;
    const futureSkewMs = options.futureSkewMs ?? DEFAULT_FUTURE_SKEW_MS;
    if (!Number.isFinite(issuedAtMs)) {
        return rejected('RECEIPT_TIMESTAMP_INVALID', 'Receipt timestamp is invalid.', {
            receiptId,
            actionClass: input.actionClass,
        });
    }
    if (issuedAtMs - nowMs > futureSkewMs) {
        return rejected('RECEIPT_FROM_FUTURE', 'Receipt timestamp exceeds allowed clock skew.', {
            receiptId,
            actionClass: input.actionClass,
        });
    }
    if (nowMs - issuedAtMs > maxReceiptAgeMs) {
        return rejected('RECEIPT_EXPIRED', 'Receipt is older than the server-controlled TTL.', {
            receiptId,
            actionClass: input.actionClass,
        });
    }
    const hash = bindingHash({
        receiptId,
        actionClass: input.actionClass,
        action,
        targetFiles: requestedTargets,
    });
    const consumptionId = (options.generateConsumptionId ?? defaultConsumptionId)();
    const consumedAt = new Date(nowMs).toISOString();
    const marker = {
        contractVersion: RECEIPT_CONSUMER_CONTRACT,
        preflightContractVersion: PREFLIGHT_CONTRACT,
        receiptId,
        consumptionId,
        consumedAt,
        actionClass: input.actionClass,
        bindingHash: hash,
        actionExecutionProved: false,
        externalInterceptionProved: false,
    };
    let claimed;
    try {
        claimed = await store.claimReceipt(marker);
    }
    catch {
        return rejected('CONSUMPTION_PERSISTENCE_FAILED', 'Receipt claim persistence failed closed.', {
            receiptId,
            actionClass: input.actionClass,
            receiptValid: true,
            retryable: true,
        });
    }
    if (!claimed) {
        return rejected('RECEIPT_ALREADY_CONSUMED', 'Receipt has already been consumed.', {
            receiptId,
            actionClass: input.actionClass,
            receiptValid: true,
        });
    }
    return {
        contractVersion: RECEIPT_CONSUMER_CONTRACT,
        tool: RECEIPT_CONSUMER_TOOL,
        accepted: true,
        receiptId,
        actionClass: input.actionClass,
        receiptValid: true,
        receiptConsumed: true,
        executionAdmissionEligible: true,
        consumptionId,
        bindingHash: hash,
        actionExecutionProved: false,
        externalInterceptionProved: false,
        rawSecretPrinted: false,
        reason: 'The matching fresh preflight receipt was atomically consumed. This result does not prove action execution or external interception.',
    };
}
export function registerGovernanceActionReceiptConsumerTool(server, store, options = {}) {
    server.tool(RECEIPT_CONSUMER_TOOL, 'Delta receipt consumer: validate one fresh matching Delta-T1 ALLOW receipt and atomically claim it once. Consumption does not execute the action and does not prove IDE, shell, git, or filesystem interception.', {
        receiptId: z.string().min(1).max(160).describe('Delta-T1 preflight receipt id'),
        actionClass: z.enum(PREFLIGHT_ACTION_CLASSES).describe('Matching action class'),
        action: z.string().min(1).describe('Exact safe action description used at preflight'),
        targetFiles: z.array(z.string()).optional().describe('Exact target-file set used at preflight'),
    }, async (args) => withMcpToolAudit(RECEIPT_CONSUMER_TOOL, args, async () => {
        const response = await consumeGovernanceActionReceipt(args, store, options);
        return {
            content: [{ type: 'text', text: JSON.stringify(response, null, 2) }],
        };
    }));
}
//# sourceMappingURL=governance-action-receipt-consumer.js.map