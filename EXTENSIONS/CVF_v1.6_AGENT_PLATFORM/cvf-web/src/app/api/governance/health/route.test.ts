import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Mock dependencies ──────────────────────────────────────────────

const mockGovernanceHealth = vi.fn();

vi.mock('@/lib/governance-engine', () => ({
    governanceHealth: (...args: unknown[]) => mockGovernanceHealth(...args),
}));

// ─── Import route ───────────────────────────────────────────────────

import { GET } from '@/app/api/governance/health/route';

describe('GET /api/governance/health', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('returns 200 with connected status when engine healthy', async () => {
        mockGovernanceHealth.mockResolvedValue({
            status: 'healthy',
            service: 'CVF Governance Engine',
            version: '1.6.1',
            timestamp: '2026-02-21T00:00:00Z',
        });

        const res = await GET();
        const json = await res.json();

        expect(res.status).toBe(200);
        expect(json.success).toBe(true);
        expect(json.connectionStatus).toBe('connected');
        expect(json.version).toBe('1.6.1');
    });

    it('returns 503 when engine unreachable', async () => {
        mockGovernanceHealth.mockResolvedValue(null);

        const res = await GET();
        const json = await res.json();

        expect(res.status).toBe(503);
        expect(json.success).toBe(false);
        expect(json.connectionStatus).toBe('disconnected');
    });

    it('returns 500 on unexpected error', async () => {
        mockGovernanceHealth.mockRejectedValue(new Error('boom'));

        const res = await GET();
        const json = await res.json();

        expect(res.status).toBe(500);
        expect(json.success).toBe(false);
        expect(json.connectionStatus).toBe('disconnected');
    });
});
