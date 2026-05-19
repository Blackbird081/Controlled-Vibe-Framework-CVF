/**
 * CVF Phase D — Legacy Memory Continuity Contract
 * ===============================================
 * Contract-local memory tier, reinjection, and worker write boundary metadata.
 *
 * Authorized by:
 * docs/baselines/CVF_GC018_LEGACY_MEMORY_CONTINUITY_TRANCHE_2026-05-18.md
 *
 * SCOPE: Type metadata and deterministic helpers only.
 * No memory store, runtime reinjection, scheduler, or provider behavior is changed by this file.
 */

import type { CVFRole } from '../types';
import type {
  OrchestratorAuthorityRole,
  WorkerLaneRole,
  WorkerLaneTicket,
} from './orchestrator.contract';

export const MEMORY_CONTINUITY_CONTRACT_VERSION = 'phaseD.memoryContinuity.v1' as const;

export type MemoryContinuityTier = 'working' | 'session' | 'persistent' | 'archive';

export type MemoryTierOwnerRole = Extract<
  CVFRole,
  'BUILDER' | 'AI_AGENT' | 'OPERATOR' | 'GOVERNOR' | 'HUMAN'
>;

export type MemoryPrivacyFilterId =
  | 'scope_minimization'
  | 'pii_redaction'
  | 'secret_redaction'
  | 'operator_approval_required'
  | 'archive_readonly';

export type WorkerRestrictedMemoryTier = Extract<MemoryContinuityTier, 'persistent' | 'archive'>;

export interface MemoryTierOwnerPolicy {
  readonly tier: MemoryContinuityTier;
  readonly ownerRole: MemoryTierOwnerRole;
  readonly writesRequireReceipt: boolean;
  readonly reinjectionAllowed: boolean;
  readonly privacyFilters: readonly MemoryPrivacyFilterId[];
}

export interface MemoryReinjectionPolicy {
  readonly tier: MemoryContinuityTier;
  readonly privacyFilter: MemoryPrivacyFilterId;
  readonly provenanceScoreThreshold: number;
  readonly maxAgeSeconds: number;
  readonly allowedConsumerRoles: readonly CVFRole[];
  readonly receiptRequired: true;
}

export interface WorkerMemoryWriteRestrictionPolicy {
  readonly workerRole: WorkerLaneRole;
  readonly deniedTiers: readonly WorkerRestrictedMemoryTier[];
  readonly requiresOrchestratorDelegationReceipt: true;
  readonly allowedWithDelegationReceiptFrom: readonly OrchestratorAuthorityRole[];
}

export interface WorkerMemoryWriteRequest {
  readonly workerRole: WorkerLaneRole;
  readonly tier: MemoryContinuityTier;
  readonly ticket?: WorkerLaneTicket;
}

export type WorkerMemoryWriteDecision = 'allow' | 'deny_missing_delegation_receipt';

export const MEMORY_CONTINUITY_TIERS: readonly MemoryContinuityTier[] = [
  'working',
  'session',
  'persistent',
  'archive',
] as const;

export const MEMORY_TIER_OWNER_POLICIES: Readonly<
  Record<MemoryContinuityTier, MemoryTierOwnerPolicy>
> = {
  working: {
    tier: 'working',
    ownerRole: 'BUILDER',
    writesRequireReceipt: false,
    reinjectionAllowed: true,
    privacyFilters: ['scope_minimization'],
  },
  session: {
    tier: 'session',
    ownerRole: 'OPERATOR',
    writesRequireReceipt: true,
    reinjectionAllowed: true,
    privacyFilters: ['scope_minimization', 'pii_redaction'],
  },
  persistent: {
    tier: 'persistent',
    ownerRole: 'OPERATOR',
    writesRequireReceipt: true,
    reinjectionAllowed: true,
    privacyFilters: ['scope_minimization', 'pii_redaction', 'secret_redaction'],
  },
  archive: {
    tier: 'archive',
    ownerRole: 'GOVERNOR',
    writesRequireReceipt: true,
    reinjectionAllowed: false,
    privacyFilters: [
      'scope_minimization',
      'pii_redaction',
      'secret_redaction',
      'operator_approval_required',
      'archive_readonly',
    ],
  },
} as const;

export const MEMORY_REINJECTION_POLICIES: Readonly<
  Record<MemoryContinuityTier, MemoryReinjectionPolicy>
> = {
  working: {
    tier: 'working',
    privacyFilter: 'scope_minimization',
    provenanceScoreThreshold: 0.5,
    maxAgeSeconds: 60 * 60,
    allowedConsumerRoles: ['BUILDER', 'AI_AGENT', 'OPERATOR'],
    receiptRequired: true,
  },
  session: {
    tier: 'session',
    privacyFilter: 'pii_redaction',
    provenanceScoreThreshold: 0.65,
    maxAgeSeconds: 60 * 60 * 24,
    allowedConsumerRoles: ['BUILDER', 'AI_AGENT', 'OPERATOR', 'HUMAN'],
    receiptRequired: true,
  },
  persistent: {
    tier: 'persistent',
    privacyFilter: 'secret_redaction',
    provenanceScoreThreshold: 0.8,
    maxAgeSeconds: 60 * 60 * 24 * 30,
    allowedConsumerRoles: ['OPERATOR', 'HUMAN', 'GOVERNOR'],
    receiptRequired: true,
  },
  archive: {
    tier: 'archive',
    privacyFilter: 'archive_readonly',
    provenanceScoreThreshold: 0.95,
    maxAgeSeconds: 60 * 60 * 24 * 365,
    allowedConsumerRoles: ['GOVERNOR'],
    receiptRequired: true,
  },
} as const;

export const WORKER_MEMORY_WRITE_RESTRICTIONS: Readonly<
  Record<WorkerLaneRole, WorkerMemoryWriteRestrictionPolicy>
> = {
  OBSERVER: {
    workerRole: 'OBSERVER',
    deniedTiers: ['persistent', 'archive'],
    requiresOrchestratorDelegationReceipt: true,
    allowedWithDelegationReceiptFrom: ['GOVERNOR', 'HUMAN', 'OPERATOR'],
  },
  ANALYST: {
    workerRole: 'ANALYST',
    deniedTiers: ['persistent', 'archive'],
    requiresOrchestratorDelegationReceipt: true,
    allowedWithDelegationReceiptFrom: ['GOVERNOR', 'HUMAN', 'OPERATOR'],
  },
  BUILDER: {
    workerRole: 'BUILDER',
    deniedTiers: ['persistent', 'archive'],
    requiresOrchestratorDelegationReceipt: true,
    allowedWithDelegationReceiptFrom: ['GOVERNOR', 'HUMAN', 'OPERATOR'],
  },
  REVIEWER: {
    workerRole: 'REVIEWER',
    deniedTiers: ['persistent', 'archive'],
    requiresOrchestratorDelegationReceipt: true,
    allowedWithDelegationReceiptFrom: ['GOVERNOR', 'HUMAN', 'OPERATOR'],
  },
  AI_AGENT: {
    workerRole: 'AI_AGENT',
    deniedTiers: ['persistent', 'archive'],
    requiresOrchestratorDelegationReceipt: true,
    allowedWithDelegationReceiptFrom: ['GOVERNOR', 'HUMAN', 'OPERATOR'],
  },
} as const;

export function memoryContinuityCoversAllTiers(
  tiers: readonly MemoryContinuityTier[] = MEMORY_CONTINUITY_TIERS,
): boolean {
  return tiers.every(
    (tier) =>
      MEMORY_TIER_OWNER_POLICIES[tier]?.tier === tier &&
      MEMORY_REINJECTION_POLICIES[tier]?.tier === tier,
  );
}

export function isWorkerRestrictedMemoryTier(
  tier: MemoryContinuityTier,
): tier is WorkerRestrictedMemoryTier {
  return tier === 'persistent' || tier === 'archive';
}

export function evaluateWorkerMemoryWrite(
  request: WorkerMemoryWriteRequest,
): WorkerMemoryWriteDecision {
  if (!isWorkerRestrictedMemoryTier(request.tier)) {
    return 'allow';
  }

  const restriction = WORKER_MEMORY_WRITE_RESTRICTIONS[request.workerRole];
  const ticket = request.ticket;

  if (
    ticket?.workerRole === request.workerRole &&
    ticket.delegationReceiptId &&
    restriction.allowedWithDelegationReceiptFrom.includes(ticket.delegatingRole)
  ) {
    return 'allow';
  }

  return 'deny_missing_delegation_receipt';
}
