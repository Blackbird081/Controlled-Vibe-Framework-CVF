'use client';

// Text Encoding Exception: Existing tab symbols and the original Vietnamese SOT3 label.

import { useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/lib/i18n';
import { GovernanceMetrics } from '@/components/GovernanceMetrics';
import { RiskTrendChart } from '@/components/RiskTrendChart';
import { BrandDriftIndicator } from '@/components/BrandDriftIndicator';
import { ActiveOverrides } from '@/components/ActiveOverrides';
import { LedgerExplorer } from '@/components/LedgerExplorer';
import { TechnicalDetails } from '@/components/TechnicalDetails';
import { GovernanceGuide } from '@/components/GovernanceGuide';

type GovTab = 'overview' | 'ledger' | 'approval' | 'brand' | 'guide';

const TABS = [
    { key: 'overview', icon: '📊' },
    { key: 'ledger', icon: '📒' },
    { key: 'approval', icon: '✅' },
    { key: 'brand', icon: '🎨' },
    { key: 'guide', icon: '📖' },
] as const satisfies ReadonlyArray<{ key: GovTab; icon: string }>;

const TECHNICAL_NAMES = [
    'Audit Ledger', 'Brand & Override', 'Brand Drift', 'Brand Guardian',
    'Active Overrides', 'Runtime Health', 'Runtime Modules', 'Evidence State',
    'MAO Durable Runs', 'Web Operations', 'Policy Simulation',
    'Governance Stability', 'Chain valid / Chain broken', 'Block', 'Hash',
    'JSON / CSV', 'SLA',
];

export default function GovernancePage() {
    const { language, t } = useLanguage();
    const [activeTab, setActiveTab] = useState<GovTab>('overview');

    return (
        <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('nav.governance')}</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('governancePage.subtitle')}</p>
            </div>

            {/* Tab Navigation */}
            <div className="flex flex-wrap gap-1 rounded-xl bg-gray-100 p-1 dark:bg-[#1a1d2e]">
                {TABS.map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`inline-flex min-h-11 min-w-11 items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-xs font-medium transition-all sm:px-4 sm:text-sm ${
                            activeTab === tab.key
                                ? 'bg-white dark:bg-white/[0.1] text-gray-900 dark:text-white shadow-sm'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                        }`}
                    >
                        <span aria-hidden="true">{tab.icon}</span> {t(`governancePage.${tab.key}`)}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            {activeTab === 'overview' && (
                <div className="space-y-6">
                    {/* Metrics Cards */}
                    <div>
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">{t('governancePage.health')}</h2>
                        <GovernanceMetrics />
                    </div>

                    {/* Risk Trend + Brand Drift side by side */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <RiskTrendChart />
                        <div className="space-y-4">
                            <BrandDriftIndicator />
                            <ActiveOverrides />
                        </div>
                    </div>

                    {/* Link to simulation */}
                    <div className="flex flex-wrap gap-2">
                        <a
                            href="/simulation"
                            className="inline-flex min-h-11 items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-950/50 transition-colors"
                        >
                            {t('governancePage.simulation')}
                        </a>
                        <a
                            href="/governance/system-health"
                            className="inline-flex min-h-11 items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-white/[0.06] rounded-lg hover:bg-slate-200 dark:hover:bg-white/[0.1] transition-colors"
                        >
                            {t('governancePage.systemHealth')}
                        </a>
                        <a
                            href="/governance/runtime-modules"
                            className="inline-flex min-h-11 items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-white/[0.06] rounded-lg hover:bg-slate-200 dark:hover:bg-white/[0.1] transition-colors"
                        >
                            {t('governancePage.runtimeModules')}
                        </a>
                        <a
                            href="/governance/evidence"
                            className="inline-flex min-h-11 items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-white/[0.06] rounded-lg hover:bg-slate-200 dark:hover:bg-white/[0.1] transition-colors"
                        >
                            {t('governancePage.evidence')}
                        </a>
                        <a
                            href="/governance/sot3-evidence"
                            className="inline-flex min-h-11 items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-white/[0.06] rounded-lg hover:bg-slate-200 dark:hover:bg-white/[0.1] transition-colors"
                        >
                            {t('governancePage.sot3Evidence')}
                        </a>
                        <a
                            href="/governance/mao-runs"
                            className="inline-flex min-h-11 items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-white/[0.06] rounded-lg hover:bg-slate-200 dark:hover:bg-white/[0.1] transition-colors"
                        >
                            {t('governancePage.runs')}
                        </a>
                        <a
                            href="/governance/operations"
                            className="inline-flex min-h-11 items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-white/[0.06] rounded-lg hover:bg-slate-200 dark:hover:bg-white/[0.1] transition-colors"
                        >
                            {t('governancePage.operations')}
                        </a>
                    </div>
                </div>
            )}

            {activeTab === 'ledger' && (
                <div className="bg-white dark:bg-[#1a1d2e] rounded-xl border border-gray-200 dark:border-white/[0.07] p-4">
                    <LedgerExplorer />
                </div>
            )}

            {activeTab === 'approval' && (
                <div className="bg-white dark:bg-[#1a1d2e] rounded-xl border border-gray-200 dark:border-white/[0.07] p-4">
                    <Link
                        href="/approvals"
                        className="inline-flex min-h-11 items-center rounded-lg px-3 py-2 text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-300"
                    >
                        {t('governancePage.openApprovals')}
                    </Link>
                </div>
            )}

            {activeTab === 'brand' && (
                <div className="space-y-6">
                    <BrandDriftIndicator />
                    <ActiveOverrides />
                </div>
            )}

            {activeTab === 'guide' && (
                <GovernanceGuide />
            )}

            <TechnicalDetails label={t('common.technicalDetails')}>
                <ul className="grid gap-x-4 gap-y-1 sm:grid-cols-2">
                    {TECHNICAL_NAMES.map(name => <li key={name}>{name}</li>)}
                    <li>{language === 'vi' ? 'Bằng chứng SOT3' : 'SOT3 Evidence'}</li>
                </ul>
            </TechnicalDetails>
        </div>
    );
}
