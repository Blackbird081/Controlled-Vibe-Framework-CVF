'use client';

import { useEffect, useMemo, useState } from 'react';
import type { AnalyticsEvent } from '@/lib/analytics';
import {
  computeEvtTaskRecoveryStats,
  type EvtFalsePositiveStats,
} from '@/lib/evt-operator-metrics';

interface EvtGovernanceHealthPanelProps {
  events: AnalyticsEvent[];
  isVi: boolean;
}

type FalsePositiveState =
  | { status: 'loading'; stats: null; error: null }
  | { status: 'ready'; stats: EvtFalsePositiveStats; error: null }
  | { status: 'error'; stats: null; error: string };

function formatPct(value: number | null): string {
  return value === null ? 'N/A' : `${value.toFixed(1)}%`;
}

export function EvtGovernanceHealthPanel({ events, isVi }: EvtGovernanceHealthPanelProps) {
  const [fpState, setFpState] = useState<FalsePositiveState>({
    status: 'loading',
    stats: null,
    error: null,
  });

  const taskRecoveryStats = useMemo(() => computeEvtTaskRecoveryStats(events), [events]);

  useEffect(() => {
    let cancelled = false;

    async function loadFalsePositiveStats() {
      setFpState({ status: 'loading', stats: null, error: null });
      try {
        const response = await fetch('/api/governance/false-positive-report');
        const json = await response.json();
        if (cancelled) return;
        if (!response.ok || !json?.success) {
          throw new Error(json?.error || 'Unable to load false-positive stats.');
        }
        setFpState({ status: 'ready', stats: json.stats as EvtFalsePositiveStats, error: null });
      } catch (error) {
        if (!cancelled) {
          setFpState({
            status: 'error',
            stats: null,
            error: error instanceof Error ? error.message : 'Unable to load false-positive stats.',
          });
        }
      }
    }

    void loadFalsePositiveStats();
    return () => {
      cancelled = true;
    };
  }, []);

  const labels = {
    title: isVi ? 'EVT Operator Signals' : 'EVT Operator Signals',
    subtitle: isVi
      ? 'False-positive rate từ JSONL và recovery/abandonment từ analytics cục bộ.'
      : 'False-positive rate from JSONL plus recovery/abandonment from local analytics.',
    observed: isVi ? 'Observed decisions' : 'Observed decisions',
    fpRate: isVi ? 'False-positive rate' : 'False-positive rate',
    taskRecovery: isVi ? 'Task recovery' : 'Task recovery',
    abandonment: isVi ? 'Abandonment' : 'Abandonment',
    loading: isVi ? 'Đang tải FP evidence...' : 'Loading FP evidence...',
    noFpData: isVi ? 'No reportable FP evidence yet.' : 'No reportable FP evidence yet.',
    lowN: isVi ? 'Low N: chưa dùng cho rollout claim.' : 'Low N: do not use for rollout claims.',
    evidenceMode: isVi ? 'Evidence mode' : 'Evidence mode',
    prompts: isVi ? 'prompts' : 'prompts',
    started: isVi ? 'started' : 'started',
  };

  return (
    <section className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700" data-testid="evt-governance-health-panel">
      <div className="flex flex-col gap-1 mb-4">
        <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{labels.title}</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400">{labels.subtitle}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
          <div className="text-xs text-gray-500">{labels.observed}</div>
          <div className="text-lg font-semibold text-gray-900 dark:text-white">
            {fpState.status === 'ready' ? fpState.stats.observedReportableDecisions : '-'}
          </div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
          <div className="text-xs text-gray-500">{labels.fpRate}</div>
          <div className="text-lg font-semibold text-gray-900 dark:text-white">
            {fpState.status === 'ready' ? formatPct(fpState.stats.falsePositiveRatePct) : '-'}
          </div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
          <div className="text-xs text-gray-500">{labels.taskRecovery}</div>
          <div className="text-lg font-semibold text-gray-900 dark:text-white">
            {formatPct(taskRecoveryStats.recoveryRatePct)}
          </div>
          <div className="text-xs text-gray-400">
            {taskRecoveryStats.started}/{taskRecoveryStats.prompted} {labels.started}
          </div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
          <div className="text-xs text-gray-500">{labels.abandonment}</div>
          <div className="text-lg font-semibold text-gray-900 dark:text-white">
            {formatPct(taskRecoveryStats.abandonmentRatePct)}
          </div>
          <div className="text-xs text-gray-400">
            {taskRecoveryStats.prompted} {labels.prompts}
          </div>
        </div>
      </div>

      <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
        {fpState.status === 'loading' && labels.loading}
        {fpState.status === 'error' && fpState.error}
        {fpState.status === 'ready' && (
          <>
            {fpState.stats.observedReportableDecisions === 0 ? labels.noFpData : `${fpState.stats.falsePositiveReports}/${fpState.stats.observedReportableDecisions} reports.`}
            {' '}
            {labels.evidenceMode}: {fpState.stats.evidenceMode}.
            {' '}
            {fpState.stats.lowNCaveat ? labels.lowN : null}
          </>
        )}
      </div>
    </section>
  );
}
