import { createHash } from 'node:crypto';

import type { AIProvider, ExecutionRequest } from '@/lib/ai';

import type { ApprovalRequestSnapshot } from './store';

type ApprovalSnapshotInput = Partial<ExecutionRequest> & {
    phase?: string;
    riskLevel?: string;
};

function sortStringRecord(input?: Record<string, string>): Record<string, string> | undefined {
    if (!input) {
        return undefined;
    }

    const entries = Object.entries(input)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([k, v]) => [k, String(v ?? '').trim()] as [string, string]);
    return Object.fromEntries(entries);
}

export function buildApprovalRequestSnapshot(
    request: ApprovalSnapshotInput,
    provider: AIProvider | string,
): ApprovalRequestSnapshot {
    const cvfPhase = request.cvfPhase ?? request.phase;
    const cvfRiskLevel = request.cvfRiskLevel ?? request.riskLevel;
    return {
        templateId: String(request.templateId || request.templateName || 'unknown'),
        templateName: String(request.templateName || request.templateId || 'unknown'),
        intent: String(request.intent || '').trim(),
        inputs: sortStringRecord(request.inputs),
        provider: String(provider || ''),
        model: request.model ? String(request.model).trim() : undefined,
        cvfPhase: cvfPhase ? String(cvfPhase).trim() : undefined,
        cvfRiskLevel: cvfRiskLevel ? String(cvfRiskLevel).trim() : undefined,
        knowledgeCollectionId: request.knowledgeCollectionId ? String(request.knowledgeCollectionId) : null,
    };
}

export function computeApprovalRequestHash(snapshot: ApprovalRequestSnapshot): string {
    return createHash('sha256')
        .update(JSON.stringify(snapshot))
        .digest('hex');
}
