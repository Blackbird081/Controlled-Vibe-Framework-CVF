import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { DeterministicClock, SequentialIdFactory } from 'cvf-refinery';
import {
  evaluateSot3KnowledgeActivation,
  resolveSot3KnowledgeActivationMode,
  type Sot3KnowledgeChunkInput,
} from './sot3-knowledge-adapter';
import type { Sot3KnowledgeSourceMetadata } from './knowledge-store';

/** Mirrors cvf-refinery's integrityStage.computeContentHash exactly. */
function computeExpectedContentHash(records: Array<Record<string, unknown>>): string {
  const sorted = records.map((record) => {
    const keys = Object.keys(record).sort();
    return keys.map((key) => [key, record[key]]);
  });
  return `sha256:${createHash('sha256').update(JSON.stringify(sorted)).digest('hex')}`;
}

function buildValidChunk(overrides: Partial<Sot3KnowledgeSourceMetadata> = {}): Sot3KnowledgeChunkInput {
  const sourceId = overrides.sourceId ?? 'src-001';
  const content = 'Governed knowledge chunk content';
  const rawRecord = { source_id: sourceId, id: 'chunk-001', content };
  const meta: Sot3KnowledgeSourceMetadata = {
    sourceId,
    sourceType: 'INTERNAL',
    owner: 'team-eng',
    capturedAtUtc: '2026-07-13T00:00:00.000Z',
    purpose: ['execute-route-context'],
    confidentiality: 'INTERNAL',
    expectedContentHash: computeExpectedContentHash([rawRecord]),
    rawReference: { type: 'object', location: 'knowledge-store://chunk-001' },
    captureStatus: 'CAPTURED',
    declaredVersion: null,
    validFromUtc: null,
    validUntilUtc: null,
    ...overrides,
  };
  return { id: 'chunk-001', content, collectionId: 'col-1', sot3Source: meta };
}

function buildInputBase() {
  return {
    organization: 'org_a',
    team: 'team_a',
    actorId: 'usr_a',
    requestId: 'req-1',
    policyVersion: 'v1',
    ruleVersion: 'v1',
    clock: new DeterministicClock('2026-07-13T00:00:00.000Z', 1000),
    ids: new SequentialIdFactory(),
  };
}

describe('resolveSot3KnowledgeActivationMode', () => {
  it('resolves missing value to OFF', () => {
    expect(resolveSot3KnowledgeActivationMode(undefined)).toBe('OFF');
  });

  it('resolves empty value to OFF', () => {
    expect(resolveSot3KnowledgeActivationMode('')).toBe('OFF');
  });

  it('resolves invalid value to OFF', () => {
    expect(resolveSot3KnowledgeActivationMode('BOGUS')).toBe('OFF');
  });

  it('resolves SHADOW and ENFORCE', () => {
    expect(resolveSot3KnowledgeActivationMode('SHADOW')).toBe('SHADOW');
    expect(resolveSot3KnowledgeActivationMode('ENFORCE')).toBe('ENFORCE');
  });
});

describe('evaluateSot3KnowledgeActivation', () => {
  it('returns NO_CONTEXT with no chunks', () => {
    const result = evaluateSot3KnowledgeActivation({ ...buildInputBase(), chunks: [] }, 'ENFORCE');
    expect(result.terminalOutcome).toBe('NO_CONTEXT');
    expect(result.injectionPermitted).toBe(false);
    expect(result.approvedContext).toBeNull();
    expect(result.failureStage).toBe('NO_CHUNKS');
  });

  it('rejects with MISSING_PROVENANCE when sot3Source is absent', () => {
    const chunk: Sot3KnowledgeChunkInput = { id: 'c1', content: 'x', collectionId: 'col-1', sot3Source: undefined };
    const result = evaluateSot3KnowledgeActivation({ ...buildInputBase(), chunks: [chunk] }, 'ENFORCE');
    expect(result.terminalOutcome).toBe('REJECTED');
    expect(result.failureStage).toBe('MISSING_PROVENANCE');
    expect(result.injectionPermitted).toBe(false);
    expect(result.approvedContext).toBeNull();
  });

  it('approves valid provenance through Refinery, Kernel, and Flow in ENFORCE', () => {
    const chunk = buildValidChunk();
    const result = evaluateSot3KnowledgeActivation({ ...buildInputBase(), chunks: [chunk] }, 'ENFORCE');
    expect(result.terminalOutcome).toBe('APPROVED');
    expect(result.injectionPermitted).toBe(true);
    expect(result.approvedContext).toContain('Governed knowledge chunk content');
    expect(result.failureStage).toBeNull();
    expect(result.refineryStatus).toBe('READY_FOR_KERNEL');
    expect(result.kernelDecision).toBe('ACCEPT_EVIDENCE_CANDIDATE');
    expect(result.truthReferenceId).toBeTruthy();
    expect(result.flowPackageId).toBeTruthy();
    expect(result.flowAcknowledgementState).toBe('ACKNOWLEDGED');
  });

  it('does not permit injection in SHADOW even when approved', () => {
    const chunk = buildValidChunk();
    const result = evaluateSot3KnowledgeActivation({ ...buildInputBase(), chunks: [chunk] }, 'SHADOW');
    expect(result.terminalOutcome).toBe('APPROVED');
    expect(result.injectionPermitted).toBe(false);
  });

  it('rejects with REFINERY_NOT_READY on incorrect expected content hash', () => {
    const chunk = buildValidChunk({ expectedContentHash: 'sha256:0000000000000000000000000000000000000000000000000000000000000000' });
    const result = evaluateSot3KnowledgeActivation({ ...buildInputBase(), chunks: [chunk] }, 'ENFORCE');
    expect(result.terminalOutcome).toBe('REJECTED');
    expect(result.failureStage).toBe('REFINERY_NOT_READY');
    expect(result.injectionPermitted).toBe(false);
    expect(result.approvedContext).toBeNull();
  });

  it('rejects with KERNEL_NOT_ACCEPTED when provenance is captured as REJECTED_AT_INTAKE', () => {
    const rawRecord = { source_id: 'src-003', id: 'chunk-001', content: 'Governed knowledge chunk content' };
    const chunk = buildValidChunk({
      sourceId: 'src-003',
      captureStatus: 'REJECTED_AT_INTAKE',
      expectedContentHash: computeExpectedContentHash([rawRecord]),
    });
    const result = evaluateSot3KnowledgeActivation({ ...buildInputBase(), chunks: [chunk] }, 'ENFORCE');
    expect(result.terminalOutcome).toBe('REJECTED');
    expect(result.failureStage).toBe('KERNEL_NOT_ACCEPTED');
    expect(result.kernelDecision).toBe('REJECT');
    expect(result.injectionPermitted).toBe(false);
    expect(result.approvedContext).toBeNull();
  });

  it('registers evidence for every source included in approved context', () => {
    const first = buildValidChunk();
    const secondContent = 'Second source content must not bypass Kernel evidence checks';
    const secondRecord = { source_id: 'src-002', id: 'chunk-002', content: secondContent };
    const second: Sot3KnowledgeChunkInput = {
      id: 'chunk-002',
      content: secondContent,
      collectionId: 'col-1',
      sot3Source: {
        ...first.sot3Source!,
        sourceId: 'src-002',
        expectedContentHash: computeExpectedContentHash([secondRecord]),
        rawReference: { type: 'object', location: 'knowledge-store://chunk-002' },
      },
    };

    const result = evaluateSot3KnowledgeActivation(
      { ...buildInputBase(), chunks: [first, second] },
      'ENFORCE',
    );

    expect(result.terminalOutcome).toBe('APPROVED');
    expect(result.kernelEvidenceCount).toBe(2);
    expect(result.approvedContext).toContain(first.content);
    expect(result.approvedContext).toContain(second.content);
  });

  it('fails closed when the Truth Reference is no longer active before Flow creation', () => {
    const chunk = buildValidChunk();
    const input = {
      ...buildInputBase(),
      chunks: [chunk],
      clock: new DeterministicClock('2026-07-13T00:00:00.000Z', 10 * 60 * 1000),
    };

    const result = evaluateSot3KnowledgeActivation(input, 'ENFORCE');

    expect(result.terminalOutcome).toBe('REJECTED');
    expect(result.failureStage).toBe('FLOW_NOT_CREATED');
    expect(result.injectionPermitted).toBe(false);
    expect(result.approvedContext).toBeNull();
  });

  it('never returns raw chunk content in approvedContext field name when rejected', () => {
    const chunk = buildValidChunk({ expectedContentHash: 'sha256:bad' });
    const result = evaluateSot3KnowledgeActivation({ ...buildInputBase(), chunks: [chunk] }, 'ENFORCE');
    expect(result.approvedContext).toBeNull();
  });
});

describe('evaluateSot3KnowledgeActivation - strict Flow consumption binding (SOT3-ACT-A4)', () => {
  it('approves and acknowledges through strict consumeFor when the adapter binding is self-consistent for a given actor', () => {
    const chunk = buildValidChunk();
    const result = evaluateSot3KnowledgeActivation({ ...buildInputBase(), actorId: 'usr_actor_one', chunks: [chunk] }, 'ENFORCE');

    expect(result.terminalOutcome).toBe('APPROVED');
    expect(result.flowAcknowledgementState).toBe('ACKNOWLEDGED');
    expect(result.traces[0].flowPackage?.recipient).toBe('usr_actor_one');
    expect(result.traces[0].flowPackage?.role).toBe('execute-route-consumer');
    expect(result.traces[0].flowPackage?.task).toBe('knowledge-context-injection');
    expect(result.traces[0].flowPackage?.phase).toBe('PHASE_D_EXECUTE');
    expect(result.traces[0].flowPackage?.dose).toBe('single-use-context');
  });

  it('different actorId values each bind and acknowledge their own package with the correct recipient stamped on that package only', () => {
    const chunkA = buildValidChunk();
    const resultA = evaluateSot3KnowledgeActivation({ ...buildInputBase(), actorId: 'usr_actor_a', chunks: [chunkA] }, 'ENFORCE');
    expect(resultA.terminalOutcome).toBe('APPROVED');
    expect(resultA.traces[0].flowPackage?.recipient).toBe('usr_actor_a');
    expect(resultA.traces[0].flowPackage?.recipient).not.toBe('usr_actor_b');

    const chunkB = buildValidChunk({ sourceId: 'src-actor-b' });
    const resultB = evaluateSot3KnowledgeActivation({ ...buildInputBase(), actorId: 'usr_actor_b', chunks: [chunkB] }, 'ENFORCE');
    expect(resultB.terminalOutcome).toBe('APPROVED');
    expect(resultB.traces[0].flowPackage?.recipient).toBe('usr_actor_b');
    expect(resultB.traces[0].flowPackage?.recipient).not.toBe('usr_actor_a');
  });

  it('two independent evaluations of the same chunk each complete their own full strict-consume-then-acknowledge lifecycle (no shared cross-call Flow state)', () => {
    // Each adapter evaluation call constructs its own DistributionEngine
    // instance (see evaluateSingleSot3KnowledgeChunk), so there is no
    // shared in-memory package for a second call to replay against; this
    // proves the adapter does not expose or rely on any cross-call replay
    // shortcut, and every call independently goes through the full
    // Refinery -> Kernel -> Flow strict-consume -> acknowledge lifecycle.
    const chunk = buildValidChunk();
    const firstCallResult = evaluateSot3KnowledgeActivation({ ...buildInputBase(), chunks: [chunk] }, 'ENFORCE');
    const secondCallResult = evaluateSot3KnowledgeActivation({ ...buildInputBase(), chunks: [chunk] }, 'ENFORCE');

    expect(firstCallResult.terminalOutcome).toBe('APPROVED');
    expect(secondCallResult.terminalOutcome).toBe('APPROVED');
    expect(firstCallResult.flowAcknowledgementState).toBe('ACKNOWLEDGED');
    expect(secondCallResult.flowAcknowledgementState).toBe('ACKNOWLEDGED');
  });
});

describe('evaluateSot3KnowledgeActivation - lifecycle traces', () => {
  it('returns exactly one complete trace for a single approved chunk with actual owner outputs', () => {
    const chunk = buildValidChunk();
    const result = evaluateSot3KnowledgeActivation({ ...buildInputBase(), chunks: [chunk] }, 'ENFORCE');

    expect(result.traces).toHaveLength(1);
    const [trace] = result.traces;
    expect(trace.chunkId).toBe('chunk-001');
    expect(trace.collectionId).toBe('col-1');
    expect(trace.sourceId).toBe('src-001');
    expect(trace.terminalOutcome).toBe('APPROVED');
    expect(trace.failureStage).toBeNull();
    expect(trace.refineryPacketId).toBe(result.refineryPacketId);
    expect(trace.refineryPacketHash).toBeTruthy();
    expect(trace.kernelDecision?.decision_id).toBe(result.kernelDecisionId);
    expect(trace.kernelDecision?.decision).toBe('ACCEPT_EVIDENCE_CANDIDATE');
    expect(trace.kernelDecision?.request_id).toBe('req-1');
    expect(trace.kernelDecision?.packet_hash).toBe(trace.refineryPacketHash);
    expect(trace.kernelDecision?.verification_result_refs).toHaveLength(1);
    expect(trace.truthReceipt?.receipt_id).toBeTruthy();
    expect(trace.truthReceipt?.receipt_hash).toBeTruthy();
    expect(trace.truthReceipt?.decision_id).toBe(trace.kernelDecision?.decision_id);
    expect(trace.truthReceipt?.evaluated_content_hash).toBe(trace.refineryPacketHash);
    expect(trace.truthReceipt?.evidence_refs).toHaveLength(1);
    expect(trace.truthReceipt?.verification_result_refs).toEqual(trace.kernelDecision?.verification_result_refs);
    expect(trace.truthReceipt?.policy_version).toBe('v1');
    expect(trace.truthReceipt?.rule_version).toBe('v1');
    expect(trace.truthReference?.reference_id).toBe(result.truthReferenceId);
    expect(trace.truthReference?.receipt_id).toBe(trace.truthReceipt?.receipt_id);
    expect(trace.truthReference?.reference_state).toBe('ACTIVE');
    expect(trace.flowPackage?.package_id).toBe(result.flowPackageId);
    expect(trace.flowPackage?.truth_references).toEqual([trace.truthReference?.reference_id]);
    expect(trace.flowPackage?.dose).toBe('single-use-context');
    expect(trace.flowPackage?.restrictions).toEqual([]);
    expect(trace.flowPackage?.acknowledgement_state).toBe('ACKNOWLEDGED');
  });

  it('produces identical trace fields for identical semantic input (deterministic)', () => {
    const chunkA = buildValidChunk();
    const chunkB = buildValidChunk();
    const resultA = evaluateSot3KnowledgeActivation({ ...buildInputBase(), chunks: [chunkA] }, 'ENFORCE');
    const resultB = evaluateSot3KnowledgeActivation({ ...buildInputBase(), chunks: [chunkB] }, 'ENFORCE');

    expect(resultA.traces[0].refineryPacketHash).toBe(resultB.traces[0].refineryPacketHash);
    expect(resultA.traces[0].kernelDecision?.decision).toBe(resultB.traces[0].kernelDecision?.decision);
  });

  it('returns exactly one trace per evaluated chunk with no cross-chunk ID mixing', () => {
    const first = buildValidChunk();
    const secondContent = 'Second source content must not bypass Kernel evidence checks';
    const secondRecord = { source_id: 'src-002', id: 'chunk-002', content: secondContent };
    const second: Sot3KnowledgeChunkInput = {
      id: 'chunk-002',
      content: secondContent,
      collectionId: 'col-2',
      sot3Source: {
        ...first.sot3Source!,
        sourceId: 'src-002',
        expectedContentHash: computeExpectedContentHash([secondRecord]),
        rawReference: { type: 'object', location: 'knowledge-store://chunk-002' },
      },
    };

    const result = evaluateSot3KnowledgeActivation({ ...buildInputBase(), chunks: [first, second] }, 'ENFORCE');

    expect(result.traces).toHaveLength(2);
    expect(result.traces[0].chunkId).toBe('chunk-001');
    expect(result.traces[0].sourceId).toBe('src-001');
    expect(result.traces[0].collectionId).toBe('col-1');
    expect(result.traces[1].chunkId).toBe('chunk-002');
    expect(result.traces[1].sourceId).toBe('src-002');
    expect(result.traces[1].collectionId).toBe('col-2');
    expect(result.traces[0].refineryPacketId).not.toBe(result.traces[1].refineryPacketId);
    expect(result.traces[0].kernelDecision?.decision_id).not.toBe(result.traces[1].kernelDecision?.decision_id);
    expect(result.traces[0].truthReference?.reference_id).not.toBe(result.traces[1].truthReference?.reference_id);
    expect(result.traces[0].flowPackage?.package_id).not.toBe(result.traces[1].flowPackage?.package_id);
  });

  it('includes a trace with failure stage and no downstream fields when a chunk is rejected', () => {
    const chunk = buildValidChunk({ expectedContentHash: 'sha256:0000000000000000000000000000000000000000000000000000000000000000' });
    const result = evaluateSot3KnowledgeActivation({ ...buildInputBase(), chunks: [chunk] }, 'ENFORCE');

    expect(result.traces).toHaveLength(1);
    expect(result.traces[0].terminalOutcome).toBe('REJECTED');
    expect(result.traces[0].failureStage).toBe('REFINERY_NOT_READY');
    expect(result.traces[0].refineryPacketHash).toMatch(/^sha256:/);
    expect(result.traces[0].kernelDecision).toBeNull();
    expect(result.traces[0].truthReceipt).toBeNull();
    expect(result.traces[0].truthReference).toBeNull();
    expect(result.traces[0].flowPackage).toBeNull();
  });

  it('never persists raw chunk content, prompt, or secret-shaped values in trace fields', () => {
    const chunk = buildValidChunk();
    const result = evaluateSot3KnowledgeActivation({ ...buildInputBase(), chunks: [chunk] }, 'ENFORCE');
    const serialized = JSON.stringify(result.traces);

    expect(serialized).not.toContain(chunk.content);
    expect(serialized).not.toMatch(/sk-|api[_-]?key|bearer\s/i);
  });

  it('returns an empty trace list when there are no chunks to evaluate', () => {
    const result = evaluateSot3KnowledgeActivation({ ...buildInputBase(), chunks: [] }, 'ENFORCE');
    expect(result.traces).toEqual([]);
  });
});
