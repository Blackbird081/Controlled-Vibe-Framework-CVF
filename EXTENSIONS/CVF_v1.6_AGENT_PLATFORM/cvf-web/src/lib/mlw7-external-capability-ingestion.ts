import {
  prepareExternalAssetGovernance,
  type ExternalAssetGovernanceRequest,
  type ExternalAssetGovernanceResult,
} from '@/lib/server/external-asset-governance';

export const MLW7_EXTERNAL_CAPABILITY_INGESTION_VERSION =
  'cvf.mlw7.externalCapabilityIngestion.rt1.v1';

export type ExternalCapabilityCandidateClass =
  | 'HERMES_AGENT'
  | 'HUGGINGFACE_MODEL_OR_SPACE'
  | 'CORTEX_BRIDGE'
  | 'DEEPAGENTS_AGENT'
  | 'EXTERNAL_PROVIDER'
  | 'GENERIC_EXTERNAL_CAPABILITY';

export type ExternalCapabilityAdmissionDisposition =
  | 'ACCEPT_FOR_GOVERNED_INTAKE_REVIEW'
  | 'DEFER_TO_SEPARATE_RUNTIME_TRANCHE'
  | 'REJECT_SCOPE_BOUNDARY';

export type ExternalCapabilityRequestedOperation =
  | 'document_review'
  | 'evaluate_metadata'
  | 'install'
  | 'execute'
  | 'register_authority'
  | 'delegate'
  | 'marketplace_publish';

export interface ExternalCapabilitySignal {
  sourceLabel: string;
  sourceRef: string;
  summary: string;
}

export interface ExternalCapabilityIngestionReadout {
  contractVersion: typeof MLW7_EXTERNAL_CAPABILITY_INGESTION_VERSION;
  externalCapabilityCandidateClass: ExternalCapabilityCandidateClass;
  admissionProfile: {
    disposition: ExternalCapabilityAdmissionDisposition;
    existingOwnerSurface: 'prepareExternalAssetGovernance';
    workflowStatus: ExternalAssetGovernanceResult['workflowStatus'];
    readyForRegistry: boolean;
    riskLevel: string;
    evidencePointers: string[];
    blockedReasons: string[];
  };
  noInstallNoExecuteInvariant: {
    packageInstallAuthorized: false;
    externalExecutionAuthorized: false;
    delegationApprovalAuthorized: false;
    registryAuthorityGranted: false;
    marketplacePublicationAuthorized: false;
    runtimeAdapterAuthorized: false;
  };
  governanceResult: ExternalAssetGovernanceResult;
  sourceSignals: ExternalCapabilitySignal[];
  autonomousMutationAuthorized: false;
}

const RUNTIME_SCOPE_OPERATIONS: ReadonlySet<ExternalCapabilityRequestedOperation> =
  new Set(['install', 'execute', 'register_authority', 'delegate', 'marketplace_publish']);

function classifyCandidate(input: ExternalAssetGovernanceRequest, sourceSignals: ExternalCapabilitySignal[]) {
  const haystack = [
    input.profile.source_ref,
    input.profile.description_or_trigger,
    input.profile.provenance_notes,
    ...sourceSignals.flatMap((signal) => [signal.sourceLabel, signal.sourceRef, signal.summary]),
  ]
    .join(' ')
    .toLowerCase();

  if (haystack.includes('hermes')) return 'HERMES_AGENT';
  if (haystack.includes('huggingface') || haystack.includes('hf.co') || haystack.includes('hf ')) {
    return 'HUGGINGFACE_MODEL_OR_SPACE';
  }
  if (haystack.includes('cortex')) return 'CORTEX_BRIDGE';
  if (haystack.includes('deepagents') || haystack.includes('deep agents')) return 'DEEPAGENTS_AGENT';
  if (haystack.includes('provider')) return 'EXTERNAL_PROVIDER';
  return 'GENERIC_EXTERNAL_CAPABILITY';
}

function blockedRuntimeOperations(operations: ExternalCapabilityRequestedOperation[]): string[] {
  return operations
    .filter((operation) => RUNTIME_SCOPE_OPERATIONS.has(operation))
    .map((operation) => `RUNTIME_SCOPE_OPERATION_${operation.toUpperCase()}_NOT_AUTHORIZED`);
}

function dispositionFor(input: {
  governanceResult: ExternalAssetGovernanceResult;
  runtimeBlocks: string[];
}): ExternalCapabilityAdmissionDisposition {
  if (input.governanceResult.workflowStatus === 'invalid') return 'REJECT_SCOPE_BOUNDARY';
  if (input.runtimeBlocks.length > 0) return 'DEFER_TO_SEPARATE_RUNTIME_TRANCHE';
  return 'ACCEPT_FOR_GOVERNED_INTAKE_REVIEW';
}

export function buildExternalCapabilityIngestionReadout(input: {
  request: ExternalAssetGovernanceRequest;
  sourceSignals?: ExternalCapabilitySignal[];
  requestedOperations?: ExternalCapabilityRequestedOperation[];
}): ExternalCapabilityIngestionReadout {
  const governanceResult = prepareExternalAssetGovernance(input.request);
  const sourceSignals = input.sourceSignals ?? [];
  const requestedOperations = input.requestedOperations ?? ['document_review', 'evaluate_metadata'];
  const runtimeBlocks = blockedRuntimeOperations(requestedOperations);
  const blockedReasons = Array.from(
    new Set([
      ...governanceResult.continuityDelegation.blockedDelegationReasons,
      ...governanceResult.governedCapability.blockedOperations,
      ...runtimeBlocks,
    ]),
  );

  return {
    contractVersion: MLW7_EXTERNAL_CAPABILITY_INGESTION_VERSION,
    externalCapabilityCandidateClass: classifyCandidate(input.request, sourceSignals),
    admissionProfile: {
      disposition: dispositionFor({ governanceResult, runtimeBlocks }),
      existingOwnerSurface: 'prepareExternalAssetGovernance',
      workflowStatus: governanceResult.workflowStatus,
      readyForRegistry: governanceResult.readyForRegistry,
      riskLevel: governanceResult.governedCapability.riskClass,
      evidencePointers: [
        `source:${input.request.profile.source_ref}`,
        'owner:prepareExternalAssetGovernance',
        ...sourceSignals.map((signal) => `signal:${signal.sourceRef}`),
      ],
      blockedReasons,
    },
    noInstallNoExecuteInvariant: {
      packageInstallAuthorized: false,
      externalExecutionAuthorized: false,
      delegationApprovalAuthorized: false,
      registryAuthorityGranted: false,
      marketplacePublicationAuthorized: false,
      runtimeAdapterAuthorized: false,
    },
    governanceResult,
    sourceSignals,
    autonomousMutationAuthorized: false,
  };
}
