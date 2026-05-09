'use client';

import { useEffect, useMemo, useState } from 'react';
import { Activity, AlertTriangle, CheckCircle2, CircleAlert, FileDown, Gauge, Play, ShieldCheck } from 'lucide-react';

type Role = 'owner' | 'admin' | 'operator' | 'reviewer' | 'viewer' | 'anonymous_local';
type JobType = 'cvf_doctor' | 'provider_check' | 'docs_governance_check' | 'release_gate_dry_readiness' | 'full_live_release_gate';

interface JobEvent {
    eventId: string;
    jobId: string;
    jobType: string;
    status: string;
    decision: string;
    decisionReason: string;
    requestedBy: string;
    role: string;
    recordedAt: string;
    providerLane: string | null;
    stdoutSummary: string;
    stderrSummary: string;
    costQuota?: {
        decision: string;
        decisionReason: string;
        expectedLiveCallCount: number;
        providerLane: string;
        globalUsage: number;
        providerUsage: number;
        globalLimit: number;
        providerLimit: number;
        perJobLimit: number | null;
        cooldownSeconds: number;
        overrideUsed: boolean;
    } | null;
}

interface JobListResponse {
    auditPath: string;
    jobs: JobEvent[];
    costQuota?: {
        policyPath: string;
        auditPath: string;
        windowStart: string;
        windowEnd: string;
        globalUsage: number;
        providerUsage: Record<string, number>;
        policy: {
            globalDailyLiveCallLimit: number;
            providerLanes: Record<string, {
                dailyLiveCallLimit: number;
                perJobLiveCallLimit: Record<string, number>;
            }>;
        };
        estimates: Record<string, {
            expectedLiveCallCount: number;
            providerLane: string;
            estimateBasis: string;
        }>;
    };
}

const JOBS: Array<{ jobType: JobType; label: string; description: string; provider?: 'alibaba' | 'deepseek' }> = [
    {
        jobType: 'cvf_doctor',
        label: 'Runtime Doctor',
        description: 'Read-only install and readiness diagnostics.',
    },
    {
        jobType: 'provider_check',
        provider: 'alibaba',
        label: 'Alibaba Provider Check',
        description: 'Secret-safe live provider readiness validation.',
    },
    {
        jobType: 'provider_check',
        provider: 'deepseek',
        label: 'DeepSeek Provider Check',
        description: 'Secret-safe live provider readiness validation.',
    },
    {
        jobType: 'docs_governance_check',
        label: 'Docs Governance Check',
        description: 'Bounded docs governance compatibility check.',
    },
    {
        jobType: 'release_gate_dry_readiness',
        label: 'Release Gate Dry Readiness',
        description: 'Dry-run release gate readiness only, no live provider E2E.',
    },
    {
        jobType: 'full_live_release_gate',
        label: 'Full Live Release Gate',
        description: 'Runs the full live release gate with provider-backed governance proof.',
    },
];

function mapRole(role?: string): Role {
    if (role === 'developer') return 'operator';
    if (role === 'owner' || role === 'admin' || role === 'operator' || role === 'reviewer' || role === 'viewer') return role;
    return 'anonymous_local';
}

function canTrigger(role: Role, jobType: JobType): boolean {
    if (role === 'owner' || role === 'admin' || role === 'operator') return true;
    return role === 'anonymous_local' && jobType === 'cvf_doctor';
}

function disabledReason(role: Role, jobType: JobType): string {
    if (canTrigger(role, jobType)) return '';
    if (role === 'anonymous_local') return 'Local anonymous mode can only run Runtime Doctor.';
    if (jobType === 'full_live_release_gate') return 'Full live release gate requires owner, admin, or operator role.';
    return 'This role is read-only for governance operations.';
}

function statusClass(status: string): string {
    if (status === 'succeeded') return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200';
    if (status === 'blocked_by_policy') return 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-200';
    if (status === 'failed' || status === 'timed_out') return 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-200';
    return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200';
}

function estimateKey(job: typeof JOBS[number]): string {
    if (job.jobType === 'provider_check') return `provider_check_${job.provider ?? 'alibaba'}`;
    return job.jobType;
}

export default function GovernanceOperationsPage() {
    const [role, setRole] = useState<Role>('anonymous_local');
    const [user, setUser] = useState('Local browser');
    const [jobs, setJobs] = useState<JobEvent[]>([]);
    const [auditPath, setAuditPath] = useState('.cvf/runtime/web-governance-jobs.jsonl');
    const [costQuota, setCostQuota] = useState<JobListResponse['costQuota'] | null>(null);
    const [busyKey, setBusyKey] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const [overrideRequested, setOverrideRequested] = useState(false);
    const [overrideReason, setOverrideReason] = useState('');

    const latest = jobs[0];
    const exportedSummary = useMemo(() => JSON.stringify({ auditPath, jobs: jobs.slice(0, 20) }, null, 2), [auditPath, jobs]);

    async function loadJobs() {
        const response = await fetch('/api/system/jobs', { cache: 'no-store' });
        const data = await response.json() as JobListResponse;
        setJobs(data.jobs ?? []);
        setAuditPath(data.auditPath ?? '.cvf/runtime/web-governance-jobs.jsonl');
        setCostQuota(data.costQuota ?? null);
    }

    useEffect(() => {
        let mounted = true;
        async function load() {
            const auth = await fetch('/api/auth/me', { cache: 'no-store' }).then((r) => r.ok ? r.json() : null).catch(() => null);
            if (mounted && auth?.authenticated) {
                setRole(mapRole(auth.role));
                setUser(auth.user ?? auth.userId ?? 'Authenticated user');
            }
            if (mounted) await loadJobs();
        }
        void load();
        return () => {
            mounted = false;
        };
    }, []);

    async function runJob(job: typeof JOBS[number]) {
        const key = `${job.jobType}:${job.provider ?? 'default'}`;
        setBusyKey(key);
        setMessage(null);
        try {
            const response = await fetch('/api/system/jobs', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({
                    jobType: job.jobType,
                    provider: job.provider,
                    uiRequestId: `ui-${Date.now()}`,
                    costQuotaOverride: overrideRequested ? {
                        requested: true,
                        reason: overrideReason,
                    } : undefined,
                }),
            });
            const result = await response.json();
            setMessage(`${job.label}: ${result.status}${result.decisionReason ? ` (${result.decisionReason})` : ''}`);
            await loadJobs();
        } finally {
            setBusyKey(null);
        }
    }

    async function copySummary() {
        await navigator.clipboard?.writeText(exportedSummary);
        setMessage('Redacted audit summary copied.');
    }

    return (
        <div className="mx-auto max-w-7xl space-y-6 px-4 py-6">
            <header className="flex flex-col gap-4 border-b border-gray-200 pb-5 dark:border-white/[0.08] md:flex-row md:items-start md:justify-between">
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        <ShieldCheck className="h-4 w-4" />
                        Governed Operations
                    </div>
                    <h1 className="text-2xl font-bold text-gray-950 dark:text-white">Web Operations</h1>
                    <p className="max-w-3xl text-sm leading-6 text-gray-600 dark:text-gray-300">
                        Allowlisted non-destructive governance jobs with policy checks and redacted audit trail.
                    </p>
                </div>

                <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-slate-800 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-100">
                    <div className="text-xs font-semibold uppercase tracking-wide">Active role</div>
                    <div className="mt-1 text-lg font-bold">{role}</div>
                    <div className="mt-1 text-xs">{user}</div>
                </div>
            </header>

            {role === 'anonymous_local' && (
                <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100">
                    <AlertTriangle className="mt-0.5 h-4 w-4" />
                    <p className="text-sm leading-6">Local anonymous mode is limited to read-only diagnostics.</p>
                </div>
            )}

            <section className="grid grid-cols-1 gap-4 lg:grid-cols-5">
                {JOBS.map((job) => {
                    const key = `${job.jobType}:${job.provider ?? 'default'}`;
                    const disabled = !canTrigger(role, job.jobType) || busyKey !== null;
                    const estimate = costQuota?.estimates?.[estimateKey(job)];
                    const lane = estimate?.providerLane ?? job.provider ?? null;
                    const providerUsage = lane && lane !== 'none' ? costQuota?.providerUsage?.[lane] : null;
                    const providerLimit = lane && lane !== 'none'
                        ? costQuota?.policy.providerLanes?.[lane]?.dailyLiveCallLimit
                        : null;
                    return (
                        <div
                            key={key}
                            data-testid={`governance-job-card-${job.jobType}-${job.provider ?? 'default'}`}
                            className="rounded-lg border border-gray-200 bg-white p-4 dark:border-white/[0.08] dark:bg-[#151827]"
                        >
                            <div className="flex h-full flex-col justify-between gap-4">
                                <div>
                                    <div className="text-sm font-semibold text-gray-900 dark:text-white">{job.label}</div>
                                    <p className="mt-2 text-xs leading-5 text-gray-600 dark:text-gray-300">{job.description}</p>
                                    {job.jobType === 'full_live_release_gate' && (
                                        <p className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-2 py-1.5 text-xs leading-5 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100">
                                            This consumes live provider quota and is not a dry readiness check.
                                        </p>
                                    )}
                                    {disabledReason(role, job.jobType) && (
                                        <p className="mt-2 text-xs leading-5 text-amber-700 dark:text-amber-300">{disabledReason(role, job.jobType)}</p>
                                    )}
                                    {estimate && (
                                        <div className="mt-3 rounded-md border border-slate-200 bg-slate-50 p-2 text-xs leading-5 text-slate-700 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-slate-200">
                                            <div className="flex items-center gap-1 font-semibold">
                                                <Gauge className="h-3.5 w-3.5" />
                                                Estimate: {estimate.expectedLiveCallCount} live call{estimate.expectedLiveCallCount === 1 ? '' : 's'}
                                            </div>
                                            {providerUsage !== null && providerLimit !== null && (
                                                <div className="mt-1 text-slate-500 dark:text-slate-400">
                                                    {lane}: {providerUsage ?? 0}/{providerLimit}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <button
                                    type="button"
                                    data-testid={`governance-job-run-${job.jobType}-${job.provider ?? 'default'}`}
                                    disabled={disabled}
                                    onClick={() => void runJob(job)}
                                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-600 dark:disabled:bg-gray-800 dark:disabled:text-gray-400"
                                >
                                    <Play className="h-4 w-4" />
                                    {busyKey === key ? 'Running' : 'Run'}
                                </button>
                            </div>
                        </div>
                    );
                })}
            </section>

            {(role === 'owner' || role === 'admin') && (
                <section className="rounded-lg border border-gray-200 bg-white p-4 dark:border-white/[0.08] dark:bg-[#151827]">
                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
                        <CircleAlert className="h-4 w-4 text-amber-500" />
                        Cost/Quota Override
                    </div>
                    <label className="mt-3 flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
                        <input
                            type="checkbox"
                            checked={overrideRequested}
                            onChange={(event) => setOverrideRequested(event.target.checked)}
                            className="h-4 w-4 rounded border-slate-300 text-indigo-600"
                        />
                        Request owner/admin override for the next live job
                    </label>
                    <textarea
                        value={overrideReason}
                        onChange={(event) => setOverrideReason(event.target.value)}
                        disabled={!overrideRequested}
                        rows={2}
                        placeholder="Reason for override"
                        className="mt-3 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 disabled:bg-slate-100 disabled:text-slate-400 dark:border-white/[0.08] dark:bg-slate-950 dark:text-slate-100 dark:disabled:bg-slate-900"
                    />
                </section>
            )}

            {message && (
                <div className="rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-700 dark:border-white/[0.08] dark:bg-[#151827] dark:text-slate-200">
                    {message}
                </div>
            )}

            <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-white/[0.08] dark:bg-[#151827]">
                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
                        <Activity className="h-4 w-4 text-indigo-500" />
                        Latest Job
                    </div>
                    {latest ? (
                        <div className="mt-4 space-y-2 text-sm">
                            <span className={`inline-flex rounded-md px-2 py-1 text-xs font-semibold ${statusClass(latest.status)}`}>{latest.status}</span>
                            <div className="font-mono text-xs text-gray-500 dark:text-gray-400">{latest.jobId}</div>
                            <div className="text-gray-700 dark:text-gray-200">{latest.jobType}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">{latest.decisionReason}</div>
                        </div>
                    ) : (
                        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">No job events recorded.</p>
                    )}
                </div>

                <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-white/[0.08] dark:bg-[#151827] lg:col-span-2">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <div className="text-sm font-semibold text-gray-900 dark:text-white">Audit Trail</div>
                            <div className="mt-1 font-mono text-xs text-gray-500 dark:text-gray-400">{auditPath}</div>
                        </div>
                        <button
                            type="button"
                            onClick={() => void copySummary()}
                            className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-200 dark:bg-white/[0.06] dark:text-slate-200 dark:hover:bg-white/[0.1]"
                        >
                            <FileDown className="h-4 w-4" />
                            Copy Summary
                        </button>
                    </div>
                    <div className="mt-4 space-y-3">
                        {jobs.slice(0, 10).map((job) => (
                            <div key={`${job.jobId}:${job.eventId}`} className="rounded-lg border border-gray-200 p-3 dark:border-white/[0.08]">
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <CheckCircle2 className="h-4 w-4 text-slate-400" />
                                            <span className="font-medium text-gray-900 dark:text-white">{job.jobType}</span>
                                        </div>
                                        <div className="mt-1 font-mono text-xs text-gray-500 dark:text-gray-400">{job.jobId}</div>
                                        <div className="mt-2 text-xs leading-5 text-gray-600 dark:text-gray-300">
                                            {job.stdoutSummary || job.stderrSummary || job.decisionReason}
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-start gap-1 sm:items-end">
                                        <span className={`rounded-md px-2 py-1 text-xs font-semibold ${statusClass(job.status)}`}>{job.status}</span>
                                        <span className="text-xs text-gray-500 dark:text-gray-400">{job.recordedAt}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}
