import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { afterEach, describe, expect, it } from 'vitest';
import { getCvfWorkspaceReadModel } from './cvf-workspace-read-model';

let tempRoot: string | undefined;

function writeRepoFile(path: string, content: string) {
    if (!tempRoot) throw new Error('tempRoot not initialized');
    const fullPath = join(tempRoot, path);
    mkdirSync(join(fullPath, '..'), { recursive: true });
    writeFileSync(fullPath, content, 'utf8');
}

function setupRepo() {
    tempRoot = mkdtempSync(join(tmpdir(), 'cvf-workspace-read-model-'));
    writeRepoFile('CVF_SESSION/ACTIVE_SESSION_STATE.json', JSON.stringify({
        currentMode: 'wwu_t2_web_workspace_read_model_dispatched_t3_parked',
        previousMode: 'wwu_t1_cvf_web_workspace_surface_audit_closed_t2_gc018_ready_t3_parked',
        activeHandoff: 'AGENT_HANDOFF_V19_2026-06-15.md',
        nextAllowedMove: {
            value: 'Next allowed move: execute WWU-T2. WWU-T3 Local Workspace Runtime/MCP remains parked. No provider/live calls, public-sync, or readiness claims are authorized.',
        },
        wwuT2CvfWebWorkspaceOperatorDashboardReadModelDispatch20260618: {
            status: 'DISPATCH_READY',
            materialCommit: '1bbf3046',
            roadmap: 'docs/roadmaps/CVF_WEB_WORKSPACE_UPGRADE_ROADMAP_2026-06-18.md',
            workOrder: 'docs/work_orders/CVF_AGENT_WORK_ORDER_WWU_T2_CVF_WEB_WORKSPACE_OPERATOR_DASHBOARD_READ_MODEL_FOR_CODEX_2026-06-18.md',
            gc018: 'docs/baselines/CVF_GC018_WWU_T2_CVF_WEB_WORKSPACE_OPERATOR_DASHBOARD_READ_MODEL_2026-06-18.md',
            claimBoundary: 'Read-only dashboard only.',
        },
    }));
    writeRepoFile('CVF_SESSION_MEMORY.md', 'Status: ACTIVE SESSION FRONT DOOR\n\n## Next Allowed Move\n\nMode: `wwu_t2_web_workspace_read_model_dispatched_t3_parked`.\n');
    writeRepoFile('CVF_SESSION/agent_workspace/ACTIVE_AGENT_WORKSPACE_STATE.json', JSON.stringify({
        status: 'ACTIVE_GENERATED_STATE',
        items: [
            {
                workspaceItemId: 'wwu-t2-accepted-material-2026-06-18',
                lane: 'accepted_material',
                itemKind: 'web_workspace_read_model',
                status: 'CLOSED_PASS_BOUNDED',
                ownerRole: 'Codex',
                phase: 'closure',
                sourceWorkOrder: 'docs/work_orders/CVF_AGENT_WORK_ORDER_WWU_T2_CVF_WEB_WORKSPACE_OPERATOR_DASHBOARD_READ_MODEL_FOR_CODEX_2026-06-18.md',
                evidencePaths: [
                    'docs/reviews/CVF_WWU_T2_CVF_WEB_WORKSPACE_OPERATOR_DASHBOARD_READ_MODEL_COMPLETION_2026-06-18.md',
                ],
                claimBoundary: 'Read-only CVF Web Workspace projection only.',
                nextMoveImpact: 'WWU-T3 remains parked.',
                resumeCondition: 'N/A',
            },
            {
                workspaceItemId: 'wwu-t3-local-runtime-parked-2026-06-18',
                lane: 'parked',
                itemKind: 'local_workspace_runtime',
                status: 'PARKED',
                ownerRole: 'Orchestrator',
                phase: 'hold',
                sourceWorkOrder: 'N/A',
                evidencePaths: [],
                claimBoundary: 'No runtime/MCP implementation.',
                nextMoveImpact: 'Requires fresh authorization.',
                resumeCondition: 'Fresh GC-018 plus source-verified work order.',
            },
        ],
    }));
    writeRepoFile('AGENT_HANDOFF_V19_2026-06-15.md', 'Status: ACTIVE HANDOFF\n\n## Startup Acknowledgment\n\nStartup acknowledged: current mode=`wwu_t2_web_workspace_read_model_dispatched_t3_parked`.\n\n## Next Allowed Move\n\nExecute WWU-T2. WWU-T3 Local Workspace Runtime/MCP remains parked.\n');
    writeRepoFile('docs/roadmaps/CVF_WEB_WORKSPACE_UPGRADE_ROADMAP_2026-06-18.md', 'Status: ROADMAP_T1_PASS_T2_READY_FOR_IMPLEMENTATION_T3_PARKED\n');
    writeRepoFile('docs/work_orders/CVF_AGENT_WORK_ORDER_WWU_T2_CVF_WEB_WORKSPACE_OPERATOR_DASHBOARD_READ_MODEL_FOR_CODEX_2026-06-18.md', 'Status: DISPATCH_READY\n');
    writeRepoFile('docs/baselines/CVF_GC018_WWU_T2_CVF_WEB_WORKSPACE_OPERATOR_DASHBOARD_READ_MODEL_2026-06-18.md', 'Status: DISPATCH_READY\n');
    return tempRoot;
}

afterEach(() => {
    if (tempRoot) rmSync(tempRoot, { recursive: true, force: true });
    tempRoot = undefined;
});

describe('getCvfWorkspaceReadModel', () => {
    it('projects active CVF session state with an explicit activeSessionMode field', () => {
        const repoRoot = setupRepo();
        const model = getCvfWorkspaceReadModel({
            repoRoot,
            now: new Date('2026-06-18T00:00:00.000Z'),
        });

        expect(model.generatedAt).toBe('2026-06-18T00:00:00.000Z');
        expect(model.activeSessionMode).toBe('wwu_t2_web_workspace_read_model_dispatched_t3_parked');
        expect(model.dispatch.status).toBe('DISPATCH_READY');
        expect(model.activeHandoff.path).toBe('AGENT_HANDOFF_V19_2026-06-15.md');
        expect(model.workOrder.status).toBe('DISPATCH_READY');
        expect(model.roadmap.status).toBe('ROADMAP_T1_PASS_T2_READY_FOR_IMPLEMENTATION_T3_PARKED');
        expect(model.workspaceState.status).toBe('PRESENT');
        expect(model.laneSummaries.map(summary => summary.lane)).toEqual(['accepted_material', 'parked']);
        expect(model.laneSummaries[0]?.recentItems[0]?.sourceWorkOrder).toContain('CVF_AGENT_WORK_ORDER_WWU_T2');
        expect(model.sources.find(source => source.path === 'CVF_SESSION/ACTIVE_SESSION_STATE.json')?.status).toBe('PRESENT');
        expect(model.sources.find(source => source.path === 'CVF_SESSION/agent_workspace/ACTIVE_AGENT_WORKSPACE_STATE.json')?.exists).toBe(true);
        expect(model.parkedCheckpoints.join(' ')).toContain('Local Workspace Runtime/MCP remains parked');
        expect(model.boundary).toContain('No Local Runtime/MCP');
    });

    it('exposes read-only links instead of mutation controls', () => {
        const repoRoot = setupRepo();
        const model = getCvfWorkspaceReadModel({ repoRoot });

        expect(model.links.map(link => link.href)).toContain('/governance/evidence');
        expect(model.links.map(link => link.href)).toContain('/governance/operations');
        expect(model.links.every(link => !link.href.startsWith('/api/'))).toBe(true);
    });
});
