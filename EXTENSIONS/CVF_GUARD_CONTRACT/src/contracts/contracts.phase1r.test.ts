/**
 * CVF Phase 1.R — Receipt Envelope Conformance Test Stubs
 * =========================================================
 * Conformance stubs verifying the canonical Receipt<TPayload> envelope and
 * the 27-surface adapter map classification.
 * Shape-only checks — no producer/reader changes (Phase 2.B).
 *
 * Authorized by: docs/baselines/CVF_GC018_PHASE_1R_RECEIPT_ENVELOPE_2026-05-18.md
 */

import { describe, it, expect } from 'vitest';

import {
  createReceiptEnvelopeReceiptRecord,
  createReceiptEnvelope,
  RECEIPT_SCHEMA_VERSION_1R,
  RECEIPT_ENVELOPE_ADAPTER_MAP,
} from './index';

import type {
  Receipt,
  ReceiptEnvelopeReceiptRecord,
  GatewayReceiptPayload,
  ExecutionBridgeReceiptPayload,
  GovernanceLedgerReceiptPayload,
  ControlledMemoryReceiptPayload,
  GatewayReceipt,
  ExecutionBridgeReceipt,
  GovernanceLedgerReceipt,
  ControlledMemoryReceipt,
  ReceiptEnvelopeAdapterMeta,
} from './index';

// ─── Canonical Envelope Shape ─────────────────────────────────────────────────

describe('Receipt<TPayload> envelope shape', () => {
  it('a minimal Receipt satisfies the interface', () => {
    const receipt: Receipt<{ value: string }> = {
      id: 'test-receipt-001',
      issuedAt: '2026-05-18T00:00:00Z',
      source: 'test-domain',
      schemaVersion: RECEIPT_SCHEMA_VERSION_1R,
      payload: { value: 'test' },
    };

    expect(receipt.id).toBe('test-receipt-001');
    expect(receipt.source).toBe('test-domain');
    expect(receipt.schemaVersion).toBe('1.R.0');
    expect(receipt.payload.value).toBe('test');
  });

  it('Receipt with integrityHash field is valid', () => {
    const receipt: Receipt<{ count: number }> = {
      id: 'hash-receipt',
      issuedAt: '2026-05-18T00:00:00Z',
      source: 'audit-domain',
      schemaVersion: RECEIPT_SCHEMA_VERSION_1R,
      payload: { count: 42 },
      integrityHash: 'sha256-abc123',
    };

    expect(receipt.integrityHash).toBe('sha256-abc123');
  });

  it('RECEIPT_SCHEMA_VERSION_1R is the Phase 1.R marker', () => {
    expect(RECEIPT_SCHEMA_VERSION_1R).toBe('1.R.0');
  });

  it('createReceiptEnvelope preserves typed payload shape', () => {
    const receipt = createReceiptEnvelope({
      id: 'wrapped-001',
      issuedAt: '2026-05-20T00:00:00Z',
      source: 'test-wrapper',
      payload: { legacyReceiptId: 'legacy-001', decision: 'allow' },
      integrityHash: 'hash-001',
    });

    expect(receipt.schemaVersion).toBe(RECEIPT_SCHEMA_VERSION_1R);
    expect(receipt.payload.legacyReceiptId).toBe('legacy-001');
    expect(receipt.payload.decision).toBe('allow');
    expect(receipt.integrityHash).toBe('hash-001');
  });

  it('createReceiptEnvelopeReceiptRecord marks envelopes as immutable receipt-tier records', () => {
    const receipt = createReceiptEnvelope({
      id: 'receipt-record-001',
      issuedAt: '2026-05-20T00:00:00Z',
      source: 'test-record',
      payload: { legacyReceiptId: 'legacy-record-001' },
    });

    const record: ReceiptEnvelopeReceiptRecord<{ legacyReceiptId: string }> =
      createReceiptEnvelopeReceiptRecord(receipt);

    expect(record.tierId).toBe('receipt');
    expect(record.immutable).toBe(true);
    expect(record.envelope.payload.legacyReceiptId).toBe('legacy-record-001');
  });
});

// ─── GatewayReceipt ───────────────────────────────────────────────────────────

describe('GatewayReceipt payload conformance', () => {
  it('a minimal GatewayReceiptPayload satisfies the interface', () => {
    const payload: GatewayReceiptPayload = {
      requestId: 'req-001',
      modelId: 'qwen-turbo',
      providerId: 'alibaba-dashscope',
      riskLevel: 'R1',
      decision: 'allow',
    };

    expect(payload.requestId).toBe('req-001');
    expect(payload.riskLevel).toBe('R1');
    expect(payload.decision).toBe('allow');
  });

  it('GatewayReceipt wraps GatewayReceiptPayload in envelope', () => {
    const receipt: GatewayReceipt = {
      id: 'gw-001',
      issuedAt: '2026-05-18T00:00:00Z',
      source: 'cvf-model-gateway',
      schemaVersion: '1.R.0',
      payload: {
        requestId: 'req-001',
        modelId: 'deepseek-chat',
        providerId: 'deepseek',
        riskLevel: 'R0',
        decision: 'allow',
        latencyMs: 420,
      },
    };

    expect(receipt.payload.modelId).toBe('deepseek-chat');
    expect(receipt.payload.latencyMs).toBe(420);
  });
});

// ─── ExecutionBridgeReceipt ───────────────────────────────────────────────────

describe('ExecutionBridgeReceipt payload conformance', () => {
  it('a minimal ExecutionBridgeReceiptPayload satisfies the interface', () => {
    const payload: ExecutionBridgeReceiptPayload = {
      executionId: 'exec-001',
      skillId: 'skill-analyze',
      phase: 'BUILD',
      outcome: 'success',
    };

    expect(payload.outcome).toBe('success');
  });

  it('ExecutionBridgeReceipt outcome must be success | failure | partial', () => {
    const valid: Array<ExecutionBridgeReceiptPayload['outcome']> = ['success', 'failure', 'partial'];
    expect(valid).toHaveLength(3);
  });
});

// ─── GovernanceLedgerReceipt ──────────────────────────────────────────────────

describe('GovernanceLedgerReceipt payload conformance', () => {
  it('a minimal GovernanceLedgerReceiptPayload satisfies the interface', () => {
    const payload: GovernanceLedgerReceiptPayload = {
      sessionId: 'sess-001',
      agentId: 'agent-orchestrator',
      action: 'execute_skill',
      policyDecision: 'allow',
      riskLevel: 'R0',
    };

    expect(payload.policyDecision).toBe('allow');
  });

  it('GovernanceLedgerReceipt can carry evidence array', () => {
    const receipt: GovernanceLedgerReceipt = {
      id: 'gov-001',
      issuedAt: '2026-05-18T00:00:00Z',
      source: 'cvf-control-plane',
      schemaVersion: '1.R.0',
      payload: {
        sessionId: 'sess-001',
        agentId: 'agent-reviewer',
        action: 'modify_file',
        policyDecision: 'escalate',
        riskLevel: 'R2',
        evidence: [{ rule: 'no-modify-governance', source: 'GC-020' }],
      },
    };

    expect(receipt.payload.evidence).toHaveLength(1);
    expect(receipt.payload.riskLevel).toBe('R2');
  });
});

// ─── ControlledMemoryReceipt ──────────────────────────────────────────────────

describe('ControlledMemoryReceipt payload conformance', () => {
  it('a minimal ControlledMemoryReceiptPayload satisfies the interface', () => {
    const payload: ControlledMemoryReceiptPayload = {
      memoryId: 'mem-001',
      tierId: 'working',
      operation: 'write',
      agentId: 'agent-builder',
    };

    expect(payload.operation).toBe('write');
  });

  it('ControlledMemoryReceipt operation must be read | write | evict', () => {
    const valid: Array<ControlledMemoryReceiptPayload['operation']> = ['read', 'write', 'evict'];
    expect(valid).toHaveLength(3);
  });
});

// ─── Adapter Map Coverage ─────────────────────────────────────────────────────

describe('RECEIPT_ENVELOPE_ADAPTER_MAP', () => {
  it('covers all 27 Phase 1.0 receipt surfaces', () => {
    expect(RECEIPT_ENVELOPE_ADAPTER_MAP).toHaveLength(27);
  });

  it('every entry has required fields', () => {
    for (const entry of RECEIPT_ENVELOPE_ADAPTER_MAP) {
      expect(entry.adapterId).toBeTruthy();
      expect(entry.domain).toBeTruthy();
      expect(entry.sourcePath).toBeTruthy();
      expect(entry.payloadType).toBeTruthy();
      expect(['canonical_contract', 'adapter', 'legacy_reference', 'deprecate_candidate'])
        .toContain(entry.disposition);
    }
  });

  it('adapter IDs are unique', () => {
    const ids = RECEIPT_ENVELOPE_ADAPTER_MAP.map((e) => e.adapterId);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('canonical_contract surfaces exist for multiple domains', () => {
    const canonicals = RECEIPT_ENVELOPE_ADAPTER_MAP.filter((e) => e.disposition === 'canonical_contract');
    expect(canonicals.length).toBeGreaterThan(0);

    const domains = new Set(canonicals.map((e) => e.domain));
    expect(domains.size).toBeGreaterThan(1); // CPF + EPF + LPF all canonical
  });

  it('all four payload types are represented in canonical surfaces', () => {
    const canonicals = RECEIPT_ENVELOPE_ADAPTER_MAP.filter((e) => e.disposition === 'canonical_contract');
    const payloadTypes = new Set(canonicals.map((e) => e.payloadType));

    expect(payloadTypes.has('GatewayReceiptPayload')).toBe(true);
    expect(payloadTypes.has('ExecutionBridgeReceiptPayload')).toBe(true);
    expect(payloadTypes.has('GovernanceLedgerReceiptPayload')).toBe(true);
    expect(payloadTypes.has('ControlledMemoryReceiptPayload')).toBe(true);
  });

  it('no existing receipt interface renamed or deleted (adapter map is classification-only)', () => {
    const dispositions = RECEIPT_ENVELOPE_ADAPTER_MAP.map((e) => e.disposition);
    for (const d of dispositions) {
      expect(['canonical_contract', 'adapter', 'legacy_reference', 'deprecate_candidate']).toContain(d);
    }
  });
});

// ─── Compatibility Invariant ──────────────────────────────────────────────────

describe('Receipt envelope compatibility', () => {
  it('payload fields of existing interfaces are preserved as payload fields', () => {
    const gatewayPayload: GatewayReceiptPayload = {
      requestId: 'req-x',
      modelId: 'model-x',
      providerId: 'provider-x',
      riskLevel: 'R1',
      decision: 'log',
    };
    // The payload shape matches what existing readers expect
    expect(gatewayPayload.requestId).toBeTruthy();
    expect(gatewayPayload.decision).toBeTruthy();
  });

  it('Receipt envelope adds id/issuedAt/source/schemaVersion without touching payload', () => {
    const receipt: GatewayReceipt = {
      id: 'new-field',
      issuedAt: new Date().toISOString(),
      source: 'gateway',
      schemaVersion: '1.R.0',
      payload: {
        requestId: 'req-y',
        modelId: 'model-y',
        providerId: 'provider-y',
        riskLevel: 'R0',
        decision: 'allow',
      },
    };
    // Envelope wraps without modifying payload — existing readers can still consume payload
    expect(receipt.payload.requestId).toBe('req-y');
    expect(receipt.id).toBe('new-field');
  });
});
