/**
 * CVF Phase D — Legacy Role/Permission Contract
 * =============================================
 * Defines the deterministic role permission profile required by the legacy
 * absorption Phase D first tranche.
 *
 * Authorized by:
 * docs/baselines/CVF_GC018_LEGACY_ROLE_PERMISSION_TRANCHE_2026-05-18.md
 *
 * SCOPE: Contract-local permission metadata only.
 * No route/provider execution behavior is changed by this file.
 */

import type { CVFRiskLevel, CVFRole } from '../types';

export const ROLE_PERMISSION_SCHEMA_VERSION = 'phaseD.rolePermission.v1' as const;

export type RolePermissionOutputClass =
  | 'observation'
  | 'clarification'
  | 'analysis'
  | 'summary'
  | 'recommendation'
  | 'code_patch'
  | 'artifact'
  | 'implementation_note'
  | 'review_finding'
  | 'test_result'
  | 'approval_decision'
  | 'policy_decision'
  | 'freeze_record';

export type RolePermissionDenyRuleId =
  | 'may_not_mutate'
  | 'may_not_approve_own_work'
  | 'may_not_override_gate'
  | 'may_not_release_to_public'
  | 'may_not_freeze_boundary'
  | 'must_emit_receipt_for_mutation'
  | 'must_escalate_r3';

export type ReceiptOwnerAxis =
  | 'agent-function'
  | 'operator-team'
  | 'auth-rbac'
  | 'governance-actor';

export interface ReceiptOwnerBoundary {
  readonly ownerAxis: ReceiptOwnerAxis;
  readonly ownerRole: string;
  readonly requiresReceiptFor: readonly (
    | 'mutation'
    | 'approval'
    | 'handoff'
    | 'provider_execution'
    | 'freeze'
  )[];
}

export interface RolePermissionProfile {
  readonly role: CVFRole;
  readonly maxRisk: CVFRiskLevel;
  readonly allowedActions: readonly string[];
  readonly allowedOutputClasses: readonly RolePermissionOutputClass[];
  readonly denyRules: readonly RolePermissionDenyRuleId[];
  readonly receiptOwnerBoundary: ReceiptOwnerBoundary;
  readonly notes?: string;
}

export const ROLE_PERMISSION_OUTPUT_CLASSES: readonly RolePermissionOutputClass[] = [
  'observation',
  'clarification',
  'analysis',
  'summary',
  'recommendation',
  'code_patch',
  'artifact',
  'implementation_note',
  'review_finding',
  'test_result',
  'approval_decision',
  'policy_decision',
  'freeze_record',
] as const;

export const ROLE_PERMISSION_DENY_RULES: readonly RolePermissionDenyRuleId[] = [
  'may_not_mutate',
  'may_not_approve_own_work',
  'may_not_override_gate',
  'may_not_release_to_public',
  'may_not_freeze_boundary',
  'must_emit_receipt_for_mutation',
  'must_escalate_r3',
] as const;

export const ROLE_PERMISSION_PROFILES: Readonly<Record<CVFRole, RolePermissionProfile>> = {
  OBSERVER: {
    role: 'OBSERVER',
    maxRisk: 'R0',
    allowedActions: ['read', 'ask', 'clarify', 'observe'],
    allowedOutputClasses: ['observation', 'clarification', 'summary'],
    denyRules: [
      'may_not_mutate',
      'may_not_approve_own_work',
      'may_not_override_gate',
      'may_not_release_to_public',
      'may_not_freeze_boundary',
      'must_escalate_r3',
    ],
    receiptOwnerBoundary: {
      ownerAxis: 'agent-function',
      ownerRole: 'observer',
      requiresReceiptFor: ['handoff'],
    },
  },
  ANALYST: {
    role: 'ANALYST',
    maxRisk: 'R1',
    allowedActions: ['analyze', 'summarize', 'read', 'ask', 'compare', 'assess'],
    allowedOutputClasses: ['analysis', 'summary', 'recommendation'],
    denyRules: [
      'may_not_mutate',
      'may_not_approve_own_work',
      'may_not_override_gate',
      'may_not_release_to_public',
      'may_not_freeze_boundary',
      'must_escalate_r3',
    ],
    receiptOwnerBoundary: {
      ownerAxis: 'agent-function',
      ownerRole: 'analyst',
      requiresReceiptFor: ['handoff'],
    },
  },
  BUILDER: {
    role: 'BUILDER',
    maxRisk: 'R2',
    allowedActions: ['create', 'modify', 'build', 'implement', 'code', 'write'],
    allowedOutputClasses: ['code_patch', 'artifact', 'implementation_note', 'summary'],
    denyRules: [
      'may_not_approve_own_work',
      'may_not_override_gate',
      'may_not_release_to_public',
      'may_not_freeze_boundary',
      'must_emit_receipt_for_mutation',
      'must_escalate_r3',
    ],
    receiptOwnerBoundary: {
      ownerAxis: 'agent-function',
      ownerRole: 'builder',
      requiresReceiptFor: ['mutation', 'handoff'],
    },
  },
  REVIEWER: {
    role: 'REVIEWER',
    maxRisk: 'R2',
    allowedActions: ['validate', 'read', 'assess', 'critique', 'test', 'approve', 'reject'],
    allowedOutputClasses: ['review_finding', 'test_result', 'approval_decision', 'summary'],
    denyRules: [
      'may_not_mutate',
      'may_not_override_gate',
      'may_not_release_to_public',
      'may_not_freeze_boundary',
      'must_escalate_r3',
    ],
    receiptOwnerBoundary: {
      ownerAxis: 'governance-actor',
      ownerRole: 'REVIEWER',
      requiresReceiptFor: ['approval', 'handoff'],
    },
  },
  GOVERNOR: {
    role: 'GOVERNOR',
    maxRisk: 'R3',
    allowedActions: ['approve', 'reject', 'scope', 'read', 'override', 'lock', 'enforce', 'freeze'],
    allowedOutputClasses: ['approval_decision', 'policy_decision', 'freeze_record', 'summary'],
    denyRules: ['may_not_mutate', 'may_not_release_to_public'],
    receiptOwnerBoundary: {
      ownerAxis: 'governance-actor',
      ownerRole: 'GOVERNOR',
      requiresReceiptFor: ['approval', 'freeze', 'handoff'],
    },
  },
  HUMAN: {
    role: 'HUMAN',
    maxRisk: 'R3',
    allowedActions: ['approve', 'reject', 'scope', 'read', 'ask', 'analyze', 'create', 'modify', 'build', 'implement', 'code', 'write', 'deploy', 'release', 'execute', 'lock', 'enforce', 'freeze'],
    allowedOutputClasses: ROLE_PERMISSION_OUTPUT_CLASSES,
    denyRules: ['must_emit_receipt_for_mutation'],
    receiptOwnerBoundary: {
      ownerAxis: 'governance-actor',
      ownerRole: 'OPERATOR',
      requiresReceiptFor: ['mutation', 'approval', 'provider_execution', 'freeze', 'handoff'],
    },
  },
  AI_AGENT: {
    role: 'AI_AGENT',
    maxRisk: 'R2',
    allowedActions: ['create', 'modify', 'build', 'implement', 'code', 'write', 'explain', 'read'],
    allowedOutputClasses: ['code_patch', 'artifact', 'implementation_note', 'summary'],
    denyRules: [
      'may_not_approve_own_work',
      'may_not_override_gate',
      'may_not_release_to_public',
      'may_not_freeze_boundary',
      'must_emit_receipt_for_mutation',
      'must_escalate_r3',
    ],
    receiptOwnerBoundary: {
      ownerAxis: 'agent-function',
      ownerRole: 'AI_AGENT',
      requiresReceiptFor: ['mutation', 'handoff'],
    },
  },
  OPERATOR: {
    role: 'OPERATOR',
    maxRisk: 'R2',
    allowedActions: ['read', 'ask', 'analyze', 'approve', 'create', 'modify', 'build', 'implement', 'code', 'write', 'deploy', 'release', 'execute', 'design', 'plan', 'perform', 'assess', 'research', 'develop', 'draft'],
    allowedOutputClasses: ['analysis', 'summary', 'recommendation', 'code_patch', 'artifact', 'implementation_note', 'approval_decision'],
    denyRules: ['may_not_override_gate', 'may_not_freeze_boundary', 'must_emit_receipt_for_mutation', 'must_escalate_r3'],
    receiptOwnerBoundary: {
      ownerAxis: 'operator-team',
      ownerRole: 'operator',
      requiresReceiptFor: ['mutation', 'approval', 'provider_execution', 'handoff'],
    },
  },
  SERVICE_AGENT: {
    role: 'SERVICE_AGENT',
    maxRisk: 'R2',
    allowedActions: ['execute', 'read', 'analyze', 'create', 'build', 'draft'],
    allowedOutputClasses: ['analysis', 'summary', 'recommendation', 'artifact', 'implementation_note'],
    denyRules: ['may_not_override_gate', 'may_not_release_to_public', 'must_emit_receipt_for_mutation', 'must_escalate_r3'],
    receiptOwnerBoundary: {
      ownerAxis: 'governance-actor',
      ownerRole: 'SERVICE_AGENT',
      requiresReceiptFor: ['provider_execution', 'handoff'],
    },
    notes: 'Phase E E.2 bounded service-token execution role; narrower than OPERATOR and not a human approval authority.',
  },
} as const;

export function getRolePermissionProfile(role: CVFRole): RolePermissionProfile {
  return ROLE_PERMISSION_PROFILES[role];
}

export function isOutputAllowedForRole(
  role: CVFRole,
  outputClass: RolePermissionOutputClass,
): boolean {
  return ROLE_PERMISSION_PROFILES[role].allowedOutputClasses.includes(outputClass);
}

export function roleHasDenyRule(role: CVFRole, denyRule: RolePermissionDenyRuleId): boolean {
  return ROLE_PERMISSION_PROFILES[role].denyRules.includes(denyRule);
}

export function rolePermissionCoversAllRoles(roles: readonly CVFRole[]): boolean {
  return roles.every((role) => ROLE_PERMISSION_PROFILES[role]?.role === role);
}
