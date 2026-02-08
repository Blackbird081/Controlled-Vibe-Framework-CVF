import { CVFMode } from '@/lib/agent-chat';
import { evaluateRiskGate, inferRiskLevelFromText, RiskGateResult } from '@/lib/risk-check';
import { evaluateSpecGate, SpecGateField, SpecGateResult } from '@/lib/spec-gate';

export type EnforcementStatus = 'ALLOW' | 'CLARIFY' | 'BLOCK' | 'NEEDS_APPROVAL';

export interface EnforcementInput {
    mode: CVFMode;
    content: string;
    budgetOk: boolean;
    specFields?: SpecGateField[];
    specValues?: Record<string, string>;
}

export interface EnforcementResult {
    status: EnforcementStatus;
    reasons: string[];
    riskGate?: RiskGateResult;
    specGate?: SpecGateResult;
}

export function evaluateEnforcement(input: EnforcementInput): EnforcementResult {
    const reasons: string[] = [];
    let status: EnforcementStatus = 'ALLOW';

    if (!input.budgetOk) {
        status = 'BLOCK';
        reasons.push('Budget exceeded');
    }

    let specGate: SpecGateResult | undefined;
    if (input.specFields && input.specFields.length > 0) {
        specGate = evaluateSpecGate(input.specFields, input.specValues || {});
        if (specGate.status === 'FAIL') {
            status = 'BLOCK';
            reasons.push('Spec completeness failed');
        } else if (specGate.status === 'CLARIFY' && status !== 'BLOCK') {
            status = 'CLARIFY';
            reasons.push('Spec needs clarification');
        }
    }

    const inferredRisk = inferRiskLevelFromText(input.content);
    const riskGate = evaluateRiskGate(inferredRisk, input.mode);
    if (riskGate.status === 'BLOCK') {
        status = 'BLOCK';
        reasons.push(riskGate.reason);
    }
    if (riskGate.status === 'NEEDS_APPROVAL' && status !== 'BLOCK') {
        status = 'NEEDS_APPROVAL';
        reasons.push(riskGate.reason);
    }

    return { status, reasons, riskGate, specGate };
}
