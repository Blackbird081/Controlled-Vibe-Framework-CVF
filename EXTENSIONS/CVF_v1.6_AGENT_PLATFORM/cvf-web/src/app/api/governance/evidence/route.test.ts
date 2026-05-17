import { describe, expect, it, vi } from 'vitest';

const mockGetGovernanceEvidenceReport = vi.fn(() => ({
    generatedAt: '2026-05-08T00:00:00.000Z',
    releaseGate: {
        status: 'pass',
        command: 'python scripts/run_cvf_release_gate_bundle.py --json',
        sourcePath: 'docs/reviews/CVF_W149_CLOSURE_DECISION_2026-05-08.md',
        summary: 'Latest recorded release-quality gate state is PASS in W149 closure.',
    },
    providerLanes: [],
    evidenceReceipts: [],
    policySnapshots: [],
    approvalRefs: [],
    boundary: 'Read-only evidence index.',
}));

vi.mock('@/lib/server/governance-evidence', () => ({
    getGovernanceEvidenceReport: () => mockGetGovernanceEvidenceReport(),
}));

import { GET } from './route';

describe('GET /api/governance/evidence', () => {
    it('returns the read-only governance evidence report without caching', async () => {
        const response = await GET();
        const json = await response.json();

        expect(response.status).toBe(200);
        expect(response.headers.get('Cache-Control')).toBe('no-store');
        expect(mockGetGovernanceEvidenceReport).toHaveBeenCalledOnce();
        expect(json.releaseGate.status).toBe('pass');
    });
});
