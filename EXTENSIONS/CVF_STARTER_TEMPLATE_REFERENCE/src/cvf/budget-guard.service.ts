// src/cvf/budget-guard.service.ts

import { CostRepository } from "../database/cost.repository";

export class BudgetGuardService {
  constructor(private readonly costRepo: CostRepository) {}

  async enforceDailyCap(projectId: string, maxUsd: number) {
    const total = await this.costRepo.getDailyCost(projectId);

    if (total >= maxUsd) {
      throw new Error(
        `Daily AI budget exceeded. Limit: ${maxUsd}, Used: ${total}`
      );
    }
  }
}
