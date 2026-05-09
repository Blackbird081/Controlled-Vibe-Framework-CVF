import type { TeamRole } from 'cvf-guard-contract/enterprise';

export const TEAM_ROLES: TeamRole[] = ['owner', 'admin', 'developer', 'reviewer', 'viewer'];
export const ADMIN_ROLES: TeamRole[] = ['owner', 'admin'];

export function normalizeTeamRole(role?: string | null): TeamRole | null {
  if (!role) return null;
  return TEAM_ROLES.includes(role as TeamRole) ? (role as TeamRole) : null;
}

export function canAccessAdmin(role?: string | null): boolean {
  const normalized = normalizeTeamRole(role);
  return normalized ? ADMIN_ROLES.includes(normalized) : false;
}
