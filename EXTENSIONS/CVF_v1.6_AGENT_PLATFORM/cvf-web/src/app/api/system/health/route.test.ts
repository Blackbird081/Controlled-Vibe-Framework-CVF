import { describe, expect, it, vi } from 'vitest';

const mockGetSystemHealth = vi.fn(() => ({
    status: 'ready',
    generatedAt: '2026-05-08T00:00:00.000Z',
    runtime: {
        nodeVersion: 'v22.17.0',
        appRoot: 'EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web',
        repoRoot: 'Controlled-Vibe-Framework-CVF',
        platform: 'win32',
    },
    providers: [],
    checks: [],
    summary: {
        pass: 1,
        warn: 0,
        fail: 0,
        info: 0,
    },
}));

vi.mock('@/lib/server/system-health', () => ({
    getSystemHealth: () => mockGetSystemHealth(),
}));

import { GET } from './route';

describe('GET /api/system/health', () => {
    it('returns the current read-only system health report without caching', async () => {
        const response = await GET();
        const json = await response.json();

        expect(response.status).toBe(200);
        expect(response.headers.get('Cache-Control')).toBe('no-store');
        expect(mockGetSystemHealth).toHaveBeenCalledOnce();
        expect(json.status).toBe('ready');
        expect(json.summary.pass).toBe(1);
    });
});
