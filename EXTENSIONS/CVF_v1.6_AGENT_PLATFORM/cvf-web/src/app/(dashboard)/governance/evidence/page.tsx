import { Activity, CheckCircle2, CircleAlert, CircleHelp, FileCheck2, GitBranch, ShieldCheck } from 'lucide-react';
import type { ComponentType } from 'react';
import { getGovernanceEvidenceReport, type EvidenceStatus } from '@/lib/server/governance-evidence';

export const dynamic = 'force-dynamic';

const STATUS_STYLE: Record<EvidenceStatus, { label: string; className: string; icon: ComponentType<{ className?: string }> }> = {
    pass: {
        label: 'Pass',
        className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200',
        icon: CheckCircle2,
    },
    warning: {
        label: 'Review',
        className: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-200',
        icon: CircleAlert,
    },
    missing: {
        label: 'Missing',
        className: 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-200',
        icon: CircleAlert,
    },
    info: {
        label: 'Info',
        className: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
        icon: CircleHelp,
    },
};

function StatusBadge({ status }: { status: EvidenceStatus }) {
    const style = STATUS_STYLE[status];
    const Icon = style.icon;

    return (
        <span className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold ${style.className}`}>
            <Icon className="h-3.5 w-3.5" />
            {style.label}
        </span>
    );
}

export default function GovernanceEvidencePage() {
    const report = getGovernanceEvidenceReport();

    return (
        <div className="mx-auto max-w-7xl space-y-6 px-4 py-6">
            <header className="flex flex-col gap-4 border-b border-gray-200 pb-5 dark:border-white/[0.08] md:flex-row md:items-start md:justify-between">
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        <ShieldCheck className="h-4 w-4" />
                        Governance Evidence
                    </div>
                    <h1 className="text-2xl font-bold text-gray-950 dark:text-white">Evidence & Gate State</h1>
                    <p className="max-w-3xl text-sm leading-6 text-gray-600 dark:text-gray-300">
                        Latest recorded release gate, provider lane, receipt, and policy evidence for operator inspection.
                    </p>
                </div>

                <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-slate-800 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-100">
                    <div className="text-xs font-semibold uppercase tracking-wide">Boundary</div>
                    <div className="mt-1 max-w-md text-xs leading-5">{report.boundary}</div>
                </div>
            </header>

            <section className="rounded-lg border border-gray-200 bg-white p-4 dark:border-white/[0.08] dark:bg-[#151827]">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
                            <FileCheck2 className="h-4 w-4 text-emerald-500" />
                            Release Gate
                        </div>
                        <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-300">{report.releaseGate.summary}</p>
                        <p className="mt-2 font-mono text-xs text-gray-500 dark:text-gray-400">{report.releaseGate.command}</p>
                        <p className="mt-1 font-mono text-xs text-gray-500 dark:text-gray-400">{report.releaseGate.sourcePath}</p>
                    </div>
                    <StatusBadge status={report.releaseGate.status === 'pass' ? 'pass' : 'warning'} />
                </div>
            </section>

            <section className="overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-white/[0.08] dark:bg-[#151827]">
                <div className="flex flex-col gap-2 border-b border-gray-200 px-4 py-3 dark:border-white/[0.08] sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Provider Lane Matrix</h2>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Updated {report.generatedAt}</div>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 text-sm dark:divide-white/[0.08]">
                        <thead className="bg-gray-50 dark:bg-white/[0.03]">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Status</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Lane</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Provider</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Accepted</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Source</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-white/[0.08]">
                            {report.providerLanes.map((lane) => (
                                <tr key={lane.id}>
                                    <td className="px-4 py-3 align-top"><StatusBadge status={lane.status} /></td>
                                    <td className="px-4 py-3 align-top">
                                        <div className="font-medium text-gray-900 dark:text-white">{lane.label}</div>
                                        {lane.capturedAt && <div className="mt-1 font-mono text-xs text-gray-500 dark:text-gray-400">{lane.capturedAt}</div>}
                                    </td>
                                    <td className="px-4 py-3 align-top">
                                        <div className="text-gray-700 dark:text-gray-200">{lane.provider}</div>
                                        <div className="mt-1 font-mono text-xs text-gray-500 dark:text-gray-400">{lane.model}</div>
                                    </td>
                                    <td className="px-4 py-3 align-top">
                                        <div className="font-mono text-gray-900 dark:text-white">{lane.accepted}/{lane.attempted}</div>
                                        <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                            receipts {lane.receipts}{lane.useful !== null ? `, useful ${lane.useful}` : ''}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 align-top font-mono text-xs text-gray-500 dark:text-gray-400">{lane.sourcePath}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-white/[0.08] dark:bg-[#151827]">
                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
                        <Activity className="h-4 w-4 text-indigo-500" />
                        Evidence Locations
                    </div>
                    <div className="mt-4 space-y-3">
                        {report.evidenceReceipts.map((item) => (
                            <div key={item.id} className="rounded-lg border border-gray-200 p-3 dark:border-white/[0.08]">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <div className="text-sm font-semibold text-gray-900 dark:text-white">{item.label}</div>
                                        <p className="mt-1 text-xs leading-5 text-gray-600 dark:text-gray-300">{item.summary}</p>
                                        <p className="mt-2 font-mono text-[11px] text-gray-500 dark:text-gray-400">{item.sourcePath}</p>
                                    </div>
                                    <StatusBadge status={item.status} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-white/[0.08] dark:bg-[#151827]">
                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
                        <GitBranch className="h-4 w-4 text-sky-500" />
                        Policy & Approval References
                    </div>
                    <div className="mt-4 space-y-3">
                        {report.policySnapshots.map((snapshot) => (
                            <div key={snapshot.id} className="rounded-lg border border-gray-200 p-3 dark:border-white/[0.08]">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <div className="text-sm font-semibold text-gray-900 dark:text-white">{snapshot.label}</div>
                                        <div className="mt-2 flex flex-wrap gap-1">
                                            {snapshot.policyIds.length > 0
                                                ? snapshot.policyIds.map((policyId) => (
                                                    <span key={policyId} className="rounded-md bg-slate-100 px-2 py-1 font-mono text-[11px] text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                                                        {policyId}
                                                    </span>
                                                ))
                                                : <span className="text-xs text-gray-500 dark:text-gray-400">No policy ids recorded in this source.</span>}
                                        </div>
                                        <p className="mt-2 font-mono text-[11px] text-gray-500 dark:text-gray-400">{snapshot.sourcePath}</p>
                                    </div>
                                    <StatusBadge status={snapshot.status} />
                                </div>
                            </div>
                        ))}

                        {report.approvalRefs.map((approval) => (
                            <div key={approval.id} className="rounded-lg border border-gray-200 p-3 dark:border-white/[0.08]">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <div className="text-sm font-semibold text-gray-900 dark:text-white">{approval.label}</div>
                                        <p className="mt-1 text-xs leading-5 text-gray-600 dark:text-gray-300">{approval.summary}</p>
                                        <p className="mt-2 font-mono text-[11px] text-gray-500 dark:text-gray-400">{approval.sourcePath}</p>
                                    </div>
                                    <StatusBadge status={approval.status} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}
