import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
    governanceApprove,
    governanceEvaluate,
    governanceFetchDirect,
    governanceHealth,
    governanceLedger,
    governanceRiskConvert,
    isGovernanceEngineEnabled,
} from './governance-engine';

function asResponse(input: {
    ok: boolean;
    status?: number;
    json?: unknown;
    text?: string;
}): Response {
    return {
        ok: input.ok,
        status: input.status ?? 200,
        json: vi.fn().mockResolvedValue(input.json ?? {}),
        text: vi.fn().mockResolvedValue(input.text ?? ''),
    } as unknown as Response;
}

const ENV_SNAPSHOT = { ...process.env };

describe('governance-engine', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.unstubAllGlobals();
        process.env = { ...ENV_SNAPSHOT };
        delete process.env.GOVERNANCE_ENGINE_ENABLED;
        delete process.env.GOVERNANCE_ENGINE_URL;
        delete process.env.GOVERNANCE_ENGINE_TIMEOUT;
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        process.env = { ...ENV_SNAPSHOT };
    });

    it('respects GOVERNANCE_ENGINE_ENABLED flag', () => {
        expect(isGovernanceEngineEnabled()).toBe(true);
        process.env.GOVERNANCE_ENGINE_ENABLED = 'false';
        expect(isGovernanceEngineEnabled()).toBe(false);
    });

    it('returns null and does not call fetch when engine is disabled', async () => {
        process.env.GOVERNANCE_ENGINE_ENABLED = 'false';
        const fetchMock = vi.fn();
        vi.stubGlobal('fetch', fetchMock);

        await expect(governanceHealth()).resolves.toBeNull();
        await expect(governanceEvaluate({ request_id: 'r1', artifact_id: 'a1', payload: {} })).resolves.toBeNull();
        await expect(governanceApprove({ request_id: 'r1', approver_id: 'u1', decision: 'APPROVED' })).resolves.toBeNull();
        await expect(governanceLedger()).resolves.toBeNull();
        await expect(governanceRiskConvert('R2')).resolves.toBeNull();
        await expect(governanceFetchDirect('/api/v1/health')).resolves.toBeNull();
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it('handles health endpoint direct object response', async () => {
        const health = {
            status: 'healthy',
            service: 'CVF Governance Engine',
            version: '1.6.1',
            timestamp: '2026-02-22T00:00:00Z',
        };
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(asResponse({ ok: true, json: health })));

        await expect(governanceHealth()).resolves.toEqual(health);
    });

    it('handles health endpoint wrapped data response', async () => {
        const wrapped = {
            status: 'ok',
            timestamp: '2026-02-22T00:00:00Z',
            data: {
                status: 'healthy',
                service: 'CVF Governance Engine',
                version: '1.6.1',
                timestamp: '2026-02-22T00:00:00Z',
            },
        };
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(asResponse({ ok: true, json: wrapped })));

        const result = await governanceHealth();
        expect(result?.service).toBe('CVF Governance Engine');
        expect(result?.status).toBe('healthy');
    });

    it('returns null and logs on non-ok response', async () => {
        const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(asResponse({ ok: false, status: 500, text: 'boom' })));

        await expect(governanceHealth()).resolves.toBeNull();
        expect(errorSpy).toHaveBeenCalled();
    });

    it('returns null and logs when response text cannot be read', async () => {
        const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
            ok: false,
            status: 500,
            json: vi.fn(),
            text: vi.fn().mockRejectedValue(new Error('unreadable')),
        } as unknown as Response));

        await expect(governanceHealth()).resolves.toBeNull();
        expect(errorSpy).toHaveBeenCalled();
    });

    it('returns null and logs timeout for abort errors', async () => {
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const abortError = Object.assign(new Error('aborted'), { name: 'AbortError' });
        vi.stubGlobal('fetch', vi.fn().mockRejectedValue(abortError));

        await expect(governanceHealth()).resolves.toBeNull();
        expect(warnSpy).toHaveBeenCalled();
    });

    it('returns null and logs generic fetch failures', async () => {
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
        vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')));

        await expect(governanceHealth()).resolves.toBeNull();
        expect(warnSpy).toHaveBeenCalled();
    });

    it('returns evaluated data for governanceEvaluate', async () => {
        const payload = {
            request_id: 'req-1',
            artifact_id: 'art-1',
            payload: { content: 'hello' },
        };
        const wrapped = {
            status: 'ok',
            timestamp: '2026-02-22T00:00:00Z',
            data: {
                report: { status: 'APPROVED' },
                execution_record: { request_id: 'req-1', artifact_id: 'art-1', risk_score: 0.2, status: 'done', timestamp: '2026-02-22T00:00:00Z' },
            },
        };
        const fetchMock = vi.fn().mockResolvedValue(asResponse({ ok: true, json: wrapped }));
        vi.stubGlobal('fetch', fetchMock);

        const result = await governanceEvaluate(payload);
        expect(result?.report.status).toBe('APPROVED');
        expect(fetchMock).toHaveBeenCalledWith(
            expect.stringContaining('/api/v1/evaluate'),
            expect.objectContaining({
                method: 'POST',
                body: JSON.stringify(payload),
            }),
        );
    });

    it('returns approved data for governanceApprove', async () => {
        const wrapped = {
            status: 'ok',
            timestamp: '2026-02-22T00:00:00Z',
            data: {
                request_id: 'req-1',
                status: 'APPROVED',
                current_step: 1,
                total_decisions: 2,
            },
        };
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(asResponse({ ok: true, json: wrapped })));

        const result = await governanceApprove({
            request_id: 'req-1',
            approver_id: 'user-1',
            decision: 'APPROVED',
        });
        expect(result?.status).toBe('APPROVED');
    });

    it('returns ledger data with custom limit', async () => {
        const wrapped = {
            status: 'ok',
            timestamp: '2026-02-22T00:00:00Z',
            data: {
                total_blocks: 1,
                returned: 1,
                entries: [],
            },
        };
        const fetchMock = vi.fn().mockResolvedValue(asResponse({ ok: true, json: wrapped }));
        vi.stubGlobal('fetch', fetchMock);

        const result = await governanceLedger(25);
        expect(result?.total_blocks).toBe(1);
        expect(fetchMock).toHaveBeenCalledWith(
            expect.stringContaining('/api/v1/ledger?limit=25'),
            expect.any(Object),
        );
    });

    it('sends direction and value for risk convert', async () => {
        const wrapped = {
            status: 'ok',
            timestamp: '2026-02-22T00:00:00Z',
            data: {
                input: 'R2',
                internal_level: 'MEDIUM',
                numeric_score: 0.5,
                direction: 'CVF → internal',
            },
        };
        const fetchMock = vi.fn().mockResolvedValue(asResponse({ ok: true, json: wrapped }));
        vi.stubGlobal('fetch', fetchMock);

        const result = await governanceRiskConvert('R2', 'from_cvf');
        expect(result?.internal_level).toBe('MEDIUM');
        expect(fetchMock).toHaveBeenCalledWith(
            expect.stringContaining('/api/v1/risk-convert'),
            expect.objectContaining({
                method: 'POST',
                body: JSON.stringify({ value: 'R2', direction: 'from_cvf' }),
            }),
        );
    });

    it('returns null when wrapped response has no data', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(asResponse({
            ok: true,
            json: { status: 'ok', timestamp: '2026-02-22T00:00:00Z' },
        })));

        await expect(governanceEvaluate({ request_id: 'r', artifact_id: 'a', payload: {} })).resolves.toBeNull();
        await expect(governanceApprove({ request_id: 'r', approver_id: 'u', decision: 'REJECTED' })).resolves.toBeNull();
        await expect(governanceLedger()).resolves.toBeNull();
        await expect(governanceRiskConvert('R1')).resolves.toBeNull();
    });

    it('governanceFetchDirect returns parsed JSON on success', async () => {
        const payload = { ok: true, value: 1 };
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(asResponse({ ok: true, json: payload })));

        await expect(governanceFetchDirect('/api/v1/health')).resolves.toEqual(payload);
    });

    it('governanceFetchDirect returns null on non-ok response', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(asResponse({ ok: false, status: 404 })));
        await expect(governanceFetchDirect('/missing')).resolves.toBeNull();
    });

    it('governanceFetchDirect returns null on fetch exception', async () => {
        vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
        await expect(governanceFetchDirect('/api/v1/health')).resolves.toBeNull();
    });
});
