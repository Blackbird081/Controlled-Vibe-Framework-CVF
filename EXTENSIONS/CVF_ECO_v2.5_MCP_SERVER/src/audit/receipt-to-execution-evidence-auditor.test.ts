import { describe, expect, it } from 'vitest';
import type { GuardAuditEntry } from '../guards/types.js';
import {
  RECEIPT_CONSUMER_CONTRACT,
} from '../tools/governance-action-receipt-consumer.js';
import { PREFLIGHT_CONTRACT } from '../tools/governance-action-preflight.js';
import type { ReceiptConsumptionMarker } from '../persistence/json-receipt-consumption.store.js';
import {
  GOVERNED_EXECUTION_RECEIPT_CONTRACT,
  type GovernedExecutionReceipt,
} from '../persistence/json-governed-execution.store.js';
import {
  APPROVAL_MARKER_CONTRACT,
  APPROVAL_MARKER_PROFILE_ID,
  APPROVAL_MARKER_TARGET_RELATIVE_PATH,
} from '../cli/mutating-profile-approval.js';
import {
  auditReceiptToExecutionEvidence,
  type ApprovalMarkerEvidence,
  type ReceiptToExecutionEvidenceInput,
} from './receipt-to-execution-evidence-auditor.js';

const RECEIPT_ID = 'delta-preflight-1000-abcd';
const CONSUMPTION_ID = 'delta-consumption-1001-abcd';
const BINDING_HASH = 'a'.repeat(64);

function audit(targetFiles?: string[]): GuardAuditEntry {
  return {
    requestId: RECEIPT_ID,
    timestamp: '2026-06-19T00:00:00.000Z',
    context: {
      requestId: RECEIPT_ID,
      phase: 'BUILD',
      riskLevel: 'R0',
      role: 'AI_AGENT',
      action: 'RUN: governed profile',
      targetFiles,
      metadata: { actionClass: 'RUN', contract: PREFLIGHT_CONTRACT },
    },
    pipelineResult: {
      requestId: RECEIPT_ID,
      finalDecision: 'ALLOW',
      results: [],
      executedAt: '2026-06-19T00:00:00.000Z',
      durationMs: 1,
    },
  };
}

function consumption(): ReceiptConsumptionMarker {
  return {
    contractVersion: RECEIPT_CONSUMER_CONTRACT,
    preflightContractVersion: PREFLIGHT_CONTRACT,
    receiptId: RECEIPT_ID,
    consumptionId: CONSUMPTION_ID,
    consumedAt: '2026-06-19T00:00:01.000Z',
    actionClass: 'RUN',
    bindingHash: BINDING_HASH,
    actionExecutionProved: false,
    externalInterceptionProved: false,
  };
}

function execution(profileId = 'git-status'): GovernedExecutionReceipt {
  return {
    contractVersion: GOVERNED_EXECUTION_RECEIPT_CONTRACT,
    consumptionId: CONSUMPTION_ID,
    receiptId: RECEIPT_ID,
    profileId,
    bindingHash: BINDING_HASH,
    status: 'COMPLETED',
    admittedAt: '2026-06-19T00:00:02.000Z',
    startedAt: '2026-06-19T00:00:03.000Z',
    completedAt: '2026-06-19T00:00:04.000Z',
    exitCode: 0,
    signal: null,
    diagnosticCode: null,
    executionStarted: true,
    executionCompleted: true,
    externalInterceptionProved: false,
  };
}

function marker(): ApprovalMarkerEvidence {
  return {
    contractVersion: APPROVAL_MARKER_CONTRACT,
    profileId: APPROVAL_MARKER_PROFILE_ID,
    approvalId: 'approval-1',
    bindingHash: BINDING_HASH,
    consumptionId: CONSUMPTION_ID,
    targetRelativePath: APPROVAL_MARKER_TARGET_RELATIVE_PATH,
    completedAt: '2026-06-19T00:00:04.000Z',
  };
}

function input(overrides: Partial<ReceiptToExecutionEvidenceInput> = {}): ReceiptToExecutionEvidenceInput {
  return {
    preflightAudit: audit(),
    consumption: consumption(),
    execution: execution(),
    expectedProfileId: 'git-status',
    observedChangedSet: [],
    approvalMarker: null,
    ...overrides,
  };
}

describe('receipt-to-execution evidence auditor', () => {
  it('passes a finalized non-mutating chain without claiming interception', () => {
    const result = auditReceiptToExecutionEvidence(input());
    expect(result.passed).toBe(true);
    expect(result.actionExecutionProved).toBe(true);
    expect(result.approvalBackedMutationProved).toBe(false);
    expect(result.externalInterceptionProved).toBe(false);
    expect(result.mandatoryInvocationProved).toBe(false);
  });

  it('passes a matching fixed-target approval marker chain', () => {
    const result = auditReceiptToExecutionEvidence(input({
      preflightAudit: audit([APPROVAL_MARKER_TARGET_RELATIVE_PATH]),
      execution: execution(APPROVAL_MARKER_PROFILE_ID),
      expectedProfileId: APPROVAL_MARKER_PROFILE_ID,
      observedChangedSet: [APPROVAL_MARKER_TARGET_RELATIVE_PATH],
      approvalMarker: marker(),
    }));
    expect(result.passed).toBe(true);
    expect(result.approvalBackedMutationProved).toBe(true);
  });

  it.each([
    ['receipt', (value: ReceiptToExecutionEvidenceInput) => { value.consumption.receiptId = 'other'; }, 'RECEIPT_ID_MISMATCH'],
    ['consumption', (value: ReceiptToExecutionEvidenceInput) => { value.execution.consumptionId = 'delta-consumption-9-x'; }, 'CONSUMPTION_ID_MISMATCH'],
    ['binding', (value: ReceiptToExecutionEvidenceInput) => { value.execution.bindingHash = 'b'.repeat(64); }, 'BINDING_HASH_MISMATCH'],
    ['decision', (value: ReceiptToExecutionEvidenceInput) => { value.preflightAudit.pipelineResult.finalDecision = 'BLOCK'; }, 'PREFLIGHT_NOT_ALLOW'],
    ['chronology', (value: ReceiptToExecutionEvidenceInput) => { value.execution.admittedAt = '2025-01-01T00:00:00.000Z'; }, 'CHRONOLOGY_INVALID'],
  ])('fails a %s mismatch', (_name, mutate, code) => {
    const value = input();
    mutate(value);
    expect(auditReceiptToExecutionEvidence(value).findings).toContain(code);
  });

  it('fails an unknown profile and admitted-only evidence', () => {
    const value = input({ expectedProfileId: 'unknown' });
    value.execution.status = 'ADMITTED';
    value.execution.startedAt = null;
    value.execution.completedAt = null;
    value.execution.exitCode = null;
    value.execution.executionStarted = false;
    value.execution.executionCompleted = false;
    const result = auditReceiptToExecutionEvidence(value);
    expect(result.findings).toContain('PROFILE_UNKNOWN');
    expect(result.findings).toContain('EXECUTION_NOT_FINALIZED');
    expect(result.actionExecutionProved).toBe(false);
  });

  it('accepts a finalized failed chain but does not prove action execution', () => {
    const value = input();
    value.execution.status = 'FAILED';
    value.execution.startedAt = null;
    value.execution.exitCode = null;
    value.execution.executionStarted = false;
    value.execution.executionCompleted = false;
    value.execution.diagnosticCode = 'APPROVAL_NOT_GRANTED';
    const result = auditReceiptToExecutionEvidence(value);
    expect(result.passed).toBe(true);
    expect(result.actionExecutionProved).toBe(false);
  });

  it('fails changed-set and marker mismatches', () => {
    const value = input({
      preflightAudit: audit([APPROVAL_MARKER_TARGET_RELATIVE_PATH]),
      execution: execution(APPROVAL_MARKER_PROFILE_ID),
      expectedProfileId: APPROVAL_MARKER_PROFILE_ID,
      observedChangedSet: [],
      approvalMarker: { ...marker(), bindingHash: 'b'.repeat(64) },
    });
    const result = auditReceiptToExecutionEvidence(value);
    expect(result.findings).toContain('OBSERVED_CHANGED_SET_MISMATCH');
    expect(result.findings).toContain('APPROVAL_MARKER_MISMATCH');
  });

  it('requires the marker for a completed mutating profile', () => {
    const result = auditReceiptToExecutionEvidence(input({
      preflightAudit: audit([APPROVAL_MARKER_TARGET_RELATIVE_PATH]),
      execution: execution(APPROVAL_MARKER_PROFILE_ID),
      expectedProfileId: APPROVAL_MARKER_PROFILE_ID,
      observedChangedSet: [APPROVAL_MARKER_TARGET_RELATIVE_PATH],
    }));
    expect(result.findings).toContain('APPROVAL_MARKER_REQUIRED');
  });
});
