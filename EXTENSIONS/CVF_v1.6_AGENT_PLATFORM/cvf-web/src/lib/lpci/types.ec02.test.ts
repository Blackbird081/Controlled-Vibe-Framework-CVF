import { describe, it, expect } from 'vitest';
import type {
  DocumentStatus,
  LpciIndexRecord,
  ManifestEntry,
} from './types';

// EC-T3: DocumentStatus type alias and corpus record schema tests.
// Authorization: docs/baselines/CVF_GC018_LPCI2_EC_T3_CORPUS_RECORD_SCHEMA_UPDATE_2026-06-11.md

describe('EC-T3: DocumentStatus type alias', () => {
  it('accepts PROMULGATED as a valid DocumentStatus value', () => {
    const s: DocumentStatus = 'PROMULGATED';
    expect(s).toBe('PROMULGATED');
  });

  it('accepts IN_FORCE as a valid DocumentStatus value', () => {
    const s: DocumentStatus = 'IN_FORCE';
    expect(s).toBe('IN_FORCE');
  });

  it('accepts STATUS_UNKNOWN as a valid DocumentStatus value', () => {
    const s: DocumentStatus = 'STATUS_UNKNOWN';
    expect(s).toBe('STATUS_UNKNOWN');
  });
});

describe('EC-T3: LpciIndexRecord EC-02 fields', () => {
  it('accepts LpciIndexRecord with documentStatus PROMULGATED', () => {
    const record: LpciIndexRecord = {
      normalizedPath: 'test/doc.pdf',
      sourceHash: 'a'.repeat(64),
      documentType: 'law',
      status: 'draft',
      answerClass: 'SUMMARY_WITH_SOURCE',
      rawDisposition: 'ACCEPT',
      dispositionAlias: 'ACCEPT',
      documentStatus: 'PROMULGATED',
    };
    expect(record.documentStatus).toBe('PROMULGATED');
  });

  it('accepts LpciIndexRecord with documentStatus IN_FORCE and effectiveDate (migration rule EC-T3)', () => {
    // Invariant: documentStatus IN_FORCE requires operator-supplied effectiveDate.
    // This test documents the invariant. Runtime enforcement is EC-T5 scope.
    const record: LpciIndexRecord = {
      normalizedPath: 'test/doc.pdf',
      sourceHash: 'a'.repeat(64),
      documentType: 'law',
      status: 'effective',
      answerClass: 'SUMMARY_WITH_SOURCE',
      rawDisposition: 'ACCEPT',
      dispositionAlias: 'ACCEPT',
      documentStatus: 'IN_FORCE',
      effectiveDate: '2026-07-01',
    };
    expect(record.documentStatus).toBe('IN_FORCE');
    expect(record.effectiveDate).toBe('2026-07-01');
  });

  it('accepts LpciIndexRecord with promulgationDate set', () => {
    const record: LpciIndexRecord = {
      normalizedPath: 'test/doc.pdf',
      sourceHash: 'a'.repeat(64),
      documentType: 'law',
      status: 'draft',
      answerClass: 'SUMMARY_WITH_SOURCE',
      rawDisposition: 'ACCEPT',
      dispositionAlias: 'ACCEPT',
      documentStatus: 'PROMULGATED',
      promulgationDate: '2026-01-15',
    };
    expect(record.promulgationDate).toBe('2026-01-15');
  });

  it('accepts LpciIndexRecord without documentStatus (field is optional)', () => {
    const record: LpciIndexRecord = {
      normalizedPath: 'test/doc.pdf',
      sourceHash: 'a'.repeat(64),
      documentType: 'law',
      status: 'unknown',
      answerClass: 'ESCALATE_OR_ABSTAIN',
      rawDisposition: 'DEFER',
      dispositionAlias: 'ACCEPT_DEFERRED',
    };
    expect(record.documentStatus).toBeUndefined();
    expect(record.promulgationDate).toBeUndefined();
  });

  it('does not modify existing RecordStatus field -- status and documentStatus are independent fields', () => {
    const record: LpciIndexRecord = {
      normalizedPath: 'test/doc.pdf',
      sourceHash: 'a'.repeat(64),
      documentType: 'law',
      status: 'effective',
      answerClass: 'SUMMARY_WITH_SOURCE',
      rawDisposition: 'ACCEPT',
      dispositionAlias: 'ACCEPT',
      documentStatus: 'IN_FORCE',
    };
    expect(record.status).toBe('effective');
    expect(record.documentStatus).toBe('IN_FORCE');
  });
});

describe('EC-T3: ManifestEntry EC-02 fields', () => {
  it('accepts ManifestEntry with documentStatus and promulgationDate', () => {
    const entry: ManifestEntry = {
      relativePath: 'corpus/law-2025.pdf',
      documentType: 'law',
      documentStatus: 'PROMULGATED',
      promulgationDate: '2025-11-01',
      effectiveDate: '2026-07-01',
    };
    expect(entry.documentStatus).toBe('PROMULGATED');
    expect(entry.promulgationDate).toBe('2025-11-01');
  });

  it('accepts ManifestEntry without EC-02 fields (all optional)', () => {
    const entry: ManifestEntry = {
      relativePath: 'corpus/guidance.pdf',
      documentType: 'guidance',
    };
    expect(entry.documentStatus).toBeUndefined();
    expect(entry.promulgationDate).toBeUndefined();
  });
});
