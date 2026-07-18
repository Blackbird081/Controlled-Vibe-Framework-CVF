import { describe, expect, it } from 'vitest';
import {
  DURABLE_EXECUTION_AUDIT_CONTRACT,
  type DurableExecutionAuditRecord,
} from './durable-execution-audit-store.js';
import {
  buildDurableAuditIntegrityReadout,
  type DurableAuditIntegrityReadout,
} from './durable-execution-audit-readout.js';
import {
  DURABLE_AUDIT_EVIDENCE_BUNDLE_CONTRACT,
  buildDurableAuditEvidenceBundle,
  renderDurableAuditEvidenceBundleMarkdown,
  type DurableAuditEvidenceBundleSourceRef,
} from './durable-audit-evidence-bundle.js';

const RECEIPT_ID = 'delta-preflight-5000-aaaa';
const CONSUMPTION_ID = 'delta-consumption-5001-aaaa';
const BINDING_HASH = 'd'.repeat(64);
const BUNDLED_AT = '2026-06-19T00:10:00.000Z';
const READOUT_AT = '2026-06-19T00:09:00.000Z';

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
    auditedAt: '2026-06-19T00:08:00.000Z',
    ...overrides,
  };
}

function validReadout(records: DurableExecutionAuditRecord[] = [validRecord()]): DurableAuditIntegrityReadout {
  return buildDurableAuditIntegrityReadout(records, { readoutAt: READOUT_AT });
}

function emptyReadout(): DurableAuditIntegrityReadout {
  return buildDurableAuditIntegrityReadout([], { readoutAt: READOUT_AT });
}

function findClaim(bundle: ReturnType<typeof buildDurableAuditEvidenceBundle>, claimName: string) {
  return bundle.claimMatrix.find((c) => c.claimName === claimName);
}

describe('durable-audit-evidence-bundle', () => {

  describe('AC1 - valid records + valid readout produce deterministic bundle', () => {
    it('produces correct contract version', () => {
      const bundle = buildDurableAuditEvidenceBundle(
        [validRecord()],
        validReadout(),
        { bundledAt: BUNDLED_AT },
      );
      expect(bundle.contractVersion).toBe(DURABLE_AUDIT_EVIDENCE_BUNDLE_CONTRACT);
    });

    it('has stable counts from readout', () => {
      const records = [validRecord()];
      const readout = validReadout(records);
      const bundle = buildDurableAuditEvidenceBundle(records, readout, { bundledAt: BUNDLED_AT });
      expect(bundle.recordCount).toBe(1);
      expect(bundle.validRecordCount).toBe(1);
      expect(bundle.invalidRecordCount).toBe(0);
      expect(bundle.parseErrorCount).toBe(0);
      expect(bundle.readoutAllValid).toBe(true);
    });

    it('claim matrix contains all 10 expected claim names in canonical order', () => {
      const bundle = buildDurableAuditEvidenceBundle(
        [validRecord()],
        validReadout(),
        { bundledAt: BUNDLED_AT },
      );
      const names = bundle.claimMatrix.map((c) => c.claimName);
      expect(names).toContain('receipt_evidence');
      expect(names).toContain('action_evidence');
      expect(names).toContain('durable_storage');
      expect(names).toContain('integrity_readout');
      expect(names).toContain('mandatory_invocation');
      expect(names).toContain('direct_interception');
      expect(names).toContain('provider_live');
      expect(names).toContain('public_sync');
      expect(names).toContain('readiness');
      expect(names).toContain('universal_control');
      expect(names.length).toBe(10);
    });

    it('bundledAt uses provided option', () => {
      const bundle = buildDurableAuditEvidenceBundle(
        [validRecord()],
        validReadout(),
        { bundledAt: BUNDLED_AT },
      );
      expect(bundle.bundledAt).toBe(BUNDLED_AT);
    });

    it('bundledAt defaults to the supplied readout timestamp for deterministic output', () => {
      const records = [validRecord()];
      const readout = validReadout(records);
      const b1 = buildDurableAuditEvidenceBundle(records, readout);
      const b2 = buildDurableAuditEvidenceBundle(records, readout);
      expect(b1.bundledAt).toBe(READOUT_AT);
      expect(b2.bundledAt).toBe(READOUT_AT);
      expect(b1).toEqual(b2);
    });

    it('sourceRefs are preserved when supplied', () => {
      const refs: DurableAuditEvidenceBundleSourceRef[] = [
        { label: 'audit-store-snapshot', kind: 'record_store', ref: 'de1a39c2' },
        { label: 'readout-2026-06-19', kind: 'readout' },
      ];
      const bundle = buildDurableAuditEvidenceBundle(
        [validRecord()],
        validReadout(),
        { sourceRefs: refs, bundledAt: BUNDLED_AT },
      );
      expect(bundle.sourceRefs).toHaveLength(2);
      expect(bundle.sourceRefs[0].label).toBe('audit-store-snapshot');
    });

    it('empty sourceRefs by default', () => {
      const bundle = buildDurableAuditEvidenceBundle(
        [validRecord()],
        validReadout(),
        { bundledAt: BUNDLED_AT },
      );
      expect(bundle.sourceRefs).toHaveLength(0);
    });

    it('same input produces identical claim matrix twice', () => {
      const records = [validRecord()];
      const readout = validReadout(records);
      const b1 = buildDurableAuditEvidenceBundle(records, readout, { bundledAt: BUNDLED_AT });
      const b2 = buildDurableAuditEvidenceBundle(records, readout, { bundledAt: BUNDLED_AT });
      expect(b1.claimMatrix.map((c) => c.claimName)).toEqual(b2.claimMatrix.map((c) => c.claimName));
      expect(b1.claimMatrix.map((c) => c.disposition)).toEqual(b2.claimMatrix.map((c) => c.disposition));
    });
  });

  describe('AC2 - empty input and invalid readout cannot be summarized as proof', () => {
    it('empty records: receipt_evidence is REJECTED', () => {
      const bundle = buildDurableAuditEvidenceBundle([], emptyReadout(), { bundledAt: BUNDLED_AT });
      expect(findClaim(bundle, 'receipt_evidence')?.disposition).toBe('REJECTED');
    });

    it('empty records: action_evidence is REJECTED', () => {
      const bundle = buildDurableAuditEvidenceBundle([], emptyReadout(), { bundledAt: BUNDLED_AT });
      expect(findClaim(bundle, 'action_evidence')?.disposition).toBe('REJECTED');
    });

    it('empty records: integrity_readout is REJECTED', () => {
      const bundle = buildDurableAuditEvidenceBundle([], emptyReadout(), { bundledAt: BUNDLED_AT });
      expect(findClaim(bundle, 'integrity_readout')?.disposition).toBe('REJECTED');
    });

    it('empty records: readoutAllValid=false', () => {
      const bundle = buildDurableAuditEvidenceBundle([], emptyReadout(), { bundledAt: BUNDLED_AT });
      expect(bundle.readoutAllValid).toBe(false);
    });

    it('all-invalid records: receipt_evidence is REJECTED', () => {
      const bad = validRecord({ receiptId: 'not-a-valid-receipt' });
      const readout = buildDurableAuditIntegrityReadout([bad], { readoutAt: READOUT_AT });
      const bundle = buildDurableAuditEvidenceBundle([bad], readout, { bundledAt: BUNDLED_AT });
      expect(findClaim(bundle, 'receipt_evidence')?.disposition).toBe('REJECTED');
    });

    it('all-invalid records: action_evidence is REJECTED', () => {
      const bad = validRecord({ receiptId: 'not-a-valid-receipt' });
      const readout = buildDurableAuditIntegrityReadout([bad], { readoutAt: READOUT_AT });
      const bundle = buildDurableAuditEvidenceBundle([bad], readout, { bundledAt: BUNDLED_AT });
      expect(findClaim(bundle, 'action_evidence')?.disposition).toBe('REJECTED');
    });

    it('all-invalid records: integrity_readout is REJECTED', () => {
      const bad = validRecord({ receiptId: 'not-a-valid-receipt' });
      const readout = buildDurableAuditIntegrityReadout([bad], { readoutAt: READOUT_AT });
      const bundle = buildDurableAuditEvidenceBundle([bad], readout, { bundledAt: BUNDLED_AT });
      expect(findClaim(bundle, 'integrity_readout')?.disposition).toBe('REJECTED');
    });

    it('mixed records: action_evidence is BOUNDED (not PROVED)', () => {
      const good = validRecord();
      const bad = validRecord({ receiptId: 'not-valid' });
      const readout = buildDurableAuditIntegrityReadout([good, bad], { readoutAt: READOUT_AT });
      const bundle = buildDurableAuditEvidenceBundle([good, bad], readout, { bundledAt: BUNDLED_AT });
      expect(findClaim(bundle, 'action_evidence')?.disposition).toBe('BOUNDED');
    });

    it('mixed records: integrity_readout is BOUNDED (not PROVED)', () => {
      const good = validRecord();
      const bad = validRecord({ receiptId: 'not-valid' });
      const readout = buildDurableAuditIntegrityReadout([good, bad], { readoutAt: READOUT_AT });
      const bundle = buildDurableAuditEvidenceBundle([good, bad], readout, { bundledAt: BUNDLED_AT });
      expect(findClaim(bundle, 'integrity_readout')?.disposition).toBe('BOUNDED');
    });

    it('readout with invalid contract version is rejected', () => {
      const forged = {
        ...validReadout(),
        contractVersion: 'cvf.delta.invalidReadout.v1',
      } as unknown as DurableAuditIntegrityReadout;
      expect(() => buildDurableAuditEvidenceBundle([validRecord()], forged)).toThrow(
        /requires a Delta-T10 integrity readout contract/,
      );
    });

    it('readout with mandatory invocation proof claim is rejected', () => {
      const forged = {
        ...validReadout(),
        mandatoryInvocationProved: true,
      } as unknown as DurableAuditIntegrityReadout;
      expect(() => buildDurableAuditEvidenceBundle([validRecord()], forged)).toThrow(
        /mandatory invocation proof claim/,
      );
    });

    it('readout with direct interception proof claim is rejected', () => {
      const forged = {
        ...validReadout(),
        directInterceptionProved: true,
      } as unknown as DurableAuditIntegrityReadout;
      expect(() => buildDurableAuditEvidenceBundle([validRecord()], forged)).toThrow(
        /direct interception proof claim/,
      );
    });
  });

  describe('AC3 - NOT_CLAIMED rows always present and bounded false fields on bundle', () => {
    it('mandatory_invocation is NOT_CLAIMED for valid input', () => {
      const bundle = buildDurableAuditEvidenceBundle(
        [validRecord()], validReadout(), { bundledAt: BUNDLED_AT },
      );
      expect(findClaim(bundle, 'mandatory_invocation')?.disposition).toBe('NOT_CLAIMED');
    });

    it('direct_interception is NOT_CLAIMED for valid input', () => {
      const bundle = buildDurableAuditEvidenceBundle(
        [validRecord()], validReadout(), { bundledAt: BUNDLED_AT },
      );
      expect(findClaim(bundle, 'direct_interception')?.disposition).toBe('NOT_CLAIMED');
    });

    it('provider_live is NOT_CLAIMED', () => {
      const bundle = buildDurableAuditEvidenceBundle(
        [validRecord()], validReadout(), { bundledAt: BUNDLED_AT },
      );
      expect(findClaim(bundle, 'provider_live')?.disposition).toBe('NOT_CLAIMED');
    });

    it('public_sync is NOT_CLAIMED', () => {
      const bundle = buildDurableAuditEvidenceBundle(
        [validRecord()], validReadout(), { bundledAt: BUNDLED_AT },
      );
      expect(findClaim(bundle, 'public_sync')?.disposition).toBe('NOT_CLAIMED');
    });

    it('readiness is NOT_CLAIMED', () => {
      const bundle = buildDurableAuditEvidenceBundle(
        [validRecord()], validReadout(), { bundledAt: BUNDLED_AT },
      );
      expect(findClaim(bundle, 'readiness')?.disposition).toBe('NOT_CLAIMED');
    });

    it('universal_control is NOT_CLAIMED', () => {
      const bundle = buildDurableAuditEvidenceBundle(
        [validRecord()], validReadout(), { bundledAt: BUNDLED_AT },
      );
      expect(findClaim(bundle, 'universal_control')?.disposition).toBe('NOT_CLAIMED');
    });

    it('bundle.mandatoryInvocationProved is always false', () => {
      const bundle = buildDurableAuditEvidenceBundle(
        [validRecord()], validReadout(), { bundledAt: BUNDLED_AT },
      );
      expect(bundle.mandatoryInvocationProved).toBe(false);
    });

    it('bundle.directInterceptionProved is always false', () => {
      const bundle = buildDurableAuditEvidenceBundle(
        [validRecord()], validReadout(), { bundledAt: BUNDLED_AT },
      );
      expect(bundle.directInterceptionProved).toBe(false);
    });

    it('NOT_CLAIMED rows remain unchanged for empty input', () => {
      const bundle = buildDurableAuditEvidenceBundle([], emptyReadout(), { bundledAt: BUNDLED_AT });
      const notClaimedNames = [
        'mandatory_invocation', 'direct_interception', 'provider_live',
        'public_sync', 'readiness', 'universal_control',
      ];
      for (const name of notClaimedNames) {
        expect(findClaim(bundle, name)?.disposition).toBe('NOT_CLAIMED');
      }
    });
  });

  describe('AC4 - secret-safe reviewer readout', () => {
    it('markdown output is deterministic across two calls with same bundle', () => {
      const bundle = buildDurableAuditEvidenceBundle(
        [validRecord()], validReadout(), { bundledAt: BUNDLED_AT },
      );
      const md1 = renderDurableAuditEvidenceBundleMarkdown(bundle);
      const md2 = renderDurableAuditEvidenceBundleMarkdown(bundle);
      expect(md1).toBe(md2);
    });

    it('markdown includes all 10 claim rows', () => {
      const bundle = buildDurableAuditEvidenceBundle(
        [validRecord()], validReadout(), { bundledAt: BUNDLED_AT },
      );
      const md = renderDurableAuditEvidenceBundleMarkdown(bundle);
      const claimNames = [
        'receipt_evidence', 'action_evidence', 'durable_storage', 'integrity_readout',
        'mandatory_invocation', 'direct_interception', 'provider_live',
        'public_sync', 'readiness', 'universal_control',
      ];
      for (const name of claimNames) {
        expect(md).toContain(name);
      }
    });

    it('secret-like source ref label is suppressed in markdown', () => {
      const secretLabel = 'MY_API_KEY=ultrasecretary999';
      const refs: DurableAuditEvidenceBundleSourceRef[] = [
        { label: secretLabel, kind: 'other' },
      ];
      const bundle = buildDurableAuditEvidenceBundle(
        [validRecord()], validReadout(), { sourceRefs: refs, bundledAt: BUNDLED_AT },
      );
      const md = renderDurableAuditEvidenceBundleMarkdown(bundle);
      expect(md).not.toContain(secretLabel);
      expect(md).toContain('[label suppressed: secret-like pattern detected]');
    });

    it('markdown includes bounded claim statement with false values', () => {
      const bundle = buildDurableAuditEvidenceBundle(
        [validRecord()], validReadout(), { bundledAt: BUNDLED_AT },
      );
      const md = renderDurableAuditEvidenceBundleMarkdown(bundle);
      expect(md).toContain('mandatoryInvocationProved`: false');
      expect(md).toContain('directInterceptionProved`: false');
    });

    it('markdown output for same input bundle is stable across multiple calls', () => {
      const bundle = buildDurableAuditEvidenceBundle(
        [validRecord()], validReadout(), { bundledAt: BUNDLED_AT },
      );
      const renders = Array.from({ length: 3 }, () => renderDurableAuditEvidenceBundleMarkdown(bundle));
      expect(renders[0]).toBe(renders[1]);
      expect(renders[1]).toBe(renders[2]);
    });
  });

  describe('AC5 - PROVED/BOUNDED/REJECTED/NOT_CLAIMED are correctly distinguished', () => {
    it('all-valid readout: receipt_evidence=PROVED, action_evidence=PROVED, integrity_readout=PROVED', () => {
      const records = [validRecord()];
      const readout = validReadout(records);
      const bundle = buildDurableAuditEvidenceBundle(records, readout, { bundledAt: BUNDLED_AT });
      expect(findClaim(bundle, 'receipt_evidence')?.disposition).toBe('PROVED');
      expect(findClaim(bundle, 'action_evidence')?.disposition).toBe('PROVED');
      expect(findClaim(bundle, 'integrity_readout')?.disposition).toBe('PROVED');
    });

    it('durable_storage is always BOUNDED regardless of validity', () => {
      const bundleValid = buildDurableAuditEvidenceBundle(
        [validRecord()], validReadout(), { bundledAt: BUNDLED_AT },
      );
      const bundleEmpty = buildDurableAuditEvidenceBundle([], emptyReadout(), { bundledAt: BUNDLED_AT });
      expect(findClaim(bundleValid, 'durable_storage')?.disposition).toBe('BOUNDED');
      expect(findClaim(bundleEmpty, 'durable_storage')?.disposition).toBe('BOUNDED');
    });

    it('partial valid: BOUNDED is not promoted to PROVED', () => {
      const good = validRecord();
      const bad = validRecord({ receiptId: 'not-valid' });
      const readout = buildDurableAuditIntegrityReadout([good, bad], { readoutAt: READOUT_AT });
      const bundle = buildDurableAuditEvidenceBundle([good, bad], readout, { bundledAt: BUNDLED_AT });
      const actionDisp = findClaim(bundle, 'action_evidence')?.disposition;
      const integDisp = findClaim(bundle, 'integrity_readout')?.disposition;
      expect(actionDisp).not.toBe('PROVED');
      expect(integDisp).not.toBe('PROVED');
      expect(actionDisp).toBe('BOUNDED');
      expect(integDisp).toBe('BOUNDED');
    });

    it('all-invalid records: REJECTED rows are not BOUNDED or PROVED', () => {
      const bad = validRecord({ receiptId: 'not-valid', consumptionId: 'not-valid' });
      const readout = buildDurableAuditIntegrityReadout([bad], { readoutAt: READOUT_AT });
      const bundle = buildDurableAuditEvidenceBundle([bad], readout, { bundledAt: BUNDLED_AT });
      expect(findClaim(bundle, 'receipt_evidence')?.disposition).toBe('REJECTED');
      expect(findClaim(bundle, 'action_evidence')?.disposition).toBe('REJECTED');
      expect(findClaim(bundle, 'integrity_readout')?.disposition).toBe('REJECTED');
    });

    it('NOT_CLAIMED rows are never PROVED, BOUNDED, or REJECTED', () => {
      const bundle = buildDurableAuditEvidenceBundle(
        [validRecord()], validReadout(), { bundledAt: BUNDLED_AT },
      );
      const notClaimedNames = [
        'mandatory_invocation', 'direct_interception', 'provider_live',
        'public_sync', 'readiness', 'universal_control',
      ];
      for (const name of notClaimedNames) {
        const disp = findClaim(bundle, name)?.disposition;
        expect(disp).toBe('NOT_CLAIMED');
        expect(disp).not.toBe('PROVED');
        expect(disp).not.toBe('BOUNDED');
        expect(disp).not.toBe('REJECTED');
      }
    });
  });
});
