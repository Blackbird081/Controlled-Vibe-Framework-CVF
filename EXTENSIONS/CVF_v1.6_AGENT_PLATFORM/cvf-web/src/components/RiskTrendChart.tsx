'use client';

import { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '@/lib/i18n';

export interface RiskTrendPoint {
    date: string;
    riskScore: number;
    event?: 'approved' | 'rejected' | 'escalated';
}

interface RiskTrendChartProps {
    data?: RiskTrendPoint[];
}

const LABELS = {
    vi: {
        title: '📈 Xu hướng rủi ro',
        days7: '7 ngày',
        days30: '30 ngày',
        days90: '90 ngày',
        increasing: '↗ Tăng',
        stable: '→ Ổn định',
        decreasing: '↘ Giảm',
        noData: 'Chưa có dữ liệu',
        loading: 'Đang tải...',
    },
    en: {
        title: '📈 Risk Trends',
        days7: '7 days',
        days30: '30 days',
        days90: '90 days',
        increasing: '↗ Increasing',
        stable: '→ Stable',
        decreasing: '↘ Decreasing',
        noData: 'No data yet',
        loading: 'Loading...',
    },
};

type TimeRange = '7' | '30' | '90';

function computeTrend(points: RiskTrendPoint[]): 'increasing' | 'stable' | 'decreasing' {
    if (points.length < 2) return 'stable';
    const n = points.length;
    const half = Math.floor(n / 2);
    const firstHalf = points.slice(0, half);
    const secondHalf = points.slice(half);
    const avg1 = firstHalf.reduce((a, b) => a + b.riskScore, 0) / firstHalf.length;
    const avg2 = secondHalf.reduce((a, b) => a + b.riskScore, 0) / secondHalf.length;
    const diff = avg2 - avg1;
    if (diff > 0.05) return 'increasing';
    if (diff < -0.05) return 'decreasing';
    return 'stable';
}

export { computeTrend };

export function RiskTrendChart({ data: propData }: RiskTrendChartProps) {
    const { language } = useLanguage();
    const l = LABELS[language];
    const [range, setRange] = useState<TimeRange>('30');
    const [data, setData] = useState<RiskTrendPoint[]>(propData || []);
    const [loading, setLoading] = useState(!propData);

    useEffect(() => {
        if (propData) {
            setData(propData);
            return;
        }
        let cancelled = false;
        async function fetchTrends() {
            try {
                const res = await fetch(`/api/governance/trends?days=${range}`);
                if (!res.ok) throw new Error(`${res.status}`);
                const json = await res.json();
                if (!cancelled) {
                    setData(json.data?.points || []);
                }
            } catch {
                // silently fail, show noData
            } finally {
                if (!cancelled) setLoading(false);
            }
        }
        fetchTrends();
        return () => { cancelled = true; };
    }, [propData, range]);

    const trend = useMemo(() => computeTrend(data), [data]);

    const trendDisplay = useMemo(() => {
        switch (trend) {
            case 'increasing': return { text: l.increasing, color: 'text-red-500' };
            case 'decreasing': return { text: l.decreasing, color: 'text-green-500' };
            default: return { text: l.stable, color: 'text-yellow-500' };
        }
    }, [trend, l]);

    // SVG chart dimensions
    const W = 600, H = 200, PAD = 30;

    const chartPoints = useMemo(() => {
        if (data.length === 0) return '';
        const maxScore = Math.max(...data.map(d => d.riskScore), 1);
        return data.map((p, i) => {
            const x = PAD + (i / Math.max(data.length - 1, 1)) * (W - 2 * PAD);
            const y = H - PAD - (p.riskScore / maxScore) * (H - 2 * PAD);
            return `${x},${y}`;
        }).join(' ');
    }, [data]);

    const eventMarkers = useMemo(() => {
        if (data.length === 0) return [];
        const maxScore = Math.max(...data.map(d => d.riskScore), 1);
        return data
            .map((p, i) => {
                if (!p.event) return null;
                const x = PAD + (i / Math.max(data.length - 1, 1)) * (W - 2 * PAD);
                const y = H - PAD - (p.riskScore / maxScore) * (H - 2 * PAD);
                const color = p.event === 'approved' ? '#22c55e' : p.event === 'rejected' ? '#ef4444' : '#f59e0b';
                return { x, y, color, event: p.event, key: i };
            })
            .filter(Boolean) as { x: number; y: number; color: string; event: string; key: number }[];
    }, [data]);

    if (loading) return <p className="text-sm text-gray-400">{l.loading}</p>;

    return (
        <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                    {l.title}
                </h3>
                <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold ${trendDisplay.color}`}>
                        {trendDisplay.text}
                    </span>
                    <div className="flex gap-1">
                        {(['7', '30', '90'] as TimeRange[]).map(r => (
                            <button
                                key={r}
                                onClick={() => setRange(r)}
                                className={`text-xs px-2 py-0.5 rounded ${
                                    range === r
                                        ? 'bg-blue-500 text-white'
                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                                }`}
                            >
                                {r === '7' ? l.days7 : r === '30' ? l.days30 : l.days90}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {data.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">{l.noData}</p>
            ) : (
                <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-48">
                    {/* Grid lines */}
                    {[0.25, 0.5, 0.75, 1].map(frac => {
                        const y = H - PAD - frac * (H - 2 * PAD);
                        return (
                            <line key={frac} x1={PAD} y1={y} x2={W - PAD} y2={y}
                                stroke="currentColor" className="text-gray-200 dark:text-gray-700" strokeWidth="0.5" />
                        );
                    })}
                    {/* Trend line */}
                    <polyline
                        points={chartPoints}
                        fill="none"
                        stroke="#3b82f6"
                        strokeWidth="2"
                        strokeLinejoin="round"
                    />
                    {/* Event markers */}
                    {eventMarkers.map(m => (
                        <circle key={m.key} cx={m.x} cy={m.y} r="4" fill={m.color}>
                            <title>{m.event}</title>
                        </circle>
                    ))}
                </svg>
            )}
        </div>
    );
}
