import type { AdminSession } from '@/lib/admin-session';
import { MOCK_ORGANIZATIONS, MOCK_TEAMS } from '@/lib/mock-enterprise-db';

export type AdminResourceScope = {
  orgId: string;
  teamId: string | null;
};

export type AdminResourceScopeResult =
  | { ok: true; scope: AdminResourceScope }
  | { ok: false; status: 400 | 403; error: string };

export type AdminResourceAccessResult =
  | { ok: true; scope: AdminResourceScope }
  | { ok: false; status: 403; error: string };

function normalizeScopeValue(value?: string | null): string {
  return typeof value === 'string' ? value.trim() : '';
}

function isBreakGlassOrOwner(session: AdminSession): boolean {
  return session.authMode === 'break-glass' || session.role === 'owner' || session.realRole === 'owner';
}

export function canAdminAccessResourceScope(
  session: AdminSession,
  input: { orgId?: string | null; teamId?: string | null },
): AdminResourceAccessResult {
  const orgId = normalizeScopeValue(input.orgId);
  const teamId = normalizeScopeValue(input.teamId);

  if (!orgId || isBreakGlassOrOwner(session) || orgId === session.orgId) {
    return {
      ok: true,
      scope: {
        orgId: orgId || session.orgId,
        teamId: teamId || null,
      },
    };
  }

  return {
    ok: false,
    status: 403,
    error: 'Admin resource scope is outside the current organization.',
  };
}

export function resolveAdminResourceScope(
  session: AdminSession,
  input: { orgId?: string | null; teamId?: string | null },
): AdminResourceScopeResult {
  const requestedOrgId = normalizeScopeValue(input.orgId);
  const requestedTeamId = normalizeScopeValue(input.teamId);
  const team = requestedTeamId
    ? MOCK_TEAMS.find(candidate => candidate.id === requestedTeamId)
    : undefined;

  if (requestedTeamId && !team) {
    return { ok: false, status: 400, error: 'Unknown teamId.' };
  }

  const resolvedOrgId = team?.orgId ?? (requestedOrgId || session.orgId);
  if (!MOCK_ORGANIZATIONS.some(org => org.id === resolvedOrgId)) {
    return { ok: false, status: 400, error: 'Unknown orgId.' };
  }

  if (team && requestedOrgId && requestedOrgId !== team.orgId) {
    return { ok: false, status: 400, error: 'teamId does not belong to the selected orgId.' };
  }

  if (!isBreakGlassOrOwner(session) && resolvedOrgId !== session.orgId) {
    return { ok: false, status: 403, error: 'Admin resource scope is outside the current organization.' };
  }

  return {
    ok: true,
    scope: {
      orgId: resolvedOrgId,
      teamId: team?.id ?? (requestedTeamId || null),
    },
  };
}
