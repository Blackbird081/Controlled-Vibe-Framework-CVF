import type { FailureRecoveryPolicy } from '../../../types/workflow-pack';

export const documentationFailureRecovery: FailureRecoveryPolicy = {
    packId: 'documentation',
    recoverySteps: [
        { step: 1, action: 'Retry with simplified output schema' },
        { step: 2, action: 'Emit partial documentation artifact with coverage annotation' },
        { step: 3, action: 'Emit governance receipt with decision=degraded', escalate: true },
    ],
    escalationPath: 'OPERATOR review required - documentation pack failed after 3 recovery steps',
};
