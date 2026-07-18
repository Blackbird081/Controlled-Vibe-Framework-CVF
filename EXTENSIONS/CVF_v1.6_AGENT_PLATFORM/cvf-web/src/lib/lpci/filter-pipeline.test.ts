import { describe, it, expect } from 'vitest';
import { runFilterPipeline, applySupersededDowngrade } from './filter-pipeline';
import type { LpciIndexRecord } from './types';

const makeRecord = (overrides: Partial<LpciIndexRecord> = {}): LpciIndexRecord => ({
  normalizedPath: 'test/doc.pdf',
  sourceHash: 'abc123',
  documentType: 'policy',
  status: 'effective',
  answerClass: 'DIRECT_CITED_ANSWER',
  rawDisposition: 'ACCEPT',
  dispositionAlias: 'ACCEPT',
  titleSnippet: 'Test document',
  contentSnippet: 'This is a test document about governance policy',
  ...overrides,
});

describe('filter-pipeline', () => {
  describe('Stage 3 — fulltext search', () => {
    it('returns NO_RESULTS when query does not match', () => {
      const corpus = [makeRecord({ titleSnippet: 'leave policy', contentSnippet: 'leave policy rules' })];
      const result = runFilterPipeline(corpus, 'totally unrelated zebra query');
      expect(result.type).toBe('NEGATIVE');
      if (result.type === 'NEGATIVE') {
        expect(result.receipt.receiptType).toBe('NO_RESULTS');
      }
    });

    it('returns RANKED when query matches content snippet', () => {
      const corpus = [makeRecord({ contentSnippet: 'safety regulations for workplace' })];
      const result = runFilterPipeline(corpus, 'safety regulations');
      expect(result.type).toBe('RANKED');
    });
  });

  describe('Stage 4 — answerClass post-filter (non-overridable)', () => {
    it('returns ESCALATED when all records are ESCALATE_OR_ABSTAIN', () => {
      const corpus = [
        makeRecord({ answerClass: 'ESCALATE_OR_ABSTAIN', contentSnippet: 'governance test' }),
        makeRecord({ answerClass: 'ESCALATE_OR_ABSTAIN', contentSnippet: 'governance test 2', normalizedPath: 'test/doc2.pdf' }),
      ];
      const result = runFilterPipeline(corpus, 'governance');
      expect(result.type).toBe('NEGATIVE');
      if (result.type === 'NEGATIVE') {
        expect(result.receipt.receiptType).toBe('ESCALATED');
      }
    });

    it('includes ESCALATE records in ranking when direct candidates also exist', () => {
      const corpus = [
        makeRecord({ answerClass: 'DIRECT_CITED_ANSWER', contentSnippet: 'governance policy' }),
        makeRecord({ answerClass: 'ESCALATE_OR_ABSTAIN', contentSnippet: 'governance restricted', normalizedPath: 'test/restricted.pdf' }),
      ];
      const result = runFilterPipeline(corpus, 'governance');
      expect(result.type).toBe('RANKED');
    });
  });

  describe('Stage 1 — sensitivity pre-filter', () => {
    it('excludes classified records when no clearance', () => {
      const corpus = [
        makeRecord({ sensitivityLevel: 'classified', contentSnippet: 'classified governance' }),
        makeRecord({ sensitivityLevel: 'public', contentSnippet: 'public governance', normalizedPath: 'test/public.pdf' }),
      ];
      const result = runFilterPipeline(corpus, 'governance', { sensitivityClearance: false });
      expect(result.type).toBe('RANKED');
      if (result.type === 'RANKED') {
        expect(result.result.records.every((r) => r.sensitivityLevel !== 'classified')).toBe(true);
        expect(result.sensitivityApplied).toBe(true);
      }
    });

    it('returns FILTERED_OUT when all records are classified and no clearance', () => {
      const corpus = [makeRecord({ sensitivityLevel: 'classified', contentSnippet: 'governance' })];
      const result = runFilterPipeline(corpus, 'governance', { sensitivityClearance: false });
      expect(result.type).toBe('NEGATIVE');
      if (result.type === 'NEGATIVE') {
        expect(result.receipt.receiptType).toBe('FILTERED_OUT');
      }
    });
  });

  describe('Stage 2 — status filter', () => {
    it('excludes draft records by default', () => {
      const corpus = [
        makeRecord({ status: 'draft', contentSnippet: 'draft governance policy' }),
        makeRecord({ status: 'effective', contentSnippet: 'effective governance policy', normalizedPath: 'test/effective.pdf' }),
      ];
      const result = runFilterPipeline(corpus, 'governance');
      expect(result.type).toBe('RANKED');
      if (result.type === 'RANKED') {
        expect(result.result.records.some((r) => r.status === 'draft')).toBe(false);
      }
    });
  });

  describe('applySupersededDowngrade', () => {
    it('downgrades superseded records to ESCALATE_OR_ABSTAIN', () => {
      const records = [
        makeRecord({ status: 'superseded', answerClass: 'DIRECT_CITED_ANSWER' }),
        makeRecord({ status: 'effective', answerClass: 'DIRECT_CITED_ANSWER', normalizedPath: 'test/doc2.pdf' }),
      ];
      const result = applySupersededDowngrade(records);
      expect(result[0].answerClass).toBe('ESCALATE_OR_ABSTAIN');
      expect(result[1].answerClass).toBe('DIRECT_CITED_ANSWER');
    });
  });
});
