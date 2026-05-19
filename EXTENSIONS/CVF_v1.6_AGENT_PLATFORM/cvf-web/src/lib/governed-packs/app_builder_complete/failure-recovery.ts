import type { FailureRecoveryPolicy } from '../../../types/workflow-pack';

export const appBuilderFailureRecovery: FailureRecoveryPolicy = {
    packId: 'app_builder_complete',
    recoverySteps: [
        { step: 1, action: 'Retry with minimal spec output (summary only)' },
        { step: 2, action: 'Emit partial app spec with missing sections marked' },
        { step: 3, action: 'Emit governance receipt with decision=degraded', escalate: true },
    ],
    escalationPath: 'OPERATOR review required - app builder pack failed after 3 recovery steps',
};
