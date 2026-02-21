import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ─── Mock governance-engine ─────────────────────────────────────────

const mockGovernanceEvaluate = vi.fn();
const mockIsEnabled = vi.fn(() => false);

vi.mock('@/lib/governance-engine', () => ({
    governanceEvaluate: (...args: unknown[]) => mockGovernanceEvaluate(...args),
    isGovernanceEngineEnabled: () => mockIsEnabled(),
}));

// ─── Import under test ──────────────────────────────────────────────

import {
    evaluateEnforcement,
    evaluateEnforcementAsync,
    type EnforcementInput,
} from './enforcement';

describe('enforcement — dual-mode', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    // ── Client-side (sync) tests — existing behavior ────────────

    describe('evaluateEnforcement (sync)', () => {
        it('returns source=client', () => {
            const result = evaluateEnforcement({
                mode: 'simple',
                content: 'test',
                budgetOk: true,
            });
            expect(result.source).toBe('client');
            expect(result.status).toBe('ALLOW');
        });

        it('blocks on budget exceeded', () => {
            const result = evaluateEnforcement({
                mode: 'simple',
                content: 'test',
                budgetOk: false,
            });
            expect(result.status).toBe('BLOCK');
            expect(result.source).toBe('client');
        });
    });

    // ── Async dual-mode tests ───────────────────────────────────

    describe('evaluateEnforcementAsync', () => {
        const baseInput: EnforcementInput = {
            mode: 'governance',
            content: 'Test content',
            budgetOk: true,
        };

        it('falls back to client-side when engine disabled', async () => {
            mockIsEnabled.mockReturnValue(false);

            const result = await evaluateEnforcementAsync(baseInput);
            expect(result.source).toBe('client');
            expect(result.status).toBe('ALLOW');
            expect(mockGovernanceEvaluate).not.toHaveBeenCalled();
        });

        it('uses server-side when engine enabled and server responds', async () => {
            mockIsEnabled.mockReturnValue(true);
            mockGovernanceEvaluate.mockResolvedValue({
                report: {
                    status: 'APPROVED',
                    risk_score: 0.1,
                    cvf_risk_level: 'R0',
                    cvf_quality: {
                        correctness: 0.95,
                        safety: 0.9,
                        alignment: 0.88,
                        quality: 0.92,
                        overall: 0.91,
                        grade: 'A',
                    },
                    cvf_enforcement: {
                        action: 'ALLOW',
                        phase_authority: {
                            phase: 'BUILD',
                            can_approve: true,
                            can_override: false,
                            max_risk: 'R3',
                        },
                    },
                },
                execution_record: {
                    request_id: 'test-1',
                    artifact_id: 'web-execution',
                    risk_score: 0.1,
                    status: 'completed',
                },
            });

            const result = await evaluateEnforcementAsync(baseInput);
            expect(result.source).toBe('server');
            expect(result.status).toBe('ALLOW');
            expect(result.cvfQuality?.grade).toBe('A');
            expect(result.cvfEnforcement?.action).toBe('ALLOW');
            expect(result.serverResult).toBeDefined();
        });

        it('maps MANUAL_REVIEW → NEEDS_APPROVAL', async () => {
            mockIsEnabled.mockReturnValue(true);
            mockGovernanceEvaluate.mockResolvedValue({
                report: {
                    status: 'MANUAL_REVIEW',
                    risk_score: 0.7,
                    cvf_enforcement: {
                        action: 'NEEDS_APPROVAL',
                        phase_authority: {
                            phase: 'BUILD',
                            can_approve: true,
                            can_override: false,
                            max_risk: 'R3',
                        },
                    },
                    cvf_quality: {
                        correctness: 0.6,
                        safety: 0.5,
                        alignment: 0.7,
                        quality: 0.6,
                        overall: 0.58,
                        grade: 'D',
                    },
                },
                execution_record: { request_id: 'test-2' },
            });

            const result = await evaluateEnforcementAsync(baseInput);
            expect(result.source).toBe('server');
            expect(result.status).toBe('NEEDS_APPROVAL');
        });

        it('maps REJECTED → BLOCK', async () => {
            mockIsEnabled.mockReturnValue(true);
            mockGovernanceEvaluate.mockResolvedValue({
                report: {
                    status: 'REJECTED',
                    risk_score: 0.9,
                    cvf_enforcement: {
                        action: 'BLOCK',
                        phase_authority: {
                            phase: 'INTAKE',
                            can_approve: false,
                            can_override: false,
                            max_risk: 'R1',
                        },
                    },
                    cvf_quality: {
                        correctness: 0.2,
                        safety: 0.1,
                        alignment: 0.3,
                        quality: 0.2,
                        overall: 0.18,
                        grade: 'F',
                    },
                },
                execution_record: { request_id: 'test-3' },
            });

            const result = await evaluateEnforcementAsync(baseInput);
            expect(result.source).toBe('server');
            expect(result.status).toBe('BLOCK');
        });

        it('maps FROZEN → BLOCK', async () => {
            mockIsEnabled.mockReturnValue(true);
            mockGovernanceEvaluate.mockResolvedValue({
                report: {
                    status: 'FROZEN',
                    risk_score: 1.0,
                    cvf_enforcement: {
                        action: 'BLOCK',
                        phase_authority: {
                            phase: 'FREEZE',
                            can_approve: true,
                            can_override: true,
                            max_risk: 'R4',
                        },
                    },
                    cvf_quality: {
                        correctness: 0, safety: 0, alignment: 0, quality: 0,
                        overall: 0, grade: 'F',
                    },
                },
                execution_record: { request_id: 'test-4' },
            });

            const result = await evaluateEnforcementAsync(baseInput);
            expect(result.source).toBe('server');
            expect(result.status).toBe('BLOCK');
        });

        it('maps ESCALATE action → NEEDS_APPROVAL', async () => {
            mockIsEnabled.mockReturnValue(true);
            mockGovernanceEvaluate.mockResolvedValue({
                report: {
                    status: 'MANUAL_REVIEW',
                    risk_score: 0.8,
                    cvf_enforcement: {
                        action: 'ESCALATE',
                        phase_authority: {
                            phase: 'REVIEW',
                            can_approve: true,
                            can_override: true,
                            max_risk: 'R3',
                        },
                    },
                    cvf_quality: {
                        correctness: 0.5, safety: 0.4, alignment: 0.6, quality: 0.5,
                        overall: 0.48, grade: 'D',
                    },
                },
                execution_record: { request_id: 'test-5' },
            });

            const result = await evaluateEnforcementAsync(baseInput);
            expect(result.source).toBe('server');
            expect(result.status).toBe('NEEDS_APPROVAL');
        });

        it('falls back to client-side when server returns null', async () => {
            mockIsEnabled.mockReturnValue(true);
            mockGovernanceEvaluate.mockResolvedValue(null);

            const result = await evaluateEnforcementAsync(baseInput);
            expect(result.source).toBe('client');
            expect(result.status).toBe('ALLOW');
        });

        it('falls back to client-side on network error', async () => {
            mockIsEnabled.mockReturnValue(true);
            mockGovernanceEvaluate.mockRejectedValue(new Error('Connection refused'));

            const result = await evaluateEnforcementAsync(baseInput);
            expect(result.source).toBe('client');
            expect(result.status).toBe('ALLOW');
        });

        it('passes through requestId and artifactId', async () => {
            mockIsEnabled.mockReturnValue(true);
            mockGovernanceEvaluate.mockResolvedValue({
                report: {
                    status: 'APPROVED',
                    cvf_enforcement: { action: 'ALLOW', phase_authority: {} },
                    cvf_quality: { overall: 0.9, grade: 'A' },
                },
                execution_record: { request_id: 'custom-id' },
            });

            await evaluateEnforcementAsync({
                ...baseInput,
                requestId: 'custom-id',
                artifactId: 'custom-artifact',
                cvfPhase: 'C',
                cvfRiskLevel: 'R2',
            });

            expect(mockGovernanceEvaluate).toHaveBeenCalledWith(
                expect.objectContaining({
                    request_id: 'custom-id',
                    artifact_id: 'custom-artifact',
                    cvf_phase: 'C',
                    cvf_risk_level: 'R2',
                }),
            );
        });
    });
});
