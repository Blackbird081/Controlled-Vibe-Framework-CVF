'use client';

import { useState } from 'react';
import { useLanguage } from '@/lib/i18n';
import { GovernanceMetrics } from '@/components/GovernanceMetrics';
import { RiskTrendChart } from '@/components/RiskTrendChart';
import { BrandDriftIndicator } from '@/components/BrandDriftIndicator';
import { ActiveOverrides } from '@/components/ActiveOverrides';
import { LedgerExplorer } from '@/components/LedgerExplorer';
import { ApprovalPanel } from '@/components/ApprovalPanel';
import { GovernanceGuide } from '@/components/GovernanceGuide';

type GovTab = 'overview' | 'ledger' | 'approval' | 'brand' | 'guide';

const LABELS = {
    vi: {
        title: '🛡️ Governance Engine',
        subtitle: 'Trung tâm quản trị — Giám sát, duyệt, kiểm toán',
        tabs: {
            overview: '📊 Tổng quan',
            ledger: '📒 Audit Ledger',
            approval: '✅ Phê duyệt',
            brand: '🎨 Brand & Override',
            guide: '📖 Hướng dẫn',
        },
        health: 'Sức khỏe hệ thống',
        systemHealth: 'Runtime Health',
        runtimeModules: 'Runtime Modules',
        evidence: 'Evidence State',
        operations: 'Web Operations',
        riskTrend: 'Xu hướng rủi ro',
        brandDrift: 'Brand Drift',
        overrides: 'Override đang hoạt động',
        simulation: 'Mô phỏng chính sách',
        goSimulation: '🧪 Mở Policy Simulation →',
    },
    en: {
        title: '🛡️ Governance Engine',
        subtitle: 'Governance Center — Monitor, approve, audit',
        tabs: {
            overview: '📊 Overview',
            ledger: '📒 Audit Ledger',
            approval: '✅ Approval',
            brand: '🎨 Brand & Override',
            guide: '📖 Guide',
        },
        health: 'System Health',
        systemHealth: 'Runtime Health',
        runtimeModules: 'Runtime Modules',
        evidence: 'Evidence State',
        operations: 'Web Operations',
        riskTrend: 'Risk Trend',
        brandDrift: 'Brand Drift',
        overrides: 'Active Overrides',
        simulation: 'Policy Simulation',
        goSimulation: '🧪 Open Policy Simulation →',
    },
};

export default function GovernancePage() {
    const { language } = useLanguage();
    const l = LABELS[language];
    const [activeTab, setActiveTab] = useState<GovTab>('overview');

    const tabs: { key: GovTab; label: string }[] = [
        { key: 'overview', label: l.tabs.overview },
        { key: 'ledger', label: l.tabs.ledger },
        { key: 'approval', label: l.tabs.approval },
        { key: 'brand', label: l.tabs.brand },
        { key: 'guide', label: l.tabs.guide },
    ];

    return (
        <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{l.title}</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{l.subtitle}</p>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-1 bg-gray-100 dark:bg-[#1a1d2e] p-1 rounded-xl overflow-x-auto scrollbar-hide max-w-full">
                {tabs.map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition-all whitespace-nowrap ${
                            activeTab === tab.key
                                ? 'bg-white dark:bg-white/[0.1] text-gray-900 dark:text-white shadow-sm'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            {activeTab === 'overview' && (
                <div className="space-y-6">
                    {/* Metrics Cards */}
                    <div>
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">{l.health}</h2>
                        <GovernanceMetrics />
                    </div>

                    {/* Risk Trend + Brand Drift side by side */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">{l.riskTrend}</h2>
                            <RiskTrendChart />
                        </div>
                        <div className="space-y-4">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">{l.brandDrift}</h2>
                                <BrandDriftIndicator />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">{l.overrides}</h2>
                                <ActiveOverrides />
                            </div>
                        </div>
                    </div>

                    {/* Link to simulation */}
                    <div className="flex flex-wrap gap-2">
                        <a
                            href="/simulation"
                            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-950/50 transition-colors"
                        >
                            {l.goSimulation}
                        </a>
                        <a
                            href="/governance/system-health"
                            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-white/[0.06] rounded-lg hover:bg-slate-200 dark:hover:bg-white/[0.1] transition-colors"
                        >
                            {l.systemHealth}
                        </a>
                        <a
                            href="/governance/runtime-modules"
                            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-white/[0.06] rounded-lg hover:bg-slate-200 dark:hover:bg-white/[0.1] transition-colors"
                        >
                            {l.runtimeModules}
                        </a>
                        <a
                            href="/governance/evidence"
                            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-white/[0.06] rounded-lg hover:bg-slate-200 dark:hover:bg-white/[0.1] transition-colors"
                        >
                            {l.evidence}
                        </a>
                        <a
                            href="/governance/operations"
                            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-white/[0.06] rounded-lg hover:bg-slate-200 dark:hover:bg-white/[0.1] transition-colors"
                        >
                            {l.operations}
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
                    <ApprovalPanel />
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
        </div>
    );
}
