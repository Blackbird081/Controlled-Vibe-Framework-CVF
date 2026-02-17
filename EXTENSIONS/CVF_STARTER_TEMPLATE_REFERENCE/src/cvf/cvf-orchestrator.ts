// src/cvf/cvf-orchestrator.ts

import { ExecutionContext, ExecutionMetadata } from "../core/execution-context";
import { RiskClassifierService } from "./risk-classifier.service";
import { BudgetGuardService } from "./budget-guard.service";
import { RiskEscalationService } from "./risk-escalation.service";
import { PolicyEngine } from "./policy-engine.service";
import { FreezeGuardService } from "./freeze-guard.service";
import { GovernanceGateService } from "./governance-gate.service";
import { ValidatorTriggerService } from "./validator-trigger.service";
import { AuditService } from "./audit.service";
import { StructuredLogger } from "../core/structured-logger";
import { MetricsService } from "../core/metrics.service";
import { ExecutionStateMachine } from "../core/execution-state-machine";
import { IdempotencyService } from "../core/idempotency.service";
import { ExecutionLock } from "../core/execution-lock";
import { ReplayProtectionService } from "../core/replay-protection";
import { AIProvider, AIExecutionResult } from "../ai/providers/provider.interface";
import { CostRepository } from "../database/cost.repository";

export interface OrchestratorDeps {
  riskClassifier: RiskClassifierService;
  governanceGate: GovernanceGateService;
  validatorTrigger: ValidatorTriggerService;
  auditService: AuditService;
  budgetGuard: BudgetGuardService;
  riskEscalation: RiskEscalationService;
  policyEngine: PolicyEngine;
  freezeGuard: FreezeGuardService;
  logger: StructuredLogger;
  metrics: MetricsService;
  idempotency: IdempotencyService;
  executionLock: ExecutionLock;
  replayProtection: ReplayProtectionService;
  costRepo: CostRepository;
}

export interface ExecutionInput {
  prompt: string;
  metadata: ExecutionMetadata;
  provider: AIProvider;
  model: string;
}

export class CVFOrchestrator {
  constructor(private readonly deps: OrchestratorDeps) { }

  async run(input: ExecutionInput): Promise<unknown> {
    const context = new ExecutionContext(input.metadata);
    const stateMachine = new ExecutionStateMachine();
    const idempotencyKey = this.deps.idempotency.generateKey(input.prompt);

    try {
      // ===== Replay Protection =====
      this.deps.replayProtection.validateTimestamp(input.metadata.timestamp);

      // ===== Idempotency =====
      this.deps.idempotency.ensureNotProcessed(idempotencyKey);

      // ===== Concurrency Lock =====
      this.deps.executionLock.acquire(context.executionId);

      this.deps.logger.log({
        level: "INFO",
        message: "Execution started",
        contextId: context.executionId,
      });

      this.deps.metrics.increment("executions_total");

      // ===== Risk Classification =====
      stateMachine.transition("RISK_CLASSIFIED");
      const riskLevel = this.deps.riskClassifier.classify(context, {
        prompt: input.prompt,
        workflowName: input.metadata.workflowName,
      });

      // ===== Risk Escalation =====
      this.deps.riskEscalation.escalate(riskLevel);

      // ===== Governance Gate =====
      stateMachine.transition("GOVERNANCE_APPROVED");
      this.deps.governanceGate.approve(context);

      // ===== Policy Enforcement =====
      this.deps.policyEngine.enforce(context);

      // ===== Budget Enforcement =====
      await this.deps.budgetGuard.enforceDailyCap(
        input.metadata.projectName,
        50 // configurable via CVFConfig later
      );

      // ===== Freeze Guard Check =====
      this.deps.freezeGuard.check();

      // ===== Execute AI =====
      stateMachine.transition("EXECUTING");

      const result: AIExecutionResult = await input.provider.execute(
        input.model,
        input.prompt,
      );

      // ===== Cost Logging =====
      if (result.promptTokens || result.completionTokens) {
        context.updateCost(
          result.promptTokens,
          result.completionTokens,
          result.costUSD
        );

        await this.deps.costRepo.record({
          projectId: input.metadata.projectName,
          tokens: result.promptTokens + result.completionTokens,
          costUsd: result.costUSD,
        });

        this.deps.metrics.increment("cost_recorded");
      }

      // ===== Validation Phase =====
      stateMachine.transition("VALIDATING");

      context.markAIExecuted();
      context.complete(result.output);

      await this.deps.validatorTrigger.maybeValidate(context);

      stateMachine.transition("COMPLETED");

      // ===== Audit =====
      await this.deps.auditService.record(context);

      // ===== Success Handling =====
      this.deps.freezeGuard.reset();
      this.deps.idempotency.markProcessed(idempotencyKey);

      this.deps.logger.log({
        level: "INFO",
        message: "Execution completed successfully",
        contextId: context.executionId,
      });

      return result.output;
    } catch (error) {
      stateMachine.transition("FAILED");

      context.reject((error as Error).message);
      this.deps.freezeGuard.recordFailure();
      this.deps.metrics.increment("executions_failed");

      // Audit failed execution too
      await this.deps.auditService.record(context);

      this.deps.logger.log({
        level: "ERROR",
        message: (error as Error).message,
        contextId: context.executionId,
      });

      throw error;
    } finally {
      this.deps.executionLock.release(context.executionId);
    }
  }
}
