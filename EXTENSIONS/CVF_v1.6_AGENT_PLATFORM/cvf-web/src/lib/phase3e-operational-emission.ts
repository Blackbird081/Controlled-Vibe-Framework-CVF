import type { GovernanceEvidenceReceipt } from '@/lib/ai';
import type { Phase2CProductBriefSlice } from '@/lib/phase2c-product-brief-slice';

export const PHASE_3E_EMISSION_PILOT_ID = 'CVF_17_05_PHASE_3E_EMISSION_PILOT';

export type Phase3EMetricId =
  | 'policy-violation-rate'
  | 'receipt-integrity'
  | 'task-completion-rate';

export interface Phase3EMetricEmission {
  metricId: Phase3EMetricId;
  value: number;
  numerator: number;
  denominator: number;
  unit: 'ratio';
  source: string;
  interpretation: string;
}

export interface Phase3EEmissionPilot {
  pilotId: typeof PHASE_3E_EMISSION_PILOT_ID;
  status: 'emitted';
  sourceSliceId: string;
  metrics: readonly Phase3EMetricEmission[];
  skippedMetrics: readonly {
    metricId: string;
    reason: string;
  }[];
  claimBoundary: 'pilot_only_no_full_operational_intelligence_claim';
}

export interface BuildPhase3EEmissionPilotInput {
  phase2cProductBrief?: Phase2CProductBriefSlice;
  evidenceReceipt: GovernanceEvidenceReceipt;
  responseSuccess: boolean;
}

export interface BuildPhase3EOperationalMetricsForRouteInput {
  phase2cProductBrief?: Phase2CProductBriefSlice;
  evidenceReceipt: GovernanceEvidenceReceipt;
  responseSuccess: boolean;
}

const VIOLATION_DECISIONS = new Set(['BLOCK', 'DENY', 'NEEDS_APPROVAL']);

function ratio(numerator: number, denominator: number): number {
  if (denominator <= 0) return 0;
  return Number((numerator / denominator).toFixed(4));
}

function hasReceiptIntegrity(
  receipt: GovernanceEvidenceReceipt,
  slice: Phase2CProductBriefSlice,
): boolean {
  const packReceipt = slice.deliverablePack.governanceEvidence.rawReceipt;
  return Boolean(
    receipt.receiptId
    && receipt.envelopeId
    && receipt.policySnapshotId
    && packReceipt?.receiptId === receipt.receiptId
    && slice.receiptAdapter.receiptId === receipt.receiptId
    && slice.receiptAdapter.envelopeId === receipt.envelopeId
    && slice.receiptAdapter.policySnapshotId === receipt.policySnapshotId,
  );
}

export function buildPhase3EEmissionPilot(
  input: BuildPhase3EEmissionPilotInput,
): Phase3EEmissionPilot | undefined {
  const slice = input.phase2cProductBrief;
  if (!slice) {
    return undefined;
  }

  const policyViolationCount = VIOLATION_DECISIONS.has(
    String(input.evidenceReceipt.decision ?? '').toUpperCase(),
  ) ? 1 : 0;
  const receiptIntegrityCount = hasReceiptIntegrity(input.evidenceReceipt, slice) ? 1 : 0;
  const taskCompletedCount =
    input.responseSuccess && slice.status === 'generated' && slice.deliverablePack.packType === 'app_planning'
      ? 1
      : 0;

  return {
    pilotId: PHASE_3E_EMISSION_PILOT_ID,
    status: 'emitted',
    sourceSliceId: slice.sliceId,
    metrics: [
      {
        metricId: 'policy-violation-rate',
        value: ratio(policyViolationCount, 1),
        numerator: policyViolationCount,
        denominator: 1,
        unit: 'ratio',
        source: 'governanceEvidenceReceipt.decision',
        interpretation: '1 means this governed action triggered BLOCK, DENY, or NEEDS_APPROVAL; 0 means it did not.',
      },
      {
        metricId: 'receipt-integrity',
        value: ratio(receiptIntegrityCount, 1),
        numerator: receiptIntegrityCount,
        denominator: 1,
        unit: 'ratio',
        source: 'governanceEvidenceReceipt + phase2cProductBrief.receiptAdapter + deliverablePack.governanceEvidence.rawReceipt',
        interpretation: '1 means receipt ID, envelope ID, and policy snapshot are preserved through the adapter into the pack.',
      },
      {
        metricId: 'task-completion-rate',
        value: ratio(taskCompletedCount, 1),
        numerator: taskCompletedCount,
        denominator: 1,
        unit: 'ratio',
        source: 'route success + phase2cProductBrief.status + deliverablePack.packType',
        interpretation: '1 means the named Create Product Brief journey reached a generated app-planning deliverable pack.',
      },
    ],
    skippedMetrics: [
      {
        metricId: 'retry-count',
        reason: 'Needs provider retry event stream beyond the first response-local pilot.',
      },
      {
        metricId: 'hallucination-recovery',
        reason: 'Needs detector and correction events not emitted by the Phase 2.C slice.',
      },
      {
        metricId: 'human-correction-count',
        reason: 'Needs operator correction events outside this single route response.',
      },
      {
        metricId: 'cross-session-continuity',
        reason: 'Needs cross-session handoff/continuity evidence.',
      },
      {
        metricId: 'long-horizon-stability',
        reason: 'Needs multi-phase longitudinal executions.',
      },
      {
        metricId: 'deterministic-consistency',
        reason: 'Already benchmark-scoped by EA Track E; not a Phase 3.E runtime pilot emission.',
      },
      {
        metricId: 'rollback-success',
        reason: 'Needs rollback event source not present in the Phase 2.C product brief slice.',
      },
    ],
    claimBoundary: 'pilot_only_no_full_operational_intelligence_claim',
  };
}

export function buildPhase3EOperationalMetricsForRoute(
  input: BuildPhase3EOperationalMetricsForRouteInput,
): Phase3EEmissionPilot | undefined {
  return buildPhase3EEmissionPilot(input);
}
