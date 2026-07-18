import { buildContextBudgetReadout, type ContextBudgetReadout } from '@/lib/context-budget-readout';
import { buildLearningPlaneReadout, type LearningPlaneReadout } from '@/lib/learning-plane-readout';

export const MLW8_EFFICIENCY_OVERCONSTRAINT_FEEDBACK_VERSION =
  'cvf.mlw8.efficiencyOverconstraintFeedback.rt1.v1';

export type EfficiencyFeedbackClass =
  | 'CONTEXT_PRESSURE'
  | 'VERBOSITY_PRESSURE'
  | 'COST_PRESSURE'
  | 'NO_MATCH_PRESSURE'
  | 'EVIDENCE_FRICTION'
  | 'OPERATOR_FRICTION'
  | 'NO_EFFICIENCY_SIGNAL';

export type OverconstraintFeedbackClass =
  | 'APPROVAL_FRICTION'
  | 'POLICY_AMBIGUITY'
  | 'DLP_OR_SAFETY_FRICTION'
  | 'NO_OVERCONSTRAINT_SIGNAL';

export type PreservationGuardDisposition = 'PASS' | 'BLOCK';

export interface PreservationGuardInput {
  evidenceFieldsPreserved: boolean;
  auditFieldsPreserved: boolean;
  safetyChecksPreserved: boolean;
  dlpChecksPreserved: boolean;
  approvalGatesPreserved: boolean;
  receiptFieldsPreserved: boolean;
}

export interface EfficiencyOverconstraintObservedSignals {
  verboseOutput?: boolean;
  costPressure?: boolean;
  noMatchResult?: boolean;
  missingEvidenceFriction?: boolean;
  operatorFriction?: boolean;
  approvalFriction?: boolean;
  policyAmbiguity?: boolean;
  dlpOrSafetyFriction?: boolean;
}

export interface EfficiencyOverconstraintFeedbackReadout {
  contractVersion: typeof MLW8_EFFICIENCY_OVERCONSTRAINT_FEEDBACK_VERSION;
  efficiencyFeedbackClass: EfficiencyFeedbackClass;
  overconstraintFeedbackClass: OverconstraintFeedbackClass;
  contextBudgetReadout: ContextBudgetReadout;
  learningPlaneReadout: LearningPlaneReadout;
  preservationGuardResult: {
    disposition: PreservationGuardDisposition;
    failedChecks: string[];
    evidenceFieldsPreserved: boolean;
    auditFieldsPreserved: boolean;
    safetyChecksPreserved: boolean;
    dlpChecksPreserved: boolean;
    approvalGatesPreserved: boolean;
    receiptFieldsPreserved: boolean;
  };
  recommendedAction: 'REVIEW_ONLY_RECORD' | 'REQUIRE_GOVERNANCE_REVIEW';
  automaticOptimizationAuthorized: false;
  policyRelaxationAuthorized: false;
  evidenceReductionAuthorized: false;
  autonomousMutationAuthorized: false;
  boundaries: string[];
}

const DEFAULT_PRESERVATION_GUARD: PreservationGuardInput = {
  evidenceFieldsPreserved: true,
  auditFieldsPreserved: true,
  safetyChecksPreserved: true,
  dlpChecksPreserved: true,
  approvalGatesPreserved: true,
  receiptFieldsPreserved: true,
};

function classifyEfficiency(input: {
  contextBudgetReadout: ContextBudgetReadout;
  signals: EfficiencyOverconstraintObservedSignals;
}): EfficiencyFeedbackClass {
  if (!input.contextBudgetReadout.withinBudget) return 'CONTEXT_PRESSURE';
  if (input.signals.verboseOutput) return 'VERBOSITY_PRESSURE';
  if (input.signals.costPressure) return 'COST_PRESSURE';
  if (input.signals.noMatchResult) return 'NO_MATCH_PRESSURE';
  if (input.signals.missingEvidenceFriction) return 'EVIDENCE_FRICTION';
  if (input.signals.operatorFriction) return 'OPERATOR_FRICTION';
  return 'NO_EFFICIENCY_SIGNAL';
}

function classifyOverconstraint(signals: EfficiencyOverconstraintObservedSignals): OverconstraintFeedbackClass {
  if (signals.approvalFriction) return 'APPROVAL_FRICTION';
  if (signals.policyAmbiguity) return 'POLICY_AMBIGUITY';
  if (signals.dlpOrSafetyFriction) return 'DLP_OR_SAFETY_FRICTION';
  return 'NO_OVERCONSTRAINT_SIGNAL';
}

function evaluatePreservationGuard(input: PreservationGuardInput) {
  const failedChecks = Object.entries(input)
    .filter(([, value]) => value === false)
    .map(([key]) => key);

  return {
    disposition: failedChecks.length === 0 ? 'PASS' : 'BLOCK',
    failedChecks,
    ...input,
  } as const;
}

export function buildEfficiencyOverconstraintFeedbackReadout(input: {
  role: string;
  estimatedContextTokens?: number;
  confidenceLevel?: number;
  observedSignals?: EfficiencyOverconstraintObservedSignals;
  preservationGuard?: Partial<PreservationGuardInput>;
}): EfficiencyOverconstraintFeedbackReadout {
  const contextBudgetReadout = buildContextBudgetReadout(input.role, input.estimatedContextTokens);
  const learningPlaneReadout = buildLearningPlaneReadout(input.role, input.confidenceLevel);
  const signals = input.observedSignals ?? {};
  const preservationGuardResult = evaluatePreservationGuard({
    ...DEFAULT_PRESERVATION_GUARD,
    ...input.preservationGuard,
  });
  const efficiencyFeedbackClass = classifyEfficiency({ contextBudgetReadout, signals });
  const overconstraintFeedbackClass = classifyOverconstraint(signals);
  const signalObserved =
    efficiencyFeedbackClass !== 'NO_EFFICIENCY_SIGNAL' ||
    overconstraintFeedbackClass !== 'NO_OVERCONSTRAINT_SIGNAL';

  return {
    contractVersion: MLW8_EFFICIENCY_OVERCONSTRAINT_FEEDBACK_VERSION,
    efficiencyFeedbackClass,
    overconstraintFeedbackClass,
    contextBudgetReadout,
    learningPlaneReadout,
    preservationGuardResult,
    recommendedAction: preservationGuardResult.disposition === 'PASS' && signalObserved
      ? 'REVIEW_ONLY_RECORD'
      : 'REQUIRE_GOVERNANCE_REVIEW',
    automaticOptimizationAuthorized: false,
    policyRelaxationAuthorized: false,
    evidenceReductionAuthorized: false,
    autonomousMutationAuthorized: false,
    boundaries: [
      'advisory_feedback_only',
      'no_prompt_shortening',
      'no_context_compression',
      'no_evidence_reduction',
      'no_safety_or_dlp_weakening',
      'no_approval_bypass',
      'no_policy_relaxation',
      'no_public_cost_or_performance_claim',
      'no_autonomous_mutation',
    ],
  };
}
