import {
  buildExternalCapabilityIngestionReadout,
  MLW7_EXTERNAL_CAPABILITY_INGESTION_VERSION,
  type ExternalCapabilityIngestionReadout,
  type ExternalCapabilityRequestedOperation,
  type ExternalCapabilitySignal,
} from '@/lib/mlw7-external-capability-ingestion';
import type { ExternalAssetGovernanceRequest } from '@/lib/server/external-asset-governance';

export const MLW7_RUNTIME_ADAPTER_BOUNDARY_ADMISSION_VERSION =
  'cvf.mlw7.runtimeAdapterBoundaryAdmission.rtad1.v1';

export type RuntimeAdapterBoundaryAdmissionLane =
  | 'INTAKE_REVIEW'
  | 'ADAPTER_BOUNDARY_REVIEW'
  | 'REGISTRY_REVIEW'
  | 'EXECUTION_BLOCKED_PENDING_ADAPTER_APPROVAL'
  | 'PUBLIC_EXPORT_BLOCKED'
  | 'REJECT_SCOPE_BOUNDARY';

export interface RuntimeAdapterBoundaryAdmissionReadout {
  contractVersion: typeof MLW7_RUNTIME_ADAPTER_BOUNDARY_ADMISSION_VERSION;
  sourceReadoutVersion: typeof MLW7_EXTERNAL_CAPABILITY_INGESTION_VERSION;
  existingOwnerSurface: 'buildExternalCapabilityIngestionReadout';
  admissionLane: RuntimeAdapterBoundaryAdmissionLane;
  runtimeAdapterClassDetected: boolean;
  registryReadinessIsAuthority: false;
  runtimeAdapterClassIsApproval: false;
  externalCapabilityExecutionAuthorized: false;
  runtimeAdapterAuthorized: false;
  packageInstallAuthorized: false;
  delegationApprovalAuthorized: false;
  registryAuthorityGranted: false;
  marketplacePublicationAuthorized: false;
  publicExportAuthorized: false;
  liveProviderProofAuthorized: false;
  memoryReinjectionAuthorized: false;
  automaticPromotionAuthorized: false;
  autonomousMutationAuthorized: false;
  blockedAuthorities: string[];
  boundaryReasons: string[];
  ingestionReadout: ExternalCapabilityIngestionReadout;
}

type RuntimeAdapterBoundaryAdmissionInput =
  | {
      request: ExternalAssetGovernanceRequest;
      sourceSignals?: ExternalCapabilitySignal[];
      requestedOperations?: ExternalCapabilityRequestedOperation[];
      ingestionReadout?: never;
    }
  | {
      ingestionReadout: ExternalCapabilityIngestionReadout;
      requestedOperations?: ExternalCapabilityRequestedOperation[];
      request?: never;
      sourceSignals?: never;
    };

const PUBLIC_EXPORT_OPERATIONS: ReadonlySet<ExternalCapabilityRequestedOperation> = new Set([
  'marketplace_publish',
]);

const RUNTIME_ADAPTER_AUTHORITY_OPERATIONS: ReadonlySet<ExternalCapabilityRequestedOperation> = new Set([
  'install',
  'execute',
  'register_authority',
  'delegate',
]);

function resolveIngestionReadout(
  input: RuntimeAdapterBoundaryAdmissionInput,
): ExternalCapabilityIngestionReadout {
  if (input.ingestionReadout !== undefined) return input.ingestionReadout;

  return buildExternalCapabilityIngestionReadout({
    request: input.request,
    sourceSignals: input.sourceSignals,
    requestedOperations: input.requestedOperations,
  });
}

function resolveRequestedOperations(
  input: RuntimeAdapterBoundaryAdmissionInput,
): ExternalCapabilityRequestedOperation[] {
  return input.requestedOperations ?? ['document_review', 'evaluate_metadata'];
}

function includesAnyOperation(
  operations: ExternalCapabilityRequestedOperation[],
  candidates: ReadonlySet<ExternalCapabilityRequestedOperation>,
): boolean {
  return operations.some((operation) => candidates.has(operation));
}

function admissionLaneFor(input: {
  ingestionReadout: ExternalCapabilityIngestionReadout;
  requestedOperations: ExternalCapabilityRequestedOperation[];
  runtimeAdapterClassDetected: boolean;
}): RuntimeAdapterBoundaryAdmissionLane {
  if (input.ingestionReadout.governanceResult.workflowStatus === 'invalid') {
    return 'REJECT_SCOPE_BOUNDARY';
  }
  if (includesAnyOperation(input.requestedOperations, PUBLIC_EXPORT_OPERATIONS)) {
    return 'PUBLIC_EXPORT_BLOCKED';
  }
  if (includesAnyOperation(input.requestedOperations, RUNTIME_ADAPTER_AUTHORITY_OPERATIONS)) {
    return 'EXECUTION_BLOCKED_PENDING_ADAPTER_APPROVAL';
  }
  if (input.runtimeAdapterClassDetected) return 'ADAPTER_BOUNDARY_REVIEW';
  if (input.ingestionReadout.governanceResult.readyForRegistry) return 'REGISTRY_REVIEW';
  return 'INTAKE_REVIEW';
}

function boundaryReasonsFor(input: {
  admissionLane: RuntimeAdapterBoundaryAdmissionLane;
  ingestionReadout: ExternalCapabilityIngestionReadout;
  runtimeAdapterClassDetected: boolean;
}): string[] {
  return Array.from(
    new Set([
      ...input.ingestionReadout.admissionProfile.blockedReasons,
      'Registry readiness is not registry authority.',
      'Runtime adapter class detection is not adapter approval.',
      'RTAD1 admits boundary review only and does not authorize install, execution, delegation, or public export.',
      ...(input.runtimeAdapterClassDetected
        ? ['Existing owner surface classified candidate capability as runtime_adapter.']
        : []),
      ...(input.admissionLane === 'REGISTRY_REVIEW'
        ? ['Registry-ready source readout still requires governed registry approval evidence.']
        : []),
      ...(input.admissionLane === 'PUBLIC_EXPORT_BLOCKED'
        ? ['Marketplace or public export operation is outside RTAD1 authority.']
        : []),
    ]),
  );
}

export function buildRuntimeAdapterBoundaryAdmissionReadout(
  input: RuntimeAdapterBoundaryAdmissionInput,
): RuntimeAdapterBoundaryAdmissionReadout {
  const ingestionReadout = resolveIngestionReadout(input);
  const requestedOperations = resolveRequestedOperations(input);
  const runtimeAdapterClassDetected =
    ingestionReadout.governanceResult.governedCapability.capabilityClass === 'runtime_adapter';
  const admissionLane = admissionLaneFor({
    ingestionReadout,
    requestedOperations,
    runtimeAdapterClassDetected,
  });

  return {
    contractVersion: MLW7_RUNTIME_ADAPTER_BOUNDARY_ADMISSION_VERSION,
    sourceReadoutVersion: MLW7_EXTERNAL_CAPABILITY_INGESTION_VERSION,
    existingOwnerSurface: 'buildExternalCapabilityIngestionReadout',
    admissionLane,
    runtimeAdapterClassDetected,
    registryReadinessIsAuthority: false,
    runtimeAdapterClassIsApproval: false,
    externalCapabilityExecutionAuthorized: false,
    runtimeAdapterAuthorized: false,
    packageInstallAuthorized: false,
    delegationApprovalAuthorized: false,
    registryAuthorityGranted: false,
    marketplacePublicationAuthorized: false,
    publicExportAuthorized: false,
    liveProviderProofAuthorized: false,
    memoryReinjectionAuthorized: false,
    automaticPromotionAuthorized: false,
    autonomousMutationAuthorized: false,
    blockedAuthorities: [
      'package_install',
      'external_execution',
      'runtime_adapter_approval',
      'delegation_approval',
      'registry_authority',
      'marketplace_publication',
      'public_export',
      'live_provider_proof',
      'memory_reinjection',
      'automatic_promotion',
      'autonomous_mutation',
    ],
    boundaryReasons: boundaryReasonsFor({
      admissionLane,
      ingestionReadout,
      runtimeAdapterClassDetected,
    }),
    ingestionReadout,
  };
}
