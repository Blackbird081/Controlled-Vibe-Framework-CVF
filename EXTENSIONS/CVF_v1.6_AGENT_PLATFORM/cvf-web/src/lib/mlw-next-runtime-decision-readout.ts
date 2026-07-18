import {
  MLW7_EXTERNAL_CAPABILITY_INGESTION_VERSION,
  type ExternalCapabilityIngestionReadout,
} from '@/lib/mlw7-external-capability-ingestion';
import {
  MLW8_EFFICIENCY_OVERCONSTRAINT_FEEDBACK_VERSION,
  type EfficiencyOverconstraintFeedbackReadout,
} from '@/lib/mlw8-efficiency-overconstraint-feedback';

export const MLW_NEXT_RUNTIME_DECISION_READOUT_VERSION =
  'cvf.mlwNrd1.nextRuntimeDecisionReadout.rt1.v1';

export type MlwNextRuntimeDecisionLane =
  | 'ROUTE_VISIBLE_ADVISORY_DECISION_READOUT'
  | 'MLW7_EXTERNAL_CAPABILITY_RUNTIME_ADAPTER'
  | 'MLW8_AUTOMATIC_EFFICIENCY_OPTIMIZATION'
  | 'LO2_HIGH_RISK_PROMOTION'
  | 'PUBLIC_SYNC_OR_LIVE_PROOF';

export type MlwNextRuntimeDecisionDisposition =
  | 'SELECTED_FOR_CURRENT_WORK_ORDER'
  | 'HOLD_FOR_SEPARATE_GC018'
  | 'BLOCKED_BY_BOUNDARY';

export interface MlwNextRuntimeDecisionCandidate {
  lane: MlwNextRuntimeDecisionLane;
  disposition: MlwNextRuntimeDecisionDisposition;
  sourceEvidence: string[];
  decisionReasons: string[];
  blockedAuthorities: string[];
}

export interface MlwNextRuntimeDecisionReadout {
  contractVersion: typeof MLW_NEXT_RUNTIME_DECISION_READOUT_VERSION;
  selectedLane: 'ROUTE_VISIBLE_ADVISORY_DECISION_READOUT';
  selectedDisposition: 'SELECTED_FOR_CURRENT_WORK_ORDER';
  candidateLanes: MlwNextRuntimeDecisionCandidate[];
  heldLaneCount: number;
  blockedLaneCount: number;
  advisoryReadoutOnly: true;
  routeVisibleReadoutAuthorized: true;
  externalCapabilityExecutionAuthorized: false;
  runtimeAdapterAuthorized: false;
  automaticOptimizationAuthorized: false;
  policyRelaxationAuthorized: false;
  evidenceReductionAuthorized: false;
  highRiskPromotionAuthorized: false;
  publicSyncAuthorized: false;
  liveProviderProofAuthorized: false;
  memoryReinjectionAuthorized: false;
  automaticPromotionAuthorized: false;
  autonomousMutationAuthorized: false;
  sourceEvidence: string[];
}

export function buildMlwNextRuntimeDecisionReadout(input: {
  mlw7Readout?: Pick<ExternalCapabilityIngestionReadout, 'contractVersion' | 'noInstallNoExecuteInvariant'>;
  mlw8Readout?: Pick<
    EfficiencyOverconstraintFeedbackReadout,
    | 'contractVersion'
    | 'automaticOptimizationAuthorized'
    | 'policyRelaxationAuthorized'
    | 'evidenceReductionAuthorized'
  >;
} = {}): MlwNextRuntimeDecisionReadout {
  const mlw7Evidence = input.mlw7Readout?.contractVersion ?? MLW7_EXTERNAL_CAPABILITY_INGESTION_VERSION;
  const mlw8Evidence = input.mlw8Readout?.contractVersion ?? MLW8_EFFICIENCY_OVERCONSTRAINT_FEEDBACK_VERSION;
  const candidateLanes: MlwNextRuntimeDecisionCandidate[] = [
    {
      lane: 'ROUTE_VISIBLE_ADVISORY_DECISION_READOUT',
      disposition: 'SELECTED_FOR_CURRENT_WORK_ORDER',
      sourceEvidence: [
        'docs/baselines/CVF_GC018_MLW_NEXT_RUNTIME_DECISION_2026-06-05.md#selected-lane',
        'EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/execute/route-response-readouts.ts#buildExecuteResponseReadouts',
      ],
      decisionReasons: [
        'Current source has a route response readout aggregation point.',
        'Decision readout can expose lane status without executing, optimizing, promoting, or publishing.',
      ],
      blockedAuthorities: [],
    },
    {
      lane: 'MLW7_EXTERNAL_CAPABILITY_RUNTIME_ADAPTER',
      disposition: 'HOLD_FOR_SEPARATE_GC018',
      sourceEvidence: [mlw7Evidence],
      decisionReasons: [
        'MLW7 source supports governed intake review only.',
        'External capability install, execution, delegation, marketplace, and runtime adapter authority remain out of scope.',
      ],
      blockedAuthorities: [
        'externalCapabilityExecutionAuthorized',
        'runtimeAdapterAuthorized',
      ],
    },
    {
      lane: 'MLW8_AUTOMATIC_EFFICIENCY_OPTIMIZATION',
      disposition: 'HOLD_FOR_SEPARATE_GC018',
      sourceEvidence: [mlw8Evidence],
      decisionReasons: [
        'MLW8 source records feedback only.',
        'Automatic optimization, policy relaxation, and evidence reduction require separate authorization.',
      ],
      blockedAuthorities: [
        'automaticOptimizationAuthorized',
        'policyRelaxationAuthorized',
        'evidenceReductionAuthorized',
      ],
    },
    {
      lane: 'LO2_HIGH_RISK_PROMOTION',
      disposition: 'BLOCKED_BY_BOUNDARY',
      sourceEvidence: [
        'docs/reference/CVF_LO2_HIGH_RISK_PROMOTION_DECISION_BOUNDARY_2026-06-05.md',
      ],
      decisionReasons: [
        'LO2 permits advisory high-risk promotion decision boundaries only.',
        'Runtime promotion, trust mutation, policy mutation, and truth mutation are not authorized by MLW-NRD1.',
      ],
      blockedAuthorities: [
        'highRiskPromotionAuthorized',
        'automaticPromotionAuthorized',
      ],
    },
    {
      lane: 'PUBLIC_SYNC_OR_LIVE_PROOF',
      disposition: 'BLOCKED_BY_BOUNDARY',
      sourceEvidence: [
        'docs/work_orders/CVF_WO_MLW_NRD1_NEXT_RUNTIME_DECISION_READOUT_2026-06-05.md#forbidden',
      ],
      decisionReasons: [
        'MLW-NRD1 is deterministic advisory implementation only.',
        'Public-sync and live provider proof require separate operator authorization.',
      ],
      blockedAuthorities: [
        'publicSyncAuthorized',
        'liveProviderProofAuthorized',
      ],
    },
  ];

  return {
    contractVersion: MLW_NEXT_RUNTIME_DECISION_READOUT_VERSION,
    selectedLane: 'ROUTE_VISIBLE_ADVISORY_DECISION_READOUT',
    selectedDisposition: 'SELECTED_FOR_CURRENT_WORK_ORDER',
    candidateLanes,
    heldLaneCount: candidateLanes.filter((candidate) => candidate.disposition === 'HOLD_FOR_SEPARATE_GC018').length,
    blockedLaneCount: candidateLanes.filter((candidate) => candidate.disposition === 'BLOCKED_BY_BOUNDARY').length,
    advisoryReadoutOnly: true,
    routeVisibleReadoutAuthorized: true,
    externalCapabilityExecutionAuthorized: false,
    runtimeAdapterAuthorized: false,
    automaticOptimizationAuthorized: false,
    policyRelaxationAuthorized: false,
    evidenceReductionAuthorized: false,
    highRiskPromotionAuthorized: false,
    publicSyncAuthorized: false,
    liveProviderProofAuthorized: false,
    memoryReinjectionAuthorized: false,
    automaticPromotionAuthorized: false,
    autonomousMutationAuthorized: false,
    sourceEvidence: [
      'docs/baselines/CVF_GC018_MLW_NEXT_RUNTIME_DECISION_2026-06-05.md',
      'docs/work_orders/CVF_WO_MLW_NRD1_NEXT_RUNTIME_DECISION_READOUT_2026-06-05.md',
      mlw7Evidence,
      mlw8Evidence,
      'docs/reference/CVF_LO2_HIGH_RISK_PROMOTION_DECISION_BOUNDARY_2026-06-05.md',
    ],
  };
}
