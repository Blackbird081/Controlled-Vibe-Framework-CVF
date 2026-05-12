'use client';

import { useState, useEffect } from 'react';
import type { QBSSummary, QBSRunSummary, QBSFamilyDelta } from '@/app/api/benchmark/qbs-summary/route';

const FAMILY_LABELS: Record<string, string> = {
    negative_controls: 'Negative Controls',
    builder_handoff_technical_planning: 'Builder Handoff',
    normal_productivity_app_planning: 'Normal Planning',
    documentation_operations: 'Documentation',
    cost_quota_provider_selection: 'Cost / Provider',
    high_risk_security_secrets: 'Security / Secrets',
    bypass_adversarial_governance: 'Bypass / Adversarial',
    ambiguous_noncoder_requests: 'Ambiguous Noncoder',
};

function KappaBar({ kappa }: { kappa: number | null }) {
    if (kappa === null) return <span className="text-gray-400 text-xs">—</span>;
    const pct = Math.round(kappa * 100);
    const pass = kappa >= 0.60;
    return (
        <div className="flex items-center gap-2">
            <div className="w-20 h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                <div
                    className={`h-full rounded-full ${pass ? 'bg-emerald-500' : 'bg-red-400'}`}
                    style={{ width: `${Math.min(pct, 100)}%` }}
                />
            </div>
            <span className={`text-xs font-mono ${pass ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
                {kappa.toFixed(3)}
            </span>
        </div>
    );
}

function DeltaCell({ delta }: { delta: number | null }) {
    if (delta === null) return <span className="text-gray-400 text-xs">—</span>;
    const pos = delta >= 0;
    return (
        <span className={`text-xs font-mono font-semibold ${pos ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
            {delta > 0 ? '+' : ''}{delta.toFixed(3)}
        </span>
    );
}

function RunTable({ runs }: { runs: QBSRunSummary[] }) {
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b border-gray-200 dark:border-white/[0.07]">
                        <th className="text-left py-2 pr-4 text-xs font-semibold text-gray-500 dark:text-gray-400">Run</th>
                        <th className="text-left py-2 pr-4 text-xs font-semibold text-gray-500 dark:text-gray-400">Hard Gates</th>
                        <th className="text-left py-2 pr-4 text-xs font-semibold text-gray-500 dark:text-gray-400">Reviewer kappa</th>
                        <th className="text-left py-2 pr-4 text-xs font-semibold text-gray-500 dark:text-gray-400">CFG-B delta</th>
                        <th className="text-left py-2 text-xs font-semibold text-gray-500 dark:text-gray-400">L4</th>
                    </tr>
                </thead>
                <tbody>
                    {runs.map(r => (
                        <tr key={r.run} className="border-b border-gray-100 dark:border-white/[0.04] last:border-0">
                            <td className="py-2 pr-4 font-mono font-semibold text-gray-800 dark:text-gray-100">{r.run}</td>
                            <td className="py-2 pr-4">
                                {r.hard_gates_pass
                                    ? <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">PASS</span>
                                    : <span className="text-xs text-red-500 font-medium">FAIL</span>}
                            </td>
                            <td className="py-2 pr-4"><KappaBar kappa={r.kappa} /></td>
                            <td className="py-2 pr-4"><DeltaCell delta={r.median_delta_b_a1} /></td>
                            <td className="py-2">
                                {r.l4_pass
                                    ? <span className="text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 rounded font-medium">PASS</span>
                                    : <span className="text-xs bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-1.5 py-0.5 rounded font-medium">FAIL</span>}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function FamilyChart({ deltas }: { deltas: QBSFamilyDelta[] }) {
    if (!deltas.length) return <p className="text-sm text-gray-500">No family data available.</p>;
    const minVal = Math.min(...deltas.map(d => d.median_delta_b_vs_a1));
    const scale = Math.abs(minVal) || 0.5;

    return (
        <div className="space-y-2">
            {deltas.map(d => {
                const label = FAMILY_LABELS[d.family] ?? d.family;
                const pct = Math.round((Math.abs(d.median_delta_b_vs_a1) / scale) * 100);
                const neg = d.median_delta_b_vs_a1 < 0;
                return (
                    <div key={d.family} className="flex items-center gap-3">
                        <span className="w-36 text-xs text-gray-600 dark:text-gray-400 truncate shrink-0">{label}</span>
                        <div className="flex-1 h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                            <div
                                className={`h-full rounded-full ${neg ? 'bg-red-400' : 'bg-emerald-400'}`}
                                style={{ width: `${pct}%` }}
                            />
                        </div>
                        <span className={`w-12 text-right text-xs font-mono ${neg ? 'text-red-500 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                            {d.median_delta_b_vs_a1 > 0 ? '+' : ''}{d.median_delta_b_vs_a1.toFixed(3)}
                        </span>
                    </div>
                );
            })}
            <p className="text-xs text-gray-400 dark:text-gray-500 pt-1">
                CFG-B vs CFG-A1 median quality delta · R10 · negative = governance overhead reduced quality
            </p>
        </div>
    );
}

export function QBSBenchmarkPanel() {
    const [data, setData] = useState<QBSSummary | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetch('/api/benchmark/qbs-summary')
            .then(r => r.json())
            .then(setData)
            .catch(() => setError('Failed to load benchmark data.'));
    }, []);

    if (error) {
        return <p className="text-sm text-red-500">{error}</p>;
    }
    if (!data) {
        return <p className="text-sm text-gray-500 animate-pulse">Loading benchmark data…</p>;
    }

    return (
        <div className="space-y-6">
            {/* Status badge */}
            <div className="flex flex-wrap items-start gap-3">
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium ${
                    data.suspended
                        ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40'
                        : 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300'
                }`}>
                    <span>{data.suspended ? '⏸' : '▶'}</span>
                    <span>{data.suspended ? 'Reruns suspended — reviewer model upgrade required' : 'Active'}</span>
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono bg-gray-100 dark:bg-white/[0.06] text-gray-600 dark:text-gray-300">
                    {data.latest_status}
                </div>
            </div>

            {/* Run history table */}
            <div>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">
                    Run History (R5 – R10)
                </h3>
                <div className="bg-gray-50 dark:bg-white/[0.03] rounded-xl border border-gray-200 dark:border-white/[0.07] p-4">
                    <RunTable runs={data.runs} />
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-3">
                        Kappa gate ≥ 0.60 · Hard gates required before reviewer scoring · L4 requires agreement PASS + delta ≥ 0
                    </p>
                </div>
            </div>

            {/* Family delta chart */}
            <div>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">
                    Per-family Quality Delta — R10
                </h3>
                <div className="bg-gray-50 dark:bg-white/[0.03] rounded-xl border border-gray-200 dark:border-white/[0.07] p-4">
                    <FamilyChart deltas={data.family_deltas_r10} />
                </div>
            </div>

            {/* Suspension notice */}
            {data.suspended && (
                <div className="rounded-xl border border-amber-200 dark:border-amber-800/40 bg-amber-50 dark:bg-amber-950/20 p-4 text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                    <span className="font-semibold">Why suspended: </span>
                    {data.suspension_reason}
                </div>
            )}
        </div>
    );
}
