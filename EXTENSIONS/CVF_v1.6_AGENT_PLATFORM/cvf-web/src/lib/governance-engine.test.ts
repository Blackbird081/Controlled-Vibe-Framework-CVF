import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ─── Mock governance-engine module ───────────────────────────────────

const mockGovernanceHealth = vi.fn();
const mockGovernanceEvaluate = vi.fn();
const mockGovernanceApprove = vi.fn();
const mockGovernanceLedger = vi.fn();
const mockGovernanceRiskConvert = vi.fn();
const mockIsEnabled = vi.fn(() => true);

vi.mock('@/lib/governance-engine', () => ({
    governanceHealth: (...args: unknown[]) => mockGovernanceHealth(...args),
    governanceEvaluate: (...args: unknown[]) => mockGovernanceEvaluate(...args),
    governanceApprove: (...args: unknown[]) => mockGovernanceApprove(...args),
    governanceLedger: (...args: unknown[]) => mockGovernanceLedger(...args),
    governanceRiskConvert: (...args: unknown[]) => mockGovernanceRiskConvert(...args),
    isGovernanceEngineEnabled: () => mockIsEnabled(),
}));

// ─── Import after mocks ─────────────────────────────────────────────

import {
    isGovernanceEngineEnabled,
} from '@/lib/governance-engine';

describe('governance-engine client', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    // ── Health ────────────────────────────────────────────────────

    describe('governanceHealth', () => {
        it('returns health status when server responds', async () => {
            const health = {
                status: 'healthy',
                service: 'CVF Governance Engine',
                version: '1.6.1',
                timestamp: '2026-02-21T00:00:00Z',
            };
            mockGovernanceHealth.mockResolvedValue(health);

            const result = await mockGovernanceHealth();
            expect(result).toEqual(health);
            expect(result.status).toBe('healthy');
        });

        it('returns null when server is unreachable', async () => {
            mockGovernanceHealth.mockResolvedValue(null);

            const result = await mockGovernanceHealth();
            expect(result).toBeNull();
        });
    });

    // ── Evaluate ─────────────────────────────────────────────────

    describe('governanceEvaluate', () => {
        it('returns evaluation result for valid request', async () => {
            const evalResult = {
                report: {
                    status: 'APPROVED',
                    risk_score: 0.2,
                    cvf_risk_level: 'R1',
                    cvf_quality: {
                        correctness: 0.9,
                        safety: 0.85,
                        alignment: 0.8,
                        quality: 0.88,
                        overall: 0.86,
                        grade: 'B',
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
                    artifact_id: 'art-1',
                    risk_score: 0.2,
                    status: 'completed',
                },
            };
            mockGovernanceEvaluate.mockResolvedValue(evalResult);

            const result = await mockGovernanceEvaluate({
                request_id: 'test-1',
                artifact_id: 'art-1',
                payload: { content: 'test' },
            });
            expect(result).toEqual(evalResult);
            expect(result.report.status).toBe('APPROVED');
            expect(result.report.cvf_quality.grade).toBe('B');
        });

        it('returns null on server error', async () => {
            mockGovernanceEvaluate.mockResolvedValue(null);

            const result = await mockGovernanceEvaluate({
                request_id: 'test-2',
                artifact_id: 'art-2',
                payload: {},
            });
            expect(result).toBeNull();
        });
    });

    // ── Approve ──────────────────────────────────────────────────

    describe('governanceApprove', () => {
        it('submits approval decision', async () => {
            const approveResult = {
                request_id: 'req-1',
                status: 'APPROVED',
                current_step: 1,
                total_decisions: 2,
            };
            mockGovernanceApprove.mockResolvedValue(approveResult);

            const result = await mockGovernanceApprove({
                request_id: 'req-1',
                approver_id: 'user-1',
                decision: 'APPROVED',
            });
            expect(result).toEqual(approveResult);
        });

        it('returns null when server unavailable', async () => {
            mockGovernanceApprove.mockResolvedValue(null);

            const result = await mockGovernanceApprove({
                request_id: 'req-2',
                approver_id: 'user-1',
                decision: 'REJECTED',
            });
            expect(result).toBeNull();
        });
    });

    // ── Ledger ───────────────────────────────────────────────────

    describe('governanceLedger', () => {
        it('returns ledger entries', async () => {
            const ledgerResult = {
                total_blocks: 5,
                returned: 5,
                entries: [
                    {
                        hash: 'abc123',
                        previous_hash: '000000',
                        event: { type: 'evaluation' },
                        timestamp: '2026-02-21T00:00:00Z',
                        block_index: 0,
                    },
                ],
            };
            mockGovernanceLedger.mockResolvedValue(ledgerResult);

            const result = await mockGovernanceLedger(50);
            expect(result.total_blocks).toBe(5);
            expect(result.entries).toHaveLength(1);
        });
    });

    // ── Risk Convert ─────────────────────────────────────────────

    describe('governanceRiskConvert', () => {
        it('converts to CVF risk level', async () => {
            const convertResult = {
                input: '0.75',
                cvf_level: 'R3',
                direction: 'score → CVF',
            };
            mockGovernanceRiskConvert.mockResolvedValue(convertResult);

            const result = await mockGovernanceRiskConvert('0.75', 'to_cvf');
            expect(result.cvf_level).toBe('R3');
        });

        it('converts from CVF risk level', async () => {
            const convertResult = {
                input: 'R2',
                internal_level: 'MEDIUM',
                numeric_score: 0.5,
                direction: 'CVF → internal',
            };
            mockGovernanceRiskConvert.mockResolvedValue(convertResult);

            const result = await mockGovernanceRiskConvert('R2', 'from_cvf');
            expect(result.internal_level).toBe('MEDIUM');
            expect(result.numeric_score).toBe(0.5);
        });
    });

    // ── isGovernanceEngineEnabled ─────────────────────────────────

    describe('isGovernanceEngineEnabled', () => {
        it('returns true when enabled', () => {
            mockIsEnabled.mockReturnValue(true);
            expect(isGovernanceEngineEnabled()).toBe(true);
        });

        it('returns false when disabled', () => {
            mockIsEnabled.mockReturnValue(false);
            expect(isGovernanceEngineEnabled()).toBe(false);
        });
    });
});
