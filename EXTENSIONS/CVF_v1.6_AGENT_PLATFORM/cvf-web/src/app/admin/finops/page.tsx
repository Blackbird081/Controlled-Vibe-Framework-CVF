import { AdminFinOpsBody } from '@/components/admin/AdminFinOpsBody';
import { getFinOpsSummary } from '@/lib/control-plane-events';
import { requireAdminSession } from '@/lib/admin-session';
import { MOCK_TEAMS } from '@/lib/mock-enterprise-db';
import { getAllActiveQuotaOverrides, getAllActiveQuotaPolicies } from '@/lib/policy-reader';

export default async function AdminFinOpsPage() {
  const session = await requireAdminSession('/admin/finops');
  const summary = await getFinOpsSummary();
  const [activeQuotaRules, activeOverrides] = await Promise.all([
    getAllActiveQuotaPolicies(),
    getAllActiveQuotaOverrides(),
  ]);
  const teamsById = new Map(MOCK_TEAMS.map(team => [team.id, team]));
  const userRole = session.role ?? 'admin';

  return (
    <AdminFinOpsBody
      summary={{
        totalCostUSD: summary.totalCostUSD,
        totalRequests: summary.totalRequests,
        totalTokens: summary.totalTokens,
        timeSeries: summary.timeSeries,
        topUsers: summary.topUsers,
        topTeams: summary.topTeams,
        topSkills: summary.topSkills,
      }}
      teams={MOCK_TEAMS.map(team => ({ id: team.id, name: team.name }))}
      activeQuotaRules={activeQuotaRules.map(rule => ({
        teamId: rule.teamId,
        teamName: teamsById.get(rule.teamId)?.name ?? rule.teamId,
        softCapUSD: rule.softCapUSD,
        hardCapUSD: rule.hardCapUSD,
        period: rule.period,
        updatedAt: rule.setAt || rule.timestamp,
      }))}
      activeOverrides={activeOverrides.map(override => ({
        teamId: override.teamId,
        teamName: teamsById.get(override.teamId)?.name ?? override.teamId,
        reason: override.reason,
        grantedAt: override.grantedAt,
        expiresAt: override.expiresAt,
      }))}
      canGrantOverride={userRole === 'owner'}
    />
  );
}
