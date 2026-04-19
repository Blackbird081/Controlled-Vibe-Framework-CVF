'use client';

import { useLanguage } from '@/lib/i18n';
import { AdminQuotaControls } from '@/components/admin/AdminQuotaControls';

function formatUsd(value: number) {
  if (value < 0.01) return `$${value.toFixed(4)}`;
  if (value < 1) return `$${value.toFixed(3)}`;
  return `$${value.toFixed(2)}`;
}

type TopRow = { key: string; label: string; cost: number; requests: number; tokens: number };
type TimePoint = { date: string; cost: number; requests: number };

export type FinOpsSummaryProps = {
  totalCostUSD: number;
  totalRequests: number;
  totalTokens: number;
  timeSeries: TimePoint[];
  topUsers: TopRow[];
  topTeams: TopRow[];
  topSkills: TopRow[];
};

export type QuotaRuleView = {
  teamId: string; teamName: string; softCapUSD: number; hardCapUSD: number;
  period: 'monthly' | 'weekly' | 'daily'; updatedAt: string;
};

export type QuotaOverrideView = {
  teamId: string; teamName: string; reason: string;
  grantedAt: string; expiresAt: string;
};

interface Props {
  summary: FinOpsSummaryProps;
  teams: Array<{ id: string; name: string }>;
  activeQuotaRules: QuotaRuleView[];
  activeOverrides: QuotaOverrideView[];
  canGrantOverride: boolean;
}

export function AdminFinOpsBody({ summary, teams, activeQuotaRules, activeOverrides, canGrantOverride }: Props) {
  const { language } = useLanguage();
  const vi = language === 'vi';

  const topSections = [
    { en: 'Top Users',  vi: 'Người dùng hàng đầu',  rows: summary.topUsers },
    { en: 'Top Teams',  vi: 'Nhóm hàng đầu',         rows: summary.topTeams },
    { en: 'Top Skills', vi: 'Kỹ năng hàng đầu',      rows: summary.topSkills },
  ];

  return (
    <div className="space-y-6">
      <div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {vi ? 'Giai đoạn B • Chỉ đọc' : 'Phase B • Read-only'}
        </div>
        <h2 className="mt-1 text-3xl font-bold text-gray-900 dark:text-white">
          {vi ? 'Bảng tài chính' : 'FinOps Dashboard'}
        </h2>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          {vi
            ? 'Dữ liệu chi phí từ luồng thực thi có quản trị, phân nhóm theo người dùng, nhóm và kỹ năng khai báo.'
            : 'Cost telemetry emitted from the governed execute path, grouped by user, team, and declared skill.'}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {([
          { en: 'Total Cost',     vi2: 'Tổng chi phí',  val: formatUsd(summary.totalCostUSD) },
          { en: 'Total Requests', vi2: 'Tổng yêu cầu',  val: String(summary.totalRequests) },
          { en: 'Total Tokens',   vi2: 'Tổng token',     val: summary.totalTokens.toLocaleString() },
        ] as const).map(stat => (
          <div key={stat.en} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900">
            <div className="text-sm text-gray-500">{vi ? stat.vi2 : stat.en}</div>
            <div className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{stat.val}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr,1fr,1fr,1fr]">
        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {vi ? 'Lịch sử chi phí hàng ngày' : 'Daily Cost Timeline'}
          </h3>
          <div className="mt-4 space-y-3">
            {summary.timeSeries.length === 0 && (
              <div className="rounded-xl border border-dashed border-gray-300 px-4 py-8 text-sm text-gray-500 dark:border-gray-700">
                {vi ? 'Chưa có sự kiện chi phí. Hãy chạy luồng thực thi để thu thập dữ liệu.' : 'No cost events recorded yet. Run the execute flow to populate telemetry.'}
              </div>
            )}
            {summary.timeSeries.map(point => (
              <div key={point.date}>
                <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-300">
                  <span>{point.date}</span>
                  <span>{formatUsd(point.cost)} • {point.requests} {vi ? 'yêu cầu' : 'req'}</span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-gray-100 dark:bg-gray-800">
                  <div
                    className="h-2 rounded-full bg-emerald-500"
                    style={{ width: `${summary.totalCostUSD > 0 ? Math.max(4, (point.cost / summary.totalCostUSD) * 100) : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {topSections.map(section => (
          <section key={section.en} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {vi ? section.vi : section.en}
            </h3>
            <div className="mt-4 space-y-3">
              {section.rows.length === 0 && (
                <div className="text-sm text-gray-500">{vi ? 'Chưa có dữ liệu.' : 'No telemetry yet.'}</div>
              )}
              {section.rows.map(row => (
                <div key={row.key} className="rounded-xl bg-gray-50 px-4 py-3 dark:bg-gray-800">
                  <div className="font-medium text-gray-900 dark:text-white">{row.label}</div>
                  <div className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                    {formatUsd(row.cost)} • {row.requests} {vi ? 'yêu cầu' : 'req'} • {row.tokens.toLocaleString()} tokens
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      <AdminQuotaControls
        teams={teams}
        activeQuotaRules={activeQuotaRules}
        activeOverrides={activeOverrides}
        canGrantOverride={canGrantOverride}
      />
    </div>
  );
}
