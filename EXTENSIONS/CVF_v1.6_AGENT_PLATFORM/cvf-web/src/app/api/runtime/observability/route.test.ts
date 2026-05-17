import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockGetRuntimeObservabilitySnapshot = vi.fn(async (input?: unknown) => {
    void input;
    return ({
    mode: 'READ_ONLY_MODE',
    generatedAt: '2026-05-17T00:00:00.000Z',
    panels: {
        sessions: [],
        tokenContext: [],
        rateLimits: [],
        processes: [],
        ports: [],
        alerts: [],
        events: [],
    },
    summary: {
        activeSessions: 0,
        highestSeverity: 'INFO',
        policyRequiredCount: 0,
        alertsBySeverity: {
            INFO: 0,
            NOTICE: 0,
            WARNING: 0,
            HIGH: 0,
            CRITICAL: 0,
        },
    },
    });
});

vi.mock('@/lib/server/runtime-observability', () => ({
    getRuntimeObservabilitySnapshot: (input: unknown) => mockGetRuntimeObservabilitySnapshot(input),
}));

interface MockAdapter {
    isAvailable: () => boolean;
}

const mockBuildIntegrationAdapter = vi.fn((input: unknown): MockAdapter => {
    void input;
    return { isAvailable: () => false };
});
const mockDecodeIntegrationsHeader = vi.fn((input: string): unknown => {
    void input;
    return null;
});

vi.mock('@/lib/server/integration-store', () => ({
    buildIntegrationAdapter: (input: unknown) => mockBuildIntegrationAdapter(input),
}));

vi.mock('@/lib/integrations-config', () => ({
    decodeIntegrationsHeader: (input: string) => mockDecodeIntegrationsHeader(input),
}));

import { GET } from './route';

describe('GET /api/runtime/observability', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockBuildIntegrationAdapter.mockReturnValue({ isAvailable: () => false });
        mockDecodeIntegrationsHeader.mockReturnValue(null);
    });

    it('returns the read-only runtime observability snapshot without caching', async () => {
        const request = new NextRequest('http://localhost/api/runtime/observability');
        const response = await GET(request);
        const json = await response.json();

        expect(response.status).toBe(200);
        expect(response.headers.get('Cache-Control')).toBe('no-store');
        expect(mockGetRuntimeObservabilitySnapshot).toHaveBeenCalledOnce();
        expect(json.mode).toBe('READ_ONLY_MODE');
    });

    it('decodes integration config header and passes adapter into snapshot builder', async () => {
        mockDecodeIntegrationsHeader.mockReturnValueOnce({ runtimeStore: { provider: 'none' } });
        const adapter = { isAvailable: () => false };
        mockBuildIntegrationAdapter.mockReturnValueOnce(adapter);

        const request = new NextRequest('http://localhost/api/runtime/observability', {
            headers: { 'x-cvf-integration-config': 'encoded-config' },
        });
        await GET(request);

        expect(mockDecodeIntegrationsHeader).toHaveBeenCalledWith('encoded-config');
        expect(mockBuildIntegrationAdapter).toHaveBeenCalledWith({ runtimeStore: { provider: 'none' } });
        expect(mockGetRuntimeObservabilitySnapshot).toHaveBeenCalledWith({ integrationAdapter: adapter });
    });
});
