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

export interface SkillPreflightInput {
    passed?: boolean;
    declaration?: string;
    recordRef?: string;
    skillIds?: string[];
}

export interface SkillPreflightStatus {
    required: boolean;
    declared: boolean;
    source: 'explicit' | 'content' | 'none';
    recordRef?: string;
    skillIds: string[];
}

export interface EnforcementInput {
    mode: CVFMode;
    content: string;
    budgetOk: boolean;
    specFields?: SpecGateField[];
    specValues?: Record<string, string>;
    requiresSkillPreflight?: boolean;
    skillPreflight?: SkillPreflightInput;
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
    skillPreflight?: SkillPreflightStatus;
    /** Present when server-side evaluation was used */
    serverResult?: GovernanceEvaluateResult;
    /** CVF 4-dim quality from server */
    cvfQuality?: CVFQualityResult;
    /** CVF enforcement (phase authority) from server */
    cvfEnforcement?: CVFEnforcementResult;
    /** Whether server-side evaluation was used */
    source: 'client' | 'server';
}

const SKILL_PREFLIGHT_MISSING_REASON = 'Skill Preflight declaration is required before Build/Execute actions.';
const SKILL_PREFLIGHT_PATTERN = /\b(SKILL_PREFLIGHT_RECORD|SKILL PREFLIGHT PASS|PREFLIGHT PASS|SPF-[A-Z0-9_-]+)\b/i;

function isBuildPhase(phase?: string): boolean {
    if (!phase) return false;
    const normalized = phase.trim().toUpperCase();
    return normalized === 'BUILD' || normalized === 'PHASE C' || normalized === 'C';
}

function evaluateSkillPreflight(input: EnforcementInput): SkillPreflightStatus {
    const required = input.requiresSkillPreflight ?? isBuildPhase(input.cvfPhase);
    const recordRef = input.skillPreflight?.recordRef?.trim();
    const explicitSkillIds = input.skillPreflight?.skillIds || [];
    const declaration = input.skillPreflight?.declaration?.trim();

    const explicitDeclared = input.skillPreflight?.passed === true || Boolean(declaration) || Boolean(recordRef);
    const contentDeclared = SKILL_PREFLIGHT_PATTERN.test(input.content);
    const declared = explicitDeclared || contentDeclared;

    return {
        required,
        declared,
        source: explicitDeclared ? 'explicit' : (contentDeclared ? 'content' : 'none'),
        recordRef: recordRef || undefined,
        skillIds: explicitSkillIds,
    };
}

/**
 * Synchronous client-side enforcement — original logic.
 * Always available, no network dependency.
 */
export function evaluateEnforcement(input: EnforcementInput): EnforcementResult {
    const reasons: string[] = [];
    let status: EnforcementStatus = 'ALLOW';
    const skillPreflight = evaluateSkillPreflight(input);

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

    if (skillPreflight.required && !skillPreflight.declared) {
        status = 'BLOCK';
        reasons.push(SKILL_PREFLIGHT_MISSING_REASON);
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

    return { status, reasons, riskGate, specGate, skillPreflight, source: 'client' };
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
    const skillPreflight = evaluateSkillPreflight(input);
    if (skillPreflight.required && !skillPreflight.declared) {
        return {
            status: 'BLOCK',
            reasons: [SKILL_PREFLIGHT_MISSING_REASON],
            skillPreflight,
            source: 'client',
        };
    }

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
                skill_preflight: {
                    required: skillPreflight.required,
                    declared: skillPreflight.declared,
                    source: skillPreflight.source,
                    record_ref: skillPreflight.recordRef,
                    skill_ids: skillPreflight.skillIds,
                },
            },
            cvf_phase: input.cvfPhase,
            cvf_risk_level: input.cvfRiskLevel,
            skill_preflight: {
                required: skillPreflight.required,
                declared: skillPreflight.declared,
                source: skillPreflight.source,
                record_ref: skillPreflight.recordRef,
                skill_ids: skillPreflight.skillIds,
            },
        });

        if (!serverResult || !serverResult.report) {
            // Server unreachable or invalid response — fallback
            return evaluateEnforcement(input);
        }

        const mapped = mapServerStatus(serverResult.report);

        return {
            status: mapped.status,
            reasons: mapped.reasons,
            skillPreflight,
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
