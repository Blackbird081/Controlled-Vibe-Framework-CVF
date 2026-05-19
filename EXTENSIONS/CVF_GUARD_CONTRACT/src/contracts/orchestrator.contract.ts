/**
 * CVF Phase D — Legacy ORCHESTRATOR Contract
 * ==========================================
 * Contract-local delegation boundary for ORCHESTRATOR-style worker lanes.
 *
 * Authorized by:
 * docs/baselines/CVF_GC018_LEGACY_ORCHESTRATOR_TRANCHE_2026-05-18.md
 *
 * SCOPE: Type metadata and deterministic helpers only.
 * No scheduler, route, or provider execution behavior is changed by this file.
 */

import type { CVFRiskLevel, CVFRole } from '../types';
import type { RolePermissionOutputClass } from './role-permission.contract';

export const ORCHESTRATOR_CONTRACT_VERSION = 'phaseD.orchestrator.v1' as const;

export type OrchestratorAuthorityRole = 'GOVERNOR' | 'HUMAN' | 'OPERATOR';

export type WorkerLaneRole = 'OBSERVER' | 'ANALYST' | 'BUILDER' | 'REVIEWER' | 'AI_AGENT';

export type OrchestratorDelegationCondition =
  | 'scope_confirmed'
  | 'risk_classified'
  | 'policy_gate_passed'
  | 'receipt_required'
  | 'memory_write_limited';

export type OrchestratorOverreachDenyRule =
  | 'deny_recursive_self_delegation'
  | 'deny_policy_gate_bypass'
  | 'deny_worker_lane_limit_exceeded'
  | 'deny_missing_delegation_receipt'
  | 'deny_unscoped_worker_lane'
  | 'deny_worker_persistent_memory_write';

export interface OrchestratorDelegationProfile {
  readonly delegatingRole: OrchestratorAuthorityRole;
  readonly mayDelegateTo: readonly WorkerLaneRole[];
  readonly maxWorkerLanes: number;
  readonly maxDelegatedRisk: CVFRiskLevel;
  readonly requiredConditions: readonly OrchestratorDelegationCondition[];
  readonly denyRules: readonly OrchestratorOverreachDenyRule[];
}

export interface WorkerMemoryWriteBoundary {
  readonly persistentTierWriteAllowed: false;
  readonly archiveTierWriteAllowed: false;
  readonly requiresOrchestratorDelegationReceipt: true;
}

export interface WorkerLaneTicket {
  readonly ticketId: string;
  readonly delegatingRole: OrchestratorAuthorityRole;
  readonly workerRole: WorkerLaneRole;
  readonly taskScope: string;
  readonly allowedOutputClasses: readonly RolePermissionOutputClass[];
  readonly receiptRequired: true;
  readonly delegationReceiptId?: string;
  readonly memoryWriteBoundary: WorkerMemoryWriteBoundary;
}

export const ORCHESTRATOR_AUTHORITY_ROLES: readonly OrchestratorAuthorityRole[] = [
  'GOVERNOR',
  'HUMAN',
  'OPERATOR',
] as const;

export const WORKER_LANE_ROLES: readonly WorkerLaneRole[] = [
  'OBSERVER',
  'ANALYST',
  'BUILDER',
  'REVIEWER',
  'AI_AGENT',
] as const;

export const ORCHESTRATOR_OVERREACH_DENY_RULES: readonly OrchestratorOverreachDenyRule[] = [
  'deny_recursive_self_delegation',
  'deny_policy_gate_bypass',
  'deny_worker_lane_limit_exceeded',
  'deny_missing_delegation_receipt',
  'deny_unscoped_worker_lane',
  'deny_worker_persistent_memory_write',
] as const;

export const ORCHESTRATOR_DELEGATION_PROFILES: Readonly<
  Record<OrchestratorAuthorityRole, OrchestratorDelegationProfile>
> = {
  GOVERNOR: {
    delegatingRole: 'GOVERNOR',
    mayDelegateTo: WORKER_LANE_ROLES,
    maxWorkerLanes: 5,
    maxDelegatedRisk: 'R3',
    requiredConditions: [
      'scope_confirmed',
      'risk_classified',
      'policy_gate_passed',
      'receipt_required',
      'memory_write_limited',
    ],
    denyRules: ORCHESTRATOR_OVERREACH_DENY_RULES,
  },
  HUMAN: {
    delegatingRole: 'HUMAN',
    mayDelegateTo: WORKER_LANE_ROLES,
    maxWorkerLanes: 5,
    maxDelegatedRisk: 'R3',
    requiredConditions: [
      'scope_confirmed',
      'risk_classified',
      'policy_gate_passed',
      'receipt_required',
      'memory_write_limited',
    ],
    denyRules: ORCHESTRATOR_OVERREACH_DENY_RULES,
  },
  OPERATOR: {
    delegatingRole: 'OPERATOR',
    mayDelegateTo: ['OBSERVER', 'ANALYST', 'BUILDER', 'REVIEWER', 'AI_AGENT'],
    maxWorkerLanes: 3,
    maxDelegatedRisk: 'R2',
    requiredConditions: [
      'scope_confirmed',
      'risk_classified',
      'policy_gate_passed',
      'receipt_required',
      'memory_write_limited',
    ],
    denyRules: [
      'deny_recursive_self_delegation',
      'deny_policy_gate_bypass',
      'deny_worker_lane_limit_exceeded',
      'deny_missing_delegation_receipt',
      'deny_unscoped_worker_lane',
      'deny_worker_persistent_memory_write',
    ],
  },
} as const;

export function isOrchestratorAuthorityRole(role: CVFRole): role is OrchestratorAuthorityRole {
  return ORCHESTRATOR_AUTHORITY_ROLES.includes(role as OrchestratorAuthorityRole);
}

export function isWorkerLaneRole(role: CVFRole): role is WorkerLaneRole {
  return WORKER_LANE_ROLES.includes(role as WorkerLaneRole);
}

export function orchestratorCoversAllRoles(roles: readonly OrchestratorAuthorityRole[]): boolean {
  return roles.every((role) => ORCHESTRATOR_DELEGATION_PROFILES[role]?.delegatingRole === role);
}

export function canIssueWorkerLaneTicket(
  delegatingRole: CVFRole,
  workerRole: CVFRole,
): delegatingRole is OrchestratorAuthorityRole {
  if (!isOrchestratorAuthorityRole(delegatingRole) || !isWorkerLaneRole(workerRole)) {
    return false;
  }

  return (
    ORCHESTRATOR_DELEGATION_PROFILES[delegatingRole].mayDelegateTo.includes(workerRole)
  );
}

export function createWorkerLaneTicket(input: {
  readonly ticketId: string;
  readonly delegatingRole: OrchestratorAuthorityRole;
  readonly workerRole: WorkerLaneRole;
  readonly taskScope: string;
  readonly allowedOutputClasses: readonly RolePermissionOutputClass[];
  readonly delegationReceiptId?: string;
}): WorkerLaneTicket {
  return {
    ticketId: input.ticketId,
    delegatingRole: input.delegatingRole,
    workerRole: input.workerRole,
    taskScope: input.taskScope,
    allowedOutputClasses: input.allowedOutputClasses,
    receiptRequired: true,
    delegationReceiptId: input.delegationReceiptId,
    memoryWriteBoundary: {
      persistentTierWriteAllowed: false,
      archiveTierWriteAllowed: false,
      requiresOrchestratorDelegationReceipt: true,
    },
  };
}
