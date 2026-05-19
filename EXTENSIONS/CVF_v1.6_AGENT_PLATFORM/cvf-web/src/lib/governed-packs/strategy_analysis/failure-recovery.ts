import type { FailureRecoveryPolicy } from '../../../types/workflow-pack';

export const strategyAnalysisFailureRecovery: FailureRecoveryPolicy = {
    packId: 'strategy_analysis',
    recoverySteps: [
        { step: 1, action: 'Retry with reduced context window' },
        { step: 2, action: 'Fall back to structured template output' },
        { step: 3, action: 'Emit governance receipt with decision=degraded', escalate: true },
    ],
    escalationPath: 'OPERATOR review required - strategy analysis pack failed after 3 recovery steps',
};
