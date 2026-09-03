import { createHash } from 'node:crypto';

import {
    approvalRecordMatchesActor,
    computeApprovalRequestHash,
    type ApprovalActorBinding,
} from '@/app/api/approvals/approval-binding';
import type { ApprovalRequestRecord, ApprovalRequestSnapshot } from '@/app/api/approvals/store';

/** GC010-SCR-R2-T1A single-process, non-production safe-resume core.
 * No cross-process, provider, route, export, or durable-store claim. */

const SECRET_LIKE_KEY_PATTERN = /secret|token|password|passwd|key|credential|auth[-_]?header/i;

export class CanonicalizationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'CanonicalizationError';
    }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
    if (typeof value !== 'object' || value === null) {
        return false;
    }
    const proto = Object.getPrototypeOf(value);
    return proto === Object.prototype || proto === null;
}

function escapeJsonString(input: string): string {
    let index = 0;
    while (index < input.length) {
        const unit = input.charCodeAt(index);
        if (unit >= 0xd800 && unit <= 0xdbff) {
            const next = input.charCodeAt(index + 1);
            if (!(next >= 0xdc00 && next <= 0xdfff)) {
                throw new CanonicalizationError('lone high surrogate is not valid JCS input');
            }
            index += 1;
        } else if (unit >= 0xdc00 && unit <= 0xdfff) {
            throw new CanonicalizationError('lone low surrogate is not valid JCS input');
        }
        index += 1;
    }
    let out = '"';
    for (const ch of input) {
        const code = ch.codePointAt(0) ?? 0;
        switch (ch) {
            case '"':
                out += '\\"';
                break;
            case '\\':
                out += '\\\\';
                break;
            case '\b':
                out += '\\b';
                break;
            case '\f':
                out += '\\f';
                break;
            case '\n':
                out += '\\n';
                break;
            case '\r':
                out += '\\r';
                break;
            case '\t':
                out += '\\t';
                break;
            default:
                if (code < 0x20) {
                    out += `\\u${code.toString(16).padStart(4, '0')}`;
                } else {
                    out += ch;
                }
        }
    }
    return out + '"';
}

function serializeNumber(value: number, path: string): string {
    if (!Number.isFinite(value)) {
        throw new CanonicalizationError(`non-finite number at ${path}`);
    }
    if (Object.is(value, -0)) {
        return '0';
    }
    return String(value);
}

export function canonicalizeToJson(value: unknown): string {
    const seen = new Set<unknown>();

    function walk(input: unknown, path: string): string {
        if (input === null) {
            return 'null';
        }
        const t = typeof input;
        if (t === 'boolean') {
            return input ? 'true' : 'false';
        }
        if (t === 'number') {
            return serializeNumber(input as number, path);
        }
        if (t === 'string') {
            return escapeJsonString(input as string);
        }
        if (t === 'undefined') {
            throw new CanonicalizationError(`undefined is not canonicalizable at ${path}`);
        }
        if (t === 'bigint') {
            throw new CanonicalizationError(`bigint is not canonicalizable at ${path}`);
        }
        if (t === 'symbol') {
            throw new CanonicalizationError(`symbol is not canonicalizable at ${path}`);
        }
        if (t === 'function') {
            throw new CanonicalizationError(`function is not canonicalizable at ${path}`);
        }
        if (t === 'object') {
            if (seen.has(input)) {
                throw new CanonicalizationError(`cyclic reference detected at ${path}`);
            }
            if (Array.isArray(input)) {
                seen.add(input);
                for (const ownKey of Reflect.ownKeys(input)) {
                    if (ownKey === 'length') continue;
                    if (typeof ownKey !== 'string' || !/^(0|[1-9][0-9]*)$/.test(ownKey)) {
                        throw new CanonicalizationError(`array has unsupported own property at ${path}`);
                    }
                }
                let holeIndex = 0;
                while (holeIndex < input.length) {
                    if (!(holeIndex in input)) {
                        throw new CanonicalizationError(`sparse array hole at ${path}[${holeIndex}]`);
                    }
                    holeIndex += 1;
                }
                const items = input.map((item, i) => walk(item, `${path}[${i}]`));
                seen.delete(input);
                return `[${items.join(',')}]`;
            }
            if (input instanceof Date) {
                throw new CanonicalizationError(`Date instance is not canonicalizable at ${path}`);
            }
            if (!isPlainObject(input)) {
                throw new CanonicalizationError(`non-plain object prototype is not canonicalizable at ${path}`);
            }
            seen.add(input);
            if (Object.getOwnPropertySymbols(input).length > 0) {
                throw new CanonicalizationError(`symbol-keyed property is not canonicalizable at ${path}`);
            }
            for (const ownName of Object.getOwnPropertyNames(input)) {
                const descriptor = Object.getOwnPropertyDescriptor(input, ownName);
                if (!descriptor?.enumerable || !('value' in descriptor)) {
                    throw new CanonicalizationError(`non-enumerable or accessor property "${ownName}" is not canonicalizable at ${path}`);
                }
            }
            const keys = Object.keys(input).sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
            const parts: string[] = [];
            for (const key of keys) {
                const propValue = (input as Record<string, unknown>)[key];
                if (propValue === undefined) {
                    throw new CanonicalizationError(`undefined value for key "${key}" at ${path}`);
                }
                parts.push(`${escapeJsonString(key)}:${walk(propValue, `${path}.${key}`)}`);
            }
            seen.delete(input);
            return `{${parts.join(',')}}`;
        }
        throw new CanonicalizationError(`unsupported value type "${t}" at ${path}`);
    }

    return walk(value, '$');
}

function sha256Hex(input: string): string {
    return createHash('sha256').update(input, 'utf8').digest('hex').toLowerCase();
}

export function canonicalDigest(value: unknown): string {
    return sha256Hex(canonicalizeToJson(value));
}

export interface EnvironmentIdentity {
    nodeEnv: string;
    runtimeName: string;
    deploymentBoundary: 'single_process_non_production';
}

const ENVIRONMENT_IDENTITY_ALLOWED_KEYS = new Set<string>([
    'nodeEnv',
    'runtimeName',
    'deploymentBoundary',
]);

export function validateEnvironmentIdentity(input: unknown): EnvironmentIdentity {
    if (!isPlainObject(input)) {
        throw new CanonicalizationError('environment identity must be a plain object');
    }

    const keys = Object.keys(input);
    for (const key of keys) {
        if (!ENVIRONMENT_IDENTITY_ALLOWED_KEYS.has(key)) {
            throw new CanonicalizationError(`environment identity has unknown key "${key}"`);
        }
        if (SECRET_LIKE_KEY_PATTERN.test(key)) {
            throw new CanonicalizationError(`environment identity key "${key}" looks secret-like`);
        }
    }
    for (const required of ENVIRONMENT_IDENTITY_ALLOWED_KEYS) {
        if (!(required in input)) {
            throw new CanonicalizationError(`environment identity missing required key "${required}"`);
        }
    }

    const { nodeEnv, runtimeName, deploymentBoundary } = input as Record<string, unknown>;
    if (typeof nodeEnv !== 'string' || !nodeEnv.trim()) {
        throw new CanonicalizationError('environment identity "nodeEnv" must be a non-empty string');
    }
    if (typeof runtimeName !== 'string' || !runtimeName.trim()) {
        throw new CanonicalizationError('environment identity "runtimeName" must be a non-empty string');
    }
    if (deploymentBoundary !== 'single_process_non_production') {
        throw new CanonicalizationError('environment identity "deploymentBoundary" must be exactly "single_process_non_production"');
    }
    if (SECRET_LIKE_KEY_PATTERN.test(nodeEnv) || SECRET_LIKE_KEY_PATTERN.test(runtimeName)) {
        throw new CanonicalizationError('environment identity value looks secret-like');
    }

    return {
        nodeEnv: nodeEnv.trim(),
        runtimeName: runtimeName.trim(),
        deploymentBoundary: 'single_process_non_production',
    };
}

export type GuardPolicySnapshotSchemaVersion = 'cvf.guardPolicySnapshot.pendingExecution.v1';
export const GUARD_POLICY_SNAPSHOT_SCHEMA_VERSION: GuardPolicySnapshotSchemaVersion =
    'cvf.guardPolicySnapshot.pendingExecution.v1';

export interface GuardPolicySnapshotRow {
    guardId: string;
    guardVersion: string;
    configDigest: string;
}

export interface GuardPolicySnapshot {
    schemaVersion: GuardPolicySnapshotSchemaVersion;
    rows: GuardPolicySnapshotRow[];
    phase: string;
    riskLevel: string;
    role: string;
    channel: string;
    controlMode: string;
    policySnapshotId: string;
}

const LOWERCASE_HEX64_RE = /^[0-9a-f]{64}$/;

function assertNonEmptyNormalizedScalar(value: unknown, label: string): string {
    if (typeof value !== 'string') {
        throw new CanonicalizationError(`${label} must be a string`);
    }
    const normalized = value.trim();
    if (!normalized) {
        throw new CanonicalizationError(`${label} must be a non-empty string`);
    }
    if (normalized !== value) {
        throw new CanonicalizationError(`${label} must be pre-normalized (no leading/trailing whitespace)`);
    }
    return normalized;
}

export function validateGuardPolicySnapshot(input: unknown): GuardPolicySnapshot {
    if (!isPlainObject(input)) {
        throw new CanonicalizationError('guard policy snapshot must be a plain object');
    }
    const allowedKeys = new Set([
        'schemaVersion', 'rows', 'phase', 'riskLevel', 'role', 'channel',
        'controlMode', 'policySnapshotId',
    ]);
    for (const key of Object.keys(input)) {
        if (!allowedKeys.has(key)) {
            throw new CanonicalizationError(`guard policy snapshot has unknown key "${key}"`);
        }
    }
    const { schemaVersion, rows, phase, riskLevel, role, channel, controlMode, policySnapshotId } =
        input as Record<string, unknown>;

    if (schemaVersion !== GUARD_POLICY_SNAPSHOT_SCHEMA_VERSION) {
        throw new CanonicalizationError(`guard policy snapshot schemaVersion must be exactly "${GUARD_POLICY_SNAPSHOT_SCHEMA_VERSION}"`);
    }
    if (!Array.isArray(rows) || rows.length === 0) {
        throw new CanonicalizationError('guard policy snapshot "rows" must be a non-empty array');
    }

    const seenGuardIds = new Set<string>();
    const normalizedRows: GuardPolicySnapshotRow[] = rows.map((row, index) => {
        if (!isPlainObject(row)) {
            throw new CanonicalizationError(`guard policy snapshot row ${index} must be a plain object`);
        }
        const guardId = assertNonEmptyNormalizedScalar(row.guardId, `guard policy snapshot row ${index} "guardId"`);
        const guardVersion = assertNonEmptyNormalizedScalar(row.guardVersion, `guard policy snapshot row ${index} "guardVersion"`);
        const configDigestRaw = row.configDigest;
        if (typeof configDigestRaw !== 'string' || !LOWERCASE_HEX64_RE.test(configDigestRaw)) {
            throw new CanonicalizationError(`guard policy snapshot row ${index} "configDigest" must be a lowercase 64-hex string`);
        }
        if (seenGuardIds.has(guardId)) {
            throw new CanonicalizationError(`guard policy snapshot has duplicate guardId "${guardId}"`);
        }
        seenGuardIds.add(guardId);
        return { guardId, guardVersion, configDigest: configDigestRaw };
    });

    return {
        schemaVersion: GUARD_POLICY_SNAPSHOT_SCHEMA_VERSION,
        rows: normalizedRows,
        phase: assertNonEmptyNormalizedScalar(phase, 'guard policy snapshot "phase"'),
        riskLevel: assertNonEmptyNormalizedScalar(riskLevel, 'guard policy snapshot "riskLevel"'),
        role: assertNonEmptyNormalizedScalar(role, 'guard policy snapshot "role"'),
        channel: assertNonEmptyNormalizedScalar(channel, 'guard policy snapshot "channel"'),
        controlMode: assertNonEmptyNormalizedScalar(controlMode, 'guard policy snapshot "controlMode"'),
        policySnapshotId: assertNonEmptyNormalizedScalar(policySnapshotId, 'guard policy snapshot "policySnapshotId"'),
    };
}

export function computeGuardPolicyFingerprint(snapshot: GuardPolicySnapshot): string {
    return canonicalDigest(validateGuardPolicySnapshot(snapshot));
}

export type PendingAgentExecutionStatus =
    | 'CREATED'
    | 'CLAIMED'
    | 'EXECUTING'
    | 'SUCCEEDED'
    | 'FAILED'
    | 'DENIED'
    | 'UNKNOWN_TERMINAL'
    | 'EXPIRED'
    | 'STALE'
    | 'ABANDONED_BEFORE_START';

const TERMINAL_STATUSES: ReadonlySet<PendingAgentExecutionStatus> = new Set([
    'SUCCEEDED',
    'FAILED',
    'DENIED',
    'UNKNOWN_TERMINAL',
    'EXPIRED',
    'STALE',
    'ABANDONED_BEFORE_START',
]);

export interface NormalizedIntent {
    action: string;
    targetFiles?: string[];
    parameters?: Record<string, unknown>;
}

export interface ActorSessionRuntimeBinding {
    actor: ApprovalActorBinding;
    sessionId: string;
    cwd: string;
    fileScope?: string[];
}

export interface PendingAgentExecutionImmutablePayload {
    approvalId: string;
    approvalRequestHash: string;
    approvalRequestSnapshot: ApprovalRequestSnapshot;
    normalizedIntent: NormalizedIntent;
    binding: ActorSessionRuntimeBinding;
    originalGuardResult: unknown;
    environment: EnvironmentIdentity;
    policySnapshot: GuardPolicySnapshot;
}

export interface PendingAgentExecutionMutableState {
    status: PendingAgentExecutionStatus;
    recordVersion: number;
    claimId: string | null;
    claimedAt: string | null;
    claimedBy: ApprovalActorBinding | null;
    attemptIndex: number | null;
    requestId: string | null;
    terminalReason: string | null;
    terminalAt: string | null;
}

export interface PendingAgentExecutionRecord {
    pendingExecutionId: string;
    createdAt: string;
    payload: PendingAgentExecutionImmutablePayload;
    guardPolicyFingerprint: string;
    recordDigest: string;
    state: PendingAgentExecutionMutableState;
}

function buildDigestProjection(
    pendingExecutionId: string,
    createdAt: string,
    payload: PendingAgentExecutionImmutablePayload,
): Record<string, unknown> {
    return {
        pendingExecutionId,
        createdAt,
        approvalId: payload.approvalId,
        approvalRequestHash: payload.approvalRequestHash,
        approvalRequestSnapshot: payload.approvalRequestSnapshot,
        normalizedIntent: payload.normalizedIntent,
        binding: payload.binding,
        originalGuardResult: payload.originalGuardResult,
        environment: payload.environment,
        policySnapshot: payload.policySnapshot,
    };
}

export function computeRecordDigest(
    pendingExecutionId: string,
    createdAt: string,
    payload: PendingAgentExecutionImmutablePayload,
): string {
    return canonicalDigest(buildDigestProjection(pendingExecutionId, createdAt, payload));
}

function deepCloneCanonicalizable<T>(value: T): T {
    if (value === null || typeof value !== 'object') {
        return value;
    }
    if (Array.isArray(value)) {
        return value.map((item) => deepCloneCanonicalizable(item)) as unknown as T;
    }
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
        result[key] = deepCloneCanonicalizable(val);
    }
    return result as T;
}

function cloneRecord(record: PendingAgentExecutionRecord): PendingAgentExecutionRecord {
    return deepCloneCanonicalizable(record);
}

export type TerminalTransitionStatus = 'SUCCEEDED' | 'FAILED' | 'DENIED' | 'UNKNOWN_TERMINAL';

export interface ClaimTransition {
    kind: 'CLAIM';
    claimId: string;
    claimedAt: string;
    claimedBy: ApprovalActorBinding;
    requestId: string;
}
export interface BeginExecutingTransition {
    kind: 'BEGIN_EXECUTING';
    claimId: string;
    attemptIndex: number;
}
export interface TerminalTransition {
    kind: 'TERMINAL';
    claimId: string;
    attemptIndex: number;
    status: TerminalTransitionStatus;
    reason: string;
    terminalAt: string;
}
export interface ExpireTransition {
    kind: 'EXPIRE';
    reason: string;
    at: string;
}
export interface StaleTransition {
    kind: 'STALE';
    reason: string;
    at: string;
}
export interface AbandonBeforeStartTransition {
    kind: 'ABANDON_BEFORE_START';
    claimId: string;
    reason: string;
    at: string;
}
export type PendingAgentExecutionTransition =
    | ClaimTransition
    | BeginExecutingTransition
    | TerminalTransition
    | ExpireTransition
    | StaleTransition
    | AbandonBeforeStartTransition;

export interface CompareAndSwapResult {
    ok: boolean;
    reason: string;
    record: PendingAgentExecutionRecord | null;
}

export interface PendingAgentExecutionStore {
    create(
        pendingExecutionId: string,
        createdAt: string,
        payload: PendingAgentExecutionImmutablePayload,
    ): PendingAgentExecutionRecord;
    get(pendingExecutionId: string): PendingAgentExecutionRecord | null;
    compareAndSwap(
        pendingExecutionId: string,
        expectedVersion: number,
        expectedStatus: PendingAgentExecutionStatus,
        transition: PendingAgentExecutionTransition,
    ): CompareAndSwapResult;
}

const LEGAL_TRANSITION_FROM: Record<PendingAgentExecutionTransition['kind'], PendingAgentExecutionStatus[]> = {
    CLAIM: ['CREATED'],
    BEGIN_EXECUTING: ['CLAIMED'],
    TERMINAL: ['EXECUTING'],
    EXPIRE: ['CREATED'],
    STALE: ['CREATED', 'CLAIMED'],
    ABANDON_BEFORE_START: ['CLAIMED'],
};

function nextStatusFor(transition: PendingAgentExecutionTransition): PendingAgentExecutionStatus {
    switch (transition.kind) {
        case 'CLAIM':
            return 'CLAIMED';
        case 'BEGIN_EXECUTING':
            return 'EXECUTING';
        case 'TERMINAL':
            return transition.status;
        case 'EXPIRE':
            return 'EXPIRED';
        case 'STALE':
            return 'STALE';
        case 'ABANDON_BEFORE_START':
            return 'ABANDONED_BEFORE_START';
        default: {
            const exhaustive: never = transition;
            throw new CanonicalizationError(`unreachable transition kind: ${JSON.stringify(exhaustive)}`);
        }
    }
}

function applyTransition(
    record: PendingAgentExecutionRecord,
    transition: PendingAgentExecutionTransition,
): PendingAgentExecutionRecord {
    const nextStatus = nextStatusFor(transition);
    const nextState: PendingAgentExecutionMutableState = { ...record.state, status: nextStatus };
    nextState.recordVersion = record.state.recordVersion + 1;

    switch (transition.kind) {
        case 'CLAIM':
            nextState.claimId = transition.claimId;
            nextState.claimedAt = transition.claimedAt;
            nextState.claimedBy = transition.claimedBy;
            nextState.requestId = transition.requestId;
            break;
        case 'BEGIN_EXECUTING':
            nextState.attemptIndex = transition.attemptIndex;
            break;
        case 'TERMINAL':
            nextState.terminalReason = transition.reason;
            nextState.terminalAt = transition.terminalAt;
            break;
        case 'EXPIRE':
        case 'STALE':
        case 'ABANDON_BEFORE_START':
            nextState.terminalReason = transition.reason;
            nextState.terminalAt = transition.at;
            break;
        default: {
            const exhaustive: never = transition;
            throw new CanonicalizationError(`unreachable transition kind: ${JSON.stringify(exhaustive)}`);
        }
    }

    return { ...record, state: nextState };
}

function validateTransitionIdentity(
    record: PendingAgentExecutionRecord,
    transition: PendingAgentExecutionTransition,
): string | null {
    const claimIdBearing = transition.kind === 'BEGIN_EXECUTING' || transition.kind === 'TERMINAL' || transition.kind === 'ABANDON_BEFORE_START';
    if (claimIdBearing && record.state.claimId !== transition.claimId) {
        return 'CLAIM_ID_MISMATCH';
    }
    if (transition.kind === 'TERMINAL' && record.state.attemptIndex !== transition.attemptIndex) {
        return 'ATTEMPT_INDEX_MISMATCH';
    }
    return null;
}

/** T1C shared pure transition owner: version/status/terminal/legal-from/
 * identity checks plus application, given an already-looked-up record.
 * NOT_FOUND is store-specific. No I/O; persist the result only when ok. */
export function applyPendingAgentExecutionTransition(
    record: PendingAgentExecutionRecord,
    expectedVersion: number,
    expectedStatus: PendingAgentExecutionStatus,
    transition: PendingAgentExecutionTransition,
): CompareAndSwapResult {
    if (record.state.recordVersion !== expectedVersion) {
        return { ok: false, reason: 'VERSION_MISMATCH', record: cloneRecord(record) };
    }
    if (record.state.status !== expectedStatus) {
        return { ok: false, reason: 'STATUS_MISMATCH', record: cloneRecord(record) };
    }
    if (TERMINAL_STATUSES.has(record.state.status)) {
        return { ok: false, reason: 'TERMINAL_STATE_IMMUTABLE', record: cloneRecord(record) };
    }
    const legalFrom = LEGAL_TRANSITION_FROM[transition.kind];
    if (!legalFrom.includes(record.state.status)) {
        return { ok: false, reason: 'ILLEGAL_TRANSITION', record: cloneRecord(record) };
    }
    const identityIssue = validateTransitionIdentity(record, transition);
    if (identityIssue) {
        return { ok: false, reason: identityIssue, record: cloneRecord(record) };
    }

    const updated = applyTransition(record, transition);
    return { ok: true, reason: 'OK', record: cloneRecord(updated) };
}

export class InMemoryPendingAgentExecutionStore implements PendingAgentExecutionStore {
    public readonly deploymentBoundary = 'single_process_non_production' as const;

    private readonly records = new Map<string, PendingAgentExecutionRecord>();

    create(
        pendingExecutionId: string,
        createdAt: string,
        payload: PendingAgentExecutionImmutablePayload,
    ): PendingAgentExecutionRecord {
        if (this.records.has(pendingExecutionId)) {
            throw new CanonicalizationError(`pendingExecutionId "${pendingExecutionId}" already exists`);
        }

        assertNonEmptyNormalizedScalar(pendingExecutionId, 'pendingExecutionId');
        const createdAtMillis = Date.parse(createdAt);
        if (!Number.isFinite(createdAtMillis) || new Date(createdAtMillis).toISOString() !== createdAt) {
            throw new CanonicalizationError('createdAt must be a canonical ISO timestamp');
        }
        if (!isPlainObject(payload)) {
            throw new CanonicalizationError('pending execution payload must be a plain object');
        }
        const expectedPayloadKeys = new Set([
            'approvalId', 'approvalRequestHash', 'approvalRequestSnapshot',
            'normalizedIntent', 'binding', 'originalGuardResult', 'environment', 'policySnapshot',
        ]);
        for (const key of Object.keys(payload)) {
            if (!expectedPayloadKeys.has(key)) {
                throw new CanonicalizationError(`pending execution payload has unknown key "${key}"`);
            }
        }
        for (const key of expectedPayloadKeys) {
            if (!(key in payload)) {
                throw new CanonicalizationError(`pending execution payload missing required key "${key}"`);
            }
        }

        canonicalizeToJson(payload);
        canonicalizeToJson(buildDigestProjection(pendingExecutionId, createdAt, payload));
        const clonedPayload = deepCloneCanonicalizable(payload);
        clonedPayload.environment = validateEnvironmentIdentity(clonedPayload.environment);
        clonedPayload.policySnapshot = validateGuardPolicySnapshot(clonedPayload.policySnapshot);
        assertNonEmptyNormalizedScalar(clonedPayload.approvalId, 'approvalId');
        if (!LOWERCASE_HEX64_RE.test(clonedPayload.approvalRequestHash)) {
            throw new CanonicalizationError('approvalRequestHash must be a lowercase 64-hex string');
        }
        if (computeApprovalRequestHash(clonedPayload.approvalRequestSnapshot) !== clonedPayload.approvalRequestHash) {
            throw new CanonicalizationError('approvalRequestHash does not match approvalRequestSnapshot');
        }

        const guardPolicyFingerprint = computeGuardPolicyFingerprint(clonedPayload.policySnapshot);
        const recordDigest = computeRecordDigest(pendingExecutionId, createdAt, clonedPayload);

        const record: PendingAgentExecutionRecord = {
            pendingExecutionId,
            createdAt,
            payload: clonedPayload,
            guardPolicyFingerprint,
            recordDigest,
            state: {
                status: 'CREATED',
                recordVersion: 0,
                claimId: null,
                claimedAt: null,
                claimedBy: null,
                attemptIndex: null,
                requestId: null,
                terminalReason: null,
                terminalAt: null,
            },
        };

        const storedClone = cloneRecord(record);
        this.records.set(pendingExecutionId, storedClone);

        const readBack = this.records.get(pendingExecutionId);
        if (!readBack || readBack.recordDigest !== recordDigest) {
            this.records.delete(pendingExecutionId);
            throw new CanonicalizationError('create read-back digest verification failed');
        }

        return cloneRecord(readBack);
    }

    get(pendingExecutionId: string): PendingAgentExecutionRecord | null {
        const record = this.records.get(pendingExecutionId);
        return record ? cloneRecord(record) : null;
    }

    compareAndSwap(
        pendingExecutionId: string,
        expectedVersion: number,
        expectedStatus: PendingAgentExecutionStatus,
        transition: PendingAgentExecutionTransition,
    ): CompareAndSwapResult {
        const current = this.records.get(pendingExecutionId);
        if (!current) {
            return { ok: false, reason: 'NOT_FOUND', record: null };
        }

        const result = applyPendingAgentExecutionTransition(current, expectedVersion, expectedStatus, transition);
        if (!result.ok) {
            return result;
        }

        // The helper already clones on success, so storing it directly here
        // preserves the original clone-on-write-then-clone-on-return isolation.
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const storedClone = result.record!;
        this.records.set(pendingExecutionId, storedClone);
        return { ok: true, reason: 'OK', record: cloneRecord(storedClone) };
    }
}

export type ApprovalRecordLookup = (approvalId: string) => ApprovalRequestRecord | null;

export interface ClaimPendingExecutionInput {
    pendingExecutionId: string;
    actor: ApprovalActorBinding;
    requestId: string;
    now: string;
    lookupApproval: ApprovalRecordLookup;
    currentPolicySnapshot: GuardPolicySnapshot;
    generateClaimId: () => string;
}

export type ClaimDenialReason =
    | 'NOT_FOUND'
    | 'ALREADY_CLAIMED_OR_TERMINAL'
    | 'APPROVAL_NOT_FOUND'
    | 'APPROVAL_ID_MISMATCH'
    | 'APPROVAL_NOT_APPROVED'
    | 'APPROVAL_EXPIRED'
    | 'APPROVAL_ACTOR_MISMATCH'
    | 'STORED_ACTOR_BINDING_MISMATCH'
    | 'APPROVAL_REQUEST_HASH_MISMATCH'
    | 'APPROVAL_SNAPSHOT_HASH_MISMATCH'
    | 'APPROVAL_CURRENT_SNAPSHOT_MISMATCH'
    | 'APPROVAL_TIME_INVALID'
    | 'RECORD_DIGEST_MISMATCH'
    | 'POLICY_FINGERPRINT_DRIFT'
    | 'CAS_CONFLICT';

export interface ClaimPendingExecutionResult {
    ok: boolean;
    reason: ClaimDenialReason | 'OK';
    grant: ResumeAuthorityGrant | null;
    record: PendingAgentExecutionRecord | null;
}

const GRANT_CONSTRUCTOR_TOKEN = Symbol('pending-agent-execution-grant-constructor');

export class ResumeAuthorityGrant {
    constructor(token: typeof GRANT_CONSTRUCTOR_TOKEN) {
        if (token !== GRANT_CONSTRUCTOR_TOKEN) {
            throw new CanonicalizationError('ResumeAuthorityGrant cannot be caller-constructed');
        }
    }

    get pendingExecutionId(): string {
        const metadata = GRANT_IDENTIFIERS.get(this);
        if (!metadata) throw new CanonicalizationError('invalid ResumeAuthorityGrant');
        return metadata.pendingExecutionId;
    }

    get claimId(): string {
        const metadata = GRANT_IDENTIFIERS.get(this);
        if (!metadata) throw new CanonicalizationError('invalid ResumeAuthorityGrant');
        return metadata.claimId;
    }

    toJSON(): never {
        throw new CanonicalizationError('ResumeAuthorityGrant is not serializable');
    }
}

interface GrantIdentity {
    pendingExecutionId: string;
    claimId: string;
}

const VALID_GRANTS = new WeakSet<ResumeAuthorityGrant>();
const GRANT_METADATA = new WeakMap<ResumeAuthorityGrant, GrantIdentity>();
const GRANT_IDENTIFIERS = new WeakMap<ResumeAuthorityGrant, GrantIdentity>();

function createResumeAuthorityGrant(pendingExecutionId: string, claimId: string): ResumeAuthorityGrant {
    const grant = new ResumeAuthorityGrant(GRANT_CONSTRUCTOR_TOKEN);
    VALID_GRANTS.add(grant);
    GRANT_METADATA.set(grant, { pendingExecutionId, claimId });
    GRANT_IDENTIFIERS.set(grant, { pendingExecutionId, claimId });
    return grant;
}

export function isAuthenticUnconsumedGrant(candidate: unknown): candidate is ResumeAuthorityGrant {
    return candidate instanceof ResumeAuthorityGrant && VALID_GRANTS.has(candidate);
}

function denyWithStale(
    store: PendingAgentExecutionStore,
    record: PendingAgentExecutionRecord,
    reason: string,
    now: string,
): PendingAgentExecutionRecord | null {
    store.compareAndSwap(record.pendingExecutionId, record.state.recordVersion, record.state.status, {
        kind: 'STALE',
        reason,
        at: now,
    });
    return store.get(record.pendingExecutionId);
}

type DriftCheckRow = [driftDetected: boolean, staleReason: string, claimDenialReason: ClaimDenialReason];

function safeApprovalRequestHash(snapshot: ApprovalRequestSnapshot | null | undefined): string | null {
    if (!snapshot) return null;
    try {
        canonicalizeToJson(snapshot);
        return computeApprovalRequestHash(snapshot);
    } catch {
        return null;
    }
}

function evaluateDriftChecks(
    record: PendingAgentExecutionRecord,
    approvalRecord: ApprovalRequestRecord,
    input: ClaimPendingExecutionInput,
): DriftCheckRow | null {
    const recomputedSnapshotHash = safeApprovalRequestHash(record.payload.approvalRequestSnapshot);
    const currentSnapshotHash = safeApprovalRequestHash(approvalRecord.requestSnapshot);
    const recomputedRecordDigest = computeRecordDigest(record.pendingExecutionId, record.createdAt, record.payload);
    let currentFingerprint: string | null = null;
    try {
        currentFingerprint = computeGuardPolicyFingerprint(input.currentPolicySnapshot);
    } catch {
        currentFingerprint = null;
    }
    const expiryMillis = Date.parse(approvalRecord.expiresAt);
    const nowMillis = Date.parse(input.now);
    const invalidTime = !Number.isFinite(expiryMillis) || !Number.isFinite(nowMillis)
        || new Date(expiryMillis).toISOString() !== approvalRecord.expiresAt
        || new Date(nowMillis).toISOString() !== input.now;
    const approvalExpired = !invalidTime && expiryMillis <= nowMillis;
    const actorMismatch = !approvalRecordMatchesActor(approvalRecord, input.actor);
    const storedActor = record.payload.binding.actor;
    const storedActorMismatch = storedActor.actorId !== input.actor.actorId
        || storedActor.actorAuthMode !== input.actor.actorAuthMode
        || storedActor.actorOrgId !== input.actor.actorOrgId
        || storedActor.actorTeamId !== input.actor.actorTeamId;
    const rows: DriftCheckRow[] = [
        [approvalRecord.id !== record.payload.approvalId, 'STALE_APPROVAL_ID_MISMATCH', 'APPROVAL_ID_MISMATCH'],
        [approvalRecord.status !== 'approved', 'STALE_APPROVAL_NOT_APPROVED', 'APPROVAL_NOT_APPROVED'],
        [invalidTime, 'STALE_APPROVAL_TIME_INVALID', 'APPROVAL_TIME_INVALID'],
        [approvalExpired, 'STALE_APPROVAL_EXPIRED', 'APPROVAL_EXPIRED'],
        [storedActorMismatch, 'STALE_STORED_ACTOR_BINDING_MISMATCH', 'STORED_ACTOR_BINDING_MISMATCH'],
        [actorMismatch, 'STALE_APPROVAL_ACTOR_MISMATCH', 'APPROVAL_ACTOR_MISMATCH'],
        [approvalRecord.requestHash !== record.payload.approvalRequestHash, 'STALE_APPROVAL_REQUEST_HASH_MISMATCH', 'APPROVAL_REQUEST_HASH_MISMATCH'],
        [recomputedSnapshotHash !== record.payload.approvalRequestHash, 'STALE_APPROVAL_SNAPSHOT_HASH_MISMATCH', 'APPROVAL_SNAPSHOT_HASH_MISMATCH'],
        [currentSnapshotHash !== record.payload.approvalRequestHash, 'STALE_APPROVAL_CURRENT_SNAPSHOT_MISMATCH', 'APPROVAL_CURRENT_SNAPSHOT_MISMATCH'],
        [recomputedRecordDigest !== record.recordDigest, 'STALE_RECORD_DIGEST_MISMATCH', 'RECORD_DIGEST_MISMATCH'],
        [currentFingerprint !== record.guardPolicyFingerprint, 'STALE_POLICY_FINGERPRINT_CHANGED', 'POLICY_FINGERPRINT_DRIFT'],
    ];
    return rows.find((row) => row[0]) ?? null;
}

export function claimPendingExecution(store: PendingAgentExecutionStore, input: ClaimPendingExecutionInput): ClaimPendingExecutionResult {
    const record = store.get(input.pendingExecutionId);
    if (!record) {
        return { ok: false, reason: 'NOT_FOUND', grant: null, record: null };
    }
    if (record.state.status !== 'CREATED') {
        return { ok: false, reason: 'ALREADY_CLAIMED_OR_TERMINAL', grant: null, record };
    }

    const approvalRecord = input.lookupApproval(record.payload.approvalId);
    if (!approvalRecord) {
        const staleRecord = denyWithStale(store, record, 'STALE_APPROVAL_NOT_FOUND', input.now);
        return { ok: false, reason: 'APPROVAL_NOT_FOUND', grant: null, record: staleRecord };
    }

    const drift = evaluateDriftChecks(record, approvalRecord, input);
    if (drift) {
        const staleRecord = denyWithStale(store, record, drift[1], input.now);
        return { ok: false, reason: drift[2], grant: null, record: staleRecord };
    }

    const claimId = assertNonEmptyNormalizedScalar(input.generateClaimId(), 'claimId');
    assertNonEmptyNormalizedScalar(input.requestId, 'requestId');
    const casResult = store.compareAndSwap(record.pendingExecutionId, record.state.recordVersion, 'CREATED', {
        kind: 'CLAIM',
        claimId,
        claimedAt: input.now,
        claimedBy: input.actor,
        requestId: input.requestId,
    });

    if (!casResult.ok) {
        return { ok: false, reason: 'CAS_CONFLICT', grant: null, record: casResult.record };
    }

    const grant = createResumeAuthorityGrant(record.pendingExecutionId, claimId);
    return { ok: true, reason: 'OK', grant, record: casResult.record };
}

export type BeginPendingExecutionFailureReason = 'FORGED_OR_CONSUMED_GRANT' | 'CAS_FAILED';
export interface BeginPendingExecutionSuccess {
    ok: true;
    record: PendingAgentExecutionRecord;
}
export interface BeginPendingExecutionFailure {
    ok: false;
    reason: BeginPendingExecutionFailureReason;
    record: PendingAgentExecutionRecord | null;
}
export type BeginPendingExecutionResult = BeginPendingExecutionSuccess | BeginPendingExecutionFailure;

export function beginPendingExecution(store: PendingAgentExecutionStore, grant: ResumeAuthorityGrant, attemptIndex: number): BeginPendingExecutionResult {
    if (!Number.isInteger(attemptIndex) || attemptIndex < 0) {
        throw new CanonicalizationError('attemptIndex must be a non-negative integer');
    }

    const authentic = isAuthenticUnconsumedGrant(grant);
    if (grant instanceof ResumeAuthorityGrant) {
        VALID_GRANTS.delete(grant);
    }
    if (!authentic) {
        return { ok: false, reason: 'FORGED_OR_CONSUMED_GRANT', record: null };
    }

    const metadata = GRANT_METADATA.get(grant);
    GRANT_METADATA.delete(grant);
    if (!metadata) {
        return { ok: false, reason: 'FORGED_OR_CONSUMED_GRANT', record: null };
    }
    const current = store.get(metadata.pendingExecutionId);
    if (!current) {
        return { ok: false, reason: 'CAS_FAILED', record: null };
    }
    const casResult = store.compareAndSwap(metadata.pendingExecutionId, current.state.recordVersion, 'CLAIMED', {
        kind: 'BEGIN_EXECUTING',
        claimId: metadata.claimId,
        attemptIndex,
    });
    if (!casResult.ok) {
        return { ok: false, reason: 'CAS_FAILED', record: casResult.record };
    }
    return { ok: true, record: casResult.record as PendingAgentExecutionRecord };
}

export interface TerminalTransitionInput {
    pendingExecutionId: string;
    expectedVersion: number;
    claimId: string;
    attemptIndex: number;
    status: 'SUCCEEDED' | 'FAILED' | 'DENIED' | 'UNKNOWN_TERMINAL';
    reason: string;
    at: string;
}

export function applyTerminalTransition(store: PendingAgentExecutionStore, input: TerminalTransitionInput): CompareAndSwapResult {
    const transition: TerminalTransition = { kind: 'TERMINAL', claimId: input.claimId, attemptIndex: input.attemptIndex, status: input.status, reason: input.reason, terminalAt: input.at };
    return store.compareAndSwap(input.pendingExecutionId, input.expectedVersion, 'EXECUTING', transition);
}

export function abandonBeforeStart(store: PendingAgentExecutionStore, pendingExecutionId: string, expectedVersion: number, claimId: string, reason: string, at: string): CompareAndSwapResult {
    const transition: AbandonBeforeStartTransition = { kind: 'ABANDON_BEFORE_START', claimId, reason, at };
    return store.compareAndSwap(pendingExecutionId, expectedVersion, 'CLAIMED', transition);
}

export function resolveAmbiguousExecutingCrash(store: PendingAgentExecutionStore, input: Omit<TerminalTransitionInput, 'status'>): CompareAndSwapResult {
    return applyTerminalTransition(store, { ...input, status: 'UNKNOWN_TERMINAL' });
}

export function expirePendingExecution(store: PendingAgentExecutionStore, pendingExecutionId: string, expectedVersion: number, reason: string, at: string): CompareAndSwapResult {
    const transition: ExpireTransition = { kind: 'EXPIRE', reason, at };
    return store.compareAndSwap(pendingExecutionId, expectedVersion, 'CREATED', transition);
}
