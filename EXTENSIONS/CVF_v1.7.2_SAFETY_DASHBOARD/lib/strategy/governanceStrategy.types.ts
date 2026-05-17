// lib/strategy/governanceStrategy.types.ts

/**
 * Governance Strategy Layer Types
 * --------------------------------
 * This layer does NOT redefine CVF core logic.
 * It only reacts to existing R-level classification.
 */

/**
 * R-Level comes from CVF Core.
 * We DO NOT redefine classification logic.
 */
export type RLevel = "R0" | "R1" | "R2" | "R3";

/**
 * Strategy Profile Name
 */
export type StrategyProfileName =
  | "conservative"
  | "balanced"
  | "exploratory";

/**
 * Escalation Policy Configuration
 */
export interface EscalationPolicy {
  /**
   * Risk level at which auto escalation triggers
   */
  autoEscalateAt: RLevel;

  /**
   * Whether system should hard-stop at R3
   */
  hardStopAtR3: boolean;

  /**
   * Require human confirmation at specific R-level
   */
  requireHumanAt?: RLevel;
}

/**
 * Autonomy Control Policy
 */
export interface AutonomyPolicy {
  /**
   * Risk level where autonomy starts decaying
   */
  decayStartAt: RLevel;

  /**
   * Minimum autonomy allowed
   */
  minAutonomy: number;

  /**
   * Maximum autonomy allowed
   */
  maxAutonomy: number;
}

/**
 * Intervention Sensitivity
 * Determines how early UI warnings appear
 */
export interface InterventionPolicy {
  /**
   * Risk level where warning UI activates
   */
  warnAt: RLevel;

  /**
   * Risk level where critical alert activates
   */
  criticalAt: RLevel;
}

/**
 * Full Governance Strategy Configuration
 */
export interface GovernanceStrategyConfig {
  name: StrategyProfileName;

  escalation: EscalationPolicy;

  autonomy: AutonomyPolicy;

  intervention: InterventionPolicy;
}

/**
 * Input passed into Strategy Engine
 */
export interface StrategyInput {
  rLevel: RLevel;

  currentAutonomy: number;

  sessionStep: number;
}

/**
 * Decision Output returned by Strategy Engine
 */
export interface StrategyDecision {
  escalate: boolean;

  requireHuman: boolean;

  hardStop: boolean;

  newAutonomy: number;

  warning: boolean;

  critical: boolean;
}