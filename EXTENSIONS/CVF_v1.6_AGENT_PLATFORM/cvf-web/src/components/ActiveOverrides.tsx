'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n';

export interface ActiveOverride {
    id: string;
    requestId: string;
    scope: 'request' | 'project';
    approvedBy: string;
    expiresAt: string;
    createdAt: string;
    justification: string;
}

interface ActiveOverridesProps {
    overrides?: ActiveOverride[];
    compact?: boolean;
}

const LABELS = {
    vi: {
        title: 'Ghi đè đang hoạt động',
        scope: 'Phạm vi',
        approvedBy: 'Duyệt bởi',
        expires: 'Hết hạn',
        expiring: 'Sắp hết hạn!',
        expired: 'Đã hết hạn',
        noOverrides: 'Không có ghi đè nào',
        loading: 'Đang tải...',
    },
    en: {
        title: 'Active Overrides',
        scope: 'Scope',
        approvedBy: 'Approved by',
        expires: 'Expires',
        expiring: 'Expiring soon!',
        expired: 'Expired',
        noOverrides: 'No active overrides',
        loading: 'Loading...',
    },
};

function getTimeRemaining(expiresAt: string): { text: string; urgent: boolean; expired: boolean } {
    const remaining = new Date(expiresAt).getTime() - Date.now();
    if (remaining <= 0) return { text: '0h', urgent: true, expired: true };
    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    if (days > 0) return { text: `${days}d ${hours % 24}h`, urgent: hours < 24, expired: false };
    return { text: `${hours}h`, urgent: hours < 24, expired: false };
}

export function ActiveOverrides({ overrides: propOverrides, compact = false }: ActiveOverridesProps) {
    const { language } = useLanguage();
    const l = LABELS[language];
    const [overrides, setOverrides] = useState<ActiveOverride[]>(propOverrides || []);
    const [loading, setLoading] = useState(!propOverrides);

    useEffect(() => {
        if (propOverrides) {
            setOverrides(propOverrides);
            return;
        }
        let cancelled = false;
        async function fetchOverrides() {
            try {
                const res = await fetch('/api/governance/overrides/active');
                if (!res.ok) throw new Error(`${res.status}`);
                const json = await res.json();
                if (!cancelled) {
                    setOverrides(json.data?.overrides ?? []);
                }
            } catch {
                // silently fail
            } finally {
                if (!cancelled) setLoading(false);
            }
        }
        fetchOverrides();
        return () => { cancelled = true; };
    }, [propOverrides]);

    // Filter out expired overrides
    const activeOverrides = overrides.filter(o => new Date(o.expiresAt).getTime() > Date.now());

    if (loading) return <p className="text-xs text-gray-400">{l.loading}</p>;

    if (compact) {
        return (
            <span className="inline-flex items-center gap-1 text-xs">
                ⏳ {activeOverrides.length}
            </span>
        );
    }

    return (
        <div className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 space-y-2">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                ⏳ {l.title} ({activeOverrides.length})
            </h4>

            {activeOverrides.length === 0 ? (
                <p className="text-xs text-gray-400">{l.noOverrides}</p>
            ) : (
                <div className="space-y-2">
                    {activeOverrides.map(override => {
                        const time = getTimeRemaining(override.expiresAt);
                        return (
                            <div
                                key={override.id}
                                className={`p-2 rounded border text-xs ${
                                    time.urgent
                                        ? 'border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30'
                                        : 'border-gray-200 dark:border-gray-700'
                                }`}
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <span className="font-mono text-gray-600 dark:text-gray-400">
                                        {override.requestId.slice(0, 12)}...
                                    </span>
                                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
                                        time.urgent
                                            ? 'bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200'
                                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                                    }`}>
                                        ⏳ {time.text}
                                    </span>
                                </div>
                                <div className="flex gap-3 text-gray-500">
                                    <span>{l.scope}: {override.scope}</span>
                                    <span>{l.approvedBy}: {override.approvedBy}</span>
                                </div>
                                {time.urgent && !time.expired && (
                                    <p className="text-amber-600 dark:text-amber-400 mt-1 font-medium">
                                        ⚠️ {l.expiring}
                                    </p>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
