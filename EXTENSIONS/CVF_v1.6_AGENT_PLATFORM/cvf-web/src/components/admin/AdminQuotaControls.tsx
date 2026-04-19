'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/lib/i18n';

type TeamOption = {
  id: string;
  name: string;
};

type QuotaRuleSnapshot = {
  teamId: string;
  teamName: string;
  softCapUSD: number;
  hardCapUSD: number;
  period: 'monthly' | 'weekly' | 'daily';
  updatedAt: string;
};

type QuotaOverrideSnapshot = {
  teamId: string;
  teamName: string;
  reason: string;
  grantedAt: string;
  expiresAt: string;
};

type AdminQuotaControlsProps = {
  teams: TeamOption[];
  activeQuotaRules: QuotaRuleSnapshot[];
  activeOverrides: QuotaOverrideSnapshot[];
  canGrantOverride: boolean;
};

function formatUsd(value: number) {
  if (value < 0.01) return `$${value.toFixed(4)}`;
  if (value < 1) return `$${value.toFixed(3)}`;
  return `$${value.toFixed(2)}`;
}

export function AdminQuotaControls({
  teams,
  activeQuotaRules,
  activeOverrides,
  canGrantOverride,
}: AdminQuotaControlsProps) {
  const { language } = useLanguage();
  const vi = language === 'vi';
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const defaultTeamId = teams[0]?.id ?? '';
  const [policyForm, setPolicyForm] = useState({
    teamId: activeQuotaRules[0]?.teamId ?? defaultTeamId,
    softCapUSD: activeQuotaRules[0]?.softCapUSD ? String(activeQuotaRules[0].softCapUSD) : '25',
    hardCapUSD: activeQuotaRules[0]?.hardCapUSD ? String(activeQuotaRules[0].hardCapUSD) : '100',
    period: activeQuotaRules[0]?.period ?? 'monthly',
  });
  const [overrideForm, setOverrideForm] = useState({
    teamId: activeOverrides[0]?.teamId ?? defaultTeamId,
    reason: '',
  });
  const [feedback, setFeedback] = useState<{ tone: 'success' | 'error'; message: string } | null>(null);

  const activeOverrideTeams = useMemo(
    () => new Set(activeOverrides.map(override => override.teamId)),
    [activeOverrides],
  );

  const locale = vi ? 'vi-VN' : 'en-US';
  const periodLabel = (period: 'monthly' | 'weekly' | 'daily') => {
    if (!vi) return period;
    if (period === 'monthly') return 'hàng tháng';
    if (period === 'weekly') return 'hàng tuần';
    return 'hàng ngày';
  };

  async function postJson(url: string, method: 'POST' | 'DELETE', payload: Record<string, unknown>) {
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(result?.error || (vi ? 'Yêu cầu không thành công.' : 'Request failed.'));
    }
    return result;
  }

  function runAction(action: () => Promise<void>) {
    setFeedback(null);
    startTransition(() => {
      void action().catch((error) => {
        setFeedback({
          tone: 'error',
          message: error instanceof Error ? error.message : (vi ? 'Có lỗi không mong muốn khi gửi yêu cầu.' : 'Unexpected request error.'),
        });
      });
    });
  }

  return (
    <section className="space-y-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{vi ? 'Hạn mức đang áp dụng' : 'Active quota rules'}</h3>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            {vi
              ? 'Theo dõi ngân sách theo nhóm. Ngưỡng mềm dùng để cảnh báo, ngưỡng cứng sẽ chặn, còn quyền mở tạm thời của chủ sở hữu tự hết hạn sau 24 giờ.'
              : 'Manage team budgets with warning thresholds, hard stops, and 24-hour owner overrides.'}
          </p>
        </div>
        {feedback && (
          <div
            className={`rounded-xl px-4 py-2 text-sm ${
              feedback.tone === 'success'
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
            }`}
          >
            {feedback.message}
          </div>
        )}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr,0.85fr]">
        <div className="space-y-4">
          {activeQuotaRules.length === 0 && (
            <div className="rounded-xl border border-dashed border-gray-300 px-4 py-6 text-sm text-gray-500 dark:border-gray-700">
              {vi ? 'Chưa có hạn mức nào được thiết lập.' : 'No quota set.'}
            </div>
          )}
          {activeQuotaRules.map(rule => (
            <article
              key={rule.teamId}
              className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-4 dark:border-gray-800 dark:bg-gray-950/40"
            >
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="text-base font-semibold text-gray-900 dark:text-white">{rule.teamName}</div>
                  <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    {vi ? 'Cảnh báo' : 'Soft'} {formatUsd(rule.softCapUSD)} • {vi ? 'Chặn' : 'Hard'} {formatUsd(rule.hardCapUSD)} • {periodLabel(rule.period)}
                  </div>
                  <div className="mt-1 text-xs text-gray-500 dark:text-gray-500">
                    {vi ? 'Cập nhật lúc' : 'Updated'} {new Date(rule.updatedAt).toLocaleString(locale)}
                  </div>
                </div>
                {activeOverrideTeams.has(rule.teamId) && (
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                    {vi ? 'Đang mở tạm thời' : 'Emergency override active'}
                  </span>
                )}
              </div>
            </article>
          ))}
        </div>

        <div className="space-y-5">
          <form
            className="space-y-3 rounded-xl border border-gray-200 px-4 py-4 dark:border-gray-800"
            onSubmit={(event) => {
              event.preventDefault();
              runAction(async () => {
                await postJson('/api/admin/quota/policy', 'POST', {
                  teamId: policyForm.teamId,
                  softCapUSD: Number(policyForm.softCapUSD),
                  hardCapUSD: Number(policyForm.hardCapUSD),
                  period: policyForm.period,
                });
                setFeedback({ tone: 'success', message: vi ? 'Đã lưu hạn mức nhóm.' : 'Quota policy saved.' });
                router.refresh();
              });
            }}
          >
            <div className="text-sm font-semibold text-gray-900 dark:text-white">{vi ? 'Thiết lập hạn mức' : 'Set quota'}</div>
            <label className="block text-sm text-gray-700 dark:text-gray-300">
              <span className="mb-1 block">{vi ? 'Nhóm' : 'Team'}</span>
              <select
                className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-950"
                value={policyForm.teamId}
                onChange={event => setPolicyForm(current => ({ ...current, teamId: event.target.value }))}
                disabled={isPending}
              >
                {teams.map(team => (
                  <option key={team.id} value={team.id}>{team.name}</option>
                ))}
              </select>
            </label>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="block text-sm text-gray-700 dark:text-gray-300">
                <span className="mb-1 block">{vi ? 'Ngưỡng cảnh báo (USD)' : 'Soft cap (USD)'}</span>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-950"
                  value={policyForm.softCapUSD}
                  onChange={event => setPolicyForm(current => ({ ...current, softCapUSD: event.target.value }))}
                  disabled={isPending}
                />
              </label>
              <label className="block text-sm text-gray-700 dark:text-gray-300">
                <span className="mb-1 block">{vi ? 'Ngưỡng chặn (USD)' : 'Hard cap (USD)'}</span>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-950"
                  value={policyForm.hardCapUSD}
                  onChange={event => setPolicyForm(current => ({ ...current, hardCapUSD: event.target.value }))}
                  disabled={isPending}
                />
              </label>
            </div>
            <label className="block text-sm text-gray-700 dark:text-gray-300">
              <span className="mb-1 block">{vi ? 'Chu kỳ tính' : 'Billing period'}</span>
              <select
                className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-950"
                value={policyForm.period}
                onChange={event => setPolicyForm(current => ({
                  ...current,
                  period: event.target.value as 'monthly' | 'weekly' | 'daily',
                }))}
                disabled={isPending}
              >
                <option value="monthly">{vi ? 'Hàng tháng' : 'Monthly'}</option>
                <option value="weekly">{vi ? 'Hàng tuần' : 'Weekly'}</option>
                <option value="daily">{vi ? 'Hàng ngày' : 'Daily'}</option>
              </select>
            </label>
            <button
              type="submit"
              disabled={isPending || !policyForm.teamId}
              className="w-full rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
            >
              {isPending ? (vi ? 'Đang lưu...' : 'Saving...') : (vi ? 'Lưu hạn mức' : 'Save quota policy')}
            </button>
          </form>

          {canGrantOverride && (
            <form
              className="space-y-3 rounded-xl border border-amber-200 bg-amber-50/70 px-4 py-4 dark:border-amber-900/50 dark:bg-amber-950/20"
              onSubmit={(event) => {
                event.preventDefault();
                runAction(async () => {
                  await postJson('/api/admin/quota/override', 'POST', overrideForm);
                  setOverrideForm(current => ({ ...current, reason: '' }));
                  setFeedback({ tone: 'success', message: vi ? 'Đã cấp quyền mở tạm thời.' : 'Emergency override granted.' });
                  router.refresh();
                });
              }}
            >
              <div className="text-sm font-semibold text-gray-900 dark:text-white">{vi ? 'Mở tạm thời 24 giờ' : 'Emergency override'}</div>
              <label className="block text-sm text-gray-700 dark:text-gray-300">
                <span className="mb-1 block">{vi ? 'Nhóm' : 'Team'}</span>
                <select
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-950"
                  value={overrideForm.teamId}
                  onChange={event => setOverrideForm(current => ({ ...current, teamId: event.target.value }))}
                  disabled={isPending}
                >
                  {teams.map(team => (
                    <option key={team.id} value={team.id}>{team.name}</option>
                  ))}
                </select>
              </label>
              <label className="block text-sm text-gray-700 dark:text-gray-300">
                <span className="mb-1 block">{vi ? 'Lý do' : 'Reason'}</span>
                <textarea
                  rows={3}
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-950"
                  value={overrideForm.reason}
                  onChange={event => setOverrideForm(current => ({ ...current, reason: event.target.value }))}
                  disabled={isPending}
                  placeholder={vi ? 'Mô tả lý do cần mở tạm thời.' : 'Explain the operational reason for the temporary unblock.'}
                />
              </label>
              <button
                type="submit"
                disabled={isPending || !overrideForm.teamId || !overrideForm.reason.trim()}
                className="w-full rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isPending ? (vi ? 'Đang gửi...' : 'Submitting...') : (vi ? 'Cấp quyền mở 24 giờ' : 'Grant 24h override')}
              </button>
            </form>
          )}

          {canGrantOverride && activeOverrides.length > 0 && (
            <div className="space-y-3 rounded-xl border border-gray-200 px-4 py-4 dark:border-gray-800">
              <div className="text-sm font-semibold text-gray-900 dark:text-white">{vi ? 'Các quyền mở tạm đang hiệu lực' : 'Active overrides'}</div>
              {activeOverrides.map(override => (
                <div
                  key={`${override.teamId}:${override.expiresAt}`}
                  className="rounded-xl bg-gray-50 px-4 py-3 dark:bg-gray-950/40"
                >
                  <div className="font-medium text-gray-900 dark:text-white">{override.teamName}</div>
                  <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">{override.reason}</div>
                  <div className="mt-1 text-xs text-gray-500 dark:text-gray-500">
                    {vi ? 'Cấp lúc' : 'Granted'} {new Date(override.grantedAt).toLocaleString(locale)} • {vi ? 'Hết hạn' : 'Expires'} {new Date(override.expiresAt).toLocaleString(locale)}
                  </div>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => {
                      runAction(async () => {
                        await postJson('/api/admin/quota/override', 'DELETE', {
                          teamId: override.teamId,
                          reason: vi ? 'Chủ sở hữu đã thu hồi quyền mở tạm từ trang quản trị.' : 'Owner revoked override from the admin workspace.',
                        });
                        setFeedback({ tone: 'success', message: vi ? 'Đã thu hồi quyền mở tạm.' : 'Override revoked.' });
                        router.refresh();
                      });
                    }}
                    className="mt-3 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
                  >
                    {vi ? 'Thu hồi quyền mở' : 'Revoke override'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
