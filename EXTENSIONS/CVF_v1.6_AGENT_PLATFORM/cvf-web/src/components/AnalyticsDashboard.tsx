'use client';

import { useMemo, useState } from 'react';
import { useExecutionStore } from '@/lib/store';
import { exportAnalyticsEvents, useAnalyticsEvents } from '@/lib/analytics';
import { useLanguage } from '@/lib/i18n';
import { GovernanceMetrics } from './GovernanceMetrics';
import { RiskTrendChart } from './RiskTrendChart';

type DashboardTab = 'analytics' | 'governance';

export function AnalyticsDashboard() {
    const { executions } = useExecutionStore();
    const { events, clearEvents, enabled } = useAnalyticsEvents();
    const { language } = useLanguage();
    const isVi = language === 'vi';
    const [activeTab, setActiveTab] = useState<DashboardTab>('analytics');

    const L = {
        title: isVi ? '📊 Phân tích' : '📊 Analytics',
        subtitle: isVi ? 'Thống kê sử dụng và chất lượng' : 'Usage statistics and quality metrics',
        analyticsOff: isVi ? 'Analytics đang tắt trong Settings. Bật lại để ghi nhận dữ liệu mới.' : 'Analytics is disabled in Settings. Re-enable to track new data.',
        totalRuns: isVi ? 'Tổng số lần chạy' : 'Total Runs',
        accepted: isVi ? 'Kết quả Accept' : 'Accepted Results',
        avgQuality: isVi ? 'Điểm TB chất lượng' : 'Avg Quality Score',
        acceptRate: isVi ? 'Tỷ lệ chấp nhận' : 'Accept Rate',
        weekActivity: isVi ? '📈 Hoạt động tuần này' : '📈 This Week\'s Activity',
        topTemplates: isVi ? '🏆 Template phổ biến' : '🏆 Top Templates',
        noTemplateData: isVi ? 'Chưa có dữ liệu. Hãy chạy một vài templates!' : 'No data yet. Run some templates!',
        topSkills: isVi ? '📚 Skill phổ biến' : '📚 Top Skills',
        noSkillData: isVi ? 'Chưa có dữ liệu skill. Hãy mở Skill Library!' : 'No skill data. Open the Skill Library!',
        domainUsage: isVi ? '🏷️ Theo lĩnh vực' : '🏷️ Domain Usage',
        noDomainData: isVi ? 'Chưa có dữ liệu domain. Hãy mở một vài skills!' : 'No domain data yet. Open some skills!',
        resultDist: isVi ? '📊 Phân bố kết quả' : '📊 Result Distribution',
        noResultData: isVi ? 'Chưa có dữ liệu' : 'No data yet',
        enforcement: '🛡️ Enforcement',
        enforcementDesc: isVi ? 'Theo dõi các quyết định chặn/clarify' : 'Track block/clarify decisions',
        decisionsLogged: isVi ? 'Quyết định đã ghi' : 'Decisions logged',
        preUatFails: isVi ? 'Pre-UAT thất bại' : 'Pre-UAT fails',
        topStatus: isVi ? 'Trạng thái phổ biến' : 'Top status',
        statusBreakdown: isVi ? 'Phân bố trạng thái' : 'Status breakdown',
        topSources: isVi ? 'Nguồn phổ biến' : 'Top sources',
        noEnforcement: isVi ? 'Chưa có enforcement events.' : 'No enforcement events yet.',
        noEnforcementSrc: isVi ? 'Chưa có nguồn enforcement.' : 'No enforcement sources.',
        eventTracking: '🧭 Event Tracking',
        eventTrackingDesc: isVi ? 'Nhật ký analytics cục bộ (không có PII)' : 'Local analytics log (no PII)',
        totalEvents: isVi ? 'Tổng events' : 'Total events',
        last7Days: isVi ? '7 ngày gần đây' : 'Last 7 days',
        noEvents: isVi ? 'Chưa có events.' : 'No events tracked yet.',
    };

    const formatEventValue = (value: unknown) => {
        if (value == null) return '';
        if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
            return String(value);
        }
        try {
            return JSON.stringify(value);
        } catch {
            return String(value);
        }
    };

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

    const eventStats = useMemo(() => {
        const totalEvents = events.length;
        const now = events.length > 0
            ? Math.max(...events.map(e => e.timestamp))
            : 0;
        const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
        const last7Days = events.filter(e => e.timestamp >= sevenDaysAgo).length;

        const byType: Record<string, number> = {};
        events.forEach(e => {
            byType[e.type] = (byType[e.type] || 0) + 1;
        });

        const topTypes = Object.entries(byType)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 4);

        const recentEvents = events.slice(0, 6);

        return {
            totalEvents,
            last7Days,
            topTypes,
            recentEvents,
        };
    }, [events]);

    const enforcementStats = useMemo(() => {
        const enforcementEvents = events.filter(e => e.type === 'enforcement_decision');
        const preUatFails = events.filter(e => e.type === 'pre_uat_failed').length;

        const byStatus: Record<string, number> = {};
        const bySource: Record<string, number> = {};

        enforcementEvents.forEach((event) => {
            const data = event.data || {};
            const status = String(data.status || 'unknown');
            const source = String(data.source || 'unknown');
            byStatus[status] = (byStatus[status] || 0) + 1;
            bySource[source] = (bySource[source] || 0) + 1;
        });

        const topStatuses = Object.entries(byStatus)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 4);
        const topSources = Object.entries(bySource)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 4);
        const recent = enforcementEvents.slice(0, 5);

        return {
            total: enforcementEvents.length,
            preUatFails,
            topStatuses,
            topSources,
            recent,
        };
    }, [events]);

    const skillStats = useMemo(() => {
        const skillEvents = events.filter(e => e.type === 'skill_viewed');
        const bySkill: Record<string, { title: string; count: number; domain?: string }> = {};
        const byDomain: Record<string, number> = {};

        skillEvents.forEach((event) => {
            const data = event.data || {};
            const skillId = String(data.skillId || data.skillTitle || 'unknown');
            const title = String(data.skillTitle || data.skillId || 'Unknown Skill');
            const domain = typeof data.domain === 'string' ? data.domain : undefined;
            bySkill[skillId] = {
                title,
                domain,
                count: (bySkill[skillId]?.count || 0) + 1,
            };
            if (domain) {
                byDomain[domain] = (byDomain[domain] || 0) + 1;
            }
        });

        const topSkills = Object.values(bySkill)
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        const topDomains = Object.entries(byDomain)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);

        return {
            totalSkillViews: skillEvents.length,
            topSkills,
            topDomains,
        };
    }, [events]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{L.title}</h2>
                    <p className="text-gray-500 dark:text-gray-400">{L.subtitle}</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setActiveTab('analytics')}
                        className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
                            activeTab === 'analytics'
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                        }`}
                    >
                        📊 {isVi ? 'Phân tích' : 'Analytics'}
                    </button>
                    <button
                        onClick={() => setActiveTab('governance')}
                        className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
                            activeTab === 'governance'
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                        }`}
                    >
                        🛡️ {isVi ? 'Governance Health' : 'Governance Health'}
                    </button>
                </div>
            </div>

            {activeTab === 'governance' && (
                <div className="space-y-4">
                    <GovernanceMetrics />
                    <RiskTrendChart />
                </div>
            )}

            {activeTab === 'analytics' && (<>

            {!enabled && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                    {L.analyticsOff}
                </div>
            )}

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
                    <div className="text-3xl font-bold text-blue-600">{stats.total}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">{L.totalRuns}</div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
                    <div className="text-3xl font-bold text-green-600">{stats.accepted}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">{L.accepted}</div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
                    <div className="text-3xl font-bold text-orange-600">{stats.avgQuality.toFixed(1)}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">{L.avgQuality}</div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
                    <div className="text-3xl font-bold text-purple-600">{stats.acceptRate.toFixed(0)}%</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">{L.acceptRate}</div>
                </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Weekly Activity */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-4">{L.weekActivity}</h3>
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
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-4">{L.topTemplates}</h3>
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
                        <p className="text-gray-400 text-sm">{L.noTemplateData}</p>
                    )}
                </div>
            </div>

            {/* Skill Usage */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-4">{L.topSkills}</h3>
                    {skillStats.topSkills.length > 0 ? (
                        <div className="space-y-3">
                            {skillStats.topSkills.map((skill, idx) => (
                                <div key={`${skill.title}-${idx}`} className="flex items-center gap-3">
                                    <span className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-300 text-xs font-bold flex items-center justify-center">
                                        {idx + 1}
                                    </span>
                                    <span className="flex-1 text-sm text-gray-700 dark:text-gray-300 truncate">
                                        {skill.title}
                                        {skill.domain ? <span className="text-xs text-gray-400 ml-2">({skill.domain})</span> : null}
                                    </span>
                                    <span className="text-sm font-medium text-gray-500">{skill.count}x</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-400 text-sm">{L.noSkillData}</p>
                    )}
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-4">{L.domainUsage}</h3>
                    {skillStats.topDomains.length > 0 ? (
                        <div className="space-y-3">
                            {skillStats.topDomains.map(([domain, count]) => (
                                <div key={domain} className="flex items-center gap-3">
                                    <span className="text-sm text-gray-700 dark:text-gray-300 flex-1 truncate">{domain}</span>
                                    <span className="text-sm font-medium text-gray-500">{count}x</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-400 text-sm">{L.noDomainData}</p>
                    )}
                </div>
            </div>

            {/* Result Distribution */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">{L.resultDist}</h3>
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
                            {L.noResultData}
                        </div>
                    )}
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-2">
                    <span>Accepted: {stats.accepted}</span>
                    <span>Rejected: {stats.rejected}</span>
                </div>
            </div>

            {/* Enforcement Tracking */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                    <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">{L.enforcement}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{L.enforcementDesc}</p>
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                        <div className="text-xs text-gray-500">{L.decisionsLogged}</div>
                        <div className="text-lg font-semibold text-gray-900 dark:text-white">{enforcementStats.total}</div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                        <div className="text-xs text-gray-500">{L.preUatFails}</div>
                        <div className="text-lg font-semibold text-gray-900 dark:text-white">{enforcementStats.preUatFails}</div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                        <div className="text-xs text-gray-500">{L.topStatus}</div>
                        <div className="text-sm font-semibold text-gray-900 dark:text-white">
                            {enforcementStats.topStatuses[0]?.[0] || 'N/A'}
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                        <div className="text-xs text-gray-500 mb-2">{L.statusBreakdown}</div>
                        {enforcementStats.topStatuses.length > 0 ? (
                            <div className="space-y-2">
                                {enforcementStats.topStatuses.map(([status, count]) => (
                                    <div key={status} className="flex items-center justify-between text-sm text-gray-700 dark:text-gray-300">
                                        <span>{status}</span>
                                        <span className="font-medium">{count}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-400">{L.noEnforcement}</p>
                        )}
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                        <div className="text-xs text-gray-500 mb-2">{L.topSources}</div>
                        {enforcementStats.topSources.length > 0 ? (
                            <div className="space-y-2">
                                {enforcementStats.topSources.map(([source, count]) => (
                                    <div key={source} className="flex items-center justify-between text-sm text-gray-700 dark:text-gray-300">
                                        <span>{source}</span>
                                        <span className="font-medium">{count}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-400">{L.noEnforcementSrc}</p>
                        )}
                    </div>
                </div>
                {enforcementStats.recent.length > 0 && (
                    <div className="mt-4 space-y-2 text-xs text-gray-600 dark:text-gray-400">
                        {enforcementStats.recent.map(event => (
                            <div key={event.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                                <span>
                                    {formatEventValue(event.data?.source || 'unknown')} → {formatEventValue(event.data?.status || 'unknown')}
                                </span>
                                <span>{new Date(event.timestamp).toLocaleString()}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Event Tracking */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                    <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">{L.eventTracking}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{L.eventTrackingDesc}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => exportAnalyticsEvents('json')}
                            className="px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                            Export JSON
                        </button>
                        <button
                            onClick={() => exportAnalyticsEvents('csv')}
                            className="px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                            Export CSV
                        </button>
                        <button
                            onClick={clearEvents}
                            className="px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                            Clear log
                        </button>
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                        <div className="text-xs text-gray-500">{L.totalEvents}</div>
                        <div className="text-lg font-semibold text-gray-900 dark:text-white">{eventStats.totalEvents}</div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                        <div className="text-xs text-gray-500">{L.last7Days}</div>
                        <div className="text-lg font-semibold text-gray-900 dark:text-white">{eventStats.last7Days}</div>
                    </div>
                    {eventStats.topTypes.map(([type, count]) => (
                        <div key={type} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                            <div className="text-xs text-gray-500">{type}</div>
                            <div className="text-lg font-semibold text-gray-900 dark:text-white">{count}</div>
                        </div>
                    ))}
                </div>
                {eventStats.recentEvents.length > 0 ? (
                    <div className="space-y-2">
                        {eventStats.recentEvents.map(event => (
                            <div
                                key={event.id}
                                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-xs text-gray-600 dark:text-gray-400"
                            >
                                <span>{event.type}</span>
                                <span>{new Date(event.timestamp).toLocaleString()}</span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-gray-400">{L.noEvents}</p>
                )}
            </div>

            </>)}
        </div>
    );
}
