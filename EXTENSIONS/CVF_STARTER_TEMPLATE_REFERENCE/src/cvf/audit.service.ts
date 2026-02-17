// src/cvf/audit.service.ts

import { ExecutionContext } from "../core/execution-context";
import { AuditRepository } from "../database/audit.repository";

export interface AuditRecord {
  executionId: string;
  phase: string;
  riskLevel: string | null;
  provider: string;
  model: string;
  workflowName: string;
  cost: {
    totalTokens: number;
    estimatedCostUSD: number;
  };
  timestamp: number;
  error?: string;
}

export class AuditService {
  constructor(private readonly repository: AuditRepository) { }

  async record(context: ExecutionContext): Promise<void> {
    const record: AuditRecord = {
      executionId: context.executionId,
      phase: context.phase,
      riskLevel: context.riskLevel,
      provider: context.metadata.provider,
      model: context.metadata.model,
      workflowName: context.metadata.workflowName,
      cost: {
        totalTokens: context.cost.totalTokens,
        estimatedCostUSD: context.cost.estimatedCostUSD,
      },
      timestamp: Date.now(),
      error: context.error,
    };

    await this.repository.save(record);
  }
}
