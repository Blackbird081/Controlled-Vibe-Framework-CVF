import { describe, expect, it } from 'vitest';
import { buildUnifiedGovernanceState } from './governance-state-contract';

describe('governance-state-contract', () => {
    it('builds a normalized client snapshot from local governance input', () => {
        const snapshot = buildUnifiedGovernanceState({
            governanceState: {
                phase: 'BUILD',
                role: 'BUILDER',
                riskLevel: 'R3',
                toolkitEnabled: true,
            },
            enforcementStatus: 'ALLOW',
            reasons: [],
            source: 'client',
            requestId: 'req-local-1',
            artifactId: 'artifact-local-1',
            skillPreflight: {
                required: true,
                declared: true,
                source: 'explicit',
                recordRef: 'records/SPF-001.md',
                skillIds: ['SPF-001'],
            },
        });

        expect(snapshot.phase).toBe('BUILD');
        expect(snapshot.role).toBe('BUILDER');
        expect(snapshot.riskLevel).toBe('R3');
        expect(snapshot.authority.can_approve).toBe(true);
        expect(snapshot.authority.can_override).toBe(false);
        expect(snapshot.approval.status).toBe('NOT_REQUIRED');
        expect(snapshot.skillPreflight.declared).toBe(true);
        expect(snapshot.registry.source).toBe('unbound');
        expect(snapshot.uat.status).toBe('UNBOUND');
    });

    it('maps MANUAL_REVIEW server result to pending approval', () => {
        const snapshot = buildUnifiedGovernanceState({
            cvfPhase: 'C',
            cvfRiskLevel: 'R3',
            enforcementStatus: 'NEEDS_APPROVAL',
            reasons: ['Server decision: MANUAL_REVIEW'],
            source: 'server',
            serverResult: {
                report: {
                    status: 'MANUAL_REVIEW',
                    risk_score: 0.8,
                    risk_level: 'high',
                    decision: {},
                    compliance_result: null,
                    brand_result: null,
                    cvf_risk_level: 'R3',
                    cvf_risk_tier: 'HIGH',
                    cvf_quality: {
                        correctness: 0.7,
                        safety: 0.6,
                        alignment: 0.8,
                        quality: 0.7,
                        overall: 0.68,
                        grade: 'C',
                    },
                    cvf_enforcement: {
                        action: 'NEEDS_APPROVAL',
                        phase_authority: {
                            phase: 'BUILD',
                            can_approve: true,
                            can_override: false,
                            max_risk: 'R3',
                        },
                    },
                    ledger_hash: 'hash-1',
                },
                execution_record: {
                    request_id: 'req-server-1',
                    artifact_id: 'artifact-server-1',
                    risk_score: 0.8,
                    status: 'manual_review',
                    timestamp: '2026-03-07T01:00:00Z',
                },
            },
        });

        expect(snapshot.phase).toBe('BUILD');
        expect(snapshot.riskLevel).toBe('R3');
        expect(snapshot.approval.required).toBe(true);
        expect(snapshot.approval.status).toBe('PENDING');
        expect(snapshot.serverStatus).toBe('MANUAL_REVIEW');
        expect(snapshot.requestId).toBe('req-server-1');
    });

    it('maps rejected server result to rejected approval state', () => {
        const snapshot = buildUnifiedGovernanceState({
            enforcementStatus: 'BLOCK',
            reasons: ['Server decision: REJECTED'],
            source: 'server',
            serverResult: {
                report: {
                    status: 'REJECTED',
                    risk_score: 0.95,
                    risk_level: 'critical',
                    decision: {},
                    compliance_result: null,
                    brand_result: null,
                    cvf_risk_level: 'R4',
                    cvf_risk_tier: 'CRITICAL',
                    cvf_quality: {
                        correctness: 0.1,
                        safety: 0.1,
                        alignment: 0.2,
                        quality: 0.1,
                        overall: 0.12,
                        grade: 'F',
                    },
                    cvf_enforcement: {
                        action: 'BLOCK',
                        phase_authority: {
                            phase: 'FREEZE',
                            can_approve: true,
                            can_override: true,
                            max_risk: 'R4',
                        },
                    },
                    ledger_hash: 'hash-2',
                },
                execution_record: {
                    request_id: 'req-server-2',
                    artifact_id: 'artifact-server-2',
                    risk_score: 0.95,
                    status: 'rejected',
                    timestamp: '2026-03-07T01:05:00Z',
                },
            },
        });

        expect(snapshot.phase).toBe('FREEZE');
        expect(snapshot.riskLevel).toBe('R4');
        expect(snapshot.approval.status).toBe('REJECTED');
    });

    it('binds registry metadata and derives validated UAT from recent self-UAT date', () => {
        const lastSelfUatDate = new Date(Date.now() - (30 * 24 * 60 * 60 * 1000)).toISOString();

        const snapshot = buildUnifiedGovernanceState({
            enforcementStatus: 'ALLOW',
            reasons: [],
            source: 'client',
            registryBinding: {
                agentId: 'AI_ASSISTANT_V1',
                certificationStatus: 'ACTIVE',
                approvedPhases: ['DESIGN', 'BUILD', 'REVIEW'],
                approvedSkills: ['code_generation', 'code_review'],
                lastSelfUatDate,
            },
        });

        expect(snapshot.registry.source).toBe('registry');
        expect(snapshot.registry.agentId).toBe('AI_ASSISTANT_V1');
        expect(snapshot.registry.approvedPhases).toContain('BUILD');
        expect(snapshot.uat.status).toBe('VALIDATED');
        expect(snapshot.uat.lastRunAt).toBe(lastSelfUatDate);
    });

    it('derives NEEDS_UAT from stale registry self-UAT date when no explicit UAT binding exists', () => {
        const staleDate = new Date(Date.now() - (120 * 24 * 60 * 60 * 1000)).toISOString();

        const snapshot = buildUnifiedGovernanceState({
            enforcementStatus: 'ALLOW',
            reasons: [],
            source: 'client',
            registryBinding: {
                agentId: 'AI_ASSISTANT_V1',
                certificationStatus: 'ACTIVE',
                lastSelfUatDate: staleDate,
            },
        });

        expect(snapshot.registry.source).toBe('registry');
        expect(snapshot.uat.status).toBe('NEEDS_UAT');
    });

    it('prefers explicit UAT binding over registry-derived UAT state', () => {
        const snapshot = buildUnifiedGovernanceState({
            enforcementStatus: 'ALLOW',
            reasons: [],
            source: 'client',
            registryBinding: {
                agentId: 'AI_ASSISTANT_V1',
                certificationStatus: 'ACTIVE',
                lastSelfUatDate: '2026-02-01',
            },
            uatBinding: {
                badge: 'FAILED',
                lastRunAt: '2026-03-01',
            },
        });

        expect(snapshot.registry.source).toBe('registry');
        expect(snapshot.uat.status).toBe('FAILED');
        expect(snapshot.uat.lastRunAt).toBe('2026-03-01');
    });
});
