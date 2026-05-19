/**
 * CVF Phase 2.B — Bounded Fixture-Driven Runtime Wire-Up
 * ======================================================
 * Composes the Phase 1.P / 1.I / 1.R / 1.M / 2.A contracts into one
 * deterministic fixture path. This is intentionally local to the contracts
 * surface: no web route, provider call, scheduler, memory store, or
 * ORCHESTRATOR permission semantics are introduced here.
 *
 * Authorized by: docs/baselines/CVF_GC018_PHASE_2B_RUNTIME_WIREUP_2026-05-18.md
 */

import type {
  PolicyDecisionResult,
  PolicyEngine,
  RiskLevel,
} from './policy-decision.contract';
import type {
  RiskAssessmentResult,
  RiskEngine,
} from './risk-engine.contract';
import { R_SCALE_POLICY_BINDING } from './risk-engine.contract';
import type {
  GuardContribution,
  GuardEngineAdapter,
} from './guard-engine.contract';
import type {
  AgentFunctionRole,
} from './role-axis.contract';
import type {
  MemoryTierId,
} from './memory-tier.contract';
import { isCanonicalTier } from './memory-tier.contract';
import type {
  Receipt,
} from './receipt-envelope.contract';
import {
  RECEIPT_SCHEMA_VERSION_1R,
} from './receipt-envelope.contract';
import type {
  GovernedCapability,
  OutcomeDeliverable,
  OutcomeWorkflow,
} from './governed-capability.contract';

export const PHASE_2B_WIREUP_VERSION = '2.B.0-bounded-fixture' as const;

const AGENT_FUNCTION_ROLE_VALUES: ReadonlyArray<AgentFunctionRole> = [
  'executor',
  'observer',
  'orchestrator',
  'architect',
  'builder',
  'reviewer',
  'coordinator',
] as const;

export type Phase2BWireupStatus =
  | 'executed'
  | 'blocked';

export interface Phase2BWireupActor {
  readonly agentId: string;
  readonly agentFunctionRole: AgentFunctionRole;
}

export interface Phase2BWireupClock {
  readonly issuedAt: string;
  readonly receiptId: string;
}

export interface Phase2BWireupInput {
  readonly capability: GovernedCapability;
  readonly workflow: OutcomeWorkflow;
  readonly actor: Phase2BWireupActor;
  readonly policyEngine: PolicyEngine;
  readonly riskEngine: RiskEngine;
  readonly guardAdapter: GuardEngineAdapter;
  readonly clock: Phase2BWireupClock;
  readonly requestPayload?: Readonly<Record<string, unknown>>;
}

export interface Phase2BWireupResult {
  readonly version: typeof PHASE_2B_WIREUP_VERSION;
  readonly status: Phase2BWireupStatus;
  readonly capabilityId: string;
  readonly workflowId: string;
  readonly policyDecision: PolicyDecisionResult;
  readonly riskAssessment: RiskAssessmentResult;
  readonly guardContributions: ReadonlyArray<GuardContribution>;
  readonly memoryTiers: ReadonlyArray<MemoryTierId>;
  readonly receipt: Receipt<OutcomeDeliverable> | null;
  readonly blockedReason: string | null;
}

/**
 * Run the bounded Phase 2.B fixture path.
 *
 * This helper proves composition of the canonical contract surfaces. It is not
 * a production executor and must not be used as a web/provider runtime path.
 */
export async function runPhase2BWireupFixture(
  input: Phase2BWireupInput,
): Promise<Phase2BWireupResult> {
  assertPhase2BFixtureShape(input);

  const action = `execute:${input.capability.capabilityId}:${input.workflow.workflowId}`;
  const payload = {
    capabilityId: input.capability.capabilityId,
    workflowId: input.workflow.workflowId,
    ...input.requestPayload,
  };

  const riskAssessment = await input.riskEngine.assess({
    agentId: input.actor.agentId,
    action,
    payload,
  });

  const policyDecision = await input.policyEngine.evaluate({
    agentId: input.actor.agentId,
    action,
    payload,
    riskLevel: riskAssessment.level,
  });

  const guardContributions = input.guardAdapter.contributeGuards();
  const blockedReason = resolveBlockReason(policyDecision, riskAssessment.level);
  const status: Phase2BWireupStatus = blockedReason === null ? 'executed' : 'blocked';

  return {
    version: PHASE_2B_WIREUP_VERSION,
    status,
    capabilityId: input.capability.capabilityId,
    workflowId: input.workflow.workflowId,
    policyDecision,
    riskAssessment,
    guardContributions,
    memoryTiers: input.workflow.steps.map((step) => step.requiresMemoryTier),
    receipt: status === 'executed'
      ? buildOutcomeDeliverableReceipt(input.workflow.deliverable, input)
      : null,
    blockedReason,
  };
}

function assertPhase2BFixtureShape(input: Phase2BWireupInput): void {
  if (input.capability._provisional !== 'PROVISIONAL_UNTIL_PHASE_2B') {
    throw new Error('Phase 2.B fixture requires a provisional GovernedCapability');
  }
  if (input.workflow._provisional !== 'PROVISIONAL_UNTIL_PHASE_2B') {
    throw new Error('Phase 2.B fixture requires a provisional OutcomeWorkflow');
  }
  if (input.capability.availableFrom !== 'Phase-2B') {
    throw new Error('Phase 2.B fixture only accepts capabilities available from Phase-2B');
  }
  if (input.workflow.executableFrom !== 'Phase-2B') {
    throw new Error('Phase 2.B fixture only accepts workflows executable from Phase-2B');
  }
  if (input.workflow.triggeredByCapabilityId !== input.capability.capabilityId) {
    throw new Error('OutcomeWorkflow must be triggered by the selected GovernedCapability');
  }
  if (!input.capability.outcomeWorkflowIds.includes(input.workflow.workflowId)) {
    throw new Error('GovernedCapability must reference the selected OutcomeWorkflow');
  }
  if (!AGENT_FUNCTION_ROLE_VALUES.includes(input.actor.agentFunctionRole)) {
    throw new Error('Actor role must use an existing AgentFunctionRole value');
  }
  for (const step of input.workflow.steps) {
    if (!AGENT_FUNCTION_ROLE_VALUES.includes(step.agentFunctionRole as AgentFunctionRole)) {
      throw new Error(`Workflow step ${step.stepId} uses a non-canonical agent function role`);
    }
    if (!isCanonicalTier(step.requiresMemoryTier)) {
      throw new Error(`Workflow step ${step.stepId} uses a non-canonical memory tier`);
    }
  }
}

function resolveBlockReason(
  policyDecision: PolicyDecisionResult,
  riskLevel: RiskLevel,
): string | null {
  if (R_SCALE_POLICY_BINDING[riskLevel] === 'deny') {
    return `risk level ${riskLevel} denies by default`;
  }
  if (policyDecision.decision !== 'allow') {
    return `policy decision ${policyDecision.decision}`;
  }
  return null;
}

function buildOutcomeDeliverableReceipt(
  deliverable: OutcomeDeliverable,
  input: Phase2BWireupInput,
): Receipt<OutcomeDeliverable> {
  return {
    id: input.clock.receiptId,
    issuedAt: input.clock.issuedAt,
    source: `phase2b:${input.capability.capabilityId}:${input.workflow.workflowId}`,
    schemaVersion: RECEIPT_SCHEMA_VERSION_1R,
    payload: deliverable,
  };
}

