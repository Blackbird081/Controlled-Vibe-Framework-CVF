import { describe, expect, it } from 'vitest';
import { buildMlwNextRuntimeDecisionReadout } from '@/lib/mlw-next-runtime-decision-readout';

describe('MLW-NRD1 next-runtime decision readout', () => {
  it('selects the route-visible advisory lane while holding runtime and optimization lanes', () => {
    const readout = buildMlwNextRuntimeDecisionReadout();

    expect(readout).toMatchObject({
      contractVersion: 'cvf.mlwNrd1.nextRuntimeDecisionReadout.rt1.v1',
      selectedLane: 'ROUTE_VISIBLE_ADVISORY_DECISION_READOUT',
      selectedDisposition: 'SELECTED_FOR_CURRENT_WORK_ORDER',
      heldLaneCount: 2,
      blockedLaneCount: 2,
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
    });
    expect(readout.candidateLanes.map((candidate) => candidate.lane)).toEqual([
      'ROUTE_VISIBLE_ADVISORY_DECISION_READOUT',
      'MLW7_EXTERNAL_CAPABILITY_RUNTIME_ADAPTER',
      'MLW8_AUTOMATIC_EFFICIENCY_OPTIMIZATION',
      'LO2_HIGH_RISK_PROMOTION',
      'PUBLIC_SYNC_OR_LIVE_PROOF',
    ]);
    expect(readout.candidateLanes.map((candidate) => candidate.disposition)).toEqual([
      'SELECTED_FOR_CURRENT_WORK_ORDER',
      'HOLD_FOR_SEPARATE_GC018',
      'HOLD_FOR_SEPARATE_GC018',
      'BLOCKED_BY_BOUNDARY',
      'BLOCKED_BY_BOUNDARY',
    ]);
  });

  it('preserves source readout versions without inheriting runtime or mutation authority', () => {
    const readout = buildMlwNextRuntimeDecisionReadout({
      mlw7Readout: {
        contractVersion: 'cvf.mlw7.externalCapabilityIngestion.rt1.v1',
        noInstallNoExecuteInvariant: {
          packageInstallAuthorized: false,
          externalExecutionAuthorized: false,
          delegationApprovalAuthorized: false,
          registryAuthorityGranted: false,
          marketplacePublicationAuthorized: false,
          runtimeAdapterAuthorized: false,
        },
      },
      mlw8Readout: {
        contractVersion: 'cvf.mlw8.efficiencyOverconstraintFeedback.rt1.v1',
        automaticOptimizationAuthorized: false,
        policyRelaxationAuthorized: false,
        evidenceReductionAuthorized: false,
      },
    });

    expect(readout.sourceEvidence).toEqual(
      expect.arrayContaining([
        'cvf.mlw7.externalCapabilityIngestion.rt1.v1',
        'cvf.mlw8.efficiencyOverconstraintFeedback.rt1.v1',
      ]),
    );
    expect(readout.candidateLanes.find((candidate) => candidate.lane === 'MLW7_EXTERNAL_CAPABILITY_RUNTIME_ADAPTER'))
      .toMatchObject({
        disposition: 'HOLD_FOR_SEPARATE_GC018',
        blockedAuthorities: ['externalCapabilityExecutionAuthorized', 'runtimeAdapterAuthorized'],
      });
    expect(readout.candidateLanes.find((candidate) => candidate.lane === 'MLW8_AUTOMATIC_EFFICIENCY_OPTIMIZATION'))
      .toMatchObject({
        disposition: 'HOLD_FOR_SEPARATE_GC018',
        blockedAuthorities: [
          'automaticOptimizationAuthorized',
          'policyRelaxationAuthorized',
          'evidenceReductionAuthorized',
        ],
      });
    expect([
      readout.externalCapabilityExecutionAuthorized,
      readout.runtimeAdapterAuthorized,
      readout.automaticOptimizationAuthorized,
      readout.policyRelaxationAuthorized,
      readout.evidenceReductionAuthorized,
      readout.highRiskPromotionAuthorized,
      readout.publicSyncAuthorized,
      readout.liveProviderProofAuthorized,
      readout.memoryReinjectionAuthorized,
      readout.automaticPromotionAuthorized,
      readout.autonomousMutationAuthorized,
    ]).toEqual([false, false, false, false, false, false, false, false, false, false, false]);
  });
});
