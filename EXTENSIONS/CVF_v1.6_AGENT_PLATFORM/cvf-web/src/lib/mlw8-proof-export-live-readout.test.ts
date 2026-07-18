import { describe, expect, it } from 'vitest';
import { buildMlw8ProofExportLiveReadout } from '@/lib/mlw8-proof-export-live-readout';

const baseCostQuota = {
  disposition: 'allowed' as const,
  providerLane: 'alibaba' as const,
  expectedLiveCallCount: 7,
  decisionReason: 'within_full_live_release_gate_limit',
};

const baseLiveProof = {
  status: 'PASS' as const,
  command: 'python scripts/run_cvf_release_gate_bundle.py --json',
  providerLane: 'alibaba' as const,
  operatorAuthorizedLiveRun: true,
  receiptRefs: ['docs/evidence/CVF_MLW8_PEL1_RELEASE_GATE_RESULT_2026-06-06.json'],
};

const basePublicExport = {
  disposition: 'EXPORTED' as const,
  publicSyncRemote: 'https://github.com/Blackbird081/Controlled-Vibe-Framework-CVF.git',
  publicSyncCommit: 'public-sync-commit',
  artifactPaths: ['docs/evidence/mlw8-proof-export-live-boundary-2026-06-06.md'],
};

describe('MLW8 proof/export/live readout', () => {
  it('allows bounded public claim after live proof pass and public export while blocking optimization claims', () => {
    const readout = buildMlw8ProofExportLiveReadout({
      role: 'reviewer',
      estimatedContextTokens: 8_000,
      observedSignals: { costPressure: true, approvalFriction: true },
      costQuota: baseCostQuota,
      liveProof: baseLiveProof,
      publicExport: basePublicExport,
    });

    expect(readout).toMatchObject({
      contractVersion: 'cvf.mlw8.proofExportLive.pel1.v1',
      proofDisposition: 'LIVE_PROOF_PASSED_PUBLIC_SAFE_EXPORT_READY',
      diagnosticRequired: false,
      publicClaimAllowed: true,
      costProofBounded: true,
      benchmarkProofBounded: true,
      liveProviderProofObserved: true,
      automaticOptimizationAuthorized: false,
      policyRelaxationAuthorized: false,
      evidenceReductionAuthorized: false,
      autonomousMutationAuthorized: false,
      costReductionClaimAuthorized: false,
      performanceImprovementClaimAuthorized: false,
      providerQualityClaimAuthorized: false,
      hostedReadinessClaimAuthorized: false,
      productionReadinessClaimAuthorized: false,
    });
    expect(readout.boundaries).toEqual(
      expect.arrayContaining([
        'no_cost_reduction_claim',
        'no_performance_improvement_claim',
        'public_claim_requires_exported_public_sync_commit',
      ]),
    );
  });

  it('requires a diagnostic and blocks public claim when live proof fails', () => {
    const readout = buildMlw8ProofExportLiveReadout({
      role: 'reviewer',
      estimatedContextTokens: 8_000,
      costQuota: baseCostQuota,
      liveProof: {
        ...baseLiveProof,
        status: 'FAIL',
        diagnosticClass: 'provider_or_playwright_failure',
      },
      publicExport: basePublicExport,
    });

    expect(readout.proofDisposition).toBe('LIVE_PROOF_FAILED_DIAGNOSTIC_REQUIRED');
    expect(readout.diagnosticRequired).toBe(true);
    expect(readout.publicClaimAllowed).toBe(false);
    expect(readout.liveProviderProofObserved).toBe(false);
  });

  it('blocks proof/export readiness when cost quota preflight blocks the lane', () => {
    const readout = buildMlw8ProofExportLiveReadout({
      role: 'reviewer',
      estimatedContextTokens: 8_000,
      costQuota: {
        ...baseCostQuota,
        disposition: 'blocked_by_policy',
        decisionReason: 'cost_quota_per_job_limit_exceeded',
      },
      liveProof: baseLiveProof,
      publicExport: basePublicExport,
    });

    expect(readout.proofDisposition).toBe('COST_QUOTA_BLOCKED');
    expect(readout.costProofBounded).toBe(false);
    expect(readout.publicClaimAllowed).toBe(false);
  });

  it('blocks proof/export readiness when MLW8 preservation guard fails', () => {
    const readout = buildMlw8ProofExportLiveReadout({
      role: 'reviewer',
      estimatedContextTokens: 8_000,
      preservationGuard: {
        evidenceFieldsPreserved: false,
        auditFieldsPreserved: true,
        safetyChecksPreserved: true,
        dlpChecksPreserved: true,
        approvalGatesPreserved: true,
        receiptFieldsPreserved: true,
      },
      costQuota: baseCostQuota,
      liveProof: baseLiveProof,
      publicExport: basePublicExport,
    });

    expect(readout.mlw8Readout.preservationGuardResult.disposition).toBe('BLOCK');
    expect(readout.proofDisposition).toBe('PRESERVATION_BLOCKED');
    expect(readout.publicClaimAllowed).toBe(false);
    expect(readout.evidenceReductionAuthorized).toBe(false);
  });
});
