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
  evidence?: Record<string, unknown>;
  rollbackData?: Record<string, unknown>;
  guardResult?: GuardPipelineResult;
  startedAt?: string;
  completedAt?: string;
  error?: string;
  attempts?: number;
}

export interface WorkflowStepResult {
  status: Extract<WorkflowStepStatus, 'COMPLETED' | 'FAILED' | 'SKIPPED'>;
  output?: Record<string, unknown>;
  error?: string;
  evidence?: Record<string, unknown>;
  rollbackData?: Record<string, unknown>;
}

export interface ExtensionActionHandlerContext {
  workflow: CrossExtensionWorkflow;
  step: WorkflowStep;
  extension: ExtensionDescriptor;
  guardResult?: GuardPipelineResult;
}

export type ExtensionActionHandler =
  (context: ExtensionActionHandlerContext) => WorkflowStepResult | Promise<WorkflowStepResult>;

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
  executionLog?: Array<{
    timestamp: string;
    stepId: string;
    event: 'STARTED' | 'COMPLETED' | 'FAILED' | 'SKIPPED' | 'ROLLED_BACK';
    details?: string;
  }>;
}

// --- Extension Bridge ---

export class ExtensionBridge {
  private extensions: Map<string, ExtensionDescriptor> = new Map();
  private workflows: Map<string, CrossExtensionWorkflow> = new Map();
  private handlers: Map<string, ExtensionActionHandler> = new Map();

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

  registerActionHandler(extensionId: string, action: string, handler: ExtensionActionHandler): void {
    this.handlers.set(this.getHandlerKey(extensionId, action), handler);
  }

  getActionHandler(extensionId: string, action: string): ExtensionActionHandler | undefined {
    return this.handlers.get(this.getHandlerKey(extensionId, action))
      ?? this.handlers.get(this.getHandlerKey(extensionId, '*'));
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
      executionLog: [],
    };

    this.workflows.set(config.id, workflow);
    return workflow;
  }

  advanceWorkflow(workflowId: string, guardResult?: GuardPipelineResult): {
    success: boolean;
    step?: WorkflowStep;
    waitingForResult?: boolean;
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

    if (step.status === 'RUNNING') {
      return {
        success: false,
        step,
        waitingForResult: true,
        error: `Step "${step.id}" is already RUNNING. Report a real execution result before advancing.`,
      };
    }

    const ext = this.extensions.get(step.extensionId);

    if (!ext || ext.status === 'OFFLINE') {
      step.status = 'FAILED';
      step.error = `Extension "${step.extensionId}" is ${ext ? ext.status : 'not registered'}.`;
      wf.status = 'FAILED';
      wf.updatedAt = new Date().toISOString();
      this.recordExecutionEvent(wf, step.id, 'FAILED', step.error);
      return { success: false, step, error: step.error };
    }

    if (guardResult && guardResult.finalDecision === 'BLOCK') {
      step.status = 'FAILED';
      step.guardResult = guardResult;
      step.error = `Guard blocked: ${guardResult.blockedBy}`;
      wf.status = 'FAILED';
      wf.updatedAt = new Date().toISOString();
      this.recordExecutionEvent(wf, step.id, 'FAILED', step.error);
      return { success: false, step, error: step.error };
    }

    wf.status = 'RUNNING';
    step.status = 'RUNNING';
    step.startedAt = new Date().toISOString();
    step.attempts = (step.attempts ?? 0) + 1;
    step.guardResult = guardResult;
    wf.updatedAt = step.startedAt;
    this.recordExecutionEvent(wf, step.id, 'STARTED', `Started ${step.action} on extension ${step.extensionId}.`);

    return { success: true, step, waitingForResult: true };
  }

  reportStepResult(workflowId: string, result: WorkflowStepResult): {
    success: boolean;
    step?: WorkflowStep;
    error?: string;
  } {
    const wf = this.workflows.get(workflowId);
    if (!wf) return { success: false, error: `Workflow "${workflowId}" not found.` };

    if (wf.status !== 'RUNNING') {
      return { success: false, error: `Workflow "${workflowId}" is not RUNNING.` };
    }

    const step = wf.steps[wf.currentStepIndex];
    if (!step) {
      return { success: false, error: `Workflow "${workflowId}" has no active step.` };
    }

    if (step.status !== 'RUNNING') {
      return { success: false, error: `Step "${step.id}" is not RUNNING.` };
    }

    const completedAt = new Date().toISOString();
    step.status = result.status;
    step.output = result.output;
    step.evidence = result.evidence;
    step.rollbackData = result.rollbackData;
    step.error = result.error;
    step.completedAt = completedAt;
    wf.updatedAt = completedAt;

    if (result.status === 'FAILED') {
      wf.status = 'FAILED';
      this.recordExecutionEvent(wf, step.id, 'FAILED', result.error ?? `Step "${step.id}" failed.`);
      return { success: false, step, error: step.error ?? `Step "${step.id}" failed.` };
    }

    if (result.status === 'SKIPPED') {
      this.recordExecutionEvent(wf, step.id, 'SKIPPED', `Step "${step.id}" was skipped.`);
    } else {
      this.recordExecutionEvent(wf, step.id, 'COMPLETED', `Step "${step.id}" completed.`);
    }

    wf.currentStepIndex++;

    if (wf.currentStepIndex >= wf.steps.length) {
      wf.status = 'COMPLETED';
      wf.completedAt = completedAt;
      wf.metadata = {
        ...wf.metadata,
        freezeReceipt: {
          completedSteps: wf.steps.filter((s) => s.status === 'COMPLETED').length,
          skippedSteps: wf.steps.filter((s) => s.status === 'SKIPPED').length,
          failedSteps: wf.steps.filter((s) => s.status === 'FAILED').length,
          finalizedAt: completedAt,
        },
      };
    }

    return { success: true, step };
  }

  async executeCurrentStep(
    workflowId: string,
    options?: { guardResult?: GuardPipelineResult },
  ): Promise<{
    success: boolean;
    step?: WorkflowStep;
    waitingForResult?: boolean;
    error?: string;
  }> {
    const start = this.advanceWorkflow(workflowId, options?.guardResult);
    if (!start.success || !start.step || !start.waitingForResult) {
      return start;
    }

    const workflow = this.workflows.get(workflowId);
    const extension = this.extensions.get(start.step.extensionId);
    if (!workflow || !extension) {
      return { success: false, step: start.step, error: `Workflow or extension missing for "${workflowId}".` };
    }

    const handler = this.getActionHandler(start.step.extensionId, start.step.action);
    if (!handler) {
      return start;
    }

    try {
      const result = await handler({
        workflow,
        step: start.step,
        extension,
        guardResult: options?.guardResult,
      });
      const completion = this.reportStepResult(workflowId, result);
      return { ...completion, waitingForResult: false };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const failed = this.reportStepResult(workflowId, {
        status: 'FAILED',
        error: message,
        evidence: { thrownByHandler: true },
      });
      return { success: false, step: failed.step, error: failed.error ?? message, waitingForResult: false };
    }
  }

  async executeWorkflow(
    workflowId: string,
    options?: {
      guardResultProvider?: (step: WorkflowStep, workflow: CrossExtensionWorkflow) => GuardPipelineResult | undefined | Promise<GuardPipelineResult | undefined>;
    },
  ): Promise<{ success: boolean; workflow?: CrossExtensionWorkflow; error?: string }> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) return { success: false, error: `Workflow "${workflowId}" not found.` };

    while (workflow.status !== 'COMPLETED' && workflow.status !== 'FAILED' && workflow.status !== 'ROLLED_BACK') {
      const step = workflow.steps[workflow.currentStepIndex];
      if (!step) break;

      const guardResult = options?.guardResultProvider
        ? await options.guardResultProvider(step, workflow)
        : undefined;

      const execution = await this.executeCurrentStep(workflowId, { guardResult });
      if (!execution.success && !execution.waitingForResult) {
        return { success: false, workflow, error: execution.error };
      }

      if (execution.waitingForResult) {
        return {
          success: false,
          workflow,
          error: `Workflow "${workflowId}" is waiting for a manual result on step "${step.id}".`,
        };
      }
    }

    return {
      success: workflow.status === 'COMPLETED',
      workflow,
      error: workflow.status === 'COMPLETED' ? undefined : `Workflow ended in state ${workflow.status}.`,
    };
  }

  rollbackWorkflow(workflowId: string, reason = 'Manual rollback requested.'): boolean {
    const wf = this.workflows.get(workflowId);
    if (!wf) return false;
    if (wf.status === 'COMPLETED' || wf.status === 'ROLLED_BACK') return false;

    const activeStep = wf.steps[wf.currentStepIndex];
    if (activeStep?.status === 'RUNNING') {
      activeStep.status = 'FAILED';
      activeStep.error = reason;
      activeStep.completedAt = new Date().toISOString();
      this.recordExecutionEvent(wf, activeStep.id, 'FAILED', reason);
    }

    for (let i = wf.currentStepIndex - 1; i >= 0; i--) {
      const step = wf.steps[i]!;
      if (step.status === 'COMPLETED') {
        step.status = 'SKIPPED';
        step.rollbackData = { ...step.rollbackData, rolledBack: true, reason };
        step.output = { ...step.output, rolledBack: true };
        this.recordExecutionEvent(wf, step.id, 'ROLLED_BACK', reason);
      }
    }

    wf.status = 'ROLLED_BACK';
    wf.updatedAt = new Date().toISOString();
    wf.metadata = { ...wf.metadata, rollbackReason: reason };
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

  private recordExecutionEvent(
    workflow: CrossExtensionWorkflow,
    stepId: string,
    event: 'STARTED' | 'COMPLETED' | 'FAILED' | 'SKIPPED' | 'ROLLED_BACK',
    details?: string,
  ): void {
    workflow.executionLog ??= [];
    workflow.executionLog.push({
      timestamp: new Date().toISOString(),
      stepId,
      event,
      details,
    });
  }

  private getHandlerKey(extensionId: string, action: string): string {
    return `${extensionId}::${action}`;
  }
}
