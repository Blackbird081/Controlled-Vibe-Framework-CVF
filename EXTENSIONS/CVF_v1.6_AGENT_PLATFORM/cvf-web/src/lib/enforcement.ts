import { CVFMode } from '@/lib/agent-chat';
import { evaluateRiskGate, inferRiskLevelFromText, RiskGateResult } from '@/lib/risk-check';
import { evaluateSpecGate, SpecGateField, SpecGateResult } from '@/lib/spec-gate';
import {
    governanceEvaluate,
    isGovernanceEngineEnabled,
} from '@/lib/governance-engine';
import type {
    GovernanceEvaluateResult,
    CVFQualityResult,
    CVFEnforcementResult,
} from '@/types/governance-engine';

export type EnforcementStatus = 'ALLOW' | 'CLARIFY' | 'BLOCK' | 'NEEDS_APPROVAL';

export interface EnforcementInput {
    mode: CVFMode;
    content: string;
    budgetOk: boolean;
    specFields?: SpecGateField[];
    specValues?: Record<string, string>;
    /** Optional: pass through for server-side evaluation */
    requestId?: string;
    artifactId?: string;
    cvfPhase?: string;
    cvfRiskLevel?: string;
}

export interface EnforcementResult {
    status: EnforcementStatus;
    reasons: string[];
    riskGate?: RiskGateResult;
    specGate?: SpecGateResult;
    /** Present when server-side evaluation was used */
    serverResult?: GovernanceEvaluateResult;
    /** CVF 4-dim quality from server */
    cvfQuality?: CVFQualityResult;
    /** CVF enforcement (phase authority) from server */
    cvfEnforcement?: CVFEnforcementResult;
    /** Whether server-side evaluation was used */
    source: 'client' | 'server';
}

/**
 * Synchronous client-side enforcement — original logic.
 * Always available, no network dependency.
 */
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

    return { status, reasons, riskGate, specGate, source: 'client' };
}

// ─── Server status → EnforcementStatus mapping ──────────────────────

function mapServerStatus(
    report: GovernanceEvaluateResult['report'],
): { status: EnforcementStatus; reasons: string[] } {
    const serverStatus = report.status;
    const action = report.cvf_enforcement?.action;

    if (serverStatus === 'FROZEN' || action === 'BLOCK') {
        return {
            status: 'BLOCK',
            reasons: [`Server decision: ${serverStatus}${action ? ` (action: ${action})` : ''}`],
        };
    }
    if (serverStatus === 'REJECTED') {
        return {
            status: 'BLOCK',
            reasons: [`Server decision: REJECTED`],
        };
    }
    if (serverStatus === 'MANUAL_REVIEW' || action === 'NEEDS_APPROVAL' || action === 'ESCALATE') {
        return {
            status: 'NEEDS_APPROVAL',
            reasons: [`Server decision: ${serverStatus} (action: ${action})`],
        };
    }
    return {
        status: 'ALLOW',
        reasons: [],
    };
}

/**
 * Async dual-mode enforcement.
 *
 * 1. If governance engine is enabled AND reachable → server-side evaluation
 * 2. Otherwise → fallback to client-side evaluation
 *
 * Always returns an EnforcementResult with `source` indicating which path was used.
 */
export async function evaluateEnforcementAsync(
    input: EnforcementInput,
): Promise<EnforcementResult> {
    // If governance engine is not enabled, use client-side directly
    if (!isGovernanceEngineEnabled()) {
        return evaluateEnforcement(input);
    }

    try {
        const requestId = input.requestId || `req-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const artifactId = input.artifactId || 'web-execution';

        const serverResult = await governanceEvaluate({
            request_id: requestId,
            artifact_id: artifactId,
            payload: {
                content: input.content,
                mode: input.mode,
                spec_values: input.specValues || {},
            },
            cvf_phase: input.cvfPhase,
            cvf_risk_level: input.cvfRiskLevel,
        });

        if (!serverResult || !serverResult.report) {
            // Server unreachable or invalid response — fallback
            return evaluateEnforcement(input);
        }

        const mapped = mapServerStatus(serverResult.report);

        return {
            status: mapped.status,
            reasons: mapped.reasons,
            serverResult,
            cvfQuality: serverResult.report.cvf_quality,
            cvfEnforcement: serverResult.report.cvf_enforcement,
            source: 'server',
        };
    } catch {
        // Network error, timeout, etc. — fallback to client-side
        return evaluateEnforcement(input);
    }
}
