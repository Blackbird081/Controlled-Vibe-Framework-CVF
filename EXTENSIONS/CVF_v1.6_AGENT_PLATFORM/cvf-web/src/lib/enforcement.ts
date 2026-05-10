import { CVFMode } from '@/lib/agent-chat';
import { evaluateRiskGate, inferRiskLevelFromText, RiskGateResult } from '@/lib/risk-check';
import { evaluateSpecGate, SpecGateField, SpecGateResult } from '@/lib/spec-gate';
import {
    governanceEvaluate,
    governanceEvaluateWithBindings,
    isGovernanceEngineEnabled,
} from '@/lib/governance-engine';
import { buildUnifiedGovernanceState, type UnifiedGovernanceState } from '@/lib/governance-state-contract';
import type { GovernanceState } from '@/lib/governance-context';
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
    governanceState?: Partial<GovernanceState>;
    agentId?: string;
    registryBinding?: {
        agentId?: string;
        certificationStatus?: string;
        approvedPhases?: string[];
        approvedSkills?: string[];
        lastSelfUatDate?: string;
    };
    uatBinding?: {
        badge?: 'NOT_RUN' | 'NEEDS_UAT' | 'VALIDATED' | 'FAILED';
        status?: 'PASS' | 'FAIL' | 'NOT_TESTED';
        lastRunAt?: string;
    };
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
    /** Unified local/server governance snapshot */
    governanceStateSnapshot: UnifiedGovernanceState;
    /** Whether server-side evaluation was used */
    source: 'client' | 'server';
    /** Present when the governance engine was enabled but evaluation degraded to local fallback */
    degraded?: {
        reason: 'invalid_server_response' | 'engine_error';
        message: string;
    };
}

const SKILL_PREFLIGHT_MISSING_REASON = 'Skill Preflight declaration is required before Build/Execute actions.';
const SKILL_PREFLIGHT_PATTERN = /\b(SKILL_PREFLIGHT_RECORD|SKILL PREFLIGHT PASS|PREFLIGHT PASS|SPF-[A-Z0-9_-]+)\b/i;
const R2_APPROVAL_CONTENT_PATTERNS = [
    /\b(customer|account)\s+(records?|identifiers?|details?)\b/i,
    /\bsensitive\s+(indicators?|identifiers?|account)\b/i,
    /\bcredential\s+leak\b/i,
    /\bexternal\s+(tool|scraping|crawler)\b/i,
    /\boutside\s+(the\s+)?declared\s+scope\b/i,
    /\bdata\s+access\b.*\b(not|was not|wasn't)\s+approved\b/i,
];

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

function requiresSensitiveR2Approval(content: string, riskLevel?: string | null): boolean {
    if (riskLevel !== 'R2') return false;
    return R2_APPROVAL_CONTENT_PATTERNS.some(pattern => pattern.test(content));
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
    const effectiveRisk = input.cvfRiskLevel ?? inferredRisk;
    const riskGate = evaluateRiskGate(effectiveRisk, input.mode, input.cvfPhase);
    if (riskGate.status === 'BLOCK') {
        status = 'BLOCK';
        reasons.push(riskGate.reason);
    }
    if (riskGate.status === 'NEEDS_APPROVAL' && status !== 'BLOCK') {
        status = 'NEEDS_APPROVAL';
        reasons.push(riskGate.reason);
    }
    if (
        riskGate.status === 'ALLOW'
        && status !== 'BLOCK'
        && requiresSensitiveR2Approval(input.content, riskGate.riskLevel)
    ) {
        status = 'NEEDS_APPROVAL';
        reasons.push('R2 sensitive or access-boundary request requires explicit human approval.');
    }

    return {
        status,
        reasons,
        riskGate,
        specGate,
        skillPreflight,
        governanceStateSnapshot: buildUnifiedGovernanceState({
            governanceState: input.governanceState,
            cvfPhase: input.cvfPhase,
            cvfRiskLevel: effectiveRisk ?? undefined,
            enforcementStatus: status,
            reasons,
            source: 'client',
            requestId: input.requestId,
            artifactId: input.artifactId,
            skillPreflight,
            registryBinding: input.registryBinding,
            uatBinding: input.uatBinding,
        }),
        source: 'client',
    };
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
            governanceStateSnapshot: buildUnifiedGovernanceState({
                governanceState: input.governanceState,
                cvfPhase: input.cvfPhase,
                cvfRiskLevel: input.cvfRiskLevel,
                enforcementStatus: 'BLOCK',
                reasons: [SKILL_PREFLIGHT_MISSING_REASON],
                source: 'client',
                requestId: input.requestId,
                artifactId: input.artifactId,
                skillPreflight,
                registryBinding: input.registryBinding,
                uatBinding: input.uatBinding,
            }),
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
        const requestPayload = {
            request_id: requestId,
            artifact_id: artifactId,
            agent_id: input.agentId ?? input.registryBinding?.agentId,
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
        };

        const routeResult = await governanceEvaluateWithBindings(requestPayload);
        const serverResult = routeResult?.result ?? await governanceEvaluate(requestPayload);

        if (!serverResult || !serverResult.report) {
            const fallback = evaluateEnforcement(input);
            return {
                ...fallback,
                reasons: [...fallback.reasons, 'Governance engine returned no usable report; fell back to local enforcement.'],
                degraded: {
                    reason: 'invalid_server_response',
                    message: 'Governance engine returned no usable report; local enforcement fallback was used.',
                },
            };
        }

        const mapped = mapServerStatus(serverResult.report);

        return {
            status: mapped.status,
            reasons: mapped.reasons,
            skillPreflight,
            serverResult,
            cvfQuality: serverResult.report.cvf_quality,
            cvfEnforcement: serverResult.report.cvf_enforcement,
            governanceStateSnapshot: buildUnifiedGovernanceState({
                governanceState: input.governanceState,
                cvfPhase: input.cvfPhase,
                cvfRiskLevel: input.cvfRiskLevel,
                enforcementStatus: mapped.status,
                reasons: mapped.reasons,
                source: 'server',
                requestId,
                artifactId,
                skillPreflight,
                registryBinding: routeResult?.governanceBindings?.registryBinding ?? input.registryBinding,
                uatBinding: routeResult?.governanceBindings?.uatBinding ?? input.uatBinding,
                serverResult,
            }),
            source: 'server',
        };
    } catch {
        const fallback = evaluateEnforcement(input);
        return {
            ...fallback,
            reasons: [...fallback.reasons, 'Governance engine request failed; fell back to local enforcement.'],
            degraded: {
                reason: 'engine_error',
                message: 'Governance engine request failed; local enforcement fallback was used.',
            },
        };
    }
}
