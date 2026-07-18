export {
  CONTEXT_BUDGET_POLICY_VERSION,
  getContextBudget,
  resolveTaskClass,
} from "./context-budget-policy";
export type {
  ContextBudgetPolicy,
  ContextTaskClass,
} from "./context-budget-policy";

// CBG-1 Context Budget Guard
export {
  CONTEXT_BUDGET_GUARD_VERSION,
  checkContextBudgetGuard,
  checkContextBudgetGuardForTaskClass,
} from "./context-budget-guard";
export type {
  ContextBudgetGuardDisposition,
  ContextBudgetGuardResult,
} from "./context-budget-guard";

// APE-1 Adaptation Policy Engine
export {
  ADAPTATION_POLICY_ENGINE_VERSION,
  checkA1RiskBudget,
  checkA2ConfidenceGating,
  checkA3MultiSignal,
  checkA4Cooldown,
  checkA5TieredAuthority,
  checkA6Rollback,
  checkAdaptationPolicy,
} from "./adaptation-policy-engine";
export type {
  AdaptationConstraintId,
  AdaptationCheckDisposition,
  AgentAuthorityTier,
  AdaptationTrigger,
  AdaptationConstraintResult,
  AdaptationPolicyCheckResult,
  A1RiskBudgetInput,
  A2ConfidenceGatingInput,
  A3MultiSignalInput,
  A4CooldownInput,
  A5TieredAuthorityInput,
  A6RollbackInput,
  AdaptationPolicyInput,
} from "./adaptation-policy-engine";

// SE1 Simulation Environment (LHW17 T3 Step 8)
export {
  SIMULATION_ENVIRONMENT_VERSION,
  runSimulation,
  SIMULATION_SCENARIO_HEALTHY,
} from "./simulation-environment";
export type {
  SimulationVerdict,
  SimulationScenario,
  SimulationStepResult,
  SimulationValidationResult,
  SimulationEnvironmentDependencies,
} from "./simulation-environment";

// RM1 Reputation Routing Advisory (LHW17 T3 Step 7)
export {
  REPUTATION_ROUTING_ADVISORY_VERSION,
  computeRoutingAdvisory,
} from "./reputation-routing-advisory";
export type {
  RoutingDisposition,
  RoutingAdvisoryResult,
} from "./reputation-routing-advisory";

// WD1 TruthScore Weighting Doctrine
export {
  WEIGHTING_DOCTRINE_VERSION,
  WEIGHTING_DOCTRINE_CONFIDENCE_GATE,
  WEIGHTING_DOCTRINE_WEIGHTS,
  applyWeightingDoctrine,
} from "./truthscore-weighting-doctrine";
export type {
  WeightingDoctrineOutcome,
  WeightingDoctrineResult,
  WeightingDoctrineDependencies,
} from "./truthscore-weighting-doctrine";

// TM1 Truth Model Calibration (LHW17 T3 Step 6)
export {
  TRUTH_MODEL_CALIBRATION_VERSION,
  runCalibrationSession,
} from "./truth-model-calibration";
export type {
  CalibrationDisposition,
  CalibrationPhase,
  CalibrationSessionInput,
  CalibrationSessionResult,
  TruthModelCalibrationDependencies,
} from "./truth-model-calibration";
