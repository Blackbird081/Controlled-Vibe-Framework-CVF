/** Delta-T7 pure receipt-to-execution evidence consistency auditor. */
import { GOVERNED_EXECUTION_RECEIPT_CONTRACT, } from '../persistence/json-governed-execution.store.js';
import { PREFLIGHT_CONTRACT } from '../tools/governance-action-preflight.js';
import { RECEIPT_CONSUMER_CONTRACT } from '../tools/governance-action-receipt-consumer.js';
import { getGovernedCommandProfile, } from '../cli/governed-command-launcher.js';
import { APPROVAL_MARKER_CONTRACT, APPROVAL_MARKER_PROFILE_ID, APPROVAL_MARKER_TARGET_RELATIVE_PATH, } from '../cli/mutating-profile-approval.js';
export const RECEIPT_TO_EXECUTION_AUDIT_CONTRACT = 'cvf.delta.receiptToExecutionEvidenceAudit.v1';
function normalized(values) {
    return [...new Set((values ?? []).map((value) => value.trim().replace(/\\/g, '/')))]
        .filter(Boolean)
        .sort();
}
function same(left, right) {
    return left.length === right.length && left.every((value, index) => value === right[index]);
}
function time(value) {
    if (!value)
        return null;
    const parsed = Date.parse(value);
    return Number.isFinite(parsed) ? parsed : null;
}
export function auditReceiptToExecutionEvidence(input) {
    const findings = new Set();
    const { preflightAudit, consumption, execution } = input;
    const profile = getGovernedCommandProfile(input.expectedProfileId);
    if (preflightAudit.requestId !== preflightAudit.context.requestId ||
        preflightAudit.requestId !== preflightAudit.pipelineResult.requestId)
        findings.add('AUDIT_ID_MISMATCH');
    if (preflightAudit.context.metadata?.contract !== PREFLIGHT_CONTRACT) {
        findings.add('PREFLIGHT_CONTRACT_MISMATCH');
    }
    if (preflightAudit.pipelineResult.finalDecision !== 'ALLOW')
        findings.add('PREFLIGHT_NOT_ALLOW');
    if (preflightAudit.context.metadata?.actionClass !== consumption.actionClass ||
        consumption.actionClass !== 'RUN')
        findings.add('ACTION_CLASS_MISMATCH');
    if (consumption.contractVersion !== RECEIPT_CONSUMER_CONTRACT ||
        consumption.preflightContractVersion !== PREFLIGHT_CONTRACT)
        findings.add('PREFLIGHT_CONTRACT_MISMATCH');
    if (preflightAudit.requestId !== consumption.receiptId ||
        consumption.receiptId !== execution.receiptId)
        findings.add('RECEIPT_ID_MISMATCH');
    if (consumption.consumptionId !== execution.consumptionId) {
        findings.add('CONSUMPTION_ID_MISMATCH');
    }
    if (consumption.bindingHash !== execution.bindingHash)
        findings.add('BINDING_HASH_MISMATCH');
    if (execution.contractVersion !== GOVERNED_EXECUTION_RECEIPT_CONTRACT) {
        findings.add('EXECUTION_CONTRACT_MISMATCH');
    }
    if (!profile)
        findings.add('PROFILE_UNKNOWN');
    if (profile && execution.profileId !== profile.id)
        findings.add('PROFILE_MISMATCH');
    if (execution.status === 'ADMITTED' || !execution.completedAt) {
        findings.add('EXECUTION_NOT_FINALIZED');
    }
    const completedExecution = execution.status === 'COMPLETED' &&
        execution.executionStarted &&
        execution.executionCompleted &&
        execution.exitCode === 0 &&
        execution.startedAt !== null &&
        execution.completedAt !== null;
    const failedExecution = execution.status === 'FAILED' && execution.completedAt !== null;
    if (!completedExecution && !failedExecution)
        findings.add('EXECUTION_STATE_INVALID');
    if (execution.status === 'COMPLETED' &&
        (!execution.executionStarted || !execution.executionCompleted || execution.exitCode !== 0))
        findings.add('EXECUTION_STATE_INVALID');
    const preflightAt = time(preflightAudit.pipelineResult.executedAt);
    const consumedAt = time(consumption.consumedAt);
    const admittedAt = time(execution.admittedAt);
    const startedAt = time(execution.startedAt);
    const completedAt = time(execution.completedAt);
    const ordered = preflightAt !== null &&
        consumedAt !== null &&
        admittedAt !== null &&
        completedAt !== null &&
        preflightAt <= consumedAt &&
        consumedAt <= admittedAt &&
        admittedAt <= completedAt &&
        (startedAt === null || (admittedAt <= startedAt && startedAt <= completedAt));
    if (!ordered)
        findings.add('CHRONOLOGY_INVALID');
    const mutating = profile?.mutatingTargetRelativePath !== undefined;
    const expectedChangedSet = mutating && completedExecution ? [profile.mutatingTargetRelativePath] : [];
    const observedChangedSet = normalized(input.observedChangedSet);
    if (!same(observedChangedSet, normalized(expectedChangedSet))) {
        findings.add('OBSERVED_CHANGED_SET_MISMATCH');
    }
    const expectedTargets = mutating ? [profile.mutatingTargetRelativePath] : [];
    if (!same(normalized(preflightAudit.context.targetFiles), normalized(expectedTargets))) {
        findings.add('PREFLIGHT_TARGET_MISMATCH');
    }
    const marker = input.approvalMarker ?? null;
    if (mutating && completedExecution && !marker)
        findings.add('APPROVAL_MARKER_REQUIRED');
    if ((!mutating || !completedExecution) && marker)
        findings.add('APPROVAL_MARKER_UNEXPECTED');
    if (marker && mutating && completedExecution) {
        if (marker.contractVersion !== APPROVAL_MARKER_CONTRACT ||
            marker.profileId !== APPROVAL_MARKER_PROFILE_ID ||
            marker.targetRelativePath !== APPROVAL_MARKER_TARGET_RELATIVE_PATH ||
            marker.bindingHash !== execution.bindingHash ||
            marker.consumptionId !== execution.consumptionId ||
            marker.completedAt !== execution.completedAt ||
            !marker.approvalId.trim())
            findings.add('APPROVAL_MARKER_MISMATCH');
    }
    if (preflightAudit.context.metadata?.externalInterceptionProved === true ||
        consumption.externalInterceptionProved !== false ||
        execution.externalInterceptionProved !== false)
        findings.add('EXTERNAL_INTERCEPTION_CLAIM_INVALID');
    const passed = findings.size === 0;
    return {
        contractVersion: RECEIPT_TO_EXECUTION_AUDIT_CONTRACT,
        passed,
        evidenceChainValid: passed,
        actionExecutionProved: passed && completedExecution,
        approvalBackedMutationProved: passed && completedExecution && mutating,
        expectedChangedSet: normalized(expectedChangedSet),
        observedChangedSet,
        findings: [...findings].sort(),
        mandatoryInvocationProved: false,
        externalInterceptionProved: false,
    };
}
//# sourceMappingURL=receipt-to-execution-evidence-auditor.js.map