/**
 * CVF v1.6.1 Governance Engine — HTTP Client
 *
 * Wraps calls to the v1.6.1 FastAPI server with timeout, retry, and
 * graceful fallback when the server is unreachable.
 *
 * All functions return `null` on network/timeout errors so callers can
 * fall back to client-side governance logic.
 *
 * @module lib/governance-engine
 */

import type {
    CVFApiResponse,
    GovernanceHealthStatus,
    GovernanceEvaluateRequest,
    GovernanceEvaluateResult,
    GovernanceApproveRequest,
    GovernanceApproveResult,
    GovernanceLedgerResult,
    GovernanceRiskConvertRequest,
    GovernanceRiskConvertResult,
} from '@/types/governance-engine';

// ─── Config ──────────────────────────────────────────────────────────

function getConfig() {
    return {
        url: process.env.GOVERNANCE_ENGINE_URL || 'http://localhost:8000',
        enabled: process.env.GOVERNANCE_ENGINE_ENABLED !== 'false',
        timeout: Number(process.env.GOVERNANCE_ENGINE_TIMEOUT) || 5000,
    };
}

export function isGovernanceEngineEnabled(): boolean {
    return getConfig().enabled;
}

// ─── Fetch helper ────────────────────────────────────────────────────

interface FetchOptions {
    method?: 'GET' | 'POST';
    body?: unknown;
    timeout?: number;
}

async function governanceFetch<T>(
    path: string,
    options: FetchOptions = {},
): Promise<CVFApiResponse<T> | null> {
    const cfg = getConfig();
    if (!cfg.enabled) return null;

    const { method = 'GET', body, timeout = cfg.timeout } = options;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    try {
        const res = await fetch(`${cfg.url}${path}`, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: body ? JSON.stringify(body) : undefined,
            signal: controller.signal,
        });

        clearTimeout(timer);

        if (!res.ok) {
            const errorBody = await res.text().catch(() => '');
            console.error(
                `[GovernanceEngine] ${method} ${path} → ${res.status}: ${errorBody}`,
            );
            return null;
        }

        return (await res.json()) as CVFApiResponse<T>;
    } catch (err) {
        clearTimeout(timer);
        if ((err as Error).name === 'AbortError') {
            console.warn(`[GovernanceEngine] ${method} ${path} timed out (${timeout}ms)`);
        } else {
            console.warn(`[GovernanceEngine] ${method} ${path} failed:`, (err as Error).message);
        }
        return null;
    }
}

/**
 * Direct fetch helper for API routes that need raw JSON response.
 * Returns parsed JSON or null on failure.
 */
export async function governanceFetchDirect(path: string): Promise<Record<string, unknown> | null> {
    const cfg = getConfig();
    if (!cfg.enabled) return null;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), cfg.timeout);

    try {
        const res = await fetch(`${cfg.url}${path}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            signal: controller.signal,
        });
        clearTimeout(timer);
        if (!res.ok) return null;
        return await res.json();
    } catch {
        clearTimeout(timer);
        return null;
    }
}

// ─── Public API ──────────────────────────────────────────────────────

/**
 * GET /api/v1/health
 * Returns server status or `null` if unreachable.
 */
export async function governanceHealth(): Promise<GovernanceHealthStatus | null> {
    const res = await governanceFetch<GovernanceHealthStatus>('/api/v1/health');
    if (!res) return null;
    // Health endpoint returns the object directly (not wrapped in data)
    if ('service' in res) return res as unknown as GovernanceHealthStatus;
    return res.data ?? (res as unknown as GovernanceHealthStatus);
}

/**
 * POST /api/v1/evaluate
 * Run the full governance pipeline on specified payload.
 */
export async function governanceEvaluate(
    payload: GovernanceEvaluateRequest,
): Promise<GovernanceEvaluateResult | null> {
    const res = await governanceFetch<GovernanceEvaluateResult>(
        '/api/v1/evaluate',
        { method: 'POST', body: payload },
    );
    return res?.data ?? null;
}

/**
 * POST /api/v1/approve
 * Submit an approval/rejection decision.
 */
export async function governanceApprove(
    payload: GovernanceApproveRequest,
): Promise<GovernanceApproveResult | null> {
    const res = await governanceFetch<GovernanceApproveResult>(
        '/api/v1/approve',
        { method: 'POST', body: payload },
    );
    return res?.data ?? null;
}

/**
 * GET /api/v1/ledger?limit=N
 * Query the most recent ledger entries.
 */
export async function governanceLedger(
    limit = 50,
): Promise<GovernanceLedgerResult | null> {
    const res = await governanceFetch<GovernanceLedgerResult>(
        `/api/v1/ledger?limit=${limit}`,
    );
    return res?.data ?? null;
}

/**
 * POST /api/v1/risk-convert
 * Convert between CVF risk levels and internal levels.
 */
export async function governanceRiskConvert(
    value: string,
    direction: 'to_cvf' | 'from_cvf' = 'to_cvf',
): Promise<GovernanceRiskConvertResult | null> {
    const body: GovernanceRiskConvertRequest = { value, direction };
    const res = await governanceFetch<GovernanceRiskConvertResult>(
        '/api/v1/risk-convert',
        { method: 'POST', body },
    );
    return res?.data ?? null;
}
