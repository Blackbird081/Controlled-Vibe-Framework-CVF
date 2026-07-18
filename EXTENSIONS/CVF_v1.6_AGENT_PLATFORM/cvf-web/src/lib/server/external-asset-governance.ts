import type { CVFRiskLevel } from 'cvf-guard-contract';
import {
  createExternalAssetIntakeProfileContract,
  createPlannerTriggerHeuristicsContract,
  createRegistryReadyGovernedAssetContract,
  createSemanticPolicyIntentRegistryContract,
  createW7NormalizedAssetCandidateContract,
  createWindowsCompatibilityEvaluationContract,
  type ExternalAssetIntakeProfile,
  type PlannerTriggerCandidate,
  type RegistryReadyApprovalState,
  type SemanticPolicyIntentCandidate,
  type W7RoutingPhaseHint,
  type WindowsCompatibilityEvaluationRequest,
} from 'cvf-control-plane-foundation';
import {
  createProvisionalEvaluationSignalContract,
  createStage1DiagnosticPacketContract,
  type Stage1RuntimeIndicator,
} from 'cvf-learning-plane-foundation';
import {
  buildAgentContinuityDelegationRecord,
  buildBoundaryFirstGovernanceRecord,
  buildGovernedCapabilityRecord,
  buildGovernedContextProfileMetadata,
  buildScopedKnowledgeProviderBoundary,
  validateGovernedCapabilityRecord,
  type AgentContinuityDelegationRecord,
  type BoundaryFirstGovernanceRecord,
  type GovernedCapabilityClass,
  type GovernedCapabilityRecord,
  type GovernedCapabilitySourceClass,
  type GovernedCapabilitySandboxTier,
  type GovernedContextProfileMetadata,
  type ScopedKnowledgeProviderBoundary,
  type CapabilityRecordValidation,
} from '@/lib/cvf-add-runtime-doctrine';

export interface ExternalAssetGovernancePlannerInput {
  text?: string;
  candidates?: PlannerTriggerCandidate[];
  availableInputs?: string[];
  governanceChainIntact?: boolean;
}

export interface ExternalAssetGovernanceCompileInput {
  nameHint?: string;
  versionHint?: string;
  triggers?: string[];
  domain?: string;
  phaseHints?: W7RoutingPhaseHint[];
}

export interface ExternalAssetGovernanceRegistryInput {
  governanceOwner?: string;
  approvalState?: RegistryReadyApprovalState;
  riskLevel?: CVFRiskLevel;
  traceRequired?: boolean;
  evaluationEnabled?: boolean;
  registryRefs?: string[];
}

export interface ExternalAssetGovernanceDiagnosticInput {
  taskId?: string;
  runId?: string;
  laneId?: string;
  provider?: string;
  model?: string;
  runtimeIndicator?: Stage1RuntimeIndicator;
  runtimeNotes?: string;
}

export interface ExternalAssetGovernanceRequest {
  profile: ExternalAssetIntakeProfile;
  semanticItems?: Array<string | SemanticPolicyIntentCandidate>;
  planner?: ExternalAssetGovernancePlannerInput;
  compile?: ExternalAssetGovernanceCompileInput;
  registry?: ExternalAssetGovernanceRegistryInput;
  windows?: Omit<WindowsCompatibilityEvaluationRequest, 'intakeValidation'>;
  diagnostic?: ExternalAssetGovernanceDiagnosticInput;
}

export type ExternalAssetWorkflowStatus = 'invalid' | 'review_required' | 'registry_ready';

export interface ExternalAssetGovernanceResult {
  workflowStatus: ExternalAssetWorkflowStatus;
  readyForRegistry: boolean;
  warnings: string[];
  governedCapability: GovernedCapabilityRecord;
  governedCapabilityValidation: CapabilityRecordValidation;
  boundaryFirstGovernance: BoundaryFirstGovernanceRecord;
  governedContextProfile: GovernedContextProfileMetadata;
  continuityDelegation: AgentContinuityDelegationRecord;
  scopedKnowledgeProvider: ScopedKnowledgeProviderBoundary;
  intake: ReturnType<ReturnType<typeof createExternalAssetIntakeProfileContract>['validate']>;
  semanticPolicy: ReturnType<ReturnType<typeof createSemanticPolicyIntentRegistryContract>['classify']> | null;
  plannerTrigger: ReturnType<ReturnType<typeof createPlannerTriggerHeuristicsContract>['evaluate']>;
  provisionalSignal: ReturnType<ReturnType<typeof createProvisionalEvaluationSignalContract>['captureWeakTriggerDefinition']>;
  normalizedCandidate: ReturnType<ReturnType<typeof createW7NormalizedAssetCandidateContract>['compile']>;
  registryReady: ReturnType<ReturnType<typeof createRegistryReadyGovernedAssetContract>['prepare']>;
  windowsCompatibility: ReturnType<ReturnType<typeof createWindowsCompatibilityEvaluationContract>['evaluate']> | null;
  diagnosticPacket: ReturnType<ReturnType<typeof createStage1DiagnosticPacketContract>['packet']>;
}

const DEFAULT_GOVERNANCE_OWNER = 'cvf-operator';
const DEFAULT_APPROVAL_STATE: RegistryReadyApprovalState = 'draft';
const DEFAULT_RISK_LEVEL: CVFRiskLevel = 'R1';

function normalizeText(value: string | undefined): string {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeList(values: string[] | undefined): string[] {
  if (!Array.isArray(values)) {
    return [];
  }

  return Array.from(
    new Set(
      values
        .map((value) => normalizeText(value))
        .filter((value) => value.length > 0),
    ),
  );
}

function buildDefaultPlannerCandidates(
  profile: ExternalAssetIntakeProfile,
  riskLevel: CVFRiskLevel,
): PlannerTriggerCandidate[] {
  return [
    {
      candidateRef: `source:${profile.source_ref}`,
      triggerPhrases: [profile.description_or_trigger],
      riskLevel,
    },
  ];
}

function deriveCompileTriggers(
  request: ExternalAssetGovernanceRequest,
  profile: ExternalAssetIntakeProfile,
): string[] {
  const explicitTriggers = normalizeList(request.compile?.triggers);
  if (explicitTriggers.length > 0) {
    return explicitTriggers;
  }

  const plannerText = normalizeText(request.planner?.text);
  if (plannerText.length > 0) {
    return [plannerText];
  }

  return [profile.description_or_trigger];
}

function mapSourceClass(sourceKind: ExternalAssetIntakeProfile['source_kind']): GovernedCapabilitySourceClass {
  if (sourceKind === 'repo' || sourceKind === 'folder' || sourceKind === 'document_bundle') {
    return sourceKind;
  }

  return 'other';
}

function mapCapabilityClass(candidateType: ExternalAssetIntakeProfile['candidate_asset_type']): GovernedCapabilityClass {
  if (candidateType === 'W7ToolAsset') return 'tool';
  if (candidateType === 'W7SkillAsset') return 'skill';
  if (candidateType === 'W7AgentAsset') return 'agent_harness';
  if (candidateType === 'W7ContextAsset' || candidateType === 'W7LearningAsset') return 'knowledge_helper';
  if (candidateType === 'W7CommandAsset') return 'runtime_adapter';
  if (candidateType === 'W7PlannerAsset') return 'workflow';

  return 'workflow';
}

function deriveSandboxTier(profile: ExternalAssetIntakeProfile): GovernedCapabilitySandboxTier {
  if (profile.source_kind === 'document_bundle') return 'read_only';
  if (profile.source_kind === 'repo' || profile.source_kind === 'folder') return 'workspace_bound';
  if (profile.candidate_asset_type === 'W7ToolAsset' || profile.candidate_asset_type === 'W7CommandAsset') {
    return 'operator_bound';
  }

  return 'none';
}

function deriveEvidenceSensitivity(riskLevel: CVFRiskLevel): GovernedContextProfileMetadata['evidenceSensitivity'] {
  if (riskLevel === 'R3') return 'high';
  if (riskLevel === 'R2' || riskLevel === 'R1') return 'medium';
  return 'low';
}

function deriveKnowledgeSourceClass(
  profile: ExternalAssetIntakeProfile,
): ScopedKnowledgeProviderBoundary['sourceClass'] {
  if (profile.source_ref.startsWith('docs/reference/')) return 'canon';
  if (profile.source_ref.startsWith('.private_reference/')) return 'private_reference';
  if (profile.source_quality === 'internal_design_draft') return 'example';
  return 'external_reference';
}

function buildWarnings(
  result: Omit<ExternalAssetGovernanceResult, 'warnings' | 'readyForRegistry' | 'workflowStatus'>,
): string[] {
  const warnings: string[] = [];

  warnings.push(
    ...result.intake.issues.map(
      (issue) => `INTAKE_${issue.code}_${issue.field.toUpperCase()}`,
    ),
  );

  warnings.push(
    ...result.governedCapabilityValidation.issues.map(
      (issue) => `GOVERNED_CAPABILITY_${issue}`,
    ),
  );

  if (result.semanticPolicy !== null) {
    warnings.push(
      ...result.semanticPolicy.unknownItems.map((item) => `SEMANTIC_UNKNOWN_${item}`),
      ...result.semanticPolicy.classMismatches.map(
        (mismatch) => `SEMANTIC_CLASS_MISMATCH_${mismatch.semanticItem}`,
      ),
    );
  }

  if (result.plannerTrigger.clarification_needed) {
    warnings.push('PLANNER_CLARIFICATION_REQUIRED');
  }

  warnings.push(
    ...result.plannerTrigger.negative_matches.map(
      (match) => `PLANNER_NEGATIVE_MATCH_${match.toUpperCase().replace(/\s+/g, '_')}`,
    ),
  );

  if (result.provisionalSignal !== null) {
    warnings.push(`PROVISIONAL_SIGNAL_${result.provisionalSignal.name.toUpperCase()}`);
  }

  warnings.push(
    ...result.normalizedCandidate.issues.map(
      (issue) => `NORMALIZATION_${issue.code}_${issue.field.toUpperCase()}`,
    ),
    ...result.registryReady.issues.map(
      (issue) => `REGISTRY_${issue.code}_${issue.field.toUpperCase()}`,
    ),
  );

  if (result.windowsCompatibility !== null) {
    warnings.push(...result.windowsCompatibility.blockers);
  }

  return Array.from(new Set(warnings));
}

export function prepareExternalAssetGovernance(
  request: ExternalAssetGovernanceRequest,
): ExternalAssetGovernanceResult {
  const intakeContract = createExternalAssetIntakeProfileContract();
  const semanticRegistry = createSemanticPolicyIntentRegistryContract();
  const plannerContract = createPlannerTriggerHeuristicsContract();
  const provisionalSignalContract = createProvisionalEvaluationSignalContract();
  const normalizedCandidateContract = createW7NormalizedAssetCandidateContract();
  const registryReadyContract = createRegistryReadyGovernedAssetContract();
  const windowsCompatibilityContract = createWindowsCompatibilityEvaluationContract();
  const diagnosticPacketContract = createStage1DiagnosticPacketContract();

  const intake = intakeContract.validate(request.profile);
  const registryInput = request.registry ?? {};
  const riskLevel = registryInput.riskLevel ?? DEFAULT_RISK_LEVEL;
  const plannerCandidates =
    request.planner?.candidates && request.planner.candidates.length > 0
      ? request.planner.candidates
      : buildDefaultPlannerCandidates(intake.normalizedProfile, riskLevel);

  const plannerTrigger = plannerContract.evaluate({
    text: normalizeText(request.planner?.text) || intake.normalizedProfile.description_or_trigger,
    candidates: plannerCandidates,
    availableInputs: request.planner?.availableInputs,
    governanceChainIntact: request.planner?.governanceChainIntact,
  });

  const provisionalSignal = provisionalSignalContract.captureWeakTriggerDefinition({
    sourceRef: intake.normalizedProfile.source_ref,
    textSample:
      normalizeText(request.planner?.text) || intake.normalizedProfile.description_or_trigger,
    candidateRefs: plannerTrigger.candidate_refs,
    confidence: plannerTrigger.confidence,
    missingInputs: plannerTrigger.missing_inputs,
    clarificationNeeded: plannerTrigger.clarification_needed,
    negativeMatches: plannerTrigger.negative_matches,
    phase: 'DESIGN',
  });

  const semanticPolicy =
    request.semanticItems !== undefined
      ? semanticRegistry.classify({ items: request.semanticItems })
      : null;

  const normalizedCandidate = normalizedCandidateContract.compile({
    intakeValidation: intake,
    nameHint: request.compile?.nameHint,
    versionHint: request.compile?.versionHint,
    triggers: deriveCompileTriggers(request, intake.normalizedProfile),
    domain: request.compile?.domain,
    phaseHints: request.compile?.phaseHints,
  });

  const registryReady = registryReadyContract.prepare({
    compileResult: normalizedCandidate,
    governanceOwner: registryInput.governanceOwner ?? DEFAULT_GOVERNANCE_OWNER,
    approvalState: registryInput.approvalState ?? DEFAULT_APPROVAL_STATE,
    riskLevel,
    traceRequired: registryInput.traceRequired,
    evaluationEnabled: registryInput.evaluationEnabled,
    registryRefs: registryInput.registryRefs,
  });

  const windowsCompatibility =
    request.windows !== undefined
      ? windowsCompatibilityContract.evaluate({
          intakeValidation: intake,
          ...request.windows,
        })
      : null;

  const diagnosticPacket = diagnosticPacketContract.packet({
    taskId: request.diagnostic?.taskId,
    runId: request.diagnostic?.runId,
    laneId: request.diagnostic?.laneId,
    provider: request.diagnostic?.provider,
    model: request.diagnostic?.model,
    runtimeIndicator: request.diagnostic?.runtimeIndicator,
    runtimeNotes: request.diagnostic?.runtimeNotes,
    intakeValidation: intake,
    plannerTrigger,
    provisionalSignal,
  });

  const governedCapability = buildGovernedCapabilityRecord({
    capabilityName: request.compile?.nameHint ?? intake.normalizedProfile.description_or_trigger,
    sourceProvenance: intake.normalizedProfile.source_ref,
    sourceClass: mapSourceClass(intake.normalizedProfile.source_kind),
    capabilityClass: mapCapabilityClass(intake.normalizedProfile.candidate_asset_type),
    riskClass: riskLevel,
    ownerSurface: registryInput.governanceOwner ?? DEFAULT_GOVERNANCE_OWNER,
    allowedOperations: [
      'record provenance',
      'normalize candidate',
      'evaluate registry readiness',
    ],
    blockedOperations: [
      'execute without approved runtime adapter',
      'bypass policy binding',
    ],
    sandboxTier: deriveSandboxTier(intake.normalizedProfile),
    policyBinding: 'CVF_GOVERNED_CAPABILITY_INTAKE_DOCTRINE_2026-05-07',
    evidenceRequirement: registryInput.evaluationEnabled ? 'unit' : 'doc_review',
    freshnessStatus: intake.normalizedProfile.officially_verified ? 'current' : 'unknown',
    evaluationStatus: intake.valid ? 'proposed' : 'rejected',
  });
  const governedCapabilityValidation = validateGovernedCapabilityRecord(governedCapability);
  const boundaryFirstGovernance = buildBoundaryFirstGovernanceRecord({
    policyClass: intake.valid ? 'restricted_execution_path' : 'hard_prohibition',
    reasons: intake.valid
      ? ['External capability may proceed only through governed asset intake path.']
      : ['Invalid intake shape blocks capability promotion.'],
    pathLocked: true,
    restrictedPathCount: 1,
  });
  const readyForRegistry =
    intake.valid &&
    normalizedCandidate.valid &&
    registryReady.valid &&
    (semanticPolicy === null || semanticPolicy.valid) &&
    !plannerTrigger.clarification_needed &&
    provisionalSignal === null &&
    (windowsCompatibility === null ||
      windowsCompatibility.classification !== 'REJECTED_FOR_WINDOWS_TARGET');

  const workflowStatus: ExternalAssetWorkflowStatus = readyForRegistry
    ? 'registry_ready'
    : !intake.valid
      ? 'invalid'
      : 'review_required';

  const governedContextProfile = buildGovernedContextProfileMetadata({
    taskContextType: 'external_asset_governance_prepare',
    capabilityNeed: mapCapabilityClass(intake.normalizedProfile.candidate_asset_type),
    skillMatch: intake.valid && !plannerTrigger.clarification_needed ? 'high' : 'medium',
    contextBudget: intake.normalizedProfile.source_kind === 'document_bundle' ? 'compact' : 'standard',
    freshnessRequirement: intake.normalizedProfile.officially_verified ? 'current' : 'unknown',
    reuseCandidate: intake.valid,
    reinjectionPolicy: 'artifact_pointer',
    handoffNeed: workflowStatus === 'registry_ready' ? 'closure' : 'phase_checkpoint',
    evidenceSensitivity: deriveEvidenceSensitivity(riskLevel),
    ownerSurfaceHint: registryInput.governanceOwner ?? DEFAULT_GOVERNANCE_OWNER,
  });
  const continuityDelegation = buildAgentContinuityDelegationRecord({
    phase: workflowStatus === 'registry_ready' ? 'closure' : 'registry_review',
    checkpointRequired: true,
    handoffUpdateRequired: true,
    delegationAllowed: false,
    delegationAuthority: 'none',
    artifactRefs: [
      'docs/reference/CVF_GOVERNED_CAPABILITY_INTAKE_DOCTRINE_2026-05-07.md',
      'docs/reference/CVF_BOUNDARY_FIRST_GOVERNANCE_DOCTRINE_2026-05-07.md',
    ],
    blockedDelegationReasons: [
      'External capability intake does not grant worker/runtime authority by itself.',
    ],
    nextOwnerSurface: registryInput.governanceOwner ?? DEFAULT_GOVERNANCE_OWNER,
  });
  const scopedKnowledgeProvider = buildScopedKnowledgeProviderBoundary({
    providerId: `source:${intake.normalizedProfile.source_ref}`,
    sourcePath: intake.normalizedProfile.source_ref,
    sourceClass: deriveKnowledgeSourceClass(intake.normalizedProfile),
    freshness: intake.normalizedProfile.officially_verified ? 'current' : 'unknown',
    confidence: intake.valid ? 'medium' : 'low',
    scopeBoundary: 'External asset intake context only; no policy authority.',
    retrievalReason: intake.normalizedProfile.description_or_trigger,
    ownerSurface: 'knowledge-layer',
  });

  const resultWithoutWarnings = {
    governedCapability,
    governedCapabilityValidation,
    boundaryFirstGovernance,
    governedContextProfile,
    continuityDelegation,
    scopedKnowledgeProvider,
    intake,
    semanticPolicy,
    plannerTrigger,
    provisionalSignal,
    normalizedCandidate,
    registryReady,
    windowsCompatibility,
    diagnosticPacket,
  };

  const warnings = buildWarnings(resultWithoutWarnings);

  return {
    workflowStatus,
    readyForRegistry,
    warnings,
    ...resultWithoutWarnings,
  };
}
