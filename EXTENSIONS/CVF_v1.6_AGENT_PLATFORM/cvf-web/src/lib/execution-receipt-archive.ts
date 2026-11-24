import type { GovernanceEvidenceReceipt } from '@/lib/ai';
import type { GovernanceRolePlanSummary } from '@/lib/ai/types';
import type { ExecutionEvidenceSnapshot } from '@/types';
import { isReviewDiagnostic } from './role-plan-review-status';

export const RECEIPT_ARCHIVE_VERSION = 'cvf.executionReceiptArchive.v1' as const;
export const PILOT_RECEIPT_ARCHIVE_VERSION = 'cvf.executionReceiptArchive.pilot.v2' as const;
const MAX_PILOT_RECEIPT_BYTES = 128 * 1024;

const requiredStringFields = ['receiptId', 'routeId', 'generatedAt'] as const;
const optionalStringFields = [
    'decision', 'riskLevel', 'provider', 'model', 'routingDecision',
    'policySnapshotId', 'envelopeId', 'canonicalExecutionId',
    'knowledgeSource', 'approvalId', 'validationHint',
] as const;
const optionalBooleanFields = ['knowledgeInjected', 'vision'] as const;
const receiptFields = new Set<string>([
    ...requiredStringFields, ...optionalStringFields,
    ...optionalBooleanFields, 'evidenceMode', 'knowledgeCollectionId',
    'knowledgeChunkCount', 'rolePlan',
]);
const ROLE_PLAN_KEYS = ['reviewerVerdict', 'revisionApplied', 'revisionReviewed', 'recheckVerdict', 'stoppedEarly', 'promptContract', 'stepCount'] as const;
const ROLE_PLAN_DIAGNOSTICS = ['reviewerDiagnostic', 'recheckDiagnostic'] as const;
const ROLE_PLAN_ALL_KEYS = new Set<string>([...ROLE_PLAN_KEYS, ...ROLE_PLAN_DIAGNOSTICS]);
const ROLE_PLAN_VERDICTS = ['PASS', 'REVISE', 'UNPARSEABLE', 'NOT_RUN'];
const ROLE_PLAN_STOPS = ['DEADLINE', 'EMPTY_DRAFT', 'ATTEMPT_DENIED', 'FAILED'];
const MAX_ROLE_PLAN_CONTRACT_CHARS = 128;
const MAX_ROLE_PLAN_STEPS = 16;

export type SavedReceiptProjection = Pick<GovernanceEvidenceReceipt,
    'receiptId' | 'evidenceMode' | 'routeId' | 'generatedAt'> &
    Partial<Pick<GovernanceEvidenceReceipt,
    'decision' | 'riskLevel' | 'provider' | 'model' | 'routingDecision' |
    'policySnapshotId' | 'envelopeId' | 'canonicalExecutionId' |
    'knowledgeSource' | 'knowledgeInjected' | 'knowledgeCollectionId' |
    'knowledgeChunkCount' | 'approvalId' | 'validationHint' | 'vision' | 'rolePlan'>>;

interface ScalarExecutionReceiptArchive {
    schemaVersion: typeof RECEIPT_ARCHIVE_VERSION;
    executionId: string;
    outputSha256: string;
    receipt: SavedReceiptProjection;
}

interface PilotExecutionReceiptArchive {
    schemaVersion: typeof PILOT_RECEIPT_ARCHIVE_VERSION;
    executionId: string;
    outputSha256: string;
    receipt: GovernanceEvidenceReceipt;
}

export type ExecutionReceiptArchive = ScalarExecutionReceiptArchive | PilotExecutionReceiptArchive;

function record(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Exact copy of the compact role-plan verdict summary (outcome fidelity O6), or undefined when the value is not exactly that shape. */
function projectRolePlan(value: unknown): GovernanceRolePlanSummary | undefined {
    if (!record(value) || Object.keys(value).some(key => !ROLE_PLAN_ALL_KEYS.has(key)) || !ROLE_PLAN_KEYS.every(key => Object.prototype.hasOwnProperty.call(value, key))) return undefined;
    for (const key of ROLE_PLAN_DIAGNOSTICS) {
        if (Object.prototype.hasOwnProperty.call(value, key) && (!isReviewDiagnostic(value[key]) || value[key === 'reviewerDiagnostic' ? 'reviewerVerdict' : 'recheckVerdict'] !== 'UNPARSEABLE')) return undefined;
    }
    if (!ROLE_PLAN_VERDICTS.includes(value.reviewerVerdict as string) || typeof value.revisionApplied !== 'boolean') return undefined;
    if (value.revisionReviewed !== null && typeof value.revisionReviewed !== 'boolean') return undefined;
    if (value.recheckVerdict !== null && !ROLE_PLAN_VERDICTS.includes(value.recheckVerdict as string)) return undefined;
    if (value.stoppedEarly !== null && !ROLE_PLAN_STOPS.includes(value.stoppedEarly as string)) return undefined;
    if (typeof value.promptContract !== 'string' || value.promptContract.length > MAX_ROLE_PLAN_CONTRACT_CHARS) return undefined;
    if (typeof value.stepCount !== 'number' || !Number.isSafeInteger(value.stepCount) || value.stepCount < 0 || value.stepCount > MAX_ROLE_PLAN_STEPS) return undefined;
    const copy: Record<string, unknown> = {};
    for (const key of ROLE_PLAN_KEYS) copy[key] = value[key];
    for (const key of ROLE_PLAN_DIAGNOSTICS) if (Object.prototype.hasOwnProperty.call(value, key)) copy[key] = value[key];
    return copy as unknown as GovernanceRolePlanSummary;
}

function projectReceipt(value: unknown, rejectUnknown: boolean): SavedReceiptProjection | undefined {
    if (!record(value)) return undefined;
    if (rejectUnknown && Object.keys(value).some(key => !receiptFields.has(key))) return undefined;
    for (const key of requiredStringFields) {
        if (typeof value[key] !== 'string' || !value[key]) return undefined;
    }
    if (value.evidenceMode !== 'live' && value.evidenceMode !== 'mock' && value.evidenceMode !== 'static') return undefined;
    for (const key of optionalStringFields) {
        if (value[key] !== undefined && typeof value[key] !== 'string') return undefined;
    }
    for (const key of optionalBooleanFields) {
        if (value[key] !== undefined && typeof value[key] !== 'boolean') return undefined;
    }
    if (value.knowledgeCollectionId !== undefined && value.knowledgeCollectionId !== null && typeof value.knowledgeCollectionId !== 'string') return undefined;
    if (value.knowledgeChunkCount !== undefined &&
        (typeof value.knowledgeChunkCount !== 'number' || !Number.isSafeInteger(value.knowledgeChunkCount) || value.knowledgeChunkCount < 0)) return undefined;
    if (value.canonicalExecutionId !== undefined && value.canonicalExecutionId !== value.envelopeId) return undefined;
    const rolePlan = value.rolePlan === undefined ? undefined : projectRolePlan(value.rolePlan);
    if (value.rolePlan !== undefined && !rolePlan) return undefined;

    const result: Record<string, unknown> = {};
    for (const key of receiptFields) {
        if (key !== 'rolePlan' && Object.prototype.hasOwnProperty.call(value, key) && value[key] !== undefined) result[key] = value[key];
    }
    if (rolePlan) result.rolePlan = rolePlan;
    return result as unknown as SavedReceiptProjection;
}

export async function hashExactOutput(output: string): Promise<string> {
    if (!globalThis.crypto?.subtle || typeof TextEncoder === 'undefined') throw new Error('WebCrypto SHA-256 unavailable');
    const digest = await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(output));
    return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
}

export async function createReceiptArchive(
    executionId: string, output: string, routeReceipt: GovernanceEvidenceReceipt,
): Promise<ExecutionReceiptArchive | undefined> {
    if (!executionId || typeof output !== 'string') return undefined;
    if (routeReceipt.htmlPilotEvidence) {
        if (routeReceipt.rolePlan !== undefined && !projectRolePlan(routeReceipt.rolePlan)) return undefined;
        const evidence = routeReceipt.htmlPilotEvidence;
        const outputSha256 = await hashExactOutput(output);
        if (routeReceipt.evidenceMode !== 'live' || routeReceipt.routeId !== '/api/execute'
            || routeReceipt.receiptIntegrity?.signatureStatus !== 'SIGNED'
            || evidence.receiptId !== routeReceipt.receiptId || evidence.outputSha256 !== outputSha256) return undefined;
        const encoded = JSON.stringify(routeReceipt);
        if (new TextEncoder().encode(encoded).byteLength > MAX_PILOT_RECEIPT_BYTES) return undefined;
        return { schemaVersion: PILOT_RECEIPT_ARCHIVE_VERSION, executionId, outputSha256,
            receipt: JSON.parse(encoded) as GovernanceEvidenceReceipt };
    }
    const receipt = projectReceipt(routeReceipt, false);
    if (!receipt) return undefined;
    return {
        schemaVersion: RECEIPT_ARCHIVE_VERSION,
        executionId,
        outputSha256: await hashExactOutput(output),
        receipt,
    };
}

export async function restoreReceiptArchive(
    archive: unknown, executionId: string, output: string,
    snapshot: ExecutionEvidenceSnapshot | undefined,
): Promise<GovernanceEvidenceReceipt | undefined> {
    if (!record(archive) || Object.keys(archive).some(key => !['schemaVersion', 'executionId', 'outputSha256', 'receipt'].includes(key))) return undefined;
    if (![RECEIPT_ARCHIVE_VERSION, PILOT_RECEIPT_ARCHIVE_VERSION].includes(archive.schemaVersion as typeof RECEIPT_ARCHIVE_VERSION)
        || archive.executionId !== executionId ||
        typeof archive.outputSha256 !== 'string' || !/^[a-f0-9]{64}$/.test(archive.outputSha256)) return undefined;
    const pilot = archive.schemaVersion === PILOT_RECEIPT_ARCHIVE_VERSION;
    const receipt = pilot ? archive.receipt as GovernanceEvidenceReceipt : projectReceipt(archive.receipt, true);
    if (pilot && record(archive.receipt) && archive.receipt.rolePlan !== undefined && !projectRolePlan(archive.receipt.rolePlan)) return undefined;
    if (pilot && (!record(archive.receipt) || !record(archive.receipt.htmlPilotEvidence)
        || !record(archive.receipt.receiptIntegrity)
        || archive.receipt.receiptIntegrity.signatureStatus !== 'SIGNED'
        || archive.receipt.htmlPilotEvidence.receiptId !== archive.receipt.receiptId
        || archive.receipt.htmlPilotEvidence.outputSha256 !== archive.outputSha256
        || new TextEncoder().encode(JSON.stringify(archive.receipt)).byteLength > MAX_PILOT_RECEIPT_BYTES)) return undefined;
    if (!receipt || !snapshot?.receiptId || snapshot.receiptId !== receipt.receiptId) return undefined;
    if (snapshot.provider !== receipt.provider || snapshot.model !== receipt.model) return undefined;
    try {
        if (await hashExactOutput(output) !== archive.outputSha256) return undefined;
    } catch {
        return undefined;
    }
    return receipt;
}
