import { existsSync } from 'fs';
import { resolve } from 'path';
import { listGovernanceJobs, type GovernanceJobEvent } from './web-governance-jobs';
import { getSystemHealth } from './system-health';

export type RuntimeSeverity = 'INFO' | 'NOTICE' | 'WARNING' | 'HIGH' | 'CRITICAL';
export type RuntimeDashboardMode = 'READ_ONLY_MODE';

export interface RuntimeSourceRecord {
    source: string;
    correlationId: string;
    observedAt: string;
    receiptId?: string;
}

export interface RuntimeSessionRecord extends RuntimeSourceRecord {
    sessionId: string;
    agentType: string;
    provider: string;
    projectPath: string;
    status: string;
    startedAt: string;
    lastActivityAt: string;
    riskLevel: RuntimeSeverity;
}

export interface RuntimeTokenRecord extends RuntimeSourceRecord {
    sessionId: string;
    provider: string;
    model: string;
    inputTokens: number | null;
    outputTokens: number | null;
    totalTokens: number | null;
    contextWindowSize: number | null;
    contextUsedPercent: number | null;
    contextWarningLevel: 'NORMAL' | 'NOTICE' | 'WARNING' | 'HIGH' | 'CRITICAL' | 'UNKNOWN';
    estimatedCost: number | null;
    verifiedSource: boolean;
}

export interface RuntimeRateLimitRecord extends RuntimeSourceRecord {
    provider: string;
    model: string;
    requestLimitStatus: string;
    tokenLimitStatus: string;
    resetWindow: string | null;
    quotaPressureLevel: 'NORMAL' | 'NOTICE' | 'WARNING' | 'HIGH' | 'CRITICAL' | 'UNKNOWN';
}

export interface RuntimeProcessRecord extends RuntimeSourceRecord {
    pid: number;
    parentPid: number | null;
    sessionId: string | null;
    command: string;
    cwd: string;
    status: 'RUNNING' | 'IDLE' | 'EXITED' | 'ORPHANED' | 'UNKNOWN';
    childProcessCount: number;
    riskLevel: RuntimeSeverity;
}

export interface RuntimePortRecord extends RuntimeSourceRecord {
    port: number;
    protocol: string;
    pid: number | null;
    sessionId: string | null;
    status: 'OPEN' | 'CLOSED' | 'ORPHANED' | 'UNKNOWN';
    ownerProcess: string;
    orphanStatus: 'TRUE' | 'FALSE' | 'UNKNOWN';
    riskLevel: RuntimeSeverity;
}

export interface RuntimeEventRecord extends RuntimeSourceRecord {
    eventId: string;
    eventType: string;
    severity: RuntimeSeverity;
    category: string;
    policyRequired: boolean;
    payload: Record<string, string | number | boolean | null>;
    createdAt: string;
}

export interface RuntimeAlertRecord extends RuntimeSourceRecord {
    alertId: string;
    eventType: string;
    severity: RuntimeSeverity;
    message: string;
    recommendedAction: string;
    policyRequired: boolean;
    createdAt: string;
}

export interface RuntimeObservabilitySnapshot {
    mode: RuntimeDashboardMode;
    generatedAt: string;
    refreshPolicy: {
        defaultRefreshIntervalMs: number;
        minimumRefreshIntervalMs: number;
        maximumRefreshIntervalMs: number;
        readOnlySafe: true;
    };
    panels: {
        sessions: RuntimeSessionRecord[];
        tokenContext: RuntimeTokenRecord[];
        rateLimits: RuntimeRateLimitRecord[];
        processes: RuntimeProcessRecord[];
        ports: RuntimePortRecord[];
        alerts: RuntimeAlertRecord[];
        events: RuntimeEventRecord[];
    };
    summary: {
        activeSessions: number;
        highestSeverity: RuntimeSeverity;
        policyRequiredCount: number;
        alertsBySeverity: Record<RuntimeSeverity, number>;
    };
    allowedActions: string[];
    blockedInterventions: string[];
    emptyStates: {
        sessions: string;
        tokenContext: string;
        ports: string;
    };
    claimBoundary: string;
}

interface RuntimeObservabilityOptions {
    repoRoot?: string;
    appRoot?: string;
    now?: () => string;
}

const ALLOWED_ACTIONS = ['observe', 'summarize', 'alert', 'emit_receipt', 'recommend_escalation'];
const BLOCKED_INTERVENTIONS = [
    'approve',
    'kill_process',
    'close_port',
    'reroute_provider',
    'change_policy',
    'truncate_context',
    'inject_prompt',
    'delete_audit',
];

const EMPTY_COUNTS: Record<RuntimeSeverity, number> = {
    INFO: 0,
    NOTICE: 0,
    WARNING: 0,
    HIGH: 0,
    CRITICAL: 0,
};

export function getRuntimeObservabilitySnapshot(options: RuntimeObservabilityOptions = {}): RuntimeObservabilitySnapshot {
    const generatedAt = options.now?.() ?? new Date().toISOString();
    const appRoot = options.appRoot ?? process.cwd();
    const repoRoot = options.repoRoot ?? resolve(appRoot, '..', '..', '..');
    const jobs = listGovernanceJobs({ repoRoot });
    const latestJob = jobs.jobs[0] ?? null;
    const systemHealth = getSystemHealth({ appRoot, repoRoot, now: () => generatedAt });
    const correlationId = latestJob?.correlationId ?? 'web-runtime-local';
    const observedAt = latestJob?.recordedAt ?? generatedAt;

    const sessions = latestJob ? [sessionFromJob(latestJob)] : [];
    const tokenContext = [tokenRecordFromJob(latestJob, correlationId, observedAt)];
    const rateLimits = buildRateLimitRecords(jobs.costQuota, correlationId, generatedAt);
    const processes = [currentProcessRecord(correlationId, generatedAt)];
    const ports = buildPortRecords(correlationId, generatedAt);
    const events = [
        ...sessions.map((session) => eventFromSession(session, generatedAt)),
        ...tokenContext.map((record) => eventFromToken(record, generatedAt)),
        ...rateLimits.map((record) => eventFromRateLimit(record, generatedAt)),
        ...processes.flatMap((record) => eventFromProcess(record, generatedAt)),
        ...ports.flatMap((record) => eventFromPort(record, generatedAt)),
        systemHealth.status === 'blocked'
            ? buildEvent('CVF_SYSTEM_HEALTH', correlationId, 'SYSTEM_HEALTH_BLOCKED', 'HIGH', 'POLICY_EVENT', true, generatedAt, {
                status: systemHealth.status,
            })
            : buildEvent('CVF_SYSTEM_HEALTH', correlationId, 'SYSTEM_HEALTH_UPDATED', 'INFO', 'POLICY_EVENT', false, generatedAt, {
                status: systemHealth.status,
            }),
    ];
    const alerts = events
        .filter((event) => severityRank(event.severity) >= severityRank('NOTICE'))
        .map(alertFromEvent);
    const counts = alerts.reduce((acc, alert) => {
        acc[alert.severity] += 1;
        return acc;
    }, { ...EMPTY_COUNTS });
    const highestSeverity = alerts.reduce(
        (highest, alert) => severityRank(alert.severity) > severityRank(highest) ? alert.severity : highest,
        'INFO' as RuntimeSeverity,
    );

    return {
        mode: 'READ_ONLY_MODE',
        generatedAt,
        refreshPolicy: {
            defaultRefreshIntervalMs: 2000,
            minimumRefreshIntervalMs: 1000,
            maximumRefreshIntervalMs: 30000,
            readOnlySafe: true,
        },
        panels: {
            sessions,
            tokenContext,
            rateLimits,
            processes,
            ports,
            alerts,
            events,
        },
        summary: {
            activeSessions: sessions.filter((session) => session.status === 'ACTIVE').length,
            highestSeverity,
            policyRequiredCount: alerts.filter((alert) => alert.policyRequired).length,
            alertsBySeverity: counts,
        },
        allowedActions: ALLOWED_ACTIONS,
        blockedInterventions: BLOCKED_INTERVENTIONS,
        emptyStates: {
            sessions: 'No active governed runtime session detected. Observability is standing by.',
            tokenContext: 'No verified token metadata is available yet. CVF will not guess usage.',
            ports: 'No managed port record is visible to the web process.',
        },
        claimBoundary: 'Observability shows runtime state and recommended next steps. It does not approve, reroute, clean up, or change policy.',
    };
}

function sessionFromJob(job: GovernanceJobEvent): RuntimeSessionRecord {
    return {
        sessionId: job.jobId,
        agentType: 'CVF_MANAGED_SESSION',
        provider: job.providerLane ?? 'none',
        projectPath: job.cwdLabel,
        status: jobStatusToSessionStatus(job.status),
        startedAt: job.requestedAt,
        lastActivityAt: job.recordedAt,
        riskLevel: jobStatusToSeverity(job.status),
        source: 'CVF_AGENT_SESSION_MONITOR',
        correlationId: job.correlationId,
        observedAt: job.recordedAt,
        receiptId: job.evidenceRefs[0],
    };
}

function tokenRecordFromJob(job: GovernanceJobEvent | null, correlationId: string, observedAt: string): RuntimeTokenRecord {
    return {
        sessionId: job?.jobId ?? 'web-runtime-local',
        provider: job?.providerLane ?? 'unknown',
        model: 'provider-metadata-unavailable',
        inputTokens: null,
        outputTokens: null,
        totalTokens: null,
        contextWindowSize: null,
        contextUsedPercent: null,
        contextWarningLevel: 'UNKNOWN',
        estimatedCost: null,
        verifiedSource: false,
        source: 'CVF_TOKEN_CONTEXT_METER',
        correlationId,
        observedAt,
    };
}

function buildRateLimitRecords(
    costQuota: ReturnType<typeof listGovernanceJobs>['costQuota'],
    correlationId: string,
    observedAt: string,
): RuntimeRateLimitRecord[] {
    return Object.entries(costQuota.policy.providerLanes).map(([provider, policy]) => {
        const usage = costQuota.providerUsage[provider] ?? 0;
        const pressure = quotaPressure(usage, policy.dailyLiveCallLimit);
        return {
            provider,
            model: 'all-configured-models',
            requestLimitStatus: pressure,
            tokenLimitStatus: 'UNKNOWN',
            resetWindow: costQuota.windowEnd,
            quotaPressureLevel: pressure,
            source: 'CVF_RATE_LIMIT_WATCHER',
            correlationId,
            observedAt,
        };
    });
}

function currentProcessRecord(correlationId: string, observedAt: string): RuntimeProcessRecord {
    return {
        pid: process.pid,
        parentPid: typeof process.ppid === 'number' ? process.ppid : null,
        sessionId: 'web-runtime-local',
        command: 'next-server-process',
        cwd: process.cwd(),
        status: 'RUNNING',
        childProcessCount: 0,
        riskLevel: 'INFO',
        source: 'CVF_PROCESS_PORT_GUARD',
        correlationId,
        observedAt,
    };
}

function buildPortRecords(correlationId: string, observedAt: string): RuntimePortRecord[] {
    const port = Number(process.env.PORT);
    if (!Number.isFinite(port) || port <= 0) return [];
    return [{
        port,
        protocol: 'tcp',
        pid: process.pid,
        sessionId: 'web-runtime-local',
        status: 'OPEN',
        ownerProcess: 'next-server-process',
        orphanStatus: 'FALSE',
        riskLevel: 'INFO',
        source: 'CVF_PROCESS_PORT_GUARD',
        correlationId,
        observedAt,
    }];
}

function eventFromSession(session: RuntimeSessionRecord, createdAt: string): RuntimeEventRecord {
    return buildEvent(session.source, session.correlationId, `SESSION_${session.status}`, session.riskLevel, 'SESSION_EVENT', severityRank(session.riskLevel) >= severityRank('HIGH'), createdAt, {
        sessionId: session.sessionId,
        provider: session.provider,
        status: session.status,
    });
}

function eventFromToken(record: RuntimeTokenRecord, createdAt: string): RuntimeEventRecord {
    return buildEvent(record.source, record.correlationId, 'CONTEXT_USAGE_UNAVAILABLE', 'NOTICE', 'TOKEN_EVENT', false, createdAt, {
        sessionId: record.sessionId,
        provider: record.provider,
        verifiedSource: record.verifiedSource,
    });
}

function eventFromRateLimit(record: RuntimeRateLimitRecord, createdAt: string): RuntimeEventRecord {
    const severity = severityFromPressure(record.quotaPressureLevel);
    const eventType = severity === 'INFO' ? 'RATE_LIMIT_UPDATED' : `RATE_LIMIT_${record.quotaPressureLevel}`;
    return buildEvent(record.source, record.correlationId, eventType, severity, 'RATE_LIMIT_EVENT', severityRank(severity) >= severityRank('HIGH'), createdAt, {
        provider: record.provider,
        quotaPressureLevel: record.quotaPressureLevel,
    });
}

function eventFromProcess(record: RuntimeProcessRecord, createdAt: string): RuntimeEventRecord[] {
    if (record.riskLevel === 'INFO') return [];
    return [buildEvent(record.source, record.correlationId, 'PROCESS_ATTENTION', record.riskLevel, 'PROCESS_EVENT', severityRank(record.riskLevel) >= severityRank('HIGH'), createdAt, {
        pid: record.pid,
        status: record.status,
    })];
}

function eventFromPort(record: RuntimePortRecord, createdAt: string): RuntimeEventRecord[] {
    if (record.riskLevel === 'INFO') return [];
    return [buildEvent(record.source, record.correlationId, 'PORT_ATTENTION', record.riskLevel, 'PORT_EVENT', severityRank(record.riskLevel) >= severityRank('WARNING'), createdAt, {
        port: record.port,
        orphanStatus: record.orphanStatus,
    })];
}

function alertFromEvent(event: RuntimeEventRecord): RuntimeAlertRecord {
    return {
        alertId: stableId('obs-alert', event.eventId),
        eventType: event.eventType,
        severity: event.severity,
        message: alertMessage(event),
        recommendedAction: event.policyRequired
            ? 'Request governed review before taking action.'
            : 'Review the source before deciding next steps.',
        policyRequired: event.policyRequired,
        createdAt: event.createdAt,
        source: event.source,
        correlationId: event.correlationId,
        observedAt: event.observedAt,
        receiptId: severityRank(event.severity) >= severityRank('HIGH') ? stableId('obs-receipt', event.eventId) : event.receiptId,
    };
}

function buildEvent(
    source: string,
    correlationId: string,
    eventType: string,
    severity: RuntimeSeverity,
    category: string,
    policyRequired: boolean,
    createdAt: string,
    payload: Record<string, string | number | boolean | null>,
): RuntimeEventRecord {
    const eventId = stableId('obs-event', source, correlationId, eventType, severity);
    return {
        eventId,
        eventType,
        severity,
        category,
        policyRequired,
        payload,
        createdAt,
        source,
        correlationId,
        observedAt: createdAt,
        receiptId: severityRank(severity) >= severityRank('HIGH') ? stableId('obs-receipt', eventId) : undefined,
    };
}

function jobStatusToSessionStatus(status: string): string {
    if (status === 'running' || status === 'queued') return 'ACTIVE';
    if (status === 'blocked_by_policy') return 'BLOCKED';
    if (status === 'failed' || status === 'timed_out' || status === 'orphaned') return 'ERROR';
    if (status === 'succeeded') return 'ENDED';
    return 'UNKNOWN';
}

function jobStatusToSeverity(status: string): RuntimeSeverity {
    if (status === 'failed' || status === 'timed_out' || status === 'orphaned') return 'HIGH';
    if (status === 'blocked_by_policy') return 'WARNING';
    if (status === 'running' || status === 'queued') return 'NOTICE';
    return 'INFO';
}

function quotaPressure(usage: number, limit: number): RuntimeRateLimitRecord['quotaPressureLevel'] {
    if (limit <= 0) return 'UNKNOWN';
    const ratio = usage / limit;
    if (ratio >= 1) return 'CRITICAL';
    if (ratio >= 0.9) return 'HIGH';
    if (ratio >= 0.75) return 'WARNING';
    if (ratio >= 0.6) return 'NOTICE';
    return 'NORMAL';
}

function severityFromPressure(pressure: RuntimeRateLimitRecord['quotaPressureLevel']): RuntimeSeverity {
    if (pressure === 'CRITICAL') return 'CRITICAL';
    if (pressure === 'HIGH') return 'HIGH';
    if (pressure === 'WARNING') return 'WARNING';
    if (pressure === 'NOTICE' || pressure === 'UNKNOWN') return 'NOTICE';
    return 'INFO';
}

function alertMessage(event: RuntimeEventRecord): string {
    if (event.eventType === 'CONTEXT_USAGE_UNAVAILABLE') {
        return 'Token and context usage are not verified for this view yet.';
    }
    if (event.eventType.startsWith('RATE_LIMIT')) {
        return 'Provider quota or rate-limit pressure may affect the next run.';
    }
    if (event.eventType.startsWith('SESSION')) {
        return 'Runtime session state changed.';
    }
    return 'Runtime signal recorded.';
}

function severityRank(severity: RuntimeSeverity): number {
    return { INFO: 0, NOTICE: 1, WARNING: 2, HIGH: 3, CRITICAL: 4 }[severity];
}

function stableId(prefix: string, ...parts: string[]): string {
    return `${prefix}-${parts.join('-').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase()}`;
}

export function runtimeObservabilityFilePresence(repoRoot: string): boolean {
    return existsSync(resolve(repoRoot, 'EXTENSIONS', 'CVF_v1.8.1_ADAPTIVE_OBSERVABILITY_RUNTIME', 'observability', 'runtime.dashboard.snapshot.ts'));
}
