import { describe, expect, it, vi } from 'vitest';

const mockGetCvfWorkspaceReadModel = vi.fn(() => ({
    activeSessionMode: 'wwu_t2_web_workspace_read_model_dispatched_t3_parked',
    nextAllowedMove: 'Execute WWU-T2.',
    laneSummaries: [
        {
            lane: 'accepted_material',
            count: 1,
            statuses: ['CLOSED_PASS_BOUNDED'],
            recentItems: [
                {
                    workspaceItemId: 'wwu-t2-accepted-material-2026-06-18',
                    sourceWorkOrder: 'docs/work_orders/CVF_AGENT_WORK_ORDER_WWU_T2_CVF_WEB_WORKSPACE_OPERATOR_DASHBOARD_READ_MODEL_FOR_CODEX_2026-06-18.md',
                },
            ],
        },
    ],
    boundary: 'Read-only projection.',
}));

vi.mock('@/lib/server/cvf-workspace-read-model', () => ({
    getCvfWorkspaceReadModel: () => mockGetCvfWorkspaceReadModel(),
}));

import { GET } from './route';

describe('GET /api/workspace/state', () => {
    it('returns the read-only workspace state projection without caching', async () => {
        const response = await GET();
        const json = await response.json();

        expect(response.status).toBe(200);
        expect(response.headers.get('Cache-Control')).toBe('no-store');
        expect(mockGetCvfWorkspaceReadModel).toHaveBeenCalledOnce();
        expect(json.activeSessionMode).toBe('wwu_t2_web_workspace_read_model_dispatched_t3_parked');
        expect(json.laneSummaries[0].lane).toBe('accepted_material');
    });
});
