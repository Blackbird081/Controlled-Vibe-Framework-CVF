import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  consumeGovernanceActionReceipt,
  DEFAULT_RECEIPT_TTL_MS,
  RECEIPT_CONSUMER_CONTRACT,
  RECEIPT_CONSUMER_TOOL,
  resolveReceiptTtlMs,
  type ReceiptConsumptionInput,
} from './governance-action-receipt-consumer';
import {
  JsonReceiptConsumptionStore,
  RECEIPT_CONSUMPTION_DIR,
  type ReceiptConsumptionStore,
} from '../persistence/json-receipt-consumption.store.js';
import { JsonFileAdapter } from '../persistence/json-file.adapter.js';
import { PREFLIGHT_CONTRACT } from './governance-action-preflight.js';
import type { GuardAuditEntry, GuardDecision } from '../guards/types.js';

const NOW = Date.parse('2026-06-19T12:00:00.000Z');
const RECEIPT_ID = 'delta-preflight-1750334400000-abcd1234';
const ACTION = 'update the receipt consumer module';
const TARGETS = ['src/tools/consumer.ts', 'src/tools/consumer.test.ts'];

const INPUT: ReceiptConsumptionInput = {
  receiptId: RECEIPT_ID,
  actionClass: 'EDIT',
  action: ACTION,
  targetFiles: [...TARGETS].reverse(),
};

function makeAudit(options: {
  receiptId?: string;
  decision?: GuardDecision;
  issuedAt?: string;
  action?: string;
  actionClass?: string;
  targets?: string[];
  contract?: string;
} = {}): GuardAuditEntry {
  const receiptId = options.receiptId ?? RECEIPT_ID;
  const issuedAt = options.issuedAt ?? new Date(NOW - 1_000).toISOString();
  const actionClass = options.actionClass ?? 'EDIT';
  return {
    requestId: receiptId,
    timestamp: issuedAt,
    context: {
      requestId: receiptId,
      phase: 'BUILD',
      riskLevel: 'R1',
      role: 'AI_AGENT',
      action: options.action ?? `${actionClass}: ${ACTION}`,
      targetFiles: options.targets ?? TARGETS,
      metadata: {
        actionClass,
        contract: options.contract ?? PREFLIGHT_CONTRACT,
      },
    },
    pipelineResult: {
      requestId: receiptId,
      finalDecision: options.decision ?? 'ALLOW',
      results: [],
      executedAt: issuedAt,
      durationMs: 1,
    },
  };
}

describe('cvf_consume_governance_action_receipt', () => {
  let dataDir: string;
  let adapter: JsonFileAdapter;
  let store: JsonReceiptConsumptionStore;

  beforeEach(async () => {
    dataDir = await mkdtemp(join(tmpdir(), 'cvf-delta-consumer-'));
    adapter = new JsonFileAdapter({ dataDir });
    await adapter.init();
    store = new JsonReceiptConsumptionStore({ dataDir, auditReader: adapter });
  });

  afterEach(async () => {
    await rm(dataDir, { recursive: true, force: true });
  });

  const options = {
    now: () => NOW,
    generateConsumptionId: () => 'delta-consumption-test',
  };

  it('atomically consumes one matching fresh ALLOW receipt', async () => {
    await adapter.saveAuditEntry(makeAudit());

    const result = await consumeGovernanceActionReceipt(INPUT, store, options);

    expect(result).toMatchObject({
      contractVersion: RECEIPT_CONSUMER_CONTRACT,
      tool: RECEIPT_CONSUMER_TOOL,
      accepted: true,
      receiptValid: true,
      receiptConsumed: true,
      executionAdmissionEligible: true,
      actionExecutionProved: false,
      externalInterceptionProved: false,
    });
    expect(result.bindingHash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('writes a secret-safe marker without raw action or target paths', async () => {
    await adapter.saveAuditEntry(makeAudit());
    await consumeGovernanceActionReceipt(INPUT, store, options);

    const marker = await readFile(
      join(dataDir, RECEIPT_CONSUMPTION_DIR, `${RECEIPT_ID}.json`),
      'utf-8'
    );
    expect(marker).toContain('delta-consumption-test');
    expect(marker).not.toContain(ACTION);
    for (const target of TARGETS) expect(marker).not.toContain(target);
  });

  it('rejects replay after one successful consumption', async () => {
    await adapter.saveAuditEntry(makeAudit());
    const first = await consumeGovernanceActionReceipt(INPUT, store, options);
    const second = await consumeGovernanceActionReceipt(INPUT, store, options);

    expect(first.accepted).toBe(true);
    expect(second.error?.code).toBe('RECEIPT_ALREADY_CONSUMED');
    expect(second.executionAdmissionEligible).toBe(false);
  });

  it('permits at most one success across concurrent store instances', async () => {
    await adapter.saveAuditEntry(makeAudit());
    const otherStore = new JsonReceiptConsumptionStore({ dataDir, auditReader: adapter });

    const results = await Promise.all([
      consumeGovernanceActionReceipt(INPUT, store, options),
      consumeGovernanceActionReceipt(INPUT, otherStore, {
        ...options,
        generateConsumptionId: () => 'delta-consumption-other',
      }),
    ]);

    expect(results.filter((result) => result.accepted)).toHaveLength(1);
    expect(results.filter((result) => result.error?.code === 'RECEIPT_ALREADY_CONSUMED')).toHaveLength(1);
  });

  it('rejects action and target binding mismatches without claiming a marker', async () => {
    await adapter.saveAuditEntry(makeAudit());

    const badAction = await consumeGovernanceActionReceipt(
      { ...INPUT, action: 'update another module' },
      store,
      options
    );
    const badTargets = await consumeGovernanceActionReceipt(
      { ...INPUT, targetFiles: ['src/other.ts'] },
      store,
      options
    );

    expect(badAction.error?.code).toBe('RECEIPT_BINDING_MISMATCH');
    expect(badTargets.error?.code).toBe('RECEIPT_BINDING_MISMATCH');
  });

  it('rejects stale and future receipts with a server-controlled TTL', async () => {
    await adapter.saveAuditEntry(
      makeAudit({ receiptId: RECEIPT_ID, issuedAt: new Date(NOW - DEFAULT_RECEIPT_TTL_MS - 1).toISOString() })
    );
    const stale = await consumeGovernanceActionReceipt(INPUT, store, options);
    expect(stale.error?.code).toBe('RECEIPT_EXPIRED');

    const futureId = 'delta-preflight-1750334400001-efgh5678';
    await adapter.saveAuditEntry(
      makeAudit({ receiptId: futureId, issuedAt: new Date(NOW + 30_001).toISOString() })
    );
    const future = await consumeGovernanceActionReceipt(
      { ...INPUT, receiptId: futureId },
      store,
      options
    );
    expect(future.error?.code).toBe('RECEIPT_FROM_FUTURE');
  });

  it('rejects BLOCK, wrong contract, missing, and ambiguous audit authority', async () => {
    await adapter.saveAuditEntry(makeAudit({ decision: 'BLOCK' }));
    const blocked = await consumeGovernanceActionReceipt(INPUT, store, options);
    expect(blocked.error?.code).toBe('RECEIPT_DECISION_NOT_ALLOW');

    const wrongContractId = 'delta-preflight-1750334400002-ijkl9012';
    await adapter.saveAuditEntry(makeAudit({ receiptId: wrongContractId, contract: 'wrong.contract' }));
    const wrongContract = await consumeGovernanceActionReceipt(
      { ...INPUT, receiptId: wrongContractId },
      store,
      options
    );
    expect(wrongContract.error?.code).toBe('RECEIPT_AUTHORITY_INVALID');

    const missing = await consumeGovernanceActionReceipt(
      { ...INPUT, receiptId: 'delta-preflight-1750334400003-mnop3456' },
      store,
      options
    );
    expect(missing.error?.code).toBe('RECEIPT_NOT_FOUND');

    const ambiguousId = 'delta-preflight-1750334400004-qrst7890';
    await adapter.saveAuditEntry(makeAudit({ receiptId: ambiguousId }));
    await adapter.saveAuditEntry(makeAudit({ receiptId: ambiguousId }));
    const ambiguous = await consumeGovernanceActionReceipt(
      { ...INPUT, receiptId: ambiguousId },
      store,
      options
    );
    expect(ambiguous.error?.code).toBe('RECEIPT_AMBIGUOUS');
  });

  it('fails closed on lookup and marker persistence errors', async () => {
    const lookupFailure: ReceiptConsumptionStore = {
      getPreflightAuditEntries: async () => Promise.reject(new Error('read failed')),
      claimReceipt: async () => true,
    };
    const lookup = await consumeGovernanceActionReceipt(INPUT, lookupFailure, options);
    expect(lookup.error?.code).toBe('RECEIPT_LOOKUP_FAILED');

    const claimFailure: ReceiptConsumptionStore = {
      getPreflightAuditEntries: async () => [makeAudit()],
      claimReceipt: async () => Promise.reject(new Error('write failed')),
    };
    const claim = await consumeGovernanceActionReceipt(INPUT, claimFailure, options);
    expect(claim.error?.code).toBe('CONSUMPTION_PERSISTENCE_FAILED');
    expect(claim.receiptValid).toBe(true);
    expect(claim.executionAdmissionEligible).toBe(false);
  });

  it('rejects path-like ids and credential-bearing action or target values', async () => {
    const badId = await consumeGovernanceActionReceipt(
      { ...INPUT, receiptId: '../audit-log' },
      store,
      options
    );
    expect(badId.error?.code).toBe('INVALID_RECEIPT_ID');

    const secretAction = await consumeGovernanceActionReceipt(
      { ...INPUT, action: 'run with API_KEY=sk-abcdef0123456789' },
      store,
      options
    );
    expect(secretAction.error?.code).toBe('RAW_CREDENTIAL_INPUT_REJECTED');

    const secretTarget = await consumeGovernanceActionReceipt(
      { ...INPUT, targetFiles: ['token=sk-abcdef0123456789'] },
      store,
      options
    );
    expect(secretTarget.error?.code).toBe('RAW_CREDENTIAL_INPUT_REJECTED');
  });

  it('bounds TTL configuration and falls back for invalid values', () => {
    expect(resolveReceiptTtlMs('60')).toBe(60_000);
    expect(resolveReceiptTtlMs('1')).toBe(DEFAULT_RECEIPT_TTL_MS);
    expect(resolveReceiptTtlMs('3601')).toBe(DEFAULT_RECEIPT_TTL_MS);
    expect(resolveReceiptTtlMs('not-a-number')).toBe(DEFAULT_RECEIPT_TTL_MS);
  });

  it('accepts the variable-length suffix emitted by the Delta-T1 id generator', async () => {
    const shortId = 'delta-preflight-1750334400005-a';
    await adapter.saveAuditEntry(makeAudit({ receiptId: shortId }));

    const result = await consumeGovernanceActionReceipt(
      { ...INPUT, receiptId: shortId },
      store,
      options
    );

    expect(result.accepted).toBe(true);
  });
});
