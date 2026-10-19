import { appendAuditEvent } from '@/lib/control-plane-events';
import { applyDLPFilter } from '@/lib/dlp-filter';
import { runSafetyWorkflowChain } from '@/lib/safety-workflow-chain';

interface GovernedContextEgressInput {
    contexts: readonly (string | undefined)[];
    actorId: string;
    actorRole: string;
    targetResource: string;
}

/** Refuse unsafe approved context without mutating hash/receipt-bound bytes. */
export async function hasBlockedGovernedContext(input: GovernedContextEgressInput): Promise<boolean> {
    for (const context of input.contexts) {
        if (!context) continue;
        const contextDlp = await applyDLPFilter(context);
        const contextSafety = runSafetyWorkflowChain(context);
        if (contextDlp.wasRedacted || contextSafety.blocked || contextSafety.sanitized !== context) {
            await appendAuditEvent({
                eventType: 'GOVERNED_CONTEXT_EGRESS_BLOCKED',
                actorId: input.actorId,
                actorRole: input.actorRole,
                targetResource: input.targetResource,
                action: 'BLOCK_CONTEXT_EGRESS',
                riskLevel: 'R2',
                phase: 'PHASE C',
                outcome: 'BLOCKED',
                payload: {
                    dlpMatchCount: contextDlp.matches.length,
                    safetyPatterns: contextSafety.threats.map(threat => threat.pattern),
                },
            });
            return true;
        }
    }
    return false;
}
