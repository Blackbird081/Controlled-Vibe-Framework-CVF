import { describe, expect, it } from 'vitest';
import { createWorkerLaneTicket } from './orchestrator.contract';
import {
  MEMORY_CONTINUITY_TIERS,
  MEMORY_REINJECTION_POLICIES,
  MEMORY_TIER_OWNER_POLICIES,
  WORKER_MEMORY_WRITE_RESTRICTIONS,
  evaluateWorkerMemoryWrite,
  memoryContinuityCoversAllTiers,
} from './memory-continuity.contract';

describe('Phase D Memory continuity contract', () => {
  it('defines an owner policy and reinjection policy for every memory tier', () => {
    expect(Object.keys(MEMORY_TIER_OWNER_POLICIES).sort()).toEqual(
      [...MEMORY_CONTINUITY_TIERS].sort(),
    );
    expect(Object.keys(MEMORY_REINJECTION_POLICIES).sort()).toEqual(
      [...MEMORY_CONTINUITY_TIERS].sort(),
    );
    expect(memoryContinuityCoversAllTiers()).toBe(true);
  });

  it('requires reinjection policy privacy filters and receipts for every tier', () => {
    for (const policy of Object.values(MEMORY_REINJECTION_POLICIES)) {
      expect(policy.privacyFilter).toBeTruthy();
      expect(policy.receiptRequired).toBe(true);
      expect(policy.provenanceScoreThreshold).toBeGreaterThanOrEqual(0);
      expect(policy.provenanceScoreThreshold).toBeLessThanOrEqual(1);
      expect(policy.maxAgeSeconds).toBeGreaterThan(0);
      expect(policy.allowedConsumerRoles.length).toBeGreaterThan(0);
    }
  });

  it('keeps archive memory under GOVERNOR ownership and read-only reinjection posture', () => {
    expect(MEMORY_TIER_OWNER_POLICIES.archive.ownerRole).toBe('GOVERNOR');
    expect(MEMORY_TIER_OWNER_POLICIES.archive.reinjectionAllowed).toBe(false);
    expect(MEMORY_TIER_OWNER_POLICIES.archive.privacyFilters).toContain('archive_readonly');
    expect(MEMORY_REINJECTION_POLICIES.archive.privacyFilter).toBe('archive_readonly');
    expect(MEMORY_REINJECTION_POLICIES.archive.allowedConsumerRoles).toEqual(['GOVERNOR']);
  });

  it('requires worker write restrictions for persistent and archive tiers', () => {
    for (const restriction of Object.values(WORKER_MEMORY_WRITE_RESTRICTIONS)) {
      expect(restriction.deniedTiers).toEqual(['persistent', 'archive']);
      expect(restriction.requiresOrchestratorDelegationReceipt).toBe(true);
      expect(restriction.allowedWithDelegationReceiptFrom).toEqual([
        'GOVERNOR',
        'HUMAN',
        'OPERATOR',
      ]);
    }
  });

  it('denies worker persistent/archive writes without a delegation receipt', () => {
    expect(evaluateWorkerMemoryWrite({ workerRole: 'BUILDER', tier: 'working' })).toBe('allow');
    expect(evaluateWorkerMemoryWrite({ workerRole: 'BUILDER', tier: 'session' })).toBe('allow');
    expect(evaluateWorkerMemoryWrite({ workerRole: 'BUILDER', tier: 'persistent' })).toBe(
      'deny_missing_delegation_receipt',
    );
    expect(evaluateWorkerMemoryWrite({ workerRole: 'AI_AGENT', tier: 'archive' })).toBe(
      'deny_missing_delegation_receipt',
    );
  });

  it('allows restricted worker memory writes only with a matching ORCHESTRATOR ticket receipt', () => {
    const ticket = createWorkerLaneTicket({
      ticketId: 'ticket-phaseD-memory-001',
      delegatingRole: 'OPERATOR',
      workerRole: 'BUILDER',
      taskScope: 'bounded memory policy update',
      allowedOutputClasses: ['code_patch'],
      delegationReceiptId: 'receipt-phaseD-memory-001',
    });

    expect(evaluateWorkerMemoryWrite({ workerRole: 'BUILDER', tier: 'persistent', ticket })).toBe(
      'allow',
    );
    expect(evaluateWorkerMemoryWrite({ workerRole: 'AI_AGENT', tier: 'persistent', ticket })).toBe(
      'deny_missing_delegation_receipt',
    );
  });
});
