import type { WorkflowPackRegistry } from '../../types/workflow-pack';
import { appBuilderFailureRecovery } from './app_builder_complete/failure-recovery';
import { documentationFailureRecovery } from './documentation/failure-recovery';
import { strategyAnalysisFailureRecovery } from './strategy_analysis/failure-recovery';

export type {
    FailureRecoveryPolicy,
    FailureRecoveryStep,
    WorkflowPackRef,
    WorkflowPackRegistry,
} from '../../types/workflow-pack';

const GOVERNED_PACK_REGISTRY: WorkflowPackRegistry[] = [
    {
        packId: strategyAnalysisFailureRecovery.packId,
        templateId: 'strategy_analysis',
        version: '1.0.0',
        specPath: './strategy_analysis/workflow.spec.md',
        policyPath: './strategy_analysis/execution.policy.json',
        receiptSchemaPath: './strategy_analysis/receipt.schema.json',
        failureRecovery: strategyAnalysisFailureRecovery,
    },
    {
        packId: documentationFailureRecovery.packId,
        templateId: 'documentation',
        version: '1.0.0',
        specPath: './documentation/workflow.spec.md',
        policyPath: './documentation/execution.policy.json',
        receiptSchemaPath: './documentation/receipt.schema.json',
        failureRecovery: documentationFailureRecovery,
    },
    {
        packId: appBuilderFailureRecovery.packId,
        templateId: 'app_builder_complete',
        version: '1.0.0',
        specPath: './app_builder_complete/workflow.spec.md',
        policyPath: './app_builder_complete/execution.policy.json',
        receiptSchemaPath: './app_builder_complete/receipt.schema.json',
        failureRecovery: appBuilderFailureRecovery,
    },
];

export function getGovernedPack(templateId: string): WorkflowPackRegistry | undefined {
    return GOVERNED_PACK_REGISTRY.find((pack) => pack.templateId === templateId);
}

export {
    appBuilderFailureRecovery,
    documentationFailureRecovery,
    strategyAnalysisFailureRecovery,
};
