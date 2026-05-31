export const ADAPTATION_POLICY_ENGINE_VERSION =
  "cvf.adaptationPolicyEngine.ape1.v1";

export type AdaptationConstraintId =
  | "A1_RISK_BUDGET"
  | "A2_CONFIDENCE_GATING"
  | "A3_MULTI_SIGNAL"
  | "A4_COOLDOWN"
  | "A5_TIERED_AUTHORITY"
  | "A6_ROLLBACK";

export type AdaptationCheckDisposition = "PASS" | "BLOCK" | "ADVISORY";

export type AgentAuthorityTier = 0 | 1 | 2 | 3;

export type AdaptationTrigger =
  | "THRESHOLD_CROSSED"
  | "SUSTAINED_DEGRADATION"
  | "CRITICAL_FAILURE"
  | "DOMAIN_SHIFT"
  | "PERIODIC_REVIEW";

export interface AdaptationConstraintResult {
  constraintId: AdaptationConstraintId;
  disposition: AdaptationCheckDisposition;
  reason: string;
  runtimeAdaptationAuthorized: false;
}

export interface AdaptationPolicyCheckResult {
  contractVersion: typeof ADAPTATION_POLICY_ENGINE_VERSION;
  overallDisposition: AdaptationCheckDisposition;
  constraints: AdaptationConstraintResult[];
  blockedConstraints: AdaptationConstraintId[];
  advisoryConstraints: AdaptationConstraintId[];
  activationPrerequisiteSatisfied: boolean;
  runtimeAdaptationAuthorized: false;
}

// ─── A1 Input / Check ────────────────────────────────────────────────────────

export interface A1RiskBudgetInput {
  proposedRoleChangePct: number;
  proposedSpawnPct: number;
  proposedRetirementPct: number;
}

export function checkA1RiskBudget(
  input: A1RiskBudgetInput,
): AdaptationConstraintResult {
  const violations: string[] = [];
  if (input.proposedRoleChangePct > 10) {
    violations.push(
      `role changes ${input.proposedRoleChangePct}% > 10% limit`,
    );
  }
  if (input.proposedSpawnPct > 5) {
    violations.push(`agent spawns ${input.proposedSpawnPct}% > 5% limit`);
  }
  if (input.proposedRetirementPct > 5) {
    violations.push(
      `agent retirements ${input.proposedRetirementPct}% > 5% limit`,
    );
  }

  const disposition: AdaptationCheckDisposition =
    violations.length > 0 ? "BLOCK" : "PASS";
  return {
    constraintId: "A1_RISK_BUDGET",
    disposition,
    reason:
      violations.length > 0
        ? `Risk budget exceeded: ${violations.join("; ")}.`
        : "Risk budget within limits.",
    runtimeAdaptationAuthorized: false,
  };
}

// ─── A2 Input / Check ────────────────────────────────────────────────────────

export interface A2ConfidenceGatingInput {
  score: number;
  confidence: number;
  confidenceThreshold?: number;
}

export function checkA2ConfidenceGating(
  input: A2ConfidenceGatingInput,
): AdaptationConstraintResult {
  const threshold = input.confidenceThreshold ?? 0.7;
  const lowConfidence = input.confidence < threshold;

  const disposition: AdaptationCheckDisposition = lowConfidence
    ? "BLOCK"
    : "PASS";
  return {
    constraintId: "A2_CONFIDENCE_GATING",
    disposition,
    reason: lowConfidence
      ? `Confidence ${input.confidence} below threshold ${threshold}. Adaptation blocked regardless of score ${input.score}.`
      : `Confidence ${input.confidence} meets threshold ${threshold}. Score ${input.score} eligible for adaptation.`,
    runtimeAdaptationAuthorized: false,
  };
}

// ─── A3 Input / Check ────────────────────────────────────────────────────────

export interface A3MultiSignalInput {
  signalCount: number;
  taskCount: number;
  minSignals?: number;
  minTasks?: number;
}

export function checkA3MultiSignal(
  input: A3MultiSignalInput,
): AdaptationConstraintResult {
  const minSignals = input.minSignals ?? 3;
  const minTasks = input.minTasks ?? 5;
  const violations: string[] = [];

  if (input.signalCount < minSignals) {
    violations.push(
      `only ${input.signalCount} signal(s), minimum ${minSignals}`,
    );
  }
  if (input.taskCount < minTasks) {
    violations.push(
      `only ${input.taskCount} task(s), minimum ${minTasks}`,
    );
  }

  const disposition: AdaptationCheckDisposition =
    violations.length > 0 ? "BLOCK" : "PASS";
  return {
    constraintId: "A3_MULTI_SIGNAL",
    disposition,
    reason:
      violations.length > 0
        ? `Insufficient signal basis: ${violations.join("; ")}.`
        : `Multi-signal basis satisfied (${input.signalCount} signals, ${input.taskCount} tasks).`,
    runtimeAdaptationAuthorized: false,
  };
}

// ─── A4 Input / Check ────────────────────────────────────────────────────────

export interface A4CooldownInput {
  inCooldown: boolean;
  executionsSinceLastChange: number;
  minExecutionsRequired?: number;
}

export function checkA4Cooldown(
  input: A4CooldownInput,
): AdaptationConstraintResult {
  const minRequired = input.minExecutionsRequired ?? 10;

  if (input.inCooldown) {
    return {
      constraintId: "A4_COOLDOWN",
      disposition: "BLOCK",
      reason: `Agent in cooldown period. ${input.executionsSinceLastChange}/${minRequired} executions completed since last change.`,
      runtimeAdaptationAuthorized: false,
    };
  }
  if (input.executionsSinceLastChange < minRequired) {
    return {
      constraintId: "A4_COOLDOWN",
      disposition: "ADVISORY",
      reason: `Only ${input.executionsSinceLastChange}/${minRequired} executions since last change. Cooldown advisory.`,
      runtimeAdaptationAuthorized: false,
    };
  }
  return {
    constraintId: "A4_COOLDOWN",
    disposition: "PASS",
    reason: `Cooldown satisfied: ${input.executionsSinceLastChange} executions since last change.`,
    runtimeAdaptationAuthorized: false,
  };
}

// ─── A5 Input / Check ────────────────────────────────────────────────────────

export interface A5TieredAuthorityInput {
  currentTier: AgentAuthorityTier;
  proposedTier: AgentAuthorityTier;
  confirmedFailures?: number;
  failureTimePeriodsCount?: number;
  sustainedEvidenceCount?: number;
}

export function checkA5TieredAuthority(
  input: A5TieredAuthorityInput,
): AdaptationConstraintResult {
  const isDemotion = input.proposedTier < input.currentTier;
  const isPromotion = input.proposedTier > input.currentTier;

  if (isDemotion && input.currentTier === 3) {
    const failures = input.confirmedFailures ?? 0;
    const periods = input.failureTimePeriodsCount ?? 0;
    if (failures < 3 || periods < 2) {
      return {
        constraintId: "A5_TIERED_AUTHORITY",
        disposition: "BLOCK",
        reason: `Tier 3 demotion requires ≥3 confirmed failures across ≥2 time periods. Got ${failures} failures, ${periods} periods.`,
        runtimeAdaptationAuthorized: false,
      };
    }
  }

  if (isPromotion && input.currentTier === 0) {
    const evidence = input.sustainedEvidenceCount ?? 0;
    if (evidence < 10) {
      return {
        constraintId: "A5_TIERED_AUTHORITY",
        disposition: "BLOCK",
        reason: `Tier 0 promotion requires ≥10 sustained evidence records. Got ${evidence}.`,
        runtimeAdaptationAuthorized: false,
      };
    }
  }

  return {
    constraintId: "A5_TIERED_AUTHORITY",
    disposition: "PASS",
    reason: `Tier transition ${input.currentTier} → ${input.proposedTier} satisfies authority constraints.`,
    runtimeAdaptationAuthorized: false,
  };
}

// ─── A6 Input / Check ────────────────────────────────────────────────────────

export interface A6RollbackInput {
  obfOverallSignal?: "OK" | "CAUTION" | "ESCALATE";
  performanceDegradedAfterAdaptation: boolean;
  unexpectedFailureSpike: boolean;
}

export function checkA6Rollback(
  input: A6RollbackInput,
): AdaptationConstraintResult {
  const escalateSignal = input.obfOverallSignal === "ESCALATE";
  const rollbackTriggered =
    escalateSignal ||
    input.performanceDegradedAfterAdaptation ||
    input.unexpectedFailureSpike;

  if (rollbackTriggered) {
    const triggers: string[] = [];
    if (escalateSignal) triggers.push("OFB-1 overallSignal=ESCALATE");
    if (input.performanceDegradedAfterAdaptation)
      triggers.push("performance degraded after adaptation");
    if (input.unexpectedFailureSpike)
      triggers.push("unexpected failure spike");

    return {
      constraintId: "A6_ROLLBACK",
      disposition: "ADVISORY",
      reason: `Rollback trigger(s) detected: ${triggers.join("; ")}. Adaptation changes should be reverted.`,
      runtimeAdaptationAuthorized: false,
    };
  }

  return {
    constraintId: "A6_ROLLBACK",
    disposition: "PASS",
    reason: "No rollback triggers detected. System stable.",
    runtimeAdaptationAuthorized: false,
  };
}

// ─── Composite Check ─────────────────────────────────────────────────────────

export interface AdaptationPolicyInput {
  a1: A1RiskBudgetInput;
  a2: A2ConfidenceGatingInput;
  a3: A3MultiSignalInput;
  a4: A4CooldownInput;
  a5: A5TieredAuthorityInput;
  a6: A6RollbackInput;
}

/**
 * Run all 6 adaptation policy constraints (A1-A6) and return an aggregate
 * result. Overall disposition is BLOCK if any constraint returns BLOCK,
 * ADVISORY if any returns ADVISORY (and none BLOCK), PASS otherwise.
 *
 * runtimeAdaptationAuthorized is always false — this is an advisory gate only.
 */
export function checkAdaptationPolicy(
  input: AdaptationPolicyInput,
): AdaptationPolicyCheckResult {
  const constraints: AdaptationConstraintResult[] = [
    checkA1RiskBudget(input.a1),
    checkA2ConfidenceGating(input.a2),
    checkA3MultiSignal(input.a3),
    checkA4Cooldown(input.a4),
    checkA5TieredAuthority(input.a5),
    checkA6Rollback(input.a6),
  ];

  const blocked = constraints
    .filter((c) => c.disposition === "BLOCK")
    .map((c) => c.constraintId);
  const advisory = constraints
    .filter((c) => c.disposition === "ADVISORY")
    .map((c) => c.constraintId);

  const overallDisposition: AdaptationCheckDisposition =
    blocked.length > 0 ? "BLOCK" : advisory.length > 0 ? "ADVISORY" : "PASS";

  return {
    contractVersion: ADAPTATION_POLICY_ENGINE_VERSION,
    overallDisposition,
    constraints,
    blockedConstraints: blocked,
    advisoryConstraints: advisory,
    activationPrerequisiteSatisfied: blocked.length === 0,
    runtimeAdaptationAuthorized: false,
  };
}
