import {
  buildEfficiencyOverconstraintFeedbackReadout,
  type EfficiencyOverconstraintFeedbackReadout,
  type EfficiencyOverconstraintObservedSignals,
  type PreservationGuardInput,
} from '@/lib/mlw8-efficiency-overconstraint-feedback';

export const MLW8_PROOF_EXPORT_LIVE_READOUT_VERSION = 'cvf.mlw8.proofExportLive.pel1.v1';

export type Mlw8CostQuotaDisposition = 'allowed' | 'blocked_by_policy' | 'not_evaluated';

export type Mlw8LiveProofStatus = 'PASS' | 'FAIL' | 'NOT_RUN' | 'PARTIAL';

export type Mlw8PublicExportDisposition =
  | 'EXPORTED'
  | 'DEFERRED_PRIVATE_ONLY'
  | 'BLOCKED_MISSING_PUBLIC_ARTIFACTS';

export type Mlw8ProofExportLiveDisposition =
  | 'LIVE_PROOF_PASSED_PUBLIC_SAFE_EXPORT_READY'
  | 'LIVE_PROOF_READY_PRIVATE_ONLY'
  | 'LIVE_PROOF_FAILED_DIAGNOSTIC_REQUIRED'
  | 'COST_QUOTA_BLOCKED'
  | 'PRESERVATION_BLOCKED';

export interface Mlw8CostQuotaEvidence {
  disposition: Mlw8CostQuotaDisposition;
  providerLane: 'alibaba' | 'deepseek' | 'mixed' | 'none';
  expectedLiveCallCount: number;
  decisionReason?: string;
}

export interface Mlw8LiveProofEvidence {
  status: Mlw8LiveProofStatus;
  command: string;
  providerLane: 'alibaba' | 'deepseek' | 'mixed' | 'none';
  operatorAuthorizedLiveRun: boolean;
  diagnosticClass?: string;
  receiptRefs?: string[];
}

export interface Mlw8PublicExportEvidence {
  disposition: Mlw8PublicExportDisposition;
  publicSyncRemote?: string;
  publicSyncCommit?: string;
  artifactPaths?: string[];
}

export interface Mlw8ProofExportLiveReadout {
  contractVersion: typeof MLW8_PROOF_EXPORT_LIVE_READOUT_VERSION;
  mlw8Readout: EfficiencyOverconstraintFeedbackReadout;
  costQuota: Mlw8CostQuotaEvidence;
  liveProof: Mlw8LiveProofEvidence;
  publicExport: Mlw8PublicExportEvidence;
  proofDisposition: Mlw8ProofExportLiveDisposition;
  diagnosticRequired: boolean;
  publicClaimAllowed: boolean;
  costProofBounded: boolean;
  benchmarkProofBounded: boolean;
  liveProviderProofObserved: boolean;
  automaticOptimizationAuthorized: false;
  policyRelaxationAuthorized: false;
  evidenceReductionAuthorized: false;
  autonomousMutationAuthorized: false;
  costReductionClaimAuthorized: false;
  performanceImprovementClaimAuthorized: false;
  providerQualityClaimAuthorized: false;
  hostedReadinessClaimAuthorized: false;
  productionReadinessClaimAuthorized: false;
  boundaries: string[];
}

export interface BuildMlw8ProofExportLiveReadoutInput {
  role: string;
  confidenceLevel?: number;
  estimatedContextTokens: number;
  observedSignals?: EfficiencyOverconstraintObservedSignals;
  preservationGuard?: Partial<PreservationGuardInput>;
  mlw8Readout?: EfficiencyOverconstraintFeedbackReadout;
  costQuota: Mlw8CostQuotaEvidence;
  liveProof: Mlw8LiveProofEvidence;
  publicExport: Mlw8PublicExportEvidence;
}

function hasExportEvidence(publicExport: Mlw8PublicExportEvidence): boolean {
  return Boolean(
    publicExport.publicSyncRemote &&
      publicExport.publicSyncCommit &&
      publicExport.artifactPaths &&
      publicExport.artifactPaths.length > 0,
  );
}

function classifyProofDisposition(input: {
  mlw8Readout: EfficiencyOverconstraintFeedbackReadout;
  costQuota: Mlw8CostQuotaEvidence;
  liveProof: Mlw8LiveProofEvidence;
  publicExport: Mlw8PublicExportEvidence;
}): Mlw8ProofExportLiveDisposition {
  if (input.mlw8Readout.preservationGuardResult.disposition === 'BLOCK') {
    return 'PRESERVATION_BLOCKED';
  }

  if (input.costQuota.disposition === 'blocked_by_policy') {
    return 'COST_QUOTA_BLOCKED';
  }

  if (input.liveProof.status === 'FAIL' || input.liveProof.status === 'PARTIAL') {
    return 'LIVE_PROOF_FAILED_DIAGNOSTIC_REQUIRED';
  }

  if (
    input.liveProof.status === 'PASS' &&
    input.publicExport.disposition === 'EXPORTED' &&
    hasExportEvidence(input.publicExport)
  ) {
    return 'LIVE_PROOF_PASSED_PUBLIC_SAFE_EXPORT_READY';
  }

  return 'LIVE_PROOF_READY_PRIVATE_ONLY';
}

export function buildMlw8ProofExportLiveReadout(
  input: BuildMlw8ProofExportLiveReadoutInput,
): Mlw8ProofExportLiveReadout {
  const mlw8Readout =
    input.mlw8Readout ??
    buildEfficiencyOverconstraintFeedbackReadout({
      role: input.role,
      confidenceLevel: input.confidenceLevel,
      estimatedContextTokens: input.estimatedContextTokens,
      observedSignals: input.observedSignals,
      preservationGuard: input.preservationGuard,
    });

  const proofDisposition = classifyProofDisposition({
    mlw8Readout,
    costQuota: input.costQuota,
    liveProof: input.liveProof,
    publicExport: input.publicExport,
  });
  const diagnosticRequired = proofDisposition === 'LIVE_PROOF_FAILED_DIAGNOSTIC_REQUIRED';
  const liveProviderProofObserved = input.liveProof.status === 'PASS' && input.liveProof.operatorAuthorizedLiveRun;
  const publicClaimAllowed = proofDisposition === 'LIVE_PROOF_PASSED_PUBLIC_SAFE_EXPORT_READY';

  return {
    contractVersion: MLW8_PROOF_EXPORT_LIVE_READOUT_VERSION,
    mlw8Readout,
    costQuota: input.costQuota,
    liveProof: input.liveProof,
    publicExport: input.publicExport,
    proofDisposition,
    diagnosticRequired,
    publicClaimAllowed,
    costProofBounded: input.costQuota.disposition === 'allowed',
    benchmarkProofBounded: liveProviderProofObserved,
    liveProviderProofObserved,
    automaticOptimizationAuthorized: false,
    policyRelaxationAuthorized: false,
    evidenceReductionAuthorized: false,
    autonomousMutationAuthorized: false,
    costReductionClaimAuthorized: false,
    performanceImprovementClaimAuthorized: false,
    providerQualityClaimAuthorized: false,
    hostedReadinessClaimAuthorized: false,
    productionReadinessClaimAuthorized: false,
    boundaries: [
      ...mlw8Readout.boundaries,
      'no_automatic_optimization',
      'no_cost_reduction_claim',
      'no_performance_improvement_claim',
      'no_provider_quality_claim',
      'no_hosted_or_production_readiness_claim',
      'public_claim_requires_exported_public_sync_commit',
      'live_failure_requires_secret_safe_diagnostic_before_rerun',
    ],
  };
}
