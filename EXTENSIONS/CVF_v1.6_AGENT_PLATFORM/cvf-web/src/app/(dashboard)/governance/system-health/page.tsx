import { Activity, AlertTriangle, Boxes, CheckCircle2, CircleAlert, CircleHelp, ServerCog } from 'lucide-react';
import type { ComponentType } from 'react';
import { getSystemHealth, type SystemHealthCheckStatus } from '@/lib/server/system-health';

export const dynamic = 'force-dynamic';

const STATUS_COPY = {
    ready: {
        label: 'Ready',
        className: 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-200',
    },
    warning: {
        label: 'Needs attention',
        className: 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200',
    },
    blocked: {
        label: 'Blocked',
        className: 'border-red-200 bg-red-50 text-red-800 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-200',
    },
};

const CHECK_STYLE: Record<SystemHealthCheckStatus, { label: string; className: string; icon: ComponentType<{ className?: string }> }> = {
    pass: {
        label: 'Pass',
        className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200',
        icon: CheckCircle2,
    },
    warn: {
        label: 'Warn',
        className: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-200',
        icon: AlertTriangle,
    },
    fail: {
        label: 'Fail',
        className: 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-200',
        icon: CircleAlert,
    },
    info: {
        label: 'Info',
        className: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
        icon: CircleHelp,
    },
};

function StatusBadge({ status }: { status: SystemHealthCheckStatus }) {
    const style = CHECK_STYLE[status];
    const Icon = style.icon;

    return (
        <span className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold ${style.className}`}>
            <Icon className="h-3.5 w-3.5" />
            {style.label}
        </span>
    );
}

export default function SystemHealthPage() {
    const report = getSystemHealth();
    const headline = STATUS_COPY[report.status];

    return (
        <div className="mx-auto max-w-7xl space-y-6 px-4 py-6">
            <header className="flex flex-col gap-4 border-b border-gray-200 pb-5 dark:border-white/[0.08] md:flex-row md:items-start md:justify-between">
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        <ServerCog className="h-4 w-4" />
                        Runtime Visibility
                    </div>
                    <h1 className="text-2xl font-bold text-gray-950 dark:text-white">System Health</h1>
                    <p className="max-w-3xl text-sm leading-6 text-gray-600 dark:text-gray-300">
                        Local install, provider, and release-proof readiness for this CVF workspace.
                    </p>
                </div>

                <div className={`rounded-lg border px-4 py-3 ${headline.className}`}>
                    <div className="text-xs font-semibold uppercase tracking-wide">Current status</div>
                    <div className="mt-1 text-lg font-bold">{headline.label}</div>
                    <div className="mt-1 text-xs">Updated {report.generatedAt}</div>
                </div>
            </header>

            <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-white/[0.08] dark:bg-[#151827]">
                    <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Pass</div>
                    <div className="mt-2 text-2xl font-bold text-emerald-700 dark:text-emerald-300">{report.summary.pass}</div>
                </div>
                <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-white/[0.08] dark:bg-[#151827]">
                    <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Warn</div>
                    <div className="mt-2 text-2xl font-bold text-amber-700 dark:text-amber-300">{report.summary.warn}</div>
                </div>
                <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-white/[0.08] dark:bg-[#151827]">
                    <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Fail</div>
                    <div className="mt-2 text-2xl font-bold text-red-700 dark:text-red-300">{report.summary.fail}</div>
                </div>
                <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-white/[0.08] dark:bg-[#151827]">
                    <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Info</div>
                    <div className="mt-2 text-2xl font-bold text-slate-700 dark:text-slate-200">{report.summary.info}</div>
                </div>
            </section>

            <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-white/[0.08] dark:bg-[#151827]">
                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
                        <Activity className="h-4 w-4 text-indigo-500" />
                        Runtime
                    </div>
                    <dl className="mt-4 space-y-3 text-sm">
                        <div>
                            <dt className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Node</dt>
                            <dd className="mt-1 font-mono text-gray-900 dark:text-gray-100">{report.runtime.nodeVersion}</dd>
                        </div>
                        <div>
                            <dt className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">App root</dt>
                            <dd className="mt-1 font-mono text-gray-900 dark:text-gray-100">{report.runtime.appRoot}</dd>
                        </div>
                        <div>
                            <dt className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Repository</dt>
                            <dd className="mt-1 font-mono text-gray-900 dark:text-gray-100">{report.runtime.repoRoot}</dd>
                        </div>
                    </dl>
                </div>

                <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-white/[0.08] dark:bg-[#151827] lg:col-span-2">
                    <div className="text-sm font-semibold text-gray-900 dark:text-white">Provider Presence</div>
                    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {report.providers.map((provider) => (
                            <div key={provider.provider} className="rounded-lg border border-gray-200 p-3 dark:border-white/[0.08]">
                                <div className="flex items-center justify-between gap-3">
                                    <div className="text-sm font-semibold capitalize text-gray-900 dark:text-white">{provider.provider}</div>
                                    <StatusBadge status={provider.ready ? 'pass' : provider.requiredForReleaseProof ? 'warn' : 'info'} />
                                </div>
                                <p className="mt-2 text-xs leading-5 text-gray-600 dark:text-gray-300">
                                    {provider.detectedEnvVars.length > 0
                                        ? provider.detectedEnvVars.join(', ')
                                        : provider.requiredForReleaseProof
                                            ? 'Required for release-quality live proof.'
                                            : 'Optional confirmatory lane.'}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-white/[0.08] dark:bg-[#151827]">
                <div className="border-b border-gray-200 px-4 py-3 dark:border-white/[0.08]">
                    <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Readiness Checks</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 text-sm dark:divide-white/[0.08]">
                        <thead className="bg-gray-50 dark:bg-white/[0.03]">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Status</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Check</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Class</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Message</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-white/[0.08]">
                            {report.checks.map((check) => (
                                <tr key={check.id}>
                                    <td className="px-4 py-3 align-top"><StatusBadge status={check.status} /></td>
                                    <td className="px-4 py-3 align-top font-medium text-gray-900 dark:text-white">{check.label}</td>
                                    <td className="px-4 py-3 align-top font-mono text-xs text-gray-500 dark:text-gray-400">{check.classification}</td>
                                    <td className="px-4 py-3 align-top text-gray-600 dark:text-gray-300">
                                        <div>{check.message}</div>
                                        {check.detail && <div className="mt-1 font-mono text-xs text-gray-500 dark:text-gray-400">{check.detail}</div>}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            <a
                href="/governance/runtime-modules"
                className="inline-flex items-center gap-2 rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-200 dark:bg-white/[0.06] dark:text-slate-200 dark:hover:bg-white/[0.1]"
            >
                <Boxes className="h-4 w-4" />
                Runtime Modules
            </a>
        </div>
    );
}
