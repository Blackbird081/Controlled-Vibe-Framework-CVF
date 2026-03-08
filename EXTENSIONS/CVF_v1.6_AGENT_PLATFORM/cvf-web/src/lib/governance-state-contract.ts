'use client';

import {
    DEFAULT_GOVERNANCE_STATE,
    PHASE_AUTHORITY_MATRIX,
    type CVFPhaseToolkit,
    type CVFRiskLevel,
    type GovernanceState,
    type PhaseAuthority,
} from './governance-context';
import type { GovernanceEvaluateResult } from '@/types/governance-engine';

export type GovernanceSnapshotSource = 'client' | 'server';
export type ApprovalSnapshotStatus = 'NOT_REQUIRED' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'BLOCKED';
export type UatSnapshotStatus = 'UNBOUND' | 'NOT_RUN' | 'NEEDS_UAT' | 'VALIDATED' | 'FAILED';

export interface GovernanceSkillPreflightState {
    required: boolean;
    declared: boolean;
    source: 'explicit' | 'content' | 'none';
    recordRef?: string;
    skillIds: string[];
}

export interface GovernanceApprovalState {
    required: boolean;
    status: ApprovalSnapshotStatus;
    source: GovernanceSnapshotSource;
    reason?: string;
}

export interface GovernanceRegistryBindingState {
    agentId?: string;
    certificationStatus?: string;
    approvedPhases?: string[];
    approvedSkills?: string[];
    lastSelfUatDate?: string;
    source: 'registry' | 'unbound';
}

export interface GovernanceUatBindingState {
    status: UatSnapshotStatus;
    source: 'local' | 'unbound';
    lastRunAt?: string;
}

export interface GovernanceRegistryBindingInput {
    agentId?: string;
    certificationStatus?: string;
    approvedPhases?: string[];
    approvedSkills?: string[];
    lastSelfUatDate?: string;
}

export interface GovernanceUatBindingInput {
    badge?: 'NOT_RUN' | 'NEEDS_UAT' | 'VALIDATED' | 'FAILED';
    status?: 'PASS' | 'FAIL' | 'NOT_TESTED';
    lastRunAt?: string;
}

export interface UnifiedGovernanceState {
    phase: CVFPhaseToolkit;
    role: GovernanceState['role'];
    riskLevel: CVFRiskLevel;
    toolkitEnabled: boolean;
    authority: PhaseAuthority;
    approval: GovernanceApprovalState;
    skillPreflight: GovernanceSkillPreflightState;
    registry: GovernanceRegistryBindingState;
    uat: GovernanceUatBindingState;
    source: GovernanceSnapshotSource;
    requestId?: string;
    artifactId?: string;
    serverStatus?: GovernanceEvaluateResult['report']['status'];
}

export interface BuildUnifiedGovernanceStateInput {
    governanceState?: Partial<GovernanceState>;
    cvfPhase?: string;
    cvfRiskLevel?: string;
    enforcementStatus: 'ALLOW' | 'CLARIFY' | 'BLOCK' | 'NEEDS_APPROVAL';
    reasons: string[];
    source: GovernanceSnapshotSource;
    requestId?: string;
    artifactId?: string;
    skillPreflight?: GovernanceSkillPreflightState;
    registryBinding?: GovernanceRegistryBindingInput;
    uatBinding?: GovernanceUatBindingInput;
    serverResult?: GovernanceEvaluateResult;
}

function normalizePhase(value?: string): CVFPhaseToolkit {
    const normalized = value?.trim().toUpperCase();
    switch (normalized) {
        case 'A':
        case 'PHASE A':
        case 'INTAKE':
            return 'INTAKE';
        case 'B':
        case 'PHASE B':
        case 'DESIGN':
            return 'DESIGN';
        case 'C':
        case 'PHASE C':
        case 'BUILD':
            return 'BUILD';
        case 'D':
        case 'PHASE D':
        case 'REVIEW':
            return 'REVIEW';
        case 'E':
        case 'PHASE E':
        case 'FREEZE':
            return 'FREEZE';
        default:
            return DEFAULT_GOVERNANCE_STATE.phase;
    }
}

function normalizeRiskLevel(value?: string): CVFRiskLevel {
    const normalized = value?.trim().toUpperCase();
    switch (normalized) {
        case 'R0':
        case 'R1':
        case 'R2':
        case 'R3':
        case 'R4':
            return normalized;
        default:
            return DEFAULT_GOVERNANCE_STATE.riskLevel;
    }
}

function deriveApprovalState(input: {
    enforcementStatus: BuildUnifiedGovernanceStateInput['enforcementStatus'];
    reasons: string[];
    source: GovernanceSnapshotSource;
    serverResult?: GovernanceEvaluateResult;
}): GovernanceApprovalState {
    const report = input.serverResult?.report;
    const action = report?.cvf_enforcement?.action;
    const reason = input.reasons[0];

    if (report?.status === 'APPROVED') {
        return {
            required: false,
            status: 'APPROVED',
            source: input.source,
            reason,
        };
    }

    if (report?.status === 'REJECTED') {
        return {
            required: true,
            status: 'REJECTED',
            source: input.source,
            reason,
        };
    }

    if (report?.status === 'FROZEN' || action === 'BLOCK' || input.enforcementStatus === 'BLOCK') {
        return {
            required: false,
            status: 'BLOCKED',
            source: input.source,
            reason,
        };
    }

    if (report?.status === 'MANUAL_REVIEW' || action === 'NEEDS_APPROVAL' || action === 'ESCALATE' || input.enforcementStatus === 'NEEDS_APPROVAL') {
        return {
            required: true,
            status: 'PENDING',
            source: input.source,
            reason,
        };
    }

    return {
        required: false,
        status: 'NOT_REQUIRED',
        source: input.source,
        reason,
    };
}

function hasRegistryBinding(binding?: GovernanceRegistryBindingInput): boolean {
    return Boolean(
        binding?.agentId
        || binding?.certificationStatus
        || (binding?.approvedPhases && binding.approvedPhases.length > 0)
        || (binding?.approvedSkills && binding.approvedSkills.length > 0)
        || binding?.lastSelfUatDate
    );
}

function normalizeRegistryBinding(binding?: GovernanceRegistryBindingInput): GovernanceRegistryBindingState {
    if (!hasRegistryBinding(binding)) {
        return { source: 'unbound' };
    }

    return {
        agentId: binding?.agentId,
        certificationStatus: binding?.certificationStatus,
        approvedPhases: binding?.approvedPhases,
        approvedSkills: binding?.approvedSkills,
        lastSelfUatDate: binding?.lastSelfUatDate,
        source: 'registry',
    };
}

function deriveRegistryUatStatus(binding?: GovernanceRegistryBindingInput): GovernanceUatBindingState {
    if (!hasRegistryBinding(binding)) {
        return {
            status: 'UNBOUND',
            source: 'unbound',
        };
    }

    if (!binding?.lastSelfUatDate) {
        return {
            status: 'NOT_RUN',
            source: 'local',
        };
    }

    const runDate = new Date(binding.lastSelfUatDate);
    if (Number.isNaN(runDate.getTime())) {
        return {
            status: 'NOT_RUN',
            source: 'local',
        };
    }

    const ageDays = (Date.now() - runDate.getTime()) / (1000 * 60 * 60 * 24);
    const cert = binding.certificationStatus?.trim().toUpperCase();
    const isValidated = cert === 'ACTIVE' || cert === 'VALIDATED';

    return {
        status: ageDays > 90 ? 'NEEDS_UAT' : (isValidated ? 'VALIDATED' : 'NOT_RUN'),
        source: 'local',
        lastRunAt: binding.lastSelfUatDate,
    };
}

function normalizeUatBinding(
    binding: GovernanceUatBindingInput | undefined,
    registryBinding: GovernanceRegistryBindingInput | undefined
): GovernanceUatBindingState {
    if (binding?.badge) {
        return {
            status: binding.badge,
            source: 'local',
            lastRunAt: binding.lastRunAt,
        };
    }

    if (binding?.status) {
        return {
            status: binding.status === 'PASS'
                ? 'VALIDATED'
                : binding.status === 'FAIL'
                    ? 'FAILED'
                    : 'NOT_RUN',
            source: 'local',
            lastRunAt: binding.lastRunAt,
        };
    }

    return deriveRegistryUatStatus(registryBinding);
}

export function buildUnifiedGovernanceState(
    input: BuildUnifiedGovernanceStateInput
): UnifiedGovernanceState {
    const phase = normalizePhase(
        input.serverResult?.report?.cvf_enforcement?.phase_authority?.phase
        ?? input.governanceState?.phase
        ?? input.cvfPhase
    );
    const riskLevel = normalizeRiskLevel(
        input.serverResult?.report?.cvf_risk_level
        ?? input.governanceState?.riskLevel
        ?? input.cvfRiskLevel
    );

    return {
        phase,
        role: input.governanceState?.role ?? DEFAULT_GOVERNANCE_STATE.role,
        riskLevel,
        toolkitEnabled: input.governanceState?.toolkitEnabled ?? DEFAULT_GOVERNANCE_STATE.toolkitEnabled,
        authority: PHASE_AUTHORITY_MATRIX[phase],
        approval: deriveApprovalState({
            enforcementStatus: input.enforcementStatus,
            reasons: input.reasons,
            source: input.source,
            serverResult: input.serverResult,
        }),
        skillPreflight: input.skillPreflight ?? {
            required: false,
            declared: false,
            source: 'none',
            skillIds: [],
        },
        registry: normalizeRegistryBinding(input.registryBinding),
        uat: normalizeUatBinding(input.uatBinding, input.registryBinding),
        source: input.source,
        requestId: input.requestId ?? input.serverResult?.execution_record?.request_id,
        artifactId: input.artifactId ?? input.serverResult?.execution_record?.artifact_id,
        serverStatus: input.serverResult?.report?.status,
    };
}
