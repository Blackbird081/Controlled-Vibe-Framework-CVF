import Link from 'next/link';
import {
    Activity,
    ArrowUpRight,
    CheckCircle2,
    FileCheck2,
    GitBranch,
    Layers3,
    LockKeyhole,
    ShieldCheck,
} from 'lucide-react';
import { getCvfWorkspaceReadModel, type WorkspaceLaneSummary, type WorkspaceLink, type WorkspaceSourceStatus } from '@/lib/server/cvf-workspace-read-model';

export const dynamic = 'force-dynamic';

function StatusBadge({ status }: { status: string }) {
    const normalized = status.toLowerCase();
    const tone = normalized.includes('pass') || normalized.includes('ready') || normalized.includes('active')
        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200'
        : normalized.includes('blocked') || normalized.includes('missing')
            ? 'bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-200'
            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200';

    return (
        <span className={`inline-flex max-w-full items-center gap-1 rounded-md px-2 py-1 text-left text-xs font-semibold leading-5 ${tone}`}>
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span className="min-w-0 break-all">{status}</span>
        </span>
    );
}

function SourceRow({ source }: { source: WorkspaceSourceStatus }) {
    return (
        <div className="grid gap-2 border-t border-gray-200 px-4 py-3 text-sm first:border-t-0 dark:border-white/[0.08] md:grid-cols-[minmax(0,0.75fr)_minmax(0,1.35fr)_minmax(0,0.9fr)] md:items-center">
            <div className="font-semibold text-gray-900 dark:text-white">{source.label}</div>
            <div className="break-all font-mono text-xs text-gray-500 dark:text-gray-400">{source.path}</div>
            <StatusBadge status={source.exists ? source.status : 'MISSING'} />
        </div>
    );
}

function LinkCard({ link }: { link: WorkspaceLink }) {
    return (
        <Link
            href={link.href}
            className="group rounded-lg border border-gray-200 bg-white p-4 transition hover:-translate-y-0.5 hover:border-indigo-200 hover:bg-indigo-50/50 dark:border-white/[0.08] dark:bg-[#151827] dark:hover:border-indigo-400/40 dark:hover:bg-indigo-950/20"
        >
            <div className="flex items-start justify-between gap-3">
                <div>
                    <div className="text-sm font-semibold text-gray-950 dark:text-white">{link.label}</div>
                    <p className="mt-2 text-xs leading-5 text-gray-600 dark:text-gray-300">{link.description}</p>
                </div>
                <ArrowUpRight className="h-4 w-4 shrink-0 text-gray-400 transition group-hover:text-indigo-500" aria-hidden="true" />
            </div>
            <div className="mt-3 font-mono text-[11px] uppercase tracking-wide text-gray-400 dark:text-gray-500">{link.kind}</div>
        </Link>
    );
}

function LaneSummaryCard({ summary }: { summary: WorkspaceLaneSummary }) {
    return (
        <div className="rounded-lg border border-gray-200 bg-white dark:border-white/[0.08] dark:bg-[#151827]">
            <div className="flex items-start justify-between gap-3 border-b border-gray-200 p-4 dark:border-white/[0.08]">
                <div className="min-w-0">
                    <div className="break-all font-mono text-sm font-semibold text-gray-950 dark:text-white">{summary.lane}</div>
                    <div className="mt-2 flex flex-wrap gap-2">
                        {summary.statuses.map((status) => <StatusBadge key={status} status={status} />)}
                    </div>
                </div>
                <div className="rounded-md bg-slate-100 px-2.5 py-1 font-mono text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-100">
                    {summary.count}
                </div>
            </div>
            <div>
                {summary.recentItems.map((item) => (
                    <div key={item.workspaceItemId} className="border-t border-gray-100 px-4 py-3 text-xs leading-5 first:border-t-0 dark:border-white/[0.06]">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="break-all font-mono font-semibold text-gray-950 dark:text-white">{item.workspaceItemId}</span>
                            <span className="text-gray-500 dark:text-gray-400">{item.itemKind}</span>
                        </div>
                        <div className="mt-2 grid gap-2 text-gray-600 dark:text-gray-300">
                            <div className="break-all">
                                <span className="font-semibold text-gray-800 dark:text-gray-100">Owner:</span> {item.ownerRole}
                            </div>
                            <div className="break-all">
                                <span className="font-semibold text-gray-800 dark:text-gray-100">Source:</span> {item.sourceWorkOrder}
                            </div>
                            {item.evidencePaths.slice(0, 2).map((path) => (
                                <div key={path} className="break-all font-mono text-[11px] text-gray-500 dark:text-gray-400">{path}</div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function WorkspacePage() {
    const model = getCvfWorkspaceReadModel();

    return (
        <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 text-gray-900 dark:text-gray-100">
            <header className="flex flex-col gap-4 border-b border-gray-200 pb-5 dark:border-white/[0.08] lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-indigo-600 dark:text-indigo-300">
                        <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                        CVF Web Workspace
                    </div>
                    <h1 className="text-2xl font-bold text-gray-950 dark:text-white">Operator Dashboard</h1>
                    <p className="max-w-3xl text-sm leading-6 text-gray-600 dark:text-gray-300">
                        Read-only view of current CVF continuity, handoff, roadmap, evidence, and parked checkpoints.
                    </p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-xs leading-5 text-slate-700 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-200">
                    <div className="font-bold uppercase tracking-wide">Boundary</div>
                    <div className="mt-1 max-w-xl">{model.boundary}</div>
                </div>
            </header>

            <section className="grid gap-4 md:grid-cols-3">
                <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-white/[0.08] dark:bg-[#151827]">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        <Activity className="h-4 w-4 text-indigo-500" aria-hidden="true" />
                        Active Mode
                    </div>
                    <div className="mt-3 break-all font-mono text-sm font-semibold leading-6 text-gray-950 dark:text-white">{model.activeSessionMode}</div>
                    <div className="mt-3 break-all text-xs leading-5 text-gray-500 dark:text-gray-400">Previous: {model.previousMode}</div>
                </div>
                <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-white/[0.08] dark:bg-[#151827]">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        <GitBranch className="h-4 w-4 text-sky-500" aria-hidden="true" />
                        Active Handoff
                    </div>
                    <div className="mt-3 break-all font-mono text-sm font-semibold leading-6 text-gray-950 dark:text-white">{model.activeHandoff.path}</div>
                    <div className="mt-3"><StatusBadge status={model.activeHandoff.exists ? 'ACTIVE' : 'MISSING'} /></div>
                </div>
                <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-white/[0.08] dark:bg-[#151827]">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        <FileCheck2 className="h-4 w-4 text-emerald-500" aria-hidden="true" />
                        WWU-T2 Dispatch
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                        <StatusBadge status={model.dispatch.status} />
                        <span className="font-mono text-xs text-gray-500 dark:text-gray-400">{model.dispatch.materialCommit}</span>
                    </div>
                    <div className="mt-3 text-xs leading-5 text-gray-500 dark:text-gray-400">{model.generatedAt}</div>
                </div>
            </section>

            <section className="grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
                <div className="rounded-lg border border-gray-200 bg-white p-5 dark:border-white/[0.08] dark:bg-[#151827]">
                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-950 dark:text-white">
                        <ShieldCheck className="h-4 w-4 text-indigo-500" aria-hidden="true" />
                        Next Allowed Move
                    </div>
                    <p className="mt-3 text-sm leading-6 text-gray-600 dark:text-gray-300">{model.nextAllowedMove}</p>
                </div>
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-5 dark:border-amber-900/60 dark:bg-amber-950/30">
                    <div className="flex items-center gap-2 text-sm font-semibold text-amber-900 dark:text-amber-100">
                        <LockKeyhole className="h-4 w-4" aria-hidden="true" />
                        Parked Checkpoints
                    </div>
                    <div className="mt-4 space-y-3">
                        {model.parkedCheckpoints.map((checkpoint) => (
                            <div key={checkpoint} className="rounded-lg border border-amber-200 bg-white/70 p-3 text-xs leading-5 text-amber-900 dark:border-amber-900/60 dark:bg-black/10 dark:text-amber-100">
                                {checkpoint}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section>
                <div className="mb-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-950 dark:text-white">
                        <Layers3 className="h-4 w-4 text-indigo-500" aria-hidden="true" />
                        Workspace State Lanes
                    </div>
                    <StatusBadge status={model.workspaceState.exists ? model.workspaceState.status : 'MISSING'} />
                </div>
                {model.laneSummaries.length > 0 ? (
                    <div className="grid gap-4 lg:grid-cols-2">
                        {model.laneSummaries.map((summary) => <LaneSummaryCard key={summary.lane} summary={summary} />)}
                    </div>
                ) : (
                    <div className="rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-600 dark:border-white/[0.08] dark:bg-[#151827] dark:text-gray-300">
                        No workspace lane items found.
                    </div>
                )}
            </section>

            <section className="grid gap-4 lg:grid-cols-3">
                {[model.roadmap, model.workOrder, model.gc018].map((source) => (
                    <div key={source.path} className="rounded-lg border border-gray-200 bg-white p-4 dark:border-white/[0.08] dark:bg-[#151827]">
                        <div className="text-sm font-semibold text-gray-950 dark:text-white">{source.label}</div>
                        <div className="mt-3"><StatusBadge status={source.status} /></div>
                        <div className="mt-3 break-all font-mono text-[11px] leading-5 text-gray-500 dark:text-gray-400">{source.path}</div>
                    </div>
                ))}
            </section>

            <section>
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-950 dark:text-white">
                    <ArrowUpRight className="h-4 w-4 text-indigo-500" aria-hidden="true" />
                    Related Governed Surfaces
                </div>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {model.links.map((link) => <LinkCard key={link.href} link={link} />)}
                </div>
            </section>

            <section className="overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-white/[0.08] dark:bg-[#151827]">
                <div className="border-b border-gray-200 px-4 py-3 dark:border-white/[0.08]">
                    <h2 className="text-sm font-semibold text-gray-950 dark:text-white">Source Authority</h2>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Repo-local governed artifacts used by this read model.</p>
                </div>
                <div>
                    {model.sources.map((source) => <SourceRow key={source.path} source={source} />)}
                </div>
            </section>
        </div>
    );
}
