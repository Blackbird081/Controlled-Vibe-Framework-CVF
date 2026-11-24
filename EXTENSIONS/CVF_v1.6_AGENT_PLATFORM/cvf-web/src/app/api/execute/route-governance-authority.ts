import { NextResponse } from 'next/server';
import { createHash } from 'node:crypto';
import { approvalRecordMatchesActor, type ApprovalActorBinding } from '../approvals/approval-binding';
import { getApprovalStore, type ApprovalRequestRecord } from '../approvals/store';
import type { ExecutionRequest } from '@/lib/ai/types';
import { highestRisk, inferRiskLevelFromText, normalizeRiskLevel, parseRiskLevel, type RiskLevel } from '@/lib/risk-check';
import { normalizeWebPhaseInput } from '@/lib/governance-model';
import { getTemplateById } from '@/lib/templates';
import { OUTCOME_WORKFLOW_REGISTRY } from '@/lib/workflow-composition/outcome-workflow-registry';
import certifiedRegistry from '../../../../../../../governance/registries/cvf-certified-skill-pack-registry.json';
import app_requirements_spec from '../../../../../../CVF_v1.5.2_SKILL_LIBRARY_FOR_END_USERS/_certified/app_requirements_spec/risk.profile.json';
import competitor_review from '../../../../../../CVF_v1.5.2_SKILL_LIBRARY_FOR_END_USERS/_certified/competitor_review/risk.profile.json';
import contract_review from '../../../../../../CVF_v1.5.2_SKILL_LIBRARY_FOR_END_USERS/_certified/contract_review/risk.profile.json';
import data_analysis from '../../../../../../CVF_v1.5.2_SKILL_LIBRARY_FOR_END_USERS/_certified/data_analysis/risk.profile.json';
import landing_page_builder from '../../../../../../CVF_v1.5.2_SKILL_LIBRARY_FOR_END_USERS/_certified/landing_page_builder/risk.profile.json';
import meeting_summarizer from '../../../../../../CVF_v1.5.2_SKILL_LIBRARY_FOR_END_USERS/_certified/meeting_summarizer/risk.profile.json';
import product_brief from '../../../../../../CVF_v1.5.2_SKILL_LIBRARY_FOR_END_USERS/_certified/product_brief/risk.profile.json';
import proposal_writer from '../../../../../../CVF_v1.5.2_SKILL_LIBRARY_FOR_END_USERS/_certified/proposal_writer/risk.profile.json';
import sop_generator from '../../../../../../CVF_v1.5.2_SKILL_LIBRARY_FOR_END_USERS/_certified/sop_generator/risk.profile.json';
import strategy_analysis from '../../../../../../CVF_v1.5.2_SKILL_LIBRARY_FOR_END_USERS/_certified/strategy_analysis/risk.profile.json';

const certifiedProfiles = new Map(Object.entries({
    app_requirements_spec,
    competitor_review,
    contract_review,
    data_analysis,
    landing_page_builder,
    meeting_summarizer,
    product_brief,
    proposal_writer,
    sop_generator,
    strategy_analysis,
}));
const activePacks = new Set(certifiedRegistry.entries.filter(entry => entry.status === 'certified').map(entry => entry.id));

function certifiedFloor(templateId?: string): RiskLevel | null {
    if (!templateId || !getTemplateById(templateId)) return null;
    let floor: RiskLevel | null = null;
    const outcome = OUTCOME_WORKFLOW_REGISTRY.find(entry => entry.templateId === templateId);
    const applicablePackIds = new Set([templateId, ...(outcome?.composition.packIds ?? [])]);
    for (const packId of applicablePackIds) {
        if (!activePacks.has(packId)) continue;
        const profile = certifiedProfiles.get(packId);
        floor = highestRisk(floor, normalizeRiskLevel(profile?.riskLevel));
    }
    return floor;
}

export function resolveExecuteGovernanceAuthority(request: Partial<ExecutionRequest>) {
    const fields = Object.entries(request.inputs ?? {}).flatMap(([key, value]) => [
        key.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/[_-]+/g, ' '),
        value,
    ]);
    const riskText = [request.templateName ?? '', request.intent ?? '', ...fields].join('\n');
    const assessedRisk = inferRiskLevelFromText(riskText, { floor: certifiedFloor(request.templateId), fallback: 'R3' }) ?? 'R3';
    const declaredRisk = request.cvfRiskLevel === undefined ? null : normalizeRiskLevel(request.cvfRiskLevel);

    // The canonical text route has no admitted transition record. A separate BUILD pilot
    // owns its server-issued transition and is refused by this route's canonical POST.
    return {
        phase: 'INTAKE' as const,
        riskLevel: highestRisk(assessedRisk, declaredRisk) ?? assessedRisk,
        riskText,
    };
}

export function hasExpiredExecuteApproval(approval: ApprovalRequestRecord): boolean {
    return !(Date.parse(approval.expiresAt) > Date.now());
}

export function loadExecuteApproval(
    approvalId: string | undefined,
    approvalActor: ApprovalActorBinding | null,
    requestHash: string,
    authority: ReturnType<typeof resolveExecuteGovernanceAuthority>,
): ApprovalRequestRecord | Response | null {
    if (!approvalId) return null;
    const store = getApprovalStore();
    const record = store.get(approvalId);
    const reject = (error: string, status: number) => NextResponse.json(
        { success: false, error, approvalId },
        { status },
    );

    if (!record) return reject('Approval request not found.', 404);
    if (!record.requestHash) return reject('Approval request predates request binding and must be re-issued.', 409);
    if (!record.requestSnapshot?.actorId || !record.submittedByActorId || !record.submittedByAuthMode) {
        return reject('Approval request predates actor binding and must be re-issued.', 409);
    }
    if (!approvalRecordMatchesActor(record, approvalActor)) {
        return reject('Approval request was issued for a different actor and cannot be reused.', 403);
    }
    if (record.requestHash !== requestHash) {
        return reject('Approval request does not match the current execution payload.', 409);
    }
    if (hasExpiredExecuteApproval(record)) {
        store.set(record.id, { ...record, status: 'expired' });
        return reject('Approval request has expired and must be re-submitted.', 409);
    }
    if (record.status !== 'approved') {
        return NextResponse.json({
            success: false,
            error: `Approval request is ${record.status} and cannot authorize execution.`,
            approvalId,
            approvalStatus: record.status,
        }, { status: 409 });
    }
    // The standalone inbox historically stores the displayed scope at the top level.
    // These values identify what was approved; only server authority sets the current scope.
    const approvedPhase = normalizeWebPhaseInput(record.requestContext?.cvfPhase ?? record.phase);
    const approvedRisk = parseRiskLevel(record.requestContext?.cvfRiskLevel ?? record.riskLevel);
    if (approvedPhase !== authority.phase || approvedRisk !== authority.riskLevel) {
        return reject('The effective phase or risk changed. Submit the request for a new approval.', 409);
    }
    return record;
}

export function buildExecuteTraceHash(input: {
    envelopeId: string;
    requestHash: string;
    phase: string;
    riskLevel: RiskLevel;
    role: string;
    mode: string;
    action: string;
}): string {
    return createHash('sha256').update(JSON.stringify({
        version: 'cvf.web.execute.trace.v1',
        ...input,
    })).digest('hex');
}
