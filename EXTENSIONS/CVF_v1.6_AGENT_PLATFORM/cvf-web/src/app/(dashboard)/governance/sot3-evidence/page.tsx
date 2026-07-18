import { CheckCircle2, CircleAlert, FileClock, MinusCircle, ServerCog, ShieldCheck } from 'lucide-react';
import type { ComponentType } from 'react';
import {
    getSot3ActivationEvidenceReadout,
    type Sot3ActivationEvidenceReadoutEntry,
    type Sot3ActivationEvidenceReadoutState,
} from '@/lib/server/sot3-activation-evidence-readout';
import type { Sot3KnowledgeTerminalOutcome } from '@/lib/sot3-knowledge-adapter';

export const dynamic = 'force-dynamic';

const STATE_STYLE: Record<Sot3ActivationEvidenceReadoutState, { label: string; className: string; icon: ComponentType<{ className?: string }> }> = {
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

const OUTCOME_STYLE: Record<Sot3KnowledgeTerminalOutcome, string> = {
    APPROVED: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200',
    REJECTED: 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-200',
    NO_CONTEXT: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
};

function StateBadge({ state }: { state: Sot3ActivationEvidenceReadoutState }) {
    const style = STATE_STYLE[state];
    const Icon = style.icon;

    return (
        <span className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold ${style.className}`}>
            <Icon className="h-3.5 w-3.5" />
            {style.label}
        </span>
    );
}

function OutcomeBadge({ outcome }: { outcome: Sot3KnowledgeTerminalOutcome }) {
    return (
        <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold ${OUTCOME_STYLE[outcome]}`}>
            {outcome}
        </span>
    );
}

function RecordRow({ record }: { record: Sot3ActivationEvidenceReadoutEntry }) {
    return (
        <tr key={record.recordId}>
            <td className="px-4 py-3 align-top">
                <div className="font-mono text-xs text-gray-900 dark:text-white">{record.recordId}</div>
                <div className="mt-1 font-mono text-xs text-gray-500 dark:text-gray-400">{record.requestId}</div>
            </td>
            <td className="px-4 py-3 align-top">
                <div className="text-gray-900 dark:text-white">{record.organization}</div>
                <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">{record.team ?? 'No team'}</div>
            </td>
            <td className="px-4 py-3 align-top">
                <span className="rounded-md bg-slate-100 px-2 py-1 font-mono text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                    {record.mode}
                </span>
            </td>
            <td className="px-4 py-3 align-top">
                <OutcomeBadge outcome={record.terminalOutcome} />
                {record.failureStage && (
                    <div className="mt-2 font-mono text-xs text-gray-500 dark:text-gray-400">{record.failureStage}</div>
                )}
            </td>
            <td className="px-4 py-3 align-top text-xs text-gray-600 dark:text-gray-300">{record.createdAtUtc}</td>
            <td className="px-4 py-3 align-top">
                <div className="font-mono text-xs text-gray-700 dark:text-gray-200">{record.diagnosticClass}</div>
                <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">Traces: {record.traceCount}</div>
            </td>
        </tr>
    );
}

export default function Sot3ActivationEvidencePage() {
    const report = getSot3ActivationEvidenceReadout();

    return (
        <div className="mx-auto max-w-7xl space-y-6 px-4 py-6">
            <header className="flex flex-col gap-4 border-b border-gray-200 pb-5 dark:border-white/[0.08] md:flex-row md:items-start md:justify-between">
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        <FileClock className="h-4 w-4" />
                        SOT3 Activation Evidence
                    </div>
                    <h1 className="text-2xl font-bold text-gray-950 dark:text-white">SOT3 Evidence</h1>
                    <p className="max-w-3xl text-sm leading-6 text-gray-600 dark:text-gray-300">
                        Read-only status view over durable SOT3 knowledge-activation evidence.
                    </p>
                </div>

                <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-slate-800 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-100">
                    <div className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        Boundary
                    </div>
                    <div className="mt-1 max-w-md text-xs leading-5">{report.boundary}</div>
                </div>
            </header>

            <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-white/[0.08] dark:bg-slate-900/50">
                    <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">State</div>
                    <div className="mt-2">
                        <StateBadge state={report.state} />
                    </div>
                </div>
                <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-white/[0.08] dark:bg-slate-900/50">
                    <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Total Records</div>
                    <div className="mt-2 text-2xl font-bold text-gray-950 dark:text-white">{report.totalRecords}</div>
                </div>
                <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-white/[0.08] dark:bg-slate-900/50">
                    <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">By Mode</div>
                    <div className="mt-2 space-y-1 text-xs text-gray-700 dark:text-gray-200">
                        <div>OFF: {report.summary.byMode.OFF}</div>
                        <div>SHADOW: {report.summary.byMode.SHADOW}</div>
                        <div>ENFORCE: {report.summary.byMode.ENFORCE}</div>
                    </div>
                </div>
                <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-white/[0.08] dark:bg-slate-900/50">
                    <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">By Outcome</div>
                    <div className="mt-2 space-y-1 text-xs text-gray-700 dark:text-gray-200">
                        <div>APPROVED: {report.summary.byOutcome.APPROVED}</div>
                        <div>REJECTED: {report.summary.byOutcome.REJECTED}</div>
                        <div>NO_CONTEXT: {report.summary.byOutcome.NO_CONTEXT}</div>
                    </div>
                </div>
            </section>

            {report.state === 'UNAVAILABLE' && (
                <section className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-200">
                    <div className="font-semibold">Evidence is currently unavailable.</div>
                    <div className="mt-1 text-xs leading-5">
                        Diagnostic class: <span className="font-mono">{report.diagnosticClass}</span>
                    </div>
                </section>
            )}

            {report.state === 'EMPTY' && (
                <section className="rounded-lg border border-gray-200 bg-white p-6 text-center text-sm text-gray-600 dark:border-white/[0.08] dark:bg-slate-900/50 dark:text-gray-300">
                    No SOT3 activation evidence has been recorded yet.
                </section>
            )}

            {report.state === 'AVAILABLE' && (
                <section className="overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-white/[0.08] dark:bg-slate-900/50">
                    <div className="flex flex-col gap-2 border-b border-gray-200 px-4 py-3 dark:border-white/[0.08] sm:flex-row sm:items-center sm:justify-between">
                        <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Recent Records</h2>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Updated {report.generatedAt}</div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 text-sm dark:divide-white/[0.08]">
                            <thead className="bg-gray-50 dark:bg-white/[0.03]">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Record</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Org / Team</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Mode</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Outcome</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Created</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Diagnostic / Traces</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-white/[0.08]">
                                {report.records.map((record) => (
                                    <RecordRow key={record.recordId} record={record} />
                                ))}
                            </tbody>
                        </table>
                    </div>
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
