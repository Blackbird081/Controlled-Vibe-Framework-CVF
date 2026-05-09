import { appendFileSync, existsSync, mkdirSync, readFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { randomUUID } from 'crypto';

export type CostQuotaWindowMode = 'rolling_24h' | 'utc_calendar_day';
export type CostQuotaProviderLane = 'alibaba' | 'deepseek' | 'mixed' | 'none';
export type CostQuotaEstimateConfidence = 'high' | 'low';
export type CostQuotaDecision = 'allowed' | 'blocked_by_policy';
export type CostQuotaEventType =
    | 'estimate_requested'
    | 'estimate_allowed'
    | 'estimate_blocked'
    | 'usage_incremented'
    | 'cooldown_blocked'
    | 'override_used'
    | 'override_denied'
    | 'policy_validation_failed';

export interface CostQuotaPolicy {
    version: 1;
    windowMode: CostQuotaWindowMode;
    globalDailyLiveCallLimit: number;
    providerLanes: Record<string, {
        dailyLiveCallLimit: number;
        perJobLiveCallLimit: Record<string, number>;
    }>;
    cooldownSeconds: Record<string, number>;
    requireOwnerOverrideAboveLimit: boolean;
    overrideMode?: 'disabled' | 'owner_only' | 'owner_or_admin';
    auditMode: 'append_only_jsonl';
}

export interface LiveCallEstimate {
    jobType: string;
    providerLane: CostQuotaProviderLane;
    expectedLiveCallCount: number;
    estimateConfidence: CostQuotaEstimateConfidence;
    estimateBasis: string;
    policyWindowMode: CostQuotaWindowMode;
}

export interface CostQuotaOverrideRequest {
    requested?: boolean;
    reason?: string;
}

export interface CostQuotaPreflightInput {
    repoRoot: string;
    jobId: string;
    jobType: string;
    providerLane: string | null;
    role: string;
    requestedBy: string;
    override?: CostQuotaOverrideRequest;
    policyPath?: string;
    auditPath?: string;
    now?: () => string;
    idFactory?: () => string;
}

export interface CostQuotaPreflightResult {
    decision: CostQuotaDecision;
    decisionReason: string;
    estimate: LiveCallEstimate;
    policy: CostQuotaPolicy;
    policyPath: string;
    auditPath: string;
    windowStart: string;
    windowEnd: string;
    globalUsage: number;
    providerUsage: number;
    providerLimit: number;
    globalLimit: number;
    perJobLimit: number | null;
    cooldownSeconds: number;
    overrideUsed: boolean;
}

export interface CostQuotaEvent {
    eventId: string;
    eventType: CostQuotaEventType;
    jobId: string;
    jobType: string;
    providerLane: CostQuotaProviderLane;
    expectedLiveCallCount: number;
    requestedBy: string;
    role: string;
    recordedAt: string;
    decision: CostQuotaDecision;
    decisionReason: string;
    policyWindowMode: CostQuotaWindowMode;
    windowStart: string;
    windowEnd: string;
    globalUsageBefore: number;
    providerUsageBefore: number;
    globalLimit: number;
    providerLimit: number;
    perJobLimit: number | null;
    cooldownSeconds: number;
    overrideRequested: boolean;
    overrideUsed: boolean;
    overrideReason: string | null;
}

export interface CostQuotaSummary {
    policyPath: string;
    auditPath: string;
    policy: CostQuotaPolicy;
    windowStart: string;
    windowEnd: string;
    globalUsage: number;
    providerUsage: Record<string, number>;
    estimates: Record<string, LiveCallEstimate>;
}

const DEFAULT_POLICY: CostQuotaPolicy = {
    version: 1,
    windowMode: 'rolling_24h',
    globalDailyLiveCallLimit: 120,
    providerLanes: {
        alibaba: {
            dailyLiveCallLimit: 100,
            perJobLiveCallLimit: {
                full_live_release_gate: 20,
                provider_check: 2,
            },
        },
        deepseek: {
            dailyLiveCallLimit: 30,
            perJobLiveCallLimit: {
                provider_check: 2,
                deepseek_post_rc2_smoke: 8,
                deepseek_post_rc2_confirmation: 14,
            },
        },
    },
    cooldownSeconds: {
        full_live_release_gate: 300,
    },
    requireOwnerOverrideAboveLimit: true,
    overrideMode: 'owner_or_admin',
    auditMode: 'append_only_jsonl',
};

function defaultPolicyPath(repoRoot: string): string {
    return resolve(repoRoot, '.cvf', 'config', 'cost-quota-policy.json');
}

function defaultAuditPath(repoRoot: string): string {
    return resolve(repoRoot, '.cvf', 'runtime', 'web-governance-cost-quota.jsonl');
}

function eventId(input: CostQuotaPreflightInput): string {
    return input.idFactory?.() ?? randomUUID();
}

function now(input: Pick<CostQuotaPreflightInput, 'now'>): string {
    return input.now?.() ?? new Date().toISOString();
}

function containsSecretLikeValue(value: string): boolean {
    if (/\b(?:DASHSCOPE_API_KEY|ALIBABA_API_KEY|CVF_ALIBABA_API_KEY|CVF_BENCHMARK_ALIBABA_KEY|DEEPSEEK_API_KEY|API_KEY|TOKEN|SECRET)\s*[:=]\s*["']?[^"'\s]{8,}/i.test(value)) {
        return true;
    }
    if (/\b(sk|ak|rk|dashscope|deepseek|alibaba)[-_][A-Za-z0-9_\-.]{20,}\b/i.test(value)) {
        return true;
    }
    return /\b[A-Za-z0-9_\-]{64,}\b/.test(value);
}

function normalizeNumber(value: unknown, fallback: number): number {
    return typeof value === 'number' && Number.isFinite(value) && value >= 0
        ? Math.floor(value)
        : fallback;
}

function normalizePolicy(candidate: Partial<CostQuotaPolicy>): CostQuotaPolicy {
    const alibaba = candidate.providerLanes?.alibaba ?? DEFAULT_POLICY.providerLanes.alibaba;
    const deepseek = candidate.providerLanes?.deepseek ?? DEFAULT_POLICY.providerLanes.deepseek;
    return {
        version: 1,
        windowMode: candidate.windowMode === 'utc_calendar_day' ? 'utc_calendar_day' : 'rolling_24h',
        globalDailyLiveCallLimit: normalizeNumber(candidate.globalDailyLiveCallLimit, DEFAULT_POLICY.globalDailyLiveCallLimit),
        providerLanes: {
            alibaba: {
                dailyLiveCallLimit: normalizeNumber(alibaba.dailyLiveCallLimit, DEFAULT_POLICY.providerLanes.alibaba.dailyLiveCallLimit),
                perJobLiveCallLimit: {
                    ...DEFAULT_POLICY.providerLanes.alibaba.perJobLiveCallLimit,
                    ...(alibaba.perJobLiveCallLimit ?? {}),
                },
            },
            deepseek: {
                dailyLiveCallLimit: normalizeNumber(deepseek.dailyLiveCallLimit, DEFAULT_POLICY.providerLanes.deepseek.dailyLiveCallLimit),
                perJobLiveCallLimit: {
                    ...DEFAULT_POLICY.providerLanes.deepseek.perJobLiveCallLimit,
                    ...(deepseek.perJobLiveCallLimit ?? {}),
                },
            },
        },
        cooldownSeconds: {
            ...DEFAULT_POLICY.cooldownSeconds,
            ...(candidate.cooldownSeconds ?? {}),
        },
        requireOwnerOverrideAboveLimit: candidate.requireOwnerOverrideAboveLimit ?? DEFAULT_POLICY.requireOwnerOverrideAboveLimit,
        overrideMode: candidate.overrideMode ?? DEFAULT_POLICY.overrideMode,
        auditMode: 'append_only_jsonl',
    };
}

export function readCostQuotaPolicy(repoRoot: string, policyPath = defaultPolicyPath(repoRoot)): { policy: CostQuotaPolicy; policyPath: string; validationError: string | null } {
    if (!existsSync(policyPath)) {
        return { policy: DEFAULT_POLICY, policyPath, validationError: null };
    }
    const raw = readFileSync(policyPath, 'utf8');
    if (containsSecretLikeValue(raw)) {
        return { policy: DEFAULT_POLICY, policyPath, validationError: 'policy_file_contains_secret_like_value' };
    }
    try {
        const parsed = JSON.parse(raw) as Partial<CostQuotaPolicy>;
        return { policy: normalizePolicy(parsed), policyPath, validationError: null };
    } catch {
        return { policy: DEFAULT_POLICY, policyPath, validationError: 'policy_file_invalid_json' };
    }
}

function providerLaneFor(jobType: string, providerLane: string | null): CostQuotaProviderLane {
    if (providerLane === 'deepseek') return 'deepseek';
    if (providerLane === 'alibaba') return 'alibaba';
    if (jobType === 'full_live_release_gate') return 'alibaba';
    if (jobType === 'provider_check') return 'alibaba';
    return 'none';
}

export function estimateLiveCalls(jobType: string, providerLane: string | null, policyWindowMode: CostQuotaWindowMode): LiveCallEstimate {
    const lane = providerLaneFor(jobType, providerLane);
    if (jobType === 'full_live_release_gate') {
        return {
            jobType,
            providerLane: 'alibaba',
            expectedLiveCallCount: 7,
            estimateConfidence: 'high',
            estimateBasis: 'full release gate bundle with live provider readiness and live governance E2E checks',
            policyWindowMode,
        };
    }
    if (jobType === 'provider_check') {
        return {
            jobType,
            providerLane: lane === 'deepseek' ? 'deepseek' : 'alibaba',
            expectedLiveCallCount: 1,
            estimateConfidence: 'high',
            estimateBasis: 'single live provider readiness call',
            policyWindowMode,
        };
    }
    if (jobType === 'deepseek_post_rc2_smoke') {
        return {
            jobType,
            providerLane: 'deepseek',
            expectedLiveCallCount: 8,
            estimateConfidence: 'high',
            estimateBasis: 'authorized DS smoke/sanity minimum N>=8',
            policyWindowMode,
        };
    }
    if (jobType === 'deepseek_post_rc2_confirmation') {
        return {
            jobType,
            providerLane: 'deepseek',
            expectedLiveCallCount: 14,
            estimateConfidence: 'high',
            estimateBasis: 'confirmation tier minimum N>=14',
            policyWindowMode,
        };
    }
    return {
        jobType,
        providerLane: 'none',
        expectedLiveCallCount: 0,
        estimateConfidence: 'high',
        estimateBasis: 'no live provider call expected',
        policyWindowMode,
    };
}

function windowStart(reference: string, mode: CostQuotaWindowMode): string {
    const date = new Date(reference);
    if (mode === 'utc_calendar_day') {
        return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())).toISOString();
    }
    return new Date(date.getTime() - 24 * 60 * 60 * 1000).toISOString();
}

function readCostQuotaEvents(auditPath: string): CostQuotaEvent[] {
    if (!existsSync(auditPath)) return [];
    return readFileSync(auditPath, 'utf8')
        .split(/\r?\n/)
        .filter(Boolean)
        .map((line) => JSON.parse(line) as CostQuotaEvent);
}

function appendCostQuotaEvent(auditPath: string, event: CostQuotaEvent): void {
    mkdirSync(dirname(auditPath), { recursive: true });
    appendFileSync(auditPath, `${JSON.stringify(event)}\n`, 'utf8');
}

function usageInWindow(events: CostQuotaEvent[], start: string, end: string, providerLane?: string): number {
    return events
        .filter((event) => event.eventType === 'usage_incremented')
        .filter((event) => event.recordedAt >= start && event.recordedAt <= end)
        .filter((event) => !providerLane || event.providerLane === providerLane)
        .reduce((sum, event) => sum + event.expectedLiveCallCount, 0);
}

function latestUsageIncrement(events: CostQuotaEvent[], jobType: string, providerLane: string): CostQuotaEvent | null {
    return events
        .filter((event) => event.eventType === 'usage_incremented' && event.jobType === jobType && event.providerLane === providerLane)
        .sort((a, b) => b.recordedAt.localeCompare(a.recordedAt))[0] ?? null;
}

function canOverride(role: string, policy: CostQuotaPolicy): boolean {
    if (policy.overrideMode === 'disabled') return false;
    if (policy.overrideMode === 'owner_only') return role === 'owner';
    return role === 'owner' || role === 'admin';
}

function makeEvent(input: CostQuotaPreflightInput, result: CostQuotaPreflightResult, eventType: CostQuotaEventType, recordedAt: string): CostQuotaEvent {
    return {
        eventId: eventId(input),
        eventType,
        jobId: input.jobId,
        jobType: input.jobType,
        providerLane: result.estimate.providerLane,
        expectedLiveCallCount: result.estimate.expectedLiveCallCount,
        requestedBy: input.requestedBy,
        role: input.role,
        recordedAt,
        decision: result.decision,
        decisionReason: result.decisionReason,
        policyWindowMode: result.policy.windowMode,
        windowStart: result.windowStart,
        windowEnd: result.windowEnd,
        globalUsageBefore: result.globalUsage,
        providerUsageBefore: result.providerUsage,
        globalLimit: result.globalLimit,
        providerLimit: result.providerLimit,
        perJobLimit: result.perJobLimit,
        cooldownSeconds: result.cooldownSeconds,
        overrideRequested: Boolean(input.override?.requested),
        overrideUsed: result.overrideUsed,
        overrideReason: input.override?.reason?.slice(0, 240) || null,
    };
}

export function evaluateCostQuotaPreflight(input: CostQuotaPreflightInput): CostQuotaPreflightResult {
    const policyLoad = readCostQuotaPolicy(input.repoRoot, input.policyPath);
    const auditPath = input.auditPath ?? defaultAuditPath(input.repoRoot);
    const recordedAt = now(input);
    const start = windowStart(recordedAt, policyLoad.policy.windowMode);
    const estimate = estimateLiveCalls(input.jobType, input.providerLane, policyLoad.policy.windowMode);
    const events = readCostQuotaEvents(auditPath);
    const globalUsage = usageInWindow(events, start, recordedAt);
    const providerUsage = estimate.providerLane === 'none'
        ? 0
        : usageInWindow(events, start, recordedAt, estimate.providerLane);
    const lanePolicy = estimate.providerLane === 'none'
        ? null
        : policyLoad.policy.providerLanes[estimate.providerLane];
    const providerLimit = lanePolicy?.dailyLiveCallLimit ?? Number.MAX_SAFE_INTEGER;
    const perJobLimit = lanePolicy?.perJobLiveCallLimit[input.jobType] ?? null;
    const cooldownSeconds = policyLoad.policy.cooldownSeconds[input.jobType] ?? 0;
    let decision: CostQuotaDecision = 'allowed';
    let reason = 'cost_quota_allowed';
    let overrideUsed = false;

    if (policyLoad.validationError) {
        decision = 'blocked_by_policy';
        reason = policyLoad.validationError;
    } else if (estimate.expectedLiveCallCount > 0) {
        const latest = estimate.providerLane === 'none' ? null : latestUsageIncrement(events, input.jobType, estimate.providerLane);
        const cooldownActive = latest
            ? (new Date(recordedAt).getTime() - new Date(latest.recordedAt).getTime()) < cooldownSeconds * 1000
            : false;
        if (cooldownActive) {
            decision = 'blocked_by_policy';
            reason = 'cost_quota_cooldown_active';
        } else if (perJobLimit !== null && estimate.expectedLiveCallCount > perJobLimit) {
            decision = 'blocked_by_policy';
            reason = 'cost_quota_per_job_limit_exceeded';
        } else if (globalUsage + estimate.expectedLiveCallCount > policyLoad.policy.globalDailyLiveCallLimit) {
            decision = 'blocked_by_policy';
            reason = 'cost_quota_global_limit_exceeded';
        } else if (providerUsage + estimate.expectedLiveCallCount > providerLimit) {
            decision = 'blocked_by_policy';
            reason = 'cost_quota_provider_limit_exceeded';
        }

        if (decision === 'blocked_by_policy' && input.override?.requested) {
            if (canOverride(input.role, policyLoad.policy)) {
                decision = 'allowed';
                reason = 'cost_quota_override_used';
                overrideUsed = true;
            } else {
                reason = 'cost_quota_override_denied';
            }
        }
    }

    const result: CostQuotaPreflightResult = {
        decision,
        decisionReason: reason,
        estimate,
        policy: policyLoad.policy,
        policyPath: policyLoad.policyPath,
        auditPath,
        windowStart: start,
        windowEnd: recordedAt,
        globalUsage,
        providerUsage,
        providerLimit,
        globalLimit: policyLoad.policy.globalDailyLiveCallLimit,
        perJobLimit,
        cooldownSeconds,
        overrideUsed,
    };

    appendCostQuotaEvent(auditPath, makeEvent(input, result, 'estimate_requested', recordedAt));
    if (policyLoad.validationError) {
        appendCostQuotaEvent(auditPath, makeEvent(input, result, 'policy_validation_failed', recordedAt));
    } else if (decision === 'allowed') {
        appendCostQuotaEvent(auditPath, makeEvent(input, result, overrideUsed ? 'override_used' : 'estimate_allowed', recordedAt));
        if (estimate.expectedLiveCallCount > 0) {
            appendCostQuotaEvent(auditPath, makeEvent(input, result, 'usage_incremented', recordedAt));
        }
    } else {
        const eventType: CostQuotaEventType = reason === 'cost_quota_cooldown_active'
            ? 'cooldown_blocked'
            : reason === 'cost_quota_override_denied'
                ? 'override_denied'
                : 'estimate_blocked';
        appendCostQuotaEvent(auditPath, makeEvent(input, result, eventType, recordedAt));
    }

    return result;
}

export function summarizeCostQuota(repoRoot: string, referenceTime = new Date().toISOString()): CostQuotaSummary {
    const policyLoad = readCostQuotaPolicy(repoRoot);
    const auditPath = defaultAuditPath(repoRoot);
    const start = windowStart(referenceTime, policyLoad.policy.windowMode);
    const events = readCostQuotaEvents(auditPath);
    return {
        policyPath: policyLoad.policyPath,
        auditPath,
        policy: policyLoad.policy,
        windowStart: start,
        windowEnd: referenceTime,
        globalUsage: usageInWindow(events, start, referenceTime),
        providerUsage: {
            alibaba: usageInWindow(events, start, referenceTime, 'alibaba'),
            deepseek: usageInWindow(events, start, referenceTime, 'deepseek'),
        },
        estimates: {
            cvf_doctor: estimateLiveCalls('cvf_doctor', null, policyLoad.policy.windowMode),
            provider_check_alibaba: estimateLiveCalls('provider_check', 'alibaba', policyLoad.policy.windowMode),
            provider_check_deepseek: estimateLiveCalls('provider_check', 'deepseek', policyLoad.policy.windowMode),
            docs_governance_check: estimateLiveCalls('docs_governance_check', null, policyLoad.policy.windowMode),
            release_gate_dry_readiness: estimateLiveCalls('release_gate_dry_readiness', null, policyLoad.policy.windowMode),
            full_live_release_gate: estimateLiveCalls('full_live_release_gate', 'alibaba', policyLoad.policy.windowMode),
        },
    };
}
