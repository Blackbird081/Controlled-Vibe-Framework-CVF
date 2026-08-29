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

  it('excludes an item with an omitted provenanceScore property as missing_provenance_score', () => {
    const decision = evaluateAifMemoryReinjection({
      enabled: true,
      policy: { actorAuthorized: true, canReinject: true },
      memory: [{ id: 'omitted', summary: 'No provenance field at all.' }],
    });

    expect(decision.status).toBe('denied');
    expect(decision.receipt.excluded).toEqual([{ id: 'omitted', reason: 'missing_provenance_score' }]);
  });

  it('excludes an item with an explicit undefined provenanceScore as missing_provenance_score', () => {
    const decision = evaluateAifMemoryReinjection({
      enabled: true,
      policy: { actorAuthorized: true, canReinject: true },
      memory: [{ id: 'explicit-undefined', summary: 'Explicitly undefined.', provenanceScore: undefined }],
    });

    expect(decision.status).toBe('denied');
    expect(decision.receipt.excluded).toEqual([{ id: 'explicit-undefined', reason: 'missing_provenance_score' }]);
  });

  it('excludes NaN provenanceScore as invalid_provenance_score', () => {
    const decision = evaluateAifMemoryReinjection({
      enabled: true,
      policy: { actorAuthorized: true, canReinject: true },
      memory: [{ id: 'nan', summary: 'NaN provenance.', provenanceScore: NaN }],
    });

    expect(decision.status).toBe('denied');
    expect(decision.receipt.excluded).toEqual([{ id: 'nan', reason: 'invalid_provenance_score' }]);
  });

  it('excludes positive Infinity provenanceScore as invalid_provenance_score', () => {
    const decision = evaluateAifMemoryReinjection({
      enabled: true,
      policy: { actorAuthorized: true, canReinject: true },
      memory: [{ id: 'pos-inf', summary: 'Positive infinity provenance.', provenanceScore: Infinity }],
    });

    expect(decision.status).toBe('denied');
    expect(decision.receipt.excluded).toEqual([{ id: 'pos-inf', reason: 'invalid_provenance_score' }]);
  });

  it('excludes negative Infinity provenanceScore as invalid_provenance_score', () => {
    const decision = evaluateAifMemoryReinjection({
      enabled: true,
      policy: { actorAuthorized: true, canReinject: true },
      memory: [{ id: 'neg-inf', summary: 'Negative infinity provenance.', provenanceScore: -Infinity }],
    });

    expect(decision.status).toBe('denied');
    expect(decision.receipt.excluded).toEqual([{ id: 'neg-inf', reason: 'invalid_provenance_score' }]);
  });

  it('retains low_provenance_score for a finite score of zero, below threshold', () => {
    const decision = evaluateAifMemoryReinjection({
      enabled: true,
      policy: { actorAuthorized: true, canReinject: true },
      memory: [{ id: 'zero', summary: 'Zero provenance.', provenanceScore: 0 }],
    });

    expect(decision.status).toBe('denied');
    expect(decision.receipt.excluded).toEqual([{ id: 'zero', reason: 'low_provenance_score' }]);
  });

  it('treats the exact 0.7 boundary as eligible', () => {
    const decision = evaluateAifMemoryReinjection({
      enabled: true,
      policy: { actorAuthorized: true, canReinject: true },
      memory: [{ id: 'boundary', summary: 'Exactly at threshold.', provenanceScore: 0.7 }],
    });

    expect(decision.status).toBe('allowed');
    expect(decision.receipt.memoryIds).toEqual(['boundary']);
    expect(decision.receipt.excluded).toEqual([]);
  });

  it('selects only eligible items from a mixed batch and leaks no excluded item into selected, memoryIds, or promptBlock', () => {
    const decision = evaluateAifMemoryReinjection({
      enabled: true,
      policy: { actorAuthorized: true, canReinject: true, maxItems: 5 },
      memory: [
        { id: 'mixed-missing', summary: 'Missing score summary text.' },
        { id: 'mixed-nan', summary: 'NaN score summary text.', provenanceScore: NaN },
        { id: 'mixed-low', summary: 'Low score summary text.', provenanceScore: 0.1 },
        { id: 'mixed-boundary', summary: 'Boundary score summary text.', provenanceScore: 0.7 },
        { id: 'mixed-high', summary: 'High score summary text.', provenanceScore: 0.99 },
      ],
    });

    expect(decision.status).toBe('allowed');
    expect(decision.receipt.memoryIds).toEqual(['mixed-boundary', 'mixed-high']);
    expect(decision.receipt.excluded).toEqual([
      { id: 'mixed-missing', reason: 'missing_provenance_score' },
      { id: 'mixed-nan', reason: 'invalid_provenance_score' },
      { id: 'mixed-low', reason: 'low_provenance_score' },
    ]);

    const promptBlock = decision.promptBlock ?? '';
    const approvedSection = promptBlock.slice(
      promptBlock.indexOf('approved_memory:'),
      promptBlock.indexOf('excluded_memory:'),
    );

    // Excluded item ids/reasons are intentionally listed in the pre-existing
    // excluded_memory transparency ledger (unchanged behavior, matching how
    // max_items_exceeded already worked before this fix). The security
    // property under test is that excluded items never enter the trusted
    // approved_memory section, and their summary/content text never leaks
    // into the prompt block at all.
    expect(approvedSection).toContain('mixed-boundary');
    expect(approvedSection).toContain('mixed-high');
    expect(approvedSection).not.toContain('mixed-missing');
    expect(approvedSection).not.toContain('mixed-nan');
    expect(approvedSection).not.toContain('mixed-low');
    expect(promptBlock).not.toContain('Missing score summary text.');
    expect(promptBlock).not.toContain('NaN score summary text.');
    expect(promptBlock).not.toContain('Low score summary text.');
  });
});
