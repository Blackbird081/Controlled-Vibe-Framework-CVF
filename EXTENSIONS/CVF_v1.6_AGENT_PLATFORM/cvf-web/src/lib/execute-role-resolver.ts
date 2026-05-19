import type { CVFRole, RolePermissionOutputClass } from 'cvf-guard-contract';

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

const RBAC_TO_CVF_ROLE: Readonly<Record<string, CVFRole>> = {
  owner: 'OPERATOR',
  admin: 'OPERATOR',
  operator: 'OPERATOR',
  developer: 'BUILDER',
  reviewer: 'REVIEWER',
  viewer: 'OBSERVER',
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
