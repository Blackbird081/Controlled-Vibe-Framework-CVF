import { describe, expect, it } from 'vitest';
import { buildExternalCapabilityIngestionReadout } from '@/lib/mlw7-external-capability-ingestion';
import { buildRuntimeAdapterBoundaryAdmissionReadout } from '@/lib/mlw7-runtime-adapter-boundary-admission';
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

describe('MLW7 runtime adapter boundary admission readout', () => {
  it('admits command-like assets only to adapter boundary review without runtime authority', () => {
    const readout = buildRuntimeAdapterBoundaryAdmissionReadout({
      request: {
        ...baseRequest,
        profile: {
          ...baseRequest.profile,
          candidate_asset_type: 'W7CommandAsset',
          description_or_trigger: 'Command adapter metadata for review only.',
        },
      },
    });

    expect(readout).toMatchObject({
      contractVersion: 'cvf.mlw7.runtimeAdapterBoundaryAdmission.rtad1.v1',
      sourceReadoutVersion: 'cvf.mlw7.externalCapabilityIngestion.rt1.v1',
      existingOwnerSurface: 'buildExternalCapabilityIngestionReadout',
      admissionLane: 'ADAPTER_BOUNDARY_REVIEW',
      runtimeAdapterClassDetected: true,
      runtimeAdapterClassIsApproval: false,
      runtimeAdapterAuthorized: false,
      externalCapabilityExecutionAuthorized: false,
      packageInstallAuthorized: false,
      delegationApprovalAuthorized: false,
      registryAuthorityGranted: false,
      autonomousMutationAuthorized: false,
    });
    expect(readout.ingestionReadout.governanceResult.governedCapability.capabilityClass).toBe(
      'runtime_adapter',
    );
    expect(readout.boundaryReasons).toContain(
      'Runtime adapter class detection is not adapter approval.',
    );
  });

  it('blocks execution and registry authority requests pending a separate adapter approval path', () => {
    const readout = buildRuntimeAdapterBoundaryAdmissionReadout({
      request: {
        ...baseRequest,
        profile: {
          ...baseRequest.profile,
          candidate_asset_type: 'W7CommandAsset',
          description_or_trigger: 'Command adapter requests runtime execution.',
        },
      },
      requestedOperations: ['document_review', 'execute', 'register_authority'],
    });

    expect(readout.admissionLane).toBe('EXECUTION_BLOCKED_PENDING_ADAPTER_APPROVAL');
    expect(readout.boundaryReasons).toEqual(
      expect.arrayContaining([
        'RUNTIME_SCOPE_OPERATION_EXECUTE_NOT_AUTHORIZED',
        'RUNTIME_SCOPE_OPERATION_REGISTER_AUTHORITY_NOT_AUTHORIZED',
        'RTAD1 admits boundary review only and does not authorize install, execution, delegation, or public export.',
      ]),
    );
    expect(readout.blockedAuthorities).toEqual(
      expect.arrayContaining(['external_execution', 'runtime_adapter_approval', 'registry_authority']),
    );
    expect(readout.runtimeAdapterAuthorized).toBe(false);
    expect(readout.registryAuthorityGranted).toBe(false);
  });

  it('keeps marketplace publication and public export outside the RTAD1 boundary', () => {
    const readout = buildRuntimeAdapterBoundaryAdmissionReadout({
      request: baseRequest,
      requestedOperations: ['document_review', 'marketplace_publish'],
    });

    expect(readout.admissionLane).toBe('PUBLIC_EXPORT_BLOCKED');
    expect(readout.marketplacePublicationAuthorized).toBe(false);
    expect(readout.publicExportAuthorized).toBe(false);
    expect(readout.boundaryReasons).toContain(
      'Marketplace or public export operation is outside RTAD1 authority.',
    );
  });

  it('does not treat registry-ready source readouts as registry authority', () => {
    const ingestionReadout = buildExternalCapabilityIngestionReadout({ request: baseRequest });
    const registryReadyIngestionReadout = {
      ...ingestionReadout,
      admissionProfile: {
        ...ingestionReadout.admissionProfile,
        readyForRegistry: true,
      },
      governanceResult: {
        ...ingestionReadout.governanceResult,
        readyForRegistry: true,
        workflowStatus: 'registry_ready' as const,
      },
    };

    const readout = buildRuntimeAdapterBoundaryAdmissionReadout({
      ingestionReadout: registryReadyIngestionReadout,
    });

    expect(readout.admissionLane).toBe('REGISTRY_REVIEW');
    expect(readout.registryReadinessIsAuthority).toBe(false);
    expect(readout.registryAuthorityGranted).toBe(false);
    expect(readout.boundaryReasons).toContain(
      'Registry-ready source readout still requires governed registry approval evidence.',
    );
  });
});
