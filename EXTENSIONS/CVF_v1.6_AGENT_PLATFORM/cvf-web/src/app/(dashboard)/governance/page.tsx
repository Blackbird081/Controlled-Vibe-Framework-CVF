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
            <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl w-fit">
                {tabs.map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                            activeTab === tab.key
                                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
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
                    <a
                        href="/simulation"
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-950/50 transition-colors"
                    >
                        {l.goSimulation}
                    </a>
                </div>
            )}

            {activeTab === 'ledger' && (
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                    <LedgerExplorer />
                </div>
            )}

            {activeTab === 'approval' && (
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
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
