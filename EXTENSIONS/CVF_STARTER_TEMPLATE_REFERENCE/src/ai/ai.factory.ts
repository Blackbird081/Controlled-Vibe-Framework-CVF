// @reference-only — This module is not wired into the main execution pipeline.
// src/ai/ai.factory.ts

import { AIProvider } from "./providers/provider.interface";
import { AIRoleConfig } from "./ai.interface";
import { PlannerService } from "./roles/planner.service";
import { AnalystService } from "./roles/analyst.service";
import { ValidatorService } from "./roles/validator.service";

export class AIFactory {
  static createPlanner(config: AIRoleConfig) {
    return new PlannerService(config);
  }

  static createAnalyst(config: AIRoleConfig) {
    return new AnalystService(config);
  }

  static createValidator(config: AIRoleConfig) {
    return new ValidatorService(config);
  }
}
