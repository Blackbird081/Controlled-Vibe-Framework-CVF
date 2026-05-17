// src/app.ts

import { RiskClassifierService } from "./cvf/risk-classifier.service";
import { GovernanceGateService } from "./cvf/governance-gate.service";
import { ValidatorTriggerService } from "./cvf/validator-trigger.service";
import { AuditService } from "./cvf/audit.service";
import { BudgetGuardService } from "./cvf/budget-guard.service";
import { RiskEscalationService } from "./cvf/risk-escalation.service";
import { PolicyEngine } from "./cvf/policy-engine.service";
import { FreezeGuardService } from "./cvf/freeze-guard.service";
import { CVFOrchestrator } from "./cvf/cvf-orchestrator";

import { approvedModels } from "./config/model.config";
import { InMemoryAuditRepository } from "./database/audit.repository";
import { InMemoryCostRepository } from "./database/cost.repository";
import { StructuredLogger } from "./core/structured-logger";
import { MetricsService } from "./core/metrics.service";
import { IdempotencyService } from "./core/idempotency.service";
import { ExecutionLock } from "./core/execution-lock";
import { ReplayProtectionService } from "./core/replay-protection";

export function createOrchestrator(): CVFOrchestrator {
  const riskClassifier = new RiskClassifierService();
  const governanceGate = new GovernanceGateService(approvedModels);

  const dummyValidator = {
    validate: async () => true,
  };
  const validatorTrigger = new ValidatorTriggerService(dummyValidator);

  const auditRepo = new InMemoryAuditRepository();
  const auditService = new AuditService(auditRepo);

  const costRepo = new InMemoryCostRepository();
  const budgetGuard = new BudgetGuardService(costRepo);
  const riskEscalation = new RiskEscalationService();
  const policyEngine = new PolicyEngine([]);
  const freezeGuard = new FreezeGuardService();
  const logger = new StructuredLogger();
  const metrics = new MetricsService();
  const idempotency = new IdempotencyService();
  const executionLock = new ExecutionLock();
  const replayProtection = new ReplayProtectionService();

  return new CVFOrchestrator({
    riskClassifier,
    governanceGate,
    validatorTrigger,
    auditService,
    budgetGuard,
    riskEscalation,
    policyEngine,
    freezeGuard,
    logger,
    metrics,
    idempotency,
    executionLock,
    replayProtection,
    costRepo,
  });
}
