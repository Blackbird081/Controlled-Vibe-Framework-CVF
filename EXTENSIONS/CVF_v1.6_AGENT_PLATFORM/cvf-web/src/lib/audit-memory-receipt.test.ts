import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildAuditMemoryReceipt, buildRouteAuditMemoryCapture } from './audit-memory-receipt';

afterEach(() => {
    vi.doUnmock('cvf-learning-plane-foundation/web-runtime');
    vi.doUnmock('../../../../CVF_GUARD_CONTRACT/src/contracts/memory-continuity.contract');
    vi.resetModules();
});

describe('audit-memory-receipt', () => {
    it('captures a governance audit event as session memory after receipt emission', () => {
        const auditMemoryReceipt = buildAuditMemoryReceipt({
            governanceReceiptId: 'receipt-123',
            actorId: 'user-1',
            actorRole: 'BUILDER',
            sessionId: 'session-1',
            templateId: 'app_builder_complete',
            workflowId: 'workflow.product.create_product_brief.v1',
            provider: 'openai',
            model: 'gpt-4o',
            decision: 'ALLOW',
            stepTraceIds: [
                'step-1-intake-validation',
                'step-3-provider-call',
                'step-5-receipt-emit',
            ],
            rolePermission: {
                role: 'BUILDER',
                permissionRole: 'BUILDER',
                outputClass: 'artifact',
                allowed: true,
            },
        });

        expect(auditMemoryReceipt).toMatchObject({
            tier: 'session',
            contractVersion: 'phaseD.memoryContinuity.v1',
            ownerRole: 'OPERATOR',
            writesRequireReceipt: true,
            privacyFilters: ['scope_minimization', 'pii_redaction'],
            reinjectionPolicy: {
                tier: 'session',
                privacyFilter: 'pii_redaction',
                receiptRequired: true,
            },
            receipt: {
                traceId: 'receipt-123',
                decision: 'captured',
                reason: 'memory_captured_after_policy_and_privacy',
                actorId: 'user-1',
                provenanceRequired: true,
            },
            captureRecord: {
                contractVersion: 'cvf.agentMemoryCaptureRecord.vi3.v1',
                eventId: 'agentmemory-receipt-123',
                actorId: 'user-1',
                projectId: 'workflow.product.create_product_brief.v1',
                eventType: 'execution_result',
                payloadSummary: 'Governance audit receipt receipt-123 observed for workflow.product.create_product_brief.v1; decision=ALLOW.',
                domainScope: 'route_audit_memory',
                phaseScope: 'PHASE H',
                riskLevel: 'R1',
                policyContext: {
                    policyDecision: 'ALLOW',
                    actorRole: 'worker',
                    allowedScopes: ['session'],
                    canWrite: true,
                    canReinject: false,
                },
                rawSecretStored: false,
                rawToolOutputStored: false,
                crossProjectDataStored: false,
                privateReasoningCaptured: false,
                promotion: {
                    initialKind: 'episodic',
                    automaticPromotion: false,
                },
            },
        });
        expect(auditMemoryReceipt.receipt.memoryIds).toHaveLength(1);
        expect(auditMemoryReceipt.captureRecord.disallowedBehaviors).toEqual(expect.arrayContaining([
            'direct_memory_search',
            'direct_secret_storage',
            'private_credential_capture',
            'agent_private_reasoning_capture',
            'automatic_semantic_or_procedural_promotion',
        ]));
        expect(auditMemoryReceipt.captureRecord.boundaries).toContain('capture_is_observation_not_permission');
    });

    it('session ownerRole is OPERATOR', () => {
        const result = buildAuditMemoryReceipt({
            governanceReceiptId: 'gr-001',
            actorId: 'actor-001',
            actorRole: 'OPERATOR',
        });

        expect(result.ownerRole).toBe('OPERATOR');
    });

    it('writesRequireReceipt is true for session tier', () => {
        const result = buildAuditMemoryReceipt({
            governanceReceiptId: 'gr-002',
            actorId: 'actor-002',
            actorRole: 'SERVICE_AGENT',
        });

        // canReinject remains hardcoded false in the capture call; policy
        // reinjectionAllowed stays metadata and is not used as a write gate.
        expect(result.writesRequireReceipt).toBe(true);
        expect(Array.isArray(result.privacyFilters)).toBe(true);
        expect(result.privacyFilters).toContain('pii_redaction');
    });

    it('surfaces policy fields and capture state in route audit readout', () => {
        const result = buildRouteAuditMemoryCapture({
            governanceReceiptId: 'gr-003',
            actorId: 'actor-003',
            actorRole: 'BUILDER',
            templateId: 'documentation',
            templateName: 'Documentation',
            decision: 'ALLOW',
        });

        expect(result.auditEventPayload.payload).toMatchObject({
            governanceReceiptId: 'gr-003',
            memoryTier: 'session',
            memoryContractVersion: 'phaseD.memoryContinuity.v1',
            writesRequireReceipt: true,
            privacyFilters: ['scope_minimization', 'pii_redaction'],
            memoryReceiptDecision: 'captured',
            memoryCaptureMode: 'captured',
            memoryCaptureReason: 'memory_captured_after_policy_and_privacy',
            memoryCaptureRecordVersion: 'cvf.agentMemoryCaptureRecord.vi3.v1',
            memoryCaptureEventType: 'execution_result',
            memoryCaptureCanReinject: false,
            memoryCaptureRawSecretStored: false,
            memoryCaptureAutomaticPromotion: false,
            taskMemoryDecision: 'NOT_APPLICABLE',
            taskMemoryReason: 'task memory not wired to this context',
        });
        expect(JSON.stringify(result.auditEventPayload.payload)).not.toContain('reinjectionAllowed');
    });

    it('surfaces taskMemoryDecision CAPTURED when an ephemeral task entry is present', () => {
        const result = buildRouteAuditMemoryCapture({
            governanceReceiptId: 'gr-task-001',
            actorId: 'actor-task-001',
            actorRole: 'BUILDER',
            taskId: 'task-001',
            taskMemoryStore: {
                get: () => ({ taskId: 'task-001', expiresAt: 2000 }),
                inspect: () => ({
                    state: 'present',
                    reason: 'task_memory_entry_present',
                    entry: { taskId: 'task-001', expiresAt: 2000 },
                }),
            },
        });

        expect(result.auditEventPayload.payload).toMatchObject({
            taskMemoryDecision: 'CAPTURED',
            taskMemoryReason: 'task memory entry present',
            memoryCaptureMode: 'captured',
        });
        expect(JSON.stringify(result.auditEventPayload.payload)).not.toContain('reinjectionAllowed');
    });

    it('surfaces taskMemoryDecision SKIPPED when no task memory entry exists', () => {
        const result = buildRouteAuditMemoryCapture({
            governanceReceiptId: 'gr-task-002',
            actorId: 'actor-task-002',
            actorRole: 'BUILDER',
            taskId: 'task-002',
            taskMemoryStore: {
                get: () => undefined,
                inspect: () => ({ state: 'missing', reason: 'task_memory_entry_missing' }),
            },
        });

        expect(result.auditEventPayload.payload).toMatchObject({
            taskMemoryDecision: 'SKIPPED',
            taskMemoryReason: 'no task memory requested',
        });
    });

    it('surfaces taskMemoryDecision EXPIRED when a task entry expired before readout', () => {
        const result = buildRouteAuditMemoryCapture({
            governanceReceiptId: 'gr-task-003',
            actorId: 'actor-task-003',
            actorRole: 'BUILDER',
            taskId: 'task-003',
            taskMemoryStore: {
                get: () => undefined,
                inspect: () => ({
                    state: 'expired',
                    reason: 'task_memory_entry_expired',
                    entry: { taskId: 'task-003', expiresAt: 1000 },
                }),
            },
        });

        expect(result.auditEventPayload.payload).toMatchObject({
            taskMemoryDecision: 'EXPIRED',
            taskMemoryReason: 'entry expired before readout',
        });
    });

    it('preserves canReinject=false as the capture policy binding', async () => {
        const capture = vi.fn().mockReturnValue({
            receipt: {
                receiptId: 'mem-001',
                traceId: 'gr-004',
                decision: 'captured',
                reason: 'memory_captured_after_policy_and_privacy',
                createdAt: '2026-05-21T00:00:00.000Z',
                actorId: 'actor-004',
                memoryIds: ['memory-1'],
                maskedTokenCount: 0,
                estimatedTokens: 0,
                provenanceRequired: true,
            },
        });

        vi.resetModules();
        vi.doMock('cvf-learning-plane-foundation/web-runtime', () => ({
            createControlledMemoryGatewayContract: () => ({ capture }),
        }));

        const auditMemoryModule = await import('./audit-memory-receipt');
        auditMemoryModule.buildAuditMemoryReceipt({
            governanceReceiptId: 'gr-004',
            actorId: 'actor-004',
            actorRole: 'BUILDER',
        });

        expect(capture).toHaveBeenCalledWith(expect.objectContaining({
            policy: expect.objectContaining({
                canReinject: false,
            }),
        }));
        expect(JSON.stringify(capture.mock.calls[0][0])).not.toContain('reinjectionAllowed');
    });

    it('surfaces degraded-capture reason without triggering reinjection', async () => {
        const capture = vi.fn();

        vi.resetModules();
        vi.doMock('cvf-learning-plane-foundation/web-runtime', () => ({
            createControlledMemoryGatewayContract: () => ({ capture }),
        }));
        vi.doMock('../../../../CVF_GUARD_CONTRACT/src/contracts/memory-continuity.contract', () => ({
            MEMORY_CONTINUITY_CONTRACT_VERSION: 'phaseD.memoryContinuity.v1',
            MEMORY_TIER_OWNER_POLICIES: {
                session: {
                    ownerRole: 'OPERATOR',
                    writesRequireReceipt: false,
                    privacyFilters: ['scope_minimization', 'pii_redaction'],
                },
            },
            MEMORY_REINJECTION_POLICIES: {
                session: {
                    privacyFilter: 'pii_redaction',
                    provenanceScoreThreshold: 0.7,
                    maxAgeSeconds: 86400,
                    receiptRequired: true,
                },
            },
        }));

        const auditMemoryModule = await import('./audit-memory-receipt');
        const result = auditMemoryModule.buildRouteAuditMemoryCapture({
            governanceReceiptId: 'gr-005',
            actorId: 'actor-005',
            actorRole: 'SERVICE_AGENT',
        });

        expect(result.auditEventPayload.outcome).toBe('DEGRADED');
        expect(result.auditEventPayload.payload).toMatchObject({
            writesRequireReceipt: false,
            privacyFilters: ['scope_minimization', 'pii_redaction'],
            memoryReceiptDecision: 'policy_skipped',
            memoryCaptureMode: 'degraded',
            memoryCaptureReason: 'memory_tier_does_not_require_receipt_write',
            memoryCaptureRecordVersion: 'cvf.agentMemoryCaptureRecord.vi3.v1',
            memoryCaptureEventType: 'execution_result',
            memoryCaptureCanReinject: false,
            memoryCaptureRawSecretStored: false,
            memoryCaptureAutomaticPromotion: false,
            taskMemoryDecision: 'NOT_APPLICABLE',
            taskMemoryReason: 'task memory not wired to this context',
        });
        expect(result.auditMemoryReceipt.captureRecord.captureDecision).toBe('policy_skipped');
        expect(result.auditMemoryReceipt.captureRecord.policyContext.canWrite).toBe(false);
        expect(capture).not.toHaveBeenCalled();
        expect(JSON.stringify(result.auditEventPayload.payload)).not.toContain('reinjectionAllowed');
    });
});
