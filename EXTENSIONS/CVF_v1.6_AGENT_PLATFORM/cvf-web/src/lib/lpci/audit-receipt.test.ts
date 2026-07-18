import { describe, it, expect } from 'vitest';
import { buildAuditReceipt, sha256Hex } from './audit-receipt';

describe('audit-receipt', () => {
  describe('sha256Hex', () => {
    it('returns a 64-char hex string', () => {
      const hash = sha256Hex('test input');
      expect(hash).toHaveLength(64);
      expect(hash).toMatch(/^[0-9a-f]{64}$/);
    });

    it('is deterministic', () => {
      expect(sha256Hex('hello')).toBe(sha256Hex('hello'));
    });

    it('differs for different inputs', () => {
      expect(sha256Hex('a')).not.toBe(sha256Hex('b'));
    });
  });

  describe('buildAuditReceipt', () => {
    const baseOpts = {
      query: 'what is the leave policy?',
      query_timestamp: '2026-06-03T10:00:00.000Z',
      response_boundary_class: 'NEGATIVE_RECEIPT' as const,
      applied_filters: {},
      sensitivity_pre_filter_applied: false,
    };

    it('populates all required fields', () => {
      const receipt = buildAuditReceipt(baseOpts);
      expect(receipt.auditId).toBeTruthy();
      expect(receipt.query).toBe(baseOpts.query);
      expect(receipt.query_timestamp).toBe(baseOpts.query_timestamp);
      expect(receipt.model_response_hash).toHaveLength(64);
      expect(receipt.response_boundary_class).toBe('NEGATIVE_RECEIPT');
    });

    it('generates unique auditId per call', () => {
      const r1 = buildAuditReceipt(baseOpts);
      const r2 = buildAuditReceipt(baseOpts);
      expect(r1.auditId).not.toBe(r2.auditId);
    });

    it('model_response_hash is SHA-256 of responseText', () => {
      const responseText = 'Based on retrieved documents only. The leave policy states...';
      const receipt = buildAuditReceipt({ ...baseOpts, responseText, response_boundary_class: 'ANSWER_EMITTED' });
      expect(receipt.model_response_hash).toBe(sha256Hex(responseText));
    });

    it('model_response_hash is never null — falls back to receipt payload hash', () => {
      // no responseText provided
      const receipt = buildAuditReceipt({ ...baseOpts, phase1_receipt_type: 'NO_RESULTS' });
      expect(receipt.model_response_hash).toHaveLength(64);
      expect(receipt.model_response_hash).toBeTruthy();
    });

    it('includes stale_records when provided', () => {
      const receipt = buildAuditReceipt({
        ...baseOpts,
        stale_records: [{ normalizedPath: 'test/doc.pdf', status: 'amended', effectiveDate: '2025-01-01' }],
      });
      expect(receipt.stale_records).toHaveLength(1);
      expect(receipt.stale_records?.[0].normalizedPath).toBe('test/doc.pdf');
    });

    it('does not include stale_records when empty array', () => {
      const receipt = buildAuditReceipt({ ...baseOpts, stale_records: [] });
      expect(receipt.stale_records).toBeUndefined();
    });

    it('sets phase1_receipt_type when provided', () => {
      const receipt = buildAuditReceipt({ ...baseOpts, phase1_receipt_type: 'ESCALATED' });
      expect(receipt.phase1_receipt_type).toBe('ESCALATED');
    });

    it('does not set phase1_receipt_type when not provided', () => {
      const receipt = buildAuditReceipt(baseOpts);
      expect(receipt.phase1_receipt_type).toBeUndefined();
    });

    it('uses retrieval receipt data when provided', () => {
      const retrieval = {
        matched_paths: ['test/doc.pdf'],
        answer_class: 'DIRECT_CITED_ANSWER' as const,
        freshness_flag: false,
        conflict_flag: false,
        matched_records: [],
        query: 'test',
        query_timestamp: '2026-06-03T10:00:00.000Z',
      };
      const receipt = buildAuditReceipt({
        ...baseOpts,
        retrieval,
        response_boundary_class: 'ANSWER_EMITTED',
      });
      expect(receipt.matched_paths).toEqual(['test/doc.pdf']);
      expect(receipt.answer_class).toBe('DIRECT_CITED_ANSWER');
      expect(receipt.freshness_flag).toBe(false);
    });
  });
});
