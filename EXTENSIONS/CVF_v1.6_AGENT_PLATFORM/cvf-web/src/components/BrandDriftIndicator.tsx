'use client';

// Text Encoding Exception: Preserve the existing brand indicator symbol.

import { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n';
import { TechnicalDetails } from '@/components/TechnicalDetails';
import { NO_DATA_LABEL } from '@/lib/presentation-labels';

export interface BrandDriftData {
    driftScore: number | null;   // 0-100
    status: 'FROZEN' | 'COMPLIANT' | 'DRIFTING' | null;
    changedFields: string[] | null;
    lastChecked: string | null;
}

interface BrandDriftIndicatorProps {
    data?: BrandDriftData;
    compact?: boolean;
}

const LABELS = {
    vi: {
        frozen: '🔒 Đã khóa',
        compliant: '✅ Tuân thủ',
        drifting: '⚠️ Đang lệch',
        lastChecked: 'Kiểm tra lần cuối',
        loading: 'Đang kiểm tra...',
        noDrift: 'Không có thay đổi',
    },
    en: {
        frozen: '🔒 Frozen',
        compliant: '✅ Compliant',
        drifting: '⚠️ Drifting',
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

function getStatusBadge(status: BrandDriftData['status'], l: typeof LABELS.en, noData: string) {
    switch (status) {
        case 'FROZEN': return { text: l.frozen, bg: 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' };
        case 'COMPLIANT': return { text: l.compliant, bg: 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300' };
        case 'DRIFTING': return { text: l.drifting, bg: 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300' };
        default: return { text: noData, bg: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300' };
    }
}

export function BrandDriftIndicator({ data: propData, compact = false }: BrandDriftIndicatorProps) {
    const { language, t } = useLanguage();
    const l = LABELS[language];
    const [fetchedData, setData] = useState<BrandDriftData | null>(null);
    const data = propData ?? fetchedData;
    const noData = NO_DATA_LABEL[language];
    const [loading, setLoading] = useState(!propData);

    useEffect(() => {
        if (propData) return;
        let cancelled = false;
        async function fetchDrift() {
            try {
                const res = await fetch('/api/governance/brand-drift');
                if (!res.ok) throw new Error(`${res.status}`);
                const json = await res.json();
                if (!cancelled) {
                    const measured = json?.fallback === true ? undefined : json?.data;
                    const score = measured?.drift_score;
                    const status = measured?.status;
                    const fields = measured?.changed_fields;
                    const lastChecked = measured?.last_checked;
                    setData({
                        driftScore: typeof score === 'number' && score >= 0 && score <= 100 ? score : null,
                        status: status === 'FROZEN' || status === 'COMPLIANT' || status === 'DRIFTING' ? status : null,
                        changedFields: Array.isArray(fields) && fields.every(field => typeof field === 'string') ? fields : null,
                        lastChecked: typeof lastChecked === 'string' && Number.isFinite(Date.parse(lastChecked)) ? lastChecked : null,
                    });
                }
            } catch {
                if (!cancelled) setData(null);
            } finally {
                if (!cancelled) setLoading(false);
            }
        }
        fetchDrift();
        return () => { cancelled = true; };
    }, [propData]);

    if (!propData && loading) return <p className="text-xs text-gray-400">{l.loading}</p>;
    const driftScore = data?.driftScore ?? null;
    const changedFields = data?.changedFields;

    const badge = getStatusBadge(data?.status ?? null, l, noData);

    if (compact) {
        return (
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full ${badge.bg}`}>
                {badge.text} {driftScore !== null && `${driftScore}%`}
            </span>
        );
    }

    return (
        <div className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 space-y-2">
            <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                    🛡️ {t('governancePage.brandDrift')}
                </h4>
                <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${badge.bg}`}>
                    {badge.text}
                </span>
            </div>

            {/* Drift bar */}
            <div>
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>{t('governancePage.brandChange')}</span>
                    <span>{driftScore === null ? noData : `${driftScore}%`}</span>
                </div>
                {driftScore !== null && <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                    <div
                        className={`h-full rounded-full transition-all ${getDriftColor(driftScore)}`}
                        style={{ width: `${driftScore}%` }}
                    />
                </div>}
            </div>

            {/* Changed fields */}
            {changedFields && (changedFields.length > 0 ? (
                <div>
                    <p className="mb-2 text-xs text-gray-500">{t('governancePage.brandHasChanges')}</p>
                    <TechnicalDetails label={t('common.technicalDetails')}>
                    <div className="flex flex-wrap gap-1">
                        {changedFields.map(f => (
                            <span key={f} className="px-1.5 py-0.5 text-[10px] bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 rounded">
                                {f}
                            </span>
                        ))}
                    </div>
                    </TechnicalDetails>
                </div>
            ) : (
                <p className="text-xs text-gray-400">{l.noDrift}</p>
            ))}

            {data?.lastChecked && <p className="text-[10px] text-gray-400">
                {l.lastChecked}: {new Date(data.lastChecked).toLocaleString()}
            </p>}
        </div>
    );
}
