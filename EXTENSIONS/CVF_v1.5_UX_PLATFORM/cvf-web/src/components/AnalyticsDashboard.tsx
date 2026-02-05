'use client';

import { useMemo } from 'react';
import { useExecutionStore } from '@/lib/store';
import { CATEGORY_INFO, Category } from '@/types';

export function AnalyticsDashboard() {
    const { executions } = useExecutionStore();

    const stats = useMemo(() => {
        const total = executions.length;
        const completed = executions.filter(e => e.status === 'completed').length;
        const accepted = executions.filter(e => e.result === 'accepted').length;
        const rejected = executions.filter(e => e.result === 'rejected').length;

        // Calculate average quality score
        const scoresExecs = executions.filter(e => e.qualityScore !== undefined);
        const avgQuality = scoresExecs.length > 0
            ? scoresExecs.reduce((sum, e) => sum + (e.qualityScore || 0), 0) / scoresExecs.length
            : 0;

        // Template usage breakdown
        const templateUsage: Record<string, number> = {};
        executions.forEach(e => {
            templateUsage[e.templateName] = (templateUsage[e.templateName] || 0) + 1;
        });

        // Sort by usage
        const topTemplates = Object.entries(templateUsage)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);

        // Last 7 days activity
        const now = new Date();
        const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const weekActivity = Array(7).fill(0);
        executions.forEach(e => {
            const execDate = new Date(e.createdAt);
            const daysAgo = Math.floor((now.getTime() - execDate.getTime()) / (1000 * 60 * 60 * 24));
            if (daysAgo < 7) {
                weekActivity[execDate.getDay()]++;
            }
        });

        return {
            total,
            completed,
            accepted,
            rejected,
            avgQuality,
            topTemplates,
            weekActivity,
            dayLabels,
            acceptRate: completed > 0 ? (accepted / completed * 100) : 0,
        };
    }, [executions]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">📊 Analytics</h2>
                    <p className="text-gray-500 dark:text-gray-400">Thống kê sử dụng và chất lượng</p>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
                    <div className="text-3xl font-bold text-blue-600">{stats.total}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">Tổng số lần chạy</div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
                    <div className="text-3xl font-bold text-green-600">{stats.accepted}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">Kết quả Accept</div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
                    <div className="text-3xl font-bold text-orange-600">{stats.avgQuality.toFixed(1)}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">Điểm TB chất lượng</div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
                    <div className="text-3xl font-bold text-purple-600">{stats.acceptRate.toFixed(0)}%</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">Accept Rate</div>
                </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Weekly Activity */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-4">📈 Hoạt động tuần này</h3>
                    <div className="flex items-end justify-between h-32 gap-2">
                        {stats.weekActivity.map((count, idx) => {
                            const maxCount = Math.max(...stats.weekActivity, 1);
                            const height = (count / maxCount) * 100;
                            return (
                                <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                                    <div
                                        className="w-full bg-blue-500 rounded-t-sm transition-all duration-300"
                                        style={{ height: `${Math.max(height, 4)}%` }}
                                    />
                                    <span className="text-xs text-gray-500">{stats.dayLabels[idx]}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Top Templates */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-4">🏆 Top Templates</h3>
                    {stats.topTemplates.length > 0 ? (
                        <div className="space-y-3">
                            {stats.topTemplates.map(([name, count], idx) => (
                                <div key={name} className="flex items-center gap-3">
                                    <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 text-xs font-bold flex items-center justify-center">
                                        {idx + 1}
                                    </span>
                                    <span className="flex-1 text-sm text-gray-700 dark:text-gray-300 truncate">{name}</span>
                                    <span className="text-sm font-medium text-gray-500">{count}x</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-400 text-sm">Chưa có dữ liệu. Hãy chạy một vài templates!</p>
                    )}
                </div>
            </div>

            {/* Result Distribution */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">📊 Phân bố kết quả</h3>
                <div className="flex h-8 rounded-lg overflow-hidden">
                    {stats.accepted > 0 && (
                        <div
                            className="bg-green-500 flex items-center justify-center text-white text-xs font-medium"
                            style={{ width: `${(stats.accepted / Math.max(stats.completed, 1)) * 100}%` }}
                        >
                            ✅ {stats.accepted}
                        </div>
                    )}
                    {stats.rejected > 0 && (
                        <div
                            className="bg-red-500 flex items-center justify-center text-white text-xs font-medium"
                            style={{ width: `${(stats.rejected / Math.max(stats.completed, 1)) * 100}%` }}
                        >
                            ❌ {stats.rejected}
                        </div>
                    )}
                    {stats.completed === 0 && (
                        <div className="flex-1 bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500 text-xs">
                            Chưa có dữ liệu
                        </div>
                    )}
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-2">
                    <span>Accepted: {stats.accepted}</span>
                    <span>Rejected: {stats.rejected}</span>
                </div>
            </div>
        </div>
    );
}
