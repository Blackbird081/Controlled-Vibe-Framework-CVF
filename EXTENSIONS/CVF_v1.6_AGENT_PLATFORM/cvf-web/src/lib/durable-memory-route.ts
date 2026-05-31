import { randomUUID } from 'node:crypto';
import {
    createFileBackedDurableMemoryStore,
    DURABLE_MEMORY_STORE_VERSION,
    type DurableMemoryReceipt,
    type DurableMemoryRecord,
} from '../../../../CVF_LEARNING_PLANE_FOUNDATION/src/durable-memory-store';
import type { RuntimeMemoryActorRole } from '../../../../CVF_LEARNING_PLANE_FOUNDATION/src/runtime-memory-hierarchy';

import type { ExecutionRequest } from '@/lib/ai';

export interface DurableMemoryRouteResult {
    requested: boolean;
    injected: boolean;
    receipt?: DurableMemoryReceipt;
    records: readonly DurableMemoryRecord[];
    promptBlock?: string;
}

const ROUTE_DURABLE_MEMORY_STORE_ENV = 'CVF_DURABLE_MEMORY_STORE_PATH';
const DEFAULT_WRITE_SUMMARY_LENGTH = 500;
const MAX_WRITE_SUMMARY_LENGTH = 1000;

function emptyReceipt(input: {
    reason: string;
    scope: string;
    tier?: 'skill' | 'long-term';
    decision?: 'allowed' | 'denied';
    operation?: 'read' | 'write';
}): DurableMemoryReceipt {
    return {
        contractVersion: DURABLE_MEMORY_STORE_VERSION,
        operation: input.operation ?? 'read',
        decision: input.decision ?? 'denied',
        reason: input.reason,
        tier: input.tier,
        scope: input.scope,
        memoryIds: [],
        excluded: [],
        durablePersistence: false,
        crossSession: false,
        summaryOnly: true,
        canReinject: false,
        rawMemoryReleased: false,
        receiptId: randomUUID(),
    };
}

function clampSummaryLength(value: number | undefined): number {
    if (!Number.isFinite(value)) return DEFAULT_WRITE_SUMMARY_LENGTH;
    return Math.max(1, Math.min(Math.floor(value as number), MAX_WRITE_SUMMARY_LENGTH));
}

function summarizeExecutionOutput(output: string, maxSummaryLength: number): string {
    const trimmed = output.trim().replace(/\s+/g, ' ');
    const summary = trimmed.slice(0, maxSummaryLength);
    return trimmed.length > maxSummaryLength
        ? `${summary} [truncated_summary_only]`
        : summary;
}

export function resolveDurableMemoryActorRole(role: string | null | undefined): RuntimeMemoryActorRole {
    const normalized = role?.trim().toUpperCase();
    if (
        normalized === 'OPERATOR' ||
        normalized === 'GOVERNOR' ||
        normalized === 'HUMAN' ||
        normalized === 'BUILDER' ||
        normalized === 'AI_AGENT' ||
        normalized === 'REVIEWER' ||
        normalized === 'SERVICE_AGENT' ||
        normalized === 'OBSERVER' ||
        normalized === 'ANALYST'
    ) {
        return normalized;
    }
    return 'unknown';
}

export function buildDurableMemorySystemPrompt(basePrompt: string, promptBlock: string): string {
    return [basePrompt.trimEnd(), '', '---', '', '## GOVERNED DURABLE MEMORY CONTEXT', '', promptBlock, '', '---', ''].join('\n');
}

export function evaluateDurableMemoryRoute(input: {
    request: Partial<ExecutionRequest>;
    actorId: string;
    actorRole: RuntimeMemoryActorRole;
    defaultQuery: string;
    storePath?: string;
}): DurableMemoryRouteResult {
    const durableRequest = input.request.durableMemory;
    if (!durableRequest?.enabled) {
        return { requested: false, injected: false, records: [] };
    }

    const tier = durableRequest.tier ?? 'skill';
    const scope = durableRequest.scope?.trim() || `user:${input.actorId}`;

    if (durableRequest.policy?.actorAuthorized !== true) {
        return {
            requested: true,
            injected: false,
            records: [],
            receipt: emptyReceipt({
                reason: 'durable_memory_policy_denied',
                scope,
                tier,
            }),
        };
    }

    const storePath = input.storePath ?? process.env[ROUTE_DURABLE_MEMORY_STORE_ENV];
    if (!storePath?.trim()) {
        return {
            requested: true,
            injected: false,
            records: [],
            receipt: emptyReceipt({
                reason: 'durable_memory_store_not_configured',
                scope,
                tier,
            }),
        };
    }

    const store = createFileBackedDurableMemoryStore(storePath);
    const read = store.read({
        tier,
        scope,
        actorId: input.actorId,
        actorRole: input.actorRole,
        actorAuthorized: true,
        query: durableRequest.query ?? input.defaultQuery,
        maxResults: Math.max(1, Math.min(durableRequest.maxResults ?? 3, 5)),
    });

    if (read.records.length === 0) {
        return {
            requested: true,
            injected: false,
            records: [],
            receipt: read.receipt,
        };
    }

    const promptBlock = [
        '[DURABLE_MEMORY_CONTEXT]',
        `scope: ${scope}`,
        `tier: ${tier}`,
        'mode: summary_only',
        'policy: context only; not approval authority; canReinject=false.',
        'approved_memory:',
        ...read.records.map((record) => `- ${record.id}: ${record.summary.trim()}`),
        '[/DURABLE_MEMORY_CONTEXT]',
    ].join('\n');

    return {
        requested: true,
        injected: true,
        records: read.records,
        receipt: read.receipt,
        promptBlock,
    };
}

export function evaluateDurableMemoryWrite(input: {
    request: Partial<ExecutionRequest>;
    actorId: string;
    actorRole: RuntimeMemoryActorRole;
    output: string;
    storePath?: string;
}): DurableMemoryReceipt | undefined {
    const writeRequest = input.request.durableMemoryWrite;
    if (!writeRequest?.enabled) return undefined;

    const tier = writeRequest.tier ?? 'skill';
    const scope = writeRequest.scope?.trim() || `user:${input.actorId}`;

    if (writeRequest.policy?.actorAuthorized !== true) {
        return emptyReceipt({
            reason: 'durable_memory_write_policy_denied',
            scope,
            tier,
            decision: 'denied',
            operation: 'write',
        });
    }

    const storePath = input.storePath ?? process.env[ROUTE_DURABLE_MEMORY_STORE_ENV];
    if (!storePath?.trim()) {
        return emptyReceipt({
            reason: 'durable_memory_write_store_not_configured',
            scope,
            tier,
            decision: 'denied',
            operation: 'write',
        });
    }

    const maxSummaryLength = clampSummaryLength(writeRequest.maxSummaryLength);
    const summary = summarizeExecutionOutput(input.output, maxSummaryLength);
    const store = createFileBackedDurableMemoryStore(storePath);
    const write = store.write({
        id: `s1-${randomUUID()}`,
        tier,
        scope,
        actorId: input.actorId,
        actorRole: input.actorRole,
        summary,
        lifecycleState: 'semantic',
        provenanceScore: 1,
        actorAuthorized: true,
        policyDecision: 'allow',
        sensitivity: 'internal',
    });

    return write.receipt;
}
