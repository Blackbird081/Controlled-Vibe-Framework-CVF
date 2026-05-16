'use client';

import { useEffect, useMemo, useState } from 'react';
import { Activity, AlertTriangle, CheckCircle2, Clock3, Gauge, RefreshCw, ServerCog, ShieldCheck } from 'lucide-react';
import { useLanguage } from '@/lib/i18n';

type Severity = 'INFO' | 'NOTICE' | 'WARNING' | 'HIGH' | 'CRITICAL';

interface RuntimeSnapshot {
    mode: 'READ_ONLY_MODE';
    generatedAt: string;
    panels: {
        sessions: Array<Record<string, string | number | null | undefined>>;
        tokenContext: Array<Record<string, string | number | boolean | null | undefined>>;
        rateLimits: Array<Record<string, string | number | null | undefined>>;
        processes: Array<Record<string, string | number | null | undefined>>;
        ports: Array<Record<string, string | number | null | undefined>>;
        alerts: Array<{
            alertId: string;
            severity: Severity;
            eventType: string;
            message: string;
            recommendedAction: string;
            policyRequired: boolean;
            source: string;
            receiptId?: string;
            createdAt: string;
        }>;
        events: Array<Record<string, string | number | boolean | null | undefined>>;
    };
    summary: {
        activeSessions: number;
        highestSeverity: Severity;
        policyRequiredCount: number;
        alertsBySeverity: Record<Severity, number>;
    };
    emptyStates: {
        sessions: string;
        tokenContext: string;
        ports: string;
    };
    blockedInterventions: string[];
    claimBoundary: string;
}

const copy = {
    en: {
        eyebrow: 'Runtime Visibility',
        title: 'Runtime Monitor',
        subtitle: 'See current AI work, provider pressure, local activity, and receipts before deciding the next step.',
        readOnly: 'Read-only',
        refresh: 'Refresh',
        updated: 'Updated',
        active: 'Active work',
        highest: 'Highest signal',
        review: 'Needs review',
        events: 'Signals',
        alerts: 'Attention',
        sessions: 'Current work',
        provider: 'Provider pressure',
        token: 'Token and context',
        local: 'Local activity',
        noAlerts: 'No attention items right now.',
        noSessions: 'No active governed runtime session detected. Observability is standing by.',
        noPorts: 'No managed port record is visible to the web process.',
        noToken: 'No verified token metadata is available yet. CVF will not guess usage.',
        source: 'Evidence source',
        receipt: 'Receipt',
        next: 'Recommended next step',
        boundary: 'What this page will not do',
        boundaryText: 'It will not approve AI work, close local apps, switch providers, change rules, shorten context, inject prompts, or delete receipts.',
        providerName: 'Provider',
        pressure: 'Pressure',
        reset: 'Reset',
        workId: 'Work ID',
        status: 'Status',
        process: 'Process',
        pid: 'PID',
        port: 'Port',
        empty: 'Nothing to show yet.',
        loading: 'Loading runtime view...',
        failed: 'Runtime view could not be loaded.',
    },
    vi: {
        eyebrow: 'Theo dõi vận hành',
        title: 'Bảng theo dõi runtime',
        subtitle: 'Xem việc AI đang chạy, áp lực provider, hoạt động local và biên nhận trước khi quyết định bước tiếp theo.',
        readOnly: 'Chỉ xem',
        refresh: 'Tải lại',
        updated: 'Cập nhật',
        active: 'Việc đang chạy',
        highest: 'Tín hiệu cao nhất',
        review: 'Cần xem lại',
        events: 'Tín hiệu',
        alerts: 'Cần chú ý',
        sessions: 'Công việc hiện tại',
        provider: 'Áp lực provider',
        token: 'Token và ngữ cảnh',
        local: 'Hoạt động local',
        noAlerts: 'Hiện không có mục cần chú ý.',
        noSessions: 'Chưa thấy phiên runtime được CVF quan sát. Observability đang sẵn sàng.',
        noPorts: 'Tiến trình web chưa thấy cổng nào do CVF quản lý.',
        noToken: 'Chưa có metadata token đã xác minh. CVF sẽ không đoán số liệu.',
        source: 'Nguồn bằng chứng',
        receipt: 'Biên nhận',
        next: 'Bước tiếp theo nên làm',
        boundary: 'Trang này sẽ không làm gì',
        boundaryText: 'Trang này không phê duyệt việc AI, đóng ứng dụng local, đổi provider, đổi quy tắc, cắt bớt ngữ cảnh, chèn prompt, hay xóa biên nhận.',
        providerName: 'Provider',
        pressure: 'Áp lực',
        reset: 'Đặt lại',
        workId: 'Mã công việc',
        status: 'Trạng thái',
        process: 'Tiến trình',
        pid: 'PID',
        port: 'Cong',
        empty: 'Chưa có dữ liệu để hiển thị.',
        loading: 'Đang tải bảng theo dõi...',
        failed: 'Không tải được bảng theo dõi runtime.',
    },
} as const;

const severityClass: Record<Severity, string> = {
    INFO: 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-200',
    NOTICE: 'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900/60 dark:bg-blue-950/30 dark:text-blue-200',
    WARNING: 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200',
    HIGH: 'border-orange-200 bg-orange-50 text-orange-800 dark:border-orange-900/60 dark:bg-orange-950/30 dark:text-orange-200',
    CRITICAL: 'border-red-200 bg-red-50 text-red-800 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-200',
};

export default function RuntimeMonitorPage() {
    const { language } = useLanguage();
    const t = copy[language];
    const [snapshot, setSnapshot] = useState<RuntimeSnapshot | null>(null);
    const [error, setError] = useState(false);
    const [loading, setLoading] = useState(true);

    async function load() {
        setLoading(true);
        setError(false);
        try {
            const response = await fetch('/api/runtime/observability', { cache: 'no-store' });
            if (!response.ok) throw new Error('runtime-observability-load-failed');
            setSnapshot(await response.json() as RuntimeSnapshot);
        } catch {
            setError(true);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        void load();
        const timer = window.setInterval(() => void load(), 30000);
        return () => window.clearInterval(timer);
    }, []);

    const summaryCards = useMemo(() => {
        if (!snapshot) return [];
        return [
            { label: t.active, value: snapshot.summary.activeSessions, icon: Activity },
            { label: t.highest, value: snapshot.summary.highestSeverity, icon: Gauge },
            { label: t.review, value: snapshot.summary.policyRequiredCount, icon: AlertTriangle },
            { label: t.events, value: snapshot.panels.events.length, icon: Clock3 },
        ];
    }, [snapshot, t]);

    return (
        <div className="mx-auto max-w-7xl space-y-6 px-4 py-6">
            <header className="flex flex-col gap-4 border-b border-gray-200 pb-5 dark:border-white/[0.08] md:flex-row md:items-start md:justify-between">
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        <ServerCog className="h-4 w-4" />
                        {t.eyebrow}
                    </div>
                    <h1 className="text-2xl font-bold text-gray-950 dark:text-white">{t.title}</h1>
                    <p className="max-w-3xl text-sm leading-6 text-gray-600 dark:text-gray-300">{t.subtitle}</p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-200">
                        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide">
                            <ShieldCheck className="h-3.5 w-3.5" />
                            {t.readOnly}
                        </div>
                        <div className="mt-1 text-xs">{snapshot ? `${t.updated} ${snapshot.generatedAt}` : t.loading}</div>
                    </div>
                    <button
                        type="button"
                        onClick={() => void load()}
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-gray-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 dark:bg-white dark:text-gray-950 dark:hover:bg-gray-200"
                    >
                        <RefreshCw className="h-4 w-4" />
                        {t.refresh}
                    </button>
                </div>
            </header>

            {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-200">
                    {t.failed}
                </div>
            )}

            {loading && !snapshot && (
                <div className="rounded-lg border border-gray-200 bg-white p-6 text-sm text-gray-600 dark:border-white/[0.08] dark:bg-[#151827] dark:text-gray-300">
                    {t.loading}
                </div>
            )}

            {snapshot && (
                <>
                    <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
                        {summaryCards.map((card) => {
                            const Icon = card.icon;
                            return (
                                <div key={card.label} className="rounded-lg border border-gray-200 bg-white p-4 dark:border-white/[0.08] dark:bg-[#151827]">
                                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                        <Icon className="h-4 w-4" />
                                        {card.label}
                                    </div>
                                    <div className="mt-2 text-2xl font-bold text-gray-950 dark:text-white">{card.value}</div>
                                </div>
                            );
                        })}
                    </section>

                    <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                        <Panel title={t.alerts} className="lg:col-span-2">
                            {snapshot.panels.alerts.length === 0 ? (
                                <Empty text={t.noAlerts} />
                            ) : (
                                <div className="space-y-3">
                                    {snapshot.panels.alerts.slice(0, 6).map((alert) => (
                                        <div key={alert.alertId} className={`rounded-lg border p-3 ${severityClass[alert.severity]}`}>
                                            <div className="flex flex-wrap items-center justify-between gap-2">
                                                <span className="text-xs font-bold uppercase tracking-wide">{alert.severity}</span>
                                                <span className="font-mono text-[11px]">{alert.eventType}</span>
                                            </div>
                                            <p className="mt-2 text-sm font-semibold">{alert.message}</p>
                                            <p className="mt-1 text-xs leading-5">{t.next}: {alert.recommendedAction}</p>
                                            <div className="mt-2 grid gap-1 text-[11px] sm:grid-cols-2">
                                                <span>{t.source}: {alert.source}</span>
                                                <span>{t.receipt}: {alert.receiptId ?? 'not required'}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </Panel>

                        <Panel title={t.boundary}>
                            <p className="text-sm leading-6 text-gray-600 dark:text-gray-300">{t.boundaryText}</p>
                            <div className="mt-4 flex flex-wrap gap-2">
                                {snapshot.blockedInterventions.slice(0, 8).map((item) => (
                                    <span key={item} className="rounded-md border border-gray-200 bg-gray-50 px-2 py-1 text-[11px] font-semibold text-gray-600 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-gray-300">
                                        {item.replaceAll('_', ' ')}
                                    </span>
                                ))}
                            </div>
                        </Panel>
                    </section>

                    <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                        <Panel title={t.sessions}>
                            {snapshot.panels.sessions.length === 0 ? <Empty text={t.noSessions} /> : (
                                <CompactTable
                                    headers={[t.workId, t.providerName, t.status, t.source]}
                                    rows={snapshot.panels.sessions.map((session) => [
                                        String(session.sessionId),
                                        String(session.provider),
                                        String(session.status),
                                        String(session.source),
                                    ])}
                                />
                            )}
                        </Panel>

                        <Panel title={t.provider}>
                            <CompactTable
                                headers={[t.providerName, t.pressure, t.reset, t.source]}
                                rows={snapshot.panels.rateLimits.map((rate) => [
                                    String(rate.provider),
                                    String(rate.quotaPressureLevel),
                                    String(rate.resetWindow ?? '-'),
                                    String(rate.source),
                                ])}
                            />
                        </Panel>

                        <Panel title={t.token}>
                            {snapshot.panels.tokenContext.length === 0 ? <Empty text={t.noToken} /> : (
                                <div className="space-y-3">
                                    {snapshot.panels.tokenContext.map((record, index) => (
                                        <div key={`${record.sessionId}-${index}`} className="rounded-lg border border-gray-200 p-3 text-sm dark:border-white/[0.08]">
                                            <div className="flex items-center justify-between gap-3">
                                                <span className="font-semibold text-gray-900 dark:text-white">{String(record.provider)}</span>
                                                <span className={`rounded-md border px-2 py-1 text-xs font-bold ${severityClass[toneForWarning(String(record.contextWarningLevel))]}`}>
                                                    {String(record.contextWarningLevel)}
                                                </span>
                                            </div>
                                            <p className="mt-2 text-xs leading-5 text-gray-600 dark:text-gray-300">
                                                {record.verifiedSource ? `${record.contextUsedPercent}%` : t.noToken}
                                            </p>
                                            <p className="mt-2 text-[11px] text-gray-500 dark:text-gray-400">{t.source}: {String(record.source)}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </Panel>

                        <Panel title={t.local}>
                            <CompactTable
                                headers={[t.process, t.pid, t.status, t.source]}
                                rows={snapshot.panels.processes.map((process) => [
                                    String(process.command),
                                    String(process.pid),
                                    String(process.status),
                                    String(process.source),
                                ])}
                            />
                            <div className="mt-4">
                                {snapshot.panels.ports.length === 0 ? <Empty text={t.noPorts} /> : (
                                    <CompactTable
                                        headers={[t.port, t.status, t.process, t.source]}
                                        rows={snapshot.panels.ports.map((port) => [
                                            String(port.port),
                                            String(port.status),
                                            String(port.ownerProcess),
                                            String(port.source),
                                        ])}
                                    />
                                )}
                            </div>
                        </Panel>
                    </section>
                </>
            )}
        </div>
    );
}

function Panel({ title, children, className = '' }: { title: string; children: React.ReactNode; className?: string }) {
    return (
        <section className={`rounded-lg border border-gray-200 bg-white dark:border-white/[0.08] dark:bg-[#151827] ${className}`}>
            <div className="border-b border-gray-200 px-4 py-3 dark:border-white/[0.08]">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white">{title}</h2>
            </div>
            <div className="p-4">{children}</div>
        </section>
    );
}

function Empty({ text }: { text: string }) {
    return (
        <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-600 dark:border-white/[0.12] dark:bg-white/[0.03] dark:text-gray-300">
            <CheckCircle2 className="mb-2 h-4 w-4 text-emerald-500" />
            {text}
        </div>
    );
}

function CompactTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
    if (rows.length === 0) {
        return <Empty text={copy.en.empty} />;
    }

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm dark:divide-white/[0.08]">
                <thead>
                    <tr>
                        {headers.map((header) => (
                            <th key={header} className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{header}</th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-white/[0.08]">
                    {rows.map((row, index) => (
                        <tr key={`${row[0]}-${index}`}>
                            {row.map((cell, cellIndex) => (
                                <td key={`${cell}-${cellIndex}`} className="px-3 py-2 align-top text-gray-700 dark:text-gray-200">
                                    <span className={cellIndex === 0 ? 'font-medium text-gray-950 dark:text-white' : ''}>{cell}</span>
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function toneForWarning(value: string): Severity {
    if (value === 'CRITICAL') return 'CRITICAL';
    if (value === 'HIGH') return 'HIGH';
    if (value === 'WARNING') return 'WARNING';
    if (value === 'NOTICE' || value === 'UNKNOWN') return 'NOTICE';
    return 'INFO';
}
