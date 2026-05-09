'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n';

export interface BrandDriftData {
    driftScore: number;   // 0-100
    status: 'FROZEN' | 'COMPLIANT' | 'DRIFTING';
    changedFields: string[];
    lastChecked: string;
}

interface BrandDriftIndicatorProps {
    data?: BrandDriftData;
    compact?: boolean;
}

const LABELS = {
    vi: {
        title: 'Brand Guardian',
        frozen: '🔒 Đã khóa',
        compliant: '✅ Tuân thủ',
        drifting: '⚠️ Đang lệch',
        drift: 'Lệch',
        changedFields: 'Trường thay đổi',
        lastChecked: 'Kiểm tra lần cuối',
        loading: 'Đang kiểm tra...',
        noDrift: 'Không có thay đổi',
    },
    en: {
        title: 'Brand Guardian',
        frozen: '🔒 Frozen',
        compliant: '✅ Compliant',
        drifting: '⚠️ Drifting',
        drift: 'Drift',
        changedFields: 'Changed fields',
        lastChecked: 'Last checked',
        loading: 'Checking...',
        noDrift: 'No changes detected',
    },
};

function getDriftColor(score: number): string {
    if (score < 20) return 'bg-green-500';
    if (score <= 50) return 'bg-yellow-500';
    return 'bg-red-500';
}

function getStatusBadge(status: string, l: typeof LABELS.en) {
    switch (status) {
        case 'FROZEN': return { text: l.frozen, bg: 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' };
        case 'COMPLIANT': return { text: l.compliant, bg: 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300' };
        default: return { text: l.drifting, bg: 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300' };
    }
}

export function BrandDriftIndicator({ data: propData, compact = false }: BrandDriftIndicatorProps) {
    const { language } = useLanguage();
    const l = LABELS[language];
    const [data, setData] = useState<BrandDriftData | null>(propData || null);
    const [loading, setLoading] = useState(!propData);

    useEffect(() => {
        if (propData) {
            setData(propData);
            return;
        }
        let cancelled = false;
        async function fetchDrift() {
            try {
                const res = await fetch('/api/governance/brand-drift');
                if (!res.ok) throw new Error(`${res.status}`);
                const json = await res.json();
                if (!cancelled) {
                    setData({
                        driftScore: json.data?.drift_score ?? 0,
                        status: json.data?.status ?? 'COMPLIANT',
                        changedFields: json.data?.changed_fields ?? [],
                        lastChecked: json.data?.last_checked ?? new Date().toISOString(),
                    });
                }
            } catch {
                if (!cancelled) {
                    setData({ driftScore: 0, status: 'COMPLIANT', changedFields: [], lastChecked: new Date().toISOString() });
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        }
        fetchDrift();
        return () => { cancelled = true; };
    }, [propData]);

    if (loading) return <p className="text-xs text-gray-400">{l.loading}</p>;
    if (!data) return null;

    const badge = getStatusBadge(data.status, l);

    if (compact) {
        return (
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full ${badge.bg}`}>
                {badge.text} {data.driftScore > 0 && `${data.driftScore}%`}
            </span>
        );
    }

    return (
        <div className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 space-y-2">
            <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                    🛡️ {l.title}
                </h4>
                <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${badge.bg}`}>
                    {badge.text}
                </span>
            </div>

            {/* Drift bar */}
            <div>
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>{l.drift}</span>
                    <span>{data.driftScore}%</span>
                </div>
                <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                    <div
                        className={`h-full rounded-full transition-all ${getDriftColor(data.driftScore)}`}
                        style={{ width: `${Math.min(100, data.driftScore)}%` }}
                    />
                </div>
            </div>

            {/* Changed fields */}
            {data.changedFields.length > 0 ? (
                <div>
                    <p className="text-xs text-gray-500 mb-1">{l.changedFields}:</p>
                    <div className="flex flex-wrap gap-1">
                        {data.changedFields.map(f => (
                            <span key={f} className="px-1.5 py-0.5 text-[10px] bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 rounded">
                                {f}
                            </span>
                        ))}
                    </div>
                </div>
            ) : (
                <p className="text-xs text-gray-400">{l.noDrift}</p>
            )}

            <p className="text-[10px] text-gray-400">
                {l.lastChecked}: {new Date(data.lastChecked).toLocaleString()}
            </p>
        </div>
    );
}
