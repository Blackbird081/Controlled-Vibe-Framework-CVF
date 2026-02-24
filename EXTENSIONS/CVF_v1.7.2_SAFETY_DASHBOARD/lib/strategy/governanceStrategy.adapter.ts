// lib/strategy/governanceStrategy.adapter.ts

import {
  StrategyInput,
  StrategyDecision,
  GovernanceStrategyConfig,
  StrategyProfileName,
} from "./governanceStrategy.types";

import { StrategyRegistry } from "./governanceStrategy.config";

import { evaluateStrategy } from "./governanceStrategy.engine";

/**
 * Adapter between CVF Core Risk Output
 * and Strategy Behavioral Reaction Layer.
 *
 * This ensures:
 * - No duplication of risk logic
 * - No modification of CVF core
 * - Strategy layer remains optional
 */
export class GovernanceStrategyAdapter {
  private strategy: GovernanceStrategyConfig;

  constructor(strategyOrName: GovernanceStrategyConfig | StrategyProfileName) {
    if (typeof strategyOrName === "string") {
      this.strategy = StrategyRegistry[strategyOrName];
    } else {
      this.strategy = strategyOrName;
    }
  }

  /**
   * Update strategy profile dynamically
   */
  public setStrategy(strategy: GovernanceStrategyConfig) {
    this.strategy = strategy;
  }

  /**
   * Execute behavioral evaluation
   */
  public evaluate(input: StrategyInput): StrategyDecision {
    return evaluateStrategy(input, this.strategy);
  }
}