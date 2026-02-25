"use client";

import { useState, useEffect } from "react";
import { listSessions, loadSession } from "@/lib/storage/sessionStorage";
import type { SessionSummary, SerializedSession } from "@/lib/storage/sessionSerializer";
import Link from "next/link";

export default function AnalyticsPage() {
    const [sessions, setSessions] = useState<SessionSummary[]>([]);
    const [allData, setAllData] = useState<SerializedSession[]>([]);

    useEffect(() => {
        const summaries = listSessions();
        setSessions(summaries);

        const loaded = summaries.map((s) => loadSession(s.sessionId)).filter(Boolean) as SerializedSession[];
        setAllData(loaded);
    }, []);

    if (sessions.length === 0) {
        return (
            <main className="min-h-screen bg-gray-50 p-6 md:p-10 max-w-5xl mx-auto font-sans space-y-8">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-gray-900">Dashboard Analytics</h1>
                    <Link href="/" className="px-4 py-1.5 rounded-lg text-sm font-medium bg-blue-500 text-white hover:bg-blue-600 transition">← Dashboard</Link>
                </div>
                <p className="text-gray-500 text-center py-12">Chưa có session nào. Sử dụng dashboard để tạo session.</p>
            </main>
        );
    }

    // Aggregate stats
    const totalSessions = sessions.length;
    const frozenSessions = sessions.filter((s) => s.status === "FROZEN").length;
    const activeSessions = totalSessions - frozenSessions;
    const totalEvents = allData.reduce((sum, d) => sum + d.events.length, 0);
    const avgEvents = Math.round(totalEvents / totalSessions);

    // Profile distribution
    const profileCounts: Record<string, number> = {};
    sessions.forEach((s) => {
        profileCounts[s.profile] = (profileCounts[s.profile] || 0) + 1;
    });

    // Risk distribution across all events
    const riskCounts: Record<string, number> = { R0: 0, R1: 0, R2: 0, R3: 0 };
    allData.forEach((d) => {
        d.events.forEach((e) => {
            riskCounts[e.rLevel] = (riskCounts[e.rLevel] || 0) + 1;
        });
    });
    const totalRiskEvents = Object.values(riskCounts).reduce((a, b) => a + b, 0);

    // Event type distribution
    const eventTypeCounts: Record<string, number> = {};
    allData.forEach((d) => {
        d.events.forEach((e) => {
            eventTypeCounts[e.type] = (eventTypeCounts[e.type] || 0) + 1;
        });
    });

    // Average autonomy across final states
    const avgAutonomy = Math.round(
        allData.reduce((sum, d) => sum + d.state.autonomy, 0) / totalSessions
    );

    // Escalation rate
    const escalatedSessions = allData.filter((d) => d.events.some((e) => e.type === "ESCALATED")).length;
    const escalationRate = Math.round((escalatedSessions / totalSessions) * 100);

    // Hard stop rate
    const hardStopSessions = allData.filter((d) => d.events.some((e) => e.type === "HARD_STOP")).length;
    const hardStopRate = Math.round((hardStopSessions / totalSessions) * 100);

    const riskColors: Record<string, string> = {
        R0: "bg-green-500", R1: "bg-yellow-500", R2: "bg-orange-500", R3: "bg-red-500",
    };

    return (
        <main className="min-h-screen bg-gray-50 p-6 md:p-10 max-w-5xl mx-auto font-sans space-y-8">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Dashboard Analytics</h1>
                <div className="flex items-center gap-2">
                    <Link href="/history" className="px-4 py-1.5 rounded-lg text-sm font-medium bg-gray-200 text-gray-700 hover:bg-gray-300 transition">History</Link>
                    <Link href="/" className="px-4 py-1.5 rounded-lg text-sm font-medium bg-blue-500 text-white hover:bg-blue-600 transition">← Dashboard</Link>
                </div>
            </div>

            {/* KPI Cards */}
            <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: "Total Sessions", value: totalSessions, icon: "📊" },
                    { label: "Active", value: activeSessions, icon: "🟢" },
                    { label: "Frozen", value: frozenSessions, icon: "❄️" },
                    { label: "Total Events", value: totalEvents, icon: "📝" },
                    { label: "Avg Events/Session", value: avgEvents, icon: "📈" },
                    { label: "Avg Autonomy", value: avgAutonomy, icon: "🤖" },
                    { label: "Escalation Rate", value: `${escalationRate}%`, icon: "⬆️" },
                    { label: "Hard Stop Rate", value: `${hardStopRate}%`, icon: "🛑" },
                ].map((kpi) => (
                    <div key={kpi.label} className="bg-white border border-gray-200 rounded-xl p-4 card-hover">
                        <p className="text-2xl mb-1">{kpi.icon}</p>
                        <p className="text-2xl font-bold text-gray-900">{kpi.value}</p>
                        <p className="text-xs text-gray-500 mt-1">{kpi.label}</p>
                    </div>
                ))}
            </section>

            {/* Risk Distribution */}
            <section className="space-y-3">
                <h2 className="text-lg font-semibold text-gray-800">Risk Distribution</h2>
                <div className="bg-white border border-gray-200 rounded-xl p-4 card-hover">
                    <div className="flex h-8 rounded-lg overflow-hidden">
                        {(["R0", "R1", "R2", "R3"] as const).map((r) => {
                            const pct = totalRiskEvents > 0 ? (riskCounts[r] / totalRiskEvents) * 100 : 0;
                            if (pct === 0) return null;
                            return (
                                <div
                                    key={r}
                                    className={`${riskColors[r]} flex items-center justify-center text-white text-xs font-bold transition-all`}
                                    style={{ width: `${pct}%` }}
                                    title={`${r}: ${riskCounts[r]} (${Math.round(pct)}%)`}
                                >
                                    {pct > 10 ? `${r} ${Math.round(pct)}%` : ""}
                                </div>
                            );
                        })}
                    </div>
                    <div className="flex gap-4 mt-3 text-xs text-gray-600">
                        {(["R0", "R1", "R2", "R3"] as const).map((r) => (
                            <span key={r} className="flex items-center gap-1">
                                <span className={`w-3 h-3 rounded-full ${riskColors[r]}`}></span>
                                {r}: {riskCounts[r]}
                            </span>
                        ))}
                    </div>
                </div>
            </section>

            {/* Profile Usage */}
            <section className="space-y-3">
                <h2 className="text-lg font-semibold text-gray-800">Profile Usage</h2>
                <div className="grid grid-cols-3 gap-3">
                    {Object.entries(profileCounts).map(([profile, count]) => (
                        <div key={profile} className="bg-white border border-gray-200 rounded-xl p-4 text-center card-hover">
                            <p className="text-sm font-medium capitalize text-gray-700">{profile}</p>
                            <p className="text-3xl font-bold text-blue-600 mt-1">{count}</p>
                            <p className="text-xs text-gray-500">{Math.round((count / totalSessions) * 100)}% sessions</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Event Type Breakdown */}
            <section className="space-y-3">
                <h2 className="text-lg font-semibold text-gray-800">Event Types</h2>
                <div className="bg-white border border-gray-200 rounded-xl p-4 card-hover">
                    <div className="space-y-2">
                        {Object.entries(eventTypeCounts)
                            .sort(([, a], [, b]) => b - a)
                            .map(([type, count]) => {
                                const pct = (count / totalEvents) * 100;
                                return (
                                    <div key={type} className="flex items-center gap-3">
                                        <span className="text-xs font-mono text-gray-600 w-36 truncate">{type}</span>
                                        <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-blue-500 rounded-full transition-all"
                                                style={{ width: `${pct}%` }}
                                            ></div>
                                        </div>
                                        <span className="text-xs text-gray-500 w-16 text-right">{count} ({Math.round(pct)}%)</span>
                                    </div>
                                );
                            })}
                    </div>
                </div>
            </section>
        </main>
    );
}
