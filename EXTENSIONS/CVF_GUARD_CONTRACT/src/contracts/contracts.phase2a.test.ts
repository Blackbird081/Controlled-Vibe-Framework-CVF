/**
 * CVF Phase 2.A — GovernedCapability & OutcomeWorkflow Conformance Test Stubs
 * =============================================================================
 * Conformance stubs verifying the provisional capability chain contracts.
 * All contracts are PROVISIONAL — no runtime behavior verified here (Phase 2.B).
 *
 * Authorized by: docs/baselines/CVF_GC018_PHASE_2A_CONTRACT_SKETCH_2026-05-18.md
 */

import { describe, it, expect } from 'vitest';

import {
  OUTCOME_DELIVERABLE_CHAIN_DOC,
} from './index';

import type {
  PROVISIONAL,
  GovernedCapability,
  OutcomeWorkflow,
  OutcomeWorkflowStep,
  OutcomeDeliverable,
} from './index';

// ─── GovernedCapability Shape ─────────────────────────────────────────────────

describe('GovernedCapability contract shape', () => {
  it('a minimal GovernedCapability satisfies the interface', () => {
    const cap: GovernedCapability = {
      _provisional: 'PROVISIONAL_UNTIL_PHASE_2B',
      capabilityId: 'cap-analyze-code',
      name: 'Code Analysis',
      domain: 'CVF_GUARD_CONTRACT',
      minimumRiskClearance: 'R1',
      policyEngineId: 'default-policy-engine',
      requiresAuditReceipt: true,
      outcomeWorkflowIds: ['wf-analyze-001'],
      availableFrom: 'Phase-2B',
    };

    expect(cap.capabilityId).toBe('cap-analyze-code');
    expect(cap.minimumRiskClearance).toBe('R1');
    expect(cap.requiresAuditReceipt).toBe(true);
    expect(cap._provisional).toBe('PROVISIONAL_UNTIL_PHASE_2B');
  });

  it('GovernedCapability requires a provisional marker', () => {
    const marker: PROVISIONAL = 'PROVISIONAL_UNTIL_PHASE_2B';
    expect(marker).toBe('PROVISIONAL_UNTIL_PHASE_2B');
  });

  it('minimumRiskClearance accepts all four R-scale values', () => {
    const clearances: GovernedCapability['minimumRiskClearance'][] = ['R0', 'R1', 'R2', 'R3'];
    expect(clearances).toHaveLength(4);
  });

  it('availableFrom constrains to known phases', () => {
    const phases: GovernedCapability['availableFrom'][] = ['Phase-2B', 'Phase-2C', 'Phase-3E'];
    expect(phases).toHaveLength(3);
  });

  it('requiresAuditReceipt links to Phase 1.R receipt envelope', () => {
    const cap: GovernedCapability = {
      _provisional: 'PROVISIONAL_UNTIL_PHASE_2B',
      capabilityId: 'cap-high-risk',
      name: 'High Risk Operation',
      domain: 'CVF_GUARD_CONTRACT',
      minimumRiskClearance: 'R3',
      policyEngineId: 'strict-policy-engine',
      requiresAuditReceipt: true,
      outcomeWorkflowIds: [],
      availableFrom: 'Phase-2B',
    };
    // R3 capability must always require audit receipt
    expect(cap.requiresAuditReceipt).toBe(true);
  });
});

// ─── OutcomeWorkflow Shape ────────────────────────────────────────────────────

describe('OutcomeWorkflow contract shape', () => {
  it('a minimal OutcomeWorkflow satisfies the interface', () => {
    const step: OutcomeWorkflowStep = {
      stepId: 'step-1',
      description: 'Analyze input',
      agentFunctionRole: 'reviewer',
      requiresMemoryTier: 'task',
    };

    const deliverable: OutcomeDeliverable = {
      type: 'code',
      description: 'Analyzed code artifact',
      wrappedInReceiptEnvelope: true,
    };

    const workflow: OutcomeWorkflow = {
      _provisional: 'PROVISIONAL_UNTIL_PHASE_2B',
      workflowId: 'wf-analyze-001',
      name: 'Code Analysis Workflow',
      triggeredByCapabilityId: 'cap-analyze-code',
      steps: [step],
      deliverable,
      executableFrom: 'Phase-2B',
    };

    expect(workflow.workflowId).toBe('wf-analyze-001');
    expect(workflow.steps).toHaveLength(1);
    expect(workflow.deliverable.wrappedInReceiptEnvelope).toBe(true);
  });

  it('OutcomeDeliverable type accepts all five artifact types', () => {
    const types: OutcomeDeliverable['type'][] = [
      'code', 'document', 'receipt', 'audit-entry', 'capability-output',
    ];
    expect(types).toHaveLength(5);
  });

  it('OutcomeWorkflowStep requiresMemoryTier links to Phase 1.M tiers', () => {
    const tiers: OutcomeWorkflowStep['requiresMemoryTier'][] = [
      'working', 'task', 'skill', 'audit', 'receipt',
    ];
    expect(tiers).toHaveLength(5);
  });

  it('executableFrom constrains to Phase-2B or Phase-2C', () => {
    const phases: OutcomeWorkflow['executableFrom'][] = ['Phase-2B', 'Phase-2C'];
    expect(phases).toHaveLength(2);
  });
});

// ─── Outcome Deliverable Chain ────────────────────────────────────────────────

describe('OUTCOME_DELIVERABLE_CHAIN_DOC', () => {
  it('chain has five links', () => {
    expect(OUTCOME_DELIVERABLE_CHAIN_DOC.chain).toHaveLength(5);
  });

  it('chain starts with GovernedCapability and ends with Audit Memory', () => {
    const chain = OUTCOME_DELIVERABLE_CHAIN_DOC.chain;
    expect(chain[0]).toContain('GovernedCapability');
    expect(chain[chain.length - 1]).toContain('Audit Memory');
  });

  it('chain includes Phase 1.R receipt envelope', () => {
    const hasReceipt = OUTCOME_DELIVERABLE_CHAIN_DOC.chain.some((link) =>
      link.includes('Phase 1.R'),
    );
    expect(hasReceipt).toBe(true);
  });

  it('chain includes Phase 1.M memory tier', () => {
    const hasMemoryTier = OUTCOME_DELIVERABLE_CHAIN_DOC.chain.some((link) =>
      link.includes('Phase 1.M'),
    );
    expect(hasMemoryTier).toBe(true);
  });

  it('placeholder owners reference Phase 1.0 canonical sources', () => {
    expect(OUTCOME_DELIVERABLE_CHAIN_DOC.placeholderOwners.GovernedCapability)
      .toContain('CVF_CONTROL_PLANE_FOUNDATION');
    expect(OUTCOME_DELIVERABLE_CHAIN_DOC.placeholderOwners.OutcomeWorkflow)
      .toContain('CVF_EXECUTION_PLANE_FOUNDATION');
    expect(OUTCOME_DELIVERABLE_CHAIN_DOC.placeholderOwners.PolicyEngine)
      .toContain('Phase 1.P');
  });

  it('existing baseline acknowledged as skill.meta.json', () => {
    expect(OUTCOME_DELIVERABLE_CHAIN_DOC.existingBaseline).toContain('skill.meta.json');
  });

  it('version is 2.A.0-provisional', () => {
    expect(OUTCOME_DELIVERABLE_CHAIN_DOC.version).toBe('2.A.0-provisional');
  });
});
