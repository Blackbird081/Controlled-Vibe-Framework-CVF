import { describe, expect, it } from 'vitest';
import { buildExternalCapabilityIngestionReadout } from '@/lib/mlw7-external-capability-ingestion';
import type { ExternalAssetGovernanceRequest } from '@/lib/server/external-asset-governance';

const baseRequest: ExternalAssetGovernanceRequest = {
  profile: {
    source_ref: '.private_reference/legacy/cortex-hub/README.md',
    source_kind: 'document_bundle',
    source_quality: 'internal_design_draft',
    officially_verified: false,
    provenance_notes: 'T10 cortex-hub external capability bridge signal.',
    candidate_asset_type: 'W7SkillAsset',
    description_or_trigger: 'Cortex bridge candidate for governed metadata intake.',
    instruction_body: 'Review metadata only. Do not install or execute.',
  },
  registry: {
    governanceOwner: 'cvf-architecture',
    approvalState: 'draft',
    riskLevel: 'R2',
    traceRequired: true,
    evaluationEnabled: false,
  },
};

describe('MLW7 external capability ingestion readout', () => {
  it('maps external capability signals through existing governance without install or delegation authority', () => {
    const readout = buildExternalCapabilityIngestionReadout({
      request: baseRequest,
      sourceSignals: [
        {
          sourceLabel: 'cortex-hub',
          sourceRef: 'docs/corpus-intelligence/findings/legacy-cvf-add-cortex-hub.md',
          summary: 'External capability provider pattern requires governed intake.',
        },
      ],
    });

    expect(readout).toMatchObject({
      contractVersion: 'cvf.mlw7.externalCapabilityIngestion.rt1.v1',
      externalCapabilityCandidateClass: 'CORTEX_BRIDGE',
      autonomousMutationAuthorized: false,
      noInstallNoExecuteInvariant: {
        packageInstallAuthorized: false,
        externalExecutionAuthorized: false,
        delegationApprovalAuthorized: false,
        registryAuthorityGranted: false,
        marketplacePublicationAuthorized: false,
        runtimeAdapterAuthorized: false,
      },
    });
    expect(readout.admissionProfile.existingOwnerSurface).toBe('prepareExternalAssetGovernance');
    expect(readout.admissionProfile.disposition).toBe('ACCEPT_FOR_GOVERNED_INTAKE_REVIEW');
    expect(readout.governanceResult.continuityDelegation.delegationAllowed).toBe(false);
    expect(readout.admissionProfile.blockedReasons).toContain(
      'External capability intake does not grant worker/runtime authority by itself.',
    );
  });

  it('defers runtime or marketplace requests to a separate tranche while keeping all authority flags false', () => {
    const readout = buildExternalCapabilityIngestionReadout({
      request: {
        ...baseRequest,
        profile: {
          ...baseRequest.profile,
          source_ref: 'https://hf.co/org/model',
          description_or_trigger: 'HuggingFace provider capability candidate.',
        },
      },
      requestedOperations: ['document_review', 'execute', 'marketplace_publish'],
    });

    expect(readout.externalCapabilityCandidateClass).toBe('HUGGINGFACE_MODEL_OR_SPACE');
    expect(readout.admissionProfile.disposition).toBe('DEFER_TO_SEPARATE_RUNTIME_TRANCHE');
    expect(readout.admissionProfile.blockedReasons).toEqual(
      expect.arrayContaining([
        'RUNTIME_SCOPE_OPERATION_EXECUTE_NOT_AUTHORIZED',
        'RUNTIME_SCOPE_OPERATION_MARKETPLACE_PUBLISH_NOT_AUTHORIZED',
      ]),
    );
    expect(Object.values(readout.noInstallNoExecuteInvariant)).toEqual([
      false,
      false,
      false,
      false,
      false,
      false,
    ]);
  });

  it('rejects invalid intake shape without creating execution authority', () => {
    const readout = buildExternalCapabilityIngestionReadout({
      request: {
        ...baseRequest,
        profile: {
          ...baseRequest.profile,
          provenance_notes: '',
        },
      },
    });

    expect(readout.governanceResult.workflowStatus).toBe('invalid');
    expect(readout.admissionProfile.disposition).toBe('REJECT_SCOPE_BOUNDARY');
    expect(readout.governanceResult.governedCapability.evaluationStatus).toBe('rejected');
    expect(readout.noInstallNoExecuteInvariant.externalExecutionAuthorized).toBe(false);
  });
});
