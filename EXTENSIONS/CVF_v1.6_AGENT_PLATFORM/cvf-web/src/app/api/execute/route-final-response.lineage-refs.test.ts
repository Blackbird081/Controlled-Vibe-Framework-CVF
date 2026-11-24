import { afterEach, describe, expect, it } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { NextResponse } from 'next/server';
import { SQLiteKeyedAtomicRecordStore } from '../../../../../../CVF_EXECUTION_PLANE_FOUNDATION/src/mao/atomic.sqlite.record.store';
import {
    _testOnlySetStoreHooks, parseLineageConfig, provisionTenantMetadata, readLineage,
    type LineageConfig, type LineageIdentity, type SafeLineageView,
} from '@/lib/server/canonical-web-lineage';
import type { GuardPipelineResult } from '@/lib/guard-runtime-adapter';
import type { KnowledgeQueryResult } from '@/lib/knowledge-retrieval';
import type { Sot3KnowledgeActivationResult } from '@/lib/sot3-knowledge-adapter';
import {
    RouteLineageTracker, buildGovernanceLineageRefs, buildGuardLineageRef, buildSot3LineageRef, type SotKnowledgeForLineage,
} from './route-final-response';

const REF_RE = /^[a-zA-Z0-9._:/-]{1,120}$/;
const SECRET_PROMPT = 'SECRET-PROMPT-TEXT-do-not-leak';
const SECRET_CHUNK = 'SECRET-CHUNK-TEXT-do-not-leak';
const RECORD_ID = 'SOT3EV-0123456789abcdef0123456789abcdef';
const directories: string[] = [];
afterEach(() => { _testOnlySetStoreHooks(undefined); while (directories.length) rmSync(directories.pop()!, { recursive: true, force: true }); });

function journal(canonicalId: string): { config: LineageConfig; identity: LineageIdentity; tracker: RouteLineageTracker } {
    const dir = mkdtempSync(path.join(tmpdir(), 'web-lineage-refs-')); directories.push(dir);
    SQLiteKeyedAtomicRecordStore.initialize(dir);
    const parsed = parseLineageConfig(JSON.stringify({ schema: 'cvf.webLineageConfig.v1', revision: 1, directory: dir, namespace: 'cvf-web-lineage-refs', tenants: [{ tenantId: 'org' }] }));
    if (!parsed.ok) throw Error('fixture-config');
    expect(provisionTenantMetadata(parsed.config).ok).toBe(true);
    const identity: LineageIdentity = { tenantId: 'org', owner: { kind: 'session', orgId: 'org', teamId: 'team', userId: 'user' } };
    const tracker = new RouteLineageTracker(parsed.config, identity, { canonicalId, contractRevision: 'fixture-c1', sourceRevision: 'fixture-s1' });
    return { config: parsed.config, identity, tracker };
}

const guardResult = (over: Partial<GuardPipelineResult> = {}): GuardPipelineResult => ({
    requestId: 'req-1', finalDecision: 'ALLOW', executedAt: '2026-11-14T00:00:00.000Z', durationMs: 3,
    results: [
        { guardId: 'phase_gate', decision: 'ALLOW', severity: 'INFO', reason: SECRET_PROMPT, timestamp: '2026-11-14T00:00:00.000Z' },
        { guardId: 'risk_gate', decision: 'ALLOW', severity: 'INFO', reason: 'ok', timestamp: '2026-11-14T00:00:00.001Z' },
    ],
    ...over,
});

const retrieval = (chunkCount: number): KnowledgeQueryResult => ({
    chunks: Array.from({ length: chunkCount }, (_, i) => ({
        id: `chunk-${i}`, content: SECRET_CHUNK, keywords: ['k'], collectionId: 'col-1', collectionName: 'Col', score: 0.5 + i / 10,
    })),
    matchedChunkCount: chunkCount, allowedChunkCount: chunkCount, droppedChunkCount: 0,
    allowedCollectionIds: chunkCount ? ['col-1'] : [], droppedCollectionIds: [],
});
const sot3Result = (over: Partial<Sot3KnowledgeActivationResult> = {}): Sot3KnowledgeActivationResult => ({
    mode: 'ENFORCE', terminalOutcome: 'APPROVED', injectionPermitted: true, approvedContext: SECRET_CHUNK, failureStage: null,
    refineryPacketId: 'pkt-1', refineryPacketIds: ['pkt-1'], refineryStatus: 'ACCEPTED', kernelDecisionId: 'kd-1', kernelDecisionIds: ['kd-1'],
    kernelDecision: 'ALLOW', kernelEvidenceCount: 1, truthReferenceId: 'tr-1', truthReferenceIds: ['tr-1'], flowPackageId: 'fp-1',
    flowPackageIds: ['fp-1'], flowAcknowledgementState: 'ACKNOWLEDGED', traces: [], ...over,
});
const persisted = (recordId = RECORD_ID): SotKnowledgeForLineage['sot3Evidence'] => ({ diagnosticClass: 'PERSISTED', recordId });
const injectedKnowledge = (over: Partial<SotKnowledgeForLineage> = {}): SotKnowledgeForLineage => ({
    retrievalResult: retrieval(2), knowledgeInjected: true, knowledgeSource: 'retrieval', requestedKnowledgeCollectionId: 'col-1',
    sot3: sot3Result(), sot3Evidence: persisted(), ...over,
});
const noKnowledge = (): SotKnowledgeForLineage => ({
    retrievalResult: retrieval(0), knowledgeInjected: false, knowledgeSource: 'none', requestedKnowledgeCollectionId: null, sot3: null, sot3Evidence: null,
});
const refsFor = (canonicalId: string, input: { guardResult?: unknown; knowledge?: SotKnowledgeForLineage | null; memoryContextInjected?: boolean }) =>
    buildGovernanceLineageRefs({ canonicalId, ...input });

async function finalizeRun(canonicalId: string, setup: ((t: RouteLineageTracker) => void) | undefined, body: Record<string, unknown> = {}, disposition?: 'COMPLETED' | 'DENIED' | 'VALIDATION_FAILED') {
    const j = journal(canonicalId);
    setup?.(j.tracker);
    const reserved = await j.tracker.reserveNext();
    if (!('ordinal' in reserved)) throw Error('reserve failed');
    const response = NextResponse.json({ success: true, governanceEvidenceReceipt: { receiptId: 'receipt-1' }, ...body });
    const concluded = await j.tracker.conclude(response, disposition);
    expect(concluded.status).toBe(200);
    const read = readLineage(j.config, j.identity, canonicalId);
    if (!read.ok) throw Error(`readback ${read.code}`);
    return { view: read.value as SafeLineageView, serialized: JSON.stringify(read.value) };
}

describe('lineage governance references (guard and SOT3)', () => {
    it('preserves governance receipt references for native validation failure without claiming completion', async () => {
        const id = 'canonical-word-cap';
        const { view } = await finalizeRun(id, t => t.recordGovernanceRefs(refsFor(id, { guardResult: guardResult(), knowledge: noKnowledge() })),
            { success: false, outputValidation: { issues: ['WORD_LIMIT_EXCEEDED'], wordLimit: { observed: 114, limit: 99 } } }, 'VALIDATION_FAILED');
        expect(view.state).toBe('FINALIZED');
        expect(view.terminal!.disposition).toBe('VALIDATION_FAILED');
        expect(view.terminal!.refs.audit).toBe('receipt-1');
        expect(view.terminal!.refs.guard).toMatch(/^guard:allow:/);
    });
    it('records non-null guard and sot3 refs for a completed run with guard and durable SOT3 evidence, without prompt or chunk text', async () => {
        const id = 'canonical-completed';
        const { view, serialized } = await finalizeRun(id, t => t.recordGovernanceRefs(refsFor(id, { guardResult: guardResult(), knowledge: injectedKnowledge() })), { guardResult: guardResult() });
        expect(view.terminal?.disposition).toBe('COMPLETED');
        const { refs, gaps } = view.terminal!;
        expect(refs.guard).toMatch(/^guard:allow:[0-9a-f]{24}$/);
        expect(refs.sot3).toBe(`sot3:enforce-approved:${RECORD_ID}`);
        expect(refs.audit).toBe('receipt-1');
        for (const ref of [refs.guard, refs.sot3]) expect(ref).toMatch(REF_RE);
        expect(gaps).not.toContain('GUARD_NOT_RECORDED');
        expect(gaps).not.toContain('SOT3_NOT_RECORDED');
        expect(serialized).not.toContain(SECRET_PROMPT);
        expect(serialized).not.toContain(SECRET_CHUNK);
    });

    it('declares SOT3 non-applicability as retrieval-only when no knowledge was requested, retrieved or injected', async () => {
        const id = 'canonical-no-knowledge';
        const refs = refsFor(id, { guardResult: guardResult(), knowledge: noKnowledge() });
        expect(refs).toMatchObject({ sot3Ref: 'sot3:none:no_knowledge_retrieval', namedGaps: [] });
        const { view } = await finalizeRun(id, t => t.recordGovernanceRefs(refs));
        expect(view.terminal!.refs.sot3).toBe('sot3:none:no_knowledge_retrieval');
        expect(view.terminal!.gaps.filter(gap => gap.startsWith('SOT3_'))).toEqual([]);
    });

    it('names MEMORY_CONTEXT_INJECTED when durable or AIF memory was injected, within the four named gap cap', async () => {
        const id = 'canonical-memory';
        const refs = refsFor(id, { guardResult: guardResult(), knowledge: noKnowledge(), memoryContextInjected: true });
        expect(refs.sot3Ref).toBe('sot3:none:no_knowledge_retrieval');
        expect(refs.namedGaps).toEqual(['MEMORY_CONTEXT_INJECTED']);
        const both = refsFor(id, { guardResult: guardResult(), knowledge: injectedKnowledge({ sot3: null, sot3Evidence: null }), memoryContextInjected: true });
        expect(both.namedGaps).toEqual(['SOT3_ACTIVATION_OFF', 'MEMORY_CONTEXT_INJECTED']);
        const { view } = await finalizeRun(id, t => t.recordGovernanceRefs(refs));
        expect(view.terminal!.gaps).toContain('MEMORY_CONTEXT_INJECTED');
    });

    it('keeps SOT3_NOT_RECORDED plus SOT3_ACTIVATION_OFF when knowledge was injected but SOT3 activation was off', async () => {
        const id = 'canonical-sot3-off';
        const refs = refsFor(id, { guardResult: guardResult(), knowledge: injectedKnowledge({ sot3: null, sot3Evidence: null }) });
        expect(refs.sot3Ref).toBeNull();
        expect(refs.namedGaps).toEqual(['SOT3_ACTIVATION_OFF']);
        const { view } = await finalizeRun(id, t => t.recordGovernanceRefs(refs));
        expect(view.terminal!.refs.sot3).toBeNull();
        expect(view.terminal!.gaps).toEqual(expect.arrayContaining(['SOT3_NOT_RECORDED', 'SOT3_ACTIVATION_OFF']));
        expect(view.terminal!.gaps.filter(gap => gap === 'SOT3_NOT_RECORDED')).toHaveLength(1);
    });

    it.each([
        ['ENFORCE persistence failed', { diagnosticClass: 'SOT3_EVIDENCE_PERSISTENCE_FAILED', recordId: RECORD_ID } as const, 'ENFORCE' as const],
        ['SHADOW corrupt store', { diagnosticClass: 'SOT3_EVIDENCE_CORRUPT_STORE', recordId: RECORD_ID } as const, 'SHADOW' as const],
        ['duplicate conflict', { diagnosticClass: 'SOT3_EVIDENCE_DUPLICATE_CONFLICT', recordId: RECORD_ID } as const, 'ENFORCE' as const],
        ['evidence status unknown', undefined, 'SHADOW' as const],
    ])('emits no sot3 ref and names SOT3_EVIDENCE_NOT_PERSISTED when SOT3 evidence is not durable (%s)', async (_label, evidence, mode) => {
        const id = 'canonical-not-persisted';
        const refs = refsFor(id, { guardResult: guardResult(), knowledge: injectedKnowledge({ sot3: sot3Result({ mode }), sot3Evidence: evidence }) });
        expect(refs.sot3Ref).toBeNull();
        expect(refs.namedGaps).toEqual(['SOT3_EVIDENCE_NOT_PERSISTED']);
        const { view } = await finalizeRun(id, t => t.recordGovernanceRefs(refs));
        expect(view.terminal!.gaps).toEqual(expect.arrayContaining(['SOT3_NOT_RECORDED', 'SOT3_EVIDENCE_NOT_PERSISTED']));
    });

    it('treats DUPLICATE_NOOP as durable and makes SHADOW visibly different from ENFORCE', () => {
        const shadow = buildSot3LineageRef(injectedKnowledge({ sot3: sot3Result({ mode: 'SHADOW' }), sot3Evidence: { diagnosticClass: 'DUPLICATE_NOOP', recordId: RECORD_ID } }));
        const enforce = buildSot3LineageRef(injectedKnowledge());
        expect(shadow.ref).toBe(`sot3:shadow-approved:${RECORD_ID}`);
        expect(enforce.ref).toBe(`sot3:enforce-approved:${RECORD_ID}`);
        expect(buildSot3LineageRef(injectedKnowledge({ sot3: sot3Result({ terminalOutcome: 'REJECTED' }) })).ref).toBe(`sot3:enforce-rejected:${RECORD_ID}`);
    });

    it('records sot3:shadow-rejected:<recordId> and the named gap SOT3_SHADOW_REJECTED for an observe-only SHADOW rejection', async () => {
        const id = 'canonical-shadow-rejected';
        const knowledge = injectedKnowledge({ sot3: sot3Result({ mode: 'SHADOW', terminalOutcome: 'REJECTED', injectionPermitted: false, failureStage: 'MISSING_PROVENANCE' }), sot3Evidence: persisted() });
        const refs = refsFor(id, { guardResult: guardResult(), knowledge, memoryContextInjected: true });
        expect(refs.sot3Ref).toBe(`sot3:shadow-rejected:${RECORD_ID}`);
        expect(refs.namedGaps).toEqual(['SOT3_SHADOW_REJECTED', 'MEMORY_CONTEXT_INJECTED']);
        expect(refs.namedGaps.every(gap => /^[a-zA-Z0-9._:-]{1,64}$/.test(gap))).toBe(true);
        const { view } = await finalizeRun(id, t => t.recordGovernanceRefs(refs));
        expect(view.terminal!.refs.sot3).toBe(`sot3:shadow-rejected:${RECORD_ID}`);
        expect(view.terminal!.gaps).toContain('SOT3_SHADOW_REJECTED');
    });

    it('keeps the SHADOW rejection visible even when its evidence is not durable, and never flags APPROVED SHADOW or ENFORCE', () => {
        const shadowRejected = sot3Result({ mode: 'SHADOW', terminalOutcome: 'REJECTED', injectionPermitted: false, failureStage: 'MISSING_PROVENANCE' });
        const notDurable = refsFor('c-shadow-nd', { guardResult: guardResult(), knowledge: injectedKnowledge({ sot3: shadowRejected, sot3Evidence: { diagnosticClass: 'SOT3_EVIDENCE_PERSISTENCE_FAILED', recordId: RECORD_ID } }) });
        expect(notDurable.sot3Ref).toBeNull();
        expect(notDurable.namedGaps).toEqual(['SOT3_EVIDENCE_NOT_PERSISTED', 'SOT3_SHADOW_REJECTED']);
        expect(refsFor('c-shadow-ok', { guardResult: guardResult(), knowledge: injectedKnowledge({ sot3: sot3Result({ mode: 'SHADOW' }), sot3Evidence: persisted() }) }).namedGaps).toEqual([]);
        expect(refsFor('c-enforce-rej', { guardResult: guardResult(), knowledge: injectedKnowledge({ sot3: sot3Result({ terminalOutcome: 'REJECTED' }), sot3Evidence: persisted() }) }).namedGaps).toEqual([]);
    });

    it('names SOT3_SHADOW_NO_CONTEXT only for SHADOW + NO_CONTEXT with an explicitly requested collection, within the four gap cap', () => {
        const noContext = sot3Result({ mode: 'SHADOW', terminalOutcome: 'NO_CONTEXT', injectionPermitted: false, failureStage: 'NO_CHUNKS' });
        const requested = refsFor('c-nc-req', { guardResult: guardResult(), knowledge: injectedKnowledge({ sot3: noContext, sot3Evidence: persisted(), requestedKnowledgeCollectionId: 'col-1' }), memoryContextInjected: true });
        expect(requested.sot3Ref).toBe(`sot3:shadow-no_context:${RECORD_ID}`);
        expect(requested.namedGaps).toEqual(['SOT3_SHADOW_NO_CONTEXT', 'MEMORY_CONTEXT_INJECTED']);
        expect(requested.namedGaps.every(gap => /^[a-zA-Z0-9._:-]{1,64}$/.test(gap))).toBe(true);
        const notDurable = refsFor('c-nc-nd', { guardResult: guardResult(), knowledge: injectedKnowledge({ sot3: noContext, sot3Evidence: undefined, requestedKnowledgeCollectionId: 'col-1' }) });
        expect(notDurable.namedGaps).toEqual(['SOT3_EVIDENCE_NOT_PERSISTED', 'SOT3_SHADOW_NO_CONTEXT']);
        expect(refsFor('c-nc-unreq', { guardResult: guardResult(), knowledge: injectedKnowledge({ sot3: noContext, sot3Evidence: persisted(), requestedKnowledgeCollectionId: null }) }).namedGaps).toEqual([]);
        expect(refsFor('c-nc-enf', { guardResult: guardResult(), knowledge: injectedKnowledge({ sot3: sot3Result({ mode: 'ENFORCE', terminalOutcome: 'NO_CONTEXT' }), sot3Evidence: persisted(), requestedKnowledgeCollectionId: 'col-1' }) }).namedGaps).toEqual([]);
    });

    it('falls back to a digest body when the evidence record id is unusable as a reference, deterministically', () => {
        const bad = injectedKnowledge({ sot3Evidence: persisted('bad id with spaces') });
        const first = buildSot3LineageRef(bad).ref;
        expect(first).toMatch(/^sot3:enforce-approved:[0-9a-f]{24}$/);
        expect(first).toBe(buildSot3LineageRef(bad).ref);
        expect(first).not.toBe(buildSot3LineageRef({ ...bad, retrievalResult: retrieval(3) }).ref);
    });

    it('is deterministic for identical inputs and sensitive to the decision and the server canonicalId', () => {
        expect(buildGuardLineageRef(guardResult(), 'c1')).toBe(buildGuardLineageRef(guardResult({ executedAt: '2030-01-01T00:00:00.000Z', durationMs: 99 }), 'c1'));
        expect(buildGuardLineageRef(guardResult(), 'c1')).not.toBe(buildGuardLineageRef(guardResult(), 'c2'));
        expect(refsFor('c1', { guardResult: guardResult(), knowledge: injectedKnowledge() })).toEqual(refsFor('c1', { guardResult: guardResult(), knowledge: injectedKnowledge() }));
        const blocked = guardResult({ finalDecision: 'BLOCK', blockedBy: 'risk_gate' });
        expect(buildGuardLineageRef(blocked, 'c1')).toMatch(/^guard:block:/);
        expect(buildGuardLineageRef(blocked, 'c1')).not.toBe(buildGuardLineageRef(guardResult(), 'c1'));
    });

    it('keeps GUARD_NOT_RECORDED and SOT3_NOT_RECORDED for an early terminal before guard and SOT3 ran', async () => {
        const { view } = await finalizeRun('canonical-early', undefined, { success: false }, 'DENIED');
        expect(view.terminal!.refs.guard).toBeNull();
        expect(view.terminal!.refs.sot3).toBeNull();
        expect(view.terminal!.gaps).toEqual(expect.arrayContaining(['GUARD_NOT_RECORDED', 'SOT3_NOT_RECORDED']));
        expect(buildGuardLineageRef(undefined, 'c1')).toBeNull();
        expect(buildGuardLineageRef({ finalDecision: 'ALLOW' }, 'c1')).toBeNull();
        expect(refsFor('c1', {})).toEqual({ guardRef: null, sot3Ref: null, namedGaps: [] });
    });

    it('lets the terminal response guard decision (output-bypass block) override the pre-provider guard ref', async () => {
        const id = 'canonical-bypass';
        const bypass = guardResult({ finalDecision: 'BLOCK', blockedBy: 'output_bypass_detection' });
        const { view } = await finalizeRun(id, t => t.recordGovernanceRefs(refsFor(id, { guardResult: guardResult(), knowledge: noKnowledge() })), { success: false, guardResult: bypass }, 'DENIED');
        expect(view.terminal!.refs.guard).toBe(buildGuardLineageRef(bypass, id));
        expect(view.terminal!.refs.guard).toMatch(/^guard:block:/);
    });

    it('recordGovernanceRefs ignores undefined keys instead of overwriting recorded refs', async () => {
        const id = 'canonical-partial';
        const { view } = await finalizeRun(id, t => {
            t.recordGovernanceRefs(refsFor(id, { guardResult: guardResult(), knowledge: noKnowledge(), memoryContextInjected: true }));
            t.recordGovernanceRefs({ guardRef: undefined, sot3Ref: undefined, namedGaps: undefined });
        });
        expect(view.terminal!.refs.guard).toMatch(/^guard:allow:/);
        expect(view.terminal!.refs.sot3).toBe('sot3:none:no_knowledge_retrieval');
        expect(view.terminal!.gaps).toContain('MEMORY_CONTEXT_INJECTED');
    });

    it('never throws from a builder defect; refs degrade to null gaps', () => {
        const hostile = new Proxy({}, { get() { throw new Error('boom'); } });
        expect(buildGuardLineageRef(hostile, 'c1')).toBeNull();
        const degraded = refsFor('c1', { guardResult: hostile, knowledge: hostile as unknown as SotKnowledgeForLineage });
        expect(degraded).toEqual({ guardRef: null, sot3Ref: null, namedGaps: [] });
    });
});
