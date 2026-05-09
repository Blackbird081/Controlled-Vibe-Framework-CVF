import { Boxes, CheckCircle2, CircleAlert, Eye, MinusCircle, ServerCog } from 'lucide-react';
import type { ComponentType } from 'react';
import { getRuntimeModuleRegistry, type RuntimeModuleHealth, type WebExposureState } from '@/lib/server/runtime-modules';

export const dynamic = 'force-dynamic';

const HEALTH_STYLE: Record<RuntimeModuleHealth, { label: string; className: string; icon: ComponentType<{ className?: string }> }> = {
    available: {
        label: 'Available',
        className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200',
        icon: CheckCircle2,
    },
    partial: {
        label: 'Partial',
        className: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-200',
        icon: MinusCircle,
    },
    missing: {
        label: 'Missing',
        className: 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-200',
        icon: CircleAlert,
    },
};

const EXPOSURE_STYLE: Record<WebExposureState, string> = {
    WEB_RUNNABLE: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-200',
    WEB_VISIBLE_READ_ONLY: 'bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-200',
    PARTIAL_INHERITED: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200',
    NOT_EXPOSED: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
};

function HealthBadge({ status }: { status: RuntimeModuleHealth }) {
    const style = HEALTH_STYLE[status];
    const Icon = style.icon;

    return (
        <span className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold ${style.className}`}>
            <Icon className="h-3.5 w-3.5" />
            {style.label}
        </span>
    );
}

export default function RuntimeModulesPage() {
    const registry = getRuntimeModuleRegistry();

    return (
        <div className="mx-auto max-w-7xl space-y-6 px-4 py-6">
            <header className="flex flex-col gap-4 border-b border-gray-200 pb-5 dark:border-white/[0.08] md:flex-row md:items-start md:justify-between">
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        <Boxes className="h-4 w-4" />
                        Runtime Registry
                    </div>
                    <h1 className="text-2xl font-bold text-gray-950 dark:text-white">Runtime Modules</h1>
                    <p className="max-w-3xl text-sm leading-6 text-gray-600 dark:text-gray-300">
                        Core CVF modules and their current Web exposure state.
                    </p>
                </div>

                <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-slate-800 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-100">
                    <div className="text-xs font-semibold uppercase tracking-wide">Boundary</div>
                    <div className="mt-1 max-w-md text-xs leading-5">{registry.boundary}</div>
                </div>
            </header>

            <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-white/[0.08] dark:bg-[#151827]">
                    <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Modules</div>
                    <div className="mt-2 text-2xl font-bold text-gray-950 dark:text-white">{registry.summary.total}</div>
                </div>
                <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-white/[0.08] dark:bg-[#151827]">
                    <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Available</div>
                    <div className="mt-2 text-2xl font-bold text-emerald-700 dark:text-emerald-300">{registry.summary.available}</div>
                </div>
                <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-white/[0.08] dark:bg-[#151827]">
                    <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Web Runnable</div>
                    <div className="mt-2 text-2xl font-bold text-indigo-700 dark:text-indigo-300">{registry.summary.webRunnable}</div>
                </div>
                <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-white/[0.08] dark:bg-[#151827]">
                    <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Not Exposed</div>
                    <div className="mt-2 text-2xl font-bold text-slate-700 dark:text-slate-200">{registry.summary.notExposed}</div>
                </div>
            </section>

            <section className="overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-white/[0.08] dark:bg-[#151827]">
                <div className="flex flex-col gap-2 border-b border-gray-200 px-4 py-3 dark:border-white/[0.08] sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Module Registry</h2>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Updated {registry.generatedAt}</div>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 text-sm dark:divide-white/[0.08]">
                        <thead className="bg-gray-50 dark:bg-white/[0.03]">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Health</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Module</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Exposure</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Runtime</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Evidence</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-white/[0.08]">
                            {registry.modules.map((module) => (
                                <tr key={module.id}>
                                    <td className="px-4 py-3 align-top">
                                        <HealthBadge status={module.healthStatus} />
                                    </td>
                                    <td className="px-4 py-3 align-top">
                                        <div className="font-medium text-gray-900 dark:text-white">{module.name}</div>
                                        <div className="mt-1 font-mono text-xs text-gray-500 dark:text-gray-400">{module.repoPath}</div>
                                        <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">{module.sourceMarker}</div>
                                    </td>
                                    <td className="px-4 py-3 align-top">
                                        <span className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold ${EXPOSURE_STYLE[module.webExposureState]}`}>
                                            <Eye className="h-3.5 w-3.5" />
                                            {module.webExposureState}
                                        </span>
                                        {module.exposedActions.length > 0 && (
                                            <div className="mt-2 flex flex-wrap gap-1">
                                                {module.exposedActions.map((action) => (
                                                    <span key={action} className="rounded-md bg-gray-100 px-2 py-1 font-mono text-[11px] text-gray-700 dark:bg-gray-800 dark:text-gray-200">
                                                        {action}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 align-top">
                                        <div className="font-mono text-xs text-gray-700 dark:text-gray-200">{module.runtimeClass}</div>
                                        <div className="mt-2 text-xs leading-5 text-gray-500 dark:text-gray-400">{module.healthMessage}</div>
                                        {module.packageScripts.length > 0 && (
                                            <div className="mt-2 flex flex-wrap gap-1">
                                                {module.packageScripts.map((script) => (
                                                    <span key={script} className="rounded-md bg-slate-100 px-2 py-1 font-mono text-[11px] text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                                                        {script}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 align-top">
                                        <div className="text-xs leading-5 text-gray-600 dark:text-gray-300">{module.evidenceOwner}</div>
                                        <div className="mt-2 text-xs leading-5 text-gray-500 dark:text-gray-400">{module.notes}</div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            <a
                href="/governance/system-health"
                className="inline-flex items-center gap-2 rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-200 dark:bg-white/[0.06] dark:text-slate-200 dark:hover:bg-white/[0.1]"
            >
                <ServerCog className="h-4 w-4" />
                System Health
            </a>
        </div>
    );
}
