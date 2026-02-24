// lib/strategy/governanceStrategy.config.ts

import {
  GovernanceStrategyConfig,
} from "./governanceStrategy.types";

/**
 * Governance Strategy Profiles
 * -----------------------------
 * These are behavioral presets.
 * They DO NOT override CVF core logic.
 */

export const ConservativeStrategy: GovernanceStrategyConfig = {
  name: "conservative",

  escalation: {
    autoEscalateAt: "R2",
    hardStopAtR3: true,
    requireHumanAt: "R2",
  },

  autonomy: {
    decayStartAt: "R1",
    minAutonomy: 10,
    maxAutonomy: 60,
  },

  intervention: {
    warnAt: "R1",
    criticalAt: "R2",
  },
};

export const BalancedStrategy: GovernanceStrategyConfig = {
  name: "balanced",

  escalation: {
    autoEscalateAt: "R3",
    hardStopAtR3: true,
    requireHumanAt: "R3",
  },

  autonomy: {
    decayStartAt: "R2",
    minAutonomy: 20,
    maxAutonomy: 80,
  },

  intervention: {
    warnAt: "R2",
    criticalAt: "R3",
  },
};

export const ExploratoryStrategy: GovernanceStrategyConfig = {
  name: "exploratory",

  escalation: {
    autoEscalateAt: "R3",
    hardStopAtR3: true, // CVF Doctrine: R3 = hard BLOCK, always. No exception.
  },

  autonomy: {
    decayStartAt: "R3",
    minAutonomy: 30,
    maxAutonomy: 100,
  },

  intervention: {
    warnAt: "R2",
    criticalAt: "R3",
  },
};

/**
 * Export map for dynamic selection
 */
export const StrategyRegistry = {
  conservative: ConservativeStrategy,
  balanced: BalancedStrategy,
  exploratory: ExploratoryStrategy,
};