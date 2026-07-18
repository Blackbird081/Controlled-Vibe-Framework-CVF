import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/server/cvf-workspace-read-model', () => ({
    getCvfWorkspaceReadModel: () => ({
        generatedAt: '2026-06-18T00:00:00.000Z',
        activeSessionMode: 'wwu_t2_web_workspace_read_model_dispatched_t3_parked',
        previousMode: 'wwu_t1_cvf_web_workspace_surface_audit_closed_t2_gc018_ready_t3_parked',
        activeHandoff: {
            path: 'AGENT_HANDOFF_V19_2026-06-15.md',
            exists: true,
            startupAcknowledgment: 'Startup acknowledged.',
            nextAllowedMove: 'Execute WWU-T2.',
        },
        nextAllowedMove: 'Execute the WWU-T2 work order as a read-only Web Workspace implementation.',
        parkedCheckpoints: [
            'WWU-T3 Local Workspace Runtime/MCP remains parked.',
            'No provider/live calls, public-sync, or readiness claims are authorized.',
        ],
        roadmap: {
            label: 'WWU roadmap',
            path: 'docs/roadmaps/CVF_WEB_WORKSPACE_UPGRADE_ROADMAP_2026-06-18.md',
            status: 'ROADMAP_T1_PASS_T2_READY_FOR_IMPLEMENTATION_T3_PARKED',
            exists: true,
        },
        workOrder: {
            label: 'WWU-T2 work order',
            path: 'docs/work_orders/CVF_AGENT_WORK_ORDER_WWU_T2_CVF_WEB_WORKSPACE_OPERATOR_DASHBOARD_READ_MODEL_FOR_CODEX_2026-06-18.md',
            status: 'DISPATCH_READY',
            exists: true,
        },
        gc018: {
            label: 'WWU-T2 GC-018',
            path: 'docs/baselines/CVF_GC018_WWU_T2_CVF_WEB_WORKSPACE_OPERATOR_DASHBOARD_READ_MODEL_2026-06-18.md',
            status: 'DISPATCH_READY',
            exists: true,
        },
        workspaceState: {
            label: 'Generated workspace state',
            path: 'CVF_SESSION/agent_workspace/ACTIVE_AGENT_WORKSPACE_STATE.json',
            status: 'PRESENT',
            exists: true,
        },
        laneSummaries: [
            {
                lane: 'accepted_material',
                count: 1,
                statuses: ['CLOSED_PASS_BOUNDED'],
                recentItems: [
                    {
                        workspaceItemId: 'wwu-t2-accepted-material-2026-06-18',
                        itemKind: 'web_workspace_read_model',
                        status: 'CLOSED_PASS_BOUNDED',
                        ownerRole: 'Codex',
                        phase: 'closure',
                        sourceWorkOrder: 'docs/work_orders/CVF_AGENT_WORK_ORDER_WWU_T2_CVF_WEB_WORKSPACE_OPERATOR_DASHBOARD_READ_MODEL_FOR_CODEX_2026-06-18.md',
                        evidencePaths: [
                            'docs/reviews/CVF_WWU_T2_CVF_WEB_WORKSPACE_OPERATOR_DASHBOARD_READ_MODEL_COMPLETION_2026-06-18.md',
                        ],
                        claimBoundary: 'Read-only dashboard only.',
                        nextMoveImpact: 'WWU-T3 remains parked.',
                        resumeCondition: 'N/A',
                    },
                ],
            },
        ],
        dispatch: {
            status: 'DISPATCH_READY',
            materialCommit: '1bbf3046',
            claimBoundary: 'Read-only dashboard only.',
        },
        links: [
            {
                label: 'Evidence State',
                href: '/governance/evidence',
                description: 'Recorded evidence.',
                kind: 'evidence',
            },
            {
                label: 'Runtime Monitor',
                href: '/runtime',
                description: 'Inspection only.',
                kind: 'guard',
            },
        ],
        sources: [
            {
                label: 'Active session state',
                path: 'CVF_SESSION/ACTIVE_SESSION_STATE.json',
                status: 'ACTIVE',
                exists: true,
            },
        ],
        boundary: 'CVF_WEB_WORKSPACE read-only projection. No Local Runtime/MCP, provider/live call, public-sync, runtime mutation, or readiness claim.',
    }),
}));

import WorkspacePage from './page';

describe('WorkspacePage', () => {
    it('renders the read-only operator workspace without mutation controls', () => {
        render(<WorkspacePage />);

        expect(screen.getByRole('heading', { name: 'Operator Dashboard' })).toBeTruthy();
        expect(screen.getByText('wwu_t2_web_workspace_read_model_dispatched_t3_parked')).toBeTruthy();
        expect(screen.getByText('AGENT_HANDOFF_V19_2026-06-15.md')).toBeTruthy();
        expect(screen.getByText('WWU-T3 Local Workspace Runtime/MCP remains parked.')).toBeTruthy();
        expect(screen.getByText('Workspace State Lanes')).toBeTruthy();
        expect(screen.getByText('accepted_material')).toBeTruthy();
        expect(screen.getByText('wwu-t2-accepted-material-2026-06-18')).toBeTruthy();
        expect(screen.getByText('web_workspace_read_model')).toBeTruthy();
        expect(screen.getByRole('link', { name: /Evidence State/ }).getAttribute('href')).toBe('/governance/evidence');
        expect(screen.queryByRole('button')).toBeNull();
    });
});
