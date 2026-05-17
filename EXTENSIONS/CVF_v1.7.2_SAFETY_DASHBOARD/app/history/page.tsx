"use client";

import { useState, useEffect } from "react";
import { SessionManager } from "@/lib/sessionManager";
import { listSessions, loadSession, deleteSession } from "@/lib/storage/sessionStorage";
import type { SessionSummary } from "@/lib/storage/sessionSerializer";
import GovernanceTimeline from "@/components/governance/GovernanceTimeline";
import GovernanceExportButton from "@/components/governance/GovernanceExportButton";
import GovernancePDFExport from "@/components/governance/GovernancePDFExport";
import Link from "next/link";

export default function HistoryPage() {
    const [sessions, setSessions] = useState<SessionSummary[]>([]);
    const [selectedSession, setSelectedSession] = useState<SessionManager | null>(null);
    const [compareSession, setCompareSession] = useState<SessionManager | null>(null);
    const [compareMode, setCompareMode] = useState(false);

    useEffect(() => {
        setSessions(listSessions());
    }, []);

    const handleView = (sessionId: string) => {
        const data = loadSession(sessionId);
        if (!data) return;
        const restored = SessionManager.restore(data);

        if (compareMode && selectedSession) {
            setCompareSession(restored);
            setCompareMode(false);
        } else {
            setSelectedSession(restored);
            setCompareSession(null);
        }
    };

    const handleDelete = (sessionId: string) => {
        const confirmed = window.confirm("Xóa session này?");
        if (!confirmed) return;
        deleteSession(sessionId);
        setSessions(listSessions());
        if (selectedSession?.getSessionInfo().sessionId === sessionId) setSelectedSession(null);
        if (compareSession?.getSessionInfo().sessionId === sessionId) setCompareSession(null);
    };

    const formatDate = (ts: number) =>
        new Date(ts).toLocaleString("vi-VN", {
            day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
        });

    const renderSessionDetail = (s: SessionManager, label: string) => {
        const info = s.getSessionInfo();
        const state = s.getState();
        const events = s.getEvents();

        return (
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-800">{label}</h2>
                    <span className="text-xs text-gray-400 font-mono">{info.sessionId.slice(0, 8)}...</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    {[
                        { label: "Profile", value: info.profile },
                        { label: "Status", value: s.getStatus() },
                        { label: "Risk", value: state.rLevel },
                        { label: "Autonomy", value: String(state.autonomy) },
                        { label: "Phase", value: state.phase },
                        { label: "Step", value: String(state.step) },
                        { label: "Events", value: String(events.length) },
                        { label: "Started", value: formatDate(info.startedAt) },
                    ].map((item) => (
                        <div key={item.label} className="bg-white border border-gray-200 rounded-lg p-2">
                            <p className="text-xs text-gray-500">{item.label}</p>
                            <p className="text-sm font-semibold text-gray-800 capitalize">{item.value}</p>
                        </div>
                    ))}
                </div>
                <GovernanceTimeline events={events} />
                <div className="flex gap-2">
                    <GovernanceExportButton sessionInfo={info} finalState={state} events={events} />
                    <GovernancePDFExport sessionInfo={info} finalState={state} events={events} />
                </div>
            </div>
        );
    };

    return (
        <main className="min-h-screen bg-gray-50 p-6 md:p-10 max-w-6xl mx-auto font-sans space-y-8">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Session History</h1>
                <div className="flex items-center gap-2">
                    <Link href="/analytics" className="px-4 py-1.5 rounded-lg text-sm font-medium bg-gray-200 text-gray-700 hover:bg-gray-300 transition">📊 Analytics</Link>
                    <Link href="/" className="px-4 py-1.5 rounded-lg text-sm font-medium bg-blue-500 text-white hover:bg-blue-600 transition">← Dashboard</Link>
                </div>
            </div>

            {sessions.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                    <p className="text-lg">Chưa có session nào được lưu.</p>
                    <p className="text-sm mt-2">Sử dụng dashboard để tạo session mới.</p>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Session List */}
                <div className="lg:col-span-1 space-y-3">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-gray-800">Sessions</h2>
                        {selectedSession && !compareSession && (
                            <button
                                onClick={() => setCompareMode(!compareMode)}
                                className={`text-xs px-2 py-1 rounded transition ${compareMode
                                        ? "bg-purple-500 text-white"
                                        : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                                    }`}
                                aria-label="Toggle compare mode"
                            >
                                {compareMode ? "Chọn session để so sánh..." : "⚖️ So sánh"}
                            </button>
                        )}
                    </div>
                    {sessions.map((s) => {
                        const isSelected = selectedSession?.getSessionInfo().sessionId === s.sessionId;
                        const isCompare = compareSession?.getSessionInfo().sessionId === s.sessionId;
                        return (
                            <div
                                key={s.sessionId}
                                role="button"
                                tabIndex={0}
                                aria-label={`View session ${s.profile} started ${formatDate(s.startedAt)}`}
                                className={`border rounded-xl p-3 bg-white shadow-sm cursor-pointer transition hover:border-blue-400 card-hover ${isSelected ? "border-blue-500 ring-2 ring-blue-100" :
                                        isCompare ? "border-purple-500 ring-2 ring-purple-100" :
                                            "border-gray-200"
                                    }`}
                                onClick={() => handleView(s.sessionId)}
                                onKeyDown={(e) => e.key === "Enter" && handleView(s.sessionId)}
                            >
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium capitalize text-gray-800">{s.profile}</span>
                                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${s.status === "FROZEN" ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                                        }`}>{s.status}</span>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">{formatDate(s.startedAt)}</p>
                                <div className="flex gap-3 mt-1 text-xs text-gray-600">
                                    <span>{s.phase}</span>
                                    <span>{s.rLevel}</span>
                                    <span>{s.eventCount} events</span>
                                </div>
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleDelete(s.sessionId); }}
                                    className="mt-2 text-xs text-red-500 hover:text-red-700 transition"
                                    aria-label={`Delete session ${s.sessionId.slice(0, 8)}`}
                                >
                                    Xóa
                                </button>
                            </div>
                        );
                    })}
                </div>

                {/* Session Detail / Comparison */}
                <div className={`${compareSession ? "lg:col-span-3" : "lg:col-span-3"} space-y-4`}>
                    {compareSession && selectedSession ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {renderSessionDetail(selectedSession, "Session A")}
                            {renderSessionDetail(compareSession, "Session B")}
                        </div>
                    ) : selectedSession ? (
                        renderSessionDetail(selectedSession, "Session Detail")
                    ) : (
                        <div className="text-center py-20 text-gray-400">
                            <p>Chọn một session để xem chi tiết</p>
                            {compareMode && <p className="text-purple-500 text-sm mt-2">Chọn session thứ hai để so sánh</p>}
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
