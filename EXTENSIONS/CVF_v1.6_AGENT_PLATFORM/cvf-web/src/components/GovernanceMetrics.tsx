'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n';

export interface GovernanceMetricsData {
    riskIndex: number;         // 0-1
    approvalEfficiency: number; // 0-100%
    stabilityScore: number;    // 0-100%
    complianceIntegrity: number; // 0-100%
}

interface GovernanceMetricsProps {
    data?: GovernanceMetricsData;
}

const LABELS = {
    vi: {
        riskIndex: 'Chỉ số rủi ro',
        approvalEff: 'Hiệu quả duyệt',
        stability: 'Ổn định governance',
        compliance: 'Tuân thủ',
        loading: 'Đang tải...',
        error: 'Không thể tải metrics',
    },
    en: {
        riskIndex: 'Risk Index',
        approvalEff: 'Approval Efficiency',
        stability: 'Governance Stability',
        compliance: 'Compliance Integrity',
        loading: 'Loading...',
        error: 'Failed to load metrics',
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

export function GovernanceMetrics({ data: propData }: GovernanceMetricsProps) {
    const { language } = useLanguage();
    const l = LABELS[language];
    const [data, setData] = useState<GovernanceMetricsData | null>(propData || null);
    const [loading, setLoading] = useState(!propData);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (propData) {
            setData(propData);
            return;
        }
        let cancelled = false;
        async function fetchMetrics() {
            try {
                const res = await fetch('/api/governance/metrics');
                if (!res.ok) throw new Error(`${res.status}`);
                const json = await res.json();
                if (!cancelled) {
                    setData({
                        riskIndex: json.data?.risk_index ?? 0,
                        approvalEfficiency: json.data?.approval_efficiency ?? 0,
                        stabilityScore: json.data?.stability_score ?? 0,
                        complianceIntegrity: json.data?.compliance_integrity ?? 0,
                    });
                }
            } catch {
                if (!cancelled) setError(l.error);
            } finally {
                if (!cancelled) setLoading(false);
            }
        }
        fetchMetrics();
        return () => { cancelled = true; };
    }, [propData, l.error]);

    if (loading) return <p className="text-sm text-gray-400">{l.loading}</p>;
    if (error) return <p className="text-sm text-red-500">{error}</p>;
    if (!data) return null;

    const cards = [
        { label: l.riskIndex, value: data.riskIndex.toFixed(2), color: getRiskColor(data.riskIndex), bar: data.riskIndex * 100, icon: '🎯' },
        { label: l.approvalEff, value: `${data.approvalEfficiency.toFixed(0)}%`, color: getPercentColor(data.approvalEfficiency), bar: data.approvalEfficiency, icon: '✅' },
        { label: l.stability, value: `${data.stabilityScore.toFixed(0)}%`, color: getPercentColor(data.stabilityScore), bar: data.stabilityScore, icon: '📊' },
        { label: l.compliance, value: `${data.complianceIntegrity.toFixed(0)}%`, color: getPercentColor(data.complianceIntegrity), bar: data.complianceIntegrity, icon: '🛡️' },
    ];

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {cards.map(card => (
                <div key={card.label} className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        {card.icon} {card.label}
                    </p>
                    <p className={`text-2xl font-bold ${card.color}`}>
                        {card.value}
                    </p>
                    <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full mt-2">
                        <div
                            className={`h-full rounded-full transition-all ${getBarColor(card.bar)}`}
                            style={{ width: `${Math.min(100, card.bar)}%` }}
                        />
                    </div>
                </div>
            ))}
        </div>
    );
}
