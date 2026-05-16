import { describe, expect, it, vi } from 'vitest';

const mockGetRuntimeObservabilitySnapshot = vi.fn(() => ({
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
}));

vi.mock('@/lib/server/runtime-observability', () => ({
    getRuntimeObservabilitySnapshot: () => mockGetRuntimeObservabilitySnapshot(),
}));

import { GET } from './route';

describe('GET /api/runtime/observability', () => {
    it('returns the read-only runtime observability snapshot without caching', async () => {
        const response = await GET();
        const json = await response.json();

        expect(response.status).toBe(200);
        expect(response.headers.get('Cache-Control')).toBe('no-store');
        expect(mockGetRuntimeObservabilitySnapshot).toHaveBeenCalledOnce();
        expect(json.mode).toBe('READ_ONLY_MODE');
    });
});
