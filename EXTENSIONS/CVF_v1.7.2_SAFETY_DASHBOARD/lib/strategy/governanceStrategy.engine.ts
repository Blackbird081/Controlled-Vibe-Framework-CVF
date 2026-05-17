// lib/strategy/governanceStrategy.engine.ts

import {
  GovernanceStrategyConfig,
  StrategyInput,
  StrategyDecision,
  RLevel,
} from "./governanceStrategy.types";

/**
 * Utility: R-Level ordering
 * We do NOT redefine risk.
 * This is only for comparison purposes.
 */
const rLevelOrder: Record<RLevel, number> = {
  R0: 0,
  R1: 1,
  R2: 2,
  R3: 3,
};

/**
 * Clamp autonomy value
 */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Governance Strategy Engine — Pure behavioral reaction layer.
 *
 * Evaluates the current risk level against a strategy configuration to produce
 * a governance decision. Does NOT modify CVF core risk assessment.
 *
 * @param input - Current session context (rLevel, currentAutonomy, sessionStep)
 * @param strategy - Strategy configuration defining thresholds and policies
 * @returns A StrategyDecision with escalation flags and computed autonomy
 *
 * @example
 * ```ts
 * const decision = evaluateStrategy(
 *   { rLevel: "R2", currentAutonomy: 70, sessionStep: 3 },
 *   BalancedStrategy
 * );
 * // decision.warning === true, decision.newAutonomy === 60
 * ```
 */
export function evaluateStrategy(
  input: StrategyInput,
  strategy: GovernanceStrategyConfig
): StrategyDecision {
  const { rLevel, currentAutonomy } = input;

  const rValue = rLevelOrder[rLevel];

  const autoEscalateAt = rLevelOrder[strategy.escalation.autoEscalateAt];
  const decayStartAt = rLevelOrder[strategy.autonomy.decayStartAt];
  const warnAt = rLevelOrder[strategy.intervention.warnAt];
  const criticalAt = rLevelOrder[strategy.intervention.criticalAt];

  // Escalation logic (behavioral, not structural)
  const escalate = rValue >= autoEscalateAt;

  const requireHuman =
    strategy.escalation.requireHumanAt &&
    rValue >= rLevelOrder[strategy.escalation.requireHumanAt];

  const hardStop =
    rLevel === "R3" && strategy.escalation.hardStopAtR3 === true;

  // Autonomy decay logic
  let newAutonomy = currentAutonomy;

  if (rValue >= decayStartAt) {
    const decayAmount = (rValue - decayStartAt + 1) * 10;
    newAutonomy = currentAutonomy - decayAmount;
  } else {
    // Recovery: slower than decay (×5 vs ×10)
    const recoveryAmount = (decayStartAt - rValue) * 5;
    newAutonomy = currentAutonomy + recoveryAmount;
  }

  newAutonomy = clamp(
    newAutonomy,
    strategy.autonomy.minAutonomy,
    strategy.autonomy.maxAutonomy
  );

  // Intervention flags
  const warning = rValue >= warnAt;
  const critical = rValue >= criticalAt;

  return {
    escalate,
    requireHuman: Boolean(requireHuman),
    hardStop,
    newAutonomy,
    warning,
    critical,
  };
}