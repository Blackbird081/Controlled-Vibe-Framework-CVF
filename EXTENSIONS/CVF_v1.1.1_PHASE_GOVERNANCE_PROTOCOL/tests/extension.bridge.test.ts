/**
 * Cross-Extension Workflow Wiring Tests — Track IV Phase B.3
 *
 * Tests ExtensionBridge: extension registry, health checks,
 * dependency graphs, cross-extension workflows, and rollback.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ExtensionBridge } from '../governance/guard_runtime/wiring/extension.bridge.js';
import type { GuardPipelineResult } from '../governance/guard_runtime/guard.runtime.types.js';

function mockGuardResult(decision: 'ALLOW' | 'BLOCK' | 'ESCALATE', blockedBy?: string): GuardPipelineResult {
  return {
    requestId: 'mock',
    finalDecision: decision,
    results: [],
    executedAt: new Date().toISOString(),
    durationMs: 0,
    blockedBy,
  };
}

describe('ExtensionBridge', () => {
  let bridge: ExtensionBridge;

  beforeEach(() => {
    bridge = new ExtensionBridge();
  });

  // --- Extension Registry ---

  describe('extension registry', () => {
    it('registers an extension', () => {
      const ext = bridge.registerExtension({
        id: 'v1.1.1', name: 'Phase Governance', version: '1.1.1',
        capabilities: ['phase_gate', 'control_plane'], dependencies: [],
      });
      expect(ext.id).toBe('v1.1.1');
      expect(ext.status).toBe('ACTIVE');
      expect(ext.registeredAt).toBeDefined();
    });

    it('rejects duplicate extension id', () => {
      bridge.registerExtension({ id: 'v1', name: 'A', version: '1', capabilities: [], dependencies: [] });
      expect(() => bridge.registerExtension({ id: 'v1', name: 'B', version: '1', capabilities: [], dependencies: [] }))
        .toThrow('already registered');
    });

    it('marks DEGRADED when dependencies missing', () => {
      const ext = bridge.registerExtension({
        id: 'v1.9', name: 'Deterministic', version: '1.9',
        capabilities: ['durable_execution'], dependencies: ['v3.0'],
      });
      expect(ext.status).toBe('DEGRADED');
    });

    it('marks ACTIVE when all dependencies present', () => {
      bridge.registerExtension({ id: 'v3.0', name: 'Core Git', version: '3.0', capabilities: [], dependencies: [] });
      const ext = bridge.registerExtension({
        id: 'v1.9', name: 'Deterministic', version: '1.9',
        capabilities: [], dependencies: ['v3.0'],
      });
      expect(ext.status).toBe('ACTIVE');
    });

    it('getExtension returns registered extension', () => {
      bridge.registerExtension({ id: 'v1', name: 'A', version: '1', capabilities: [], dependencies: [] });
      expect(bridge.getExtension('v1')).toBeDefined();
      expect(bridge.getExtension('v99')).toBeUndefined();
    });

    it('getAllExtensions returns all', () => {
      bridge.registerExtension({ id: 'v1', name: 'A', version: '1', capabilities: [], dependencies: [] });
      bridge.registerExtension({ id: 'v2', name: 'B', version: '2', capabilities: [], dependencies: [] });
      expect(bridge.getAllExtensions()).toHaveLength(2);
    });

    it('getExtensionCount tracks count', () => {
      expect(bridge.getExtensionCount()).toBe(0);
      bridge.registerExtension({ id: 'v1', name: 'A', version: '1', capabilities: [], dependencies: [] });
      expect(bridge.getExtensionCount()).toBe(1);
    });
  });

  // --- Health Checks ---

  describe('health checks', () => {
    it('returns ACTIVE for healthy extension', () => {
      bridge.registerExtension({ id: 'v1', name: 'A', version: '1', capabilities: [], dependencies: [] });
      expect(bridge.checkHealth('v1')).toBe('ACTIVE');
      expect(bridge.getExtension('v1')!.healthScore).toBe(1.0);
    });

    it('returns NOT_REGISTERED for unknown extension', () => {
      expect(bridge.checkHealth('unknown')).toBe('NOT_REGISTERED');
    });

    it('returns DEGRADED when dependency is OFFLINE', () => {
      bridge.registerExtension({ id: 'v3.0', name: 'Core Git', version: '3.0', capabilities: [], dependencies: [] });
      bridge.registerExtension({ id: 'v1.9', name: 'Det', version: '1.9', capabilities: [], dependencies: ['v3.0'] });
      bridge.setExtensionStatus('v3.0', 'OFFLINE');
      expect(bridge.checkHealth('v1.9')).toBe('DEGRADED');
    });

    it('setExtensionStatus updates status', () => {
      bridge.registerExtension({ id: 'v1', name: 'A', version: '1', capabilities: [], dependencies: [] });
      expect(bridge.setExtensionStatus('v1', 'OFFLINE')).toBe(true);
      expect(bridge.getExtension('v1')!.status).toBe('OFFLINE');
    });

    it('setExtensionStatus returns false for unknown', () => {
      expect(bridge.setExtensionStatus('unknown', 'ACTIVE')).toBe(false);
    });

    it('records lastHealthCheck timestamp', () => {
      bridge.registerExtension({ id: 'v1', name: 'A', version: '1', capabilities: [], dependencies: [] });
      bridge.checkHealth('v1');
      expect(bridge.getExtension('v1')!.lastHealthCheck).toBeDefined();
    });
  });

  // --- Dependency Graph ---

  describe('dependency graph', () => {
    it('returns dependency graph', () => {
      bridge.registerExtension({ id: 'v3.0', name: 'Core', version: '3.0', capabilities: [], dependencies: [] });
      bridge.registerExtension({ id: 'v1.9', name: 'Det', version: '1.9', capabilities: [], dependencies: ['v3.0'] });
      bridge.registerExtension({ id: 'v1.1.1', name: 'Gov', version: '1.1.1', capabilities: [], dependencies: ['v3.0', 'v1.9'] });

      const graph = bridge.getDependencyGraph();
      expect(graph.get('v3.0')).toEqual([]);
      expect(graph.get('v1.9')).toEqual(['v3.0']);
      expect(graph.get('v1.1.1')).toEqual(['v3.0', 'v1.9']);
    });
  });

  // --- Cross-Extension Workflows ---

  describe('cross-extension workflows', () => {
    beforeEach(() => {
      bridge.registerExtension({ id: 'v3.0', name: 'Core Git', version: '3.0', capabilities: ['skill_lifecycle'], dependencies: [] });
      bridge.registerExtension({ id: 'v1.9', name: 'Deterministic', version: '1.9', capabilities: ['durable_execution'], dependencies: ['v3.0'] });
      bridge.registerExtension({ id: 'v1.1.1', name: 'Phase Governance', version: '1.1.1', capabilities: ['guard_runtime'], dependencies: [] });
    });

    it('creates a workflow', () => {
      const wf = bridge.createWorkflow({
        id: 'wf-1', name: 'Full Pipeline',
        steps: [
          { extensionId: 'v1.1.1', action: 'guard_check' },
          { extensionId: 'v3.0', action: 'skill_validate' },
          { extensionId: 'v1.9', action: 'checkpoint' },
        ],
      });
      expect(wf.status).toBe('CREATED');
      expect(wf.steps).toHaveLength(3);
      expect(wf.currentStepIndex).toBe(0);
    });

    it('rejects duplicate workflow id', () => {
      bridge.createWorkflow({ id: 'wf-1', name: 'A', steps: [] });
      expect(() => bridge.createWorkflow({ id: 'wf-1', name: 'B', steps: [] })).toThrow('already exists');
    });

    it('advances workflow step by step', () => {
      bridge.createWorkflow({
        id: 'wf-1', name: 'Test',
        steps: [
          { extensionId: 'v1.1.1', action: 'guard_check' },
          { extensionId: 'v3.0', action: 'skill_validate' },
        ],
      });

      const r1 = bridge.advanceWorkflow('wf-1', mockGuardResult('ALLOW'));
      expect(r1.success).toBe(true);
      expect(r1.step?.status).toBe('RUNNING');
      expect(r1.waitingForResult).toBe(true);

      const c1 = bridge.reportStepResult('wf-1', {
        status: 'COMPLETED',
        output: { result: 'ok-1' },
        evidence: { artifact: 'guard-log-1' },
      });
      expect(c1.success).toBe(true);
      expect(c1.step?.status).toBe('COMPLETED');

      const r2 = bridge.advanceWorkflow('wf-1', mockGuardResult('ALLOW'));
      expect(r2.success).toBe(true);
      expect(r2.step?.status).toBe('RUNNING');

      const c2 = bridge.reportStepResult('wf-1', {
        status: 'COMPLETED',
        output: { result: 'ok-2' },
      });
      expect(c2.success).toBe(true);

      const wf = bridge.getWorkflow('wf-1')!;
      expect(wf.status).toBe('COMPLETED');
      expect(wf.metadata?.freezeReceipt).toBeDefined();
    });

    it('fails workflow when guard blocks', () => {
      bridge.createWorkflow({
        id: 'wf-1', name: 'Test',
        steps: [{ extensionId: 'v1.1.1', action: 'guard_check' }],
      });

      const r = bridge.advanceWorkflow('wf-1', mockGuardResult('BLOCK', 'phase_gate'));
      expect(r.success).toBe(false);
      expect(r.step?.status).toBe('FAILED');
      expect(bridge.getWorkflow('wf-1')!.status).toBe('FAILED');
    });

    it('fails workflow when extension is OFFLINE', () => {
      bridge.createWorkflow({
        id: 'wf-1', name: 'Test',
        steps: [{ extensionId: 'v3.0', action: 'skill_validate' }],
      });
      bridge.setExtensionStatus('v3.0', 'OFFLINE');

      const r = bridge.advanceWorkflow('wf-1');
      expect(r.success).toBe(false);
      expect(r.error).toContain('OFFLINE');
    });

    it('fails workflow when extension not registered', () => {
      bridge.createWorkflow({
        id: 'wf-1', name: 'Test',
        steps: [{ extensionId: 'v99', action: 'unknown' }],
      });

      const r = bridge.advanceWorkflow('wf-1');
      expect(r.success).toBe(false);
      expect(r.error).toContain('not registered');
    });

    it('cannot advance terminal workflow', () => {
      bridge.createWorkflow({
        id: 'wf-1', name: 'Test',
        steps: [{ extensionId: 'v1.1.1', action: 'check' }],
      });
      bridge.advanceWorkflow('wf-1', mockGuardResult('ALLOW'));
      bridge.reportStepResult('wf-1', { status: 'COMPLETED', output: { result: 'done' } });
      const r = bridge.advanceWorkflow('wf-1');
      expect(r.success).toBe(false);
      expect(r.error).toContain('terminal state');
    });

    it('returns error for unknown workflow', () => {
      const r = bridge.advanceWorkflow('unknown');
      expect(r.success).toBe(false);
      expect(r.error).toContain('not found');
    });

    it('rollbacks completed steps', () => {
      bridge.createWorkflow({
        id: 'wf-1', name: 'Test',
        steps: [
          { extensionId: 'v1.1.1', action: 'check' },
          { extensionId: 'v3.0', action: 'validate' },
          { extensionId: 'v1.9', action: 'checkpoint' },
        ],
      });
      bridge.advanceWorkflow('wf-1', mockGuardResult('ALLOW'));
      bridge.reportStepResult('wf-1', { status: 'COMPLETED', output: { result: 'check-ok' } });
      bridge.advanceWorkflow('wf-1', mockGuardResult('ALLOW'));
      bridge.reportStepResult('wf-1', { status: 'COMPLETED', output: { result: 'validate-ok' } });
      // Now at step 2, rollback
      expect(bridge.rollbackWorkflow('wf-1', 'Need to re-run with narrower scope')).toBe(true);
      const wf = bridge.getWorkflow('wf-1')!;
      expect(wf.status).toBe('ROLLED_BACK');
      expect(wf.steps[0]!.status).toBe('SKIPPED');
      expect(wf.steps[1]!.status).toBe('SKIPPED');
      expect(wf.metadata?.rollbackReason).toBe('Need to re-run with narrower scope');
    });

    it('cannot rollback COMPLETED workflow', () => {
      bridge.createWorkflow({
        id: 'wf-1', name: 'Test',
        steps: [{ extensionId: 'v1.1.1', action: 'check' }],
      });
      bridge.advanceWorkflow('wf-1', mockGuardResult('ALLOW'));
      bridge.reportStepResult('wf-1', { status: 'COMPLETED', output: { result: 'done' } });
      expect(bridge.rollbackWorkflow('wf-1')).toBe(false);
    });

    it('fails workflow when reported step result fails', () => {
      bridge.createWorkflow({
        id: 'wf-1', name: 'Test',
        steps: [{ extensionId: 'v3.0', action: 'skill_validate' }],
      });

      const started = bridge.advanceWorkflow('wf-1', mockGuardResult('ALLOW'));
      expect(started.success).toBe(true);
      expect(started.step?.status).toBe('RUNNING');

      const failed = bridge.reportStepResult('wf-1', {
        status: 'FAILED',
        error: 'Extension returned invalid schema.',
        evidence: { extensionStatus: 'invalid_schema' },
      });
      expect(failed.success).toBe(false);
      expect(failed.error).toContain('invalid schema');
      expect(bridge.getWorkflow('wf-1')!.status).toBe('FAILED');
    });

    it('executeCurrentStep auto-runs a registered handler', async () => {
      bridge.registerActionHandler('v3.0', 'skill_validate', ({ step }) => ({
        status: 'COMPLETED',
        output: { stepId: step.id, validated: true },
        evidence: { handler: 'skill_validate' },
      }));

      bridge.createWorkflow({
        id: 'wf-2', name: 'Execute via handler',
        steps: [{ extensionId: 'v3.0', action: 'skill_validate' }],
      });

      const result = await bridge.executeCurrentStep('wf-2', { guardResult: mockGuardResult('ALLOW') });
      expect(result.success).toBe(true);
      expect(result.waitingForResult).toBe(false);
      expect(result.step?.status).toBe('COMPLETED');
      expect(result.step?.evidence?.handler).toBe('skill_validate');
      expect(bridge.getWorkflow('wf-2')!.status).toBe('COMPLETED');
    });

    it('executeWorkflow runs a full workflow when handlers are registered', async () => {
      bridge.registerActionHandler('v1.1.1', 'guard_check', ({ step }) => ({
        status: 'COMPLETED',
        output: { action: step.action, ok: true },
      }));
      bridge.registerActionHandler('v3.0', 'skill_validate', ({ step }) => ({
        status: 'COMPLETED',
        output: { action: step.action, ok: true },
      }));
      bridge.registerActionHandler('v1.9', 'checkpoint', ({ workflow }) => ({
        status: 'COMPLETED',
        output: { workflowId: workflow.id, checkpointed: true },
        evidence: { receipt: 'checkpoint-1' },
      }));

      bridge.createWorkflow({
        id: 'wf-3', name: 'Auto execute',
        steps: [
          { extensionId: 'v1.1.1', action: 'guard_check' },
          { extensionId: 'v3.0', action: 'skill_validate' },
          { extensionId: 'v1.9', action: 'checkpoint' },
        ],
      });

      const result = await bridge.executeWorkflow('wf-3', {
        guardResultProvider: async () => mockGuardResult('ALLOW'),
      });
      expect(result.success).toBe(true);
      expect(result.workflow?.status).toBe('COMPLETED');
      expect(result.workflow?.steps.every((step) => step.status === 'COMPLETED')).toBe(true);
      expect(result.workflow?.metadata?.freezeReceipt).toBeDefined();
    });

    it('executeWorkflow stops when a step requires manual result reporting', async () => {
      bridge.createWorkflow({
        id: 'wf-4', name: 'Manual handoff',
        steps: [{ extensionId: 'v3.0', action: 'skill_validate' }],
      });

      const result = await bridge.executeWorkflow('wf-4', {
        guardResultProvider: async () => mockGuardResult('ALLOW'),
      });
      expect(result.success).toBe(false);
      expect(result.error).toContain('waiting for a manual result');
      expect(bridge.getWorkflow('wf-4')!.steps[0]!.status).toBe('RUNNING');
    });

    it('returns false for rollback of unknown workflow', () => {
      expect(bridge.rollbackWorkflow('unknown')).toBe(false);
    });

    it('getWorkflow and getAllWorkflows', () => {
      bridge.createWorkflow({ id: 'wf-1', name: 'A', steps: [] });
      bridge.createWorkflow({ id: 'wf-2', name: 'B', steps: [] });
      expect(bridge.getWorkflow('wf-1')).toBeDefined();
      expect(bridge.getAllWorkflows()).toHaveLength(2);
      expect(bridge.getWorkflowCount()).toBe(2);
    });
  });

  // --- E2E Integration ---

  describe('E2E: full cross-extension workflow', () => {
    it('runs a 3-extension pipeline to completion', async () => {
      bridge.registerExtension({ id: 'v1.1.1', name: 'Phase Governance', version: '1.1.1', capabilities: ['guard_runtime'], dependencies: [] });
      bridge.registerExtension({ id: 'v3.0', name: 'Core Git', version: '3.0', capabilities: ['skill_lifecycle'], dependencies: [] });
      bridge.registerExtension({ id: 'v1.9', name: 'Deterministic', version: '1.9', capabilities: ['durable_execution'], dependencies: ['v3.0'] });

      const wf = bridge.createWorkflow({
        id: 'e2e-1', name: 'Full Pipeline',
        steps: [
          { extensionId: 'v1.1.1', action: 'guard_check', input: { context: 'BUILD' } },
          { extensionId: 'v3.0', action: 'skill_validate', input: { skill: 'TypeScript' } },
          { extensionId: 'v1.9', action: 'checkpoint', input: { state: 'pre-deploy' } },
        ],
      });

      for (let i = 0; i < 3; i++) {
        const r = bridge.advanceWorkflow('e2e-1', mockGuardResult('ALLOW'));
        expect(r.success).toBe(true);
        const completion = bridge.reportStepResult('e2e-1', {
          status: 'COMPLETED',
          output: { step: i, ok: true },
          evidence: { artifact: `artifact-${i}` },
        });
        expect(completion.success).toBe(true);
      }

      const completed = bridge.getWorkflow('e2e-1')!;
      expect(completed.status).toBe('COMPLETED');
      expect(completed.steps.every((s) => s.status === 'COMPLETED')).toBe(true);
      expect(completed.completedAt).toBeDefined();
      expect(completed.executionLog?.length).toBeGreaterThanOrEqual(6);
      expect(completed.metadata?.freezeReceipt).toBeDefined();
    });
  });
});
