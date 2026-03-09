import { describe, it, expect, beforeEach } from 'vitest';
import {
  WorkflowCoordinator,
  WorkflowDefinition,
  StepExecutor,
} from '../core/workflow.coordinator.js';

function makeDefinition(overrides?: Partial<WorkflowDefinition>): WorkflowDefinition {
  return {
    workflowId: 'wf-test-001',
    name: 'Test Workflow',
    steps: [
      { stepId: 'step-1', extensionId: 'ext-a', description: 'Phase A', rollbackCapable: true },
      { stepId: 'step-2', extensionId: 'ext-b', description: 'Phase B', rollbackCapable: true },
      { stepId: 'step-3', extensionId: 'ext-c', description: 'Phase C', rollbackCapable: false },
    ],
    ...overrides,
  };
}

const successExecutor: StepExecutor = () => ({ success: true, output: { done: true } });
const failExecutor: StepExecutor = () => ({ success: false, error: 'Step failed' });
const throwExecutor: StepExecutor = () => { throw new Error('Unexpected error'); };

describe('WorkflowCoordinator', () => {
  let coordinator: WorkflowCoordinator;

  beforeEach(() => {
    coordinator = new WorkflowCoordinator();
    coordinator.registerExecutor('ext-a', successExecutor);
    coordinator.registerExecutor('ext-b', successExecutor);
    coordinator.registerExecutor('ext-c', successExecutor);
  });

  describe('createWorkflow', () => {
    it('creates a workflow instance in PENDING status', () => {
      const instance = coordinator.createWorkflow(makeDefinition());
      expect(instance.status).toBe('PENDING');
      expect(instance.steps).toHaveLength(3);
      expect(instance.currentStepIndex).toBe(0);
      expect(instance.sessionId).toBeTruthy();
      expect(instance.retryCount).toBe(0);
    });

    it('assigns unique instance IDs', () => {
      const a = coordinator.createWorkflow(makeDefinition());
      const b = coordinator.createWorkflow(makeDefinition());
      expect(a.instanceId).not.toBe(b.instanceId);
    });
  });

  describe('executeNext', () => {
    it('executes steps one by one', () => {
      const instance = coordinator.createWorkflow(makeDefinition());
      const r1 = coordinator.executeNext(instance.instanceId);
      expect(r1.success).toBe(true);
      expect(instance.steps[0]!.status).toBe('COMPLETED');
      expect(instance.currentStepIndex).toBe(1);
    });

    it('creates checkpoints before each step', () => {
      const instance = coordinator.createWorkflow(makeDefinition());
      coordinator.executeNext(instance.instanceId);
      expect(instance.checkpoints).toHaveLength(1);
      expect(instance.steps[0]!.checkpoint).toBeDefined();
      expect(instance.steps[0]!.checkpoint!.extensionContext).toBe('ext-a');
    });

    it('marks workflow COMPLETED when all steps pass', () => {
      const instance = coordinator.createWorkflow(makeDefinition());
      coordinator.executeNext(instance.instanceId);
      coordinator.executeNext(instance.instanceId);
      coordinator.executeNext(instance.instanceId);
      expect(instance.status).toBe('COMPLETED');
      expect(instance.completedAt).toBeDefined();
    });

    it('returns error if workflow is already completed', () => {
      const instance = coordinator.createWorkflow(makeDefinition());
      coordinator.executeAll(instance.instanceId);
      const r = coordinator.executeNext(instance.instanceId);
      expect(r.success).toBe(false);
      expect(r.error).toContain('COMPLETED');
    });

    it('handles missing executor', () => {
      const def = makeDefinition({
        steps: [{ stepId: 's1', extensionId: 'unknown-ext', description: 'X', rollbackCapable: false }],
      });
      const instance = coordinator.createWorkflow(def);
      const r = coordinator.executeNext(instance.instanceId);
      expect(r.success).toBe(false);
      expect(r.error).toContain('No executor');
    });

    it('handles executor failure', () => {
      coordinator.registerExecutor('ext-a', failExecutor);
      const instance = coordinator.createWorkflow(makeDefinition());
      const r = coordinator.executeNext(instance.instanceId);
      expect(r.success).toBe(false);
      expect(instance.steps[0]!.status).toBe('FAILED');
      expect(instance.retryCount).toBe(1);
    });

    it('handles executor throwing exception', () => {
      coordinator.registerExecutor('ext-a', throwExecutor);
      const instance = coordinator.createWorkflow(makeDefinition());
      const r = coordinator.executeNext(instance.instanceId);
      expect(r.success).toBe(false);
      expect(instance.steps[0]!.error).toContain('Unexpected error');
    });

    it('marks workflow FAILED after max retries', () => {
      coordinator.registerExecutor('ext-a', failExecutor);
      const instance = coordinator.createWorkflow(makeDefinition(), { maxRetries: 2 });
      coordinator.executeNext(instance.instanceId);
      coordinator.executeNext(instance.instanceId);
      expect(instance.status).toBe('FAILED');
    });
  });

  describe('executeAll', () => {
    it('runs all steps to completion', () => {
      const instance = coordinator.createWorkflow(makeDefinition());
      const result = coordinator.executeAll(instance.instanceId);
      expect(result.status).toBe('COMPLETED');
      expect(result.steps.every(s => s.status === 'COMPLETED')).toBe(true);
      expect(result.checkpoints).toHaveLength(3);
    });

    it('stops on failure', () => {
      coordinator.registerExecutor('ext-b', failExecutor);
      const instance = coordinator.createWorkflow(makeDefinition(), { maxRetries: 1 });
      const result = coordinator.executeAll(instance.instanceId);
      expect(result.status).toBe('FAILED');
      expect(result.steps[0]!.status).toBe('COMPLETED');
      expect(result.steps[1]!.status).toBe('FAILED');
      expect(result.steps[2]!.status).toBe('PENDING');
    });
  });

  describe('pause and resume', () => {
    it('pauses a running workflow', () => {
      const instance = coordinator.createWorkflow(makeDefinition());
      coordinator.executeNext(instance.instanceId);
      expect(coordinator.pauseWorkflow(instance.instanceId)).toBe(true);
      expect(instance.status).toBe('PAUSED');
    });

    it('resumes a paused workflow', () => {
      const instance = coordinator.createWorkflow(makeDefinition());
      coordinator.executeNext(instance.instanceId);
      coordinator.pauseWorkflow(instance.instanceId);
      expect(coordinator.resumeWorkflow(instance.instanceId)).toBe(true);
      expect(instance.status).toBe('RUNNING');
    });

    it('cannot pause a completed workflow', () => {
      const instance = coordinator.createWorkflow(makeDefinition());
      coordinator.executeAll(instance.instanceId);
      expect(coordinator.pauseWorkflow(instance.instanceId)).toBe(false);
    });

    it('cannot resume a non-paused workflow', () => {
      const instance = coordinator.createWorkflow(makeDefinition());
      expect(coordinator.resumeWorkflow(instance.instanceId)).toBe(false);
    });
  });

  describe('rollback', () => {
    it('rolls back completed steps in reverse order', () => {
      let rollbackOrder: string[] = [];
      coordinator.registerRollback('ext-a', (step) => { rollbackOrder.push(step.stepId); return true; });
      coordinator.registerRollback('ext-b', (step) => { rollbackOrder.push(step.stepId); return true; });

      const instance = coordinator.createWorkflow(makeDefinition());
      coordinator.executeNext(instance.instanceId);
      coordinator.executeNext(instance.instanceId);

      coordinator.rollbackWorkflow(instance.instanceId, 'Test rollback');
      expect(instance.status).toBe('ROLLED_BACK');
      expect(rollbackOrder).toEqual(['step-2', 'step-1']);
      expect(instance.rollbackLog).toHaveLength(2);
      expect(instance.rollbackLog[0].stepId).toBe('step-2');
    });

    it('skips steps without rollback capability', () => {
      coordinator.registerRollback('ext-a', () => true);
      coordinator.registerRollback('ext-c', () => true);

      const def = makeDefinition({
        steps: [
          { stepId: 's1', extensionId: 'ext-a', description: 'A', rollbackCapable: true },
          { stepId: 's2', extensionId: 'ext-c', description: 'C', rollbackCapable: false },
        ],
      });
      const instance = coordinator.createWorkflow(def);
      coordinator.executeAll(instance.instanceId);

      coordinator.rollbackWorkflow(instance.instanceId, 'Selective rollback');
      expect(instance.rollbackLog).toHaveLength(1);
      expect(instance.rollbackLog[0].stepId).toBe('s1');
    });
  });

  describe('checkpoints', () => {
    it('records checkpoints for each executed step', () => {
      const instance = coordinator.createWorkflow(makeDefinition());
      coordinator.executeAll(instance.instanceId);

      const checkpoints = coordinator.getCheckpoints(instance.instanceId);
      expect(checkpoints).toHaveLength(3);
      expect(checkpoints[0]!.extensionContext).toBe('ext-a');
      expect(checkpoints[1]!.extensionContext).toBe('ext-b');
      expect(checkpoints[2]!.extensionContext).toBe('ext-c');
    });

    it('checkpoint contains state snapshot', () => {
      const instance = coordinator.createWorkflow(makeDefinition());
      coordinator.executeNext(instance.instanceId);

      const cp = coordinator.getCheckpoints(instance.instanceId)[0]!;
      expect(cp.sessionId).toBe(instance.sessionId);
      expect(cp.stateSnapshot).toBeDefined();
      expect(cp.timestamp).toBeTruthy();
    });
  });

  describe('query methods', () => {
    it('getWorkflow returns instance by ID', () => {
      const instance = coordinator.createWorkflow(makeDefinition());
      expect(coordinator.getWorkflow(instance.instanceId)).toBe(instance);
    });

    it('getWorkflow returns undefined for unknown ID', () => {
      expect(coordinator.getWorkflow('nonexistent')).toBeUndefined();
    });

    it('getAllWorkflows returns all instances', () => {
      coordinator.createWorkflow(makeDefinition());
      coordinator.createWorkflow(makeDefinition());
      expect(coordinator.getAllWorkflows()).toHaveLength(2);
    });

    it('getWorkflowsByStatus filters correctly', () => {
      const a = coordinator.createWorkflow(makeDefinition());
      const b = coordinator.createWorkflow(makeDefinition());
      coordinator.executeAll(a.instanceId);

      expect(coordinator.getWorkflowsByStatus('COMPLETED')).toHaveLength(1);
      expect(coordinator.getWorkflowsByStatus('PENDING')).toHaveLength(1);
    });
  });

  describe('remediation policy', () => {
    it('returns INFO for completed workflows', () => {
      const instance = coordinator.createWorkflow(makeDefinition());
      coordinator.executeAll(instance.instanceId);

      const policy = coordinator.getRemediationPolicy(instance);
      expect(policy.severity).toBe('INFO');
      expect(policy.requiresHumanApproval).toBe(false);
    });

    it('returns CRITICAL for rolled back workflows', () => {
      coordinator.registerRollback('ext-a', () => true);
      const instance = coordinator.createWorkflow(makeDefinition());
      coordinator.executeNext(instance.instanceId);
      coordinator.rollbackWorkflow(instance.instanceId, 'test');

      const policy = coordinator.getRemediationPolicy(instance);
      expect(policy.severity).toBe('CRITICAL');
      expect(policy.requiresHumanApproval).toBe(true);
    });

    it('returns WARN for failed workflow with retries left', () => {
      coordinator.registerExecutor('ext-a', failExecutor);
      const instance = coordinator.createWorkflow(makeDefinition(), { maxRetries: 5 });
      coordinator.executeNext(instance.instanceId);

      const policy = coordinator.getRemediationPolicy(instance);
      expect(policy.severity).toBe('WARN');
      expect(policy.requiresHumanApproval).toBe(false);
    });

    it('returns CRITICAL for failed workflow with max retries exceeded', () => {
      coordinator.registerExecutor('ext-a', failExecutor);
      const instance = coordinator.createWorkflow(makeDefinition(), { maxRetries: 1 });
      coordinator.executeNext(instance.instanceId);

      const policy = coordinator.getRemediationPolicy(instance);
      expect(policy.severity).toBe('CRITICAL');
      expect(policy.requiresHumanApproval).toBe(true);
    });
  });

  describe('end-to-end workflow', () => {
    it('full lifecycle: create → execute → complete → verify', () => {
      const def: WorkflowDefinition = {
        workflowId: 'e2e-001',
        name: 'End-to-End Test',
        steps: [
          { stepId: 'intake', extensionId: 'ext-a', description: 'Intake', rollbackCapable: true },
          { stepId: 'build', extensionId: 'ext-b', description: 'Build', rollbackCapable: true },
          { stepId: 'review', extensionId: 'ext-c', description: 'Review', rollbackCapable: false },
        ],
      };

      const instance = coordinator.createWorkflow(def);
      expect(instance.status).toBe('PENDING');

      coordinator.executeAll(instance.instanceId);
      expect(instance.status).toBe('COMPLETED');
      expect(instance.steps.every(s => s.status === 'COMPLETED')).toBe(true);
      expect(instance.checkpoints).toHaveLength(3);

      const policy = coordinator.getRemediationPolicy(instance);
      expect(policy.severity).toBe('INFO');
    });

    it('full lifecycle: create → partial execute → fail → rollback', () => {
      coordinator.registerExecutor('ext-b', failExecutor);
      coordinator.registerRollback('ext-a', () => true);

      const instance = coordinator.createWorkflow(makeDefinition(), { maxRetries: 1 });
      coordinator.executeAll(instance.instanceId);
      expect(instance.status).toBe('FAILED');

      coordinator.rollbackWorkflow(instance.instanceId, 'Recovery needed');
      expect(instance.status).toBe('ROLLED_BACK');
      expect(instance.rollbackLog).toHaveLength(1);
      expect(instance.rollbackLog[0]!.stepId).toBe('step-1');
    });
  });
});
