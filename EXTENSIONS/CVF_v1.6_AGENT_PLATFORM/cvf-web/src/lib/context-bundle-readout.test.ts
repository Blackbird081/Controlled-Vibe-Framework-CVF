import { describe, expect, it } from 'vitest';
import { buildContextBundleReadout } from '@/lib/context-bundle-readout';
import { buildRouteRequestContextReadout } from '@/lib/route-request-context-readout';

describe('context bundle readout', () => {
  it('builds deterministic source-boundary metadata without raw context release', () => {
    const requestContextReadout = buildRouteRequestContextReadout({
      request: {
        templateName: 'Knowledge Query',
        intent: 'Analyze tenant-a alpha-scope partition details for users with constraints',
        inputs: {
          question: 'What is the tenant-a codename?',
          audience: 'Tenant A users',
          constraints: 'Use scoped retrieval only.',
        },
      },
      retrievedChunkCount: 1,
    });
    const baseInput = {
      receipt: {
        receiptId: 'receipt-1',
        evidenceMode: 'live' as const,
        routeId: '/api/execute',
        decision: 'ALLOW',
        policySnapshotId: 'policy-1',
        generatedAt: '2026-06-05T00:00:00.000Z',
      },
      requestContextReadout,
      retrievalResult: {
        chunks: [],
        matchedChunkCount: 1,
        allowedChunkCount: 1,
        droppedChunkCount: 0,
        allowedCollectionIds: ['tenant-org-a-private'],
        droppedCollectionIds: [],
      },
      requestedKnowledgeCollectionId: null,
      knowledgeSource: 'retrieval',
      knowledgeInjected: true,
    };

    const first = buildContextBundleReadout(baseInput);
    const second = buildContextBundleReadout(baseInput);

    expect(first).toMatchObject({
      readoutVersion: 'cvf.mlw2.contextBundleReadout.rt1.v1',
      bundleId: 'mlw2-receipt-1',
      cacheBoundary: 'DYNAMIC_REBUILD_REQUIRED',
      rawContextReleased: false,
      canReinject: false,
      runtimeContextMutationAuthorized: false,
    });
    expect(first.sourceMap).toEqual([
      expect.objectContaining({
        sourceType: 'knowledge_retrieval',
        evidencePointer: 'receipt:receipt-1:knowledge',
        injected: true,
        chunkCount: 1,
        allowedCollectionIds: ['tenant-org-a-private'],
      }),
    ]);
    expect(first.requestContext.detectedSignals).toContain('knowledge_context');
    expect(first.bundleHash).toMatch(/^[0-9a-f]{64}$/);
    expect(first.bundleHash).toBe(second.bundleHash);
    expect(JSON.stringify(first)).not.toMatch(/TENANT-A-SIGNAL|raw memory/i);
  });
});
