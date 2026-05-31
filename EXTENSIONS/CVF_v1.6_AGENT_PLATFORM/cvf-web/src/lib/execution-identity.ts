import type { CVFRole, RolePermissionOutputClass } from 'cvf-guard-contract';
import type {
  ActorRoleGateResult,
  ResolvedExecutionCVFRole,
  ResolvedExecutionOutputClass,
} from '@/lib/execute-role-resolver';
import type { RoleOutputPermissionCheck } from '@/lib/execute-route-guards';

export type ExecutionIdentityDecisionState = 'allowed' | 'denied';

export type ExecutionIdentityContextScope =
  | 'operator_workspace'
  | 'builder_workspace'
  | 'review_workspace'
  | 'service_execution_context'
  | 'observer_read_only'
  | 'analysis_workspace'
  | 'unknown_scope';

export type ExecutionIdentityBoundary =
  | 'governed_pack_actor_policy'
  | 'template_execution_policy'
  | 'role_resolution_denied';

export interface ExecutionIdentityDecision {
  contractVersion: 'cvf.executionIdentity.v1';
  actorId: string;
  sessionRole: string | null;
  cvfRole: CVFRole | null;
  source: ResolvedExecutionCVFRole['source'];
  inputRole: string | null;
  templateId: string | null;
  targetResource: string;
  authority: {
    canExecute: boolean;
    outputClass: RolePermissionOutputClass;
    outputAllowed: boolean | null;
    allowedActorRoles: readonly CVFRole[] | null;
  };
  contextScope: {
    scope: ExecutionIdentityContextScope;
    reason: string;
  };
  executionBoundary: {
    boundary: ExecutionIdentityBoundary;
    packPolicyApplied: boolean;
  };
  receiptOwnership: {
    ownerActorId: string;
    ownerRole: CVFRole | 'unknown';
    source: 'session_actor' | 'service_actor' | 'denied_actor';
  };
  decision: ExecutionIdentityDecisionState;
  reason: string;
}

export interface BuildExecutionIdentityDecisionInput {
  actorId: string;
  sessionRole?: string | null;
  templateId?: string | null;
  targetResource: string;
  resolvedRole: ResolvedExecutionCVFRole;
  resolvedOutputClass: ResolvedExecutionOutputClass;
  actorRoleGate?: ActorRoleGateResult;
  rolePermission?: RoleOutputPermissionCheck;
}

function resolveContextScope(role: CVFRole | null): ExecutionIdentityDecision['contextScope'] {
  switch (role) {
    case 'OPERATOR':
    case 'GOVERNOR':
    case 'HUMAN':
      return { scope: 'operator_workspace', reason: 'role_has_operator_level_execution_authority' };
    case 'BUILDER':
    case 'AI_AGENT':
      return { scope: 'builder_workspace', reason: 'role_has_builder_execution_authority' };
    case 'REVIEWER':
      return { scope: 'review_workspace', reason: 'role_has_review_execution_authority' };
    case 'SERVICE_AGENT':
      return { scope: 'service_execution_context', reason: 'service_token_bound_execution' };
    case 'OBSERVER':
      return { scope: 'observer_read_only', reason: 'observer_role_is_read_only_for_execution' };
    case 'ANALYST':
      return { scope: 'analysis_workspace', reason: 'role_has_analysis_execution_authority' };
    default:
      return { scope: 'unknown_scope', reason: 'execution_role_not_resolved' };
  }
}

function resolveBoundary(
  resolvedRole: ResolvedExecutionCVFRole,
  actorRoleGate?: ActorRoleGateResult,
): ExecutionIdentityDecision['executionBoundary'] {
  if (!resolvedRole.allowed || !resolvedRole.permissionRole) {
    return { boundary: 'role_resolution_denied', packPolicyApplied: false };
  }

  if (actorRoleGate?.allowedActorRoles) {
    return { boundary: 'governed_pack_actor_policy', packPolicyApplied: true };
  }

  return { boundary: 'template_execution_policy', packPolicyApplied: false };
}

function resolveDecisionReason(input: BuildExecutionIdentityDecisionInput): {
  decision: ExecutionIdentityDecisionState;
  reason: string;
} {
  if (!input.resolvedRole.allowed || !input.resolvedRole.permissionRole) {
    return {
      decision: 'denied',
      reason: input.resolvedRole.denialReason ?? 'execution_role_denied',
    };
  }

  if (input.actorRoleGate && !input.actorRoleGate.permitted) {
    return { decision: 'denied', reason: 'actor_role_not_permitted' };
  }

  if (input.rolePermission && !input.rolePermission.allowed) {
    return {
      decision: 'denied',
      reason: input.rolePermission.denialReason ?? 'role_output_not_permitted',
    };
  }

  return { decision: 'allowed', reason: 'execution_identity_authorized' };
}

export function buildExecutionIdentityDecision(
  input: BuildExecutionIdentityDecisionInput,
): ExecutionIdentityDecision {
  const { decision, reason } = resolveDecisionReason(input);
  const contextScope = resolveContextScope(input.resolvedRole.role);
  const executionBoundary = resolveBoundary(input.resolvedRole, input.actorRoleGate);
  const outputAllowed = input.rolePermission ? input.rolePermission.allowed : null;

  return {
    contractVersion: 'cvf.executionIdentity.v1',
    actorId: input.actorId,
    sessionRole: input.sessionRole ?? null,
    cvfRole: input.resolvedRole.role,
    source: input.resolvedRole.source,
    inputRole: input.resolvedRole.inputRole,
    templateId: input.templateId ?? null,
    targetResource: input.targetResource,
    authority: {
      canExecute: decision === 'allowed',
      outputClass: input.resolvedOutputClass.outputClass,
      outputAllowed,
      allowedActorRoles: input.actorRoleGate?.allowedActorRoles ?? null,
    },
    contextScope,
    executionBoundary,
    receiptOwnership: {
      ownerActorId: input.actorId,
      ownerRole: input.resolvedRole.role ?? 'unknown',
      source: input.resolvedRole.source === 'service_token'
        ? 'service_actor'
        : input.resolvedRole.source === 'denied'
          ? 'denied_actor'
          : 'session_actor',
    },
    decision,
    reason,
  };
}
