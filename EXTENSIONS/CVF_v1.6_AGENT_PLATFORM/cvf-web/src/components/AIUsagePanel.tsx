'use client';

import { useState } from 'react';
import { useLanguage } from '@/lib/i18n';
import { useQuotaManager, ProviderKey } from '@/lib/quota-manager';
import { useModelPricing } from '@/lib/hooks/useModelPricing';

interface AIUsagePanelProps {
    onClose: () => void;
}

export function AIUsagePanel({ onClose }: AIUsagePanelProps) {
    const { language } = useLanguage();
    const { settings, stats, updateSettings, checkBudget, clearUsage } = useQuotaManager();
    const { pricing, status: pricingStatus, updatedAt } = useModelPricing();
    const [activeTab, setActiveTab] = useState<'overview' | 'settings' | 'pricing'>('overview');

    const budgetStatus = checkBudget();

    const labels = {
        vi: {
            title: 'AI Usage & Quota',
            overview: 'Tổng quan',
            settingsTab: 'Cài đặt',
            pricing: 'Bảng giá',
            pricingStatus: 'Cập nhật giá',
            pricingFallback: 'Đang dùng giá mặc định',
            today: 'Hôm nay',
            thisMonth: 'Tháng này',
            tokens: 'tokens',
            requests: 'requests',
            cost: 'Chi phí',
            budget: 'Budget',
            remaining: 'Còn lại',
            dailyBudget: 'Budget hàng ngày',
            monthlyBudget: 'Budget hàng tháng',
            unlimited: 'Không giới hạn',
            enabled: 'Bật quota tracking',
            fallback: 'Tự động fallback',
            fallbackDesc: 'Tự động chuyển provider khi hết budget',
            clearHistory: 'Xóa lịch sử',
            clearConfirm: 'Xác nhận xóa tất cả lịch sử usage?',
            byProvider: 'Theo Provider',
            model: 'Model',
            input: 'Input',
            output: 'Output',
            perMillion: '/1M tokens',
            budgetExceeded: 'Đã vượt budget!',
            budgetWarning: 'Gần hết budget!',
            noLimit: 'Nhập 0 = không giới hạn',
        },
        en: {
            title: 'AI Usage & Quota',
            overview: 'Overview',
            settingsTab: 'Settings',
            pricing: 'Pricing',
            pricingStatus: 'Pricing updated',
            pricingFallback: 'Using default pricing',
            today: 'Today',
            thisMonth: 'This Month',
            tokens: 'tokens',
            requests: 'requests',
            cost: 'Cost',
            budget: 'Budget',
            remaining: 'Remaining',
            dailyBudget: 'Daily Budget',
            monthlyBudget: 'Monthly Budget',
            unlimited: 'Unlimited',
            enabled: 'Enable quota tracking',
            fallback: 'Auto fallback',
            fallbackDesc: 'Auto switch provider when budget exceeded',
            clearHistory: 'Clear History',
            clearConfirm: 'Confirm clear all usage history?',
            byProvider: 'By Provider',
            model: 'Model',
            input: 'Input',
            output: 'Output',
            perMillion: '/1M tokens',
            budgetExceeded: 'Budget exceeded!',
            budgetWarning: 'Budget nearly exhausted!',
            noLimit: 'Enter 0 = unlimited',
        },
    };
    const l = labels[language];

    const formatCost = (cost: number) => {
        if (cost < 0.01) return `$${cost.toFixed(4)}`;
        if (cost < 1) return `$${cost.toFixed(3)}`;
        return `$${cost.toFixed(2)}`;
    };

    const formatTokens = (tokens: number) => {
        if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(1)}M`;
        if (tokens >= 1_000) return `${(tokens / 1_000).toFixed(1)}K`;
        return tokens.toString();
    };

    const providerColors: Record<ProviderKey, string> = {
        gemini: 'bg-blue-500',
        openai: 'bg-green-500',
        anthropic: 'bg-purple-500',
    };

    const providerNames: Record<ProviderKey, string> = {
        gemini: 'Gemini',
        openai: 'OpenAI',
        anthropic: 'Anthropic',
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden max-w-2xl w-full">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    📊 {l.title}
                </h2>
                <button
                    onClick={onClose}
                    className="text-white/80 hover:text-white transition-colors"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {/* Budget Warning */}
            {budgetStatus.warning && (
                <div className={`px-6 py-3 ${budgetStatus.ok ? 'bg-yellow-50 dark:bg-yellow-900/30' : 'bg-red-50 dark:bg-red-900/30'}`}>
                    <div className={`flex items-center gap-2 ${budgetStatus.ok ? 'text-yellow-700 dark:text-yellow-300' : 'text-red-700 dark:text-red-300'}`}>
                        <span>{budgetStatus.ok ? '⚠️' : '🚫'}</span>
                        <span className="font-medium">
                            {budgetStatus.ok ? l.budgetWarning : l.budgetExceeded}
                        </span>
                    </div>
                </div>
            )}

            {/* Tabs */}
            <div className="border-b border-gray-200 dark:border-gray-700 px-6">
                <div className="flex gap-4">
                    {(['overview', 'settings', 'pricing'] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors
                                ${activeTab === tab
                                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                }`}
                        >
                            {tab === 'overview' && l.overview}
                            {tab === 'settings' && l.settingsTab}
                            {tab === 'pricing' && l.pricing}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className="p-6 max-h-[60vh] overflow-y-auto">
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                    <div className="space-y-6">
                        {/* Summary Cards */}
                        <div className="grid grid-cols-2 gap-4">
                            {/* Today */}
                            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                                <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">{l.today}</div>
                                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {formatCost(stats.today.cost)}
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    {formatTokens(stats.today.tokens)} {l.tokens} • {stats.today.requests} {l.requests}
                                </div>
                                {settings.dailyBudget > 0 && (
                                    <div className="mt-2">
                                        <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full transition-all ${budgetStatus.remaining.daily <= 0 ? 'bg-red-500' :
                                                        budgetStatus.remaining.daily < settings.dailyBudget * 0.2 ? 'bg-yellow-500' :
                                                            'bg-green-500'
                                                    }`}
                                                style={{ width: `${Math.min(100, (stats.today.cost / settings.dailyBudget) * 100)}%` }}
                                            />
                                        </div>
                                        <div className="text-xs text-gray-500 mt-1">
                                            {l.remaining}: {formatCost(Math.max(0, budgetStatus.remaining.daily))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* This Month */}
                            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                                <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">{l.thisMonth}</div>
                                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {formatCost(stats.month.cost)}
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    {formatTokens(stats.month.tokens)} {l.tokens} • {stats.month.requests} {l.requests}
                                </div>
                                {settings.monthlyBudget > 0 && (
                                    <div className="mt-2">
                                        <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full transition-all ${budgetStatus.remaining.monthly <= 0 ? 'bg-red-500' :
                                                        budgetStatus.remaining.monthly < settings.monthlyBudget * 0.2 ? 'bg-yellow-500' :
                                                            'bg-green-500'
                                                    }`}
                                                style={{ width: `${Math.min(100, (stats.month.cost / settings.monthlyBudget) * 100)}%` }}
                                            />
                                        </div>
                                        <div className="text-xs text-gray-500 mt-1">
                                            {l.remaining}: {formatCost(Math.max(0, budgetStatus.remaining.monthly))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* By Provider */}
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">{l.byProvider}</h3>
                            <div className="space-y-2">
                                {(Object.keys(stats.byProvider) as ProviderKey[]).map(provider => {
                                    const pStats = stats.byProvider[provider];
                                    const totalCost = stats.byProvider.gemini.cost + stats.byProvider.openai.cost + stats.byProvider.anthropic.cost;
                                    const percentage = totalCost > 0 ? (pStats.cost / totalCost) * 100 : 0;

                                    return (
                                        <div key={provider} className="flex items-center gap-3">
                                            <div className={`w-3 h-3 rounded-full ${providerColors[provider]}`} />
                                            <div className="flex-1">
                                                <div className="flex justify-between text-sm">
                                                    <span className="font-medium text-gray-700 dark:text-gray-300">
                                                        {providerNames[provider]}
                                                    </span>
                                                    <span className="text-gray-500">
                                                        {formatCost(pStats.cost)} ({pStats.requests} req)
                                                    </span>
                                                </div>
                                                <div className="h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden mt-1">
                                                    <div
                                                        className={`h-full ${providerColors[provider]}`}
                                                        style={{ width: `${percentage}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}

                {/* Settings Tab */}
                {activeTab === 'settings' && (
                    <div className="space-y-6">
                        {/* Enable Toggle */}
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="font-medium text-gray-900 dark:text-white">{l.enabled}</div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={settings.enabled}
                                    onChange={(e) => updateSettings({ enabled: e.target.checked })}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                            </label>
                        </div>

                        {/* Daily Budget */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                {l.dailyBudget} (USD)
                            </label>
                            <input
                                type="number"
                                min="0"
                                step="0.1"
                                value={settings.dailyBudget}
                                onChange={(e) => updateSettings({ dailyBudget: parseFloat(e.target.value) || 0 })}
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                placeholder={l.noLimit}
                            />
                            {settings.dailyBudget === 0 && (
                                <p className="text-xs text-gray-500 mt-1">{l.unlimited}</p>
                            )}
                        </div>

                        {/* Monthly Budget */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                {l.monthlyBudget} (USD)
                            </label>
                            <input
                                type="number"
                                min="0"
                                step="1"
                                value={settings.monthlyBudget}
                                onChange={(e) => updateSettings({ monthlyBudget: parseFloat(e.target.value) || 0 })}
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                placeholder={l.noLimit}
                            />
                            {settings.monthlyBudget === 0 && (
                                <p className="text-xs text-gray-500 mt-1">{l.unlimited}</p>
                            )}
                        </div>

                        {/* Fallback Toggle */}
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="font-medium text-gray-900 dark:text-white">{l.fallback}</div>
                                <div className="text-sm text-gray-500">{l.fallbackDesc}</div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={settings.fallbackEnabled}
                                    onChange={(e) => updateSettings({ fallbackEnabled: e.target.checked })}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                            </label>
                        </div>

                        {/* Clear History */}
                        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                            <button
                                onClick={() => {
                                    if (confirm(l.clearConfirm)) {
                                        clearUsage();
                                    }
                                }}
                                className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400"
                            >
                                🗑️ {l.clearHistory}
                            </button>
                        </div>
                    </div>
                )}

                {/* Pricing Tab */}
                {activeTab === 'pricing' && (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>
                                {pricingStatus === 'ready' && updatedAt && `${l.pricingStatus}: ${new Date(updatedAt).toLocaleString()}`}
                                {pricingStatus === 'loading' && `${l.pricingStatus}: ...`}
                                {pricingStatus === 'error' && l.pricingFallback}
                            </span>
                        </div>
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                                    <th className="pb-2 font-medium">{l.model}</th>
                                    <th className="pb-2 font-medium text-right">{l.input}</th>
                                    <th className="pb-2 font-medium text-right">{l.output}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {Object.entries(pricing).map(([model, prices]) => (
                                    <tr key={model} className="text-gray-700 dark:text-gray-300">
                                        <td className="py-2 font-mono text-xs">{model}</td>
                                        <td className="py-2 text-right">${prices.input.toFixed(2)}</td>
                                        <td className="py-2 text-right">${prices.output.toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <p className="text-xs text-gray-500 mt-2 text-center">{l.perMillion}</p>
                    </div>
                )}
            </div>
        </div>
    );
}

// Mini badge for header
export function AIUsageBadge({ onClick }: { onClick: () => void }) {
    const { stats, checkBudget } = useQuotaManager();
    const budgetStatus = checkBudget();

    const formatCost = (cost: number) => {
        if (cost < 0.01) return '$0';
        if (cost < 1) return `$${cost.toFixed(2)}`;
        return `$${cost.toFixed(1)}`;
    };

    return (
        <button
            onClick={onClick}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2
                ${budgetStatus.warning
                    ? budgetStatus.ok
                        ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300'
                        : 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300 animate-pulse'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
        >
            <span>💰</span>
            <span>{formatCost(stats.today.cost)}</span>
        </button>
    );
}
