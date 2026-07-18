/**
 * Tests for Evidence Trace Emitter
 */

import { describe, it, expect } from 'vitest';
import { generateTraceHash, createTraceEntry, createTraceEntryEnvelope, createTraceEntryWithEnvelope } from './trace-emitter';
import type { TraceEntryEnvelope } from './trace-emitter';
import type { GuardRequestContext, GuardPipelineResult } from '../types';
import type { GuardAuditEntryEnvelope, GuardPipelineResultEnvelope, GovernanceEvidenceReceiptEnvelope } from '../types';

function mockContext(overrides?: Partial<GuardRequestContext>): GuardRequestContext {
  return {
    requestId: 'req-001',
    phase: 'BUILD',
    riskLevel: 'R0',
    role: 'AI_AGENT',
    action: 'write code',
    channel: 'mcp',
    ...overrides,
  };
}

function mockResult(overrides?: Partial<GuardPipelineResult>): GuardPipelineResult {
  return {
    requestId: 'req-001',
    finalDecision: 'ALLOW',
    results: [],
    executedAt: '2026-03-11T23:00:00.000Z',
    durationMs: 5,
    ...overrides,
  };
}

describe('generateTraceHash', () => {
  it('returns a 16-char hex string', () => {
    const hash = generateTraceHash('req-001', 'ALLOW', '2026-03-11T23:00:00.000Z');
    expect(hash).toHaveLength(16);
    expect(/^[a-f0-9]+$/.test(hash)).toBe(true);
  });

  it('is deterministic', () => {
    const h1 = generateTraceHash('req-001', 'ALLOW', '2026-03-11T23:00:00.000Z');
    const h2 = generateTraceHash('req-001', 'ALLOW', '2026-03-11T23:00:00.000Z');
    expect(h1).toBe(h2);
  });

  it('differs for different inputs', () => {
    const h1 = generateTraceHash('req-001', 'ALLOW', '2026-03-11T23:00:00.000Z');
    const h2 = generateTraceHash('req-002', 'BLOCK', '2026-03-11T23:00:00.000Z');
    expect(h1).not.toBe(h2);
  });
});

describe('createTraceEntry', () => {
  it('creates a valid trace entry', () => {
    const ctx = mockContext();
    const result = mockResult();
    const entry = createTraceEntry(ctx, result);

    expect(entry.traceId).toBeDefined();
    expect(entry.traceHash).toHaveLength(16);
    expect(entry.requestId).toBe('req-001');
    expect(entry.channel).toBe('mcp');
    expect(entry.context).toEqual(ctx);
    expect(entry.pipelineResult).toEqual(result);
  });

  it('generates unique traceIds', () => {
    const e1 = createTraceEntry(mockContext(), mockResult());
    const e2 = createTraceEntry(mockContext(), mockResult());
    expect(e1.traceId).not.toBe(e2.traceId);
  });

  it('uses unknown channel when not specified', () => {
    const ctx = mockContext({ channel: undefined });
    const entry = createTraceEntry(ctx, mockResult());
    expect(entry.channel).toBe('unknown');
  });

  it('wraps trace entries in the canonical Phase 1.R receipt envelope', () => {
    const entry = createTraceEntry(mockContext(), mockResult());
    const envelope: TraceEntryEnvelope = createTraceEntryEnvelope(entry);

    expect(envelope.schemaVersion).toBe('1.R.0');
    expect(envelope.id).toBe(entry.traceId);
    expect(envelope.source).toBe(`guard-contract:trace-emitter:${entry.requestId}`);
    expect(envelope.payload).toBe(entry);
    expect(envelope.integrityHash).toBe(entry.traceHash);
  });

  it('creates trace entry and envelope together without changing the trace payload', () => {
    const result = createTraceEntryWithEnvelope(mockContext(), mockResult());

    expect(result.envelope.payload).toBe(result.entry);
    expect(result.envelope.payload.pipelineResult.finalDecision).toBe('ALLOW');
  });

  it('exposes typed guard receipt aliases without widening payloads to any', () => {
    const resultEnvelope: GuardPipelineResultEnvelope = {
      id: 'pipeline-result-envelope',
      issuedAt: '2026-05-20T00:00:00.000Z',
      source: 'guard-contract:test',
      schemaVersion: '1.R.0',
      payload: mockResult(),
    };
    const auditEnvelope: GuardAuditEntryEnvelope = {
      id: 'audit-entry-envelope',
      issuedAt: '2026-05-20T00:00:00.000Z',
      source: 'guard-contract:test',
      schemaVersion: '1.R.0',
      payload: {
        requestId: 'req-001',
        timestamp: '2026-05-20T00:00:00.000Z',
        context: mockContext(),
        pipelineResult: mockResult(),
      },
    };
    const governanceEnvelope: GovernanceEvidenceReceiptEnvelope = {
      id: 'governance-evidence-envelope',
      issuedAt: '2026-05-20T00:00:00.000Z',
      source: 'guard-contract:test',
      schemaVersion: '1.R.0',
      payload: {
        receiptId: 'evidence-001',
        evidenceMode: 'static',
        routeId: 'test-route',
        generatedAt: '2026-05-20T00:00:00.000Z',
      },
    };

    expect(resultEnvelope.payload.finalDecision).toBe('ALLOW');
    expect(auditEnvelope.payload.context.requestId).toBe('req-001');
    expect(governanceEnvelope.payload.evidenceMode).toBe('static');
  });
});
