import { afterEach, describe, expect, it } from 'vitest';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { rm, writeFile } from 'node:fs/promises';
import type { GuardAuditEntry } from '../guards/types.js';
import { RECEIPT_CONSUMER_CONTRACT } from '../tools/governance-action-receipt-consumer.js';
import { PREFLIGHT_CONTRACT } from '../tools/governance-action-preflight.js';
import type { ReceiptConsumptionMarker } from '../persistence/json-receipt-consumption.store.js';
import {
  GOVERNED_EXECUTION_RECEIPT_CONTRACT,
  type GovernedExecutionReceipt,
} from '../persistence/json-governed-execution.store.js';
import {
  auditReceiptToExecutionEvidence,
  type ReceiptToExecutionEvidenceInput,
} from './receipt-to-execution-evidence-auditor.js';
import {
  DURABLE_EXECUTION_AUDIT_CONTRACT,
  buildDurableAuditRecord,
  JsonDurableExecutionAuditStore,
  type DurableExecutionAuditInput,
} from './durable-execution-audit-store.js';

const RECEIPT_ID = 'delta-preflight-2000-abcd';
const CONSUMPTION_ID = 'delta-consumption-2001-abcd';
const BINDING_HASH = 'b'.repeat(64);

function makeAudit(): GuardAuditEntry {
  return {
    requestId: RECEIPT_ID,
    timestamp: '2026-06-19T00:01:00.000Z',
    context: {
      requestId: RECEIPT_ID,
      phase: 'BUILD',
      riskLevel: 'R0',
      role: 'AI_AGENT',
      action: 'RUN: governed profile',
      metadata: { actionClass: 'RUN', contract: PREFLIGHT_CONTRACT },
    },
    pipelineResult: {
      requestId: RECEIPT_ID,
      finalDecision: 'ALLOW',
      results: [],
      executedAt: '2026-06-19T00:01:00.000Z',
      durationMs: 1,
    },
  };
}

function makeConsumption(): ReceiptConsumptionMarker {
  return {
    contractVersion: RECEIPT_CONSUMER_CONTRACT,
    preflightContractVersion: PREFLIGHT_CONTRACT,
    receiptId: RECEIPT_ID,
    consumptionId: CONSUMPTION_ID,
    consumedAt: '2026-06-19T00:01:01.000Z',
    actionClass: 'RUN',
    bindingHash: BINDING_HASH,
    actionExecutionProved: false,
    externalInterceptionProved: false,
  };
}

function makeExecution(profileId = 'git-status'): GovernedExecutionReceipt {
  return {
    contractVersion: GOVERNED_EXECUTION_RECEIPT_CONTRACT,
    consumptionId: CONSUMPTION_ID,
    receiptId: RECEIPT_ID,
    profileId,
    bindingHash: BINDING_HASH,
    status: 'COMPLETED',
    admittedAt: '2026-06-19T00:01:02.000Z',
    startedAt: '2026-06-19T00:01:03.000Z',
    completedAt: '2026-06-19T00:01:04.000Z',
    exitCode: 0,
    signal: null,
    diagnosticCode: null,
    executionStarted: true,
    executionCompleted: true,
    externalInterceptionProved: false,
  };
}

function makeEvidenceInput(
  overrides: Partial<ReceiptToExecutionEvidenceInput> = {},
): ReceiptToExecutionEvidenceInput {
  return {
    preflightAudit: makeAudit(),
    consumption: makeConsumption(),
    execution: makeExecution(),
    expectedProfileId: 'git-status',
    observedChangedSet: [],
    approvalMarker: null,
    ...overrides,
  };
}

function makeDurableInput(
  overrides: Partial<DurableExecutionAuditInput> = {},
): DurableExecutionAuditInput {
  const audit = auditReceiptToExecutionEvidence(makeEvidenceInput());
  return {
    audit,
    receiptId: RECEIPT_ID,
    requestId: RECEIPT_ID,
    consumptionId: CONSUMPTION_ID,
    profileId: 'git-status',
    bindingHash: BINDING_HASH,
    disposalAdvisory: 'EPHEMERAL_TEST_ONLY',
    auditedAt: '2026-06-19T00:02:00.000Z',
    ...overrides,
  };
}

let _tempSeq = 0;
function tmpFile(): string {
  return join(tmpdir(), `delta-t9-test-${Date.now()}-${++_tempSeq}.jsonl`);
}

describe('durable-execution-audit-store', () => {
  const tempPaths: string[] = [];

  afterEach(async () => {
    await Promise.allSettled(tempPaths.splice(0).map((p) => rm(p, { force: true })));
  });

  describe('AC1 - buildDurableAuditRecord: contract version and identity chain', () => {
    it('builds record with correct contract version from valid Delta-T7 audit', () => {
      const record = buildDurableAuditRecord(makeDurableInput());
      expect(record.contractVersion).toBe(DURABLE_EXECUTION_AUDIT_CONTRACT);
    });

    it('preserves full identity chain in the record', () => {
      const record = buildDurableAuditRecord(makeDurableInput());
      expect(record.receiptId).toBe(RECEIPT_ID);
      expect(record.requestId).toBe(RECEIPT_ID);
      expect(record.consumptionId).toBe(CONSUMPTION_ID);
      expect(record.profileId).toBe('git-status');
      expect(record.bindingHash).toBe(BINDING_HASH);
    });

    it('carries evidenceChainValid and actionExecutionProved from the audit verdict', () => {
      const record = buildDurableAuditRecord(makeDurableInput());
      expect(record.evidenceChainValid).toBe(true);
      expect(record.actionExecutionProved).toBe(true);
    });

    it('carries retention class and privacy boundary fields', () => {
      const record = buildDurableAuditRecord(makeDurableInput());
      expect(record.retentionClass).toBe('LOCAL_GOVERNANCE_EVIDENCE');
      expect(record.privacyBoundary).toBe(
        'NO_RAW_SECRETS_NO_ENV_NO_PROVIDER_KEYS_NO_FULL_COMMAND_OUTPUT',
      );
    });

    it('uses supplied disposalAdvisory', () => {
      const record = buildDurableAuditRecord(makeDurableInput({ disposalAdvisory: 'EPHEMERAL_TEST_ONLY' }));
      expect(record.disposalAdvisory).toBe('EPHEMERAL_TEST_ONLY');
    });

    it('defaults disposalAdvisory to RETAIN_UNTIL_MANUAL_REVIEW when not specified', () => {
      const input = makeDurableInput();
      delete (input as Partial<DurableExecutionAuditInput>).disposalAdvisory;
      const record = buildDurableAuditRecord(input);
      expect(record.disposalAdvisory).toBe('RETAIN_UNTIL_MANUAL_REVIEW');
    });
  });

  describe('AC2 - JsonDurableExecutionAuditStore: append and read', () => {
    it('returns empty array from a non-existent file', async () => {
      const filePath = tmpFile();
      tempPaths.push(filePath);
      const store = new JsonDurableExecutionAuditStore(filePath);
      const records = await store.readRecords();
      expect(records).toHaveLength(0);
    });

    it('appended record can be read back deterministically', async () => {
      const filePath = tmpFile();
      tempPaths.push(filePath);
      const store = new JsonDurableExecutionAuditStore(filePath);
      const record = buildDurableAuditRecord(makeDurableInput());
      await store.appendRecord(record);
      const [read] = await store.readRecords();
      expect(read.contractVersion).toBe(DURABLE_EXECUTION_AUDIT_CONTRACT);
      expect(read.receiptId).toBe(RECEIPT_ID);
      expect(read.evidenceChainValid).toBe(true);
    });

    it('multiple appended records are read back in append order', async () => {
      const filePath = tmpFile();
      tempPaths.push(filePath);
      const store = new JsonDurableExecutionAuditStore(filePath);
      const r1 = buildDurableAuditRecord(makeDurableInput({ auditedAt: '2026-06-19T00:02:00.000Z' }));
      const r2 = buildDurableAuditRecord(makeDurableInput({ auditedAt: '2026-06-19T00:03:00.000Z' }));
      await store.appendRecord(r1);
      await store.appendRecord(r2);
      const records = await store.readRecords();
      expect(records).toHaveLength(2);
      expect(records[0].auditedAt).toBe('2026-06-19T00:02:00.000Z');
      expect(records[1].auditedAt).toBe('2026-06-19T00:03:00.000Z');
    });
  });

  describe('AC3 - secret-safe boundary: secret-like values are rejected', () => {
    it('rejects requestId with sk- prefix', () => {
      expect(() =>
        buildDurableAuditRecord(makeDurableInput({ requestId: 'sk-abcdefg12345' })),
      ).toThrow(/secret-like/i);
    });

    it('rejects profileId containing api_key assignment', () => {
      expect(() =>
        buildDurableAuditRecord(makeDurableInput({ profileId: 'MY_API_KEY=secretvalue' })),
      ).toThrow(/secret-like/i);
    });

    it('rejects requestId with environment variable assignment pattern', () => {
      expect(() =>
        buildDurableAuditRecord(makeDurableInput({ requestId: 'TOKEN=abcdef' })),
      ).toThrow(/secret-like/i);
    });

    it('rejects profileId with Bearer token pattern', () => {
      expect(() =>
        buildDurableAuditRecord(makeDurableInput({ profileId: 'Bearer secrettoken123' })),
      ).toThrow(/secret-like/i);
    });

    it('accepts normal profileId and requestId values without false-positive rejection', () => {
      expect(() =>
        buildDurableAuditRecord(
          makeDurableInput({ requestId: RECEIPT_ID, profileId: 'git-status' }),
        ),
      ).not.toThrow();
    });
  });

  describe('AC4 - invalid evidence cannot be persisted as a passing governed-action claim', () => {
    it('failed audit evidence produces record with evidenceChainValid=false and actionExecutionProved=false', () => {
      const evidenceInput = makeEvidenceInput();
      evidenceInput.consumption.receiptId = 'delta-preflight-9999-zzzz';
      const failedAudit = auditReceiptToExecutionEvidence(evidenceInput);
      expect(failedAudit.evidenceChainValid).toBe(false);
      const record = buildDurableAuditRecord(makeDurableInput({ audit: failedAudit }));
      expect(record.evidenceChainValid).toBe(false);
      expect(record.actionExecutionProved).toBe(false);
      expect(record.findings.length).toBeGreaterThan(0);
    });

    it('record findings are preserved from the audit verdict, not silently cleared', () => {
      const evidenceInput = makeEvidenceInput();
      evidenceInput.execution.bindingHash = 'c'.repeat(64);
      const failedAudit = auditReceiptToExecutionEvidence(evidenceInput);
      const record = buildDurableAuditRecord(makeDurableInput({ audit: failedAudit }));
      expect(record.findings).toContain('BINDING_HASH_MISMATCH');
    });

    it('store rejects a record with a mismatched contract version', async () => {
      const filePath = tmpFile();
      tempPaths.push(filePath);
      const store = new JsonDurableExecutionAuditStore(filePath);
      const record = buildDurableAuditRecord(makeDurableInput());
      const tampered = { ...record, contractVersion: 'tampered.contract' };
      await expect(
        store.appendRecord(tampered as unknown as typeof record),
      ).rejects.toThrow(/contract version/i);
    });

    it('store rejects a forged passing action claim when evidence chain is invalid', async () => {
      const filePath = tmpFile();
      tempPaths.push(filePath);
      const store = new JsonDurableExecutionAuditStore(filePath);
      const record = buildDurableAuditRecord(makeDurableInput());
      const tampered = {
        ...record,
        evidenceChainValid: false,
        actionExecutionProved: true,
      };
      await expect(store.appendRecord(tampered)).rejects.toThrow(/evidence chain/i);
    });
  });

  describe('AC5 - mandatory invocation and direct interception are bounded false', () => {
    it('mandatoryInvocationProved is always false on a passing chain', () => {
      const record = buildDurableAuditRecord(makeDurableInput());
      expect(record.mandatoryInvocationProved).toBe(false);
    });

    it('directInterceptionProved is always false on a passing chain', () => {
      const record = buildDurableAuditRecord(makeDurableInput());
      expect(record.directInterceptionProved).toBe(false);
    });

    it('mandatoryInvocationProved remains false even for a failing audit', () => {
      const evidenceInput = makeEvidenceInput();
      evidenceInput.consumption.receiptId = 'delta-preflight-9999-zzzz';
      const failedAudit = auditReceiptToExecutionEvidence(evidenceInput);
      const record = buildDurableAuditRecord(makeDurableInput({ audit: failedAudit }));
      expect(record.mandatoryInvocationProved).toBe(false);
    });

    it('directInterceptionProved remains false even for a failing audit', () => {
      const evidenceInput = makeEvidenceInput();
      evidenceInput.consumption.receiptId = 'delta-preflight-9999-zzzz';
      const failedAudit = auditReceiptToExecutionEvidence(evidenceInput);
      const record = buildDurableAuditRecord(makeDurableInput({ audit: failedAudit }));
      expect(record.directInterceptionProved).toBe(false);
    });

    it('store rejects a forged mandatoryInvocationProved=true record', async () => {
      const filePath = tmpFile();
      tempPaths.push(filePath);
      const store = new JsonDurableExecutionAuditStore(filePath);
      const record = buildDurableAuditRecord(makeDurableInput());
      const tampered = { ...record, mandatoryInvocationProved: true };
      await expect(
        store.appendRecord(tampered as unknown as typeof record),
      ).rejects.toThrow(/mandatory invocation/i);
    });

    it('store rejects a forged directInterceptionProved=true record', async () => {
      const filePath = tmpFile();
      tempPaths.push(filePath);
      const store = new JsonDurableExecutionAuditStore(filePath);
      const record = buildDurableAuditRecord(makeDurableInput());
      const tampered = { ...record, directInterceptionProved: true };
      await expect(
        store.appendRecord(tampered as unknown as typeof record),
      ).rejects.toThrow(/direct interception/i);
    });

    it('readRecords rejects corrupted stored records with direct interception claims', async () => {
      const filePath = tmpFile();
      tempPaths.push(filePath);
      const store = new JsonDurableExecutionAuditStore(filePath);
      const record = buildDurableAuditRecord(makeDurableInput());
      await writeFile(
        filePath,
        JSON.stringify({ ...record, directInterceptionProved: true }) + '\n',
        'utf-8',
      );
      await expect(store.readRecords()).rejects.toThrow(/direct interception/i);
    });
  });

  describe('validation guards', () => {
    it('store constructor rejects file path containing traversal sequence', () => {
      expect(() => new JsonDurableExecutionAuditStore('../unsafe/audit.jsonl')).toThrow(
        /traversal/i,
      );
    });

    it('buildDurableAuditRecord rejects wrong audit contract version', () => {
      const audit = auditReceiptToExecutionEvidence(makeEvidenceInput());
      const wrongContract = {
        ...audit,
        contractVersion: 'wrong.contract' as typeof audit.contractVersion,
      };
      expect(() =>
        buildDurableAuditRecord(makeDurableInput({ audit: wrongContract })),
      ).toThrow(/contract version/i);
    });

    it('buildDurableAuditRecord rejects receiptId not matching the Delta receipt pattern', () => {
      expect(() =>
        buildDurableAuditRecord(makeDurableInput({ receiptId: 'invalid-receipt-id' })),
      ).toThrow(/receiptId/i);
    });

    it('buildDurableAuditRecord rejects consumptionId not matching the Delta consumption pattern', () => {
      expect(() =>
        buildDurableAuditRecord(makeDurableInput({ consumptionId: 'invalid-consumption' })),
      ).toThrow(/consumptionId/i);
    });

    it('buildDurableAuditRecord rejects bindingHash that is not 64-char hex', () => {
      expect(() =>
        buildDurableAuditRecord(makeDurableInput({ bindingHash: 'not-a-hex-hash' })),
      ).toThrow(/bindingHash/i);
    });
  });
});
