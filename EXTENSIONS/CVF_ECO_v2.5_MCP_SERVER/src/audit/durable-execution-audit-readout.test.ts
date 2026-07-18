import { describe, expect, it } from 'vitest';
import {
  DURABLE_EXECUTION_AUDIT_CONTRACT,
  type DurableExecutionAuditRecord,
} from './durable-execution-audit-store.js';
import {
  DURABLE_AUDIT_INTEGRITY_READOUT_CONTRACT,
  buildDurableAuditIntegrityReadout,
  buildDurableAuditIntegrityReadoutFromJsonl,
  parseDurableAuditJsonlLines,
} from './durable-execution-audit-readout.js';

const RECEIPT_ID = 'delta-preflight-3000-abcd';
const CONSUMPTION_ID = 'delta-consumption-3001-abcd';
const BINDING_HASH = 'c'.repeat(64);
const READOUT_AT = '2026-06-19T00:05:00.000Z';

function validRecord(overrides: Partial<DurableExecutionAuditRecord> = {}): DurableExecutionAuditRecord {
  return {
    contractVersion: DURABLE_EXECUTION_AUDIT_CONTRACT,
    receiptId: RECEIPT_ID,
    requestId: RECEIPT_ID,
    consumptionId: CONSUMPTION_ID,
    profileId: 'git-status',
    bindingHash: BINDING_HASH,
    evidenceChainValid: true,
    actionExecutionProved: true,
    approvalBackedMutationProved: false,
    findings: [],
    retentionClass: 'LOCAL_GOVERNANCE_EVIDENCE',
    disposalAdvisory: 'RETAIN_UNTIL_MANUAL_REVIEW',
    privacyBoundary: 'NO_RAW_SECRETS_NO_ENV_NO_PROVIDER_KEYS_NO_FULL_COMMAND_OUTPUT',
    mandatoryInvocationProved: false,
    directInterceptionProved: false,
    auditedAt: '2026-06-19T00:04:00.000Z',
    ...overrides,
  };
}

function toJsonl(records: DurableExecutionAuditRecord[]): string {
  return records.map((r) => JSON.stringify(r)).join('\n') + '\n';
}

describe('durable-execution-audit-readout', () => {

  describe('AC1 - valid records produce deterministic readout with contract version and zero findings', () => {
    it('single valid record produces readout with correct contract version', () => {
      const readout = buildDurableAuditIntegrityReadout([validRecord()], { readoutAt: READOUT_AT });
      expect(readout.contractVersion).toBe(DURABLE_AUDIT_INTEGRITY_READOUT_CONTRACT);
    });

    it('single valid record produces total=1, valid=1, invalid=0, allValid=true', () => {
      const readout = buildDurableAuditIntegrityReadout([validRecord()], { readoutAt: READOUT_AT });
      expect(readout.total).toBe(1);
      expect(readout.valid).toBe(1);
      expect(readout.invalid).toBe(0);
      expect(readout.allValid).toBe(true);
      expect(readout.findings).toHaveLength(0);
    });

    it('multiple valid records produce correct counts', () => {
      const r1 = validRecord({ auditedAt: '2026-06-19T00:04:00.000Z' });
      const r2 = validRecord({
        receiptId: 'delta-preflight-3002-efgh',
        requestId: 'delta-preflight-3002-efgh',
        consumptionId: 'delta-consumption-3003-efgh',
        auditedAt: '2026-06-19T00:04:01.000Z',
      });
      const readout = buildDurableAuditIntegrityReadout([r1, r2], { readoutAt: READOUT_AT });
      expect(readout.total).toBe(2);
      expect(readout.valid).toBe(2);
      expect(readout.invalid).toBe(0);
      expect(readout.allValid).toBe(true);
    });

    it('empty record array produces total=0, allValid=false', () => {
      const readout = buildDurableAuditIntegrityReadout([], { readoutAt: READOUT_AT });
      expect(readout.total).toBe(0);
      expect(readout.allValid).toBe(false);
    });
  });

  describe('AC2 - malformed JSONL and invalid records produce findings and cannot be summarized as all valid', () => {
    it('record with wrong contract version produces INVALID_CONTRACT_VERSION finding', () => {
      const bad = validRecord({ contractVersion: 'wrong.contract' as typeof DURABLE_EXECUTION_AUDIT_CONTRACT });
      const readout = buildDurableAuditIntegrityReadout([bad], { readoutAt: READOUT_AT });
      expect(readout.allValid).toBe(false);
      expect(readout.invalid).toBe(1);
      expect(readout.findings.some((f) => f.code === 'INVALID_CONTRACT_VERSION')).toBe(true);
    });

    it('record with malformed receiptId produces MALFORMED_RECEIPT_ID finding', () => {
      const bad = validRecord({ receiptId: 'not-a-valid-receipt' });
      const readout = buildDurableAuditIntegrityReadout([bad], { readoutAt: READOUT_AT });
      expect(readout.allValid).toBe(false);
      expect(readout.findings.some((f) => f.code === 'MALFORMED_RECEIPT_ID')).toBe(true);
    });

    it('record with malformed consumptionId produces MALFORMED_CONSUMPTION_ID finding', () => {
      const bad = validRecord({ consumptionId: 'invalid-consumption' });
      const readout = buildDurableAuditIntegrityReadout([bad], { readoutAt: READOUT_AT });
      expect(readout.allValid).toBe(false);
      expect(readout.findings.some((f) => f.code === 'MALFORMED_CONSUMPTION_ID')).toBe(true);
    });

    it('record with invalid bindingHash produces INVALID_BINDING_HASH finding', () => {
      const bad = validRecord({ bindingHash: 'not-hex' });
      const readout = buildDurableAuditIntegrityReadout([bad], { readoutAt: READOUT_AT });
      expect(readout.allValid).toBe(false);
      expect(readout.findings.some((f) => f.code === 'INVALID_BINDING_HASH')).toBe(true);
    });

    it('malformed JSONL line produces JSONL_PARSE_ERROR finding and allValid=false', () => {
      const jsonl = toJsonl([validRecord()]) + 'not valid json\n';
      const readout = buildDurableAuditIntegrityReadoutFromJsonl(jsonl, { readoutAt: READOUT_AT });
      expect(readout.allValid).toBe(false);
      expect(readout.parseErrorCount).toBeGreaterThan(0);
      expect(readout.findings.some((f) => f.code === 'JSONL_PARSE_ERROR')).toBe(true);
    });

    it('mixed valid and invalid records: allValid=false when any record has findings', () => {
      const good = validRecord();
      const bad = validRecord({ receiptId: 'not-valid' });
      const readout = buildDurableAuditIntegrityReadout([good, bad], { readoutAt: READOUT_AT });
      expect(readout.total).toBe(2);
      expect(readout.valid).toBe(1);
      expect(readout.invalid).toBe(1);
      expect(readout.allValid).toBe(false);
    });

    it('parseDurableAuditJsonlLines returns records and parse findings for mixed input', () => {
      const goodLine = JSON.stringify(validRecord());
      const text = goodLine + '\n{bad json\n';
      const { records, parseFindings } = parseDurableAuditJsonlLines(text);
      expect(records).toHaveLength(1);
      expect(parseFindings).toHaveLength(1);
      expect(parseFindings[0].code).toBe('JSONL_PARSE_ERROR');
      expect(parseFindings[0].lineNumber).toBe(2);
    });

    it('JSONL null record is classified with findings instead of crashing', () => {
      const readout = buildDurableAuditIntegrityReadoutFromJsonl('null\n', { readoutAt: READOUT_AT });
      expect(readout.allValid).toBe(false);
      expect(readout.invalid).toBe(1);
      expect(readout.findings.some((f) => f.code === 'MALFORMED_RECEIPT_ID')).toBe(true);
    });
  });

  describe('AC3 - forged bounded false fields are classified as violations', () => {
    it('mandatoryInvocationProved=true produces FORBIDDEN_MANDATORY_INVOCATION_CLAIM finding', () => {
      const forged = validRecord({
        mandatoryInvocationProved: true as unknown as false,
      });
      const readout = buildDurableAuditIntegrityReadout([forged], { readoutAt: READOUT_AT });
      expect(readout.allValid).toBe(false);
      expect(readout.findings.some((f) => f.code === 'FORBIDDEN_MANDATORY_INVOCATION_CLAIM')).toBe(true);
    });

    it('directInterceptionProved=true produces FORBIDDEN_DIRECT_INTERCEPTION_CLAIM finding', () => {
      const forged = validRecord({
        directInterceptionProved: true as unknown as false,
      });
      const readout = buildDurableAuditIntegrityReadout([forged], { readoutAt: READOUT_AT });
      expect(readout.allValid).toBe(false);
      expect(readout.findings.some((f) => f.code === 'FORBIDDEN_DIRECT_INTERCEPTION_CLAIM')).toBe(true);
    });

    it('readout mandatoryInvocationProved field is always false on a valid readout', () => {
      const readout = buildDurableAuditIntegrityReadout([validRecord()], { readoutAt: READOUT_AT });
      expect(readout.mandatoryInvocationProved).toBe(false);
    });

    it('readout directInterceptionProved field is always false on a valid readout', () => {
      const readout = buildDurableAuditIntegrityReadout([validRecord()], { readoutAt: READOUT_AT });
      expect(readout.directInterceptionProved).toBe(false);
    });

    it('readout mandatoryInvocationProved is false even when classifying forged records', () => {
      const forged = validRecord({ mandatoryInvocationProved: true as unknown as false });
      const readout = buildDurableAuditIntegrityReadout([forged], { readoutAt: READOUT_AT });
      expect(readout.mandatoryInvocationProved).toBe(false);
    });

    it('INVALID_PROOF_CONSISTENCY found when evidenceChainValid=false but actionExecutionProved=true', () => {
      const bad = validRecord({ evidenceChainValid: false, actionExecutionProved: true });
      const readout = buildDurableAuditIntegrityReadout([bad], { readoutAt: READOUT_AT });
      expect(readout.allValid).toBe(false);
      expect(readout.findings.some((f) => f.code === 'INVALID_PROOF_CONSISTENCY')).toBe(true);
    });
  });

  describe('AC4 - secret-like values in supplied fields are classified without raw echo', () => {
    it('requestId with sk- prefix produces SECRET_LIKE_FIELD_DETECTED finding', () => {
      const bad = validRecord({ requestId: 'sk-abcdefg12345' });
      const readout = buildDurableAuditIntegrityReadout([bad], { readoutAt: READOUT_AT });
      expect(readout.allValid).toBe(false);
      expect(readout.findings.some((f) => f.code === 'SECRET_LIKE_FIELD_DETECTED')).toBe(true);
    });

    it('profileId with api_key pattern produces SECRET_LIKE_FIELD_DETECTED finding', () => {
      const bad = validRecord({ profileId: 'MY_API_KEY=secretvalue' });
      const readout = buildDurableAuditIntegrityReadout([bad], { readoutAt: READOUT_AT });
      expect(readout.allValid).toBe(false);
      expect(readout.findings.some((f) => f.code === 'SECRET_LIKE_FIELD_DETECTED')).toBe(true);
    });

    it('finding message does not echo the raw secret-like value', () => {
      const secretValue = 'sk-supersecretkey99999';
      const bad = validRecord({ requestId: secretValue });
      const readout = buildDurableAuditIntegrityReadout([bad], { readoutAt: READOUT_AT });
      const secretFinding = readout.findings.find((f) => f.code === 'SECRET_LIKE_FIELD_DETECTED');
      expect(secretFinding).toBeDefined();
      expect(secretFinding!.message).not.toContain(secretValue);
    });

    it('finding message does not echo api_key assignment value', () => {
      const secretValue = 'MY_API_KEY=ultrasecret999';
      const bad = validRecord({ profileId: secretValue });
      const readout = buildDurableAuditIntegrityReadout([bad], { readoutAt: READOUT_AT });
      const secretFinding = readout.findings.find((f) => f.code === 'SECRET_LIKE_FIELD_DETECTED');
      expect(secretFinding).toBeDefined();
      expect(secretFinding!.message).not.toContain(secretValue);
    });

    it('secret-like values are classified without raw echo in receipt identity', () => {
      const secretValue = 'sk-secret-receipt-value';
      const bad = validRecord({ receiptId: secretValue });
      const readout = buildDurableAuditIntegrityReadout([bad], { readoutAt: READOUT_AT });
      expect(readout.findings.some((f) => f.code === 'SECRET_LIKE_FIELD_DETECTED')).toBe(true);
      expect(readout.findings.every((f) => f.receiptId !== secretValue)).toBe(true);
      expect(readout.findings.every((f) => !f.message.includes(secretValue))).toBe(true);
    });
  });

  describe('AC5 - findings are deterministic across repeated calls', () => {
    it('same input records produce identical finding codes in same order', () => {
      const bad1 = validRecord({ receiptId: 'not-valid' });
      const bad2 = validRecord({
        receiptId: 'delta-preflight-4000-aaaa',
        mandatoryInvocationProved: true as unknown as false,
      });
      const records = [bad1, bad2];
      const r1 = buildDurableAuditIntegrityReadout(records, { readoutAt: READOUT_AT });
      const r2 = buildDurableAuditIntegrityReadout(records, { readoutAt: READOUT_AT });
      expect(r1.findings.map((f) => f.code)).toEqual(r2.findings.map((f) => f.code));
      expect(r1.findings.map((f) => f.receiptId)).toEqual(r2.findings.map((f) => f.receiptId));
    });

    it('finding counts are stable across repeated calls with same input', () => {
      const records = [
        validRecord({ receiptId: 'not-valid-1' }),
        validRecord({ consumptionId: 'not-valid-2' }),
      ];
      const r1 = buildDurableAuditIntegrityReadout(records, { readoutAt: READOUT_AT });
      const r2 = buildDurableAuditIntegrityReadout(records, { readoutAt: READOUT_AT });
      expect(r1.total).toBe(r2.total);
      expect(r1.valid).toBe(r2.valid);
      expect(r1.invalid).toBe(r2.invalid);
      expect(r1.findings).toHaveLength(r2.findings.length);
    });

    it('JSONL readout from same text is deterministic', () => {
      const good = validRecord();
      const bad = validRecord({ receiptId: 'not-valid' });
      const text = toJsonl([good, bad]);
      const r1 = buildDurableAuditIntegrityReadoutFromJsonl(text, { readoutAt: READOUT_AT });
      const r2 = buildDurableAuditIntegrityReadoutFromJsonl(text, { readoutAt: READOUT_AT });
      expect(r1.findings.map((f) => f.code)).toEqual(r2.findings.map((f) => f.code));
    });
  });

  describe('JSONL helpers', () => {
    it('parseDurableAuditJsonlLines handles empty text gracefully', () => {
      const { records, parseFindings } = parseDurableAuditJsonlLines('');
      expect(records).toHaveLength(0);
      expect(parseFindings).toHaveLength(0);
    });

    it('parseDurableAuditJsonlLines skips blank lines', () => {
      const text = '\n\n' + JSON.stringify(validRecord()) + '\n\n';
      const { records, parseFindings } = parseDurableAuditJsonlLines(text);
      expect(records).toHaveLength(1);
      expect(parseFindings).toHaveLength(0);
    });

    it('buildDurableAuditIntegrityReadoutFromJsonl allValid=false when parse errors exist with otherwise valid records', () => {
      const text = JSON.stringify(validRecord()) + '\n' + 'not json\n';
      const readout = buildDurableAuditIntegrityReadoutFromJsonl(text, { readoutAt: READOUT_AT });
      expect(readout.allValid).toBe(false);
      expect(readout.parseErrorCount).toBe(1);
      expect(readout.valid).toBe(1);
    });

    it('JSONL parse finding includes 1-based line number', () => {
      const text = 'good-but-not-json\n' + JSON.stringify(validRecord()) + '\nalso-bad\n';
      const { parseFindings } = parseDurableAuditJsonlLines(text);
      const linNumbers = parseFindings.map((f) => f.lineNumber);
      expect(linNumbers).toContain(1);
      expect(linNumbers).toContain(3);
    });
  });
});
