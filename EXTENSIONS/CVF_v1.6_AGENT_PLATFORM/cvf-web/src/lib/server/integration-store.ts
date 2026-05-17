import type { IntegrationsConfig } from '@/lib/integrations-config';
import type { GovernanceJobEvent, GovernanceJobEventType, GovernanceJobStatus } from './web-governance-jobs';

export interface RuntimeStoreRecord {
    job_id: string;
    event_type: string;
    status: string;
    provider_lane: string | null;
    cwd_label: string;
    correlation_id: string;
    evidence_refs: string[];
    cost_quota: Record<string, unknown> | null;
    requested_at: string;
    recorded_at: string;
}

export interface IntegrationStoreAdapter {
    isAvailable(): boolean;
    fetchLatestJobs(limit: number): Promise<RuntimeStoreRecord[]>;
}

export class NullAdapter implements IntegrationStoreAdapter {
    isAvailable(): boolean {
        return false;
    }

    async fetchLatestJobs(limit: number): Promise<RuntimeStoreRecord[]> {
        void limit;
        return [];
    }
}

export class SupabaseAdapter implements IntegrationStoreAdapter {
    constructor(
        private readonly url: string,
        private readonly anonKey: string,
    ) { }

    isAvailable(): boolean {
        return Boolean(this.url.trim() && this.anonKey);
    }

    async fetchLatestJobs(limit: number): Promise<RuntimeStoreRecord[]> {
        if (!this.isAvailable()) {
            return [];
        }
        try {
            const origin = new URL(this.url).origin;
            const response = await fetch(
                `${origin}/rest/v1/runtime_events?order=recorded_at.desc&limit=${limit}&select=*`,
                {
                    method: 'GET',
                    headers: {
                        apikey: this.anonKey,
                        Authorization: `Bearer ${this.anonKey}`,
                        Accept: 'application/json',
                    },
                    signal: AbortSignal.timeout(8000),
                },
            );
            if (!response.ok) {
                return [];
            }
            const records = await response.json() as unknown;
            return Array.isArray(records) ? records.map(normalizeRecord).filter(isRuntimeStoreRecord) : [];
        } catch {
            return [];
        }
    }
}

export class HttpAdapter implements IntegrationStoreAdapter {
    constructor(
        private readonly endpoint: string,
        private readonly bearerToken: string,
    ) { }

    isAvailable(): boolean {
        return Boolean(this.endpoint.trim());
    }

    async fetchLatestJobs(limit: number): Promise<RuntimeStoreRecord[]> {
        if (!this.isAvailable()) {
            return [];
        }
        try {
            const response = await fetch(endpointWithLimit(this.endpoint, limit), {
                method: 'GET',
                headers: this.bearerToken
                    ? { Accept: 'application/json', Authorization: `Bearer ${this.bearerToken}` }
                    : { Accept: 'application/json' },
                signal: AbortSignal.timeout(8000),
            });
            if (!response.ok) {
                return [];
            }
            const records = await response.json() as unknown;
            return Array.isArray(records) ? records.map(normalizeRecord).filter(isRuntimeStoreRecord) : [];
        } catch {
            return [];
        }
    }
}

export function buildIntegrationAdapter(clientConfig: IntegrationsConfig | null): IntegrationStoreAdapter {
    const envUrl = process.env.SUPABASE_URL ?? '';
    const envAnonKey = process.env.SUPABASE_ANON_KEY ?? '';
    if (envUrl && envAnonKey) {
        return new SupabaseAdapter(envUrl, envAnonKey);
    }
    if (clientConfig?.runtimeStore.provider === 'supabase') {
        return new SupabaseAdapter(
            clientConfig.runtimeStore.supabase.url,
            clientConfig.runtimeStore.supabase.anonKey,
        );
    }
    if (clientConfig?.runtimeStore.provider === 'http') {
        return new HttpAdapter(
            clientConfig.runtimeStore.http.endpoint,
            clientConfig.runtimeStore.http.bearerToken,
        );
    }
    return new NullAdapter();
}

export function storeRecordToJobEvent(record: RuntimeStoreRecord): GovernanceJobEvent {
    return {
        eventId: `store-${record.job_id}-${record.recorded_at}`,
        jobId: record.job_id,
        eventType: normalizeEventType(record.event_type, record.status),
        jobType: 'provider_check',
        requestedBy: 'external-store',
        role: 'operator',
        authMode: 'service_token',
        localMode: false,
        requestIpClass: 'not_recorded',
        requestedAt: record.requested_at,
        recordedAt: record.recorded_at,
        decision: 'allowed',
        decisionReason: 'integration_store_record',
        status: normalizeStatus(record.status),
        cwdLabel: record.cwd_label,
        handlerId: 'integration-store',
        fixedArgv: [],
        providerLane: record.provider_lane,
        redactionApplied: true,
        stdoutSummary: '',
        stderrSummary: '',
        exitCode: null,
        timeoutMs: 0,
        timedOut: false,
        errorClass: null,
        evidenceRefs: record.evidence_refs,
        uiRequestId: record.correlation_id,
        correlationId: record.correlation_id,
        costQuota: null,
    };
}

function endpointWithLimit(endpoint: string, limit: number): string {
    const url = new URL(endpoint);
    url.searchParams.set('limit', String(limit));
    return url.toString();
}

function normalizeRecord(record: unknown): Partial<RuntimeStoreRecord> {
    const candidate = record as Partial<RuntimeStoreRecord>;
    return {
        job_id: stringValue(candidate.job_id),
        event_type: stringValue(candidate.event_type),
        status: stringValue(candidate.status),
        provider_lane: candidate.provider_lane === null ? null : stringValue(candidate.provider_lane),
        cwd_label: stringValue(candidate.cwd_label),
        correlation_id: stringValue(candidate.correlation_id),
        evidence_refs: Array.isArray(candidate.evidence_refs)
            ? candidate.evidence_refs.filter((item): item is string => typeof item === 'string')
            : [],
        cost_quota: candidate.cost_quota ?? null,
        requested_at: stringValue(candidate.requested_at),
        recorded_at: stringValue(candidate.recorded_at),
    };
}

function isRuntimeStoreRecord(record: Partial<RuntimeStoreRecord>): record is RuntimeStoreRecord {
    return Boolean(record.job_id && record.event_type && record.status && record.requested_at && record.recorded_at);
}

function normalizeEventType(eventType: string, status: string): GovernanceJobEventType {
    if (eventType === 'requested') {
        return 'requested';
    }
    return normalizeStatus(status);
}

function normalizeStatus(status: string): GovernanceJobStatus {
    if (
        status === 'queued' ||
        status === 'running' ||
        status === 'succeeded' ||
        status === 'failed' ||
        status === 'timed_out' ||
        status === 'blocked_by_policy' ||
        status === 'orphaned'
    ) {
        return status;
    }
    return 'running';
}

function stringValue(value: unknown): string {
    return typeof value === 'string' ? value : '';
}
