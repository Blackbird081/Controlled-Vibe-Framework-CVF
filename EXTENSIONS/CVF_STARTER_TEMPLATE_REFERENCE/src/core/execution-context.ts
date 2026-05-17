// src/core/execution-context.ts

import { randomUUID } from "crypto";

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH";

export type ExecutionPhase =
  | "INIT"
  | "RISK_CLASSIFIED"
  | "GOVERNANCE_APPROVED"
  | "AI_EXECUTED"
  | "VALIDATED"
  | "COMPLETED"
  | "REJECTED";

export interface CostTracking {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCostUSD: number;
}

export interface ExecutionMetadata {
  projectName: string;
  workflowName: string;
  requestedBy: string;
  provider: string;
  model: string;
  timestamp: number;
  cvfVersion: string;
}

export class ExecutionContext {
  public readonly executionId: string;
  public phase: ExecutionPhase;
  public riskLevel: RiskLevel | null;

  public readonly metadata: ExecutionMetadata;
  public readonly cost: CostTracking;

  public error?: string;
  public output?: unknown;

  constructor(metadata: ExecutionMetadata) {
    this.executionId = randomUUID();
    this.phase = "INIT";
    this.riskLevel = null;

    this.metadata = metadata;

    this.cost = {
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
      estimatedCostUSD: 0,
    };
  }

  setRiskLevel(level: RiskLevel) {
    this.riskLevel = level;
    this.phase = "RISK_CLASSIFIED";
  }

  approveGovernance() {
    if (!this.riskLevel) {
      throw new Error("Risk must be classified before governance approval.");
    }
    this.phase = "GOVERNANCE_APPROVED";
  }

  markAIExecuted() {
    this.phase = "AI_EXECUTED";
  }

  markValidated() {
    this.phase = "VALIDATED";
  }

  complete(output: unknown) {
    this.phase = "COMPLETED";
    this.output = output;
  }

  reject(reason: string) {
    this.phase = "REJECTED";
    this.error = reason;
  }

  updateCost(
    promptTokens: number,
    completionTokens: number,
    estimatedCostUSD: number
  ) {
    if (promptTokens < 0 || completionTokens < 0) {
      throw new Error("Invalid token values.");
    }

    // Accumulate instead of overwrite
    this.cost.promptTokens += promptTokens;
    this.cost.completionTokens += completionTokens;
    this.cost.totalTokens = this.cost.promptTokens + this.cost.completionTokens;
    this.cost.estimatedCostUSD += estimatedCostUSD;
  }
}
