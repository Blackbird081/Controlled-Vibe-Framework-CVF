import { appendFileSync, existsSync, mkdirSync, readFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { execFile } from 'child_process';
import { randomUUID } from 'crypto';
import { promisify } from 'util';
import {
    evaluateCostQuotaPreflight,
    summarizeCostQuota,
    type CostQuotaOverrideRequest,
    type CostQuotaPreflightResult,
    type CostQuotaSummary,
} from './web-governance-cost-quota';

const execFileAsync = promisify(execFile);

export type GovernanceJobType =
    | 'cvf_doctor'
    | 'provider_check'
    | 'docs_governance_check'
    | 'release_gate_dry_readiness'
    | 'full_live_release_gate';

export type GovernanceRole = 'owner' | 'admin' | 'operator' | 'reviewer' | 'viewer' | 'anonymous_local';
export type GovernanceAuthMode = 'authenticated' | 'service_token' | 'anonymous_local' | 'unknown';
export type GovernanceRequestIpClass = 'loopback' | 'private_network' | 'public_or_unknown' | 'not_recorded';
export type GovernanceJobStatus = 'queued' | 'running' | 'succeeded' | 'failed' | 'timed_out' | 'blocked_by_policy' | 'orphaned';
export type GovernanceDecision = 'allowed' | 'blocked_by_policy';
export type GovernanceJobEventType = 'requested' | GovernanceJobStatus;

export interface GovernanceJobRequest {
    jobType: GovernanceJobType | string;
    provider?: 'alibaba' | 'deepseek' | string;
    role: GovernanceRole | string;
    requestedBy: string;
    authMode: GovernanceAuthMode | string;
    localMode: boolean;
    requestIpClass: GovernanceRequestIpClass | string;
    uiRequestId?: string;
    timeoutMsOverride?: number;
    costQuotaOverride?: CostQuotaOverrideRequest;
}

export interface GovernanceJobEvent {
    eventId: string;
    jobId: string;
    eventType: GovernanceJobEventType;
    jobType: string;
    requestedBy: string;
    role: string;
    authMode: string;
    localMode: boolean;
    requestIpClass: string;
    requestedAt: string;
    recordedAt: string;
    decision: GovernanceDecision;
    decisionReason: string;
    status: GovernanceJobStatus;
    cwdLabel: string;
    handlerId: string;
    fixedArgv: string[];
    providerLane: string | null;
    redactionApplied: boolean;
    stdoutSummary: string;
    stderrSummary: string;
    exitCode: number | null;
    timeoutMs: number;
    timedOut: boolean;
    errorClass: string | null;
    evidenceRefs: string[];
    uiRequestId: string;
    correlationId: string;
    costQuota: CostQuotaEventSnapshot | null;
}

export interface GovernanceJobResult {
    jobId: string;
    status: GovernanceJobStatus;
    decision: GovernanceDecision;
    decisionReason: string;
    auditPath: string;
    latestEvent: GovernanceJobEvent;
    costQuota: CostQuotaEventSnapshot | null;
}

export interface GovernanceJobList {
    auditPath: string;
    events: GovernanceJobEvent[];
    jobs: GovernanceJobEvent[];
    costQuota: CostQuotaSummary;
}

export interface CostQuotaEventSnapshot {
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
    auditPath: string;
}

interface JobDefinition {
    jobType: GovernanceJobType;
    className: 'read_only_diagnostics' | 'provider_readiness_validation' | 'targeted_non_destructive_governance_check' | 'release_gate_dry_readiness' | 'full_live_release_gate';
    handlerId: string;
    timeoutMs: number;
    buildArgv: (request: GovernanceJobRequest) => string[];
}

interface CommandResult {
    stdout: string;
    stderr: string;
    exitCode: number | null;
    timedOut: boolean;
    errorClass: string | null;
}

interface WebGovernanceJobOptions {
    repoRoot?: string;
    auditPath?: string;
    now?: () => string;
    idFactory?: () => string;
    runCommand?: (command: string, argv: string[], options: { cwd: string; timeoutMs: number }) => Promise<CommandResult>;
}

const KNOWN_SECRET_ENV_NAMES = [
    'DASHSCOPE_API_KEY',
    'ALIBABA_API_KEY',
    'CVF_ALIBABA_API_KEY',
    'CVF_BENCHMARK_ALIBABA_KEY',
    'DEEPSEEK_API_KEY',
];

const JOBS: Record<GovernanceJobType, JobDefinition> = {
    cvf_doctor: {
        jobType: 'cvf_doctor',
        className: 'read_only_diagnostics',
        handlerId: 'scripts.cvf_doctor.json',
        timeoutMs: 30_000,
        buildArgv: () => ['scripts/cvf_doctor.py', '--json'],
    },
    provider_check: {
        jobType: 'provider_check',
        className: 'provider_readiness_validation',
        handlerId: 'scripts.cvf_provider_check.json.live',
        timeoutMs: 30_000,
        buildArgv: (request) => ['scripts/cvf_provider_check.py', '--provider', request.provider === 'deepseek' ? 'deepseek' : 'alibaba', '--live', '--json'],
    },
    docs_governance_check: {
        jobType: 'docs_governance_check',
        className: 'targeted_non_destructive_governance_check',
        handlerId: 'governance.compat.check_docs_governance_compat',
        timeoutMs: 30_000,
        buildArgv: () => ['governance/compat/check_docs_governance_compat.py', '--base', 'HEAD~1', '--head', 'HEAD', '--json'],
    },
    release_gate_dry_readiness: {
        jobType: 'release_gate_dry_readiness',
        className: 'release_gate_dry_readiness',
        handlerId: 'scripts.run_cvf_release_gate_bundle.dry_run',
        timeoutMs: 45_000,
        buildArgv: () => ['scripts/run_cvf_release_gate_bundle.py', '--dry-run', '--json'],
    },
    full_live_release_gate: {
        jobType: 'full_live_release_gate',
        className: 'full_live_release_gate',
        handlerId: 'scripts.run_cvf_release_gate_bundle.live',
        timeoutMs: 900_000,
        buildArgv: () => ['scripts/run_cvf_release_gate_bundle.py', '--json'],
    },
};

function defaultAuditPath(repoRoot: string): string {
    return resolve(repoRoot, '.cvf', 'runtime', 'web-governance-jobs.jsonl');
}

function resolveRepoRoot(options: WebGovernanceJobOptions): string {
    return options.repoRoot ?? resolve(process.cwd(), '..', '..', '..');
}

function eventId(options: WebGovernanceJobOptions): string {
    return options.idFactory?.() ?? randomUUID();
}

function outputCap(value: string): string {
    return value.length > 12_000 ? `${value.slice(0, 12_000)}\n[TRUNCATED]` : value;
}

export function redactGovernanceJobOutput(value: string, env: NodeJS.ProcessEnv = process.env): string {
    let redacted = value;
    for (const name of KNOWN_SECRET_ENV_NAMES) {
        const secretValue = env[name];
        if (secretValue) {
            redacted = redacted.split(secretValue).join('[REDACTED]');
        }
        redacted = redacted.replace(new RegExp(`${name}\\s*[=:]\\s*[^\\s"']+`, 'gi'), `${name}=[REDACTED]`);
    }
    redacted = redacted.replace(/\b(sk|ak|rk|dashscope|deepseek|alibaba)[-_][A-Za-z0-9_\-.]{20,}\b/gi, '[REDACTED]');
    redacted = redacted.replace(/\b[A-Za-z0-9_\-]{48,}\b/g, '[REDACTED]');
    return outputCap(redacted);
}

function isKnownRole(role: string): role is GovernanceRole {
    return ['owner', 'admin', 'operator', 'reviewer', 'viewer', 'anonymous_local'].includes(role);
}

function canTrigger(request: GovernanceJobRequest, definition: JobDefinition | null): { allowed: boolean; reason: string } {
    if (!definition) return { allowed: false, reason: 'unknown_job_type' };
    if (!isKnownRole(request.role)) return { allowed: false, reason: 'unknown_role' };
    if (!['authenticated', 'service_token', 'anonymous_local', 'unknown'].includes(request.authMode)) {
        return { allowed: false, reason: 'unknown_auth_mode' };
    }
    if (!['loopback', 'private_network', 'public_or_unknown', 'not_recorded'].includes(request.requestIpClass)) {
        return { allowed: false, reason: 'unknown_request_ip_class' };
    }
    if (request.jobType === 'provider_check' && !['alibaba', 'deepseek'].includes(request.provider ?? 'alibaba')) {
        return { allowed: false, reason: 'invalid_provider' };
    }
    if (request.role === 'anonymous_local') {
        const localDiagnostics = definition.className === 'read_only_diagnostics' &&
            request.localMode &&
            request.requestIpClass === 'loopback';
        return localDiagnostics
            ? { allowed: true, reason: 'anonymous_local_diagnostics_allowed' }
            : { allowed: false, reason: 'anonymous_local_trigger_not_allowed' };
    }
    if (request.role === 'reviewer' || request.role === 'viewer') {
        return { allowed: false, reason: 'read_only_role_cannot_trigger' };
    }
    return { allowed: true, reason: 'role_authorized' };
}

function appendEvent(auditPath: string, event: GovernanceJobEvent): void {
    mkdirSync(dirname(auditPath), { recursive: true });
    appendFileSync(auditPath, `${JSON.stringify(event)}\n`, 'utf8');
}

function resolveTimeoutMs(request: GovernanceJobRequest, definition: JobDefinition | null): number {
    if (!definition) return 0;
    const override = request.timeoutMsOverride;
    if (override === undefined || !Number.isFinite(override)) return definition.timeoutMs;
    const normalized = Math.floor(override);
    if (normalized < 1) return definition.timeoutMs;
    return Math.min(normalized, definition.timeoutMs);
}

function readEnvFileValue(path: string, names: string[]): boolean {
    if (!existsSync(path)) return false;
    const content = readFileSync(path, 'utf8');
    for (const line of content.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eq = trimmed.indexOf('=');
        if (eq === -1) continue;
        const key = trimmed.slice(0, eq).trim();
        const value = trimmed.slice(eq + 1).trim().replace(/^['"]|['"]$/g, '');
        if (names.includes(key) && value) return true;
    }
    return false;
}

function hasLiveReleaseGateKey(repoRoot: string): boolean {
    const names = ['DASHSCOPE_API_KEY', 'ALIBABA_API_KEY', 'CVF_ALIBABA_API_KEY', 'CVF_BENCHMARK_ALIBABA_KEY'];
    if (names.some((name) => Boolean(process.env[name]))) return true;
    return readEnvFileValue(resolve(repoRoot, 'EXTENSIONS', 'CVF_v1.6_AGENT_PLATFORM', 'cvf-web', '.env.local'), names);
}

function hasActiveFullReleaseGate(auditPath: string): boolean {
    if (!existsSync(auditPath)) return false;
    const latestByJob = new Map<string, GovernanceJobEvent>();
    for (const line of readFileSync(auditPath, 'utf8').split(/\r?\n/).filter(Boolean)) {
        const event = JSON.parse(line) as GovernanceJobEvent;
        latestByJob.set(event.jobId, event);
    }
    return Array.from(latestByJob.values()).some((event) => (
        event.jobType === 'full_live_release_gate' &&
        (event.status === 'queued' || event.status === 'running')
    ));
}

function makeEvent(input: {
    options: WebGovernanceJobOptions;
    request: GovernanceJobRequest;
    jobId: string;
    eventType: GovernanceJobEventType;
    status: GovernanceJobStatus;
    decision: GovernanceDecision;
    decisionReason: string;
    definition: JobDefinition | null;
    fixedArgv: string[];
    providerLane: string | null;
    stdoutSummary?: string;
    stderrSummary?: string;
    exitCode?: number | null;
    timedOut?: boolean;
    errorClass?: string | null;
    requestedAt: string;
    correlationId: string;
    repoRoot: string;
    timeoutMs: number;
    costQuota?: CostQuotaPreflightResult | null;
}): GovernanceJobEvent {
    const recordedAt = input.options.now?.() ?? new Date().toISOString();
    return {
        eventId: eventId(input.options),
        jobId: input.jobId,
        eventType: input.eventType,
        jobType: input.request.jobType,
        requestedBy: input.request.requestedBy,
        role: input.request.role,
        authMode: input.request.authMode,
        localMode: input.request.localMode,
        requestIpClass: input.request.requestIpClass,
        requestedAt: input.requestedAt,
        recordedAt,
        decision: input.decision,
        decisionReason: input.decisionReason,
        status: input.status,
        cwdLabel: input.repoRoot.split(/[\\/]/).pop() ?? 'repo',
        handlerId: input.definition?.handlerId ?? 'none',
        fixedArgv: input.fixedArgv,
        providerLane: input.providerLane,
        redactionApplied: true,
        stdoutSummary: redactGovernanceJobOutput(input.stdoutSummary ?? ''),
        stderrSummary: redactGovernanceJobOutput(input.stderrSummary ?? ''),
        exitCode: input.exitCode ?? null,
        timeoutMs: input.timeoutMs,
        timedOut: input.timedOut ?? false,
        errorClass: input.errorClass ?? null,
        evidenceRefs: [],
        uiRequestId: input.request.uiRequestId ?? input.correlationId,
        correlationId: input.correlationId,
        costQuota: input.costQuota ? {
            decision: input.costQuota.decision,
            decisionReason: input.costQuota.decisionReason,
            expectedLiveCallCount: input.costQuota.estimate.expectedLiveCallCount,
            providerLane: input.costQuota.estimate.providerLane,
            globalUsage: input.costQuota.globalUsage,
            providerUsage: input.costQuota.providerUsage,
            globalLimit: input.costQuota.globalLimit,
            providerLimit: input.costQuota.providerLimit,
            perJobLimit: input.costQuota.perJobLimit,
            cooldownSeconds: input.costQuota.cooldownSeconds,
            overrideUsed: input.costQuota.overrideUsed,
            auditPath: input.costQuota.auditPath,
        } : null,
    };
}

async function defaultRunCommand(command: string, argv: string[], options: { cwd: string; timeoutMs: number }): Promise<CommandResult> {
    try {
        const isFullReleaseGate = argv[0] === 'scripts/run_cvf_release_gate_bundle.py' && argv.includes('--json') && !argv.includes('--dry-run');
        if (
            isFullReleaseGate &&
            process.env.CVF_WEB_GOVERNANCE_REDACTION_PROBE === 'run_command_fake_key' &&
            process.env.NODE_ENV !== 'production'
        ) {
            const fakeKey = 'test_invalid_cvf_redaction_probe_20260508';
            return {
                stdout: `provider_key=${fakeKey}\nrelease_gate_result=PASS`,
                stderr: `ALIBABA_API_KEY=${fakeKey}`,
                exitCode: 0,
                timedOut: false,
                errorClass: null,
            };
        }
        const releaseGateEnv: NodeJS.ProcessEnv = { ...process.env };
        delete (releaseGateEnv as Record<string, string | undefined>).NODE_ENV;
        delete (releaseGateEnv as Record<string, string | undefined>).TURBOPACK;
        releaseGateEnv.CVF_PLAYWRIGHT_PORT = process.env.CVF_PLAYWRIGHT_PORT ?? '3011';
        releaseGateEnv.PLAYWRIGHT_BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:3011';
        releaseGateEnv.NEXT_DIST_DIR = process.env.NEXT_DIST_DIR ?? '.next-cvf-release-gate';
        const env: NodeJS.ProcessEnv = isFullReleaseGate ? releaseGateEnv : process.env;
        const result = await execFileAsync(command, argv, {
            cwd: options.cwd,
            timeout: options.timeoutMs,
            windowsHide: true,
            maxBuffer: isFullReleaseGate ? 8 * 1024 * 1024 : 1024 * 1024,
            env,
        });
        return {
            stdout: result.stdout ?? '',
            stderr: result.stderr ?? '',
            exitCode: 0,
            timedOut: false,
            errorClass: null,
        };
    } catch (error) {
        const err = error as { stdout?: string; stderr?: string; code?: number | string; killed?: boolean; signal?: string };
        const timedOut = err.killed === true || err.signal === 'SIGTERM';
        return {
            stdout: err.stdout ?? '',
            stderr: err.stderr ?? '',
            exitCode: typeof err.code === 'number' ? err.code : null,
            timedOut,
            errorClass: timedOut ? 'timeout' : 'process_failed',
        };
    }
}

export async function submitGovernanceJob(request: GovernanceJobRequest, options: WebGovernanceJobOptions = {}): Promise<GovernanceJobResult> {
    const repoRoot = resolveRepoRoot(options);
    const auditPath = options.auditPath ?? defaultAuditPath(repoRoot);
    const now = options.now ?? (() => new Date().toISOString());
    const jobId = eventId(options);
    const correlationId = eventId(options);
    const requestedAt = now();
    const definition = JOBS[request.jobType as GovernanceJobType] ?? null;
    let permission = canTrigger(request, definition);
    const fixedArgv = definition?.buildArgv(request) ?? [];
    const providerLane = request.jobType === 'provider_check'
        ? request.provider ?? 'alibaba'
        : request.jobType === 'full_live_release_gate'
            ? 'alibaba'
            : null;
    const timeoutMs = resolveTimeoutMs(request, definition);

    if (permission.allowed && request.jobType === 'full_live_release_gate') {
        if (hasActiveFullReleaseGate(auditPath)) {
            permission = { allowed: false, reason: 'full_release_gate_already_running' };
        } else if (!hasLiveReleaseGateKey(repoRoot)) {
            permission = { allowed: false, reason: 'missing_live_provider_key' };
        }
    }

    const liveEstimateJobTypes = ['provider_check', 'full_live_release_gate'];
    const costQuota = permission.allowed && liveEstimateJobTypes.includes(String(request.jobType))
        ? evaluateCostQuotaPreflight({
            repoRoot,
            jobId,
            jobType: String(request.jobType),
            providerLane,
            role: String(request.role),
            requestedBy: String(request.requestedBy),
            override: request.costQuotaOverride,
            now,
            idFactory: options.idFactory,
        })
        : null;

    if (costQuota?.decision === 'blocked_by_policy') {
        permission = { allowed: false, reason: costQuota.decisionReason };
    }

    const requestedEvent = makeEvent({
        options,
        request,
        jobId,
        eventType: 'requested',
        status: permission.allowed ? 'queued' : 'blocked_by_policy',
        decision: permission.allowed ? 'allowed' : 'blocked_by_policy',
        decisionReason: permission.reason,
        definition,
        fixedArgv,
        providerLane,
        requestedAt,
        correlationId,
        repoRoot,
        timeoutMs,
        costQuota,
    });
    appendEvent(auditPath, requestedEvent);

    if (!permission.allowed || !definition) {
        const blockedEvent = makeEvent({
            options,
            request,
            jobId,
            eventType: 'blocked_by_policy',
            status: 'blocked_by_policy',
            decision: 'blocked_by_policy',
            decisionReason: permission.reason,
            definition,
            fixedArgv,
            providerLane,
            requestedAt,
            correlationId,
            repoRoot,
            timeoutMs,
            costQuota,
        });
        appendEvent(auditPath, blockedEvent);
        return {
            jobId,
            status: 'blocked_by_policy',
            decision: 'blocked_by_policy',
            decisionReason: permission.reason,
            auditPath,
            latestEvent: blockedEvent,
            costQuota: blockedEvent.costQuota,
        };
    }

    const runningEvent = makeEvent({
        options,
        request,
        jobId,
        eventType: 'running',
        status: 'running',
        decision: 'allowed',
        decisionReason: permission.reason,
        definition,
        fixedArgv,
        providerLane,
        requestedAt,
        correlationId,
        repoRoot,
        timeoutMs,
        costQuota,
    });
    appendEvent(auditPath, runningEvent);

    const runner = options.runCommand ?? defaultRunCommand;
    const commandResult = await runner('python', fixedArgv, {
        cwd: repoRoot,
        timeoutMs,
    });
    const finalStatus: GovernanceJobStatus = commandResult.timedOut
        ? 'timed_out'
        : commandResult.exitCode === 0
            ? 'succeeded'
            : 'failed';
    const finalEvent = makeEvent({
        options,
        request,
        jobId,
        eventType: finalStatus,
        status: finalStatus,
        decision: 'allowed',
        decisionReason: permission.reason,
        definition,
        fixedArgv,
        providerLane,
        stdoutSummary: commandResult.stdout,
        stderrSummary: commandResult.stderr,
        exitCode: commandResult.exitCode,
        timedOut: commandResult.timedOut,
        errorClass: commandResult.errorClass,
        requestedAt,
        correlationId,
        repoRoot,
        timeoutMs,
        costQuota,
    });
    appendEvent(auditPath, finalEvent);

    return {
        jobId,
        status: finalStatus,
        decision: 'allowed',
        decisionReason: permission.reason,
        auditPath,
        latestEvent: finalEvent,
        costQuota: finalEvent.costQuota,
    };
}

export function listGovernanceJobs(options: WebGovernanceJobOptions = {}): GovernanceJobList {
    const repoRoot = resolveRepoRoot(options);
    const auditPath = options.auditPath ?? defaultAuditPath(repoRoot);
    if (!existsSync(auditPath)) {
        return { auditPath, events: [], jobs: [], costQuota: summarizeCostQuota(repoRoot) };
    }
    const events = readFileSync(auditPath, 'utf8')
        .split(/\r?\n/)
        .filter(Boolean)
        .map((line) => JSON.parse(line) as GovernanceJobEvent);
    const latestByJob = new Map<string, GovernanceJobEvent>();
    for (const event of events) {
        latestByJob.set(event.jobId, event);
    }
    return {
        auditPath,
        events,
        jobs: Array.from(latestByJob.values()).reverse(),
        costQuota: summarizeCostQuota(repoRoot),
    };
}
