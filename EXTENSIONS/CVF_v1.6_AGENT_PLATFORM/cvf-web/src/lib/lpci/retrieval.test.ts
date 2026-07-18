import { describe, it, expect } from 'vitest';
import { mostRestrictiveAnswerClass, runRetrievalPipeline } from './retrieval';
import type { LpciIndexRecord } from './types';

const makeRecord = (overrides: Partial<LpciIndexRecord> = {}): LpciIndexRecord => ({
  normalizedPath: 'test/doc.pdf',
  sourceHash: 'abc123',
  documentType: 'policy',
  status: 'effective',
  answerClass: 'DIRECT_CITED_ANSWER',
  rawDisposition: 'ACCEPT',
  dispositionAlias: 'ACCEPT',
  contentSnippet: 'governance policy document',
  titleSnippet: 'Governance Policy',
  effectiveDate: '2026-01-01',
  authorityLevel: 'policy',
  ...overrides,
});

describe('retrieval', () => {
  describe('mostRestrictiveAnswerClass', () => {
    it('returns ESCALATE_OR_ABSTAIN when any record has it', () => {
      const records = [
        makeRecord({ answerClass: 'DIRECT_CITED_ANSWER' }),
        makeRecord({ answerClass: 'ESCALATE_OR_ABSTAIN', normalizedPath: 'test/doc2.pdf' }),
      ];
      expect(mostRestrictiveAnswerClass(records)).toBe('ESCALATE_OR_ABSTAIN');
    });

    it('returns PROCEDURAL_GUIDANCE over SUMMARY_WITH_SOURCE', () => {
      const records = [
        makeRecord({ answerClass: 'SUMMARY_WITH_SOURCE' }),
        makeRecord({ answerClass: 'PROCEDURAL_GUIDANCE', normalizedPath: 'test/doc2.pdf' }),
      ];
      expect(mostRestrictiveAnswerClass(records)).toBe('PROCEDURAL_GUIDANCE');
    });

    it('returns DIRECT_CITED_ANSWER when all records are DIRECT_CITED_ANSWER', () => {
      const records = [
        makeRecord({ answerClass: 'DIRECT_CITED_ANSWER' }),
        makeRecord({ answerClass: 'DIRECT_CITED_ANSWER', normalizedPath: 'test/doc2.pdf' }),
      ];
      expect(mostRestrictiveAnswerClass(records)).toBe('DIRECT_CITED_ANSWER');
    });
  });

  describe('runRetrievalPipeline', () => {
    it('returns phase 1 negative receipt for empty corpus', () => {
      const result = runRetrievalPipeline([], 'governance policy');
      expect(result.phase).toBe(1);
    });

    it('returns phase 2 receipt for matching corpus', () => {
      const corpus = [makeRecord()];
      const result = runRetrievalPipeline(corpus, 'governance');
      expect(result.phase).toBe(2);
      if (result.phase === 2) {
        expect(result.receipt.matched_paths).toContain('test/doc.pdf');
        expect(result.receipt.answer_class).toBe('DIRECT_CITED_ANSWER');
      }
    });

    it('sets freshness_flag=true when amended record is in result set', () => {
      const corpus = [makeRecord({ status: 'amended', contentSnippet: 'governance amended' })];
      const result = runRetrievalPipeline(corpus, 'governance');
      expect(result.phase).toBe(2);
      if (result.phase === 2) {
        expect(result.receipt.freshness_flag).toBe(true);
      }
    });

    it('sets conflict_flag=true when records have different effectiveDate', () => {
      const corpus = [
        makeRecord({ effectiveDate: '2025-01-01', contentSnippet: 'governance policy v1' }),
        makeRecord({
          effectiveDate: '2026-01-01',
          normalizedPath: 'test/doc2.pdf',
          contentSnippet: 'governance policy v2',
        }),
      ];
      const result = runRetrievalPipeline(corpus, 'governance');
      expect(result.phase).toBe(2);
      if (result.phase === 2) {
        expect(result.receipt.conflict_flag).toBe(true);
      }
    });

    it('returns NO_RESULTS when all records are superseded (excluded by status filter)', () => {
      // Superseded records are excluded at Stage 2 (status filter, default=effective|amended)
      // before applySupersededDowngrade can apply. Result is NO_RESULTS, not ESCALATED.
      const corpus = [makeRecord({ status: 'superseded', contentSnippet: 'old governance policy' })];
      const result = runRetrievalPipeline(corpus, 'governance');
      expect(result.phase).toBe(1);
      if (result.phase === 1) {
        expect(result.negative.receiptType).toBe('NO_RESULTS');
      }
    });

    it('returns ESCALATED when superseded records pass status filter via explicit status override', () => {
      // When client explicitly requests superseded status, downgrade applies → ESCALATED
      const corpus = [makeRecord({ status: 'superseded', contentSnippet: 'old governance policy' })];
      const result = runRetrievalPipeline(corpus, 'governance', { status: ['superseded'] });
      expect(result.phase).toBe(1);
      if (result.phase === 1) {
        expect(result.negative.receiptType).toBe('ESCALATED');
      }
    });

    it('does not invoke Phase 2 when Phase 1 returns negative', () => {
      const result = runRetrievalPipeline([], 'no match');
      expect(result.phase).toBe(1);
      // Phase 2 properties not present
      expect('receipt' in result).toBe(false);
    });
  });
});
