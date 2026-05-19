/**
 * CVF Phase 2.B — Bounded Wire-Up Conformance Tests
 * =================================================
 * Verifies the fixture-driven chain:
 * GovernedCapability -> OutcomeWorkflow -> policy/risk/guard -> Receipt.
 *
 * Authorized by: docs/baselines/CVF_GC018_PHASE_2B_RUNTIME_WIREUP_2026-05-18.md
 */

import { describe, it, expect } from 'vitest';

import {
  PHASE_2B_WIREUP_VERSION,
  RECEIPT_SCHEMA_VERSION_1R,
  runPhase2BWireupFixture,
} from './index';

import type {
  GovernedCapability,
  GuardEngineAdapter,
  OutcomeWorkflow,
  Phase2BWireupInput,
  PolicyEngine,
  RiskEngine,
} from './index';

const baseCapability: GovernedCapability = {
  _provisional: 'PROVISIONAL_UNTIL_PHASE_2B',
  capabilityId: 'cap-product-brief-fixture',
  name: 'Product Brief Fixture',
  domain: 'CVF_GUARD_CONTRACT',
  minimumRiskClearance: 'R1',
  policyEngineId: 'phase2b-policy-fixture',
  requiresAuditReceipt: true,
  outcomeWorkflowIds: ['wf-product-brief-fixture'],
  availableFrom: 'Phase-2B',
};

const baseWorkflow: OutcomeWorkflow = {
  _provisional: 'PROVISIONAL_UNTIL_PHASE_2B',
  workflowId: 'wf-product-brief-fixture',
  name: 'Product Brief Fixture Workflow',
  triggeredByCapabilityId: 'cap-product-brief-fixture',
  steps: [
    {
      stepId: 'step-brief-review',
      description: 'Review the product brief fixture',
      agentFunctionRole: 'reviewer',
      requiresMemoryTier: 'task',
    },
  ],
  deliverable: {
    type: 'document',
    description: 'Fixture product brief deliverable',
    wrappedInReceiptEnvelope: true,
  },
  executableFrom: 'Phase-2B',
};

const allowPolicyEngine: PolicyEngine = {
  engineId: 'phase2b-policy-fixture',
  covers: () => ['execute:*'],
  evaluate: async (context) => ({
    decision: 'allow',
    rationale: 'fixture allows bounded Phase 2.B path',
    riskLevel: context.riskLevel ?? 'R1',
    evaluatedAt: '2026-05-18T00:00:00.000Z',
    evidence: {
      rule: 'phase2b-fixture-only',
      source: 'contracts.phase2b.test.ts',
    },
  }),
};

const denyPolicyEngine: PolicyEngine = {
  ...allowPolicyEngine,
  evaluate: async (context) => ({
    decision: 'deny',
    rationale: 'fixture denies bounded Phase 2.B path',
    riskLevel: context.riskLevel ?? 'R1',
    evaluatedAt: '2026-05-18T00:00:00.000Z',
  }),
};

const lowRiskEngine: RiskEngine = {
  engineId: 'phase2b-risk-fixture',
  covers: () => ['execute:*'],
  assess: async () => ({
    level: 'R1',
    summary: 'bounded fixture risk',
    signals: [
      {
        source: 'phase2b-fixture',
        level: 'R1',
        reason: 'local contract test only',
      },
    ],
    assessedAt: '2026-05-18T00:00:00.000Z',
  }),
};

const dangerousRiskEngine: RiskEngine = {
  ...lowRiskEngine,
  assess: async () => ({
    level: 'R3',
    summary: 'dangerous fixture risk',
    signals: [
      {
        source: 'phase2b-fixture',
        level: 'R3',
        reason: 'deny-by-default R-scale path',
      },
    ],
    assessedAt: '2026-05-18T00:00:00.000Z',
  }),
};

const guardAdapter: GuardEngineAdapter = {
  domainId: 'phase2b-fixture-guard-adapter',
  contributeGuards: () => [
    {
      guardId: 'phase2b-fixture-guard',
      triggerLevel: 'R1',
      description: 'fixture guard contribution only',
    },
  ],
};

function buildInput(overrides: Partial<Phase2BWireupInput> = {}): Phase2BWireupInput {
  return {
    capability: baseCapability,
    workflow: baseWorkflow,
    actor: {
      agentId: 'agent-reviewer-fixture',
      agentFunctionRole: 'reviewer',
    },
    policyEngine: allowPolicyEngine,
    riskEngine: lowRiskEngine,
    guardAdapter,
    clock: {
      issuedAt: '2026-05-18T00:00:00.000Z',
      receiptId: 'receipt-phase2b-fixture-001',
    },
    requestPayload: {
      source: 'phase2b-test',
    },
    ...overrides,
  };
}

describe('runPhase2BWireupFixture()', () => {
  it('executes the bounded allow path and wraps the deliverable in Receipt<OutcomeDeliverable>', async () => {
    const result = await runPhase2BWireupFixture(buildInput());

    expect(result.version).toBe(PHASE_2B_WIREUP_VERSION);
    expect(result.status).toBe('executed');
    expect(result.blockedReason).toBeNull();
    expect(result.receipt).not.toBeNull();
    expect(result.receipt!.schemaVersion).toBe(RECEIPT_SCHEMA_VERSION_1R);
    expect(result.receipt!.payload).toEqual(baseWorkflow.deliverable);
    expect(result.receipt!.payload.wrappedInReceiptEnvelope).toBe(true);
  });

  it('blocks when policy denies and does not issue an execution receipt', async () => {
    const result = await runPhase2BWireupFixture(buildInput({
      policyEngine: denyPolicyEngine,
    }));

    expect(result.status).toBe('blocked');
    expect(result.receipt).toBeNull();
    expect(result.blockedReason).toBe('policy decision deny');
  });

  it('blocks R3 by default through the canonical R-scale binding', async () => {
    const result = await runPhase2BWireupFixture(buildInput({
      riskEngine: dangerousRiskEngine,
    }));

    expect(result.status).toBe('blocked');
    expect(result.receipt).toBeNull();
    expect(result.blockedReason).toBe('risk level R3 denies by default');
  });

  it('uses existing role-axis values without introducing role catalog permissions', async () => {
    const result = await runPhase2BWireupFixture(buildInput());

    expect(result.status).toBe('executed');
    expect(baseWorkflow.steps[0].agentFunctionRole).toBe('reviewer');
    expect(Object.keys(result)).not.toContain('allowed_outputs');
    expect(Object.keys(result)).not.toContain('default_permissions');
  });

  it('uses memory tier annotations without creating a runtime memory store', async () => {
    const result = await runPhase2BWireupFixture(buildInput());

    expect(result.memoryTiers).toEqual(['task']);
    expect(Object.keys(result)).not.toContain('memoryStore');
    expect(Object.keys(result)).not.toContain('runtimeMemory');
  });

  it('rejects non-canonical workflow step roles', async () => {
    const workflow: OutcomeWorkflow = {
      ...baseWorkflow,
      steps: [
        {
          ...baseWorkflow.steps[0],
          agentFunctionRole: 'planner_agent',
        },
      ],
    };

    await expect(runPhase2BWireupFixture(buildInput({ workflow })))
      .rejects.toThrow('non-canonical agent function role');
  });

  it('rejects mismatched capability/workflow references', async () => {
    const workflow: OutcomeWorkflow = {
      ...baseWorkflow,
      triggeredByCapabilityId: 'cap-other',
    };

    await expect(runPhase2BWireupFixture(buildInput({ workflow })))
      .rejects.toThrow('OutcomeWorkflow must be triggered by the selected GovernedCapability');
  });

  it('does not perform web, provider, scheduler, or ORCHESTRATOR runtime work', async () => {
    const result = await runPhase2BWireupFixture(buildInput());

    expect(result.status).toBe('executed');
    expect(Object.keys(result)).not.toContain('webRoute');
    expect(Object.keys(result)).not.toContain('providerCall');
    expect(Object.keys(result)).not.toContain('scheduler');
    expect(Object.keys(result)).not.toContain('orchestratorOverreachSignal');
  });
});

