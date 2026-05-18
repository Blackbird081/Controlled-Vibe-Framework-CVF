import { describe, expect, it } from 'vitest';
import { buildAuditMemoryReceipt } from './audit-memory-receipt';

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
        });
        expect(auditMemoryReceipt.receipt.memoryIds).toHaveLength(1);
    });
});
