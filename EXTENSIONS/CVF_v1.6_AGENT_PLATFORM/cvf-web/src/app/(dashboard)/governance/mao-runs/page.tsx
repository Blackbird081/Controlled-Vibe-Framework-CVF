import { CheckCircle2, CircleAlert, MinusCircle, ServerCog, ShieldCheck, Workflow } from 'lucide-react';
import type { ComponentType } from 'react';
import {
    getMaoDurableRunReadout,
    type MaoDurableRunReadoutRun,
    type MaoDurableRunReadoutState,
} from '@/lib/server/mao-durable-run-readout';

export const dynamic = 'force-dynamic';

const STATE_STYLE: Record<MaoDurableRunReadoutState, { label: string; className: string; icon: ComponentType<{ className?: string }> }> = {
    AVAILABLE: {
        label: 'Available',
        className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200',
        icon: CheckCircle2,
    },
    EMPTY: {
        label: 'Empty',
        className: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
        icon: MinusCircle,
    },
    UNAVAILABLE: {
        label: 'Unavailable',
        className: 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-200',
        icon: CircleAlert,
    },
};

function StateBadge({ state }: { state: MaoDurableRunReadoutState }) {
    const style = STATE_STYLE[state];
    const Icon = style.icon;

    return (
        <span className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold ${style.className}`}>
            <Icon className="h-3.5 w-3.5" />
            {style.label}
        </span>
    );
}

function RunCard({ run }: { run: MaoDurableRunReadoutRun }) {
    return (
        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-white/[0.08] dark:bg-slate-900/50">
            <div className="flex flex-col gap-2 border-b border-gray-100 pb-3 dark:border-white/[0.06] sm:flex-row sm:items-center sm:justify-between">
                <div className="font-mono text-xs text-gray-900 dark:text-white">{run.taskGraphId}</div>
                <div className="flex gap-4 text-xs text-gray-500 dark:text-gray-400">
                    <span>Events: {run.eventCount}</span>
                    <span>Tasks: {run.taskCount}</span>
                    <span>Timeouts: {run.timeoutCount}</span>
                    <span>Latest event: {run.latestEventAt ?? 'none'}</span>
                </div>
            </div>
            <div className="mt-3 overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm dark:divide-white/[0.08]">
                    <thead>
                        <tr>
                            <th className="px-2 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Task</th>
                            <th className="px-2 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">State</th>
                            <th className="px-2 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Terminal Outcome</th>
                            <th className="px-2 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Last Event</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-white/[0.08]">
                        {run.tasks.map((task) => (
                            <tr key={task.taskId}>
                                <td className="px-2 py-2 align-top font-mono text-xs text-gray-900 dark:text-white">{task.taskId}</td>
                                <td className="px-2 py-2 align-top text-xs text-gray-700 dark:text-gray-200">{task.state}</td>
                                <td className="px-2 py-2 align-top text-xs text-gray-700 dark:text-gray-200">{task.terminalOutcome ?? 'none'}</td>
                                <td className="px-2 py-2 align-top font-mono text-xs text-gray-500 dark:text-gray-400">
                                    {task.lastEventId || 'none'} (seq {task.lastSequence})
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default async function MaoDurableRunsPage() {
    const report = await getMaoDurableRunReadout();

    return (
        <div className="mx-auto max-w-7xl space-y-6 px-4 py-6">
            <header className="flex flex-col gap-4 border-b border-gray-200 pb-5 dark:border-white/[0.08] md:flex-row md:items-start md:justify-between">
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        <Workflow className="h-4 w-4" />
                        MAO Durable Runs
                    </div>
                    <h1 className="text-2xl font-bold text-gray-950 dark:text-white">MAO Durable Runs</h1>
                    <p className="max-w-3xl text-sm leading-6 text-gray-600 dark:text-gray-300">
                        Read-only durable-event status view: run discovery, generated task state, timeout counts, and event
                        recency only.
                    </p>
                </div>

                <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-slate-800 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-100">
                    <div className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        Boundary
                    </div>
                    <div className="mt-1 max-w-md text-xs leading-5">{report.boundary}</div>
                    <div className="mt-2 max-w-md text-xs leading-5 text-slate-600 dark:text-slate-300">
                        This page excludes evidence records, evidence milestones, evidence freshness, heartbeat, and
                        live-process status. Event recency shown here is not heartbeat, evidence recency, or system
                        liveness.
                    </div>
                </div>
            </header>

            <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-white/[0.08] dark:bg-slate-900/50">
                    <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">State</div>
                    <div className="mt-2">
                        <StateBadge state={report.state} />
                    </div>
                </div>
                <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-white/[0.08] dark:bg-slate-900/50">
                    <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Total Runs</div>
                    <div className="mt-2 text-2xl font-bold text-gray-950 dark:text-white">{report.totalRuns}</div>
                </div>
            </section>

            {report.state === 'UNAVAILABLE' && (
                <section className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-200">
                    <div className="font-semibold">Durable run data is currently unavailable.</div>
                    <div className="mt-1 text-xs leading-5">
                        Diagnostic class: <span className="font-mono">{report.diagnosticClass}</span>
                    </div>
                </section>
            )}

            {report.state === 'EMPTY' && (
                <section className="rounded-lg border border-gray-200 bg-white p-6 text-center text-sm text-gray-600 dark:border-white/[0.08] dark:bg-slate-900/50 dark:text-gray-300">
                    No durable MAO runs have been discovered yet.
                </section>
            )}

            {report.state === 'AVAILABLE' && (
                <section className="space-y-4">
                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                        <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Runs</h2>
                        <span>Updated {report.generatedAt}</span>
                    </div>
                    {report.runs.map((run) => (
                        <RunCard key={run.taskGraphId} run={run} />
                    ))}
                </section>
            )}

            <a
                href="/governance"
                className="inline-flex items-center gap-2 rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-200 dark:bg-white/[0.06] dark:text-slate-200 dark:hover:bg-white/[0.1]"
            >
                <ServerCog className="h-4 w-4" />
                Governance Overview
            </a>
        </div>
    );
}
