import type { CVFRole, RolePermissionOutputClass } from 'cvf-guard-contract';
import appBuilderPolicy from './governed-packs/app_builder_complete/execution.policy.json';
import documentationPolicy from './governed-packs/documentation/execution.policy.json';
import strategyAnalysisPolicy from './governed-packs/strategy_analysis/execution.policy.json';

export type ExecutionBoundaryRole = CVFRole;

export interface ExecutionSessionRoleLike {
  role?: string | null;
}

export interface ResolvedExecutionCVFRole {
  allowed: boolean;
  role: ExecutionBoundaryRole | null;
  permissionRole: CVFRole | null;
  source: 'service_token' | 'session' | 'denied';
  inputRole: string | null;
  denialReason?: string;
}

export interface ResolvedExecutionOutputClass {
  outputClass: RolePermissionOutputClass;
  source: 'template_id' | 'template_category' | 'default';
}

export interface ActorRoleGateResult {
  permitted: boolean;
  result: 'permitted' | 'rejected' | 'not_applicable';
  allowedActorRoles?: readonly CVFRole[];
}

type ActorRolePolicyJson = { allowedActorRoles?: string[] };

const RBAC_TO_CVF_ROLE: Readonly<Record<string, CVFRole>> = {
  owner: 'OPERATOR',
  admin: 'OPERATOR',
  developer: 'BUILDER',
  reviewer: 'REVIEWER',
  viewer: 'OBSERVER',
};

const KNOWN_CVF_ROLES = new Set<string>([
  'OBSERVER',
  'ANALYST',
  'BUILDER',
  'REVIEWER',
  'GOVERNOR',
  'HUMAN',
  'AI_AGENT',
  'OPERATOR',
  'SERVICE_AGENT',
]);

const GOVERNED_PACK_POLICIES: Readonly<Record<string, ActorRolePolicyJson>> = {
  app_builder_complete: appBuilderPolicy,
  documentation: documentationPolicy,
  strategy_analysis: strategyAnalysisPolicy,
};

export function resolveExecutionCVFRole(
  session: ExecutionSessionRoleLike | null | undefined,
  isServiceAllowed: boolean,
): ResolvedExecutionCVFRole {
  if (isServiceAllowed) {
    return {
      allowed: true,
      role: 'SERVICE_AGENT',
      permissionRole: 'SERVICE_AGENT',
      source: 'service_token',
      inputRole: 'service',
    };
  }

  const inputRole = typeof session?.role === 'string' ? session.role.trim().toLowerCase() : '';
  const permissionRole = inputRole ? RBAC_TO_CVF_ROLE[inputRole] : undefined;

  if (!permissionRole) {
    return {
      allowed: false,
      role: null,
      permissionRole: null,
      source: 'denied',
      inputRole: inputRole || null,
      denialReason: inputRole
        ? `Unsupported execution role: ${inputRole}.`
        : 'Missing execution role.',
    };
  }

  return {
    allowed: true,
    role: permissionRole,
    permissionRole,
    source: 'session',
    inputRole,
  };
}

export function resolveExecutionAllowedActorRoles(templateId?: string | null): readonly CVFRole[] | undefined {
  const normalizedTemplateId = templateId?.trim();
  const roles = normalizedTemplateId ? GOVERNED_PACK_POLICIES[normalizedTemplateId]?.allowedActorRoles : undefined;
  return roles?.filter((role): role is CVFRole => KNOWN_CVF_ROLES.has(role));
}

export function validateActorRoleGate(
  resolvedRole: CVFRole | null | undefined,
  allowedActorRoles: readonly CVFRole[],
): { permitted: boolean } {
  return { permitted: Boolean(resolvedRole && allowedActorRoles.includes(resolvedRole)) };
}

export function evaluateExecutionActorRoleGate(
  templateId: string | null | undefined,
  resolvedRole: CVFRole | null | undefined,
): ActorRoleGateResult {
  const allowedActorRoles = resolveExecutionAllowedActorRoles(templateId);
  if (!allowedActorRoles) {
    return { permitted: true, result: 'not_applicable' };
  }
  const gate = validateActorRoleGate(resolvedRole, allowedActorRoles);
  return { ...gate, result: gate.permitted ? 'permitted' : 'rejected', allowedActorRoles };
}

export function resolveExecutionOutputClass(
  templateId?: string | null,
  templateCategory?: string | null,
  mode?: string | null,
): ResolvedExecutionOutputClass {
  const normalizedTemplateId = templateId?.trim();
  if (normalizedTemplateId === 'app_builder_complete') {
    return { outputClass: 'artifact', source: 'template_id' };
  }

  const normalizedMode = mode?.trim().toLowerCase();
  if (normalizedMode === 'code') {
    return { outputClass: 'code_patch', source: 'default' };
  }

  return { outputClass: 'summary', source: 'default' };
}
