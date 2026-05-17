import { describe, expect, it, vi } from 'vitest';

const mockGetRuntimeModuleRegistry = vi.fn(() => ({
    generatedAt: '2026-05-08T00:00:00.000Z',
    modules: [],
    summary: {
        total: 10,
        available: 10,
        partial: 0,
        missing: 0,
        webRunnable: 1,
        readOnlyVisible: 2,
        notExposed: 7,
    },
    boundary: 'Read-only module registry.',
}));

vi.mock('@/lib/server/runtime-modules', () => ({
    getRuntimeModuleRegistry: () => mockGetRuntimeModuleRegistry(),
}));

import { GET } from './route';

describe('GET /api/system/modules', () => {
    it('returns the read-only runtime module registry without caching', async () => {
        const response = await GET();
        const json = await response.json();

        expect(response.status).toBe(200);
        expect(response.headers.get('Cache-Control')).toBe('no-store');
        expect(mockGetRuntimeModuleRegistry).toHaveBeenCalledOnce();
        expect(json.summary.total).toBe(10);
        expect(json.summary.webRunnable).toBe(1);
    });
});
