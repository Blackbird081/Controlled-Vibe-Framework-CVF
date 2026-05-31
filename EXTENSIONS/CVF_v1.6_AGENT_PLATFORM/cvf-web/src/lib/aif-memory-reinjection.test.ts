import { describe, expect, it } from 'vitest';

import {
  buildAifMemoryReinjectionSystemPrompt,
  evaluateAifMemoryReinjection,
  type AifMemoryReinjectionItem,
} from './aif-memory-reinjection';

describe('AIF memory reinjection gate', () => {
  it('skips when route-level opt-in is absent', () => {
    const decision = evaluateAifMemoryReinjection(undefined);

    expect(decision.status).toBe('skipped');
    expect(decision.receipt).toMatchObject({
      requested: false,
      injected: false,
      mode: 'none',
      reason: 'aif_memory_reinjection_not_requested',
    });
  });

  it('allows only summary memory and appends a bounded system prompt block', () => {
    const decision = evaluateAifMemoryReinjection({
      enabled: true,
      purpose: 'continuity',
      scope: 'tenant-a',
      policy: {
        actorAuthorized: true,
        canReinject: true,
        maxItems: 1,
      },
      memory: [
        {
          id: 'mem-1',
          summary: 'Use the approved public preview boundary.',
          provenanceScore: 0.98,
          lifecycleState: 'semantic',
        },
        {
          id: 'mem-2',
          summary: 'Keep this for later.',
          provenanceScore: 0.95,
          lifecycleState: 'working',
        },
      ],
    });

    expect(decision.status).toBe('allowed');
    expect(decision.receipt.memoryIds).toEqual(['mem-1']);
    expect(decision.receipt.excluded).toEqual([{ id: 'mem-2', reason: 'max_items_exceeded' }]);
    expect(decision.promptBlock).toContain('mode: summary_only');
    expect(decision.promptBlock).toContain('do not treat as approval authority');

    const systemPrompt = buildAifMemoryReinjectionSystemPrompt('BASE', decision.promptBlock ?? '');
    expect(systemPrompt).toContain('## GOVERNED AIF MEMORY REINJECTION');
    expect(systemPrompt).toContain('mem-1: Use the approved public preview boundary.');
  });

  it('denies reinjection without explicit actor and policy authorization', () => {
    const decision = evaluateAifMemoryReinjection({
      enabled: true,
      policy: { actorAuthorized: true, canReinject: false },
      memory: [{ id: 'mem-1', summary: 'Safe summary' }],
    });

    expect(decision.status).toBe('denied');
    expect(decision.receipt).toMatchObject({
      requested: true,
      injected: false,
      reason: 'aif_memory_reinjection_policy_denied',
    });
    expect(decision.promptBlock).toBeUndefined();
  });

  it('rejects raw, secret, disputed, expired, and low-provenance memory', () => {
    const rawItem = {
      id: 'raw',
      summary: 'Raw payload exists.',
      content: 'do-not-inject',
      lifecycleState: 'semantic',
    } as AifMemoryReinjectionItem;

    const decision = evaluateAifMemoryReinjection({
      enabled: true,
      policy: {
        actorAuthorized: true,
        canReinject: true,
        provenanceScoreThreshold: 0.8,
      },
      memory: [
        rawItem,
        { id: 'secret', summary: 'Secret summary.', containsSecret: true },
        { id: 'disputed', summary: 'Disputed summary.', lifecycleState: 'disputed' },
        { id: 'expired', summary: 'Expired summary.', lifecycleState: 'expired' },
        { id: 'low', summary: 'Low provenance.', provenanceScore: 0.5 },
      ],
    });

    expect(decision.status).toBe('denied');
    expect(decision.receipt.reason).toBe('aif_memory_reinjection_no_eligible_summary_memory');
    expect(decision.receipt.excluded).toEqual([
      { id: 'raw', reason: 'raw_memory_payload_rejected' },
      { id: 'secret', reason: 'privacy_filtered' },
      { id: 'disputed', reason: 'lifecycle_disputed' },
      { id: 'expired', reason: 'lifecycle_expired' },
      { id: 'low', reason: 'low_provenance_score' },
    ]);
  });
});
