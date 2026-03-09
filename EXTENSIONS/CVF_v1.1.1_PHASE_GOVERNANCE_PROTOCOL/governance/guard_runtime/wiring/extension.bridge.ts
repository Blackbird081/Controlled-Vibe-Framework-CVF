/**
 * Extension Bridge — Track IV Phase B.3
 *
 * Wires the Guard Runtime to other CVF extensions, enabling:
 *   - Cross-extension guard enforcement
 *   - Unified workflow orchestration across extensions
 *   - Extension health monitoring and dependency tracking
 *
 * Supported extensions:
 *   - v1.1.1 Phase Governance Protocol
 *   - v1.9 Deterministic Reproducibility
 *   - v3.0 Core Git for AI
 */

import type { GuardPipelineResult } from '../guard.runtime.types.js';

// --- Extension Descriptor ---

export type ExtensionStatus = 'ACTIVE' | 'DEGRADED' | 'OFFLINE' | 'NOT_REGISTERED';

export interface ExtensionDescriptor {
  id: string;
  name: string;
  version: string;
  status: ExtensionStatus;
  capabilities: string[];
  dependencies: string[];
  registeredAt: string;
  lastHealthCheck?: string;
  healthScore?: number;
}

// --- Workflow Step ---

export type WorkflowStepStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'SKIPPED';

export interface WorkflowStep {
  id: string;
  extensionId: string;
  action: string;
  status: WorkflowStepStatus;
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
  guardResult?: GuardPipelineResult;
  startedAt?: string;
  completedAt?: string;
  error?: string;
}

// --- Cross-Extension Workflow ---

export type CrossWorkflowStatus = 'CREATED' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'ROLLED_BACK';

export interface CrossExtensionWorkflow {
  id: string;
  name: string;
  status: CrossWorkflowStatus;
  steps: WorkflowStep[];
  currentStepIndex: number;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  metadata?: Record<string, unknown>;
}

// --- Extension Bridge ---

export class ExtensionBridge {
  private extensions: Map<string, ExtensionDescriptor> = new Map();
  private workflows: Map<string, CrossExtensionWorkflow> = new Map();

  // --- Extension Registry ---

  registerExtension(descriptor: Omit<ExtensionDescriptor, 'registeredAt' | 'status'>): ExtensionDescriptor {
    if (this.extensions.has(descriptor.id)) {
      throw new Error(`Extension "${descriptor.id}" is already registered.`);
    }

    const missing = descriptor.dependencies.filter((d) => !this.extensions.has(d));
    const status: ExtensionStatus = missing.length > 0 ? 'DEGRADED' : 'ACTIVE';

    const ext: ExtensionDescriptor = {
      ...descriptor,
      status,
      registeredAt: new Date().toISOString(),
    };

    this.extensions.set(ext.id, ext);
    return ext;
  }

  getExtension(extensionId: string): ExtensionDescriptor | undefined {
    return this.extensions.get(extensionId);
  }

  getAllExtensions(): ExtensionDescriptor[] {
    return Array.from(this.extensions.values());
  }

  getExtensionCount(): number {
    return this.extensions.size;
  }

  checkHealth(extensionId: string): ExtensionStatus {
    const ext = this.extensions.get(extensionId);
    if (!ext) return 'NOT_REGISTERED';

    const missingDeps = ext.dependencies.filter((d) => {
      const dep = this.extensions.get(d);
      return !dep || dep.status === 'OFFLINE';
    });

    const now = new Date().toISOString();
    ext.lastHealthCheck = now;

    if (missingDeps.length > 0) {
      ext.status = 'DEGRADED';
      ext.healthScore = Math.max(0, 1 - missingDeps.length / Math.max(ext.dependencies.length, 1));
    } else {
      ext.status = 'ACTIVE';
      ext.healthScore = 1.0;
    }

    return ext.status;
  }

  setExtensionStatus(extensionId: string, status: ExtensionStatus): boolean {
    const ext = this.extensions.get(extensionId);
    if (!ext) return false;
    ext.status = status;
    return true;
  }

  getDependencyGraph(): Map<string, string[]> {
    const graph = new Map<string, string[]>();
    for (const [id, ext] of this.extensions) {
      graph.set(id, [...ext.dependencies]);
    }
    return graph;
  }

  // --- Cross-Extension Workflow ---

  createWorkflow(config: {
    id: string;
    name: string;
    steps: Array<{ extensionId: string; action: string; input?: Record<string, unknown> }>;
    metadata?: Record<string, unknown>;
  }): CrossExtensionWorkflow {
    if (this.workflows.has(config.id)) {
      throw new Error(`Workflow "${config.id}" already exists.`);
    }

    const now = new Date().toISOString();
    const steps: WorkflowStep[] = config.steps.map((s, i) => ({
      id: `${config.id}-step-${i}`,
      extensionId: s.extensionId,
      action: s.action,
      status: 'PENDING' as WorkflowStepStatus,
      input: s.input,
    }));

    const workflow: CrossExtensionWorkflow = {
      id: config.id,
      name: config.name,
      status: 'CREATED',
      steps,
      currentStepIndex: 0,
      createdAt: now,
      updatedAt: now,
      metadata: config.metadata,
    };

    this.workflows.set(config.id, workflow);
    return workflow;
  }

  advanceWorkflow(workflowId: string, guardResult?: GuardPipelineResult): {
    success: boolean;
    step?: WorkflowStep;
    error?: string;
  } {
    const wf = this.workflows.get(workflowId);
    if (!wf) return { success: false, error: `Workflow "${workflowId}" not found.` };

    if (wf.status === 'COMPLETED' || wf.status === 'FAILED' || wf.status === 'ROLLED_BACK') {
      return { success: false, error: `Workflow is in terminal state: ${wf.status}.` };
    }

    if (wf.currentStepIndex >= wf.steps.length) {
      wf.status = 'COMPLETED';
      wf.completedAt = new Date().toISOString();
      wf.updatedAt = wf.completedAt;
      return { success: true };
    }

    const step = wf.steps[wf.currentStepIndex]!;
    const ext = this.extensions.get(step.extensionId);

    if (!ext || ext.status === 'OFFLINE') {
      step.status = 'FAILED';
      step.error = `Extension "${step.extensionId}" is ${ext ? ext.status : 'not registered'}.`;
      wf.status = 'FAILED';
      wf.updatedAt = new Date().toISOString();
      return { success: false, step, error: step.error };
    }

    if (guardResult && guardResult.finalDecision === 'BLOCK') {
      step.status = 'FAILED';
      step.guardResult = guardResult;
      step.error = `Guard blocked: ${guardResult.blockedBy}`;
      wf.status = 'FAILED';
      wf.updatedAt = new Date().toISOString();
      return { success: false, step, error: step.error };
    }

    wf.status = 'RUNNING';
    step.status = 'RUNNING';
    step.startedAt = new Date().toISOString();
    step.guardResult = guardResult;

    // Simulate step completion
    step.status = 'COMPLETED';
    step.completedAt = new Date().toISOString();
    step.output = { result: 'ok', extension: step.extensionId, action: step.action };

    wf.currentStepIndex++;
    wf.updatedAt = step.completedAt;

    if (wf.currentStepIndex >= wf.steps.length) {
      wf.status = 'COMPLETED';
      wf.completedAt = wf.updatedAt;
    }

    return { success: true, step };
  }

  rollbackWorkflow(workflowId: string): boolean {
    const wf = this.workflows.get(workflowId);
    if (!wf) return false;
    if (wf.status === 'COMPLETED' || wf.status === 'ROLLED_BACK') return false;

    for (let i = wf.currentStepIndex - 1; i >= 0; i--) {
      const step = wf.steps[i]!;
      if (step.status === 'COMPLETED') {
        step.status = 'SKIPPED';
        step.output = { ...step.output, rolledBack: true };
      }
    }

    wf.status = 'ROLLED_BACK';
    wf.updatedAt = new Date().toISOString();
    return true;
  }

  getWorkflow(workflowId: string): CrossExtensionWorkflow | undefined {
    return this.workflows.get(workflowId);
  }

  getAllWorkflows(): CrossExtensionWorkflow[] {
    return Array.from(this.workflows.values());
  }

  getWorkflowCount(): number {
    return this.workflows.size;
  }
}
