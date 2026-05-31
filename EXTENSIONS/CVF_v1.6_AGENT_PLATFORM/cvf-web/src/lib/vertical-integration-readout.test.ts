import { describe, expect, it } from 'vitest';
import { buildAuditMemoryReceipt } from '@/lib/audit-memory-receipt';
import { buildPhase2CProductBriefSliceForRoute } from '@/lib/phase2c-product-brief-slice';
import { buildPhase3EOperationalMetricsForRoute } from '@/lib/phase3e-operational-emission';
import { buildVerticalIntegrationReadout } from '@/lib/vertical-integration-readout';
import { buildWorkflowExecutionProjection, resolveWorkflowBindingForExecution } from '@/lib/workflows/workflow-resolver';
import type { GovernanceEvidenceReceipt } from '@/lib/ai';

const output = [
    '## Product Brief',
    '',
    'TaskFlow helps small product teams plan lightweight work with task boards, owner fields, and status filters.',
    '',
    '## Acceptance Criteria',
    '',
    '1. Users can create a task quickly.',
    '2. Users can filter tasks by status.',
].join('\n');

function buildReceipt(): GovernanceEvidenceReceipt {
    return {
        receiptId: 'rcpt-env-vi1-test',
        evidenceMode: 'live',
        routeId: '/api/execute',
        decision: 'ALLOW',
        riskLevel: 'R1',
        provider: 'alibaba',
        model: 'qwen-turbo',
        routingDecision: 'selected',
        policySnapshotId: 'pol-vi1-0001',
        envelopeId: 'env-vi1-test',
        generatedAt: '2026-05-25T00:00:00.000Z',
    };
}

describe('vertical integration readout', () => {
    it('reports integrated when existing W-series execute surfaces are present', () => {
        const evidenceReceipt = buildReceipt();
        const binding = resolveWorkflowBindingForExecution('app_builder_complete');
        expect(binding).toBeTruthy();
        const workflowExecution = buildWorkflowExecutionProjection(binding!, evidenceReceipt.receiptId);
        const auditMemoryReceipt = buildAuditMemoryReceipt({
            governanceReceiptId: evidenceReceipt.receiptId,
            actorId: 'operator-1',
            actorRole: 'OPERATOR',
            sessionId: 'thread-vi1',
            templateId: 'app_builder_complete',
            workflowId: workflowExecution.workflowId,
            provider: 'alibaba',
            model: 'qwen-turbo',
            decision: 'ALLOW',
            stepTraceIds: workflowExecution.stepTraces.map(trace => trace.stepId),
        });
        const phase2cProductBrief = buildPhase2CProductBriefSliceForRoute({
            responseSuccess: true,
            templateId: 'app_builder_complete',
            templateName: 'App Builder Complete',
            category: 'development',
            inputs: {
                appName: 'TaskFlow',
                problem: 'Small teams need a lighter way to plan work.',
            },
            intent: 'Create Product Brief for TaskFlow',
            output,
            evidenceReceipt,
        });
        const phase3eOperationalMetrics = buildPhase3EOperationalMetricsForRoute({
            phase2cProductBrief,
            evidenceReceipt,
            responseSuccess: true,
        });
        const requestContextReadout = {
            readoutVersion: 'cvf.routeRequestContextProfile.vi2.v1' as const,
            profile: 'task' as const,
            budgetTier: 'minimal' as const,
            readiness: 'ready' as const,
            approxTokens: 120,
            wordCount: 60,
            signalDensity: 1,
            detectedSignals: ['active_task_objective', 'business_goal_or_audience', 'constraints_or_risks'],
            missingSignals: [],
            noiseFlags: [],
            contaminationFlags: [],
            includedSurfaces: ['identity_invariant', 'safety_baseline', 'policy_baseline', 'task_objective'],
            excludedSurfaces: ['raw_memory_injection'],
            executionCeiling: {
                modelProviderCall: 'existing_route_only' as const,
                toolExecution: false as const,
                mcpAccess: false as const,
                memoryInjection: false as const,
                profileEscalation: 'advisory_only' as const,
            },
            recommendedNextAction: 'Proceed with existing governed route execution; no context-profile escalation is needed.',
            boundaries: ['advisory_readout_only', 'no_prompt_mutation'],
        };

        const readout = buildVerticalIntegrationReadout({
            evidenceReceipt,
            workflowExecution,
            auditMemoryReceipt,
            requestContextReadout,
            phase2cProductBrief,
            phase3eOperationalMetrics,
            actorId: 'operator-1',
            templateId: 'app_builder_complete',
            chainRequest: {
                threadId: 'thread-vi1',
                rootReceiptId: 'rcpt-env-vi1-root',
                parentReceiptId: 'rcpt-env-vi1-root',
                turnIndex: 2,
            },
        });

        expect(readout).toMatchObject({
            contractVersion: 'cvf.verticalWorkflowIntegration.vi1.v1',
            status: 'integrated',
            requiredSurfaceCount: 5,
            integratedSurfaceCount: 11,
            liveReceipt: {
                present: true,
                receiptId: evidenceReceipt.receiptId,
                evidenceMode: 'live',
            },
            chain: {
                threadId: 'thread-vi1',
                parentReceiptId: 'rcpt-env-vi1-root',
                continuityProven: true,
            },
        });
        expect(readout.surfaces.map(surface => surface.surfaceId)).toEqual([
            'governance_receipt',
            'workflow_state_machine',
            'workflow_recovery',
            'request_context_profile',
            'memory_event_hook',
            'tool_action_taxonomy',
            'tool_action_approval',
            'provider_method_fallback',
            'operational_scorecard',
            'artifact_verification',
            'operational_metrics',
        ]);
        expect(readout.surfaces.every(surface => surface.present)).toBe(true);
        expect(readout.evidencePackage).toMatchObject({
            contractVersion: 'cvf.verticalEvidencePackage.vi4.v1',
            callLevel: {
                totalCalls: 1,
                successfulCalls: 1,
                failedCalls: 0,
                liveCalls: 1,
                receiptBackedCalls: 1,
                callPassRate: 1,
            },
            eventModel: {
                totalEvents: 11,
                eventsPerCall: 11,
            },
            toolAction: {
                taxonomyVersion: 'cvf.toolActionTaxonomy.w3.v1',
                decision: 'ALLOW',
                runtimeExecutionAuthorized: false,
            },
            toolActionApproval: {
                contractVersion: 'cvf.toolActionApprovalReadout.ta1.v1',
                approvalState: 'not_required',
                runtimeExecutionAuthorized: false,
            },
            providerMethod: {
                contractVersion: 'cvf.providerMethodFallbackNormalization.w5.v1',
                status: 'ready',
                adapterExecutionAuthorized: true,
                diagnosticClass: 'none',
            },
        });
        expect(readout.evidencePackage.eventModel.denominatorNote).toContain('event totals are not the call-level pass-rate denominator');
        expect(readout.memoryEventHook.receipt).toMatchObject({
            contractVersion: 'cvf.memoryEventHooks.w2.v1',
            eventType: 'execution_result',
            rawMemoryReleased: false,
            canReinject: false,
        });
        const memorySurface = readout.surfaces.find(surface => surface.surfaceId === 'memory_event_hook');
        expect(memorySurface?.summary).toContain('capture=captured');
        expect(memorySurface?.evidenceRefs).toEqual(expect.arrayContaining([
            auditMemoryReceipt.captureRecord.eventId,
            auditMemoryReceipt.captureRecord.auditReceiptId,
        ]));
        expect(auditMemoryReceipt.captureRecord).toMatchObject({
            contractVersion: 'cvf.agentMemoryCaptureRecord.vi3.v1',
            eventType: 'execution_result',
            policyContext: {
                canReinject: false,
            },
            rawSecretStored: false,
            privateReasoningCaptured: false,
            promotion: {
                automaticPromotion: false,
            },
        });
    });

    it('keeps missing legacy pack surfaces visible while VI4 readouts stay integrated', () => {
        const evidenceReceipt = buildReceipt();
        const readout = buildVerticalIntegrationReadout({
            evidenceReceipt,
            actorId: 'operator-1',
            templateId: 'documentation',
            chainRequest: {
                threadId: 'thread-vi1',
                turnIndex: 2,
            },
        });

        expect(readout.status).toBe('integrated');
        expect(readout.integratedSurfaceCount).toBe(6);
        expect(readout.chain).toMatchObject({
            continuityProven: false,
            reason: 'continuity_metadata_incomplete',
        });
        expect(readout.surfaces.filter(surface => !surface.present).map(surface => surface.surfaceId)).toEqual([
            'workflow_state_machine',
            'workflow_recovery',
            'request_context_profile',
            'artifact_verification',
            'operational_metrics',
        ]);
        expect(readout.evidencePackage.callLevel).toMatchObject({
            totalCalls: 1,
            successfulCalls: 1,
            callPassRate: 1,
        });
        expect(readout.evidencePackage.eventModel).toMatchObject({
            totalEvents: 11,
            eventsPerCall: 11,
        });
        expect(readout.memoryEventHook.receipt.canReinject).toBe(false);
        expect(readout.memoryEventHook.receipt.rawMemoryReleased).toBe(false);
    });
});
