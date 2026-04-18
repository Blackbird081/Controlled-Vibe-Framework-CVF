import { AdminQuotaControls } from '@/components/admin/AdminQuotaControls';
import { getFinOpsSummary } from '@/lib/control-plane-events';
import { requireAdminSession } from '@/lib/admin-session';
import { MOCK_TEAMS } from '@/lib/mock-enterprise-db';
import { getAllActiveQuotaOverrides, getAllActiveQuotaPolicies } from '@/lib/policy-reader';

function formatUsd(value: number) {
  if (value < 0.01) return `$${value.toFixed(4)}`;
  if (value < 1) return `$${value.toFixed(3)}`;
  return `$${value.toFixed(2)}`;
}

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
    <div className="space-y-6">
      <div>
        <div className="text-sm text-gray-500 dark:text-gray-400">Phase B • Read-only</div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mt-1">FinOps Dashboard</h2>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Cost telemetry emitted from the governed execute path, grouped by user, team, and declared skill.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900">
          <div className="text-sm text-gray-500">Total Cost</div>
          <div className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{formatUsd(summary.totalCostUSD)}</div>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900">
          <div className="text-sm text-gray-500">Total Requests</div>
          <div className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{summary.totalRequests}</div>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900">
          <div className="text-sm text-gray-500">Total Tokens</div>
          <div className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{summary.totalTokens.toLocaleString()}</div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr,1fr,1fr,1fr]">
        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Daily Cost Timeline</h3>
          <div className="mt-4 space-y-3">
            {summary.timeSeries.length === 0 && (
              <div className="rounded-xl border border-dashed border-gray-300 px-4 py-8 text-sm text-gray-500 dark:border-gray-700">
                No cost events recorded yet. Run the execute flow to populate telemetry.
              </div>
            )}
            {summary.timeSeries.map(point => (
              <div key={point.date}>
                <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-300">
                  <span>{point.date}</span>
                  <span>{formatUsd(point.cost)} • {point.requests} req</span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-gray-100 dark:bg-gray-800">
                  <div
                    className="h-2 rounded-full bg-emerald-500"
                    style={{
                      width: `${summary.totalCostUSD > 0 ? Math.max(4, (point.cost / summary.totalCostUSD) * 100) : 0}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {[
          { title: 'Top Users', rows: summary.topUsers },
          { title: 'Top Teams', rows: summary.topTeams },
          { title: 'Top Skills', rows: summary.topSkills },
        ].map(section => (
          <section key={section.title} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{section.title}</h3>
            <div className="mt-4 space-y-3">
              {section.rows.length === 0 && (
                <div className="text-sm text-gray-500">No telemetry yet.</div>
              )}
              {section.rows.map(row => (
                <div key={row.key} className="rounded-xl bg-gray-50 px-4 py-3 dark:bg-gray-800">
                  <div className="font-medium text-gray-900 dark:text-white">{row.label}</div>
                  <div className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                    {formatUsd(row.cost)} • {row.requests} req • {row.tokens.toLocaleString()} tokens
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      <AdminQuotaControls
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
    </div>
  );
}
