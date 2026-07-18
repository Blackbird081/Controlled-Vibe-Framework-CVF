import type {
  CVFCanonicalDecision,
  CVFCanonicalRisk,
} from './cross-channel-guard-contract.ts';

export const EXTERNAL_SKILL_CANDIDATE_SCREEN_VERSION = 'cvf.externalSkillCandidateScreen.c7c.v1' as const;

export type ExternalSkillSourceFamily =
  | 'hugging_face'
  | 'hermes'
  | 'memento'
  | 'agent_engineer'
  | 'skillsmp'
  | 'other';

export type ExternalSkillValueScreen = 'pass' | 'fail' | 'unknown';
export type ExternalSkillDuplicateScreen = 'merge' | 'new_candidate' | 'duplicate' | 'unknown';
export type ExternalSkillRiskScreen = 'low' | 'medium' | 'high' | 'blocked';
export type ExternalSkillDilutionRisk = 'low' | 'medium' | 'high';
export type ExternalSkillRegistryReadiness =
  | 'not_ready'
  | 'candidate_only'
  | 'normalized'
  | 'governed'
  | 'approved';

export type ExternalSkillRuntimeExpectation =
  | 'documentation_only'
  | 'command_runtime'
  | 'mcp_bridge'
  | 'sandbox_script'
  | 'api_adapter'
  | 'hybrid'
  | 'live_provider'
  | 'direct_import';

export type ExternalSkillDisposition =
  | 'ACCEPT_AS_PATTERN'
  | 'MERGE_AS_PATTERN'
  | 'CANDIDATE_NEW_PACK'
  | 'DEFER_INCOMPLETE'
  | 'DEFER_RUNTIME_GATED'
  | 'DEFER_SECRET_BOUNDARY_REQUIRED'
  | 'DEFER_EXPLICIT_APPROVAL_REQUIRED'
  | 'DEFER_NO_OWNER_SURFACE'
  | 'REJECT_DUPLICATE'
  | 'REJECT_LOW_VALUE_NOW'
  | 'REJECT_UNGOVERNABLE'
  | 'REJECT_DIRECT_IMPORT';

export type ExternalSkillMissingField =
  | 'candidate_id'
  | 'source_name'
  | 'source_reference'
  | 'source_revision_or_fingerprint'
  | 'operator_use_case'
  | 'target_user'
  | 'expected_output'
  | 'declared_tools'
  | 'declared_side_effects'
  | 'data_sensitivity'
  | 'runtime_expectation'
  | 'proposed_owner_surface'
  | 'source_family'
  | 'dilution_risk'
  | 'registry_readiness';

export type ExternalSkillCandidateState =
  | 'accepted_pattern'
  | 'merge_pattern'
  | 'new_pack_candidate'
  | 'incomplete_record'
  | 'runtime_gated'
  | 'secret_boundary_required'
  | 'explicit_approval_required'
  | 'no_owner_surface'
  | 'rejected_duplicate'
  | 'rejected_low_value'
  | 'rejected_ungovernable'
  | 'rejected_direct_import';

export interface ExternalSkillCandidateScreenRecord {
  candidateId: string;
  sourceName: string;
  sourceReference: string;
  sourceRevisionOrFingerprint: string;
  operatorUseCase: string;
  targetUser: string;
  expectedOutput: string;
  declaredTools: readonly string[];
  declaredSideEffects: readonly string[];
  dataSensitivity: 'public' | 'internal' | 'restricted' | 'sensitive' | 'unknown';
  runtimeExpectation: ExternalSkillRuntimeExpectation;
  proposedOwnerSurface: string;
  sourceFamily?: ExternalSkillSourceFamily;
  duplicateTargetPack?: string | null;
  dilutionRisk?: ExternalSkillDilutionRisk;
  registryReadiness?: ExternalSkillRegistryReadiness;
  valueScreen: ExternalSkillValueScreen;
  duplicateScreen: ExternalSkillDuplicateScreen;
  riskScreen: ExternalSkillRiskScreen;
  normalizedFieldsComplete?: boolean;
}

export interface ExternalSkillCandidateScreenReadout {
  contractVersion: typeof EXTERNAL_SKILL_CANDIDATE_SCREEN_VERSION;
  candidateId: string;
  sourceFamily: ExternalSkillSourceFamily | 'unknown';
  decision: CVFCanonicalDecision;
  riskLevel: CVFCanonicalRisk;
  candidateState: ExternalSkillCandidateState;
  disposition: ExternalSkillDisposition;
  missingFields: readonly ExternalSkillMissingField[];
  actionApprovalRequired: boolean;
  normalizedFieldsComplete: boolean;
  runtimeExecutionAuthorized: false;
  registryPublicationAuthorized: false;
  externalFetchAuthorized: false;
  nextSafeAction: string;
  reasons: readonly string[];
  boundaries: readonly string[];
}

const TOOL_RUNTIME_EXPECTATIONS = new Set<ExternalSkillRuntimeExpectation>([
  'command_runtime',
  'mcp_bridge',
  'sandbox_script',
  'api_adapter',
  'hybrid',
  'live_provider',
]);

const SECRET_OR_APPROVAL_SIDE_EFFECTS = new Set([
  'uses_credentials',
  'secret',
  'secrets',
  'credential',
  'credentials',
]);

const EXTERNAL_WRITE_SIDE_EFFECTS = new Set([
  'writes_remote',
  'publishes_publicly',
  'external_write',
  'publish',
  'database_write',
  'database_export',
]);

export function evaluateExternalSkillCandidateScreen(
  record: ExternalSkillCandidateScreenRecord,
): ExternalSkillCandidateScreenReadout {
  const missingFields = collectMissingFields(record);
  const candidateId = safeText(record.candidateId) || 'unknown';

  if (missingFields.length > 0) {
    return buildReadout(record, {
      candidateId,
      decision: 'BLOCK',
      riskLevel: 'R3',
      candidateState: 'incomplete_record',
      disposition: 'DEFER_INCOMPLETE',
      missingFields,
      actionApprovalRequired: false,
      reasons: missingFields.map(field => `missing_${field}`),
    });
  }

  if (record.runtimeExpectation === 'direct_import') {
    return buildReadout(record, {
      candidateId,
      decision: 'BLOCK',
      riskLevel: 'R4',
      candidateState: 'rejected_direct_import',
      disposition: 'REJECT_DIRECT_IMPORT',
      missingFields,
      actionApprovalRequired: false,
      reasons: ['direct_import_forbidden'],
    });
  }

  if (hasUnknownOrHiddenSideEffect(record)) {
    return buildReadout(record, {
      candidateId,
      decision: 'BLOCK',
      riskLevel: 'R4',
      candidateState: 'rejected_ungovernable',
      disposition: 'REJECT_UNGOVERNABLE',
      missingFields,
      actionApprovalRequired: false,
      reasons: ['hidden_or_unknown_side_effects'],
    });
  }

  if (record.valueScreen !== 'pass') {
    return buildReadout(record, {
      candidateId,
      decision: 'BLOCK',
      riskLevel: resolveRiskLevel(record),
      candidateState: 'rejected_low_value',
      disposition: 'REJECT_LOW_VALUE_NOW',
      missingFields,
      actionApprovalRequired: false,
      reasons: ['value_screen_not_passed'],
    });
  }

  if (record.duplicateScreen === 'duplicate') {
    return buildReadout(record, {
      candidateId,
      decision: 'BLOCK',
      riskLevel: resolveRiskLevel(record),
      candidateState: 'rejected_duplicate',
      disposition: 'REJECT_DUPLICATE',
      missingFields,
      actionApprovalRequired: false,
      reasons: ['duplicate_without_new_outcome'],
    });
  }

  if (!safeText(record.proposedOwnerSurface)) {
    return buildReadout(record, {
      candidateId,
      decision: 'ESCALATE',
      riskLevel: resolveRiskLevel(record),
      candidateState: 'no_owner_surface',
      disposition: 'DEFER_NO_OWNER_SURFACE',
      missingFields,
      actionApprovalRequired: false,
      reasons: ['owner_surface_required'],
    });
  }

  if (needsSecretBoundary(record)) {
    return buildReadout(record, {
      candidateId,
      decision: 'ESCALATE',
      riskLevel: 'R3',
      candidateState: 'secret_boundary_required',
      disposition: 'DEFER_SECRET_BOUNDARY_REQUIRED',
      missingFields,
      actionApprovalRequired: true,
      reasons: ['secret_or_credential_boundary_required'],
    });
  }

  if (needsExplicitApproval(record)) {
    return buildReadout(record, {
      candidateId,
      decision: 'ESCALATE',
      riskLevel: 'R3',
      candidateState: 'explicit_approval_required',
      disposition: 'DEFER_EXPLICIT_APPROVAL_REQUIRED',
      missingFields,
      actionApprovalRequired: true,
      reasons: ['external_write_or_publish_requires_approval'],
    });
  }

  if (needsRuntimeGate(record)) {
    return buildReadout(record, {
      candidateId,
      decision: 'ESCALATE',
      riskLevel: 'R3',
      candidateState: 'runtime_gated',
      disposition: 'DEFER_RUNTIME_GATED',
      missingFields,
      actionApprovalRequired: true,
      reasons: ['runtime_tool_provider_or_database_gate_required'],
    });
  }

  if (record.duplicateScreen === 'new_candidate') {
    return buildReadout(record, {
      candidateId,
      decision: 'ESCALATE',
      riskLevel: resolveRiskLevel(record),
      candidateState: 'new_pack_candidate',
      disposition: 'CANDIDATE_NEW_PACK',
      missingFields,
      actionApprovalRequired: false,
      reasons: ['new_pack_requires_fresh_gc018'],
    });
  }

  if (record.duplicateScreen === 'merge') {
    return buildReadout(record, {
      candidateId,
      decision: 'ALLOW',
      riskLevel: resolveRiskLevel(record),
      candidateState: 'merge_pattern',
      disposition: 'MERGE_AS_PATTERN',
      missingFields,
      actionApprovalRequired: false,
      reasons: ['merge_with_existing_pack_or_screening_pattern'],
    });
  }

  return buildReadout(record, {
    candidateId,
    decision: 'ALLOW',
    riskLevel: resolveRiskLevel(record),
    candidateState: 'accepted_pattern',
    disposition: 'ACCEPT_AS_PATTERN',
    missingFields,
    actionApprovalRequired: false,
    reasons: ['accepted_as_docs_only_pattern'],
  });
}

function collectMissingFields(record: ExternalSkillCandidateScreenRecord): ExternalSkillMissingField[] {
  const missing: ExternalSkillMissingField[] = [];

  if (!safeText(record.candidateId)) missing.push('candidate_id');
  if (!safeText(record.sourceName)) missing.push('source_name');
  if (!safeText(record.sourceReference)) missing.push('source_reference');
  if (!safeText(record.sourceRevisionOrFingerprint)) missing.push('source_revision_or_fingerprint');
  if (!safeText(record.operatorUseCase)) missing.push('operator_use_case');
  if (!safeText(record.targetUser)) missing.push('target_user');
  if (!safeText(record.expectedOutput)) missing.push('expected_output');
  if (!record.declaredTools || record.declaredTools.length === 0) missing.push('declared_tools');
  if (!record.declaredSideEffects || record.declaredSideEffects.length === 0) missing.push('declared_side_effects');
  if (!safeText(record.dataSensitivity)) missing.push('data_sensitivity');
  if (!safeText(record.runtimeExpectation)) missing.push('runtime_expectation');
  if (!safeText(record.proposedOwnerSurface)) missing.push('proposed_owner_surface');
  if (!record.sourceFamily) missing.push('source_family');
  if (!record.dilutionRisk) missing.push('dilution_risk');
  if (!record.registryReadiness) missing.push('registry_readiness');

  return missing;
}

function buildReadout(
  record: ExternalSkillCandidateScreenRecord,
  result: {
    candidateId: string;
    decision: CVFCanonicalDecision;
    riskLevel: CVFCanonicalRisk;
    candidateState: ExternalSkillCandidateState;
    disposition: ExternalSkillDisposition;
    missingFields: readonly ExternalSkillMissingField[];
    actionApprovalRequired: boolean;
    reasons: readonly string[];
  },
): ExternalSkillCandidateScreenReadout {
  return {
    contractVersion: EXTERNAL_SKILL_CANDIDATE_SCREEN_VERSION,
    candidateId: result.candidateId,
    sourceFamily: record.sourceFamily ?? 'unknown',
    decision: result.decision,
    riskLevel: result.riskLevel,
    candidateState: result.candidateState,
    disposition: result.disposition,
    missingFields: result.missingFields,
    actionApprovalRequired: result.actionApprovalRequired,
    normalizedFieldsComplete: Boolean(record.normalizedFieldsComplete),
    runtimeExecutionAuthorized: false,
    registryPublicationAuthorized: false,
    externalFetchAuthorized: false,
    nextSafeAction: resolveNextSafeAction(result.disposition),
    reasons: result.reasons,
    boundaries: [
      'readout_only',
      'no_external_skill_import',
      'no_runtime_execution',
      'no_registry_publication',
      'no_external_fetch',
      'no_provider_call',
      'no_mcp_or_database_execution',
      'no_receipt_envelope_change',
    ],
  };
}

function resolveRiskLevel(record: ExternalSkillCandidateScreenRecord): CVFCanonicalRisk {
  switch (record.riskScreen) {
    case 'low':
      return record.dataSensitivity === 'public' ? 'R1' : 'R2';
    case 'medium':
      return 'R2';
    case 'high':
      return 'R3';
    case 'blocked':
      return 'R4';
  }
}

function needsRuntimeGate(record: ExternalSkillCandidateScreenRecord): boolean {
  if (TOOL_RUNTIME_EXPECTATIONS.has(record.runtimeExpectation)) return true;

  const declaredTools = normalizeList(record.declaredTools);
  const sideEffects = normalizeList(record.declaredSideEffects);
  const combined = [...declaredTools, ...sideEffects].join(' ');

  return [
    'tool',
    'mcp',
    'cli',
    'script',
    'model',
    'provider',
    'browser',
    'database',
    'db',
    'api_adapter',
  ].some(marker => combined.includes(marker));
}

function needsSecretBoundary(record: ExternalSkillCandidateScreenRecord): boolean {
  const sideEffects = normalizeList(record.declaredSideEffects);
  return sideEffects.some(effect => SECRET_OR_APPROVAL_SIDE_EFFECTS.has(effect));
}

function needsExplicitApproval(record: ExternalSkillCandidateScreenRecord): boolean {
  const sideEffects = normalizeList(record.declaredSideEffects);
  return sideEffects.some(effect => EXTERNAL_WRITE_SIDE_EFFECTS.has(effect));
}

function hasUnknownOrHiddenSideEffect(record: ExternalSkillCandidateScreenRecord): boolean {
  const sideEffects = normalizeList(record.declaredSideEffects);
  return sideEffects.some(effect => effect === 'unknown' || effect === 'hidden' || effect === 'unclear');
}

function resolveNextSafeAction(disposition: ExternalSkillDisposition): string {
  switch (disposition) {
    case 'ACCEPT_AS_PATTERN':
      return 'Use as a docs-only pattern or screening input; do not import or execute the skill.';
    case 'MERGE_AS_PATTERN':
      return 'Merge the pattern into the existing owner surface with a bounded work order.';
    case 'CANDIDATE_NEW_PACK':
      return 'Open a fresh GC-018 before creating or modifying any product skill pack.';
    case 'DEFER_INCOMPLETE':
      return 'Complete the missing screening fields before reassessing this candidate.';
    case 'DEFER_RUNTIME_GATED':
      return 'Open a runtime/tool/provider-gated work order before any execution or adapter work.';
    case 'DEFER_SECRET_BOUNDARY_REQUIRED':
      return 'Define secret handling and approval boundaries before continuing.';
    case 'DEFER_EXPLICIT_APPROVAL_REQUIRED':
      return 'Obtain explicit approval and side-effect controls before continuing.';
    case 'DEFER_NO_OWNER_SURFACE':
      return 'Map the candidate to an existing CVF owner surface or defer it.';
    case 'REJECT_DUPLICATE':
      return 'Do not import; use the existing certified pack or pattern.';
    case 'REJECT_LOW_VALUE_NOW':
      return 'Reject for now; revisit only with a concrete higher-value non-coder job.';
    case 'REJECT_UNGOVERNABLE':
      return 'Reject until side effects and authority boundaries are governable.';
    case 'REJECT_DIRECT_IMPORT':
      return 'Do not import directly; convert only through CVF screening and normalization.';
  }
}

function normalizeList(values: readonly string[]): string[] {
  return values.map(value => safeText(value).toLowerCase()).filter(Boolean);
}

function safeText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}
