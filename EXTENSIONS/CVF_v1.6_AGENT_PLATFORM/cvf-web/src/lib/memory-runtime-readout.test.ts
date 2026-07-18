import { describe, expect, it } from 'vitest';
import { buildMemoryRuntimeReadout } from './memory-runtime-readout';

const SENTINEL = 'RAW_MEMORY_CONTENT_MUST_NOT_LEAK';

const baseInput = {
  operationId: 'mkg6-op-1',
  sessionId: 'session-1',
  projectId: 'project-1',
  actorId: 'actor-1',
  actorRole: 'OPERATOR' as const,
  scope: 'project-1',
  riskLevel: 'R1' as const,
  query: 'test memory query',
  tokenBudget: 500,
};

const candidate = {
  id: 'mem-1',
  scope: 'project-1',
  summary: 'Summary only text',
  content: SENTINEL,
  createdAt: Date.now(),
  auditTrust: 0.9,
  lifecycleState: 'semantic' as const,
};

describe('buildMemoryRuntimeReadout', () => {
  it('sanitizes raw candidate content from retrieval result and readout', () => {
    const result = buildMemoryRuntimeReadout({
      ...baseInput,
      candidates: [candidate],
      policyDecision: 'allow',
      containsSensitiveData: false,
    });

    expect(result.rawMemoryReleased).toBe(false);
    expect(result.canReinject).toBe(false);
    expect(result.retrievalResult?.selected?.[0]?.content).toBeUndefined();
    expect(result.contextBlock?.rawMemoryReleased).toBe(false);
    expect(result.contextBlock?.evidence.rawMemoryReleased).toBe(false);
    expect(result.contextBlock?.evidence.canReinject).toBe(false);

    const serialized = JSON.stringify(result);
    expect(serialized).not.toContain(SENTINEL);
  });

  it('returns denied workflow when policyDecision is deny', () => {
    const result = buildMemoryRuntimeReadout({
      ...baseInput,
      candidates: [candidate],
      policyDecision: 'deny',
      containsSensitiveData: false,
    });

    expect(result.status).toBe('denied');
    expect(result.contextBlock).toBeUndefined();
    expect(result.rawMemoryReleased).toBe(false);
    expect(result.canReinject).toBe(false);
  });
});
