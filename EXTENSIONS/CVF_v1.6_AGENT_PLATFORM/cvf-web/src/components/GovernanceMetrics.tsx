'use client';
// Text Encoding Exception: metric labels support Vietnamese and English.

import { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n';
import { NO_DATA_LABEL } from '@/lib/presentation-labels';
import { SessionExpiredNotice } from './SessionExpiredNotice';

export interface GovernanceMetricsData {
    riskIndex: number | null;         // 0-1
    approvalEfficiency: number | null; // 0-100%
    stabilityScore: number | null;    // 0-100%
    complianceIntegrity: number | null; // 0-100%
}

interface GovernanceMetricsProps {
    data?: GovernanceMetricsData;
}

const LABELS = {
    vi: {
        riskIndex: 'Chỉ số rủi ro',
        approvalEff: 'Hiệu quả duyệt',
        compliance: 'Tuân thủ',
        loading: 'Đang tải...',
    },
    en: {
        riskIndex: 'Risk Index',
        approvalEff: 'Approval Efficiency',
        compliance: 'Compliance Integrity',
        loading: 'Loading...',
    },
};

function getRiskColor(value: number): string {
    if (value <= 0.3) return 'text-green-500';
    if (value <= 0.6) return 'text-yellow-500';
    return 'text-red-500';
}

function getPercentColor(value: number): string {
    if (value >= 80) return 'text-green-500';
    if (value >= 60) return 'text-blue-500';
    if (value >= 40) return 'text-yellow-500';
    return 'text-red-500';
}

function getBarColor(value: number): string {
    if (value >= 80) return 'bg-green-500';
    if (value >= 60) return 'bg-blue-500';
    if (value >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
}

function readMetric(value: unknown, maximum: number): number | null {
    return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= maximum
        ? value
        : null;
}

export function GovernanceMetrics({ data: propData }: GovernanceMetricsProps) {
    const { language, t } = useLanguage();
    const l = LABELS[language];
    const [fetchedData, setData] = useState<GovernanceMetricsData | null>(null);
    const data = propData ?? fetchedData;
    const [loading, setLoading] = useState(!propData);
    const [error, setError] = useState<'expired' | 'unavailable' | null>(null);

    useEffect(() => {
        if (propData) return;
        let cancelled = false;
        async function fetchMetrics() {
            try {
                const res = await fetch('/api/governance/metrics');
                if (res.status === 401) {
                    if (!cancelled) setError('expired');
                    return;
                }
                if (!res.ok) throw new Error(`${res.status}`);
                const json = await res.json();
                if (!cancelled) {
                    const measured = json?.fallback === true ? undefined : json?.data;
                    setData({
                        riskIndex: readMetric(measured?.risk_index, 1),
                        approvalEfficiency: readMetric(measured?.approval_efficiency, 100),
                        stabilityScore: readMetric(measured?.stability_score, 100),
                        complianceIntegrity: readMetric(measured?.compliance_integrity, 100),
                    });
                }
            } catch {
                if (!cancelled) setError('unavailable');
            } finally {
                if (!cancelled) setLoading(false);
            }
        }
        fetchMetrics();
        return () => { cancelled = true; };
    }, [propData]);

    if (!propData && loading) return <p className="text-sm text-gray-400">{l.loading}</p>;
    if (!propData && error === 'expired') return <SessionExpiredNotice vi={language === 'vi'} />;
    if (!propData && error) return <p className="text-sm text-red-500">{t('governancePage.metricsError')}</p>;
    if (!data) return null;

    const cards = [
        { label: l.riskIndex, value: data.riskIndex, isRisk: true, icon: '🎯' },
        { label: l.approvalEff, value: data.approvalEfficiency, icon: '✅' },
        { label: t('governancePage.stability'), value: data.stabilityScore, icon: '📊' },
        { label: l.compliance, value: data.complianceIntegrity, icon: '🛡️' },
    ];

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {cards.map(({ label, value, isRisk, icon }) => {
                const width = value === null ? null : isRisk ? value * 100 : value;
                const tone = value === null ? null : isRisk ? getRiskColor(value) : getPercentColor(value);
                return <div key={label} className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        {value !== null && `${icon} `}{label}
                    </p>
                    <p className={tone ? `text-2xl font-bold ${tone}` : 'text-sm text-gray-600 dark:text-gray-300'}>
                        {value === null ? NO_DATA_LABEL[language] : isRisk ? value.toFixed(2) : `${value.toFixed(0)}%`}
                    </p>
                    {width !== null && <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full mt-2">
                        <div
                            className={`h-full rounded-full transition-all ${getBarColor(width)}`}
                            style={{ width: `${width}%` }}
                        />
                    </div>}
                </div>;
            })}
        </div>
    );
}
